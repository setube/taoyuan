import type { RingDef } from '@/types'
import { FORGE_ONLY_RING_DEFS } from '@/data/forgeSets'

/** 所有戒指定义 */
export const RINGS: RingDef[] = [
  // ===== Tier 1: 铜/石英（前期，1-20层）=====
  {
    id: 'jade_guard_ring',
    name: '翠玉护身环',
    description: '翡翠镶嵌的铜环，减少受到的伤害。',
    effects: [{ type: 'defense_bonus', value: 0.08 }],
    recipe: [
      { itemId: 'copper_bar', quantity: 2 },
      { itemId: 'jade', quantity: 1 }
    ],
    recipeMoney: 200,
    obtainSource: '合成',
    sellPrice: 150
  },
  {
    id: 'quartz_ring',
    name: '石英明环',
    description: '晶莹的石英戒指，提升攻击力。',
    effects: [{ type: 'attack_bonus', value: 3 }],
    recipe: [
      { itemId: 'copper_bar', quantity: 2 },
      { itemId: 'quartz', quantity: 2 }
    ],
    recipeMoney: 200,
    obtainSource: '合成',
    sellPrice: 120
  },
  {
    id: 'farmers_ring',
    name: '农人青环',
    description: '农耕时消耗的体力减少。',
    effects: [{ type: 'farming_stamina', value: 0.1 }],
    recipe: [
      { itemId: 'copper_bar', quantity: 3 },
      { itemId: 'quartz', quantity: 1 }
    ],
    recipeMoney: 250,
    obtainSource: '合成',
    sellPrice: 180
  },

  // ===== Tier 2: 铁/翡翠（中前期，21-40层）=====
  {
    id: 'jade_spirit_ring',
    name: '碧灵指环',
    description: '翡翠蕴含灵气，提升暴击率。',
    effects: [{ type: 'crit_rate_bonus', value: 0.06 }],
    recipe: [
      { itemId: 'iron_bar', quantity: 2 },
      { itemId: 'jade', quantity: 2 }
    ],
    recipeMoney: 500,
    obtainSource: '合成',
    sellPrice: 300
  },
  {
    id: 'anglers_ring',
    name: '渔翁碧环',
    description: '钓鱼时鱼更温顺，体力消耗降低。',
    effects: [
      { type: 'fishing_calm', value: 0.08 },
      { type: 'fishing_stamina', value: 0.1 }
    ],
    recipe: [
      { itemId: 'iron_bar', quantity: 2 },
      { itemId: 'jade', quantity: 1 },
      { itemId: 'quartz', quantity: 1 }
    ],
    recipeMoney: 400,
    obtainSource: '合成',
    sellPrice: 280
  },
  {
    id: 'friendship_ring',
    name: '善缘指环',
    description: '戴上后送礼更能打动人心。',
    effects: [{ type: 'gift_friendship', value: 0.15 }],
    recipe: [
      { itemId: 'iron_bar', quantity: 2 },
      { itemId: 'jade', quantity: 2 }
    ],
    recipeMoney: 600,
    obtainSource: '合成',
    sellPrice: 350
  },

  // ===== Tier 3: 金/红宝石（中期，41-60层）=====
  {
    id: 'ruby_flame_ring',
    name: '赤焰指环',
    description: '红宝石散发灼热之力，大幅提升攻击。',
    effects: [{ type: 'attack_bonus', value: 6 }],
    recipe: [
      { itemId: 'gold_bar', quantity: 2 },
      { itemId: 'ruby', quantity: 2 }
    ],
    recipeMoney: 1000,
    obtainSource: '合成',
    sellPrice: 600
  },
  {
    id: 'miners_ring',
    name: '矿工金环',
    description: '矿洞探索体力大幅降低，额外采集矿石。',
    effects: [
      { type: 'mining_stamina', value: 0.15 },
      { type: 'ore_bonus', value: 1 }
    ],
    recipe: [
      { itemId: 'gold_bar', quantity: 2 },
      { itemId: 'ruby', quantity: 1 },
      { itemId: 'quartz', quantity: 2 }
    ],
    recipeMoney: 800,
    obtainSource: '合成',
    sellPrice: 500
  },
  {
    id: 'merchants_ring',
    name: '商贾金环',
    description: '出售物品价格提升，商店价格降低。',
    effects: [
      { type: 'sell_price_bonus', value: 0.05 },
      { type: 'shop_discount', value: 0.05 }
    ],
    recipe: [
      { itemId: 'gold_bar', quantity: 3 },
      { itemId: 'ruby', quantity: 1 }
    ],
    recipeMoney: 1200,
    obtainSource: '合成',
    sellPrice: 700
  },

  // ===== Tier 4: 月光石（61-80层）=====
  {
    id: 'moonlight_ring',
    name: '月华指环',
    description: '月光石柔和的光芒护佑生命，提升最大生命值。',
    effects: [{ type: 'max_hp_bonus', value: 25 }],
    recipe: [
      { itemId: 'gold_bar', quantity: 2 },
      { itemId: 'moonstone', quantity: 2 }
    ],
    recipeMoney: 1500,
    obtainSource: '合成',
    sellPrice: 800
  },
  {
    id: 'harvest_moon_ring',
    name: '丰月指环',
    description: '月光润泽作物，品质与生长速度提升。',
    effects: [
      { type: 'crop_quality_bonus', value: 0.08 },
      { type: 'crop_growth_bonus', value: 0.08 }
    ],
    recipe: [
      { itemId: 'gold_bar', quantity: 2 },
      { itemId: 'moonstone', quantity: 2 },
      { itemId: 'jade', quantity: 1 }
    ],
    recipeMoney: 1500,
    obtainSource: '合成',
    sellPrice: 900
  },
  {
    id: 'exp_ring',
    name: '悟道指环',
    description: '获取的所有经验值增加。',
    effects: [{ type: 'exp_bonus', value: 0.1 }],
    recipe: [
      { itemId: 'gold_bar', quantity: 2 },
      { itemId: 'moonstone', quantity: 1 },
      { itemId: 'ruby', quantity: 1 }
    ],
    recipeMoney: 1200,
    obtainSource: '合成',
    sellPrice: 750
  },

  // ===== Tier 5: 黑曜石（81-100层）=====
  {
    id: 'shadow_ring',
    name: '暗影指环',
    description: '暗影之力吸噬生命，攻击回复生命值。',
    effects: [{ type: 'vampiric', value: 0.1 }],
    recipe: [
      { itemId: 'gold_bar', quantity: 3 },
      { itemId: 'obsidian', quantity: 2 }
    ],
    recipeMoney: 2000,
    obtainSource: '合成',
    sellPrice: 1200
  },
  {
    id: 'treasure_hunter_ring',
    name: '寻宝指环',
    description: '矿洞宝箱更常出现，钓鱼宝箱概率提升。',
    effects: [{ type: 'treasure_find', value: 0.1 }],
    recipe: [
      { itemId: 'gold_bar', quantity: 2 },
      { itemId: 'obsidian', quantity: 1 },
      { itemId: 'moonstone', quantity: 1 }
    ],
    recipeMoney: 1800,
    obtainSource: '合成',
    sellPrice: 1000
  },
  {
    id: 'stalwart_ring',
    name: '坚磐指环',
    description: '黑曜石的坚硬护卫，减伤并增加最大生命值。',
    effects: [
      { type: 'defense_bonus', value: 0.12 },
      { type: 'max_hp_bonus', value: 15 }
    ],
    recipe: [
      { itemId: 'gold_bar', quantity: 3 },
      { itemId: 'obsidian', quantity: 2 }
    ],
    recipeMoney: 2500,
    obtainSource: '合成',
    sellPrice: 1400
  },

  // ===== Tier 6: 龙玉/铱（101-120层，终局）=====
  {
    id: 'dragon_ring',
    name: '龙脉指环',
    description: '龙玉蕴含远古力量，全面提升体力效率。',
    effects: [{ type: 'stamina_reduction', value: 0.12 }],
    recipe: [
      { itemId: 'iridium_bar', quantity: 2 },
      { itemId: 'dragon_jade', quantity: 2 }
    ],
    recipeMoney: 5000,
    obtainSource: '合成',
    sellPrice: 2500
  },
  {
    id: 'fortune_ring',
    name: '福运指环',
    description: '龙玉蕴含天地灵气，综合幸运提升。',
    effects: [{ type: 'luck', value: 0.08 }],
    recipe: [
      { itemId: 'iridium_bar', quantity: 2 },
      { itemId: 'dragon_jade', quantity: 1 },
      { itemId: 'moonstone', quantity: 1 }
    ],
    recipeMoney: 4000,
    obtainSource: '合成',
    sellPrice: 2200
  },
  {
    id: 'warlord_ring',
    name: '战神指环',
    description: '铱金与龙玉的完美结合，攻击与暴击大幅提升。',
    effects: [
      { type: 'attack_bonus', value: 8 },
      { type: 'crit_rate_bonus', value: 0.08 }
    ],
    recipe: [
      { itemId: 'iridium_bar', quantity: 3 },
      { itemId: 'dragon_jade', quantity: 2 }
    ],
    recipeMoney: 6000,
    obtainSource: '合成',
    sellPrice: 3000
  },
  {
    id: 'prismatic_ring',
    name: '五彩天环',
    description: '五彩碎片铸成的至高指环，万事皆幸。',
    effects: [
      { type: 'luck', value: 0.12 },
      { type: 'exp_bonus', value: 0.08 },
      { type: 'sell_price_bonus', value: 0.05 }
    ],
    recipe: [
      { itemId: 'iridium_bar', quantity: 2 },
      { itemId: 'prismatic_shard', quantity: 1 }
    ],
    recipeMoney: 10000,
    obtainSource: '合成（需五彩碎片）',
    sellPrice: 5000
  },

  // ===== BOSS 掉落（不可合成）=====
  {
    id: 'mud_golem_band',
    name: '泥岩护带',
    description: '泥岩巨兽掉落的护身带，体力消耗整体降低。',
    effects: [{ type: 'stamina_reduction', value: 0.06 }],
    recipe: null,
    recipeMoney: 0,
    obtainSource: 'BOSS掉落：泥岩巨兽（20层）',
    sellPrice: 300
  },
  {
    id: 'frost_queen_circlet',
    name: '冰后指环',
    description: '冰霜女王遗留的冰环，怪物掉落率提升。',
    effects: [{ type: 'monster_drop_bonus', value: 0.15 }],
    recipe: null,
    recipeMoney: 0,
    obtainSource: 'BOSS掉落：冰霜女王（40层）',
    sellPrice: 600
  },
  {
    id: 'lava_lord_seal',
    name: '熔岩君印',
    description: '熔岩君主的封印之环，攻击附带灼伤吸血。',
    effects: [
      { type: 'attack_bonus', value: 5 },
      { type: 'vampiric', value: 0.08 }
    ],
    recipe: null,
    recipeMoney: 0,
    obtainSource: 'BOSS掉落：熔岩君主（60层）',
    sellPrice: 1200
  },

  // ===== 新增合成戒指 =====
  {
    id: 'endurance_ring',
    name: '持久指环',
    description: '铜环镶嵌石英，增强持久力。',
    effects: [{ type: 'stamina_reduction', value: 0.05 }],
    recipe: [
      { itemId: 'copper_bar', quantity: 3 },
      { itemId: 'quartz', quantity: 1 }
    ],
    recipeMoney: 200,
    obtainSource: '合成',
    sellPrice: 120
  },
  {
    id: 'fish_jade_ring',
    name: '渔获碧环',
    description: '翡翠蕴含水灵之气，钓到的鱼品质更好。',
    effects: [
      { type: 'fish_quality_bonus', value: 0.08 },
      { type: 'fishing_calm', value: 0.05 }
    ],
    recipe: [
      { itemId: 'iron_bar', quantity: 2 },
      { itemId: 'jade', quantity: 2 }
    ],
    recipeMoney: 500,
    obtainSource: '合成',
    sellPrice: 350
  },
  {
    id: 'growth_ring',
    name: '催生指环',
    description: '月光与草药之力催发生机，作物更快成熟。',
    effects: [{ type: 'crop_growth_bonus', value: 0.12 }],
    recipe: [
      { itemId: 'gold_bar', quantity: 2 },
      { itemId: 'herb', quantity: 5 },
      { itemId: 'moonstone', quantity: 1 }
    ],
    recipeMoney: 1200,
    obtainSource: '合成',
    sellPrice: 750
  },
  {
    id: 'travel_ring',
    name: '行路指环',
    description: '兔足与金的融合赋予轻盈步伐，赶路更快。',
    effects: [
      { type: 'travel_speed', value: 0.15 },
      { type: 'stamina_reduction', value: 0.05 }
    ],
    recipe: [
      { itemId: 'gold_bar', quantity: 3 },
      { itemId: 'rabbit_foot', quantity: 1 }
    ],
    recipeMoney: 2000,
    obtainSource: '合成',
    sellPrice: 1100
  },

  // ===== 新增BOSS掉落 =====
  {
    id: 'crystal_king_seal',
    name: '晶王之印',
    description: '水晶之王碎裂后留下的印环，蕴含悟道之力。',
    effects: [
      { type: 'exp_bonus', value: 0.12 },
      { type: 'luck', value: 0.06 }
    ],
    recipe: null,
    recipeMoney: 0,
    obtainSource: 'BOSS掉落：水晶之王（80层）',
    sellPrice: 1800
  },
  {
    id: 'shadow_sovereign_ring',
    name: '暗影君戒',
    description: '暗影君主灵魂凝成的指环，暴击致命且吸噬生命。',
    effects: [
      { type: 'crit_rate_bonus', value: 0.1 },
      { type: 'vampiric', value: 0.06 }
    ],
    recipe: null,
    recipeMoney: 0,
    obtainSource: 'BOSS掉落：暗影君主（100层）',
    sellPrice: 2500
  },
  {
    id: 'abyss_dragon_ring',
    name: '龙王指环',
    description: '深渊龙王的逆鳞化成的至高指环，攻守兼备。',
    effects: [
      { type: 'attack_bonus', value: 10 },
      { type: 'defense_bonus', value: 0.1 }
    ],
    recipe: null,
    recipeMoney: 0,
    obtainSource: 'BOSS掉落：深渊龙王（120层）',
    sellPrice: 4000
  },

  // ===== 新增怪物掉落 =====
  {
    id: 'shallow_guard',
    name: '浅矿护环',
    description: '浅矿层石蟹壳制成的简陋护环。',
    effects: [{ type: 'defense_bonus', value: 0.05 }],
    recipe: null,
    recipeMoney: 0,
    obtainSource: '浅矿层怪物掉落',
    sellPrice: 80
  },
  {
    id: 'crystal_prism_band',
    name: '棱晶护带',
    description: '水晶层怪物身上凝结的棱晶带，蕴含好运。',
    effects: [
      { type: 'luck', value: 0.05 },
      { type: 'ore_bonus', value: 1 }
    ],
    recipe: null,
    recipeMoney: 0,
    obtainSource: '水晶层怪物掉落',
    sellPrice: 900
  },

  // ===== 新增宝箱掉落 =====
  {
    id: 'ancient_jade_ring',
    name: '古玉指环',
    description: '宝箱中沉睡的古老翡翠指环，带来财运。',
    effects: [
      { type: 'sell_price_bonus', value: 0.06 },
      { type: 'shop_discount', value: 0.04 }
    ],
    recipe: null,
    recipeMoney: 0,
    obtainSource: '矿洞宝箱',
    sellPrice: 600
  },

  // === 公会专属 ===
  {
    id: 'guild_war_ring',
    name: '公会战戒',
    description: '冒险家公会精英成员的战斗指环，蕴含公会的力量。',
    effects: [
      { type: 'attack_bonus', value: 4 },
      { type: 'defense_bonus', value: 0.06 }
    ],
    recipe: null,
    recipeMoney: 0,
    obtainSource: '公会商店',
    sellPrice: 800
  },
  // === 通商兑换 ===
  {
    id: 'trade_turquoise_pendant',
    name: '绿松石吊坠',
    description: '西域绿松石打磨而成的精致吊坠，蕴含沙漠之力。',
    effects: [
      { type: 'attack_bonus', value: 2 },
      { type: 'defense_bonus', value: 0.03 }
    ],
    recipe: null,
    recipeMoney: 0,
    obtainSource: '通商积分兑换',
    sellPrice: 600
  },
  // === 竹林野兽材料制作 ===
  {
    id: 'wolf_fang_pendant',
    name: '狼牙坠',
    description: '以狼牙和铜丝编成的护身坠，佩戴者出手更为凌厉。',
    effects: [
      { type: 'attack_bonus', value: 4 },
      { type: 'crit_rate_bonus', value: 0.05 }
    ],
    recipe: [
      { itemId: 'wolf_fang', quantity: 3 },
      { itemId: 'copper_bar', quantity: 2 }
    ],
    recipeMoney: 500,
    obtainSource: '铁匠铺合成',
    sellPrice: 300
  },
  {
    id: 'tiger_fang_ring',
    name: '虎牙戒',
    description: '猛虎獠牙镶嵌的金戒，散发着野兽的威压。',
    effects: [
      { type: 'attack_bonus', value: 6 },
      { type: 'monster_drop_bonus', value: 0.15 }
    ],
    recipe: [
      { itemId: 'tiger_fang', quantity: 3 },
      { itemId: 'gold_bar', quantity: 2 }
    ],
    recipeMoney: 1500,
    obtainSource: '铁匠铺合成',
    sellPrice: 700
  },
  ...FORGE_ONLY_RING_DEFS
]

/** 根据ID获取戒指定义 */
export const getRingById = (id: string): RingDef | undefined => {
  return RINGS.find(r => r.id === id)
}

/** 所有可合成的戒指 */
export const CRAFTABLE_RINGS: RingDef[] = RINGS.filter(r => r.recipe !== null)

/** 各区域怪物可掉落的戒指 */
export const MONSTER_DROP_RINGS: Record<string, { ringId: string; chance: number }[]> = {
  shallow: [{ ringId: 'shallow_guard', chance: 0.02 }],
  frost: [{ ringId: 'jade_guard_ring', chance: 0.02 }],
  lava: [{ ringId: 'jade_spirit_ring', chance: 0.02 }],
  crystal: [
    { ringId: 'moonlight_ring', chance: 0.02 },
    { ringId: 'crystal_prism_band', chance: 0.015 }
  ],
  shadow: [{ ringId: 'shadow_ring', chance: 0.02 }],
  abyss: [{ ringId: 'dragon_ring', chance: 0.015 }]
}

/** BOSS首杀掉落戒指 */
export const BOSS_DROP_RINGS: Record<number, string> = {
  20: 'mud_golem_band',
  40: 'frost_queen_circlet',
  60: 'lava_lord_seal',
  80: 'crystal_king_seal',
  100: 'shadow_sovereign_ring',
  120: 'abyss_dragon_ring'
}

/** 宝箱层可掉落的戒指（按区域） */
export const TREASURE_DROP_RINGS: Record<string, { ringId: string; chance: number }[]> = {
  shallow: [{ ringId: 'quartz_ring', chance: 0.08 }],
  frost: [{ ringId: 'farmers_ring', chance: 0.08 }],
  lava: [
    { ringId: 'anglers_ring', chance: 0.08 },
    { ringId: 'ancient_jade_ring', chance: 0.04 }
  ],
  crystal: [
    { ringId: 'exp_ring', chance: 0.06 },
    { ringId: 'ancient_jade_ring', chance: 0.035 }
  ],
  shadow: [{ ringId: 'treasure_hunter_ring', chance: 0.06 }],
  abyss: [{ ringId: 'fortune_ring', chance: 0.05 }]
}
