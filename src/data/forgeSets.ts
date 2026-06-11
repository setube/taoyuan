import type { ForgeRecipeDef } from '@/types'
import type { HatDef, RingDef, ShoeDef, WeaponDef } from '@/types'
import { EQUIPMENT_SETS } from '@/data/equipmentSets'

const forgeRecipeId = (category: string, defId: string) => `forge_${category}_${defId}`

const SET_FIXED_AFFIX: Record<string, string> = {
  miner_set: 't2_mining',
  fisher_set: 't2_fishing',
  merchant_set: 't2_sell',
  harvest_set: 't2_crop_quality',
  dragon_warrior_set: 't2_attack',
  obsidian_set: 't2_defense',
  phoenix_set: 't3_exp',
  shadow_set: 't3_vampiric',
  frost_queen_set: 't3_fish_calm',
  dragon_king_set: 't3_lucky',
  forest_hunter_set: 't2_crit',
  beast_king_set: 't3_vampiric',
  mud_king_set: 't2_stamina',
  lava_lord_set: 't3_vampiric',
  crystal_king_set: 't3_exp',
  shadow_sovereign_set: 't3_precise',
  master_smith_set: 't3_forging_exp',
  forager_set: 't3_foraging',
  hearth_set: 't3_exp',
  tea_zen_set: 't2_gift',
  escort_set: 't2_travel',
  furnace_set: 't3_ore',
  shrine_harvest_set: 't2_crop_quality'
}

const forgeOnly = {
  recipe: null as null,
  recipeMoney: 0,
  obtainSource: '锻造'
}

/** 套装武器固定词条（与配饰不同） */
const SET_WEAPON_FIXED_AFFIX: Record<string, string> = {
  lava_lord_set: 't3_fierce'
}

/** 新增锻造专用 def（§9.13） */
export const FORGE_ONLY_RING_DEFS: RingDef[] = [
  {
    id: 'smith_mastery_ring',
    name: '匠师戒',
    description: '孙铁匠心传，锤炼时更易领悟。',
    effects: [
      { type: 'forging_exp_bonus', value: 0.06 },
      { type: 'mining_stamina', value: 0.04 }
    ],
    ...forgeOnly,
    sellPrice: 400
  },
  {
    id: 'forager_ring',
    name: '樵采戒',
    description: '山林樵夫的行戒，采药更省力。',
    effects: [{ type: 'foraging_stamina', value: 0.08 }],
    ...forgeOnly,
    sellPrice: 350
  },
  {
    id: 'hearth_ring',
    name: '灶火戒',
    description: '灶膛余温凝于指间，身心皆暖。',
    effects: [
      { type: 'exp_bonus', value: 0.05 },
      { type: 'gift_friendship', value: 0.04 }
    ],
    ...forgeOnly,
    sellPrice: 380
  },
  {
    id: 'tea_ring',
    name: '茶禅戒',
    description: '茶烟袅袅，礼敬人心。',
    effects: [
      { type: 'gift_friendship', value: 0.08 },
      { type: 'luck', value: 0.04 }
    ],
    ...forgeOnly,
    sellPrice: 420
  },
  {
    id: 'escort_ring',
    name: '行镖戒',
    description: '镖局旧制，远行如履平地。',
    effects: [{ type: 'travel_speed', value: 0.08 }],
    ...forgeOnly,
    sellPrice: 400
  },
  {
    id: 'furnace_ring',
    name: '炉工戒',
    description: '熔炉旁淬炼出的指环，识得矿脉。',
    effects: [
      { type: 'ore_bonus', value: 1 },
      { type: 'mining_stamina', value: 0.05 }
    ],
    ...forgeOnly,
    sellPrice: 450
  },
  {
    id: 'shrine_ring',
    name: '公祠戒',
    description: '祠堂祈福所铸，岁稔年丰。',
    effects: [
      { type: 'crop_quality_bonus', value: 0.05 },
      { type: 'crop_growth_bonus', value: 0.05 }
    ],
    ...forgeOnly,
    sellPrice: 400
  }
]

export const FORGE_ONLY_HAT_DEFS: HatDef[] = [
  {
    id: 'mud_crown',
    name: '泥岩冠',
    description: '泥岩巨兽碎屑熔铸，沉重而稳固。',
    effects: [
      { type: 'defense_bonus', value: 0.06 },
      { type: 'mining_stamina', value: 0.05 }
    ],
    shopPrice: null,
    ...forgeOnly,
    sellPrice: 350
  },
  {
    id: 'lava_lord_crown',
    name: '熔岩君冠',
    description: '熔岩君主余烬凝成的王冠，炽热逼人。',
    effects: [
      { type: 'attack_bonus', value: 4 },
      { type: 'defense_bonus', value: 0.05 }
    ],
    shopPrice: null,
    ...forgeOnly,
    sellPrice: 900
  },
  {
    id: 'shadow_sovereign_veil',
    name: '暗君面纱',
    description: '暗影君主遗落的面纱，隐匿杀机。',
    effects: [
      { type: 'crit_rate_bonus', value: 0.06 },
      { type: 'defense_bonus', value: 0.05 }
    ],
    shopPrice: null,
    ...forgeOnly,
    sellPrice: 1200
  },
  {
    id: 'smith_apron',
    name: '匠师围裙',
    description: '孙铁匠挚友所赠，炉边劳作更从容。',
    effects: [
      { type: 'forging_exp_bonus', value: 0.08 },
      { type: 'stamina_reduction', value: 0.04 }
    ],
    shopPrice: null,
    ...forgeOnly,
    sellPrice: 500
  },
  {
    id: 'forager_hood',
    name: '樵采兜帽',
    description: '林老所传，深山采药不疲。',
    effects: [{ type: 'foraging_stamina', value: 0.1 }],
    shopPrice: null,
    ...forgeOnly,
    sellPrice: 380
  },
  {
    id: 'hearth_cap',
    name: '灶火帽',
    description: '客栈厨子常戴的厚帽，烟火气十足。',
    effects: [
      { type: 'exp_bonus', value: 0.06 },
      { type: 'farming_stamina', value: 0.04 }
    ],
    shopPrice: null,
    ...forgeOnly,
    sellPrice: 360
  },
  {
    id: 'tea_hat',
    name: '茶禅笠',
    description: '茶庄弟子斗茶时佩戴，心境平和。',
    effects: [
      { type: 'gift_friendship', value: 0.06 },
      { type: 'luck', value: 0.05 }
    ],
    shopPrice: null,
    ...forgeOnly,
    sellPrice: 400
  },
  {
    id: 'escort_headband',
    name: '行镖头巾',
    description: '云飞镖局制式，防风护眼。',
    effects: [
      { type: 'travel_speed', value: 0.1 },
      { type: 'attack_bonus', value: 2 }
    ],
    shopPrice: null,
    ...forgeOnly,
    sellPrice: 420
  },
  {
    id: 'furnace_mask',
    name: '炉工面罩',
    description: '阿石工坊标配，隔热滤烟。',
    effects: [
      { type: 'mining_stamina', value: 0.08 },
      { type: 'ore_bonus', value: 1 }
    ],
    shopPrice: null,
    ...forgeOnly,
    sellPrice: 440
  },
  {
    id: 'shrine_hat',
    name: '公祠帽',
    description: '祠堂祭礼所用，祈求丰收。',
    effects: [
      { type: 'crop_quality_bonus', value: 0.06 },
      { type: 'crop_growth_bonus', value: 0.06 }
    ],
    shopPrice: null,
    ...forgeOnly,
    sellPrice: 400
  }
]

export const FORGE_ONLY_SHOE_DEFS: ShoeDef[] = [
  {
    id: 'mud_stride_boots',
    name: '泥岩步靴',
    description: '泥岩矿洞行走如履实地。',
    effects: [
      { type: 'mining_stamina', value: 0.08 },
      { type: 'stamina_reduction', value: 0.04 }
    ],
    shopPrice: null,
    ...forgeOnly,
    sellPrice: 350
  },
  {
    id: 'crystal_step_boots',
    name: '晶步靴',
    description: '水晶矿脉中凝练的轻靴，步履生风。',
    effects: [
      { type: 'travel_speed', value: 0.1 },
      { type: 'luck', value: 0.05 }
    ],
    shopPrice: null,
    ...forgeOnly,
    sellPrice: 1100
  },
  {
    id: 'smith_sole',
    name: '匠师靴',
    description: '炉前站整日也不觉酸软。',
    effects: [
      { type: 'forging_exp_bonus', value: 0.05 },
      { type: 'stamina_reduction', value: 0.05 }
    ],
    shopPrice: null,
    ...forgeOnly,
    sellPrice: 480
  },
  {
    id: 'forager_boots',
    name: '樵采靴',
    description: '山林崎岖亦不觉疲惫。',
    effects: [{ type: 'foraging_stamina', value: 0.1 }],
    shopPrice: null,
    ...forgeOnly,
    sellPrice: 380
  },
  {
    id: 'hearth_slippers',
    name: '灶火拖鞋',
    description: '厨房软底鞋，久站不累。',
    effects: [
      { type: 'stamina_reduction', value: 0.06 },
      { type: 'exp_bonus', value: 0.04 }
    ],
    shopPrice: null,
    ...forgeOnly,
    sellPrice: 360
  },
  {
    id: 'tea_shoes',
    name: '茶禅履',
    description: '茶庄软底鞋，步履轻雅。',
    effects: [
      { type: 'gift_friendship', value: 0.05 },
      { type: 'travel_speed', value: 0.06 }
    ],
    shopPrice: null,
    ...forgeOnly,
    sellPrice: 400
  },
  {
    id: 'escort_boots',
    name: '行镖靴',
    description: '镖局远行专用，日行百里。',
    effects: [{ type: 'travel_speed', value: 0.12 }],
    shopPrice: null,
    ...forgeOnly,
    sellPrice: 430
  },
  {
    id: 'furnace_boots',
    name: '炉工靴',
    description: '耐高温铁靴，矿洞如履平地。',
    effects: [
      { type: 'mining_stamina', value: 0.1 },
      { type: 'defense_bonus', value: 0.03 }
    ],
    shopPrice: null,
    ...forgeOnly,
    sellPrice: 450
  },
  {
    id: 'shrine_shoes',
    name: '公祠鞋',
    description: '祠堂祭典所穿，步履端庄。',
    effects: [
      { type: 'crop_growth_bonus', value: 0.06 },
      { type: 'sell_price_bonus', value: 0.03 }
    ],
    shopPrice: null,
    ...forgeOnly,
    sellPrice: 400
  }
]

export const FORGE_ONLY_WEAPON_DEFS: Record<string, WeaponDef> = {
  smith_hammer: {
    id: 'smith_hammer',
    name: '匠师锤',
    type: 'club',
    attack: 16,
    critRate: 0.04,
    description: '孙铁匠挚友所铸，锤落有声。',
    shopPrice: null,
    shopMaterials: [],
    fixedEnchantment: null
  }
}

type Tier = 1 | 2 | 3 | 4

const TIER_INGREDIENTS: Record<Tier, { itemId: string; quantity: number }[]> = {
  1: [
    { itemId: 'copper_bar', quantity: 3 },
    { itemId: 'quartz', quantity: 2 }
  ],
  2: [
    { itemId: 'iron_bar', quantity: 3 },
    { itemId: 'jade', quantity: 2 }
  ],
  3: [
    { itemId: 'gold_bar', quantity: 3 },
    { itemId: 'ruby', quantity: 1 }
  ],
  4: [
    { itemId: 'iridium_bar', quantity: 3 },
    { itemId: 'prismatic_shard', quantity: 1 }
  ]
}

const TIER_MONEY: Record<Tier, number> = { 1: 400, 2: 800, 3: 2000, 4: 5000 }
const TIER_LEVEL: Record<Tier, number> = { 1: 1, 2: 3, 3: 6, 4: 10 }

/** Boss / 高阶套默认 tier */
const SET_TIER: Partial<Record<string, Tier>> = {
  mud_king_set: 2,
  frost_queen_set: 3,
  lava_lord_set: 3,
  crystal_king_set: 4,
  shadow_sovereign_set: 4,
  dragon_king_set: 4,
  master_smith_set: 3,
  phoenix_set: 3,
  dragon_warrior_set: 2
}

const makeSetRecipe = (
  category: 'weapon' | 'ring' | 'hat' | 'shoe',
  defId: string,
  setId: string,
  tier?: Tier
): ForgeRecipeDef => {
  const t = tier ?? SET_TIER[setId] ?? 2
  const fixedAffixId =
    category === 'weapon'
      ? SET_WEAPON_FIXED_AFFIX[setId] ?? SET_FIXED_AFFIX[setId]
      : SET_FIXED_AFFIX[setId]
  return {
    id: forgeRecipeId(category, defId),
    category,
    targetDefId: defId,
    setId,
    ingredients: TIER_INGREDIENTS[t],
    moneyCost: TIER_MONEY[t],
    requiredForgingLevel: TIER_LEVEL[t],
    tier: t,
    fixedAffixId,
    isSetPiece: true
  }
}

/** 全部套装件锻造配方（含 Boss 掉落件） */
export const FORGE_SET_RECIPES: ForgeRecipeDef[] = EQUIPMENT_SETS.flatMap(set => {
  if (set.id === 'guild_champion_set') return []
  const tier = SET_TIER[set.id]
  const recipes: ForgeRecipeDef[] = []
  if (set.pieces.weapon) {
    recipes.push(makeSetRecipe('weapon', set.pieces.weapon, set.id, tier))
  }
  recipes.push(
    makeSetRecipe('ring', set.pieces.ring, set.id, tier),
    makeSetRecipe('hat', set.pieces.hat, set.id, tier),
    makeSetRecipe('shoe', set.pieces.shoe, set.id, tier)
  )
  return recipes
})
