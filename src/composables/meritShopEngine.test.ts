import { describe, it, expect } from 'vitest'
import {
  canPurchaseOffer,
  getOfferMaxPurchases,
  isOfferSoldOut,
  migratePurchasedCatalogIds,
  recordMeritPurchase
} from './meritShopEngine'
import { getMeritBagExpandCost } from '@/data/meritShop'
import type { MeritShopOffer } from '@/types/system'

const baseOffer = (overrides: Partial<MeritShopOffer> = {}): MeritShopOffer => ({
  id: 'test_sta',
  name: '测试',
  description: '',
  cost: 10,
  category: 'stat',
  source: 'catalog',
  buffType: 'permanent',
  effect: { type: 'max_stamina', value: 5 },
  maxPurchases: 3,
  ...overrides
})

describe('meritShopEngine purchase limits', () => {
  it('allows up to maxPurchases redemptions', () => {
    const offer = baseOffer()
    const counts: Record<string, number> = {}
    expect(canPurchaseOffer(offer, 100, counts).ok).toBe(true)
    recordMeritPurchase(offer, counts)
    expect(counts.test_sta).toBe(1)
    expect(isOfferSoldOut(offer, counts)).toBe(false)
    recordMeritPurchase(offer, counts)
    recordMeritPurchase(offer, counts)
    expect(isOfferSoldOut(offer, counts)).toBe(true)
    expect(canPurchaseOffer(offer, 100, counts).ok).toBe(false)
  })

  it('migrates legacy purchasedCatalogIds', () => {
    const counts = migratePurchasedCatalogIds(['stamina_small', 'stamina_small'])
    expect(counts.stamina_small).toBe(2)
  })

  it('once offer defaults to max 1', () => {
    const offer = baseOffer({ once: true, maxPurchases: undefined })
    expect(getOfferMaxPurchases(offer)).toBe(1)
  })

  it('prices bag expand by capacity level', () => {
    expect(getMeritBagExpandCost(24)).toBeGreaterThanOrEqual(8)
    expect(getMeritBagExpandCost(48)).toBeGreaterThan(getMeritBagExpandCost(24))
  })
})
