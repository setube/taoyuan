import { describe, expect, it } from 'vitest'
import {
  rollAccessoryEffects,
  rollAffixes,
  rollForgeQuality,
  rollWeaponStats,
  forgeExpFromCraft,
  practiceExpFromScore
} from '@/composables/forgeRoll'

describe('rollForgeQuality', () => {
  it('高分倾向极品', () => {
    const qualities = Array.from({ length: 50 }, () =>
      rollForgeQuality({ forgeScore: 130, forgingLevel: 10, weather: 'sunny', rng: () => 0.99 })
    )
    expect(qualities.filter(q => q === 'supreme').length).toBeGreaterThan(30)
  })

  it('snowy 降档权重', () => {
    const sunny = rollForgeQuality({
      forgeScore: 80,
      forgingLevel: 5,
      weather: 'sunny',
      rng: () => 0.5
    })
    const snowy = rollForgeQuality({
      forgeScore: 80,
      forgingLevel: 5,
      weather: 'snowy',
      rng: () => 0.5
    })
    const sunnyIdx = ['normal', 'fine', 'excellent', 'supreme'].indexOf(sunny)
    const snowyIdx = ['normal', 'fine', 'excellent', 'supreme'].indexOf(snowy)
    expect(sunnyIdx).toBeGreaterThanOrEqual(snowyIdx)
  })
})

describe('rollWeaponStats', () => {
  it('品质与技能提升攻击', () => {
    const normal = rollWeaponStats('copper_sword', 'normal', 1)
    const supreme = rollWeaponStats('copper_sword', 'supreme', 10)
    expect(supreme.rolledAttack).toBeGreaterThan(normal.rolledAttack)
    expect(supreme.rolledCritRate).toBeLessThanOrEqual(0.5)
  })
})

describe('rollAccessoryEffects', () => {
  it('§7.3 品质缩放', () => {
    const fine = rollAccessoryEffects('ring', 'quartz_ring', 'fine')
    const supreme = rollAccessoryEffects('ring', 'quartz_ring', 'supreme')
    expect(supreme[0]!.value).toBeGreaterThan(fine[0]!.value)
  })
})

describe('rollAffixes', () => {
  it('套装固定槽 1 + 极品第二槽', () => {
    const affixes = rollAffixes({
      category: 'ring',
      quality: 'supreme',
      weather: 'sunny',
      forgingLevel: 10,
      fixedAffixId: 't2_mining',
      isSetPiece: true,
      rng: () => 0.1
    })
    expect(affixes[0]!.id).toBe('t2_mining')
    expect(affixes.length).toBe(2)
  })

  it('普通品质仅 1 条 T1', () => {
    const affixes = rollAffixes({
      category: 'ring',
      quality: 'normal',
      weather: 'sunny',
      forgingLevel: 1,
      rng: () => 0.5
    })
    expect(affixes).toHaveLength(1)
  })
})

describe('forgeExpFromCraft', () => {
  it('tier 与品质提升经验', () => {
    const low = forgeExpFromCraft(1, 'ring', 'normal', 50)
    const high = forgeExpFromCraft(3, 'weapon', 'supreme', 130)
    expect(high).toBeGreaterThan(low)
  })
})

describe('practiceExpFromScore', () => {
  it('得分换算经验，高分有加成', () => {
    expect(practiceExpFromScore(0)).toBe(5)
    expect(practiceExpFromScore(100)).toBe(20)
    expect(practiceExpFromScore(130)).toBeGreaterThan(practiceExpFromScore(100))
  })
})
