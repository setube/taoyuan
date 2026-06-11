import { describe, expect, it } from 'vitest'
import { getNewNpcForgeBlueprintGifts, npcForgeGiftKey } from './forgeNpcGifts'

describe('forgeNpcGifts', () => {
  it('孙铁匠相识跨越赠送铜匠入门包', () => {
    const gifts = getNewNpcForgeBlueprintGifts('sun_tiejiang', 480, 520, [])
    expect(gifts).toContain('bp_gift_copper_pack')
  })

  it('已领取不再重复赠送', () => {
    const key = npcForgeGiftKey('sun_tiejiang', 'acquaintance')
    const gifts = getNewNpcForgeBlueprintGifts('sun_tiejiang', 480, 520, [key])
    expect(gifts).toHaveLength(0)
  })
})
