import { describe, expect, it } from 'vitest'
import {
  getMaterialInputQuantity,
  getOutputQuantityForInput,
  getProcessingRecipeById,
  getRecipeMaxInput,
  getRecipeMinInput,
  getSlotInputAmount,
  PROCESSING_RECIPES
} from './processing'

describe('酒坊（1～3 批批量）', () => {
  const wineIds = PROCESSING_RECIPES.filter(r => r.machineType === 'wine_workshop').map(r => r.id)

  it.each(wineIds)('配方 %s 最多 3 批', id => {
    const recipe = getProcessingRecipeById(id)!
    expect(recipe.machineType).toBe('wine_workshop')
    expect(getRecipeMaxInput(recipe)).toBe(3)
    expect(getRecipeMinInput(recipe)).toBe(1)
  })

  it('西瓜酒 3 批产出 3 瓶', () => {
    const recipe = getProcessingRecipeById('wine_watermelon')!
    expect(getOutputQuantityForInput(recipe, 3)).toBe(3)
    expect(getMaterialInputQuantity(recipe, 3)).toBe(3)
  })

  it('米醋 3 批消耗 6 米产出 3 醋', () => {
    const recipe = getProcessingRecipeById('vinegar_rice')!
    expect(getMaterialInputQuantity(recipe, 3)).toBe(6)
    expect(getOutputQuantityForInput(recipe, 3)).toBe(3)
  })

  it('旧存档酒坊加工缺省 1 批', () => {
    const recipe = getProcessingRecipeById('wine_watermelon')!
    expect(getSlotInputAmount(recipe, {})).toBe(1)
    expect(getSlotInputAmount(recipe, { inputAmount: 2 })).toBe(2)
  })
})
