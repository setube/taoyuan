import type { MeritBuffType } from '@/types/system'



export type MeritShopCategory = 'stat' | 'buff' | 'timed' | 'item' | 'custom'



export interface MeritCatalogItem {

  id: string

  name: string

  description: string

  cost: number

  category: MeritShopCategory

  buffType: MeritBuffType

  durationDays?: number

  effect: { type: string; value: number; itemId?: string; quantity?: number }

  /** @deprecated 使用 maxPurchases；永久类默认仅 1 次 */

  once?: boolean

  /** 最大可兑换次数；未设且 once 为 true 时视为 1 次 */

  maxPurchases?: number

}



export const MERIT_CATALOG: MeritCatalogItem[] = [

  { id: 'stamina_small', name: '体力微增', description: '永久体力上限 +5（最多兑换 3 次）', cost: 15, category: 'stat', buffType: 'permanent', maxPurchases: 3, effect: { type: 'max_stamina', value: 5 } },

  { id: 'stamina_medium', name: '体力增进', description: '永久体力上限 +10（最多兑换 3 次）', cost: 30, category: 'stat', buffType: 'permanent', maxPurchases: 3, effect: { type: 'max_stamina', value: 10 } },

  { id: 'stamina_strong', name: '体魄强健', description: '永久体力上限 +20（最多兑换 3 次）', cost: 100, category: 'stat', buffType: 'permanent', maxPurchases: 3, effect: { type: 'max_stamina', value: 20 } },

  { id: 'hp_small', name: '生机微增', description: '永久生命上限 +10（最多兑换 3 次）', cost: 25, category: 'stat', buffType: 'permanent', maxPurchases: 3, effect: { type: 'max_hp', value: 10 } },

  { id: 'hp_medium', name: '生机增进', description: '永久生命上限 +20（最多兑换 3 次）', cost: 70, category: 'stat', buffType: 'permanent', maxPurchases: 3, effect: { type: 'max_hp', value: 20 } },

  { id: 'bag_expand', name: '背包扩容', description: '背包容量 +4 格（可多次兑换至满级）', cost: 0, category: 'item', buffType: 'permanent', effect: { type: 'expand_bag', value: 4 } },

  { id: 'clever_hands', name: '巧手', description: '农耕/采集体力消耗 −5%（永久）', cost: 20, category: 'stat', buffType: 'permanent', once: true, effect: { type: 'stamina_cost_reduction', value: 0.05 } },

  { id: 'keen_eye', name: '慧眼', description: '钓鱼上钩率 +8%（永久）', cost: 20, category: 'stat', buffType: 'permanent', once: true, effect: { type: 'fishing_rate', value: 0.08 } },

  { id: 'iron_bone', name: '铁骨', description: '矿洞受伤减免 10%（永久）', cost: 25, category: 'stat', buffType: 'permanent', once: true, effect: { type: 'mine_damage_reduction', value: 0.1 } },

  { id: 'fortune', name: '财运亨通', description: '出售价格 +5%（永久）', cost: 80, category: 'buff', buffType: 'permanent', once: true, effect: { type: 'sell_price_bonus', value: 0.05 } },

  { id: 'fortune_extreme', name: '财运亨通·极', description: '出售价格 +10%（永久）', cost: 180, category: 'buff', buffType: 'permanent', once: true, effect: { type: 'sell_price_bonus', value: 0.1 } },

  { id: 'harvest', name: '丰穰之力', description: '作物收获量 +10%（永久）', cost: 60, category: 'buff', buffType: 'permanent', once: true, effect: { type: 'crop_yield', value: 0.1 } },

  { id: 'livestock', name: '畜牧之心', description: '动物产出频率 +15%（永久）', cost: 50, category: 'buff', buffType: 'permanent', once: true, effect: { type: 'livestock_freq', value: 0.15 } },

  { id: 'fishing_luck', name: '渔运亨通', description: '钓鱼上钩率 +15%（永久）', cost: 70, category: 'buff', buffType: 'permanent', once: true, effect: { type: 'fishing_rate', value: 0.15 } },

  { id: 'mine_luck', name: '矿脉眷顾', description: '矿洞矿石掉落 +15%（永久）', cost: 75, category: 'buff', buffType: 'permanent', once: true, effect: { type: 'ore_drop', value: 0.15 } },

  { id: 'tavern_fame', name: '酒肆盛名', description: '酒肆基础来客 +2（永久）', cost: 60, category: 'buff', buffType: 'permanent', once: true, effect: { type: 'tavern_guests', value: 2 } },

  { id: 'bless_harvest', name: '丰收祝福', description: '作物生长速度 +15%（7 天）', cost: 8, category: 'timed', buffType: 'timed', durationDays: 7, effect: { type: 'crop_growth', value: 0.15 } },

  { id: 'bless_mine', name: '矿脉感应', description: '矿洞掉落率 +20%（7 天）', cost: 10, category: 'timed', buffType: 'timed', durationDays: 7, effect: { type: 'ore_drop', value: 0.2 } },

  { id: 'bless_fish', name: '时运亨通', description: '钓鱼稀有率 +25%（7 天）', cost: 12, category: 'timed', buffType: 'timed', durationDays: 7, effect: { type: 'fish_rare', value: 0.25 } },

  { id: 'bless_exp', name: '双倍经验', description: '技能经验 +50%（3 天）', cost: 20, category: 'timed', buffType: 'timed', durationDays: 3, effect: { type: 'skill_exp', value: 0.5 } },

  { id: 'bless_fortune', name: '财运加护', description: '出售价格 +15%（7 天）', cost: 25, category: 'timed', buffType: 'timed', durationDays: 7, effect: { type: 'sell_price_bonus', value: 0.15 } },

  { id: 'ancient_seed', name: '远古种子', description: '获得远古种子 ×1', cost: 12, category: 'item', buffType: 'permanent', effect: { type: 'grant_item', value: 1, itemId: 'ancient_seed', quantity: 1 } },

  { id: 'prismatic_pack', name: '五彩碎片', description: '获得五彩碎片 ×1', cost: 25, category: 'item', buffType: 'permanent', effect: { type: 'grant_item', value: 1, itemId: 'prismatic_shard', quantity: 1 } },

  { id: 'mini_spirit_peach', name: '灵桃', description: '永久体力上限 +5（最多兑换 3 次）', cost: 25, category: 'item', buffType: 'permanent', maxPurchases: 3, effect: { type: 'max_stamina', value: 5 } }

]



export function getMeritCatalogItem(id: string): MeritCatalogItem | undefined {

  return MERIT_CATALOG.find(i => i.id === id)

}



/** 功勋商店背包扩容定价（对标万物铺铜钱价 ÷40，最低 8 功勋） */

export function getMeritBagExpandCost(currentCapacity: number): number {

  const level = (currentCapacity - 24) / 4

  const coinPrice = 500 + level * 500

  return Math.max(8, Math.ceil(coinPrice / 40))

}



export function resolveMaxPurchases(item: Pick<MeritCatalogItem, 'once' | 'maxPurchases'>): number | undefined {

  if (item.maxPurchases != null) return item.maxPurchases

  if (item.once) return 1

  return undefined

}


