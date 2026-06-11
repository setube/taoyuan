import type { FriendshipLevel } from '@/types'

const LEVEL_MIN: Record<FriendshipLevel, number> = {
  stranger: 0,
  acquaintance: 500,
  friendly: 1000,
  bestFriend: 2000
}

export interface NpcBlueprintGift {
  npcId: string
  level: FriendshipLevel
  blueprintIds: string[]
}

/** §9.10～§9.15 NPC 好感图纸赠送 */
export const NPC_FORGE_BLUEPRINT_GIFTS: NpcBlueprintGift[] = [
  { npcId: 'sun_tiejiang', level: 'acquaintance', blueprintIds: ['bp_gift_copper_pack'] },
  {
    npcId: 'sun_tiejiang',
    level: 'friendly',
    blueprintIds: ['bp_gift_iron_weapon', 'bp_gift_miner_set_partial']
  },
  { npcId: 'sun_tiejiang', level: 'bestFriend', blueprintIds: ['bp_gift_master_smith_set'] },

  { npcId: 'a_tie', level: 'acquaintance', blueprintIds: ['bp_a_tie_practice_ring'] },
  { npcId: 'a_tie', level: 'friendly', blueprintIds: ['bp_a_tie_fine_rings'] },

  { npcId: 'lin_lao', level: 'friendly', blueprintIds: ['bp_lin_forager_set'] },
  { npcId: 'yun_fei', level: 'friendly', blueprintIds: ['bp_yun_escort_set'] },
  { npcId: 'a_shi', level: 'friendly', blueprintIds: ['bp_shi_furnace_set'] },
  { npcId: 'qiu_yue', level: 'friendly', blueprintIds: ['bp_fisher_partial'] }
]

export const npcForgeGiftKey = (npcId: string, level: FriendshipLevel): string =>
  `${npcId}:${level}`

/** 好感跨越阈值时返回应赠送的图纸 id（不含已领取） */
export const getNewNpcForgeBlueprintGifts = (
  npcId: string,
  beforeFriendship: number,
  afterFriendship: number,
  claimedKeys: string[]
): string[] => {
  const result: string[] = []
  for (const gift of NPC_FORGE_BLUEPRINT_GIFTS) {
    if (gift.npcId !== npcId) continue
    const min = LEVEL_MIN[gift.level]
    if (beforeFriendship < min && afterFriendship >= min) {
      const key = npcForgeGiftKey(npcId, gift.level)
      if (!claimedKeys.includes(key)) {
        result.push(...gift.blueprintIds)
      }
    }
  }
  return result
}
