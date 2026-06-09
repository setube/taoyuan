/** 物品分类 */
export type ItemCategory =
  | 'seed'
  | 'crop'
  | 'fish'
  | 'ore'
  | 'gem'
  | 'gift'
  | 'food'
  | 'material'
  | 'misc'
  | 'processed'
  | 'machine'
  | 'sprinkler'
  | 'fertilizer'
  | 'animal_product'
  | 'sapling'
  | 'fruit'
  | 'bait'
  | 'tackle'
  | 'bomb'
  | 'fossil'
  | 'artifact'
  | 'weapon'
  | 'ring'
  | 'hat'
  | 'shoe'

/** 物品品质 */
export type Quality = 'normal' | 'fine' | 'excellent' | 'supreme'

/** 物品基础定义（配置数据用） */
export interface ItemDef {
  id: string
  name: string
  category: ItemCategory
  description: string
  sellPrice: number
  /** 是否可以食用 */
  edible: boolean
  /** 食用恢复体力 */
  staminaRestore?: number
  /** 食用恢复生命值 */
  healthRestore?: number
}

/** 背包中的物品实例 */
export interface InventoryItem {
  itemId: string
  quantity: number
  quality: Quality
  locked?: boolean
  /** 是否来自温室种植（仅 fruit 类有用） */
  fromGreenhouse?: boolean
}

/** 工具等级 */
export type ToolTier = 'basic' | 'iron' | 'steel' | 'iridium'

/** 工具类型 */
export type ToolType = 'wateringCan' | 'hoe' | 'pickaxe' | 'fishingRod' | 'scythe' | 'axe' | 'pan'

/** 工具实例 */
export interface Tool {
  type: ToolType
  tier: ToolTier
}

/** 武器类型 */
export type WeaponType = 'sword' | 'dagger' | 'club'

/** 武器定义 */
export interface WeaponDef {
  id: string
  name: string
  type: WeaponType
  attack: number
  critRate: number
  description: string
  /** 商店购买价格（null = 不可购买） */
  shopPrice: number | null
  /** 购买所需材料 */
  shopMaterials: { itemId: string; quantity: number }[]
  /** 固定附魔（BOSS 武器） */
  fixedEnchantment: string | null
}

/** 附魔定义 */
export interface EnchantmentDef {
  id: string
  name: string
  description: string
  attackBonus: number
  critBonus: number
  special: 'vampiric' | 'sturdy' | 'lucky' | null
}

/** 拥有的武器实例 */
export interface OwnedWeapon {
  defId: string
  enchantmentId: string | null
}

/** 箱子阶梯 */
export type ChestTier = 'wood' | 'copper' | 'iron' | 'gold' | 'void'

/** 虚空箱子角色 */
export type VoidChestRole = 'none' | 'input' | 'output'

/** 箱子实例 */
export interface Chest {
  id: string
  tier: ChestTier
  label: string
  items: InventoryItem[]
  voidRole: VoidChestRole
  /** 绑定分类（空=不限制；每分类全仓库仅可绑一个箱子） */
  filterCategories: ItemCategory[]
}
