import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { HIDDEN_NPCS, getHiddenNpcById } from '@/data/hiddenNpcs'
import { getHiddenNpcHeartEvents } from '@/data/hiddenNpcHeartEvents'
import { useGameStore } from './useGameStore'
import { useSkillStore } from './useSkillStore'
import { useAchievementStore } from './useAchievementStore'
import { useNpcStore } from './useNpcStore'
import { useQuestStore } from './useQuestStore'
import { useInventoryStore } from './useInventoryStore'
import { getCombinedItemCount, hasCombinedItem, removeCombinedItem } from '@/composables/useCombinedInventory'
import { usePlayerStore } from './usePlayerStore'
import router from '@/router'
import type { HiddenNpcState, DiscoveryCondition, DiscoveryStep, AffinityLevel, BondBonusType } from '@/types/hiddenNpc'
import type { Quality, HeartEventDef } from '@/types'
import { AFFINITY_THRESHOLDS, MAX_AFFINITY, AFFINITY_DECAY_BONDED, AFFINITY_DECAY_COURTING, MAX_OFFERS_PER_WEEK } from '@/types/hiddenNpc'

/** 供奉基础缘分值 */
const OFFERING_RESONANT = 100
const OFFERING_PLEASED = 50
const OFFERING_NEUTRAL = 10
const OFFERING_REPELLED = -40

/** 品质乘数 */
const QUALITY_MULTIPLIER: Record<Quality, number> = {
  normal: 1,
  fine: 1.25,
  excellent: 1.5,
  supreme: 2
}

/** 显灵日供奉乘数 */
const MANIFESTATION_BONUS = 3

const defaultState = (npcId: string): HiddenNpcState => ({
  npcId,
  discoveryPhase: 'unknown',
  completedSteps: [],
  affinity: 0,
  interactedToday: false,
  offeredToday: false,
  offersThisWeek: 0,
  specialInteractionCooldown: 0,
  courting: false,
  bonded: false,
  triggeredHeartEvents: [],
  unlockedAbilities: []
})

export const useHiddenNpcStore = defineStore('hiddenNpc', () => {
  const hiddenNpcStates = ref<HiddenNpcState[]>(HIDDEN_NPCS.map(n => defaultState(n.id)))

  // ==================== 基础查询 ====================

  const getHiddenNpcState = (npcId: string): HiddenNpcState | undefined => hiddenNpcStates.value.find(s => s.npcId === npcId)

  const getAffinityLevel = (npcId: string): AffinityLevel => {
    const state = getHiddenNpcState(npcId)
    if (!state) return 'wary'
    for (const t of AFFINITY_THRESHOLDS) {
      if (state.affinity >= t.min) return t.level
    }
    return 'wary'
  }

  const getRevealedNpcs = computed(() =>
    HIDDEN_NPCS.filter(n => {
      const s = getHiddenNpcState(n.id)
      return s && s.discoveryPhase === 'revealed'
    })
  )

  const getRumorNpcs = computed(() =>
    HIDDEN_NPCS.filter(n => {
      const s = getHiddenNpcState(n.id)
      return s && (s.discoveryPhase === 'rumor' || s.discoveryPhase === 'glimpse')
    })
  )

  const getBondedNpc = computed(() => {
    const state = hiddenNpcStates.value.find(s => s.bonded)
    return state ? getHiddenNpcById(state.npcId) : undefined
  })

  /** 是否为显灵日 */
  const isManifestationDay = (npcId: string): boolean => {
    const def = getHiddenNpcById(npcId)
    if (!def) return false
    const gameStore = useGameStore()
    return gameStore.season === def.manifestationDay.season && gameStore.day === def.manifestationDay.day
  }

  // ==================== 发现系统 ====================

  /** 评估单个发现条件 */
  const evaluateCondition = (cond: DiscoveryCondition): boolean => {
    const gameStore = useGameStore()
    const skillStore = useSkillStore()
    const achievementStore = useAchievementStore()
    const npcStore = useNpcStore()
    const questStore = useQuestStore()
    const inventoryStore = useInventoryStore()
    const playerStore = usePlayerStore()

    switch (cond.type) {
      case 'season':
        return gameStore.season === cond.season
      case 'weather':
        return gameStore.weather === cond.weather
      case 'timeRange':
        return gameStore.hour >= cond.minHour && gameStore.hour <= cond.maxHour
      case 'location': {
        const routeName = router.currentRoute.value.name
        return routeName === cond.panel
      }
      case 'item':
        return getCombinedItemCount(cond.itemId) >= (cond.quantity ?? 1)
      case 'skill':
        return skillStore.getSkill(cond.skillType as any).level >= cond.minLevel
      case 'npcFriendship': {
        const npcState = npcStore.getNpcState(cond.npcId)
        return npcState ? npcState.friendship >= cond.minFriendship : false
      }
      case 'questComplete':
        return questStore.completedMainQuests.includes(cond.questId)
      case 'mineFloor':
        return achievementStore.stats.highestMineFloor >= cond.minFloor
      case 'fishCaught':
        return achievementStore.discoveredItems.includes(cond.fishId)
      case 'money':
        return playerStore.money >= cond.minAmount
      case 'yearMin':
        return gameStore.year >= cond.year
      case 'day':
        return gameStore.day === cond.day
      default:
        return false
    }
  }

  /** 检查所有NPC的发现进度 */
  const checkDiscoveryConditions = (): { npcId: string; step: DiscoveryStep }[] => {
    const triggered: { npcId: string; step: DiscoveryStep }[] = []

    for (const npc of HIDDEN_NPCS) {
      const state = getHiddenNpcState(npc.id)
      if (!state || state.discoveryPhase === 'revealed') continue

      // 发现链中按顺序找到下一个未完成的步骤
      for (const step of npc.discoverySteps) {
        if (state.completedSteps.includes(step.id)) continue

        // 检查所有条件
        const allMet = step.conditions.every(evaluateCondition)
        if (allMet) {
          state.completedSteps.push(step.id)
          state.discoveryPhase = step.phase
          triggered.push({ npcId: npc.id, step })
        }
        break // 一次只推进一步
      }
    }

    return triggered
  }

  // ==================== 互动系统 ====================

  /** 增减缘分 */
  const addAffinity = (npcId: string, amount: number) => {
    const state = getHiddenNpcState(npcId)
    if (!state) return
    state.affinity = Math.max(0, Math.min(MAX_AFFINITY, state.affinity + amount))
  }

  /** 供奉物品 */
  const performOffering = (
    npcId: string,
    itemId: string,
    quality: Quality
  ): { success: boolean; message: string; affinityChange: number } => {
    const state = getHiddenNpcState(npcId)
    const def = getHiddenNpcById(npcId)
    if (!state || !def) return { success: false, message: '找不到此仙灵。', affinityChange: 0 }
    if (state.discoveryPhase !== 'revealed') return { success: false, message: '尚未与此仙灵建立联系。', affinityChange: 0 }
    if (state.offeredToday) return { success: false, message: '今日已供奉过了。', affinityChange: 0 }
    if (state.offersThisWeek >= MAX_OFFERS_PER_WEEK) return { success: false, message: '本周供奉次数已满。', affinityChange: 0 }

    const inventoryStore = useInventoryStore()
    if (!inventoryStore.removeItem(itemId, 1, quality)) {
      return { success: false, message: '背包中没有此物品。', affinityChange: 0 }
    }

    let base = OFFERING_NEUTRAL
    if (def.resonantOfferings.includes(itemId)) base = OFFERING_RESONANT
    else if (def.pleasedOfferings.includes(itemId)) base = OFFERING_PLEASED
    else if (def.repelledOfferings.includes(itemId)) base = OFFERING_REPELLED

    let multiplier = QUALITY_MULTIPLIER[quality]
    if (isManifestationDay(npcId)) multiplier *= MANIFESTATION_BONUS

    const change = Math.round(base * multiplier)
    addAffinity(npcId, change)
    state.offeredToday = true
    state.offersThisWeek++

    let reaction = '……'
    if (base === OFFERING_RESONANT) reaction = `${def.name}感到灵犀相通。`
    else if (base === OFFERING_PLEASED) reaction = `${def.name}表示认可。`
    else if (base === OFFERING_REPELLED) reaction = `${def.name}皱起了眉头。`
    else reaction = `${def.name}接受了供奉。`

    return { success: true, message: reaction, affinityChange: change }
  }

  /** 执行独特互动 */
  const performSpecialInteraction = (npcId: string): { success: boolean; message: string; affinityChange: number } => {
    const state = getHiddenNpcState(npcId)
    const def = getHiddenNpcById(npcId)
    if (!state || !def) return { success: false, message: '找不到此仙灵。', affinityChange: 0 }
    if (state.discoveryPhase !== 'revealed') return { success: false, message: '尚未与此仙灵建立联系。', affinityChange: 0 }
    if (state.interactedToday) return { success: false, message: '今日已互动过了。', affinityChange: 0 }
    if (state.specialInteractionCooldown > 0)
      return { success: false, message: `需要再等${state.specialInteractionCooldown}天。`, affinityChange: 0 }

    const skillStore = useSkillStore()
    let affinityGain = 30
    let message = ''

    switch (def.interactionType) {
      case 'meditation': {
        // 参悟：缘分增加 = 总技能等级 × 3
        const totalLevels =
          skillStore.getSkill('farming').level +
          skillStore.getSkill('foraging').level +
          skillStore.getSkill('fishing').level +
          skillStore.getSkill('mining').level
        affinityGain = totalLevels * 3
        message = `你与${def.name}在水边静坐参悟。`
        break
      }
      case 'music': {
        // 奏乐：基础30，随机额外 0-20
        affinityGain = 30 + Math.floor(Math.random() * 21)
        message = `你与${def.name}合奏了一曲。`
        break
      }
      case 'ritual': {
        // 祭仪：固定40
        affinityGain = 40
        message = `你与${def.name}完成了一次祭仪。`
        break
      }
      case 'dreamwalk': {
        // 入梦：固定35
        affinityGain = 35
        message = `你与${def.name}共游了一段梦境。`
        break
      }
      case 'cultivation': {
        // 修炼：成功率 = 挖矿×5 + 采集×5，成功+40，失败+10
        const successRate = skillStore.getSkill('mining').level * 5 + skillStore.getSkill('foraging').level * 5
        if (Math.random() * 100 < successRate) {
          affinityGain = 40
          message = `修炼成功！你与${def.name}共同感悟天地灵气。`
          const playerStore = usePlayerStore()
          playerStore.restoreStamina(10)
        } else {
          affinityGain = 10
          message = `修炼未能圆满，但${def.name}点了点头表示认可你的努力。`
        }
        break
      }
    }

    addAffinity(npcId, affinityGain)
    state.interactedToday = true
    state.specialInteractionCooldown = 1

    return { success: true, message, affinityChange: affinityGain }
  }

  // ==================== 求缘与结缘 ====================

  const startCourting = (npcId: string): { success: boolean; message: string } => {
    const state = getHiddenNpcState(npcId)
    const def = getHiddenNpcById(npcId)
    if (!state || !def) return { success: false, message: '找不到此仙灵。' }
    if (!def.bondable) return { success: false, message: '此仙灵无法结缘。' }
    if (state.courting) return { success: false, message: '已在求缘中。' }
    if (state.bonded) return { success: false, message: '已结缘。' }
    if (state.affinity < def.courtshipThreshold) return { success: false, message: `缘分不足（需要${def.courtshipThreshold}）。` }

    // 检查是否已有结缘对象
    const existingBond = hiddenNpcStates.value.find(s => s.bonded || s.courting)
    if (existingBond && existingBond.npcId !== npcId) {
      return { success: false, message: '已与其他仙灵有缘分羁绊。' }
    }

    const inventoryStore = useInventoryStore()
    if (!inventoryStore.removeItem(def.courtshipItemId, 1)) {
      return { success: false, message: `需要「${def.courtshipItemId}」。` }
    }

    state.courting = true
    return { success: true, message: `${def.name}接受了你的求缘。` }
  }

  const formBond = (npcId: string): { success: boolean; message: string } => {
    const state = getHiddenNpcState(npcId)
    const def = getHiddenNpcById(npcId)
    if (!state || !def) return { success: false, message: '找不到此仙灵。' }
    if (!state.courting) return { success: false, message: '需要先求缘。' }
    if (state.bonded) return { success: false, message: '已结缘。' }
    if (state.affinity < def.bondThreshold) return { success: false, message: `缘分不足（需要${def.bondThreshold}）。` }

    const inventoryStore = useInventoryStore()
    if (!inventoryStore.removeItem(def.bondItemId, 1)) {
      return { success: false, message: `需要「${def.bondItemId}」。` }
    }

    state.bonded = true
    return { success: true, message: `你与${def.name}结下了永世仙缘。` }
  }

  const dissolveBond = (npcId: string): { success: boolean; message: string } => {
    const state = getHiddenNpcState(npcId)
    const def = getHiddenNpcById(npcId)
    if (!state || !def) return { success: false, message: '找不到此仙灵。' }
    if (!state.bonded && !state.courting) return { success: false, message: '无缘分羁绊可解除。' }

    const playerStore = usePlayerStore()
    if (playerStore.money < 10000) return { success: false, message: '需要10000文。' }
    playerStore.spendMoney(10000)

    state.bonded = false
    state.courting = false
    state.affinity = Math.min(state.affinity, 1000)
    return { success: true, message: `与${def.name}的缘分已解。` }
  }

  // ==================== 仙灵物品制作 ====================

  const craftSpiritItem = (npcId: string, type: 'courtship' | 'bond'): { success: boolean; message: string } => {
    const def = getHiddenNpcById(npcId)
    if (!def) return { success: false, message: '找不到此仙灵。' }

    const costs = type === 'courtship' ? def.courtshipCraftCost : def.bondCraftCost
    const outputItemId = type === 'courtship' ? def.courtshipItemId : def.bondItemId

    const inventoryStore = useInventoryStore()

    // 检查材料
    for (const cost of costs) {
      if (!hasCombinedItem(cost.itemId, cost.quantity)) {
        return { success: false, message: '材料不足。' }
      }
    }

    // 扣除材料
    for (const cost of costs) {
      removeCombinedItem(cost.itemId, cost.quantity)
    }

    // 添加产物
    inventoryStore.addItem(outputItemId, 1)
    return { success: true, message: '制作成功！' }
  }

  // ==================== 心事件 ====================

  const checkHeartEvent = (npcId: string): HeartEventDef | null => {
    const state = getHiddenNpcState(npcId)
    const def = getHiddenNpcById(npcId)
    if (!state || !def || state.discoveryPhase !== 'revealed') return null

    const events = getHiddenNpcHeartEvents(npcId)
    for (const event of events) {
      if (state.affinity >= event.requiredFriendship && !state.triggeredHeartEvents.includes(event.id)) {
        return event
      }
    }
    return null
  }

  /** 标记心事件为已触发 */
  const markHeartEventTriggered = (npcId: string, eventId: string) => {
    const state = getHiddenNpcState(npcId)
    if (state && !state.triggeredHeartEvents.includes(eventId)) {
      state.triggeredHeartEvents.push(eventId)
    }
  }

  // ==================== 能力系统 ====================

  const checkAbilityUnlocks = (): { id: string; npcId: string; name: string; description: string }[] => {
    const newlyUnlocked: { id: string; npcId: string; name: string; description: string }[] = []

    for (const npc of HIDDEN_NPCS) {
      const state = getHiddenNpcState(npc.id)
      if (!state || state.discoveryPhase !== 'revealed') continue

      for (const ability of npc.abilities) {
        if (state.affinity >= ability.affinityRequired && !state.unlockedAbilities.includes(ability.id)) {
          state.unlockedAbilities.push(ability.id)
          newlyUnlocked.push({ id: ability.id, npcId: npc.id, name: ability.name, description: ability.description })
        }
      }
    }

    return newlyUnlocked
  }

  /** 查询指定能力是否已激活 */
  const isAbilityActive = (abilityId: string): boolean => {
    return getActiveAbilities.value.some(a => a.id === abilityId)
  }

  /** 获取指定能力的被动值（未激活则返回0） */
  const getAbilityValue = (abilityId: string): number => {
    const ability = getActiveAbilities.value.find(a => a.id === abilityId)
    return ability?.passive.value ?? 0
  }

  /** 获取当前结缘对象的 bondBonus 类型（无结缘返回 null） */
  const getBondBonusType = (): string | null => {
    const bondedState = hiddenNpcStates.value.find(s => s.bonded)
    if (!bondedState) return null
    const def = getHiddenNpcById(bondedState.npcId)
    return def?.bondBonuses[0]?.type ?? null
  }

  /** 按类型查找结缘奖励（支持多奖励NPC） */
  const getBondBonusByType = (type: string): BondBonusType | null => {
    for (const state of hiddenNpcStates.value) {
      if (!state.bonded) continue
      const def = getHiddenNpcById(state.npcId)
      if (!def) continue
      const found = def.bondBonuses.find(b => b.type === type)
      if (found) return found
    }
    return null
  }

  /** 获取当前结缘对象的完整 bondBonus（兼容：返回第一个） */
  const getBondBonus = (): BondBonusType | null => {
    const bondedState = hiddenNpcStates.value.find(s => s.bonded)
    if (!bondedState) return null
    const def = getHiddenNpcById(bondedState.npcId)
    return def?.bondBonuses[0] ?? null
  }

  /** 获取所有激活的被动能力 */
  const getActiveAbilities = computed(() => {
    const abilities: {
      npcId: string
      id: string
      name: string
      passive: NonNullable<(typeof HIDDEN_NPCS)[0]['abilities'][0]['passive']>
    }[] = []

    for (const npc of HIDDEN_NPCS) {
      const state = getHiddenNpcState(npc.id)
      if (!state || state.discoveryPhase !== 'revealed') continue

      for (const ability of npc.abilities) {
        if (state.unlockedAbilities.includes(ability.id) && ability.passive) {
          abilities.push({ npcId: npc.id, id: ability.id, name: ability.name, passive: ability.passive })
        }
      }
    }

    return abilities
  })

  // ==================== 每日处理 ====================

  /** 处理结缘每日奖励 */
  const dailyBondBonus = (): { messages: string[] } => {
    const messages: string[] = []
    const bondedState = hiddenNpcStates.value.find(s => s.bonded)
    if (!bondedState) return { messages }

    const def = getHiddenNpcById(bondedState.npcId)
    if (!def) return { messages }

    const bonus = def.bondBonuses
    for (const b of bonus) {
      switch (b.type) {
        case 'weather_control': {
          if (Math.random() < b.chance) {
            // 龙灵控天：将明日天气设为晴天
            const gameStore = useGameStore()
            gameStore.setTomorrowWeather('sunny')
            messages.push(`${def.name}的灵力拨开了明日的阴云，明日将是晴天。`)
          }
          break
        }
        case 'crop_blessing': {
          if (Math.random() < b.chance) {
            messages.push(`${def.name}的祝福降临在田地上。`)
          }
          break
        }
        case 'animal_blessing': {
          // 被动效果，在动物产品品质判定时检查
          break
        }
        case 'stamina_restore': {
          const playerStore = usePlayerStore()
          playerStore.restoreStamina(b.amount)
          messages.push(`${def.name}为你恢复了${b.amount}点体力。`)
          break
        }
        case 'spirit_shield': {
          messages.push(`${def.name}的灵力护盾环绕着你。`)
          break
        }
        case 'sell_bonus': {
          // 被动效果，在出售时检查
          break
        }
        case 'fish_attraction': {
          if (Math.random() < b.chance) {
            messages.push(`${def.name}引来了灵鱼的气息。`)
          }
          break
        }
      }
    }

    return { messages }
  }

  /** 每日重置 */
  const dailyReset = () => {
    const gameStore = useGameStore()

    for (const state of hiddenNpcStates.value) {
      if (state.discoveryPhase !== 'revealed') continue

      // 缘分衰减（未互动且未供奉时）
      if (!state.interactedToday && !state.offeredToday) {
        if (state.bonded) {
          state.affinity = Math.max(0, state.affinity - AFFINITY_DECAY_BONDED)
        } else if (state.courting) {
          state.affinity = Math.max(0, state.affinity - AFFINITY_DECAY_COURTING)
        }
      }

      // 重置每日标记
      state.interactedToday = false
      state.offeredToday = false

      // 冷却递减
      if (state.specialInteractionCooldown > 0) {
        state.specialInteractionCooldown--
      }

      // 每周重置供奉次数（第7/14/21/28天）
      if (gameStore.day % 7 === 0) {
        state.offersThisWeek = 0
      }
    }
  }

  // ==================== 序列化 ====================

  const serialize = () => ({
    hiddenNpcStates: hiddenNpcStates.value
  })

  const deserialize = (data: ReturnType<typeof serialize>) => {
    const savedStates = (data.hiddenNpcStates ?? []).map((s: any) => ({
      ...defaultState(s.npcId),
      ...s
    }))
    // 合并：保留已保存的，为新增NPC补充默认状态
    const savedIds = new Set(savedStates.map((s: HiddenNpcState) => s.npcId))
    const newStates = HIDDEN_NPCS.filter(n => !savedIds.has(n.id)).map(n => defaultState(n.id))
    hiddenNpcStates.value = [...savedStates, ...newStates]
  }

  return {
    hiddenNpcStates,
    getHiddenNpcState,
    getAffinityLevel,
    getRevealedNpcs,
    getRumorNpcs,
    getBondedNpc,
    isManifestationDay,
    evaluateCondition,
    checkDiscoveryConditions,
    addAffinity,
    performOffering,
    performSpecialInteraction,
    startCourting,
    formBond,
    dissolveBond,
    craftSpiritItem,
    checkHeartEvent,
    markHeartEventTriggered,
    checkAbilityUnlocks,
    getActiveAbilities,
    isAbilityActive,
    getAbilityValue,
    getBondBonusType,
    getBondBonus,
    getBondBonusByType,
    dailyBondBonus,
    dailyReset,
    serialize,
    deserialize
  }
})
