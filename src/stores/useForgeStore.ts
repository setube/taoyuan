import { ref } from 'vue'
import { defineStore } from 'pinia'
import { getBlueprintById, SUN_SHOP_BLUEPRINTS } from '@/data/forgeBlueprints'
import { getForgeRecipeById } from '@/data/forge'
import { getCombinedItemCount, removeCombinedItem } from '@/composables/useCombinedInventory'
import {
  forgeExpFromCraft,
  practiceExpFromScore,
  rollAffixes,
  rollForgeQuality,
  rollWeaponStats
} from '@/composables/forgeRoll'
import { BOSS_MONSTERS } from '@/data/mine'
import { FORGE_LESSON_BY_ID } from '@/data/forgeLessons'
import {
  FORGE_QUEST_TEMPLATES,
  formatForgeQuestRewardText,
  type ActiveForgeQuest,
  type CompletedForgeQuest,
  type ForgeBoardQuest,
  type ForgeQuestTemplate
} from '@/data/forgeQuests'
import {
  getNewNpcForgeBlueprintGifts,
  NPC_FORGE_BLUEPRINT_GIFTS,
  npcForgeGiftKey
} from '@/data/forgeNpcGifts'
import type { FriendshipLevel } from '@/types'
import { usePlayerStore } from './usePlayerStore'
import { useSkillStore } from './useSkillStore'
import { useInventoryStore } from './useInventoryStore'
import { useGameStore } from './useGameStore'
import { useNpcStore } from './useNpcStore'
import { getForgingPerkBonuses } from '@/composables/forgingPerks'
import { QUALITY_RANK } from '@/composables/craftedEquipment'
import { getAffixById, getAffixPool } from '@/data/affixes'
import type { ForgeCategory, ForgeRecipeDef } from '@/types/forge'
import type { OwnedHat, OwnedRing, OwnedShoe, OwnedWeapon, Quality, ToolType } from '@/types'
import { getUpgradeCost, TIER_NAMES, TOOL_NAMES } from '@/data/upgrades'

export interface ForgeStats {
  totalForges: number
  supremeCount: number
  practiceCount: number
}

export const useForgeStore = defineStore('forge', () => {
  const unlockedRecipeIds = ref<string[]>([])
  const defeatedBossFloors = ref<number[]>([])
  const sunBlueprintShopPurchased = ref<string[]>([])
  const forgeStats = ref<ForgeStats>({ totalForges: 0, supremeCount: 0, practiceCount: 0 })

  const lessonsSeen = ref<string[]>([])
  const lastLessonDay = ref(-1)
  const pendingRecipeId = ref<string | null>(null)
  const forgePanelUnlocked = ref(false)
  const claimedNpcBlueprintGifts = ref<string[]>([])
  const rhythmZoneBonus = ref(0)
  const qualityWeightBonus = ref(0)
  const forgeBoardQuests = ref<ForgeBoardQuest[]>([])
  const activeForgeQuests = ref<ActiveForgeQuest[]>([])
  const completedForgeQuests = ref<CompletedForgeQuest[]>([])
  const affixRerollCount = ref(0)
  const lastBoardRefreshWeek = ref(-1)
  let nextQuestInstanceId = 1

  const isRecipeUnlocked = (recipeId: string): boolean =>
    unlockedRecipeIds.value.includes(recipeId)

  const effectiveForgeMoney = (recipe: ForgeRecipeDef): number => {
    const perks = getForgingPerkBonuses()
    const discount =
      recipe.category === 'weapon' ? 0 : perks.moneyDiscount
    return Math.max(0, Math.floor(recipe.moneyCost * (1 - discount)))
  }

  const effectiveMaterialQty = (recipe: ForgeRecipeDef, qty: number): number => {
    const perks = getForgingPerkBonuses()
    if (recipe.category === 'weapon') return qty
    if (perks.accessoryMaterialDiscount <= 0) return qty
    return Math.max(1, Math.ceil(qty * (1 - perks.accessoryMaterialDiscount)))
  }

  const canStartForge = (recipeId: string): { ok: boolean; reason?: string } => {
    const recipe = getForgeRecipeById(recipeId)
    if (!recipe) return { ok: false, reason: 'invalid_recipe' }
    if (!isRecipeUnlocked(recipeId)) return { ok: false, reason: 'locked' }

    const skillStore = useSkillStore()
    if (skillStore.getSkill('forging').level < recipe.requiredForgingLevel) {
      return { ok: false, reason: 'skill_level' }
    }

    const playerStore = usePlayerStore()
    if (playerStore.money < effectiveForgeMoney(recipe)) return { ok: false, reason: 'money' }

    for (const ing of recipe.ingredients) {
      const need = effectiveMaterialQty(recipe, ing.quantity)
      if (getCombinedItemCount(ing.itemId) < need) {
        return { ok: false, reason: 'materials' }
      }
    }
    return { ok: true }
  }

  const startForge = (recipeId: string): { ok: boolean; reason?: string } => {
    if (pendingRecipeId.value) return { ok: false, reason: 'pending' }
    const check = canStartForge(recipeId)
    if (!check.ok) return check

    const recipe = getForgeRecipeById(recipeId)!
    const playerStore = usePlayerStore()

    for (const ing of recipe.ingredients) {
      const need = effectiveMaterialQty(recipe, ing.quantity)
      if (!removeCombinedItem(ing.itemId, need)) {
        return { ok: false, reason: 'materials' }
      }
    }
    playerStore.money -= effectiveForgeMoney(recipe)
    pendingRecipeId.value = recipeId
    return { ok: true }
  }

  const cancelPendingForge = () => {
    pendingRecipeId.value = null
  }

  const completeForge = (forgeScore: number): { ok: boolean; reason?: string } => {
    const recipeId = pendingRecipeId.value
    if (!recipeId) return { ok: false, reason: 'no_pending' }

    const recipe = getForgeRecipeById(recipeId)
    if (!recipe) {
      pendingRecipeId.value = null
      return { ok: false, reason: 'invalid_recipe' }
    }

    const gameStore = useGameStore()
    const skillStore = useSkillStore()
    const inventoryStore = useInventoryStore()
    const forgingLevel = skillStore.getSkill('forging').level
    const weather = gameStore.weather
    const perks = getForgingPerkBonuses()

    const quality = rollForgeQuality({
      forgeScore,
      forgingLevel,
      weather,
      qualityUpgradeBonus: perks.qualityBonus
    })

    const affixes = rollAffixes({
      category: recipe.category,
      quality,
      weather,
      forgingLevel,
      fixedAffixId: recipe.fixedAffixId,
      isSetPiece: recipe.isSetPiece,
      t4WeightBonus: perks.t4WeightBonus,
      setAffixMult: recipe.isSetPiece ? perks.setAffixMult : 1
    })

    const baseFields = {
      recipeId: recipe.id,
      quality,
      affixes,
      setId: recipe.setId,
      forgedDay: gameStore.day,
      forgeScore,
      forgedWeather: weather
    }

    if (recipe.category === 'weapon') {
      const { rolledAttack, rolledCritRate } = rollWeaponStats(
        recipe.targetDefId,
        quality,
        forgingLevel
      )
      const weapon: OwnedWeapon = {
        defId: recipe.targetDefId,
        enchantmentId: null,
        ...baseFields,
        rolledAttack,
        rolledCritRate
      }
      inventoryStore.addCraftedWeapon(weapon)
    } else if (recipe.category === 'ring') {
      const ring: OwnedRing = { defId: recipe.targetDefId, ...baseFields }
      inventoryStore.addCraftedRing(ring)
    } else if (recipe.category === 'hat') {
      const hat: OwnedHat = { defId: recipe.targetDefId, ...baseFields }
      inventoryStore.addCraftedHat(hat)
    } else {
      const shoe: OwnedShoe = { defId: recipe.targetDefId, ...baseFields }
      inventoryStore.addCraftedShoe(shoe)
    }

    let exp = forgeExpFromCraft(recipe.tier, recipe.category, quality, forgeScore, perks.expMult)

    addForgingExp(exp)

    forgeStats.value.totalForges++
    if (quality === 'supreme') forgeStats.value.supremeCount++

    _onForgeCompleted(recipe.category, quality, forgeScore)

    pendingRecipeId.value = null
    return { ok: true }
  }

  /** §4.3 练习打铁（不产出装备、不扣材料） */
  const completePractice = (forgeScore: number): { ok: boolean; exp: number } => {
    const perks = getForgingPerkBonuses()
    const exp = practiceExpFromScore(forgeScore, perks.practiceExpBonus, perks.expMult)
    addForgingExp(exp)
    forgeStats.value.practiceCount++
    return { ok: true, exp }
  }

  const _grantForgeQuestReward = (tpl: ForgeQuestTemplate) => {
    addForgingExp(tpl.expReward)
    usePlayerStore().earnMoney(tpl.moneyReward)
    if (tpl.friendshipReward) {
      try {
        useNpcStore().adjustFriendship(tpl.issuerNpcId, tpl.friendshipReward)
      } catch {
        /* pinia 未就绪 */
      }
    }
  }

  const _purgeExpiredForgeQuests = () => {
    const today = useGameStore().day
    const prev = activeForgeQuests.value
    if (prev.every(q => today <= q.deadlineDay)) return
    activeForgeQuests.value = prev.filter(q => today <= q.deadlineDay)
  }

  const _questTarget = (tpl: ForgeQuestTemplate): number => {
    if (tpl.type === 'forge_material') return tpl.materialQty ?? 1
    if (tpl.type === 'forge_deliver') return 1
    return tpl.count ?? 1
  }

  const _findDeliverItemIndex = (tpl: ForgeQuestTemplate): { category: ForgeCategory; index: number } | null => {
    if (tpl.type !== 'forge_deliver' || !tpl.category) return null
    const minRank = tpl.minQuality ? QUALITY_RANK[tpl.minQuality] : 0
    const inventoryStore = useInventoryStore()

    const match = <T extends { defId: string; quality?: Quality; recipeId?: string }>(
      items: T[],
      category: ForgeCategory
    ): { category: ForgeCategory; index: number } | null => {
      for (let i = 0; i < items.length; i++) {
        const item = items[i]!
        if (!item.quality || !item.recipeId) continue
        if (tpl.targetDefId && item.defId !== tpl.targetDefId) continue
        if (QUALITY_RANK[item.quality] < minRank) continue
        return { category, index: i }
      }
      return null
    }

    switch (tpl.category) {
      case 'weapon':
        return match(inventoryStore.ownedWeapons, 'weapon')
      case 'ring':
        return match(inventoryStore.ownedRings, 'ring')
      case 'hat':
        return match(inventoryStore.ownedHats, 'hat')
      case 'shoe':
        return match(inventoryStore.ownedShoes, 'shoe')
    }
  }

  const canSubmitForgeQuest = (instanceId: string): boolean => {
    const today = useGameStore().day
    const quest = activeForgeQuests.value.find(q => q.instanceId === instanceId)
    if (!quest || today > quest.deadlineDay) return false
    const tpl = FORGE_QUEST_TEMPLATES.find(t => t.id === quest.templateId)
    if (!tpl) return false

    if (tpl.type === 'forge_material') {
      return tpl.materialId && tpl.materialQty
        ? getCombinedItemCount(tpl.materialId) >= tpl.materialQty
        : false
    }
    if (tpl.type === 'forge_deliver') {
      return _findDeliverItemIndex(tpl) != null
    }
    return quest.progress >= _questTarget(tpl)
  }

  const _completeForgeQuest = (quest: ActiveForgeQuest, tpl: ForgeQuestTemplate) => {
    const gameStore = useGameStore()
    _grantForgeQuestReward(tpl)
    completedForgeQuests.value.unshift({
      instanceId: quest.instanceId,
      templateId: quest.templateId,
      completedDay: gameStore.day
    })
    if (completedForgeQuests.value.length > 30) {
      completedForgeQuests.value.length = 30
    }
  }

  const _onForgeCompleted = (category: string, _quality: Quality, forgeScore: number) => {
    _purgeExpiredForgeQuests()
    for (const quest of activeForgeQuests.value) {
      const tpl = FORGE_QUEST_TEMPLATES.find(t => t.id === quest.templateId)
      if (!tpl) continue

      if (tpl.type === 'forge_craft') {
        if (!tpl.category || tpl.category === category) quest.progress++
      } else if (tpl.type === 'forge_perfect' && forgeScore >= 100) {
        quest.progress++
      }
    }
  }

  const onNpcFriendshipChanged = (
    npcId: string,
    beforeFriendship: number,
    afterFriendship: number
  ): string[] => {
    const giftIds = getNewNpcForgeBlueprintGifts(
      npcId,
      beforeFriendship,
      afterFriendship,
      claimedNpcBlueprintGifts.value
    )
    if (giftIds.length === 0) return []

    for (const gift of NPC_FORGE_BLUEPRINT_GIFTS) {
      if (gift.npcId !== npcId) continue
      const min =
        gift.level === 'acquaintance'
          ? 500
          : gift.level === 'friendly'
            ? 1000
            : gift.level === 'bestFriend'
              ? 2000
              : 0
      if (beforeFriendship < min && afterFriendship >= min) {
        const key = npcForgeGiftKey(npcId, gift.level as FriendshipLevel)
        if (!claimedNpcBlueprintGifts.value.includes(key)) {
          claimedNpcBlueprintGifts.value.push(key)
        }
      }
    }

    const learned: string[] = []
    for (const bpId of giftIds) {
      const res = learnBlueprint(bpId)
      if (res.newRecipeIds.length) learned.push(bpId)
      else if (res.ok) learned.push(bpId)
    }
    return learned
  }

  const migrateFromDefeatedBosses = (bossIds: string[]) => {
    for (const [floorStr, boss] of Object.entries(BOSS_MONSTERS)) {
      if (bossIds.includes(boss.id)) {
        markBossDefeated(Number(floorStr))
      }
    }
  }

  const attendLesson = (
    lessonId: string
  ): { ok: boolean; reason?: string; message?: string } => {
    const lesson = FORGE_LESSON_BY_ID[lessonId]
    if (!lesson) return { ok: false, reason: 'invalid_lesson' }
    if (lessonsSeen.value.includes(lessonId)) return { ok: false, reason: 'already_seen' }

    const gameStore = useGameStore()
    if (lastLessonDay.value === gameStore.day) {
      return { ok: false, reason: 'daily_limit' }
    }

    const forgingLevel = useSkillStore().getSkill('forging').level
    if (forgingLevel < lesson.requiredForgingLevel) {
      return { ok: false, reason: 'skill_level' }
    }
    if (lesson.requiresLessonId && !lessonsSeen.value.includes(lesson.requiresLessonId)) {
      return { ok: false, reason: 'prerequisite' }
    }

    lessonsSeen.value.push(lessonId)
    lastLessonDay.value = gameStore.day

    for (const rid of lesson.unlockRecipeIds) unlockRecipe(rid)

    if (lessonId === 'lesson_open_furnace') forgePanelUnlocked.value = true
    if (lessonId === 'lesson_hammer') rhythmZoneBonus.value = 0.05
    if (lessonId === 'lesson_quench') qualityWeightBonus.value = 0.03

    const repeat = lessonsSeen.value.filter(id => id === lessonId).length > 1
    const exp = repeat ? 15 : lesson.exp
    addForgingExp(exp)

    try {
      useNpcStore().adjustFriendship(lesson.npcId, 3)
    } catch {
      /* pinia 未就绪 */
    }

    return { ok: true, message: `${lesson.title}：${lesson.description}` }
  }

  const refreshForgeBoard = (force = false) => {
    const gameStore = useGameStore()
    const week = Math.floor(gameStore.day / 7)
    if (!force && forgeBoardQuests.value.length > 0 && lastBoardRefreshWeek.value === week) {
      return
    }
    lastBoardRefreshWeek.value = week

    const activeIds = new Set(activeForgeQuests.value.map(q => q.templateId))
    const pool = FORGE_QUEST_TEMPLATES.filter(t => !activeIds.has(t.id))
    const picked: ForgeBoardQuest[] = []
    while (picked.length < 2 && pool.length > 0) {
      const idx = Math.floor(Math.random() * pool.length)
      const tpl = pool.splice(idx, 1)[0]!
      if (!picked.some(p => p.templateId === tpl.id)) {
        picked.push({ templateId: tpl.id, postedDay: gameStore.day })
      }
    }
    forgeBoardQuests.value = picked
  }

  /** 移除任务板上与进行中重复项；板空时补货 */
  const _sanitizeForgeBoard = () => {
    const activeIds = new Set(activeForgeQuests.value.map(q => q.templateId))
    forgeBoardQuests.value = forgeBoardQuests.value.filter(b => !activeIds.has(b.templateId))
  }

  const ensureForgeBoard = () => {
    _sanitizeForgeBoard()
    const gameStore = useGameStore()
    const week = Math.floor(gameStore.day / 7)
    if (forgeBoardQuests.value.length === 0 || lastBoardRefreshWeek.value !== week) {
      refreshForgeBoard(forgeBoardQuests.value.length === 0)
    }
  }

  const acceptForgeQuest = (templateId: string): { ok: boolean; reason?: string } => {
    _purgeExpiredForgeQuests()
    if (activeForgeQuests.value.length >= 2) return { ok: false, reason: 'max_active' }
    if (!forgeBoardQuests.value.some(q => q.templateId === templateId)) {
      return { ok: false, reason: 'not_on_board' }
    }
    if (activeForgeQuests.value.some(q => q.templateId === templateId)) {
      return { ok: false, reason: 'already_active' }
    }

    const gameStore = useGameStore()
    activeForgeQuests.value.push({
      instanceId: `fq_${nextQuestInstanceId++}`,
      templateId,
      acceptedDay: gameStore.day,
      deadlineDay: gameStore.day + 7,
      progress: 0
    })
    forgeBoardQuests.value = forgeBoardQuests.value.filter(q => q.templateId !== templateId)
    return { ok: true }
  }

  const submitForgeQuest = (
    instanceId: string
  ): { ok: boolean; reason?: string; message?: string } => {
    _purgeExpiredForgeQuests()
    const quest = activeForgeQuests.value.find(q => q.instanceId === instanceId)
    if (!quest) return { ok: false, reason: 'not_found' }

    const tpl = FORGE_QUEST_TEMPLATES.find(t => t.id === quest.templateId)
    if (!tpl) return { ok: false, reason: 'invalid_template' }
    if (!canSubmitForgeQuest(instanceId)) return { ok: false, reason: 'not_ready' }

    const inventoryStore = useInventoryStore()

    if (tpl.type === 'forge_material') {
      if (!tpl.materialId || !tpl.materialQty) return { ok: false, reason: 'wrong_type' }
      if (!removeCombinedItem(tpl.materialId, tpl.materialQty)) {
        return { ok: false, reason: 'materials' }
      }
    } else if (tpl.type === 'forge_deliver') {
      const target = _findDeliverItemIndex(tpl)
      if (!target) return { ok: false, reason: 'not_ready' }
      const removed = inventoryStore.removeCraftedPieceForQuest(target.category, target.index)
      if (!removed.ok) return { ok: false, reason: removed.reason ?? 'deliver_failed' }
    } else if (quest.progress < _questTarget(tpl)) {
      return { ok: false, reason: 'not_ready' }
    }

    activeForgeQuests.value = activeForgeQuests.value.filter(q => q.instanceId !== instanceId)
    _completeForgeQuest(quest, tpl)
    return {
      ok: true,
      message: `任务完成：${tpl.description}`,
      rewardText: formatForgeQuestRewardText(tpl)
    }
  }

  /** @deprecated 使用 submitForgeQuest */
  const submitForgeMaterialQuest = (instanceId: string) => submitForgeQuest(instanceId)

  const tryLearnMineBlueprint = (
    blueprintId: string
  ): { ok: boolean; blueprintName?: string } => {
    const bp = getBlueprintById(blueprintId)
    if (!bp) return { ok: false }
    const res = learnBlueprint(blueprintId)
    return { ok: res.ok, blueprintName: bp.name }
  }

  const learnBlueprint = (blueprintId: string): { ok: boolean; newRecipeIds: string[] } => {
    const bp = getBlueprintById(blueprintId)
    if (!bp) return { ok: false, newRecipeIds: [] }

    const added: string[] = []
    for (const rid of bp.unlocksRecipeIds) {
      if (!unlockedRecipeIds.value.includes(rid)) {
        unlockedRecipeIds.value.push(rid)
        added.push(rid)
      }
    }
    return { ok: added.length > 0 || bp.unlocksRecipeIds.length > 0, newRecipeIds: added }
  }

  const markBossDefeated = (floor: number): string[] => {
    if (defeatedBossFloors.value.includes(floor)) return []
    defeatedBossFloors.value.push(floor)
    const blueprintByFloor: Record<number, string> = {
      20: 'bp_boss_mud_king_set',
      40: 'bp_boss_frost_queen_set',
      60: 'bp_boss_lava_lord_set',
      80: 'bp_boss_crystal_king_set',
      100: 'bp_boss_shadow_sovereign_set',
      120: 'bp_boss_dragon_king_set'
    }
    const bpId = blueprintByFloor[floor]
    if (!bpId) return []
    return learnBlueprint(bpId).newRecipeIds
  }

  const purchaseSunBlueprint = (blueprintId: string): { ok: boolean; reason?: string } => {
    if (sunBlueprintShopPurchased.value.includes(blueprintId)) {
      return { ok: false, reason: 'already_purchased' }
    }
    const shopEntry = SUN_SHOP_BLUEPRINTS.find(e => e.blueprintId === blueprintId)
    if (!shopEntry) return { ok: false, reason: 'not_in_shop' }
    const bp = getBlueprintById(blueprintId)
    if (!bp) return { ok: false, reason: 'invalid_blueprint' }

    const playerStore = usePlayerStore()
    if (playerStore.money < shopEntry.price) {
      return { ok: false, reason: 'insufficient_money' }
    }

    playerStore.money -= shopEntry.price
    sunBlueprintShopPurchased.value.push(blueprintId)
    learnBlueprint(blueprintId)
    return { ok: true }
  }

  const addForgingExp = (amount: number): void => {
    const skillStore = useSkillStore()
    const inventoryStore = useInventoryStore()
    const perks = getForgingPerkBonuses()
    const bonus = inventoryStore.getEquipmentBonus('forging_exp_bonus')
    const total = Math.floor(amount * perks.expMult * (1 + bonus))
    skillStore.addExp('forging', total)
  }

  const getEffectiveToolUpgradeCost = (type: ToolType) => {
    const tool = useInventoryStore().getTool(type)
    if (!tool) return null
    const cost = getUpgradeCost(type, tool.tier)
    if (!cost) return null
    const perks = getForgingPerkBonuses()
    return {
      toTier: cost.toTier,
      money: Math.floor(cost.money * (1 - perks.toolMoneyDiscount)),
      materials: cost.materials.map(m => ({
        itemId: m.itemId,
        quantity: Math.max(1, Math.ceil(m.quantity * (1 - perks.toolMaterialDiscount)))
      })),
      requiredForgingLevel: Math.max(1, cost.requiredForgingLevel - perks.toolLevelReduction)
    }
  }

  /** §6.3 工具当场升级 */
  const upgradeTool = (type: ToolType): { ok: boolean; reason?: string; message?: string } => {
    const inventoryStore = useInventoryStore()
    const tool = inventoryStore.getTool(type)
    if (!tool) return { ok: false, reason: 'no_tool' }

    const effective = getEffectiveToolUpgradeCost(type)
    if (!effective) return { ok: false, reason: 'max_tier' }

    const forgingLevel = useSkillStore().getSkill('forging').level
    if (forgingLevel < effective.requiredForgingLevel) {
      return { ok: false, reason: 'skill_level' }
    }

    const playerStore = usePlayerStore()
    if (playerStore.money < effective.money) return { ok: false, reason: 'money' }

    for (const mat of effective.materials) {
      if (getCombinedItemCount(mat.itemId) < mat.quantity) {
        return { ok: false, reason: 'materials' }
      }
    }

    playerStore.money -= effective.money
    for (const mat of effective.materials) {
      removeCombinedItem(mat.itemId, mat.quantity)
    }

    inventoryStore.setToolTier(type, effective.toTier)
    addForgingExp(15)

    return {
      ok: true,
      message: `${TOOL_NAMES[type]}当场升级为${TIER_NAMES[effective.toTier]}！`
    }
  }

  const REROLL_COST = { money: 200, charcoal: 2, bar: { itemId: 'copper_bar' as const, qty: 1 } }

  const rerollAffixes = (
    category: ForgeCategory,
    instanceIndex: number
  ): { ok: boolean; reason?: string } => {
    const inventoryStore = useInventoryStore()
    const gameStore = useGameStore()
    const skillStore = useSkillStore()
    const perks = getForgingPerkBonuses()
    const forgingLevel = skillStore.getSkill('forging').level
    const weather = gameStore.weather

    type CraftedPiece = OwnedWeapon | OwnedRing | OwnedHat | OwnedShoe
    let piece: CraftedPiece | undefined
    let isSetPiece = false
    let fixedAffixId: string | undefined
    if (category === 'weapon') {
      piece = inventoryStore.ownedWeapons[instanceIndex]
    } else if (category === 'ring') {
      piece = inventoryStore.ownedRings[instanceIndex]
    } else if (category === 'hat') {
      piece = inventoryStore.ownedHats[instanceIndex]
    } else {
      piece = inventoryStore.ownedShoes[instanceIndex]
    }

    if (!piece?.quality || !piece.recipeId) return { ok: false, reason: 'not_crafted' }

    const recipe = getForgeRecipeById(piece.recipeId)
    isSetPiece = !!recipe?.isSetPiece
    fixedAffixId = recipe?.fixedAffixId
    const moneyCost = Math.floor(REROLL_COST.money * (1 - perks.rerollMoneyDiscount))
    const playerStore = usePlayerStore()
    if (playerStore.money < moneyCost) return { ok: false, reason: 'money' }
    if (getCombinedItemCount(REROLL_COST.bar.itemId) < REROLL_COST.bar.qty) {
      return { ok: false, reason: 'materials' }
    }
    if (getCombinedItemCount('charcoal') < REROLL_COST.charcoal) {
      return { ok: false, reason: 'materials' }
    }

    playerStore.money -= moneyCost
    removeCombinedItem(REROLL_COST.bar.itemId, REROLL_COST.bar.qty)
    removeCombinedItem('charcoal', REROLL_COST.charcoal)

    const rollOnce = () =>
      rollAffixes({
        category,
        quality: piece!.quality!,
        weather,
        forgingLevel,
        fixedAffixId,
        isSetPiece,
        t4WeightBonus: perks.t4WeightBonus,
        setAffixMult: isSetPiece ? perks.setAffixMult : 1
      })

    let newAffixes = rollOnce()
    if (perks.twinRuneChance > 0 && Math.random() < perks.twinRuneChance) {
      const alt = rollOnce()
      const score = (arr: typeof newAffixes) =>
        arr.reduce((s, a) => s + (getAffixById(a.id)?.tier ?? 0), 0)
      if (score(alt) > score(newAffixes)) newAffixes = alt
    }

    if (perks.luckyRerollTierChance > 0 && Math.random() < perks.luckyRerollTierChance) {
      newAffixes = newAffixes.map(a => {
        const def = getAffixById(a.id)
        if (!def || def.tier >= 4) return a
        const upgraded = getAffixPool({
          category,
          quality: piece!.quality!,
          weather,
          forgingLevel
        }).find(x => x.tier === def.tier + 1 && !newAffixes.some(n => n.id === x.id))
        if (!upgraded) return a
        return { id: upgraded.id, rolledValue: a.rolledValue }
      })
    }

    piece.affixes = newAffixes
    affixRerollCount.value++
    _onRerollCompleted()
    return { ok: true }
  }

  const _onRerollCompleted = () => {
    for (const quest of activeForgeQuests.value) {
      const tpl = FORGE_QUEST_TEMPLATES.find(t => t.id === quest.templateId)
      if (tpl?.type === 'forge_reroll') quest.progress++
    }
  }

  const unlockRecipe = (recipeId: string): boolean => {
    if (unlockedRecipeIds.value.includes(recipeId)) return false
    unlockedRecipeIds.value.push(recipeId)
    return true
  }

  const serialize = () => ({
    unlockedRecipeIds: unlockedRecipeIds.value,
    defeatedBossFloors: defeatedBossFloors.value,
    sunBlueprintShopPurchased: sunBlueprintShopPurchased.value,
    forgeStats: { ...forgeStats.value },
    lessonsSeen: lessonsSeen.value,
    lastLessonDay: lastLessonDay.value,
    pendingRecipeId: pendingRecipeId.value,
    forgePanelUnlocked: forgePanelUnlocked.value,
    claimedNpcBlueprintGifts: claimedNpcBlueprintGifts.value,
    rhythmZoneBonus: rhythmZoneBonus.value,
    qualityWeightBonus: qualityWeightBonus.value,
    forgeBoardQuests: forgeBoardQuests.value,
    activeForgeQuests: activeForgeQuests.value,
    completedForgeQuests: completedForgeQuests.value,
    affixRerollCount: affixRerollCount.value,
    lastBoardRefreshWeek: lastBoardRefreshWeek.value
  })

  const deserialize = (data: ReturnType<typeof serialize> | null | undefined) => {
    if (!data) return
    unlockedRecipeIds.value = data.unlockedRecipeIds ?? []
    defeatedBossFloors.value = data.defeatedBossFloors ?? []
    sunBlueprintShopPurchased.value = data.sunBlueprintShopPurchased ?? []
    forgeStats.value = data.forgeStats ?? { totalForges: 0, supremeCount: 0, practiceCount: 0 }
    if (forgeStats.value.practiceCount == null) forgeStats.value.practiceCount = 0
    lessonsSeen.value = data.lessonsSeen ?? []
    lastLessonDay.value = data.lastLessonDay ?? -1
    pendingRecipeId.value = data.pendingRecipeId ?? null
    forgePanelUnlocked.value =
      data.forgePanelUnlocked ?? lessonsSeen.value.includes('lesson_open_furnace')
    claimedNpcBlueprintGifts.value = data.claimedNpcBlueprintGifts ?? []
    rhythmZoneBonus.value = data.rhythmZoneBonus ?? 0
    qualityWeightBonus.value = data.qualityWeightBonus ?? 0
    forgeBoardQuests.value = data.forgeBoardQuests ?? []
    activeForgeQuests.value = data.activeForgeQuests ?? []
    completedForgeQuests.value = data.completedForgeQuests ?? []
    _sanitizeForgeBoard()
    for (const q of activeForgeQuests.value) {
      const m = /^fq_(\d+)$/.exec(q.instanceId)
      if (m) nextQuestInstanceId = Math.max(nextQuestInstanceId, parseInt(m[1]!, 10) + 1)
    }
    affixRerollCount.value = data.affixRerollCount ?? 0
    lastBoardRefreshWeek.value = data.lastBoardRefreshWeek ?? -1
  }

  const reset = () => {
    unlockedRecipeIds.value = []
    defeatedBossFloors.value = []
    sunBlueprintShopPurchased.value = []
    forgeStats.value = { totalForges: 0, supremeCount: 0, practiceCount: 0 }
    lessonsSeen.value = []
    lastLessonDay.value = -1
    pendingRecipeId.value = null
    forgePanelUnlocked.value = false
    claimedNpcBlueprintGifts.value = []
    rhythmZoneBonus.value = 0
    qualityWeightBonus.value = 0
    forgeBoardQuests.value = []
    activeForgeQuests.value = []
    completedForgeQuests.value = []
    affixRerollCount.value = 0
    lastBoardRefreshWeek.value = -1
    nextQuestInstanceId = 1
  }

  return {
    unlockedRecipeIds,
    defeatedBossFloors,
    sunBlueprintShopPurchased,
    forgeStats,
    lessonsSeen,
    lastLessonDay,
    pendingRecipeId,
    forgePanelUnlocked,
    claimedNpcBlueprintGifts,
    rhythmZoneBonus,
    qualityWeightBonus,
    forgeBoardQuests,
    activeForgeQuests,
    completedForgeQuests,
    affixRerollCount,
    isRecipeUnlocked,
    canStartForge,
    startForge,
    cancelPendingForge,
    completeForge,
    completePractice,
    learnBlueprint,
    markBossDefeated,
    migrateFromDefeatedBosses,
    purchaseSunBlueprint,
    addForgingExp,
    unlockRecipe,
    onNpcFriendshipChanged,
    attendLesson,
    refreshForgeBoard,
    ensureForgeBoard,
    acceptForgeQuest,
    canSubmitForgeQuest,
    submitForgeQuest,
    submitForgeMaterialQuest,
    tryLearnMineBlueprint,
    rerollAffixes,
    upgradeTool,
    getEffectiveToolUpgradeCost,
    effectiveForgeMoney,
    serialize,
    deserialize,
    reset
  }
})
