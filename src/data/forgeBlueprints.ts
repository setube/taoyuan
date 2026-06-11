import type { ForgeBlueprintDef, ForgeRecipeDef } from '@/types'
import { forgeRecipeId, getForgeRecipeById } from '@/data/forge'

const r = (category: 'weapon' | 'hat' | 'shoe' | 'ring', defId: string) =>
  forgeRecipeId(category, defId)

const setRecipes = (
  _setId: string,
  pieces: { weapon?: string; ring: string; hat: string; shoe: string }
): string[] => {
  const ids: string[] = [
    r('ring', pieces.ring),
    r('hat', pieces.hat),
    r('shoe', pieces.shoe)
  ]
  if (pieces.weapon) ids.push(r('weapon', pieces.weapon))
  return ids
}

/** §9.10～§9.15 图纸定义 */
export const FORGE_BLUEPRINTS: ForgeBlueprintDef[] = [
  // 孙铁匠商店
  {
    id: 'bp_shop_copper_ring',
    name: '铜素戒图纸',
    kind: 'single',
    unlocksRecipeIds: [r('ring', 'quartz_ring')],
    description: '孙铁匠传授的铜戒锻造之法。'
  },
  {
    id: 'bp_shop_copper_band',
    name: '铜护戒图纸',
    kind: 'single',
    unlocksRecipeIds: [r('ring', 'jade_guard_ring')],
    description: '铜环镶玉，护体减伤。'
  },
  {
    id: 'bp_shop_straw_hat',
    name: '草帽图纸',
    kind: 'single',
    unlocksRecipeIds: [r('hat', 'bamboo_hat')],
    description: '轻便帽饰的锻造图样（草帽以竹笠配方代行）。'
  },
  {
    id: 'bp_shop_copper_sword',
    name: '铜剑图纸',
    kind: 'single',
    unlocksRecipeIds: [r('weapon', 'copper_sword')],
    description: '入门兵刃锻造图。'
  },
  {
    id: 'bp_shop_miner_ring',
    name: '矿工戒图纸',
    kind: 'single',
    unlocksRecipeIds: [r('ring', 'miners_ring')],
    description: '矿工金环锻造之法。'
  },
  {
    id: 'bp_shop_iron_blade',
    name: '铁刀图纸',
    kind: 'single',
    unlocksRecipeIds: [r('weapon', 'iron_blade')],
    description: '铁制长刀锻造图。'
  },
  {
    id: 'bp_shop_merchant_ring',
    name: '商贾戒图纸',
    kind: 'single',
    unlocksRecipeIds: [r('ring', 'merchants_ring')],
    description: '商贾指环锻造图。'
  },

  // 孙铁匠好感
  {
    id: 'bp_gift_copper_pack',
    name: '铜匠入门包',
    kind: 'single',
    unlocksRecipeIds: [r('ring', 'quartz_ring'), r('ring', 'farmers_ring')],
    description: '相识礼：铜戒双图。'
  },
  {
    id: 'bp_gift_iron_weapon',
    name: '铁兵图谱',
    kind: 'single',
    unlocksRecipeIds: [r('weapon', 'iron_blade')],
    description: '友好礼：铁刀锻造。'
  },
  {
    id: 'bp_gift_miner_set_partial',
    name: '矿工套残图',
    kind: 'single',
    unlocksRecipeIds: [r('ring', 'miners_ring'), r('hat', 'miner_helmet')],
    description: '友好礼：矿工套戒帽二件。'
  },
  {
    id: 'bp_gift_master_smith_set',
    name: '匠师套装图纸',
    kind: 'set',
    setId: 'master_smith_set',
    unlocksRecipeIds: setRecipes('master_smith_set', {
      ring: 'smith_mastery_ring',
      hat: 'smith_apron',
      shoe: 'smith_sole',
      weapon: 'smith_hammer'
    }),
    description: '挚友礼：匠师四件套锻造全图。'
  },

  // 阿铁好感
  {
    id: 'bp_a_tie_practice_ring',
    name: '练习铜戒图',
    kind: 'single',
    unlocksRecipeIds: [r('ring', 'quartz_ring')],
    description: '阿铁入门练习图。'
  },
  {
    id: 'bp_a_tie_fine_rings',
    name: '精铁双戒图',
    kind: 'single',
    unlocksRecipeIds: [r('ring', 'jade_spirit_ring'), r('ring', 'anglers_ring')],
    description: '友好礼：两枚铁戒图。'
  },

  // Boss 首杀整套
  {
    id: 'bp_boss_mud_king_set',
    name: '泥岩王套装图纸',
    kind: 'set',
    setId: 'mud_king_set',
    unlocksRecipeIds: setRecipes('mud_king_set', {
      ring: 'mud_golem_band',
      hat: 'mud_crown',
      shoe: 'mud_stride_boots',
      weapon: 'mud_king_fang'
    }),
    description: '泥岩巨兽首杀：泥岩王四件套。'
  },
  {
    id: 'bp_boss_frost_queen_set',
    name: '冰后套装图纸',
    kind: 'set',
    setId: 'frost_queen_set',
    unlocksRecipeIds: setRecipes('frost_queen_set', {
      ring: 'frost_queen_circlet',
      hat: 'frost_queen_tiara',
      shoe: 'frost_queen_slippers',
      weapon: 'frost_queen_sting'
    }),
    description: '冰霜女王首杀：冰后四件套。'
  },
  {
    id: 'bp_boss_lava_lord_set',
    name: '熔岩君主套装图纸',
    kind: 'set',
    setId: 'lava_lord_set',
    unlocksRecipeIds: setRecipes('lava_lord_set', {
      ring: 'lava_lord_seal',
      hat: 'lava_lord_crown',
      shoe: 'lava_lord_greaves',
      weapon: 'lava_lord_maul'
    }),
    description: '熔岩君主首杀：熔岩四件套。'
  },
  {
    id: 'bp_boss_crystal_king_set',
    name: '晶王套装图纸',
    kind: 'set',
    setId: 'crystal_king_set',
    unlocksRecipeIds: setRecipes('crystal_king_set', {
      ring: 'crystal_king_seal',
      hat: 'crystal_king_crown',
      shoe: 'crystal_step_boots',
      weapon: 'crystal_king_blade'
    }),
    description: '水晶之王首杀：晶王四件套。'
  },
  {
    id: 'bp_boss_shadow_sovereign_set',
    name: '暗影君主套装图纸',
    kind: 'set',
    setId: 'shadow_sovereign_set',
    unlocksRecipeIds: setRecipes('shadow_sovereign_set', {
      ring: 'shadow_sovereign_ring',
      hat: 'shadow_sovereign_veil',
      shoe: 'shadow_sovereign_treads',
      weapon: 'shadow_sovereign_fang'
    }),
    description: '暗影君主首杀：暗影君主四件套。'
  },
  {
    id: 'bp_boss_dragon_king_set',
    name: '龙王套装图纸',
    kind: 'set',
    setId: 'dragon_king_set',
    unlocksRecipeIds: setRecipes('dragon_king_set', {
      ring: 'abyss_dragon_ring',
      hat: 'abyss_dragon_horns',
      shoe: 'abyss_dragon_treads',
      weapon: 'abyss_dragon_mace'
    }),
    description: '深渊龙王首杀：龙王四件套。'
  },

  // NPC 图纸
  {
    id: 'bp_lin_forager_set',
    name: '樵采套装图纸',
    kind: 'set',
    setId: 'forager_set',
    unlocksRecipeIds: setRecipes('forager_set', {
      ring: 'forager_ring',
      hat: 'forager_hood',
      shoe: 'forager_boots'
    }),
    description: '林老友好：樵采三件套。'
  },
  {
    id: 'bp_yun_escort_set',
    name: '行镖套装图纸',
    kind: 'set',
    setId: 'escort_set',
    unlocksRecipeIds: setRecipes('escort_set', {
      ring: 'escort_ring',
      hat: 'escort_headband',
      shoe: 'escort_boots'
    }),
    description: '云飞友好：行镖三件套。'
  },
  {
    id: 'bp_shi_furnace_set',
    name: '炉工套装图纸',
    kind: 'set',
    setId: 'furnace_set',
    unlocksRecipeIds: setRecipes('furnace_set', {
      ring: 'furnace_ring',
      hat: 'furnace_mask',
      shoe: 'furnace_boots'
    }),
    description: '阿石友好：炉工三件套。'
  },
  {
    id: 'bp_cook_hearth_set',
    name: '灶火套装图纸',
    kind: 'set',
    setId: 'hearth_set',
    unlocksRecipeIds: setRecipes('hearth_set', {
      ring: 'hearth_ring',
      hat: 'hearth_cap',
      shoe: 'hearth_slippers'
    }),
    description: '客栈厨师友好：灶火三件套。'
  },
  {
    id: 'bp_tea_zen_set',
    name: '茶禅套装图纸',
    kind: 'set',
    setId: 'tea_zen_set',
    unlocksRecipeIds: setRecipes('tea_zen_set', {
      ring: 'tea_ring',
      hat: 'tea_hat',
      shoe: 'tea_shoes'
    }),
    description: '茶庄任务链：茶禅三件套。'
  },
  {
    id: 'bp_shrine_harvest_set',
    name: '公祠丰收套装图纸',
    kind: 'set',
    setId: 'shrine_harvest_set',
    unlocksRecipeIds: setRecipes('shrine_harvest_set', {
      ring: 'shrine_ring',
      hat: 'shrine_hat',
      shoe: 'shrine_shoes'
    }),
    description: '祠堂任务：公祠丰收三件套。'
  },
  {
    id: 'bp_fisher_partial',
    name: '渔夫套残图',
    kind: 'single',
    unlocksRecipeIds: [r('ring', 'anglers_ring'), r('hat', 'fisher_hat')],
    description: '秋月友好：渔夫套戒帽。'
  },

  // 矿洞随机掉落单品图（§9.11）
  ...([
    ['bp_drop_miner_ring', '矿工戒残图', 'ring', 'miners_ring'],
    ['bp_drop_miner_helmet', '矿工盔残图', 'hat', 'miner_helmet'],
    ['bp_drop_miner_boots', '矿工靴残图', 'shoe', 'miner_boots'],
    ['bp_drop_forager_ring', '樵采戒残图', 'ring', 'forager_ring'],
    ['bp_drop_forager_hood', '樵采帽残图', 'hat', 'forager_hood'],
    ['bp_drop_forager_boots', '樵采靴残图', 'shoe', 'forager_boots'],
    ['bp_drop_mud_ring', '泥岩戒残图', 'ring', 'mud_golem_band'],
    ['bp_drop_mud_hat', '泥岩冠残图', 'hat', 'mud_crown'],
    ['bp_drop_mud_shoe', '泥岩靴残图', 'shoe', 'mud_stride_boots'],
    ['bp_drop_obsidian_ring', '黑曜戒残图', 'ring', 'stalwart_ring'],
    ['bp_drop_obsidian_hat', '黑曜盔残图', 'hat', 'obsidian_helm'],
    ['bp_drop_obsidian_shoe', '黑曜靴残图', 'shoe', 'obsidian_greaves'],
    ['bp_drop_frost_ring', '冰后戒残图', 'ring', 'frost_queen_circlet'],
    ['bp_drop_frost_hat', '冰后冠残图', 'hat', 'frost_queen_tiara'],
    ['bp_drop_frost_shoe', '冰后靴残图', 'shoe', 'frost_queen_slippers'],
    ['bp_drop_dragon_warrior_ring', '战龙戒残图', 'ring', 'warlord_ring'],
    ['bp_drop_dragon_warrior_hat', '战龙盔残图', 'hat', 'dragon_helm'],
    ['bp_drop_dragon_warrior_shoe', '战龙靴残图', 'shoe', 'dragon_scale_boots'],
    ['bp_drop_lava_ring', '熔岩戒残图', 'ring', 'lava_lord_seal'],
    ['bp_drop_lava_hat', '熔岩冠残图', 'hat', 'lava_lord_crown'],
    ['bp_drop_lava_shoe', '熔岩靴残图', 'shoe', 'lava_lord_greaves'],
    ['bp_drop_phoenix_ring', '凤凰戒残图', 'ring', 'fortune_ring'],
    ['bp_drop_phoenix_hat', '凤凰冠残图', 'hat', 'phoenix_crown'],
    ['bp_drop_phoenix_shoe', '凤凰靴残图', 'shoe', 'phoenix_boots'],
    ['bp_drop_harvest_ring', '丰收戒残图', 'ring', 'harvest_moon_ring'],
    ['bp_drop_harvest_hat', '丰收簪残图', 'hat', 'jade_hairpin'],
    ['bp_drop_crystal_ring', '晶王戒残图', 'ring', 'crystal_king_seal'],
    ['bp_drop_crystal_hat', '晶王冠残图', 'hat', 'crystal_king_crown'],
    ['bp_drop_crystal_shoe', '晶王靴残图', 'shoe', 'crystal_step_boots'],
    ['bp_drop_shadow_sov_ring', '暗影君戒残图', 'ring', 'shadow_sovereign_ring'],
    ['bp_drop_shadow_sov_hat', '暗影君纱残图', 'hat', 'shadow_sovereign_veil'],
    ['bp_drop_shadow_sov_shoe', '暗影君履残图', 'shoe', 'shadow_sovereign_treads']
  ] as const).map(([id, name, cat, defId]) => ({
    id,
    name,
    kind: 'single' as const,
    unlocksRecipeIds: [r(cat, defId)],
    description: `矿洞掉落的${name}。`
  }))
]

export const FORGE_BLUEPRINT_BY_ID: Record<string, ForgeBlueprintDef> = Object.fromEntries(
  FORGE_BLUEPRINTS.map(b => [b.id, b])
)

/** 孙铁匠商店图纸（§9.10） */
export interface SunShopBlueprintEntry {
  blueprintId: string
  price: number
  /** 友好后上架 */
  requiresFriendly?: boolean
}

export const SUN_SHOP_BLUEPRINTS: SunShopBlueprintEntry[] = [
  { blueprintId: 'bp_shop_copper_ring', price: 200 },
  { blueprintId: 'bp_shop_copper_band', price: 250 },
  { blueprintId: 'bp_shop_straw_hat', price: 150 },
  { blueprintId: 'bp_shop_copper_sword', price: 400 },
  { blueprintId: 'bp_shop_miner_ring', price: 600 },
  { blueprintId: 'bp_shop_iron_blade', price: 1200, requiresFriendly: true },
  { blueprintId: 'bp_shop_merchant_ring', price: 1500, requiresFriendly: true }
]

export const getBlueprintById = (id: string): ForgeBlueprintDef | undefined =>
  FORGE_BLUEPRINT_BY_ID[id]

export const getRecipesForBlueprint = (blueprintId: string): ForgeRecipeDef[] => {
  const bp = getBlueprintById(blueprintId)
  if (!bp) return []
  return bp.unlocksRecipeIds
    .map(rid => getForgeRecipeById(rid))
    .filter((recipe): recipe is ForgeRecipeDef => recipe !== undefined)
}

export const getShopBlueprintsForSun = (isFriendly: boolean): SunShopBlueprintEntry[] =>
  SUN_SHOP_BLUEPRINTS.filter(entry => !entry.requiresFriendly || isFriendly)
