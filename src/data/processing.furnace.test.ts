import { describe, expect, it } from 'vitest'
import {
  getProcessingRecipeById,
  getRecipeMaxInput,
  getRecipeMinInput,
  getOutputQuantityForInput,
  getSlotInputAmount
} from './processing'

describe('熔炉冶炼（1～5 矿石 1:1 产出）', () => {
  const furnaceIds = ['smelt_copper', 'smelt_iron', 'smelt_gold', 'smelt_iridium'] as const

  it.each(furnaceIds)('配方 %s 单次最多投入 5 个', (id) => {
    const recipe = getProcessingRecipeById(id)!
    expect(recipe.machineType).toBe('furnace')
    expect(getRecipeMinInput(recipe)).toBe(1)
    expect(getRecipeMaxInput(recipe)).toBe(5)
    expect(recipe.inputQuantity).toBe(1)
    expect(recipe.outputQuantity).toBe(1)
  })

  it('投入 N 个矿石产出 N 个金属锭', () => {
    const recipe = getProcessingRecipeById('smelt_copper')!
    expect(getOutputQuantityForInput(recipe, 1)).toBe(1)
    expect(getOutputQuantityForInput(recipe, 3)).toBe(3)
    expect(getOutputQuantityForInput(recipe, 5)).toBe(5)
  })

  it('旧存档熔炉加工中缺省投入数为 5', () => {
    const recipe = getProcessingRecipeById('smelt_iron')!
    expect(getSlotInputAmount(recipe, {})).toBe(5)
    expect(getSlotInputAmount(recipe, { inputAmount: 2 })).toBe(2)
  })
})
