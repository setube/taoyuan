import { beforeEach, describe, expect, it } from 'vitest'
import { createTestPinia } from '@/test/pinia'
import { useInventoryStore } from '@/stores/useInventoryStore'
import { useWarehouseStore } from '@/stores/useWarehouseStore'
import { useGameStore } from '@/stores/useGameStore'
import {
  getMaterialStockBreakdown,
  getCombinedItemCount,
  hasEnoughMaterial,
  materialsAreSufficient,
  hasGreenhouseFruit
} from './useCombinedInventory'

describe('useCombinedInventory 材料库存', () => {
  beforeEach(() => {
    createTestPinia()
    useGameStore()
  })

  it('合计背包与仓库数量', () => {
    const inv = useInventoryStore()
    const wh = useWarehouseStore()
    wh.unlocked = true
    wh.addChest('wood')
    inv.addItem('wood', 3)
    wh.addItemToChest(wh.chests[0]!.id, 'wood', 7)

    expect(getMaterialStockBreakdown('wood')).toEqual({ inventory: 3, warehouse: 7, total: 10 })
    expect(getCombinedItemCount('wood')).toBe(10)
    expect(hasEnoughMaterial('wood', 10)).toBe(true)
    expect(materialsAreSufficient([{ itemId: 'wood', quantity: 10 }])).toBe(true)
  })

  it('温室果实检测', () => {
    const inv = useInventoryStore()
    inv.addItem('peach', 3, 'normal')
    expect(hasGreenhouseFruit('peach')).toBe(false)
    inv.addItem('peach', 2, 'normal', true)
    expect(hasGreenhouseFruit('peach')).toBe(true)
  })
})
