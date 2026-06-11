import type { HatDef } from '@/types'
import { FORGE_ONLY_HAT_DEFS } from '@/data/forgeSets'

/** 所有帽子定义 */
export const HATS: HatDef[] = [
  // ===== Tier 1: 基础款（绸缎庄购买）=====
  {
    id: 'straw_hat',
    name: '草帽',
    description: '轻便的草编帽子，农作时减少体力消耗。',
    effects: [{ type: 'farming_stamina', value: 0.08 }],
    shopPrice: 200,
    recipe: null,
    recipeMoney: 0,
    obtainSource: '绸缎庄',
    sellPrice: 80
  },
  {
    id: 'bamboo_hat',
    name: '竹笠',
    description: '竹编斗笠，遮阳挡雨，减少体力消耗。',
    effects: [{ type: 'stamina_reduction', value: 0.05 }],
    shopPrice: 300,
    recipe: null,
    recipeMoney: 0,
    obtainSource: '绸缎庄',
    sellPrice: 120
  },

  // ===== Tier 2: 中级款（绸缎庄购买）=====
  {
    id: 'miner_helmet',
    name: '矿工帽',
    description: '带有灯座的皮帽，矿洞探索体力大幅降低。',
    effects: [{ type: 'mining_stamina', value: 0.12 }],
    shopPrice: 800,
    recipe: null,
    recipeMoney: 0,
    obtainSource: '绸缎庄',
    sellPrice: 320
  },
  {
    id: 'fisher_hat',
    name: '渔夫帽',
    description: '宽檐遮阳帽，钓鱼时更加专注。',
    effects: [
      { type: 'fishing_stamina', value: 0.1 },
      { type: 'fishing_calm', value: 0.05 }
    ],
    shopPrice: 800,
    recipe: null,
    recipeMoney: 0,
    obtainSource: '绸缎庄',
    sellPrice: 320
  },

  // ===== Tier 3: 高级款（铁匠铺合成）=====
  {
    id: 'iron_helm',
    name: '铁盔',
    description: '坚固的铁制头盔，提升防御与生命上限。',
    effects: [
      { type: 'defense_bonus', value: 0.1 },
      { type: 'max_hp_bonus', value: 15 }
    ],
    shopPrice: null,
    recipe: [{ itemId: 'iron_bar', quantity: 5 }],
    recipeMoney: 1000,
    obtainSource: '铁匠铺合成',
    sellPrice: 500
  },
  {
    id: 'scholar_hat',
    name: '文士帽',
    description: '儒雅的文士方巾，增加经验获取。',
    effects: [{ type: 'exp_bonus', value: 0.1 }],
    shopPrice: null,
    recipe: [{ itemId: 'silk_cloth', quantity: 2 }],
    recipeMoney: 1500,
    obtainSource: '铁匠铺合成',
    sellPrice: 600
  },
  {
    id: 'herbalist_hat',
    name: '药师帽',
    description: '采药人常戴的宽帽，农耕时减少体力且提高作物品质。',
    effects: [
      { type: 'farming_stamina', value: 0.06 },
      { type: 'crop_quality_bonus', value: 0.05 }
    ],
    shopPrice: null,
    recipe: [
      { itemId: 'herb', quantity: 10 },
      { itemId: 'silk_cloth', quantity: 1 }
    ],
    recipeMoney: 800,
    obtainSource: '铁匠铺合成',
    sellPrice: 400
  },
  {
    id: 'merchant_hat',
    name: '商人帽',
    description: '绸面圆帽，商人们的标志，提升售价并降低购物开支。',
    effects: [
      { type: 'sell_price_bonus', value: 0.08 },
      { type: 'shop_discount', value: 0.05 }
    ],
    shopPrice: null,
    recipe: [
      { itemId: 'gold_bar', quantity: 3 },
      { itemId: 'silk_cloth', quantity: 2 }
    ],
    recipeMoney: 2500,
    obtainSource: '铁匠铺合成',
    sellPrice: 1200
  },

  // ===== Tier 4: 顶级款（铁匠铺合成）=====
  {
    id: 'golden_crown',
    name: '金冠',
    description: '金光闪耀的冠冕，财运亨通。',
    effects: [
      { type: 'luck', value: 0.1 },
      { type: 'sell_price_bonus', value: 0.08 }
    ],
    shopPrice: null,
    recipe: [
      { itemId: 'gold_bar', quantity: 5 },
      { itemId: 'moonstone', quantity: 1 }
    ],
    recipeMoney: 3000,
    obtainSource: '铁匠铺合成',
    sellPrice: 1500
  },
  {
    id: 'dragon_helm',
    name: '龙角盔',
    description: '以龙玉镶嵌的战盔，攻守兼备。',
    effects: [
      { type: 'attack_bonus', value: 5 },
      { type: 'crit_rate_bonus', value: 0.05 },
      { type: 'defense_bonus', value: 0.08 }
    ],
    shopPrice: null,
    recipe: [
      { itemId: 'iridium_bar', quantity: 3 },
      { itemId: 'dragon_jade', quantity: 1 }
    ],
    recipeMoney: 8000,
    obtainSource: '铁匠铺合成',
    sellPrice: 4000
  },

  // ===== 怪物掉落 =====
  {
    id: 'frost_hood',
    name: '霜寒兜帽',
    description: '冰蝠身上剥下的毛皮缝制，散发着寒气。',
    effects: [
      { type: 'defense_bonus', value: 0.05 },
      { type: 'stamina_reduction', value: 0.03 }
    ],
    shopPrice: null,
    recipe: null,
    recipeMoney: 0,
    obtainSource: '冰霜层怪物掉落',
    sellPrice: 150
  },
  {
    id: 'shadow_mask',
    name: '暗影面具',
    description: '暗影潜伏者遗留的面具，戴上后能感知怪物的弱点。',
    effects: [
      { type: 'monster_drop_bonus', value: 0.08 },
      { type: 'vampiric', value: 0.03 }
    ],
    shopPrice: null,
    recipe: null,
    recipeMoney: 0,
    obtainSource: '暗影层怪物掉落',
    sellPrice: 1000
  },
  {
    id: 'void_visor',
    name: '虚空面甲',
    description: '深渊巨蟒的鳞片锻成，蕴含着深渊的力量。',
    effects: [
      { type: 'attack_bonus', value: 4 },
      { type: 'defense_bonus', value: 0.06 },
      { type: 'crit_rate_bonus', value: 0.03 }
    ],
    shopPrice: null,
    recipe: null,
    recipeMoney: 0,
    obtainSource: '深渊层怪物掉落',
    sellPrice: 1800
  },

  // ===== BOSS掉落 =====
  {
    id: 'golem_stone_cap',
    name: '石魔帽',
    description: '泥石魔的核心碎片镶嵌其上，坚硬异常。',
    effects: [
      { type: 'defense_bonus', value: 0.06 },
      { type: 'mining_stamina', value: 0.06 }
    ],
    shopPrice: null,
    recipe: null,
    recipeMoney: 0,
    obtainSource: '20层BOSS首杀',
    sellPrice: 300
  },
  {
    id: 'crystal_king_crown',
    name: '晶王冠',
    description: '水晶之王碎裂后留下的王冠，蕴含纯净的晶能。',
    effects: [
      { type: 'exp_bonus', value: 0.08 },
      { type: 'luck', value: 0.06 },
      { type: 'crit_rate_bonus', value: 0.03 }
    ],
    shopPrice: null,
    recipe: null,
    recipeMoney: 0,
    obtainSource: '80层BOSS首杀',
    sellPrice: 1500
  },

  // ===== 宝箱掉落 =====
  {
    id: 'lucky_cap',
    name: '幸运小帽',
    description: '宝箱中发现的古怪小帽，似乎能带来好运。',
    effects: [
      { type: 'luck', value: 0.04 },
      { type: 'sell_price_bonus', value: 0.03 }
    ],
    shopPrice: null,
    recipe: null,
    recipeMoney: 0,
    obtainSource: '矿洞宝箱',
    sellPrice: 250
  },

  // ===== 新增商店帽子（绸缎庄）=====
  {
    id: 'lotus_hat',
    name: '莲花帽',
    description: '以莲叶编成的清凉帽子，减少全局体力消耗。',
    effects: [{ type: 'stamina_reduction', value: 0.06 }],
    shopPrice: 500,
    recipe: null,
    recipeMoney: 0,
    obtainSource: '绸缎庄',
    sellPrice: 200
  },
  {
    id: 'fur_cap',
    name: '皮毛帽',
    description: '柔软的兽皮帽，矿洞中格外实用。',
    effects: [
      { type: 'mining_stamina', value: 0.08 },
      { type: 'defense_bonus', value: 0.03 }
    ],
    shopPrice: 600,
    recipe: null,
    recipeMoney: 0,
    obtainSource: '绸缎庄',
    sellPrice: 240
  },
  {
    id: 'silk_turban',
    name: '丝绸头巾',
    description: '华美的丝绸头巾，提升售价并增加送礼好感。',
    effects: [
      { type: 'sell_price_bonus', value: 0.05 },
      { type: 'gift_friendship', value: 0.08 }
    ],
    shopPrice: 1000,
    recipe: null,
    recipeMoney: 0,
    obtainSource: '绸缎庄',
    sellPrice: 400
  },

  // ===== 新增合成帽子（铁匠铺）=====
  {
    id: 'jade_hairpin',
    name: '翡翠簪',
    description: '翡翠打磨的发簪，田间劳作更加轻松。',
    effects: [
      { type: 'crop_quality_bonus', value: 0.06 },
      { type: 'farming_stamina', value: 0.05 }
    ],
    shopPrice: null,
    recipe: [
      { itemId: 'jade', quantity: 2 },
      { itemId: 'silk_cloth', quantity: 1 }
    ],
    recipeMoney: 600,
    obtainSource: '铁匠铺合成',
    sellPrice: 300
  },
  {
    id: 'obsidian_helm',
    name: '黑曜盔',
    description: '黑曜石铸成的重盔，防御力极强。',
    effects: [
      { type: 'defense_bonus', value: 0.12 },
      { type: 'max_hp_bonus', value: 20 }
    ],
    shopPrice: null,
    recipe: [
      { itemId: 'obsidian', quantity: 2 },
      { itemId: 'iron_bar', quantity: 3 }
    ],
    recipeMoney: 3000,
    obtainSource: '铁匠铺合成',
    sellPrice: 1500
  },
  {
    id: 'phoenix_crown',
    name: '凤冠',
    description: '龙玉镶嵌的华美凤冠，带来好运与悟性。',
    effects: [
      { type: 'luck', value: 0.08 },
      { type: 'exp_bonus', value: 0.1 }
    ],
    shopPrice: null,
    recipe: [
      { itemId: 'gold_bar', quantity: 5 },
      { itemId: 'dragon_jade', quantity: 1 }
    ],
    recipeMoney: 6000,
    obtainSource: '铁匠铺合成',
    sellPrice: 3000
  },

  // ===== 新增BOSS掉落帽子 =====
  {
    id: 'frost_queen_tiara',
    name: '冰后冠冕',
    description: '冰霜女王的冠冕，蕴含寒冰之力，钓鱼格外专注。',
    effects: [
      { type: 'fishing_calm', value: 0.08 },
      { type: 'fishing_stamina', value: 0.08 }
    ],
    shopPrice: null,
    recipe: null,
    recipeMoney: 0,
    obtainSource: '40层BOSS首杀',
    sellPrice: 500
  },
  {
    id: 'abyss_dragon_horns',
    name: '龙王角冠',
    description: '深渊龙王的角制成的战冠，蕴含毁灭之力。',
    effects: [
      { type: 'attack_bonus', value: 8 },
      { type: 'defense_bonus', value: 0.1 },
      { type: 'vampiric', value: 0.05 }
    ],
    shopPrice: null,
    recipe: null,
    recipeMoney: 0,
    obtainSource: '120层BOSS首杀',
    sellPrice: 5000
  },

  // ===== 新增怪物掉落帽子 =====
  {
    id: 'lava_helm',
    name: '熔岩兜帽',
    description: '火蝠翼膜缝制的耐热兜帽，蕴含灼热之力。',
    effects: [
      { type: 'attack_bonus', value: 3 },
      { type: 'defense_bonus', value: 0.04 }
    ],
    shopPrice: null,
    recipe: null,
    recipeMoney: 0,
    obtainSource: '熔岩层怪物掉落',
    sellPrice: 350
  },

  // ===== 新增宝箱掉落帽子 =====
  {
    id: 'treasure_cap',
    name: '淘金帽',
    description: '宝箱中发现的奇特帽子，似乎能吸引更多宝物。',
    effects: [
      { type: 'treasure_find', value: 0.05 },
      { type: 'ore_bonus', value: 1 }
    ],
    shopPrice: null,
    recipe: null,
    recipeMoney: 0,
    obtainSource: '矿洞宝箱',
    sellPrice: 400
  },

  // === 公会专属 ===
  {
    id: 'guild_war_helm',
    name: '公会战盔',
    description: '冒险家公会精英成员的战斗头盔，坚固而威严。',
    effects: [
      { type: 'attack_bonus', value: 3 },
      { type: 'max_hp_bonus', value: 15 }
    ],
    shopPrice: null,
    recipe: null,
    recipeMoney: 0,
    obtainSource: '公会商店',
    sellPrice: 800
  },
  // === 通商兑换 ===
  {
    id: 'trade_silk_robe',
    name: '丝绸长袍',
    description: '西域丝绸织就的华美长袍，穿着时神清气爽。',
    effects: [
      { type: 'attack_bonus', value: 3 },
      { type: 'max_hp_bonus', value: 20 }
    ],
    shopPrice: null,
    recipe: null,
    recipeMoney: 0,
    obtainSource: '通商积分兑换',
    sellPrice: 750
  },
  // === 竹林野兽材料制作 ===
  {
    id: 'wolf_pelt_hood',
    name: '狼皮兜帽',
    description: '以竹林灰狼的毛皮缝制的兜帽，保暖且防护力强。',
    effects: [
      { type: 'defense_bonus', value: 0.08 },
      { type: 'max_hp_bonus', value: 10 }
    ],
    shopPrice: null,
    recipe: [
      { itemId: 'wolf_pelt', quantity: 3 },
      { itemId: 'silk_cloth', quantity: 1 }
    ],
    recipeMoney: 800,
    obtainSource: '铁匠铺合成',
    sellPrice: 400
  },
  {
    id: 'tiger_pelt_cape',
    name: '虎皮披风',
    description: '虎皮与熊皮合制的披风，攻守兼备，气势慑人。',
    effects: [
      { type: 'attack_bonus', value: 5 },
      { type: 'defense_bonus', value: 0.06 }
    ],
    shopPrice: null,
    recipe: [
      { itemId: 'tiger_pelt', quantity: 2 },
      { itemId: 'bear_pelt', quantity: 1 },
      { itemId: 'silk_cloth', quantity: 1 }
    ],
    recipeMoney: 2000,
    obtainSource: '铁匠铺合成',
    sellPrice: 900
  },
  ...FORGE_ONLY_HAT_DEFS
]

/** 根据ID获取帽子定义 */
export const getHatById = (id: string): HatDef | undefined => {
  return HATS.find(h => h.id === id)
}

/** 绸缎庄可购买的帽子 */
export const SHOP_HATS: HatDef[] = HATS.filter(h => h.shopPrice !== null)

/** 铁匠铺可合成的帽子 */
export const CRAFTABLE_HATS: HatDef[] = HATS.filter(h => h.recipe !== null)

/** 怪物掉落帽子（按矿洞区域） */
export const MONSTER_DROP_HATS: Record<string, { hatId: string; chance: number }[]> = {
  shallow: [],
  frost: [{ hatId: 'frost_hood', chance: 0.015 }],
  lava: [{ hatId: 'lava_helm', chance: 0.015 }],
  crystal: [],
  shadow: [{ hatId: 'shadow_mask', chance: 0.012 }],
  abyss: [{ hatId: 'void_visor', chance: 0.01 }]
}

/** BOSS首杀掉落帽子 */
export const BOSS_DROP_HATS: Record<number, string> = {
  20: 'golem_stone_cap',
  40: 'frost_queen_tiara',
  80: 'crystal_king_crown',
  120: 'abyss_dragon_horns'
}

/** 宝箱掉落帽子（按矿洞区域） */
export const TREASURE_DROP_HATS: Record<string, { hatId: string; chance: number }[]> = {
  shallow: [{ hatId: 'treasure_cap', chance: 0.05 }],
  frost: [{ hatId: 'treasure_cap', chance: 0.04 }],
  lava: [{ hatId: 'lucky_cap', chance: 0.05 }],
  crystal: [{ hatId: 'lucky_cap', chance: 0.04 }],
  shadow: [],
  abyss: []
}
