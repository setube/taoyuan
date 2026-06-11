import type { Quality } from './item'
import type { Weather } from './game'
import type { EquipmentEffectType } from './ring'

/** 词条稀有度层（决定最低打造品质） */
export type AffixTier = 1 | 2 | 3 | 4

export type ForgeCategory = 'weapon' | 'hat' | 'shoe' | 'ring'

export type AffixEffect =
  | { kind: 'equipment'; type: EquipmentEffectType; baseValue: number }
  | { kind: 'weapon_enchant'; enchantId: string }
  | { kind: 'multi'; effects: { type: EquipmentEffectType; baseValue: number }[] }

export interface AffixDef {
  id: string
  name: string
  description: string
  tier: AffixTier
  categories: ForgeCategory[]
  effect: AffixEffect
  minQuality: Quality
  weight: number
  requiredWeather?: Weather | null
}

/** 图纸（消耗品或学习后记入存档） */
export interface ForgeBlueprintDef {
  id: string
  name: string
  kind: 'single' | 'set'
  /** 学习后写入 useForgeStore.unlockedRecipeIds */
  unlocksRecipeIds: string[]
  setId?: string
  description: string
}

export interface ForgeRecipeDef {
  id: string
  category: ForgeCategory
  targetDefId: string
  setId: string | null
  ingredients: { itemId: string; quantity: number }[]
  moneyCost: number
  requiredForgingLevel: number
  tier: 1 | 2 | 3 | 4
  /** 套装打造：第 1 词条槽固定，不随机（极品第 2 槽仍 roll） */
  fixedAffixId?: string
  isSetPiece: boolean
}

/** 打造装备实例（武器/帽/鞋/戒） */
export interface CraftedEquipmentBase {
  recipeId: string
  quality: Quality
  affixes: { id: string; rolledValue: number }[]
  setId: string | null
  forgedDay: number
  forgeScore: number
  forgedWeather?: Weather
}

/** 武器打造实例 */
export interface CraftedWeapon extends CraftedEquipmentBase {
  defId: string
  rolledAttack: number
  rolledCritRate: number
  enchantmentId: string | null
}

/** 帽/鞋/戒打造实例 */
export interface CraftedAccessory extends CraftedEquipmentBase {
  defId: string
}

/** 存档锻造进度 */
export interface ForgeProgress {
  unlockedRecipeIds: string[]
  defeatedBossFloors: number[]
  sunBlueprintShopPurchased: string[]
}
