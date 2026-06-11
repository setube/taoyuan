import { describe, it, expect } from 'vitest'
import {
  meritWishAffinityBlocked,
  priceMoneyGrant,
  meritWishApiToOffer,
  type MeritWishApiResponse
} from './meritWishEngine'

describe('meritWishEngine', () => {
  it('blocks wish when affinity below 20', () => {
    const block = meritWishAffinityBlocked(15)
    expect(block).toContain('系统亲和不足')
    expect(block).toContain('专属定制需 20')
  })

  it('prices money grant', () => {
    const cost = priceMoneyGrant(100000, 30, 5000)
    expect(cost).toBeGreaterThan(10)
  })

  it('converts API wish response to offer', () => {
    const res: MeritWishApiResponse = {
      type: 'wish',
      isWish: true,
      feasible: true,
      reply: '可办',
      offer: {
        name: '灵赐 100000 文',
        description: '兑换后获得铜钱',
        cost: 42,
        buffType: 'permanent',
        effect: { type: 'grant_money', value: 100000 }
      }
    }
    const offer = meritWishApiToOffer(res, '能不能给我100000文钱', 10)
    expect(offer?.effect.type).toBe('grant_money')
    expect(offer?.effect.value).toBe(100000)
    expect(offer?.cost).toBe(42)
  })

  it('returns null offer when not feasible', () => {
    const res: MeritWishApiResponse = {
      type: 'wish',
      isWish: true,
      feasible: false,
      reply: '拒绝'
    }
    expect(meritWishApiToOffer(res, '无限金钱', 1)).toBeNull()
  })
})
