import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { RecipeDef, Quality } from '@/types'
import { getRecipeById } from '@/data'
import { useInventoryStore } from './useInventoryStore'
import { usePlayerStore } from './usePlayerStore'
import { useSkillStore } from './useSkillStore'
import { useAchievementStore } from './useAchievementStore'
import { useWalletStore } from './useWalletStore'
import { useHomeStore } from './useHomeStore'
import { useHiddenNpcStore } from './useHiddenNpcStore'
import { getCombinedItemCount, removeCombinedItem, getLowestCombinedQuality } from '@/composables/useCombinedInventory'
import {
  applyBuffChefEffect,
  pickLargestIngredient,
  rollDoubleBatch,
  rollGourmetCraft,
  rollCookingLevelUpgrade,
  rollPrepCookSave,
  upgradeQualityOneTier
} from '@/composables/cookingPerks'

const QUALITY_ORDER: Quality[] = ['normal', 'fine', 'excellent', 'supreme']
const QUALITY_MULTIPLIER: Record<Quality, number> = { normal: 1, fine: 1.25, excellent: 1.5, supreme: 2 }
const QUALITY_LABEL: Record<Quality, string> = { normal: '', fine: '优良', excellent: '精品', supreme: '极品' }

export const useCookingStore = defineStore('cooking', () => {
  const inventoryStore = useInventoryStore()
  const playerStore = usePlayerStore()
  const skillStore = useSkillStore()

  /** 已解锁的食谱ID列表 */
  const unlockedRecipes = ref<string[]>([
    'stir_fried_cabbage',
    'honey_tea',
    'ginger_soup',
    'bamboo_shoot_stir_fry',
    'dried_persimmon',
    'sesame_paste',
    'corn_pancake',
    'scrambled_egg_rice',
    'stir_fried_potato',
    'boiled_egg',
    'congee',
    'roasted_sweet_potato',
    'vegetable_soup',
    'chive_egg_stir_fry',
    'peanut_candy',
    'silkie_egg_soup'
  ])

  /** 当天生效的食物增益 */
  const activeBuff = ref<RecipeDef['effect']['buff'] | null>(null)
  /** 膳修：buff 额外持续日数（日结后仍保留） */
  const activeBuffExtraDays = ref(0)

  /** 已解锁的食谱定义 */
  const recipes = computed(() => unlockedRecipes.value.map(id => getRecipeById(id)).filter((r): r is RecipeDef => r !== undefined))

  /** 检查是否有足够材料 */
  const canCook = (recipeId: string): boolean => {
    const recipe = getRecipeById(recipeId)
    if (!recipe) return false
    if (!unlockedRecipes.value.includes(recipeId)) return false
    // 检查技能等级门槛
    if (recipe.requiredSkill) {
      const skill = skillStore.getSkill(recipe.requiredSkill.type)
      if (skill.level < recipe.requiredSkill.level) return false
    }
    return recipe.ingredients.every(ing => getCombinedItemCount(ing.itemId) >= ing.quantity)
  }

  /** 计算最多能烹饪几份 */
  const maxCookable = (recipeId: string): number => {
    const recipe = getRecipeById(recipeId)
    if (!recipe) return 0
    if (!unlockedRecipes.value.includes(recipeId)) return 0
    if (recipe.requiredSkill) {
      const skill = skillStore.getSkill(recipe.requiredSkill.type)
      if (skill.level < recipe.requiredSkill.level) return 0
    }
    let max = Infinity
    for (const ing of recipe.ingredients) {
      const available = getCombinedItemCount(ing.itemId)
      max = Math.min(max, Math.floor(available / ing.quantity))
    }
    return max === Infinity ? 0 : max
  }

  /** 预览烹饪品质（取所有材料最低品质） */
  const previewCookQuality = (recipeId: string): Quality => {
    const recipe = getRecipeById(recipeId)
    if (!recipe) return 'normal'
    let minIdx = 3
    for (const ing of recipe.ingredients) {
      const q = getLowestCombinedQuality(ing.itemId)
      const idx = QUALITY_ORDER.indexOf(q)
      if (idx < minIdx) minIdx = idx
    }
    return QUALITY_ORDER[minIdx]!
  }

  /** 烹饪 */
  const cook = (recipeId: string, quantity: number = 1): { success: boolean; message: string } => {
    const recipe = getRecipeById(recipeId)
    if (!recipe) return { success: false, message: '食谱不存在。' }
    if (!unlockedRecipes.value.includes(recipeId)) return { success: false, message: '尚未解锁此食谱。' }

    // 计算最多能做几份
    let maxPossible = quantity
    for (const ing of recipe.ingredients) {
      const available = getCombinedItemCount(ing.itemId)
      maxPossible = Math.min(maxPossible, Math.floor(available / ing.quantity))
    }
    if (maxPossible <= 0) return { success: false, message: '材料不足。' }

    // 计算品质（取所有材料中最低品质）
    let minQualityIndex = 3
    for (const ing of recipe.ingredients) {
      const quality = getLowestCombinedQuality(ing.itemId)
      const idx = QUALITY_ORDER.indexOf(quality)
      if (idx < minQualityIndex) minQualityIndex = idx
    }
    let resultQuality = QUALITY_ORDER[minQualityIndex]!
    const cookingSkill = skillStore.getSkill('cooking')
    // 每级被动：2% 概率品质 +1 档（上限极品）
    if (rollCookingLevelUpgrade(cookingSkill.level)) {
      resultQuality = upgradeQualityOneTier(resultQuality)
    }
    // 匠心 Lv10：额外 25% 概率再 +1 档
    if (cookingSkill.perk10 === 'gourmet_craft' && rollGourmetCraft()) {
      resultQuality = upgradeQualityOneTier(resultQuality)
    }

    const prepSave =
      cookingSkill.perk5 === 'prep_cook' && rollPrepCookSave() ? pickLargestIngredient(recipe.ingredients) : null

    // 批量消耗材料
    for (const ing of recipe.ingredients) {
      let need = ing.quantity * maxPossible
      if (prepSave === ing.itemId) need -= ing.quantity
      if (need > 0) removeCombinedItem(ing.itemId, need)
    }

    let outputQty = maxPossible
    if (cookingSkill.perk10 === 'double_batch' && rollDoubleBatch()) outputQty += 1

    inventoryStore.addItem(`food_${recipe.id}`, outputQty, resultQuality)
    for (let i = 0; i < maxPossible; i++) {
      useAchievementStore().recordRecipeCooked()
    }
    skillStore.addExp('cooking', 5 * maxPossible)

    const qualityTag = QUALITY_LABEL[resultQuality] ? `【${QUALITY_LABEL[resultQuality]}】` : ''
    const qtyTag = outputQty > 1 ? `${outputQty}份` : ''
    return { success: true, message: `烹饪了${qtyTag}${qualityTag}${recipe.name}！` }
  }

  /** 食用烹饪品 */
  const eat = (recipeId: string, quality: Quality = 'normal'): { success: boolean; message: string } => {
    const foodItemId = `food_${recipeId}`
    if (!inventoryStore.removeItem(foodItemId, 1, quality)) {
      return { success: false, message: '背包中没有这个食物。' }
    }

    const recipe = getRecipeById(recipeId)
    if (!recipe) return { success: false, message: '食谱数据丢失。' }

    // 品质加成
    const qualityBonus = QUALITY_MULTIPLIER[quality]
    // 炼金师专精：食物恢复+50%
    const walletStore = useWalletStore()
    const homeStore = useHomeStore()
    const chefBonus = 1 + walletStore.getCookingRestoreBonus()
    const alchemistBonus = skillStore.getSkill('foraging').perk10 === 'alchemist' ? 1.5 : 1.0
    const kitchenBonus = homeStore.getKitchenBonus()
    // 仙缘能力：月膳（yue_tu_2）食物恢复+50%
    const moonRabbitBonus = useHiddenNpcStore().isAbilityActive('yue_tu_2') ? 1.5 : 1.0
    const staminaRestore = Math.floor(
      recipe.effect.staminaRestore * qualityBonus * alchemistBonus * chefBonus * kitchenBonus * moonRabbitBonus
    )
    playerStore.restoreStamina(staminaRestore)
    const qualityTag = QUALITY_LABEL[quality] ? `【${QUALITY_LABEL[quality]}】` : ''
    let msg = `食用了${qualityTag}${recipe.name}，恢复${staminaRestore}体力`

    if (recipe.effect.healthRestore) {
      const healthRestore = Math.floor(
        recipe.effect.healthRestore * qualityBonus * alchemistBonus * chefBonus * kitchenBonus * moonRabbitBonus
      )
      playerStore.restoreHealth(healthRestore)
      msg += `、${healthRestore}生命值`
    }
    msg += '。'

    if (recipe.effect.buff) {
      const buffChef = skillStore.getSkill('cooking').perk10 === 'buff_chef'
      const buffValue = buffChef ? applyBuffChefEffect(recipe.effect.buff.value, 'buff_chef') : recipe.effect.buff.value
      activeBuff.value = { ...recipe.effect.buff, value: buffValue }
      if (buffChef) activeBuffExtraDays.value = 1
      msg += ` ${recipe.effect.buff.description}`
      // 「体力全恢复」类buff：立即将体力回满
      if (recipe.effect.buff.type === 'stamina') {
        playerStore.restoreStamina(playerStore.maxStamina)
      }
    }

    return { success: true, message: msg }
  }

  /** 解锁食谱 */
  const unlockRecipe = (recipeId: string): boolean => {
    if (unlockedRecipes.value.includes(recipeId)) return false
    const recipe = getRecipeById(recipeId)
    if (!recipe) return false
    unlockedRecipes.value.push(recipeId)
    return true
  }

  /** 每日重置增益 */
  const dailyReset = () => {
    if (activeBuffExtraDays.value > 0) {
      activeBuffExtraDays.value--
      return
    }
    activeBuff.value = null
  }

  const serialize = () => {
    return {
      unlockedRecipes: unlockedRecipes.value,
      activeBuff: activeBuff.value,
      activeBuffExtraDays: activeBuffExtraDays.value
    }
  }

  const deserialize = (data: ReturnType<typeof serialize>) => {
    unlockedRecipes.value = data.unlockedRecipes
    activeBuff.value = data.activeBuff
    activeBuffExtraDays.value = data.activeBuffExtraDays ?? 0
  }

  return {
    unlockedRecipes,
    activeBuff,
    recipes,
    canCook,
    maxCookable,
    previewCookQuality,
    cook,
    eat,
    unlockRecipe,
    dailyReset,
    serialize,
    deserialize
  }
})
