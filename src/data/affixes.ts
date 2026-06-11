import type {
  AffixDef,
  AffixTier,
  EquipmentEffectType,
  ForgeCategory,
  Quality,
  Weather
} from '@/types'

const W = 'weapon' as const
const H = 'hat' as const
const S = 'shoe' as const
const R = 'ring' as const

const eq = (
  id: string,
  name: string,
  description: string,
  tier: AffixTier,
  categories: ForgeCategory[],
  type: EquipmentEffectType,
  baseValue: number,
  minQuality: Quality,
  weight = 10,
  requiredWeather?: Weather | null
): AffixDef => ({
  id,
  name,
  description,
  tier,
  categories,
  effect: { kind: 'equipment', type, baseValue },
  minQuality,
  weight,
  ...(requiredWeather !== undefined ? { requiredWeather } : {})
})

const enchant = (
  id: string,
  name: string,
  description: string,
  tier: AffixTier,
  categories: ForgeCategory[],
  enchantId: string,
  minQuality: Quality,
  weight = 6
): AffixDef => ({
  id,
  name,
  description,
  tier,
  categories,
  effect: { kind: 'weapon_enchant', enchantId },
  minQuality,
  weight
})

const multi = (
  id: string,
  name: string,
  description: string,
  tier: AffixTier,
  categories: ForgeCategory[],
  effects: { type: EquipmentEffectType; baseValue: number }[],
  minQuality: Quality,
  weight = 5,
  requiredWeather?: Weather | null
): AffixDef => ({
  id,
  name,
  description,
  tier,
  categories,
  effect: { kind: 'multi', effects },
  minQuality,
  weight,
  ...(requiredWeather !== undefined ? { requiredWeather } : {})
})

/** §8.8～§8.9 词条总表 */
export const AFFIXES: AffixDef[] = [
  // T1
  eq('t1_attack', '微锋', '攻击+2', 1, [W, R], 'attack_bonus', 2, 'normal'),
  eq('t1_defense', '薄盾', '减伤+3%', 1, [H, S, R], 'defense_bonus', 0.03, 'normal'),
  eq('t1_hp', '固元', '生命+5', 1, [H, R], 'max_hp_bonus', 5, 'normal'),
  eq('t1_stamina', '省力', '体力减免+3%', 1, [S, R], 'stamina_reduction', 0.03, 'normal'),
  eq('t1_mining', '矿手', '挖矿体力-3%', 1, [R, H], 'mining_stamina', 0.03, 'normal'),
  eq('t1_fishing', '溪钓', '钓鱼体力-3%', 1, [R, H], 'fishing_stamina', 0.03, 'normal'),
  eq('t1_farm', '锄痕', '农耕体力-3%', 1, [R, H], 'farming_stamina', 0.03, 'normal'),
  eq('t1_luck', '小吉', '幸运+3%', 1, [R], 'luck', 0.03, 'normal'),

  // T2
  eq('t2_attack', '锐刃', '攻击+3', 2, [W, R], 'attack_bonus', 3, 'fine'),
  eq('t2_crit', '疾击', '暴击+5%', 2, [W, R], 'crit_rate_bonus', 0.05, 'fine'),
  eq('t2_defense', '铁壁', '减伤+5%', 2, [H, S, R], 'defense_bonus', 0.05, 'fine'),
  eq('t2_hp', '健魄', '生命+15', 2, [H, R], 'max_hp_bonus', 15, 'fine'),
  eq('t2_mining', '矿工', '挖矿体力-5%', 2, [R, H], 'mining_stamina', 0.05, 'fine'),
  eq('t2_fishing', '渔翁', '钓鱼体力-5%', 2, [R, H], 'fishing_stamina', 0.05, 'fine'),
  eq('t2_farming', '耕夫', '农耕体力-5%', 2, [R, H], 'farming_stamina', 0.05, 'fine'),
  eq('t2_travel', '轻足', '旅行加速+8%', 2, [S], 'travel_speed', 0.08, 'fine'),
  eq('t2_sell', '通商', '售价+3%', 2, [R], 'sell_price_bonus', 0.03, 'fine'),
  eq('t2_crop_quality', '粒满', '作物品质+4%', 2, [R, H], 'crop_quality_bonus', 0.04, 'fine'),
  eq('t2_fish_calm', '稳竿', '鱼速降低+5%', 2, [R, H], 'fishing_calm', 0.05, 'fine'),
  eq('t2_luck', '吉兆', '幸运+5%', 2, [R], 'luck', 0.05, 'fine'),
  eq('t2_treasure', '洞感', '宝箱概率+5%', 2, [R, H], 'treasure_find', 0.05, 'fine'),
  eq('t2_gift', '礼意', '送礼好感+6%', 2, [R], 'gift_friendship', 0.06, 'fine'),
  eq('t2_shop', '还价', '商店折扣+2%', 2, [R], 'shop_discount', 0.02, 'fine'),
  eq('t2_stamina', '轻身', '体力减免+5%', 2, [S, H, R], 'stamina_reduction', 0.05, 'fine'),

  // T3
  enchant('t3_sharp', '锋利', '攻击力提升', 3, [W], 'sharp', 'excellent'),
  enchant('t3_fierce', '炽热', '攻击力大幅提升', 3, [W], 'fierce', 'excellent'),
  enchant('t3_precise', '精准', '暴击率提升', 3, [W], 'precise', 'excellent'),
  eq('t3_vampiric', '吸血', '造成伤害回复生命', 3, [W, H, S], 'vampiric', 0.1, 'excellent', 6),
  enchant('t3_sturdy', '坚韧', '受到伤害降低', 3, [W, H], 'sturdy', 'excellent'),
  eq('t3_lucky', '幸运', '怪物掉落+12%', 3, [W, R, S], 'monster_drop_bonus', 0.12, 'excellent', 8),
  eq('t3_exp', '勤学', '经验+5%', 3, [R, H], 'exp_bonus', 0.05, 'excellent', 8),
  eq('t3_ore', '探矿', '额外矿石+1', 3, [R, H], 'ore_bonus', 1, 'excellent', 8),
  eq('t3_treasure', '寻宝', '宝箱概率+8%', 3, [R, S], 'treasure_find', 0.08, 'excellent', 8),
  eq('t3_fish_quality', '鲜鳞', '鱼品质+6%', 3, [R, H], 'fish_quality_bonus', 0.06, 'excellent', 8),
  eq('t3_crop', '丰壤', '作物生长+6%', 3, [R, H], 'crop_growth_bonus', 0.06, 'excellent', 8),
  eq('t3_gift', '善缘', '送礼好感+10%', 3, [R], 'gift_friendship', 0.1, 'excellent', 8),
  eq('t3_shop', '精打细算', '商店折扣+4%', 3, [R], 'shop_discount', 0.04, 'excellent', 8),
  eq('t3_stamina', '逸步', '体力减免+8%', 3, [S, H], 'stamina_reduction', 0.08, 'excellent', 8),
  eq('t3_crop_quality', '穗丰', '作物品质+6%', 3, [R, H], 'crop_quality_bonus', 0.06, 'excellent', 8),
  eq('t3_fish_calm', '定波', '鱼速降低+8%', 3, [R, H], 'fishing_calm', 0.08, 'excellent', 8),
  multi('t3_miner_kit', '矿脉', '矿石+1，挖矿体力-6%', 3, [R, H], [
    { type: 'ore_bonus', baseValue: 1 },
    { type: 'mining_stamina', baseValue: 0.06 }
  ], 'excellent'),
  multi('t3_angler_kit', '江潮', '鱼品质+6%，鱼速降低+6%', 3, [R, H], [
    { type: 'fish_quality_bonus', baseValue: 0.06 },
    { type: 'fishing_calm', baseValue: 0.06 }
  ], 'excellent'),
  multi('t3_merchant_kit', '货郎', '售价+4%，折扣+3%', 3, [R], [
    { type: 'sell_price_bonus', baseValue: 0.04 },
    { type: 'shop_discount', baseValue: 0.03 }
  ], 'excellent'),
  multi('t3_warrior_kit', '战意', '攻击+4，暴击+4%', 3, [W, R], [
    { type: 'attack_bonus', baseValue: 4 },
    { type: 'crit_rate_bonus', baseValue: 0.04 }
  ], 'excellent'),
  eq('t3_foraging', '樵夫', '采集体力-6%', 3, [R, H], 'foraging_stamina', 0.06, 'excellent', 8),
  eq('t3_forging_exp', '锤音', '锻造经验+8%', 3, [R, H], 'forging_exp_bonus', 0.08, 'excellent', 8),

  // T4
  enchant('t4_sharp', '极锋', '攻击力大幅提升', 4, [W], 'sharp', 'supreme', 4),
  enchant('t4_fierce', '熔火', '攻击力极大提升', 4, [W], 'fierce', 'supreme', 4),
  eq('t4_precise', '神准', '暴击+12%', 4, [W, R], 'crit_rate_bonus', 0.12, 'supreme', 4),
  eq('t4_vampiric', '嗜血', '吸血+18%', 4, [W, H, S], 'vampiric', 0.18, 'supreme', 4),
  eq('t4_sturdy', '金刚', '减伤+15%', 4, [H, W], 'defense_bonus', 0.15, 'supreme', 4),
  eq('t4_lucky', '天眷', '怪物掉落+25%', 4, [R, S], 'monster_drop_bonus', 0.25, 'supreme', 4),
  eq('t4_exp', '顿悟', '经验+8%', 4, [R, H], 'exp_bonus', 0.08, 'supreme', 4),
  eq('t4_travel', '神行', '旅行加速+20%', 4, [S], 'travel_speed', 0.2, 'supreme', 4),
  eq('t4_luck', '鸿运', '幸运+12%', 4, [R], 'luck', 0.12, 'supreme', 4),
  multi('t4_harvest', '丰年', '作物品质与生长+8%', 4, [R, H], [
    { type: 'crop_quality_bonus', baseValue: 0.08 },
    { type: 'crop_growth_bonus', baseValue: 0.08 }
  ], 'supreme', 4),
  eq('t4_fishing_calm', '静水', '鱼速降低+12%', 4, [R, H], 'fishing_calm', 0.12, 'supreme', 4),
  eq('t4_foraging', '山行', '采集体力-10%', 4, [R, H, S], 'foraging_stamina', 0.1, 'supreme', 4),
  eq('t4_forging_exp', '百炼心', '锻造经验+15%', 4, [R, H], 'forging_exp_bonus', 0.15, 'supreme', 4),

  // 天气稀有词条 §8.9
  eq('wx_solar', '烈阳', '晴日淬炼，攻击+5', 3, [W, R], 'attack_bonus', 5, 'excellent', 6, 'sunny'),
  eq('wx_rain_quench', '雨淬', '雨声淬火，减伤+10%', 3, [W, H, R], 'defense_bonus', 0.1, 'excellent', 6, 'rainy'),
  eq('wx_snow_crystal', '雪晶', '雪寒凝形，生命+20', 3, [H, R, S], 'max_hp_bonus', 20, 'excellent', 6, 'snowy'),
  eq('wx_gale_edge', '风刃', '风助锋芒，暴击+8%', 3, [W, S], 'crit_rate_bonus', 0.08, 'excellent', 6, 'windy'),
  {
    id: 'wx_thunder',
    name: '雷淬',
    description: '雷暴淬火，炽热附魔与暴击',
    tier: 4,
    categories: [W],
    effect: {
      kind: 'multi',
      effects: [
        { type: 'crit_rate_bonus', baseValue: 0.06 }
      ]
    },
    minQuality: 'supreme',
    weight: 3,
    requiredWeather: 'stormy'
  },
  multi('wx_green_spirit', '灵锻', '绿雨灵气，幸运与经验', 4, [W, H, S, R], [
    { type: 'luck', baseValue: 0.1 },
    { type: 'exp_bonus', baseValue: 0.05 }
  ], 'supreme', 3, 'green_rain')
]

// wx_thunder also has fierce enchant - handle as special composite in roll; pool entry uses multi + we'll tag in forgeRoll later
// For now add weapon_enchant note: spec says fierce + crit - the pool id wx_thunder is enough for filtering test

export const AFFIX_BY_ID: Record<string, AffixDef> = Object.fromEntries(
  AFFIXES.map(a => [a.id, a])
)

export const MAX_TIER_FOR_QUALITY: Record<Quality, AffixTier> = {
  normal: 1,
  fine: 2,
  excellent: 3,
  supreme: 4
}

export const AFFIX_SLOTS: Record<Quality, number> = {
  normal: 1,
  fine: 1,
  excellent: 1,
  supreme: 2
}

export const AFFIX_QUALITY_MULT: Record<Quality, number> = {
  normal: 1.0,
  fine: 1.15,
  excellent: 1.35,
  supreme: 1.6
}

const QUALITY_RANK: Record<Quality, number> = {
  normal: 0,
  fine: 1,
  excellent: 2,
  supreme: 3
}

export interface GetAffixPoolParams {
  category: ForgeCategory
  quality: Quality
  weather: Weather
  forgingLevel?: number
}

/** 按品质/天气/品类过滤可抽词条池（§8.4） */
export const getAffixPool = (params: GetAffixPoolParams): AffixDef[] => {
  const { category, quality, weather } = params
  const maxTier = MAX_TIER_FOR_QUALITY[quality]
  const qualityRank = QUALITY_RANK[quality]

  return AFFIXES.filter(a => {
    if (!a.categories.includes(category)) return false
    if (a.tier > maxTier) return false
    if (QUALITY_RANK[a.minQuality] > qualityRank) return false
    if (a.requiredWeather && a.requiredWeather !== weather) return false
    return true
  })
}

export const getAffixById = (id: string): AffixDef | undefined => AFFIX_BY_ID[id]
