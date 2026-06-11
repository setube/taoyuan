import { getItemById } from '@/data/items'

/** 功勋许愿 / AI 定制上架允许的效果类型 */
export const MERIT_WISH_ALLOWED_EFFECT_TYPES = [
  'grant_money',
  'grant_item',
  'max_stamina',
  'max_hp',
  'expand_bag',
  'sell_price_bonus',
  'crop_yield',
  'crop_growth',
  'stamina_cost_reduction',
  'fishing_rate',
  'fish_rare',
  'ore_drop',
  'mine_damage_reduction',
  'skill_exp',
  'livestock_freq',
  'tavern_guests'
] as const

export type MeritWishEffectType = (typeof MERIT_WISH_ALLOWED_EFFECT_TYPES)[number]

export function isAllowedWishEffectType(type: string): type is MeritWishEffectType {
  return (MERIT_WISH_ALLOWED_EFFECT_TYPES as readonly string[]).includes(type)
}

/** 许愿发放物品：须为游戏内已实装物品 */
export function isAllowedWishItemId(itemId: string): boolean {
  return !!getItemById(itemId)
}

/** 专属定制 / 功勋许愿最低系统亲和度 */
export const MERIT_WISH_MIN_AFFINITY = 20

/** 属性类许愿（HP/体力上限）在专属定制栏最多兑换次数 */
export const MERIT_WISH_STAT_MAX_PURCHASES = 3

/** 单次许愿发放物品数量上限 */
export const MERIT_WISH_ITEM_MAX_QUANTITY = 99

/** 发放物品功勋定价：参考基础售价，最低 3 功勋 */
export function priceGrantItem(itemId: string, quantity: number): number {
  const def = getItemById(itemId)
  if (!def) return 999
  const q = Math.max(1, Math.min(MERIT_WISH_ITEM_MAX_QUANTITY, Math.floor(quantity)))
  const unit = Math.max(def.sellPrice, 10)
  return Math.max(3, Math.ceil((unit * q) / 8))
}
