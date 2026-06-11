import { getAffixById } from '@/data/affixes'
import { rollAccessoryEffects } from '@/composables/forgeRoll'
import { ENCHANTMENTS } from '@/data/weapons'
import type {
  EquipmentEffect,
  EquipmentEffectType,
  ForgeCategory,
  OwnedWeapon,
  Quality
} from '@/types'

export const EQUIPMENT_EFFECT_NAMES: Record<EquipmentEffectType, string> = {
  attack_bonus: '攻击力',
  crit_rate_bonus: '暴击率',
  defense_bonus: '防御',
  vampiric: '吸血',
  max_hp_bonus: '最大HP',
  stamina_reduction: '体力消耗',
  mining_stamina: '采矿体力',
  farming_stamina: '农作体力',
  fishing_stamina: '钓鱼体力',
  crop_quality_bonus: '作物品质',
  crop_growth_bonus: '作物生长',
  fish_quality_bonus: '鱼类品质',
  fishing_calm: '钓鱼稳定',
  sell_price_bonus: '售价加成',
  shop_discount: '商店折扣',
  gift_friendship: '送礼好感',
  monster_drop_bonus: '掉落率',
  exp_bonus: '经验加成',
  treasure_find: '宝箱概率',
  ore_bonus: '矿石加成',
  luck: '幸运',
  travel_speed: '旅行加速',
  foraging_stamina: '采集体力减免',
  forging_exp_bonus: '锻造经验加成'
}

const PERCENTAGE_EFFECTS: Set<EquipmentEffectType> = new Set([
  'crit_rate_bonus',
  'vampiric',
  'stamina_reduction',
  'mining_stamina',
  'farming_stamina',
  'fishing_stamina',
  'crop_quality_bonus',
  'crop_growth_bonus',
  'fish_quality_bonus',
  'fishing_calm',
  'sell_price_bonus',
  'shop_discount',
  'gift_friendship',
  'monster_drop_bonus',
  'exp_bonus',
  'treasure_find',
  'ore_bonus',
  'luck',
  'travel_speed',
  'defense_bonus',
  'foraging_stamina',
  'forging_exp_bonus'
])

export const formatEquipmentEffectValue = (type: EquipmentEffectType, value: number): string => {
  if (PERCENTAGE_EFFECTS.has(type)) return `+${Math.round(value * 100)}%`
  return `+${value}`
}

export interface EffectDisplayLine {
  label: string
  value: string
}

export interface AffixDisplayDetail {
  id: string
  name: string
  lines: EffectDisplayLine[]
}

export const getAffixDisplayDetail = (inst: { id: string; rolledValue: number }): AffixDisplayDetail => {
  const def = getAffixById(inst.id)
  if (!def) {
    return { id: inst.id, name: inst.id, lines: [{ label: '未知词条', value: '?' }] }
  }

  const lines: EffectDisplayLine[] = []
  const { effect } = def

  if (effect.kind === 'equipment') {
    lines.push({
      label: EQUIPMENT_EFFECT_NAMES[effect.type] ?? effect.type,
      value: formatEquipmentEffectValue(effect.type, inst.rolledValue)
    })
  } else if (effect.kind === 'multi') {
    for (const sub of effect.effects) {
      const v =
        sub.baseValue > 0 && sub.baseValue < 1
          ? sub.baseValue * inst.rolledValue
          : Math.round(sub.baseValue * inst.rolledValue)
      lines.push({
        label: EQUIPMENT_EFFECT_NAMES[sub.type] ?? sub.type,
        value: formatEquipmentEffectValue(sub.type, v)
      })
    }
  } else if (effect.kind === 'weapon_enchant') {
    const enc = ENCHANTMENTS[effect.enchantId]
    if (enc?.attackBonus) {
      lines.push({
        label: '攻击力',
        value: formatEquipmentEffectValue('attack_bonus', enc.attackBonus * inst.rolledValue)
      })
    }
    if (enc?.critBonus) {
      lines.push({
        label: '暴击率',
        value: formatEquipmentEffectValue('crit_rate_bonus', enc.critBonus * inst.rolledValue)
      })
    }
    if (lines.length === 0) {
      lines.push({ label: '附魔', value: enc?.name ?? effect.enchantId })
    }
  }

  return { id: inst.id, name: def.name, lines }
}

export const QUALITY_RANK: Record<Quality, number> = {
  normal: 0,
  fine: 1,
  excellent: 2,
  supreme: 3
}

type CraftedPiece = {
  defId: string
  quality?: Quality
  affixes?: { id: string; rolledValue: number }[]
  rolledAttack?: number
  rolledCritRate?: number
}

export const getCraftedBaseLines = (category: ForgeCategory, piece: CraftedPiece): EffectDisplayLine[] => {
  if (category === 'weapon') {
    const lines: EffectDisplayLine[] = []
    if (piece.rolledAttack != null) lines.push({ label: '攻击力', value: `${piece.rolledAttack}` })
    if (piece.rolledCritRate != null) {
      lines.push({ label: '暴击率', value: `${Math.round(piece.rolledCritRate * 100)}%` })
    }
    return lines
  }
  if (!piece.quality) return []
  const cat = category === 'ring' || category === 'hat' || category === 'shoe' ? category : null
  if (!cat) return []
  return rollAccessoryEffects(cat, piece.defId, piece.quality).map(e => ({
    label: EQUIPMENT_EFFECT_NAMES[e.type] ?? e.type,
    value: formatEquipmentEffectValue(e.type, e.value)
  }))
}

const addEffect = (totals: Map<EquipmentEffectType, number>, type: EquipmentEffectType, value: number) => {
  totals.set(type, (totals.get(type) ?? 0) + value)
}

/** 解析打造词条为效果加成 */
export const getAffixEffectTotals = (
  affixes?: { id: string; rolledValue: number }[]
): Map<EquipmentEffectType, number> => {
  const totals = new Map<EquipmentEffectType, number>()
  if (!affixes) return totals

  for (const inst of affixes) {
    const def = getAffixById(inst.id)
    if (!def) continue
    const { effect } = def
    if (effect.kind === 'equipment') {
      addEffect(totals, effect.type, inst.rolledValue)
    } else if (effect.kind === 'multi') {
      for (const sub of effect.effects) {
        const v =
          sub.baseValue > 0 && sub.baseValue < 1
            ? sub.baseValue * inst.rolledValue
            : Math.round(sub.baseValue * inst.rolledValue)
        addEffect(totals, sub.type, v)
      }
    } else if (effect.kind === 'weapon_enchant') {
      const enc = ENCHANTMENTS[effect.enchantId]
      if (!enc) continue
      if (enc.attackBonus) addEffect(totals, 'attack_bonus', enc.attackBonus * inst.rolledValue)
      if (enc.critBonus) addEffect(totals, 'crit_rate_bonus', enc.critBonus * inst.rolledValue)
    }
  }
  return totals
}

/** 打造配饰的有效 effects（底材×品质 + 词条） */
export const getCraftedAccessoryEffects = (
  category: 'ring' | 'hat' | 'shoe',
  piece: CraftedPiece
): EquipmentEffect[] => {
  const totals = new Map<EquipmentEffectType, number>()
  if (piece.quality) {
    for (const eff of rollAccessoryEffects(category, piece.defId, piece.quality)) {
      addEffect(totals, eff.type, eff.value)
    }
  }
  for (const [type, value] of getAffixEffectTotals(piece.affixes)) {
    addEffect(totals, type, value)
  }
  return [...totals.entries()].map(([type, value]) => ({ type, value }))
}

/** 打造武器词条对攻/暴的加成 */
export const getCraftedWeaponStatBonus = (weapon: OwnedWeapon): { attack: number; critRate: number } => {
  const affixes = getAffixEffectTotals(weapon.affixes)
  return {
    attack: affixes.get('attack_bonus') ?? 0,
    critRate: affixes.get('crit_rate_bonus') ?? 0
  }
}

export const isCraftedPiece = (piece: CraftedPiece): piece is CraftedPiece & { quality: Quality } =>
  piece.quality != null

export const pieceMatchesSet = (
  defId: string,
  setId: string | null | undefined,
  setPieceDefId: string,
  targetSetId: string
): boolean => setId === targetSetId || defId === setPieceDefId
