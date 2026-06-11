import { beforeEach, describe, expect, it } from 'vitest'
import { createTestPinia } from '@/test/pinia'
import { useInventoryStore } from './useInventoryStore'
import { useSettingsStore } from './useSettingsStore'
import { useShopStore } from './useShopStore'
import { useWarehouseStore } from './useWarehouseStore'
import { useGameStore } from './useGameStore'

describe('useInventoryStore collect route', () => {
  beforeEach(() => {
    createTestPinia()
    useGameStore()
  })

  it('默认路由：物品进入背包', () => {
    const inv = useInventoryStore()
    expect(inv.addItem('hay', 3)).toBe(true)
    expect(inv.getItemCount('hay')).toBe(3)
  })

  it('出货箱路由：收集后直接进出货箱，不占背包', () => {
    const settings = useSettingsStore()
    const inv = useInventoryStore()
    const shop = useShopStore()

    settings.setItemCollectRoute('hay', 'shipping')
    expect(inv.addItem('hay', 2)).toBe(true)

    expect(inv.getItemCount('hay')).toBe(0)
    expect(shop.shippingBox).toEqual([{ itemId: 'hay', quantity: 2, quality: 'normal' }])
  })

  it('仓库路由：收集后直接进仓库，不占背包', () => {
    const settings = useSettingsStore()
    const inv = useInventoryStore()
    const wh = useWarehouseStore()

    wh.unlocked = true
    wh.addChest('wood')
    settings.setItemCollectRoute('hay', 'warehouse')

    expect(inv.addItem('hay', 4)).toBe(true)
    expect(inv.getItemCount('hay')).toBe(0)
    expect(wh.getChestItemCount(wh.chests[0]!.id, 'hay')).toBe(4)
  })

  it('仓库未解锁时回退到背包', () => {
    const settings = useSettingsStore()
    const inv = useInventoryStore()
    const wh = useWarehouseStore()

    settings.setItemCollectRoute('hay', 'warehouse')
    expect(wh.unlocked).toBe(false)
    expect(inv.addItem('hay', 1)).toBe(true)
    expect(inv.getItemCount('hay')).toBe(1)
  })
})
