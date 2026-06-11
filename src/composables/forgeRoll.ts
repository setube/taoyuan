import type { Quality, Weather } from '@/types'
import type { ForgeCategory } from '@/types/forge'
import { AFFIX_QUALITY_MULT, AFFIX_SLOTS, getAffixById, getAffixPool } from '@/data/affixes'
import type { AffixDef } from '@/types/forge'
import { FORGE_WEATHER_QUALITY_DELTA } from '@/data/forgeWeather'
import type { EquipmentEffect } from '@/types'
import { getHatById, getRingById, getShoeById, getWeaponById } from '@/data'

export type ForgeRollRng = () => number

const QUALITY_ORDER: Quality[] = ['normal', 'fine', 'excellent', 'supreme']

export const FORGE_QUALITY_MULT: Record<Quality, number> = {
  normal: 1,
  fine: 1.25,
  excellent: 1.5,
  supreme: 2
}

const SCORE_QUALITY_WEIGHTS: Record<string, [number, number, number, number]> = {
  high: [5, 15, 35, 45],
  mid: [10, 25, 40, 25],
  low: [20, 40, 35, 5],
  poor: [50, 35, 12, 3]
}

const pickQualityFromWeights = (
  weights: [number, number, number, number],
  rng: ForgeRollRng
): Quality => {
  const total = weights.reduce((a, b) => a + b, 0)
  let roll = rng() * total
  for (let i = 0; i < weights.length; i++) {
    roll -= weights[i]!
    if (roll <= 0) return QUALITY_ORDER[i]!
  }
  return 'normal'
}

/** §7.1 打造品质 */
export const rollForgeQuality = (params: {
  forgeScore: number
  forgingLevel: number
  weather: Weather
  /** 额外升档概率（专精等），0.03 = +3% */
  qualityUpgradeBonus?: number
  rng?: ForgeRollRng
}): Quality => {
  const rng = params.rng ?? Math.random
  const band =
    params.forgeScore >= 120 ? 'high' : params.forgeScore >= 70 ? 'mid' : params.forgeScore >= 40 ? 'low' : 'poor'
  const weights: [number, number, number, number] = [...SCORE_QUALITY_WEIGHTS[band]!]

  const levelShift = params.forgingLevel * 0.01
  const weatherShift = FORGE_WEATHER_QUALITY_DELTA[params.weather] ?? 0
  const bonusShift = params.qualityUpgradeBonus ?? 0
  const shift = levelShift + weatherShift + bonusShift

  if (shift !== 0) {
    weights[0] = Math.max(1, weights[0]! - shift * 100)
    weights[3] = weights[3]! + shift * 100
  }

  return pickQualityFromWeights(weights, rng)
}

/** §7.2 武器属性（天气不参与） */
export const rollWeaponStats = (
  defId: string,
  quality: Quality,
  forgingLevel: number
): { rolledAttack: number; rolledCritRate: number } => {
  const def = getWeaponById(defId)
  if (!def) return { rolledAttack: 1, rolledCritRate: 0.02 }
  const mult = FORGE_QUALITY_MULT[quality] * (1 + forgingLevel * 0.02)
  return {
    rolledAttack: Math.max(1, Math.floor(def.attack * mult)),
    rolledCritRate: Math.min(0.5, def.critRate * mult)
  }
}

/** §7.3 配饰 effects 缩放 */
export const rollAccessoryEffects = (
  category: 'hat' | 'shoe' | 'ring',
  defId: string,
  quality: Quality
): EquipmentEffect[] => {
  const def =
    category === 'hat'
      ? getHatById(defId)
      : category === 'shoe'
        ? getShoeById(defId)
        : getRingById(defId)
  if (!def) return []
  const mult = FORGE_QUALITY_MULT[quality]
  return def.effects.map(e => ({
    type: e.type,
    value: e.value < 1 && e.value > 0 ? Math.round(e.value * mult * 1000) / 1000 : Math.floor(e.value * mult)
  }))
}

const rollAffixValue = (affix: AffixDef, quality: Quality, forgingLevel: number): number => {
  const mult = AFFIX_QUALITY_MULT[quality] * (1 + forgingLevel * 0.01)
  if (affix.effect.kind === 'equipment') {
    const v = affix.effect.baseValue
    return v < 1 && v > 0 ? Math.round(v * mult * 1000) / 1000 : Math.round(v * mult)
  }
  if (affix.effect.kind === 'weapon_enchant') {
    return Math.round(mult * 100) / 100
  }
  return Math.round(mult * 100) / 100
}

const weightedPickAffix = (
  pool: AffixDef[],
  exclude: Set<string>,
  rng: ForgeRollRng,
  t4WeightBonus = 0
): AffixDef | null => {
  const candidates = pool.filter(a => !exclude.has(a.id))
  if (candidates.length === 0) return null
  const total = candidates.reduce((s, a) => s + (a.weight + (a.tier === 4 ? t4WeightBonus : 0)), 0)
  let roll = rng() * total
  for (const a of candidates) {
    roll -= a.weight + (a.tier === 4 ? t4WeightBonus : 0)
    if (roll <= 0) return a
  }
  return candidates[candidates.length - 1]!
}

/** §8.4 词条 roll */
export const rollAffixes = (params: {
  category: ForgeCategory
  quality: Quality
  weather: Weather
  forgingLevel: number
  fixedAffixId?: string
  isSetPiece?: boolean
  t4WeightBonus?: number
  setAffixMult?: number
  rng?: ForgeRollRng
}): { id: string; rolledValue: number }[] => {
  const rng = params.rng ?? Math.random
  const pool = getAffixPool({
    category: params.category,
    quality: params.quality,
    weather: params.weather,
    forgingLevel: params.forgingLevel
  })
  const slotCount = AFFIX_SLOTS[params.quality]
  const result: { id: string; rolledValue: number }[] = []
  const used = new Set<string>()

  if (params.isSetPiece && params.fixedAffixId) {
    const fixed = getAffixById(params.fixedAffixId)
    if (fixed) {
      let val = rollAffixValue(fixed, params.quality, params.forgingLevel)
      if (params.setAffixMult && params.setAffixMult !== 1) {
        val = val < 1 && val > 0 ? Math.round(val * params.setAffixMult * 1000) / 1000 : Math.round(val * params.setAffixMult)
      }
      result.push({
        id: fixed.id,
        rolledValue: val
      })
      used.add(fixed.id)
    }
  }

  while (result.length < slotCount) {
    const picked = weightedPickAffix(pool, used, rng, params.t4WeightBonus ?? 0)
    if (!picked) break
    let val = rollAffixValue(picked, params.quality, params.forgingLevel)
    if (params.setAffixMult && params.setAffixMult !== 1) {
      val = val < 1 && val > 0 ? Math.round(val * params.setAffixMult * 1000) / 1000 : Math.round(val * params.setAffixMult)
    }
    result.push({
      id: picked.id,
      rolledValue: val
    })
    used.add(picked.id)
  }

  return result
}

/** 配方 tier → 基础锻造经验（§4.4 加强） */
export const forgeExpForTier = (tier: 1 | 2 | 3 | 4, category: ForgeCategory): number => {
  const base = category === 'weapon' ? [20, 30, 40, 55] : [15, 22, 30, 40]
  return base[tier - 1] ?? 10
}

export const qualityExpBonus = (quality: Quality): number => {
  if (quality === 'fine') return 8
  if (quality === 'excellent') return 18
  if (quality === 'supreme') return 35
  return 0
}

export const scoreExpBonus = (forgeScore: number): number => {
  if (forgeScore >= 120) return 15
  if (forgeScore >= 80) return 8
  return 0
}

export const forgeExpFromCraft = (
  tier: 1 | 2 | 3 | 4,
  category: ForgeCategory,
  quality: Quality,
  forgeScore: number,
  expMult = 1
): number => {
  const base =
    forgeExpForTier(tier, category) + qualityExpBonus(quality) + scoreExpBonus(forgeScore)
  return Math.floor(base * expMult)
}

/** 练习经验（§4.3） */
export const practiceExpFromScore = (
  forgeScore: number,
  practiceExpBonus = 0,
  expMult = 1
): number => {
  const practiceMult = 1 + practiceExpBonus
  let exp = Math.max(5, Math.floor(Math.floor(forgeScore / 5) * practiceMult * expMult))
  if (forgeScore >= 120) exp += 10
  return exp
}
