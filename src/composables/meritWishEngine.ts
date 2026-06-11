import type { MeritShopOffer } from '@/types/system'
import { createId } from '@/utils/id'
import {
  MERIT_WISH_MIN_AFFINITY,
  MERIT_WISH_ITEM_MAX_QUANTITY,
  isAllowedWishEffectType,
  isAllowedWishItemId
} from '@/data/meritWishAllowed'

export function meritWishAffinityBlocked(affinity: number): string | null {
  if (affinity >= MERIT_WISH_MIN_AFFINITY) return null
  return `系统亲和不足（专属定制需 ${MERIT_WISH_MIN_AFFINITY}，当前 ${affinity}/100；与村民好感度无关）。多和系统聊天、打开系统面板或完成任务可提升。`
}

/** 金钱一次性发放定价（内部公式，玩家不可见） */
export function priceMoneyGrant(amount: number, currentDay: number, currentMoney: number): number {
  const ratio = amount / Math.max(currentMoney + 5000, 1000)
  const base = Math.ceil(Math.pow(amount / 500, 0.72) * 6)
  const dayScale = 1 + currentDay / 400
  const ratioPenalty = Math.ceil(ratio * 12)
  return Math.max(10, Math.ceil((base + ratioPenalty) * dayScale))
}

/** 永久 buff 定价参考 */
export function pricePermanentBuff(effectType: string, value: number): number {
  const table: Record<string, number> = {
    sell_price_bonus: 80 * (value / 0.05),
    crop_yield: 60 * (value / 0.1),
    stamina_cost_reduction: 50 * (value / 0.05),
    skill_exp: 40 * (value / 0.05),
    fishing_rate: 50 * (value / 0.05),
    fish_rare: 50 * (value / 0.05),
    ore_drop: 55 * (value / 0.1),
    tavern_guests: 35 * (value / 1),
    npc_friendship: 45 * (value / 0.1),
    max_stamina: 3 * value,
    max_hp: 2.5 * value
  }
  return Math.max(8, Math.ceil(table[effectType] ?? value * 50))
}

export function priceTimedBuff(permanentPrice: number, days: number): number {
  return Math.max(3, Math.ceil(permanentPrice * (days / 100)))
}

function buildOffer(
  name: string,
  description: string,
  cost: number,
  effect: MeritShopOffer['effect'],
  opts: Partial<MeritShopOffer> = {}
): MeritShopOffer | null {
  if (!isAllowedWishEffectType(effect.type)) return null
  if (effect.type === 'grant_item') {
    if (!effect.itemId || !isAllowedWishItemId(effect.itemId)) return null
    const qty = Math.max(1, Math.min(MERIT_WISH_ITEM_MAX_QUANTITY, effect.quantity ?? 1))
    effect.quantity = qty
  }
  return {
    id: createId(),
    name,
    description,
    cost,
    category: 'custom',
    source: 'wish',
    buffType: opts.buffType ?? 'permanent',
    durationDays: opts.durationDays,
    effect,
    maxPurchases: opts.maxPurchases,
    once: opts.once,
    createdDay: opts.createdDay,
    wishPrompt: opts.wishPrompt,
    purchased: false
  }
}

export interface MeritWishApiResponse {
  type?: 'wish'
  isWish?: boolean
  feasible: boolean
  reply: string
  offer?: {
    name: string
    description: string
    cost: number
    buffType: 'permanent' | 'timed'
    durationDays?: number
    once?: boolean
    maxPurchases?: number
    effect: { type: string; value: number; itemId?: string; quantity?: number }
  }
}

export function meritWishApiToOffer(res: MeritWishApiResponse, input: string, createdDay: number): MeritShopOffer | null {
  if (!res.feasible || !res.offer) return null
  return buildOffer(
    res.offer.name,
    res.offer.description,
    res.offer.cost,
    res.offer.effect,
    {
      buffType: res.offer.buffType,
      durationDays: res.offer.durationDays,
      once: res.offer.once,
      maxPurchases: res.offer.maxPurchases,
      wishPrompt: input,
      createdDay
    }
  )
}
