import { beforeEach, describe, expect, it } from 'vitest'
import { createTestPinia } from '@/test/pinia'
import { useShopStore } from './useShopStore'
import { useGameStore } from './useGameStore'
import { useInventoryStore } from './useInventoryStore'
import { usePlayerStore } from './usePlayerStore'
import { HAY_PRICE } from '@/data/animals'

describe('商圈原材料代购', () => {
  beforeEach(() => {
    createTestPinia()
    useGameStore()
  })

  it('材料不足且营业商铺有货时可计算代购报价', () => {
    const game = useGameStore()
    game.$patch({ year: 1, season: 'spring', day: 1, hour: 10, weather: 'sunny' })

    const shop = useShopStore()
    const offer = shop.computeMaterialBundle([{ itemId: 'hay', quantity: 3 }])
    expect(offer).not.toBeNull()
    expect(offer!.missingPurchases).toHaveLength(1)
    expect(offer!.missingPurchases[0]!.itemId).toBe('hay')
    expect(offer!.missingPurchases[0]!.quantity).toBe(3)
    expect(offer!.missingPurchases[0]!.shopId).toBe('wanwupu')
    expect(offer!.materialCost).toBe(HAY_PRICE * 3)
  })

  it('背包已有足够材料时不提供代购', () => {
    const game = useGameStore()
    game.$patch({ year: 1, season: 'spring', day: 1, hour: 10, weather: 'sunny' })
    useInventoryStore().addItem('hay', 5)

    const shop = useShopStore()
    expect(shop.computeMaterialBundle([{ itemId: 'hay', quantity: 3 }])).toBeNull()
  })

  it('executeMaterialBundlePurchase 扣款并入袋后执行 complete', () => {
    const game = useGameStore()
    game.$patch({ year: 1, season: 'spring', day: 1, hour: 10, weather: 'sunny' })
    const player = usePlayerStore()
    player.money = 1000

    const shop = useShopStore()
    const inv = useInventoryStore()
    const r = shop.executeMaterialBundlePurchase([{ itemId: 'hay', quantity: 2 }], 0, () => true)
    expect(r.success).toBe(true)
    expect(inv.getItemCount('hay')).toBe(2)
    expect(player.money).toBe(1000 - HAY_PRICE * 2)
  })
})
