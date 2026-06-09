import { describe, expect, it } from 'vitest'
import {
  applyBuffChefEffect,
  getVendorChefSellMult,
  pickLargestIngredient,
  rollCookingLevelUpgrade,
  rollDoubleBatch,
  rollGourmetCraft,
  rollPrepCookSave,
  upgradeQualityOneTier
} from './cookingPerks'

describe('cookingPerks', () => {
  it('市厨售价倍率', () => {
    expect(getVendorChefSellMult('vendor_chef')).toBe(1.15)
    expect(getVendorChefSellMult(null)).toBe(1)
  })

  it('备料手/双灶/匠心概率边界', () => {
    expect(rollPrepCookSave(0)).toBe(true)
    expect(rollPrepCookSave(0.19)).toBe(true)
    expect(rollPrepCookSave(0.2)).toBe(false)
    expect(rollDoubleBatch(0.14)).toBe(true)
    expect(rollGourmetCraft(0.24)).toBe(true)
  })

  it('烹饪等级升档概率：每级 2%', () => {
    // Lv5 = 10%
    expect(rollCookingLevelUpgrade(5, 0.09)).toBe(true)
    expect(rollCookingLevelUpgrade(5, 0.10)).toBe(false)
    // Lv10 = 20%
    expect(rollCookingLevelUpgrade(10, 0.19)).toBe(true)
    expect(rollCookingLevelUpgrade(10, 0.20)).toBe(false)
    // Lv0 = 0%
    expect(rollCookingLevelUpgrade(0, 0)).toBe(false)
  })

  it('pickLargestIngredient', () => {
    expect(pickLargestIngredient([{ itemId: 'a', quantity: 1 }, { itemId: 'b', quantity: 3 }])).toBe('b')
  })

  it('upgradeQualityOneTier 上限极品', () => {
    expect(upgradeQualityOneTier('normal')).toBe('fine')
    expect(upgradeQualityOneTier('supreme')).toBe('supreme')
  })

  it('膳修 buff +30%', () => {
    expect(applyBuffChefEffect(10, 'buff_chef')).toBe(13)
    expect(applyBuffChefEffect(10, null)).toBe(10)
  })
})
