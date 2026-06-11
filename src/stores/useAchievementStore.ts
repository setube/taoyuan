import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { AchievementDef, AchievementCondition } from '@/types'
import { ACHIEVEMENTS, COMMUNITY_BUNDLES } from '@/data/achievements'
import { ITEMS } from '@/data/items'
import { HYBRID_DEFS } from '@/data/breeding'
import { usePlayerStore } from './usePlayerStore'
import { useInventoryStore } from './useInventoryStore'
import { useSkillStore } from './useSkillStore'
import { useNpcStore } from './useNpcStore'
import { useQuestStore } from './useQuestStore'
import { useShopStore } from './useShopStore'
import { useAnimalStore } from './useAnimalStore'
import { useGameStore } from './useGameStore'
import { useMuseumStore } from './useMuseumStore'
import { useGuildStore } from './useGuildStore'
import { useHiddenNpcStore } from './useHiddenNpcStore'

export const useAchievementStore = defineStore('achievement', () => {
  const playerStore = usePlayerStore()
  const inventoryStore = useInventoryStore()
  const skillStore = useSkillStore()
  const npcStore = useNpcStore()

  /** 已发现的物品ID集合 */
  const discoveredItems = ref<string[]>([])

  /** 物品发现时间记录 { itemId: "第X年 春 第Y天" } */
  const discoveryTimes = ref<Record<string, string>>({})

  /** 鱼类历史最大重量（斤） */
  const fishMaxWeights = ref<Record<string, number>>({})

  /** 已完成的成就ID集合 */
  const completedAchievements = ref<string[]>([])

  /** 祠堂任务已提交物品 */
  const bundleSubmissions = ref<Record<string, Record<string, number>>>({})

  /** 已完成的祠堂任务 */
  const completedBundles = ref<string[]>([])

  /** 统计计数器 */
  const stats = ref({
    totalCropsHarvested: 0,
    totalFishCaught: 0,
    totalMoneyEarned: 0,
    highestMineFloor: 0,
    totalRecipesCooked: 0,
    skullCavernBestFloor: 0,
    totalMonstersKilled: 0,
    totalBreedingsDone: 0,
    totalHybridsDiscovered: 0,
    highestHybridTier: 0
  })

  const discoveredCount = computed(() => discoveredItems.value.length)

  // === 物品发现 ===

  const discoverItem = (itemId: string) => {
    if (!discoveredItems.value.includes(itemId)) {
      discoveredItems.value.push(itemId)
      const gameStore = useGameStore()
      const SEASON_NAMES: Record<string, string> = { spring: '春', summer: '夏', autumn: '秋', winter: '冬' }
      discoveryTimes.value[itemId] = `第${gameStore.year}年 ${SEASON_NAMES[gameStore.season] ?? gameStore.season} 第${gameStore.day}天`
    }
  }

  const getDiscoveryTime = (itemId: string): string | null => {
    return discoveryTimes.value[itemId] ?? null
  }

  const isDiscovered = (itemId: string): boolean => {
    return discoveredItems.value.includes(itemId)
  }

  // === 统计记录 ===

  const recordCropHarvest = () => {
    stats.value.totalCropsHarvested++
  }

  const recordFishCaught = () => {
    stats.value.totalFishCaught++
  }

  /** 记录鱼重，返回是否刷新纪录 */
  const recordFishWeight = (fishId: string, weight: number): boolean => {
    const prev = fishMaxWeights.value[fishId]
    if (prev === undefined || weight > prev) {
      fishMaxWeights.value[fishId] = weight
      return true
    }
    return false
  }

  const getFishMaxWeight = (fishId: string): number | null => {
    return fishMaxWeights.value[fishId] ?? null
  }

  const recordMoneyEarned = (amount: number) => {
    stats.value.totalMoneyEarned += amount
  }

  const recordMineFloor = (floor: number) => {
    if (floor > stats.value.highestMineFloor) {
      stats.value.highestMineFloor = floor
    }
  }

  const recordRecipeCooked = () => {
    stats.value.totalRecipesCooked++
  }

  const recordSkullCavernFloor = (floor: number) => {
    if (floor > stats.value.skullCavernBestFloor) {
      stats.value.skullCavernBestFloor = floor
    }
  }

  const recordMonsterKill = () => {
    stats.value.totalMonstersKilled++
  }

  const recordBreeding = () => {
    stats.value.totalBreedingsDone++
  }

  const recordHybridDiscovered = () => {
    stats.value.totalHybridsDiscovered++
  }

  const recordHybridTier = (tier: number) => {
    if (tier > stats.value.highestHybridTier) {
      stats.value.highestHybridTier = tier
    }
  }

  // === 成就检查 ===

  /** 判断单个成就条件是否满足 */
  const isConditionMet = (c: AchievementCondition): boolean => {
    switch (c.type) {
      case 'itemCount':
        return discoveredItems.value.length >= c.count
      case 'cropHarvest':
        return stats.value.totalCropsHarvested >= c.count
      case 'fishCaught':
        return stats.value.totalFishCaught >= c.count
      case 'moneyEarned':
        return stats.value.totalMoneyEarned >= c.amount
      case 'mineFloor':
        return stats.value.highestMineFloor >= c.floor
      case 'skullCavernFloor':
        return stats.value.skullCavernBestFloor >= c.floor
      case 'recipesCooked':
        return stats.value.totalRecipesCooked >= c.count
      case 'skillLevel': {
        const skill = skillStore.skills.find(s => s.type === c.skillType)
        return skill !== undefined && skill.level >= c.level
      }
      case 'npcFriendship': {
        const LEVEL_RANK: Record<string, number> = { stranger: 0, acquaintance: 1, friendly: 2, bestFriend: 3 }
        const requiredRank = LEVEL_RANK[c.level] ?? 0
        return npcStore.npcStates.every(n => (LEVEL_RANK[npcStore.getFriendshipLevel(n.npcId)] ?? 0) >= requiredRank)
      }
      case 'questsCompleted': {
        const questStore = useQuestStore()
        return questStore.completedQuestCount >= c.count
      }
      case 'npcBestFriend': {
        const bestFriendCount = npcStore.npcStates.filter(n => npcStore.getFriendshipLevel(n.npcId) === 'bestFriend').length
        return bestFriendCount >= c.count
      }
      case 'npcAllFriendly':
        return npcStore.npcStates.every(n => {
          const level = npcStore.getFriendshipLevel(n.npcId)
          return level === 'friendly' || level === 'bestFriend'
        })
      case 'married':
        return npcStore.getSpouse() !== null
      case 'hasChild':
        return npcStore.children.length > 0
      case 'monstersKilled':
        return stats.value.totalMonstersKilled >= c.count
      case 'shippedCount': {
        const shopStore = useShopStore()
        return shopStore.shippedItems.length >= c.count
      }
      case 'fullShipment': {
        const shopStore = useShopStore()
        const shippableCategories = [
          'crop',
          'fish',
          'animal_product',
          'processed',
          'fruit',
          'ore',
          'gem',
          'material',
          'misc',
          'food',
          'gift'
        ]
        const shippableCount = ITEMS.filter(i => shippableCategories.includes(i.category)).length
        return shopStore.shippedItems.length >= shippableCount
      }
      case 'animalCount': {
        const animalStore = useAnimalStore()
        return animalStore.animals.length >= c.count
      }
      case 'allSkillsMax':
        return skillStore.skills.every(s => s.level === 10)
      case 'allBundlesComplete':
        return completedBundles.value.length >= COMMUNITY_BUNDLES.length
      case 'hybridsDiscovered':
        return stats.value.totalHybridsDiscovered >= c.count
      case 'breedingsDone':
        return stats.value.totalBreedingsDone >= c.count
      case 'hybridTier':
        return stats.value.highestHybridTier >= c.tier
      case 'hybridsShipped': {
        const shopStore = useShopStore()
        const hybridItemIds = new Set(HYBRID_DEFS.map(h => h.resultCropId))
        const shippedHybridCount = shopStore.shippedItems.filter(id => hybridItemIds.has(id)).length
        return shippedHybridCount >= c.count
      }
      case 'museumDonations': {
        const museumStore = useMuseumStore()
        return museumStore.donatedCount >= c.count
      }
      case 'guildGoalsCompleted': {
        const guildStore = useGuildStore()
        return guildStore.completedGoalCount >= c.count
      }
      case 'hiddenNpcRevealed': {
        const hiddenNpcStore = useHiddenNpcStore()
        return hiddenNpcStore.getRevealedNpcs.length >= c.count
      }
      case 'hiddenNpcBonded': {
        const hiddenNpcStore = useHiddenNpcStore()
        return hiddenNpcStore.getBondedNpc != null
      }
      case 'itemDiscovered':
        return discoveredItems.value.includes(c.itemId)
    }
  }

  const checkAchievements = (): AchievementDef[] => {
    const newlyCompleted: AchievementDef[] = []

    for (const achievement of ACHIEVEMENTS) {
      if (completedAchievements.value.includes(achievement.id)) continue

      if (isConditionMet(achievement.condition)) {
        completedAchievements.value.push(achievement.id)
        // 发放奖励
        if (achievement.reward.money) {
          playerStore.earnMoney(achievement.reward.money)
        }
        if (achievement.reward.items) {
          for (const item of achievement.reward.items) {
            inventoryStore.addItem(item.itemId, item.quantity)
          }
        }
        newlyCompleted.push(achievement)
      }
    }

    return newlyCompleted
  }

  // === 祠堂任务 ===

  const submitToBundle = (bundleId: string, itemId: string, quantity: number): boolean => {
    if (completedBundles.value.includes(bundleId)) return false
    const bundle = COMMUNITY_BUNDLES.find(b => b.id === bundleId)
    if (!bundle) return false

    const req = bundle.requiredItems.find(r => r.itemId === itemId)
    if (!req) return false

    if (!inventoryStore.removeItem(itemId, quantity)) return false

    if (!bundleSubmissions.value[bundleId]) {
      bundleSubmissions.value[bundleId] = {}
    }
    const sub = bundleSubmissions.value[bundleId]!
    sub[itemId] = (sub[itemId] ?? 0) + quantity

    // 检查是否完成
    const allMet = bundle.requiredItems.every(r => (sub[r.itemId] ?? 0) >= r.quantity)

    if (allMet) {
      completedBundles.value.push(bundleId)
      // 发放奖励
      if (bundle.reward.money) {
        playerStore.earnMoney(bundle.reward.money)
      }
      if (bundle.reward.items) {
        for (const item of bundle.reward.items) {
          inventoryStore.addItem(item.itemId, item.quantity)
        }
      }
    }

    return true
  }

  const getBundleProgress = (bundleId: string): Record<string, number> => {
    return bundleSubmissions.value[bundleId] ?? {}
  }

  const isBundleComplete = (bundleId: string): boolean => {
    return completedBundles.value.includes(bundleId)
  }

  // === 完成度 ===

  const SHIPPABLE_CATEGORIES = ['crop', 'fish', 'animal_product', 'processed', 'fruit', 'ore', 'gem', 'material', 'misc', 'food', 'gift']
  const shippableItemCount = ITEMS.filter(i => SHIPPABLE_CATEGORIES.includes(i.category)).length

  const perfectionPercent = computed(() => {
    const shopStore = useShopStore()

    // 成就 25%
    const achievementRate = completedAchievements.value.length / ACHIEVEMENTS.length
    // 出货 20%
    const shippingRate = shippableItemCount > 0 ? shopStore.shippedItems.length / shippableItemCount : 0
    // 祠堂任务 15%
    const bundleRate = COMMUNITY_BUNDLES.length > 0 ? completedBundles.value.length / COMMUNITY_BUNDLES.length : 0
    // 图鉴 15%
    const collectionRate = ITEMS.length > 0 ? discoveredItems.value.length / ITEMS.length : 0
    // 技能 15%
    const avgSkillLevel = skillStore.skills.reduce((sum, s) => sum + s.level, 0) / skillStore.skills.length
    const skillRate = avgSkillLevel / 10
    // 好感 10%
    const friendlyCount = npcStore.npcStates.filter(n => {
      const level = npcStore.getFriendshipLevel(n.npcId)
      return level === 'friendly' || level === 'bestFriend'
    }).length
    const friendRate = npcStore.npcStates.length > 0 ? friendlyCount / npcStore.npcStates.length : 0

    const total =
      achievementRate * 0.25 + shippingRate * 0.2 + bundleRate * 0.15 + collectionRate * 0.15 + skillRate * 0.15 + friendRate * 0.1
    return Math.floor(total * 100)
  })

  // === 序列化 ===

  const serialize = () => {
    return {
      discoveredItems: discoveredItems.value,
      discoveryTimes: discoveryTimes.value,
      fishMaxWeights: fishMaxWeights.value,
      completedAchievements: completedAchievements.value,
      bundleSubmissions: bundleSubmissions.value,
      completedBundles: completedBundles.value,
      stats: stats.value
    }
  }

  const deserialize = (data: ReturnType<typeof serialize>) => {
    discoveredItems.value = data.discoveredItems ?? []
    discoveryTimes.value = data.discoveryTimes ?? {}
    fishMaxWeights.value = data.fishMaxWeights ?? {}
    completedAchievements.value = data.completedAchievements ?? []
    bundleSubmissions.value = data.bundleSubmissions ?? {}
    completedBundles.value = data.completedBundles ?? []
    stats.value = data.stats ?? {
      totalCropsHarvested: 0,
      totalFishCaught: 0,
      totalMoneyEarned: 0,
      highestMineFloor: 0,
      totalRecipesCooked: 0,
      skullCavernBestFloor: 0
    }
    // 兼容旧存档：补充缺失字段
    if (stats.value.skullCavernBestFloor === undefined) {
      stats.value.skullCavernBestFloor = 0
    }
    if ((stats.value as Record<string, unknown>).totalMonstersKilled === undefined) {
      stats.value.totalMonstersKilled = 0
    }
    if ((stats.value as Record<string, unknown>).totalBreedingsDone === undefined) {
      stats.value.totalBreedingsDone = 0
    }
    if ((stats.value as Record<string, unknown>).totalHybridsDiscovered === undefined) {
      stats.value.totalHybridsDiscovered = 0
    }
    if ((stats.value as Record<string, unknown>).highestHybridTier === undefined) {
      stats.value.highestHybridTier = 0
    }
    // 同步已拥有装备到图鉴（修复旧存档中装备未登记到图鉴的问题）
    const inventoryStore = useInventoryStore()
    for (const w of inventoryStore.ownedWeapons) discoverItem(w.defId)
    for (const r of inventoryStore.ownedRings) discoverItem(r.defId)
    for (const h of inventoryStore.ownedHats) discoverItem(h.defId)
    for (const s of inventoryStore.ownedShoes) discoverItem(s.defId)
    // 同步背包中已有物品到图鉴
    const seen = new Set<string>()
    for (const slot of inventoryStore.items) {
      if (!seen.has(slot.itemId)) {
        seen.add(slot.itemId)
        discoverItem(slot.itemId)
      }
    }
  }

  return {
    discoveredItems,
    discoveryTimes,
    fishMaxWeights,
    completedAchievements,
    bundleSubmissions,
    completedBundles,
    stats,
    discoveredCount,
    discoverItem,
    isDiscovered,
    getDiscoveryTime,
    recordCropHarvest,
    recordFishCaught,
    recordFishWeight,
    getFishMaxWeight,
    recordMoneyEarned,
    recordMineFloor,
    recordRecipeCooked,
    recordSkullCavernFloor,
    recordMonsterKill,
    recordBreeding,
    recordHybridDiscovered,
    recordHybridTier,
    checkAchievements,
    perfectionPercent,
    submitToBundle,
    getBundleProgress,
    isBundleComplete,
    serialize,
    deserialize
  }
})
