import type { ShoeDef } from '@/types'
import { FORGE_ONLY_SHOE_DEFS } from '@/data/forgeSets'

/** 所有鞋子定义 */
export const SHOES: ShoeDef[] = [
  // ===== Tier 1: 基础款（绸缎庄购买）=====
  {
    id: 'straw_sandals',
    name: '草鞋',
    description: '朴素的草编鞋，减少体力消耗。',
    effects: [{ type: 'stamina_reduction', value: 0.05 }],
    shopPrice: 200,
    recipe: null,
    recipeMoney: 0,
    obtainSource: '绸缎庄',
    sellPrice: 80
  },
  {
    id: 'cloth_shoes',
    name: '布鞋',
    description: '舒适的布鞋，农作时更加轻松。',
    effects: [{ type: 'farming_stamina', value: 0.08 }],
    shopPrice: 300,
    recipe: null,
    recipeMoney: 0,
    obtainSource: '绸缎庄',
    sellPrice: 120
  },

  // ===== Tier 2: 中级款（绸缎庄购买）=====
  {
    id: 'leather_boots',
    name: '皮靴',
    description: '结实的皮革长靴，走路更快。',
    effects: [{ type: 'travel_speed', value: 0.15 }],
    shopPrice: 800,
    recipe: null,
    recipeMoney: 0,
    obtainSource: '绸缎庄',
    sellPrice: 320
  },
  {
    id: 'miner_boots',
    name: '矿工靴',
    description: '厚底铁头靴，矿洞探索更加安全。',
    effects: [
      { type: 'mining_stamina', value: 0.1 },
      { type: 'defense_bonus', value: 0.05 }
    ],
    shopPrice: 1000,
    recipe: null,
    recipeMoney: 0,
    obtainSource: '绸缎庄',
    sellPrice: 400
  },

  // ===== Tier 3: 高级款（铁匠铺合成）=====
  {
    id: 'gale_boots',
    name: '疾风靴',
    description: '轻盈如风的皮靴，大幅缩短旅途时间。',
    effects: [
      { type: 'travel_speed', value: 0.25 },
      { type: 'stamina_reduction', value: 0.08 }
    ],
    shopPrice: null,
    recipe: [
      { itemId: 'iron_bar', quantity: 5 },
      { itemId: 'rabbit_foot', quantity: 1 }
    ],
    recipeMoney: 2000,
    obtainSource: '铁匠铺合成',
    sellPrice: 1000
  },
  {
    id: 'iron_greaves',
    name: '铁甲靴',
    description: '厚重的铁甲护胫，防御力出众。',
    effects: [
      { type: 'defense_bonus', value: 0.12 },
      { type: 'max_hp_bonus', value: 10 }
    ],
    shopPrice: null,
    recipe: [{ itemId: 'iron_bar', quantity: 8 }],
    recipeMoney: 1500,
    obtainSource: '铁匠铺合成',
    sellPrice: 750
  },
  {
    id: 'silk_slippers',
    name: '丝绸绣鞋',
    description: '精致的丝绸绣花鞋，踏青采药脚步轻盈。',
    effects: [
      { type: 'farming_stamina', value: 0.08 },
      { type: 'crop_quality_bonus', value: 0.04 }
    ],
    shopPrice: null,
    recipe: [
      { itemId: 'silk_cloth', quantity: 3 },
      { itemId: 'herb', quantity: 5 }
    ],
    recipeMoney: 800,
    obtainSource: '铁匠铺合成',
    sellPrice: 400
  },
  {
    id: 'merchant_boots',
    name: '商旅靴',
    description: '行商常穿的皮靴，行路快且购物有折扣。',
    effects: [
      { type: 'travel_speed', value: 0.18 },
      { type: 'shop_discount', value: 0.05 }
    ],
    shopPrice: null,
    recipe: [
      { itemId: 'gold_bar', quantity: 3 },
      { itemId: 'silk_cloth', quantity: 1 }
    ],
    recipeMoney: 2500,
    obtainSource: '铁匠铺合成',
    sellPrice: 1200
  },

  // ===== Tier 4: 顶级款（铁匠铺合成）=====
  {
    id: 'moon_step_boots',
    name: '月步靴',
    description: '月光石嵌入的灵巧之靴，行路如飞。',
    effects: [
      { type: 'travel_speed', value: 0.3 },
      { type: 'luck', value: 0.08 }
    ],
    shopPrice: null,
    recipe: [
      { itemId: 'gold_bar', quantity: 5 },
      { itemId: 'moonstone', quantity: 2 }
    ],
    recipeMoney: 4000,
    obtainSource: '铁匠铺合成',
    sellPrice: 2000
  },
  {
    id: 'dragon_scale_boots',
    name: '龙鳞靴',
    description: '龙鳞制成的战靴，攻守兼备行如风。',
    effects: [
      { type: 'defense_bonus', value: 0.1 },
      { type: 'attack_bonus', value: 3 },
      { type: 'travel_speed', value: 0.2 }
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
    id: 'frost_treads',
    name: '霜行靴',
    description: '寒冰层怪物留下的冻结护胫，穿上后脚步稳健。',
    effects: [
      { type: 'travel_speed', value: 0.08 },
      { type: 'defense_bonus', value: 0.03 }
    ],
    shopPrice: null,
    recipe: null,
    recipeMoney: 0,
    obtainSource: '冰霜层怪物掉落',
    sellPrice: 150
  },
  {
    id: 'shadow_striders',
    name: '暗影行者',
    description: '暗影层怪物的暗能凝聚而成，移动迅捷无声。',
    effects: [
      { type: 'travel_speed', value: 0.18 },
      { type: 'monster_drop_bonus', value: 0.06 }
    ],
    shopPrice: null,
    recipe: null,
    recipeMoney: 0,
    obtainSource: '暗影层怪物掉落',
    sellPrice: 1000
  },
  {
    id: 'void_treads',
    name: '虚空战靴',
    description: '深渊骨龙的骨骼锻成，蕴含毁灭之力。',
    effects: [
      { type: 'attack_bonus', value: 3 },
      { type: 'defense_bonus', value: 0.08 },
      { type: 'travel_speed', value: 0.15 }
    ],
    shopPrice: null,
    recipe: null,
    recipeMoney: 0,
    obtainSource: '深渊层怪物掉落',
    sellPrice: 1800
  },

  // ===== BOSS掉落 =====
  {
    id: 'lava_lord_greaves',
    name: '熔岩铠靴',
    description: '熔岩领主的余热凝结而成，坚固且灼热。',
    effects: [
      { type: 'defense_bonus', value: 0.1 },
      { type: 'attack_bonus', value: 2 }
    ],
    shopPrice: null,
    recipe: null,
    recipeMoney: 0,
    obtainSource: '60层BOSS首杀',
    sellPrice: 800
  },
  {
    id: 'shadow_sovereign_treads',
    name: '暗王之靴',
    description: '暗影君主的遗物，暗能缠绕脚踝，步履生风。',
    effects: [
      { type: 'travel_speed', value: 0.22 },
      { type: 'defense_bonus', value: 0.08 },
      { type: 'vampiric', value: 0.03 }
    ],
    shopPrice: null,
    recipe: null,
    recipeMoney: 0,
    obtainSource: '100层BOSS首杀',
    sellPrice: 1500
  },

  // ===== 宝箱掉落 =====
  {
    id: 'fortune_slippers',
    name: '福运鞋',
    description: '宝箱中发现的柔软拖鞋，似乎能招来好运。',
    effects: [
      { type: 'sell_price_bonus', value: 0.04 },
      { type: 'luck', value: 0.03 }
    ],
    shopPrice: null,
    recipe: null,
    recipeMoney: 0,
    obtainSource: '矿洞宝箱',
    sellPrice: 300
  },

  // ===== 新增商店鞋子（绸缎庄）=====
  {
    id: 'cotton_shoes',
    name: '棉鞋',
    description: '柔软保暖的棉鞋，减少日常体力消耗。',
    effects: [
      { type: 'stamina_reduction', value: 0.04 },
      { type: 'farming_stamina', value: 0.04 }
    ],
    shopPrice: 400,
    recipe: null,
    recipeMoney: 0,
    obtainSource: '绸缎庄',
    sellPrice: 160
  },
  {
    id: 'fishing_waders',
    name: '钓鱼靴',
    description: '防水长靴，钓鱼时更加从容。',
    effects: [
      { type: 'fishing_stamina', value: 0.1 },
      { type: 'fishing_calm', value: 0.03 }
    ],
    shopPrice: 700,
    recipe: null,
    recipeMoney: 0,
    obtainSource: '绸缎庄',
    sellPrice: 280
  },
  {
    id: 'jade_slippers',
    name: '玉底鞋',
    description: '翡翠镶底的绣花鞋，提升售价并增加送礼好感。',
    effects: [
      { type: 'sell_price_bonus', value: 0.04 },
      { type: 'gift_friendship', value: 0.06 }
    ],
    shopPrice: 1200,
    recipe: null,
    recipeMoney: 0,
    obtainSource: '绸缎庄',
    sellPrice: 480
  },

  // ===== 新增合成鞋子（铁匠铺）=====
  {
    id: 'obsidian_greaves',
    name: '黑曜甲靴',
    description: '黑曜石锻造的重甲靴，防御力极强。',
    effects: [
      { type: 'defense_bonus', value: 0.15 },
      { type: 'max_hp_bonus', value: 15 }
    ],
    shopPrice: null,
    recipe: [
      { itemId: 'obsidian', quantity: 2 },
      { itemId: 'iron_bar', quantity: 5 }
    ],
    recipeMoney: 3000,
    obtainSource: '铁匠铺合成',
    sellPrice: 1500
  },
  {
    id: 'wind_walker',
    name: '风行靴',
    description: '月光石赋予的轻盈之力，旅行速度大幅提升。',
    effects: [
      { type: 'travel_speed', value: 0.22 },
      { type: 'stamina_reduction', value: 0.06 }
    ],
    shopPrice: null,
    recipe: [
      { itemId: 'gold_bar', quantity: 3 },
      { itemId: 'moonstone', quantity: 1 }
    ],
    recipeMoney: 2500,
    obtainSource: '铁匠铺合成',
    sellPrice: 1200
  },
  {
    id: 'phoenix_boots',
    name: '凤鸣靴',
    description: '龙玉与金铸成的华美靴子，带来好运与悟性。',
    effects: [
      { type: 'luck', value: 0.06 },
      { type: 'exp_bonus', value: 0.08 }
    ],
    shopPrice: null,
    recipe: [
      { itemId: 'gold_bar', quantity: 5 },
      { itemId: 'dragon_jade', quantity: 1 }
    ],
    recipeMoney: 5000,
    obtainSource: '铁匠铺合成',
    sellPrice: 2500
  },

  // ===== 新增BOSS掉落鞋子 =====
  {
    id: 'frost_queen_slippers',
    name: '冰后舞靴',
    description: '冰霜女王的遗物，穿上后脚步轻盈如冰上起舞。',
    effects: [
      { type: 'travel_speed', value: 0.12 },
      { type: 'fishing_calm', value: 0.06 }
    ],
    shopPrice: null,
    recipe: null,
    recipeMoney: 0,
    obtainSource: '40层BOSS首杀',
    sellPrice: 500
  },
  {
    id: 'abyss_dragon_treads',
    name: '龙王战靴',
    description: '深渊龙王鳞片锻成的至高战靴，行如疾风攻守兼备。',
    effects: [
      { type: 'travel_speed', value: 0.25 },
      { type: 'attack_bonus', value: 5 },
      { type: 'defense_bonus', value: 0.1 }
    ],
    shopPrice: null,
    recipe: null,
    recipeMoney: 0,
    obtainSource: '120层BOSS首杀',
    sellPrice: 5000
  },

  // ===== 新增怪物掉落鞋子 =====
  {
    id: 'crystal_treads',
    name: '晶矿踏靴',
    description: '水晶层怪物碎片凝成的矿靴，采矿效率提升。',
    effects: [
      { type: 'ore_bonus', value: 1 },
      { type: 'mining_stamina', value: 0.06 }
    ],
    shopPrice: null,
    recipe: null,
    recipeMoney: 0,
    obtainSource: '水晶层怪物掉落',
    sellPrice: 800
  },

  // ===== 新增宝箱掉落鞋子 =====
  {
    id: 'lucky_boots',
    name: '幸运长靴',
    description: '宝箱中发现的古怪长靴，带来好运与额外战利品。',
    effects: [
      { type: 'luck', value: 0.05 },
      { type: 'monster_drop_bonus', value: 0.04 }
    ],
    shopPrice: null,
    recipe: null,
    recipeMoney: 0,
    obtainSource: '矿洞宝箱',
    sellPrice: 450
  },

  // === 公会专属 ===
  {
    id: 'guild_war_boots',
    name: '公会战靴',
    description: '冒险家公会精英成员的战斗靴，轻便且坚韧。',
    effects: [
      { type: 'attack_bonus', value: 2 },
      { type: 'defense_bonus', value: 0.05 },
      { type: 'travel_speed', value: 0.1 }
    ],
    shopPrice: null,
    recipe: null,
    recipeMoney: 0,
    obtainSource: '公会商店',
    sellPrice: 800
  },
  // === 竹林野兽材料制作 ===
  {
    id: 'bear_pelt_boots',
    name: '熊皮靴',
    description: '厚实的熊皮缝制的战靴，坚韧无比，穿着者更加强壮。',
    effects: [
      { type: 'defense_bonus', value: 0.1 },
      { type: 'max_hp_bonus', value: 15 }
    ],
    shopPrice: null,
    recipe: [
      { itemId: 'bear_pelt', quantity: 3 },
      { itemId: 'iron_bar', quantity: 2 }
    ],
    recipeMoney: 1200,
    obtainSource: '铁匠铺合成',
    sellPrice: 600
  },
  ...FORGE_ONLY_SHOE_DEFS
]

/** 根据ID获取鞋子定义 */
export const getShoeById = (id: string): ShoeDef | undefined => {
  return SHOES.find(s => s.id === id)
}

/** 绸缎庄可购买的鞋子 */
export const SHOP_SHOES: ShoeDef[] = SHOES.filter(s => s.shopPrice !== null)

/** 铁匠铺可合成的鞋子 */
export const CRAFTABLE_SHOES: ShoeDef[] = SHOES.filter(s => s.recipe !== null)

/** 怪物掉落鞋子（按矿洞区域） */
export const MONSTER_DROP_SHOES: Record<string, { shoeId: string; chance: number }[]> = {
  shallow: [],
  frost: [{ shoeId: 'frost_treads', chance: 0.015 }],
  lava: [],
  crystal: [{ shoeId: 'crystal_treads', chance: 0.015 }],
  shadow: [{ shoeId: 'shadow_striders', chance: 0.012 }],
  abyss: [{ shoeId: 'void_treads', chance: 0.01 }]
}

/** BOSS首杀掉落鞋子 */
export const BOSS_DROP_SHOES: Record<number, string> = {
  40: 'frost_queen_slippers',
  60: 'lava_lord_greaves',
  100: 'shadow_sovereign_treads',
  120: 'abyss_dragon_treads'
}

/** 宝箱掉落鞋子（按矿洞区域） */
export const TREASURE_DROP_SHOES: Record<string, { shoeId: string; chance: number }[]> = {
  shallow: [{ shoeId: 'lucky_boots', chance: 0.05 }],
  frost: [{ shoeId: 'lucky_boots', chance: 0.04 }],
  lava: [],
  crystal: [{ shoeId: 'fortune_slippers', chance: 0.05 }],
  shadow: [{ shoeId: 'fortune_slippers', chance: 0.04 }],
  abyss: []
}
