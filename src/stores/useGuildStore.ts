import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { MONSTER_GOALS, GUILD_SHOP_ITEMS, GUILD_DONATIONS, GUILD_LEVELS, GUILD_BONUS_PER_LEVEL } from '@/data/guild'
import { usePlayerStore } from './usePlayerStore'
import { useInventoryStore } from './useInventoryStore'
import { useGameStore } from './useGameStore'
import { addLog } from '@/composables/useGameLog'
import { getCombinedItemCount, removeCombinedItem } from '@/composables/useCombinedInventory'

export const useGuildStore = defineStore('guild', () => {
  /** 按怪物ID记录击杀数 */
  const monsterKills = ref<Record<string, number>>({})

  /** 已领取奖励的讨伐目标monsterId集合 */
  const claimedGoals = ref<string[]>([])

  /** 已遭遇过的怪物ID集合（用于图鉴） */
  const encounteredMonsters = ref<string[]>([])

  /** 贡献点（可消费货币） */
  const contributionPoints = ref(0)

  /** 公会经验（隐性） */
  const guildExp = ref(0)

  /** 公会等级（显性） */
  const guildLevel = ref(0)

  /** 每日限购追踪：{ itemId: 今日已购次数 } */
  const dailyPurchases = ref<Record<string, number>>({})

  /** 上次重置日限购的天编号 */
  const lastResetDay = ref(-1)

  /** 每周限购追踪：{ itemId: 本周已购次数 } */
  const weeklyPurchases = ref<Record<string, number>>({})

  /** 上次重置周限购的周编号 */
  const lastResetWeek = ref(-1)

  /** 永久总购买数追踪：{ itemId: 累计已购次数 } */
  const totalPurchases = ref<Record<string, number>>({})

  /** 记录击杀 */
  const recordKill = (monsterId: string) => {
    monsterKills.value[monsterId] = (monsterKills.value[monsterId] ?? 0) + 1
    if (!encounteredMonsters.value.includes(monsterId)) {
      encounteredMonsters.value.push(monsterId)
    }
  }

  /** 记录遭遇（进入战斗时调用，不管是否击杀） */
  const recordEncounter = (monsterId: string) => {
    if (!encounteredMonsters.value.includes(monsterId)) {
      encounteredMonsters.value.push(monsterId)
    }
  }

  /** 获取某怪物击杀数 */
  const getKillCount = (monsterId: string): number => {
    return monsterKills.value[monsterId] ?? 0
  }

  /** 是否已遭遇某怪物 */
  const isEncountered = (monsterId: string): boolean => {
    return encounteredMonsters.value.includes(monsterId)
  }

  /** 已完成的讨伐目标数 */
  const completedGoalCount = computed(() => {
    return MONSTER_GOALS.filter(g => (monsterKills.value[g.monsterId] ?? 0) >= g.killTarget).length
  })

  /** 可领取奖励的目标 */
  const claimableGoals = computed(() => {
    return MONSTER_GOALS.filter(g => (monsterKills.value[g.monsterId] ?? 0) >= g.killTarget && !claimedGoals.value.includes(g.monsterId))
  })

  /** 领取讨伐奖励 */
  const claimGoal = (monsterId: string): boolean => {
    const goal = MONSTER_GOALS.find(g => g.monsterId === monsterId)
    if (!goal) return false
    if ((monsterKills.value[monsterId] ?? 0) < goal.killTarget) return false
    if (claimedGoals.value.includes(monsterId)) return false

    const playerStore = usePlayerStore()
    const inventoryStore = useInventoryStore()

    if (goal.reward.money) {
      playerStore.earnMoney(goal.reward.money)
    }
    if (goal.reward.items) {
      for (const item of goal.reward.items) {
        inventoryStore.addItem(item.itemId, item.quantity)
      }
    }
    // 讨伐奖励只给贡献点，不增加公会经验（只有捐献增加经验）
    const bonusPoints = Math.floor((goal.reward.money ?? 0) / 20) + goal.killTarget
    contributionPoints.value += bonusPoints
    claimedGoals.value.push(monsterId)
    addLog(`领取讨伐奖励，额外获得 ${bonusPoints} 贡献点。`)
    return true
  }

  // ==================== 公会等级 ====================

  /** 计算当前游戏天编号 */
  const getCurrentDay = (): number => {
    const gameStore = useGameStore()
    const seasonIndex = ['spring', 'summer', 'autumn', 'winter'].indexOf(gameStore.season)
    return (gameStore.year - 1) * 112 + seasonIndex * 28 + gameStore.day
  }

  /** 确保每日限购已重置 */
  const ensureDailyReset = () => {
    const day = getCurrentDay()
    if (day !== lastResetDay.value) {
      dailyPurchases.value = {}
      lastResetDay.value = day
    }
  }

  /** 计算当前游戏周编号 */
  const getCurrentWeek = (): number => {
    return Math.floor((getCurrentDay() - 1) / 7)
  }

  /** 确保每周限购已重置 */
  const ensureWeeklyReset = () => {
    const week = getCurrentWeek()
    if (week !== lastResetWeek.value) {
      weeklyPurchases.value = {}
      lastResetWeek.value = week
    }
  }

  /** 检查升级 */
  const checkLevelUp = () => {
    while (guildLevel.value < GUILD_LEVELS.length) {
      const next = GUILD_LEVELS[guildLevel.value]
      if (!next || guildExp.value < next.expRequired) break
      guildLevel.value++
      addLog(`冒险家公会等级提升到 ${guildLevel.value} 级！`)
    }
  }

  /** 捐献物品 */
  const donateItem = (itemId: string, quantity: number): { success: boolean; pointsGained: number } => {
    const donation = GUILD_DONATIONS.find(d => d.itemId === itemId)
    if (!donation) return { success: false, pointsGained: 0 }
    const inventoryStore = useInventoryStore()
    const available = inventoryStore.getItemCount(itemId)
    const actual = Math.min(quantity, available)
    if (actual <= 0) return { success: false, pointsGained: 0 }
    inventoryStore.removeItem(itemId, actual)
    const points = donation.points * actual
    contributionPoints.value += points
    guildExp.value += points
    checkLevelUp()
    return { success: true, pointsGained: points }
  }

  /** 获取今日剩余购买次数 */
  const getDailyRemaining = (itemId: string, dailyLimit: number): number => {
    ensureDailyReset()
    return dailyLimit - (dailyPurchases.value[itemId] ?? 0)
  }

  /** 获取本周剩余购买次数 */
  const getWeeklyRemaining = (itemId: string, weeklyLimit: number): number => {
    ensureWeeklyReset()
    return weeklyLimit - (weeklyPurchases.value[itemId] ?? 0)
  }

  /** 获取永久剩余购买次数 */
  const getTotalRemaining = (itemId: string, totalLimit: number): number => {
    return totalLimit - (totalPurchases.value[itemId] ?? 0)
  }

  /** 获取公会等级被动攻击加成 */
  const getGuildAttackBonus = (): number => {
    return guildLevel.value * GUILD_BONUS_PER_LEVEL.attack
  }

  /** 获取公会等级被动HP加成 */
  const getGuildHpBonus = (): number => {
    return guildLevel.value * GUILD_BONUS_PER_LEVEL.maxHp
  }

  // ==================== 商店 ====================

  /** 公会商店：检查物品是否已解锁 */
  const isShopItemUnlocked = (itemId: string): boolean => {
    const item = GUILD_SHOP_ITEMS.find(i => i.itemId === itemId)
    if (!item) return false
    if (!item.unlockGuildLevel) return true
    return guildLevel.value >= item.unlockGuildLevel
  }

  /** 公会商店：购买物品 */
  const buyShopItem = (itemId: string): boolean => {
    const item = GUILD_SHOP_ITEMS.find(i => i.itemId === itemId)
    if (!item) return false
    if (!isShopItemUnlocked(itemId)) return false

    // 每日限购检查
    if (item.dailyLimit) {
      ensureDailyReset()
      if ((dailyPurchases.value[itemId] ?? 0) >= item.dailyLimit) return false
    }

    // 每周限购检查
    if (item.weeklyLimit) {
      ensureWeeklyReset()
      if ((weeklyPurchases.value[itemId] ?? 0) >= item.weeklyLimit) return false
    }

    // 永久总限购检查
    if (item.totalLimit) {
      if ((totalPurchases.value[itemId] ?? 0) >= item.totalLimit) return false
    }

    const playerStore = usePlayerStore()
    const inventoryStore = useInventoryStore()

    // 检查材料是否足够
    if (item.materials) {
      for (const mat of item.materials) {
        if (getCombinedItemCount(mat.itemId) < mat.quantity) return false
      }
    }

    // 永久品用贡献点，消耗品用铜钱
    if (item.contributionCost) {
      if (contributionPoints.value < item.contributionCost) return false
      contributionPoints.value -= item.contributionCost
    } else {
      if (playerStore.money < item.price) return false
      playerStore.spendMoney(item.price)
    }

    // 扣除材料
    if (item.materials) {
      for (const mat of item.materials) {
        removeCombinedItem(mat.itemId, mat.quantity)
      }
    }

    // 根据装备类型添加到对应栏位
    let addSuccess = true
    if (item.equipType === 'weapon') {
      addSuccess = inventoryStore.addWeapon(item.itemId, null)
    } else if (item.equipType === 'ring') {
      addSuccess = inventoryStore.addRing(item.itemId)
    } else if (item.equipType === 'hat') {
      addSuccess = inventoryStore.addHat(item.itemId)
    } else if (item.equipType === 'shoe') {
      addSuccess = inventoryStore.addShoe(item.itemId)
    } else {
      addSuccess = inventoryStore.addItem(item.itemId, 1)
    }

    if (!addSuccess) {
      // 退还贡献点/铜钱
      if (item.contributionCost) contributionPoints.value += item.contributionCost
      else playerStore.earnMoney(item.price)
      // 退还材料
      if (item.materials) {
        for (const mat of item.materials) {
          inventoryStore.addItem(mat.itemId, mat.quantity)
        }
      }
      return false
    }

    // 记录限购
    if (item.dailyLimit) {
      dailyPurchases.value[itemId] = (dailyPurchases.value[itemId] ?? 0) + 1
    }
    if (item.weeklyLimit) {
      weeklyPurchases.value[itemId] = (weeklyPurchases.value[itemId] ?? 0) + 1
    }
    if (item.totalLimit) {
      totalPurchases.value[itemId] = (totalPurchases.value[itemId] ?? 0) + 1
    }
    addLog(`在公会商店购买了「${item.name}」。`)
    return true
  }

  /** 序列化 */
  const serialize = () => ({
    monsterKills: { ...monsterKills.value },
    claimedGoals: [...claimedGoals.value],
    encounteredMonsters: [...encounteredMonsters.value],
    contributionPoints: contributionPoints.value,
    guildExp: guildExp.value,
    guildLevel: guildLevel.value,
    dailyPurchases: { ...dailyPurchases.value },
    lastResetDay: lastResetDay.value,
    weeklyPurchases: { ...weeklyPurchases.value },
    lastResetWeek: lastResetWeek.value,
    totalPurchases: { ...totalPurchases.value }
  })

  /** 反序列化 */
  const deserialize = (data: ReturnType<typeof serialize>) => {
    monsterKills.value = data.monsterKills ?? {}
    claimedGoals.value = data.claimedGoals ?? []
    encounteredMonsters.value = data.encounteredMonsters ?? []
    dailyPurchases.value = ((data as Record<string, unknown>).dailyPurchases as Record<string, number>) ?? {}
    lastResetDay.value = ((data as Record<string, unknown>).lastResetDay as number) ?? -1
    weeklyPurchases.value = ((data as Record<string, unknown>).weeklyPurchases as Record<string, number>) ?? {}
    lastResetWeek.value = ((data as Record<string, unknown>).lastResetWeek as number) ?? -1
    totalPurchases.value = ((data as Record<string, unknown>).totalPurchases as Record<string, number>) ?? {}

    // 旧存档迁移：如果没有贡献点字段但有已领取的讨伐目标，补发贡献点（不补经验，经验只来自捐献）
    const isOldSave = !('contributionPoints' in data)
    if (isOldSave && claimedGoals.value.length > 0) {
      let migratedPoints = 0
      for (const monsterId of claimedGoals.value) {
        const goal = MONSTER_GOALS.find(g => g.monsterId === monsterId)
        if (goal) {
          migratedPoints += Math.floor((goal.reward.money ?? 0) / 20) + goal.killTarget
        }
      }
      contributionPoints.value = migratedPoints
      guildExp.value = 0
      guildLevel.value = 0
    } else {
      contributionPoints.value = ((data as Record<string, unknown>).contributionPoints as number) ?? 0
      guildExp.value = ((data as Record<string, unknown>).guildExp as number) ?? 0
      guildLevel.value = ((data as Record<string, unknown>).guildLevel as number) ?? 0
    }
  }

  return {
    monsterKills,
    claimedGoals,
    encounteredMonsters,
    contributionPoints,
    guildExp,
    guildLevel,
    recordKill,
    recordEncounter,
    getKillCount,
    isEncountered,
    completedGoalCount,
    claimableGoals,
    claimGoal,
    donateItem,
    getDailyRemaining,
    getWeeklyRemaining,
    getTotalRemaining,
    getGuildAttackBonus,
    getGuildHpBonus,
    isShopItemUnlocked,
    buyShopItem,
    serialize,
    deserialize
  }
})
