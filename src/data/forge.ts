import type { ForgeCategory, ForgeRecipeDef } from '@/types'
import { CRAFTABLE_HATS, CRAFTABLE_RINGS, CRAFTABLE_SHOES } from '@/data'
import { EQUIPMENT_SETS } from '@/data/equipmentSets'
import { FORGE_SET_RECIPES } from '@/data/forgeSets'

/** 配方 id：`forge_{category}_{defId}` */
export const forgeRecipeId = (category: ForgeCategory, defId: string): string =>
  `forge_${category}_${defId}`

/** 套装件固定词条（§9.13） */
export const SET_FIXED_AFFIX: Record<string, string> = {
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

const DEF_TO_SET: Record<string, string> = {}
for (const set of EQUIPMENT_SETS) {
  const { pieces } = set
  if (pieces.ring) DEF_TO_SET[pieces.ring] = set.id
  if (pieces.hat) DEF_TO_SET[pieces.hat] = set.id
  if (pieces.shoe) DEF_TO_SET[pieces.shoe] = set.id
  if (pieces.weapon) DEF_TO_SET[pieces.weapon] = set.id
}

const BAR_TIER: Record<string, 1 | 2 | 3 | 4> = {
  copper_bar: 1,
  iron_bar: 2,
  gold_bar: 3,
  iridium_bar: 4
}

const inferTier = (ingredients: { itemId: string; quantity: number }[]): 1 | 2 | 3 | 4 => {
  let tier: 1 | 2 | 3 | 4 = 1
  for (const ing of ingredients) {
    const t = BAR_TIER[ing.itemId]
    if (t && t > tier) tier = t
  }
  return tier
}

const tierToForgingLevel = (tier: 1 | 2 | 3 | 4): number => {
  if (tier <= 1) return 1
  if (tier === 2) return 3
  if (tier === 3) return 6
  return 10
}

const accessoryToRecipe = (
  category: 'ring' | 'hat' | 'shoe',
  def: {
    id: string
    recipe: { itemId: string; quantity: number }[] | null
    recipeMoney: number
  }
): ForgeRecipeDef | null => {
  if (!def.recipe) return null
  const setId = DEF_TO_SET[def.id] ?? null
  const tier = inferTier(def.recipe)
  return {
    id: forgeRecipeId(category, def.id),
    category,
    targetDefId: def.id,
    setId,
    ingredients: def.recipe,
    moneyCost: def.recipeMoney,
    requiredForgingLevel: tierToForgingLevel(tier),
    tier,
    fixedAffixId: setId ? SET_FIXED_AFFIX[setId] : undefined,
    isSetPiece: setId !== null
  }
}

/** 可锻造武器（非商店限购、有材料配方） */
const FORGE_WEAPON_RECIPES: ForgeRecipeDef[] = [
  {
    id: forgeRecipeId('weapon', 'copper_sword'),
    category: 'weapon',
    targetDefId: 'copper_sword',
    setId: null,
    ingredients: [{ itemId: 'copper_bar', quantity: 3 }, { itemId: 'copper_ore', quantity: 5 }],
    moneyCost: 300,
    requiredForgingLevel: 1,
    tier: 1,
    isSetPiece: false
  },
  {
    id: forgeRecipeId('weapon', 'iron_blade'),
    category: 'weapon',
    targetDefId: 'iron_blade',
    setId: null,
    ingredients: [{ itemId: 'iron_bar', quantity: 3 }, { itemId: 'iron_ore', quantity: 5 }],
    moneyCost: 600,
    requiredForgingLevel: 3,
    tier: 2,
    isSetPiece: false
  },
  {
    id: forgeRecipeId('ring', 'frost_queen_circlet'),
    category: 'ring',
    targetDefId: 'frost_queen_circlet',
    setId: 'frost_queen_set',
    ingredients: [
      { itemId: 'gold_bar', quantity: 3 },
      { itemId: 'ice_crystal', quantity: 2 },
      { itemId: 'diamond', quantity: 1 }
    ],
    moneyCost: 2000,
    requiredForgingLevel: 8,
    tier: 3,
    fixedAffixId: SET_FIXED_AFFIX.frost_queen_set,
    isSetPiece: true
  },
  {
    id: forgeRecipeId('hat', 'frost_queen_tiara'),
    category: 'hat',
    targetDefId: 'frost_queen_tiara',
    setId: 'frost_queen_set',
    ingredients: [
      { itemId: 'gold_bar', quantity: 3 },
      { itemId: 'ice_crystal', quantity: 2 },
      { itemId: 'diamond', quantity: 1 }
    ],
    moneyCost: 2000,
    requiredForgingLevel: 8,
    tier: 3,
    fixedAffixId: SET_FIXED_AFFIX.frost_queen_set,
    isSetPiece: true
  },
  {
    id: forgeRecipeId('shoe', 'frost_queen_slippers'),
    category: 'shoe',
    targetDefId: 'frost_queen_slippers',
    setId: 'frost_queen_set',
    ingredients: [
      { itemId: 'gold_bar', quantity: 3 },
      { itemId: 'ice_crystal', quantity: 2 },
      { itemId: 'diamond', quantity: 1 }
    ],
    moneyCost: 2000,
    requiredForgingLevel: 8,
    tier: 3,
    fixedAffixId: SET_FIXED_AFFIX.frost_queen_set,
    isSetPiece: true
  },
  {
    id: forgeRecipeId('weapon', 'frost_queen_sting'),
    category: 'weapon',
    targetDefId: 'frost_queen_sting',
    setId: 'frost_queen_set',
    ingredients: [
      { itemId: 'gold_bar', quantity: 4 },
      { itemId: 'diamond', quantity: 2 },
      { itemId: 'ice_crystal', quantity: 3 }
    ],
    moneyCost: 2500,
    requiredForgingLevel: 8,
    tier: 3,
    fixedAffixId: SET_FIXED_AFFIX.frost_queen_set,
    isSetPiece: true
  },
  {
    id: forgeRecipeId('weapon', 'abyss_dragon_mace'),
    category: 'weapon',
    targetDefId: 'abyss_dragon_mace',
    setId: 'dragon_king_set',
    ingredients: [
      { itemId: 'iridium_bar', quantity: 4 },
      { itemId: 'dragon_scale', quantity: 3 }
    ],
    moneyCost: 5000,
    requiredForgingLevel: 12,
    tier: 4,
    fixedAffixId: SET_FIXED_AFFIX.dragon_king_set,
    isSetPiece: true
  }
]

const craftableRecipes: ForgeRecipeDef[] = [
  ...CRAFTABLE_RINGS.map(r => accessoryToRecipe('ring', r)),
  ...CRAFTABLE_HATS.map(h => accessoryToRecipe('hat', h)),
  ...CRAFTABLE_SHOES.map(s => accessoryToRecipe('shoe', s))
].filter((r): r is ForgeRecipeDef => r !== null)

const mergeForgeRecipes = (...groups: ForgeRecipeDef[][]): ForgeRecipeDef[] => {
  const byId = new Map<string, ForgeRecipeDef>()
  for (const group of groups) {
    for (const recipe of group) byId.set(recipe.id, recipe)
  }
  return [...byId.values()]
}

export const FORGE_RECIPES: ForgeRecipeDef[] = mergeForgeRecipes(
  craftableRecipes,
  FORGE_WEAPON_RECIPES,
  FORGE_SET_RECIPES
)

export const FORGE_RECIPE_BY_ID: Record<string, ForgeRecipeDef> = Object.fromEntries(
  FORGE_RECIPES.map(r => [r.id, r])
)

export const getForgeRecipeById = (id: string): ForgeRecipeDef | undefined => FORGE_RECIPE_BY_ID[id]

export const getForgeRecipesForSet = (setId: string): ForgeRecipeDef[] =>
  FORGE_RECIPES.filter(r => r.setId === setId)
