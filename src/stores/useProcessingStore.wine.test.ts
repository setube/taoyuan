import { beforeEach, describe, expect, it } from 'vitest'
import { createTestPinia } from '@/test/pinia'
import { useProcessingStore } from './useProcessingStore'
import { useInventoryStore } from './useInventoryStore'
import { useGameStore } from './useGameStore'
import { getOutputQuantityForInput, getProcessingRecipeById, getSlotInputAmount } from '@/data/processing'

function addWineWorkshop() {
  const proc = useProcessingStore()
  proc.machines.push({
    machineType: 'wine_workshop',
    recipeId: null,
    inputItemId: null,
    daysProcessed: 0,
    totalDays: 0,
    ready: false
  })
  return proc
}

describe('useProcessingStore 酒坊批量投入', () => {
  beforeEach(() => {
    createTestPinia()
    useGameStore()
  })

  it('startProcessing 西瓜酒 3 批记录 inputAmount 并扣 3 个西瓜', () => {
    const proc = addWineWorkshop()
    const inv = useInventoryStore()
    inv.addItem('watermelon', 10)

    expect(proc.startProcessing(0, 'wine_watermelon', undefined, 3)).toBe(true)
    expect(proc.machines[0]!.inputAmount).toBe(3)
    expect(inv.getItemCount('watermelon')).toBe(7)
  })

  it('原料不足时拒绝超量批数', () => {
    const proc = addWineWorkshop()
    const inv = useInventoryStore()
    inv.addItem('watermelon', 2)

    expect(proc.startProcessing(0, 'wine_watermelon', undefined, 99)).toBe(false)
    expect(proc.machines[0]!.recipeId).toBeNull()
  })

  it('米醋 3 批消耗 6 米', () => {
    const proc = addWineWorkshop()
    const inv = useInventoryStore()
    inv.addItem('rice', 10)

    expect(proc.startProcessing(0, 'vinegar_rice', undefined, 3)).toBe(true)
    expect(proc.machines[0]!.inputAmount).toBe(3)
    expect(inv.getItemCount('rice')).toBe(4)
  })

  it('收取 3 批西瓜酒产出 3 瓶', () => {
    const proc = addWineWorkshop()
    const inv = useInventoryStore()
    inv.addItem('watermelon', 3)
    proc.startProcessing(0, 'wine_watermelon', undefined, 3)

    const slot = proc.machines[0]!
    slot.daysProcessed = slot.totalDays
    slot.ready = true

    const recipe = getProcessingRecipeById('wine_watermelon')!
    expect(getSlotInputAmount(recipe, slot)).toBe(3)
    expect(getOutputQuantityForInput(recipe, getSlotInputAmount(recipe, slot))).toBe(3)

    const outId = proc.collectProduct(0)
    expect(outId).toBe('watermelon_wine')
    expect(inv.getItemCount('watermelon_wine')).toBe(3)
    expect(slot.recipeId).toBeNull()
    expect(slot.inputAmount).toBeUndefined()
  })

  it('旧存档酒坊加工中缺省 inputAmount 按 1 批收取', () => {
    const proc = addWineWorkshop()
    const inv = useInventoryStore()
    proc.deserialize({
      machines: [
        {
          machineType: 'wine_workshop',
          recipeId: 'wine_watermelon',
          inputItemId: 'watermelon',
          daysProcessed: 3,
          totalDays: 3,
          ready: true
        }
      ],
      workshopLevel: 0,
      collapsedGroups: []
    })

    const recipe = getProcessingRecipeById('wine_watermelon')!
    const slot = proc.machines[0]!
    expect(getSlotInputAmount(recipe, slot)).toBe(1)

    proc.collectProduct(0)
    expect(inv.getItemCount('watermelon_wine')).toBe(1)
  })
})
