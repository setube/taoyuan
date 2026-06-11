import type { WeaponDef, EnchantmentDef, WeaponType } from '@/types'
import { FORGE_ONLY_WEAPON_DEFS } from '@/data/forgeSets'

/** 附魔定义 */
export const ENCHANTMENTS: Record<string, EnchantmentDef> = {
  sharp: {
    id: 'sharp',
    name: '锋利',
    description: '攻击力+3',
    attackBonus: 3,
    critBonus: 0,
    special: null
  },
  fierce: {
    id: 'fierce',
    name: '炽热',
    description: '攻击力+5',
    attackBonus: 5,
    critBonus: 0,
    special: null
  },
  precise: {
    id: 'precise',
    name: '精准',
    description: '暴击率+10%',
    attackBonus: 0,
    critBonus: 0.1,
    special: null
  },
  vampiric: {
    id: 'vampiric',
    name: '吸血',
    description: '造成伤害的15%回复HP',
    attackBonus: 0,
    critBonus: 0,
    special: 'vampiric'
  },
  sturdy: {
    id: 'sturdy',
    name: '坚韧',
    description: '受到伤害-15%',
    attackBonus: 0,
    critBonus: 0,
    special: 'sturdy'
  },
  lucky: {
    id: 'lucky',
    name: '幸运',
    description: '怪物掉落率+20%',
    attackBonus: 0,
    critBonus: 0,
    special: 'lucky'
  }
}

/** 可用于随机附魔的 ID 列表 */
const RANDOM_ENCHANT_IDS = ['sharp', 'fierce', 'precise', 'vampiric', 'sturdy', 'lucky']

/** 随机获取一个附魔（30% 概率触发） */
export const rollRandomEnchantment = (): string | null => {
  if (Math.random() >= 0.3) return null
  return RANDOM_ENCHANT_IDS[Math.floor(Math.random() * RANDOM_ENCHANT_IDS.length)]!
}

/** 武器类型中文名 */
export const WEAPON_TYPE_NAMES: Record<WeaponType, string> = {
  sword: '剑',
  dagger: '匕首',
  club: '锤'
}

/** 所有武器定义 */
export const WEAPONS: Record<string, WeaponDef> = {
  // === 商店可购买 ===
  wooden_stick: {
    id: 'wooden_stick',
    name: '木棒',
    type: 'club',
    attack: 5,
    critRate: 0.02,
    description: '随手捡的木棒，聊胜于无。',
    shopPrice: null,
    shopMaterials: [],
    fixedEnchantment: null
  },
  copper_sword: {
    id: 'copper_sword',
    name: '铜剑',
    type: 'sword',
    attack: 12,
    critRate: 0.05,
    description: '铜铸的短剑，可靠的入门武器。',
    shopPrice: 300,
    shopMaterials: [{ itemId: 'copper_ore', quantity: 5 }],
    fixedEnchantment: null
  },
  iron_blade: {
    id: 'iron_blade',
    name: '铁刀',
    type: 'sword',
    attack: 18,
    critRate: 0.05,
    description: '精铁打造的长刀，锋利坚固。',
    shopPrice: 800,
    shopMaterials: [{ itemId: 'iron_ore', quantity: 5 }],
    fixedEnchantment: null
  },
  war_hammer: {
    id: 'war_hammer',
    name: '战锤',
    type: 'club',
    attack: 22,
    critRate: 0.03,
    description: '沉重的铁锤，一击碎石。',
    shopPrice: 1200,
    shopMaterials: [{ itemId: 'iron_ore', quantity: 8 }],
    fixedEnchantment: null
  },
  gold_halberd: {
    id: 'gold_halberd',
    name: '金戟',
    type: 'sword',
    attack: 28,
    critRate: 0.08,
    description: '金光闪烁的长戟，威力非凡。',
    shopPrice: 2500,
    shopMaterials: [{ itemId: 'gold_ore', quantity: 8 }],
    fixedEnchantment: null
  },
  // === 怪物掉落 ===
  bone_dagger: {
    id: 'bone_dagger',
    name: '骨匕',
    type: 'dagger',
    attack: 9,
    critRate: 0.15,
    description: '怪物骨骼磨制的匕首，锐利无比。',
    shopPrice: null,
    shopMaterials: [],
    fixedEnchantment: null
  },
  frost_dagger: {
    id: 'frost_dagger',
    name: '冰锋匕',
    type: 'dagger',
    attack: 16,
    critRate: 0.18,
    description: '寒冰凝成的匕首，触之刺骨。',
    shopPrice: null,
    shopMaterials: [],
    fixedEnchantment: null
  },
  shadow_blade: {
    id: 'shadow_blade',
    name: '暗影之刃',
    type: 'dagger',
    attack: 24,
    critRate: 0.22,
    description: '暗影凝聚的利刃，杀人于无形。',
    shopPrice: null,
    shopMaterials: [],
    fixedEnchantment: null
  },
  // === BOSS 掉落（固定附魔） ===
  mud_king_fang: {
    id: 'mud_king_fang',
    name: '泥王之牙',
    type: 'sword',
    attack: 20,
    critRate: 0.12,
    description: '泥岩巨兽的獠牙铸成，夺命汲血。',
    shopPrice: null,
    shopMaterials: [],
    fixedEnchantment: 'vampiric'
  },
  frost_queen_sting: {
    id: 'frost_queen_sting',
    name: '冰霜之刺',
    type: 'dagger',
    attack: 19,
    critRate: 0.25,
    description: '冰霜女王遗留的利刺，百发百中。',
    shopPrice: null,
    shopMaterials: [],
    fixedEnchantment: 'precise'
  },
  lava_lord_maul: {
    id: 'lava_lord_maul',
    name: '熔岩之锤',
    type: 'club',
    attack: 38,
    critRate: 0.08,
    description: '熔岩君主的权杖，炽热如焰。',
    shopPrice: null,
    shopMaterials: [],
    fixedEnchantment: 'fierce'
  },
  // === 新区域怪物掉落 ===
  crystal_shard_dagger: {
    id: 'crystal_shard_dagger',
    name: '晶棘匕',
    type: 'dagger',
    attack: 30,
    critRate: 0.2,
    description: '水晶碎片凝成的锐利匕首。',
    shopPrice: null,
    shopMaterials: [],
    fixedEnchantment: null
  },
  shadow_katana: {
    id: 'shadow_katana',
    name: '暗影太刀',
    type: 'sword',
    attack: 35,
    critRate: 0.1,
    description: '暗影裂隙中浮现的太刀，斩断光明。',
    shopPrice: null,
    shopMaterials: [],
    fixedEnchantment: null
  },
  void_hammer: {
    id: 'void_hammer',
    name: '虚空战锤',
    type: 'club',
    attack: 48,
    critRate: 0.05,
    description: '深渊之力灌注的战锤，沉若千钧。',
    shopPrice: null,
    shopMaterials: [],
    fixedEnchantment: null
  },
  // === 新区域商店武器 ===
  crystal_blade: {
    id: 'crystal_blade',
    name: '水晶长剑',
    type: 'sword',
    attack: 35,
    critRate: 0.08,
    description: '水晶矿石铸成的长剑，折射七彩光芒。',
    shopPrice: 5000,
    shopMaterials: [{ itemId: 'crystal_ore', quantity: 8 }],
    fixedEnchantment: null
  },
  shadow_mace: {
    id: 'shadow_mace',
    name: '暗影锤',
    type: 'club',
    attack: 42,
    critRate: 0.05,
    description: '暗影矿石锻造的重锤，一击溃敌。',
    shopPrice: 8000,
    shopMaterials: [{ itemId: 'shadow_ore', quantity: 8 }],
    fixedEnchantment: null
  },
  void_katana: {
    id: 'void_katana',
    name: '虚空太刀',
    type: 'sword',
    attack: 52,
    critRate: 0.1,
    description: '虚空矿石淬炼的极品太刀，斩天裂地。',
    shopPrice: 15000,
    shopMaterials: [{ itemId: 'void_ore', quantity: 10 }],
    fixedEnchantment: null
  },
  // === 新区域BOSS掉落（固定附魔） ===
  crystal_king_blade: {
    id: 'crystal_king_blade',
    name: '晶王圣剑',
    type: 'sword',
    attack: 45,
    critRate: 0.15,
    description: '水晶之王遗留的圣剑，幸运之光环绕。',
    shopPrice: null,
    shopMaterials: [],
    fixedEnchantment: 'lucky'
  },
  shadow_sovereign_fang: {
    id: 'shadow_sovereign_fang',
    name: '暗影之牙',
    type: 'dagger',
    attack: 38,
    critRate: 0.3,
    description: '暗影君主的牙齿铸成，饮血不止。',
    shopPrice: null,
    shopMaterials: [],
    fixedEnchantment: 'vampiric'
  },
  abyss_dragon_mace: {
    id: 'abyss_dragon_mace',
    name: '龙王权杖',
    type: 'club',
    attack: 60,
    critRate: 0.12,
    description: '深渊龙王的权杖，焚尽万物。',
    shopPrice: null,
    shopMaterials: [],
    fixedEnchantment: 'fierce'
  },

  // === 新增商店武器 ===
  bamboo_staff: {
    id: 'bamboo_staff',
    name: '竹杖',
    type: 'club',
    attack: 10,
    critRate: 0.03,
    description: '坚韧的毛竹削成的长杖，轻便趁手。',
    shopPrice: 400,
    shopMaterials: [{ itemId: 'bamboo', quantity: 5 }],
    fixedEnchantment: null
  },
  iron_dagger: {
    id: 'iron_dagger',
    name: '铁匕',
    type: 'dagger',
    attack: 14,
    critRate: 0.15,
    description: '精铁打磨的短匕，出手极快。',
    shopPrice: 600,
    shopMaterials: [{ itemId: 'iron_ore', quantity: 3 }],
    fixedEnchantment: null
  },
  golden_fan: {
    id: 'golden_fan',
    name: '金扇',
    type: 'sword',
    attack: 26,
    critRate: 0.1,
    description: '镶金铁骨扇，展开如刃，合拢如棍。',
    shopPrice: 2000,
    shopMaterials: [{ itemId: 'gold_ore', quantity: 5 }],
    fixedEnchantment: null
  },
  obsidian_blade: {
    id: 'obsidian_blade',
    name: '黑曜刀',
    type: 'sword',
    attack: 38,
    critRate: 0.08,
    description: '黑曜石锻造的弯刀，刀锋削铁如泥。',
    shopPrice: 4000,
    shopMaterials: [{ itemId: 'shadow_ore', quantity: 5 }],
    fixedEnchantment: null
  },

  // === 新增怪物掉落武器 ===
  slime_mace: {
    id: 'slime_mace',
    name: '粘液锤',
    type: 'club',
    attack: 7,
    critRate: 0.02,
    description: '凝固的粘液核心，意外地沉重。',
    shopPrice: null,
    shopMaterials: [],
    fixedEnchantment: null
  },
  magma_blade: {
    id: 'magma_blade',
    name: '熔岩刃',
    type: 'sword',
    attack: 21,
    critRate: 0.08,
    description: '岩浆凝结的短刃，仍散发余热。',
    shopPrice: null,
    shopMaterials: [],
    fixedEnchantment: null
  },
  prism_dagger: {
    id: 'prism_dagger',
    name: '棱晶匕',
    type: 'dagger',
    attack: 28,
    critRate: 0.22,
    description: '水晶碎片天然形成的锐利匕首。',
    shopPrice: null,
    shopMaterials: [],
    fixedEnchantment: null
  },
  void_fang_dagger: {
    id: 'void_fang_dagger',
    name: '虚空之牙',
    type: 'dagger',
    attack: 42,
    critRate: 0.25,
    description: '深渊巨蟒的毒牙，蕴含腐蚀之力。',
    shopPrice: null,
    shopMaterials: [],
    fixedEnchantment: null
  },

  // === 新增宝箱掉落武器 ===
  jade_sword: {
    id: 'jade_sword',
    name: '翡翠长剑',
    type: 'sword',
    attack: 22,
    critRate: 0.1,
    description: '宝箱中沉睡的古剑，翠光流转。',
    shopPrice: null,
    shopMaterials: [],
    fixedEnchantment: null
  },
  ancient_blade: {
    id: 'ancient_blade',
    name: '古神剑',
    type: 'sword',
    attack: 50,
    critRate: 0.15,
    description: '远古遗迹中发现的神秘长剑，威能不减。',
    shopPrice: null,
    shopMaterials: [],
    fixedEnchantment: null
  },

  // === 公会专属 ===
  guild_war_blade: {
    id: 'guild_war_blade',
    name: '公会战刃',
    type: 'sword',
    attack: 36,
    critRate: 0.1,
    description: '冒险家公会为精英成员锻造的佩剑，剑身刻有公会徽记。',
    shopPrice: null,
    shopMaterials: [],
    fixedEnchantment: null
  },

  // === 通商兑换 ===
  trade_desert_blade: {
    id: 'trade_desert_blade',
    name: '沙漠弯刀',
    type: 'sword',
    attack: 40,
    critRate: 0.08,
    description: '西域锻造的弯刀，刃口如月牙般弯曲，锋利无比。',
    shopPrice: null,
    shopMaterials: [],
    fixedEnchantment: null
  },
  ...FORGE_ONLY_WEAPON_DEFS
}
export const SHOP_WEAPONS: WeaponDef[] = Object.values(WEAPONS).filter(w => w.shopPrice !== null)

/** 各区域怪物可掉落的武器 ID */
export const MONSTER_DROP_WEAPONS: Record<string, { weaponId: string; chance: number }[]> = {
  shallow: [
    { weaponId: 'bone_dagger', chance: 0.05 },
    { weaponId: 'slime_mace', chance: 0.03 }
  ],
  frost: [{ weaponId: 'frost_dagger', chance: 0.05 }],
  lava: [
    { weaponId: 'shadow_blade', chance: 0.05 },
    { weaponId: 'magma_blade', chance: 0.04 }
  ],
  crystal: [
    { weaponId: 'crystal_shard_dagger', chance: 0.05 },
    { weaponId: 'prism_dagger', chance: 0.04 }
  ],
  shadow: [{ weaponId: 'shadow_katana', chance: 0.05 }],
  abyss: [
    { weaponId: 'void_hammer', chance: 0.05 },
    { weaponId: 'void_fang_dagger', chance: 0.03 }
  ]
}

/** BOSS 掉落武器映射 */
export const BOSS_DROP_WEAPONS: Record<number, string> = {
  20: 'mud_king_fang',
  40: 'frost_queen_sting',
  60: 'lava_lord_maul',
  80: 'crystal_king_blade',
  100: 'shadow_sovereign_fang',
  120: 'abyss_dragon_mace'
}

/** 根据 ID 获取武器定义 */
export const getWeaponById = (id: string): WeaponDef | undefined => {
  return WEAPONS[id]
}

/** 根据 ID 获取附魔定义 */
export const getEnchantmentById = (id: string): EnchantmentDef | undefined => {
  return ENCHANTMENTS[id]
}

/** 计算武器卖出价格 */
export const getWeaponSellPrice = (defId: string, enchantmentId: string | null): number => {
  const def = WEAPONS[defId]
  if (!def) return 0
  const base = def.shopPrice ? Math.floor(def.shopPrice * 0.5) : def.attack * 15
  // 附魔额外加价
  if (enchantmentId) {
    const enchant = ENCHANTMENTS[enchantmentId]
    if (enchant) return base + 100 + enchant.attackBonus * 20
  }
  return base
}

/** 获取附魔武器的显示名称 */
export const getWeaponDisplayName = (defId: string, enchantmentId: string | null): string => {
  const weapon = WEAPONS[defId]
  if (!weapon) return defId
  if (!enchantmentId) return weapon.name
  const enchant = ENCHANTMENTS[enchantmentId]
  if (!enchant) return weapon.name
  return `${enchant.name}的${weapon.name}`
}

/** 宝箱掉落武器（按矿洞区域） */
export const TREASURE_DROP_WEAPONS: Record<string, { weaponId: string; chance: number }[]> = {
  shallow: [],
  frost: [{ weaponId: 'jade_sword', chance: 0.05 }],
  lava: [{ weaponId: 'jade_sword', chance: 0.04 }],
  crystal: [],
  shadow: [{ weaponId: 'ancient_blade', chance: 0.03 }],
  abyss: [{ weaponId: 'ancient_blade', chance: 0.025 }]
}
