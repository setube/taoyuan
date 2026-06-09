import type { Quality, SkillPerk5, SkillPerk10 } from '@/types'

const QUALITY_ORDER: Quality[] = ['normal', 'fine', 'excellent', 'supreme']

/** 市厨 Lv5：食物售价 +15% */
export function getVendorChefSellMult(perk5: SkillPerk5 | null): number {
  return perk5 === 'vendor_chef' ? 1.15 : 1.0
}

/** 备料手：20% 概率节省主料 */
export function rollPrepCookSave(random = Math.random()): boolean {
  return random < 0.2
}

/** 双灶：15% 概率额外 +1 份 */
export function rollDoubleBatch(random = Math.random()): boolean {
  return random < 0.15
}

/** 匠心：25% 概率品质 +1 档 */
export function rollGourmetCraft(random = Math.random()): boolean {
  return random < 0.25
}

/** 烹饪等级被动：每级 2% 概率品质 +1 档（和匠心可叠加，上限极品） */
export function rollCookingLevelUpgrade(cookingLevel: number, random = Math.random()): boolean {
  return random < cookingLevel * 0.02
}

/** 用量最大的原料 itemId（并列取第一个） */
export function pickLargestIngredient(ingredients: { itemId: string; quantity: number }[]): string | null {
  if (ingredients.length === 0) return null
  let best = ingredients[0]!
  for (const ing of ingredients) {
    if (ing.quantity > best.quantity) best = ing
  }
  return best.itemId
}

export function upgradeQualityOneTier(quality: Quality): Quality {
  const idx = QUALITY_ORDER.indexOf(quality)
  return QUALITY_ORDER[Math.min(idx + 1, QUALITY_ORDER.length - 1)]!
}

/** 膳修：buff 数值 ×1.3 */
export function applyBuffChefEffect(value: number, perk10: SkillPerk10 | null): number {
  return perk10 === 'buff_chef' ? Math.floor(value * 1.3) : value
}
