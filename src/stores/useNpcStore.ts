import { ref } from 'vue'
import { defineStore } from 'pinia'
import type {
  NpcState,
  FriendshipLevel,
  HeartEventDef,
  Quality,
  ChildState,
  PregnancyState,
  PregnancyStage,
  ProposalResponse,
  FarmHelperTask,
  HiredHelper
} from '@/types'
import { NPCS, getNpcById, getHeartEventsForNpc, RECIPES, formatFeedUsage } from '@/data'
import { WEATHER_TIPS, getFortuneTip, getLivingTip, getRecipeTipMessage, NO_RECIPE_TIP, TIP_NPC_IDS } from '@/data/npcTips'
import { getItemById } from '@/data/items'
import { getProcessingRecipeById } from '@/data/processing'
import { buildChatterPool } from '@/data/npcChatter'
import {
  CHILD_GIFT_CHANCE,
  CHILD_GIFT_POOL,
  TEEN_HELP_PLOTS,
  fillChildText,
  getChildStageByAge,
  pickInteraction,
  pickMilestone
} from '@/data/childGrowth'
import { useInventoryStore } from './useInventoryStore'
import { removeCombinedItem } from '@/composables/useCombinedInventory'
import { useGameStore } from './useGameStore'
import { usePlayerStore } from './usePlayerStore'
import { useCookingStore } from './useCookingStore'
import { useFarmStore, formatExhaustedLog } from './useFarmStore'
import { useAnimalStore } from './useAnimalStore'
import { useFishPondStore } from './useFishPondStore'
import { useFishingStore } from './useFishingStore'
import { useProcessingStore } from './useProcessingStore'

/** 好感等级阈值 (10心制, 每心250点, 上限2500) */
const FRIENDSHIP_THRESHOLDS: { level: FriendshipLevel; min: number }[] = [
  { level: 'bestFriend', min: 2000 },
  { level: 'friendly', min: 1000 },
  { level: 'acquaintance', min: 500 },
  { level: 'stranger', min: 0 }
]

/** 好感等级的中文称谓与对应心数，供界面直接展示 */
export const FRIENDSHIP_LEVEL_INFO: Record<FriendshipLevel, { name: string; min: number; hearts: number }> = {
  stranger: { name: '陌生', min: 0, hearts: 0 },
  acquaintance: { name: '相识', min: 500, hearts: 2 },
  friendly: { name: '友好', min: 1000, hearts: 4 },
  bestFriend: { name: '挚友', min: 2000, hearts: 8 }
}

/** 好感等级顺序（由低到高） */
export const FRIENDSHIP_LEVEL_ORDER: FriendshipLevel[] = ['stranger', 'acquaintance', 'friendly', 'bestFriend']

/** 村民备注最多字数 */
export const NPC_NOTE_MAX_LENGTH = 8

export const useNpcStore = defineStore('npc', () => {
  const npcStates = ref<NpcState[]>(
    NPCS.map(npc => ({
      npcId: npc.id,
      friendship: 0,
      talkedToday: false,
      giftedToday: false,
      giftsThisWeek: 0,
      dating: false,
      married: false,
      zhiji: false,
      triggeredHeartEvents: []
    }))
  )

  /** 每日提示NPC是否已给过提示 */
  const tipGivenToday = ref<Record<string, boolean>>({})

  /** 子女列表 */
  const children = ref<ChildState[]>([])

  /** 子女ID自增计数器（避免释放后ID冲突） */
  const nextChildId = ref<number>(0)

  /** 结婚天数计数 */
  const daysMarried = ref<number>(0)

  /** 知己天数计数 */
  const daysZhiji = ref<number>(0)

  /** 孕期状态（null = 无孕期） */
  const pregnancy = ref<PregnancyState | null>(null)

  /** 配偶是否已提议要孩子（等待玩家回应） */
  const childProposalPending = ref<boolean>(false)

  /** 提议被拒绝次数（影响再次提议冷却） */
  const childProposalDeclinedCount = ref<number>(0)

  /** 距上次拒绝/等待的天数 */
  const daysSinceProposalDecline = ref<number>(0)

  /** 婚礼倒计时 (0=无婚礼待举行) */
  const weddingCountdown = ref<number>(0)

  /** 婚礼对象NPC ID */
  const weddingNpcId = ref<string | null>(null)

  // ============================================================
  // 雇工系统
  // ============================================================

  const hiredHelpers = ref<HiredHelper[]>([])
  const MAX_HELPERS = 2

  /** 雇工日薪 */
  const HELPER_WAGES: Record<FarmHelperTask, number> = {
    water: 100,
    feed: 150,
    harvest: 200,
    weed: 100,
    bait: 80,
    collect: 150
  }

  /** 雇工任务名称 */
  const HELPER_TASK_NAMES: Record<FarmHelperTask, string> = {
    water: '浇水',
    feed: '喂食',
    harvest: '收获',
    weed: '除草除虫',
    bait: '装饵',
    collect: '收加工品'
  }

  /** 雇工任务说明：讲清楚每种活到底干什么，免得玩家雇了之后看不出效果 */
  const HELPER_TASK_DESCRIPTIONS: Record<FarmHelperTask, string> = {
    water: '清晨为未浇水的作物浇水（最多约4-6块，好感高时更多）',
    feed: '喂饱畜舍里的牲畜和鱼塘的鱼',
    harvest: '收割已成熟的作物并放进你的背包（最多约5块）',
    weed: '清理田里的杂草与虫害',
    bait: '给所有蟹笼补上鱼饵',
    collect: '把加工坊中已完成的成品全部收起来'
  }

  /** 可雇佣的NPC列表（好感>=1000 且 未被雇佣 且 非配偶/知己） */
  const getHireableNpcs = (): {
    npcId: string
    name: string
    friendship: number
  }[] => {
    return npcStates.value
      .filter(s => {
        if (s.friendship < 1000) return false
        if (s.married || s.zhiji) return false
        if (hiredHelpers.value.some(h => h.npcId === s.npcId)) return false
        return true
      })
      .map(s => {
        const def = getNpcById(s.npcId)
        return {
          npcId: s.npcId,
          name: def?.name ?? s.npcId,
          friendship: s.friendship
        }
      })
  }

  /** 雇佣NPC */
  const hireHelper = (npcId: string, task: FarmHelperTask): { success: boolean; message: string } => {
    const state = getNpcState(npcId)
    if (!state) return { success: false, message: 'NPC不存在。' }
    if (state.friendship < 1000) return { success: false, message: '好感度不足（需要4心/1000）。' }
    if (state.married || state.zhiji) return { success: false, message: '伴侣和知己不可雇佣。' }
    if (hiredHelpers.value.length >= MAX_HELPERS) return { success: false, message: `最多雇佣${MAX_HELPERS}名帮手。` }
    if (hiredHelpers.value.some(h => h.npcId === npcId)) return { success: false, message: '此人已被雇佣。' }

    const npcDef = getNpcById(npcId)
    const name = npcDef?.name ?? npcId
    hiredHelpers.value.push({ npcId, task, dailyWage: HELPER_WAGES[task] })
    return {
      success: true,
      message: `${name}开始帮你${HELPER_TASK_NAMES[task]}了！(日薪${HELPER_WAGES[task]}文)`
    }
  }

  /** 解雇 */
  const dismissHelper = (npcId: string): { success: boolean; message: string } => {
    const idx = hiredHelpers.value.findIndex(h => h.npcId === npcId)
    if (idx < 0) return { success: false, message: '此人未被雇佣。' }

    const npcDef = getNpcById(npcId)
    const name = npcDef?.name ?? npcId
    hiredHelpers.value.splice(idx, 1)
    return { success: true, message: `${name}已离开。` }
  }

  /** 每日雇工结算（useEndDay调用） */
  const processDailyHelpers = (taskFilter?: FarmHelperTask[]): { messages: string[]; dismissedNpcs: string[] } => {
    const playerStore = usePlayerStore()
    const farmStore = useFarmStore()
    const animalStore = useAnimalStore()
    const inventoryStore = useInventoryStore()
    const messages: string[] = []
    const dismissed: string[] = []

    for (const helper of [...hiredHelpers.value]) {
      // 按任务类型过滤
      if (taskFilter && !taskFilter.includes(helper.task)) continue

      const npcDef = getNpcById(helper.npcId)
      const name = npcDef?.name ?? '雇工'
      const state = getNpcState(helper.npcId)

      // 已变为配偶/知己 → 自动解雇（不收工资）
      if (state && (state.married || state.zhiji)) {
        hiredHelpers.value = hiredHelpers.value.filter(h => h.npcId !== helper.npcId)
        messages.push(`${name}已成为你的${state.married ? '伴侣' : '知己'}，不再担任雇工。`)
        dismissed.push(helper.npcId)
        continue
      }

      const efficiency = state && state.friendship >= 2000 ? 1.5 : 1.0

      // 扣工资
      if (!playerStore.spendMoney(helper.dailyWage)) {
        hiredHelpers.value = hiredHelpers.value.filter(h => h.npcId !== helper.npcId)
        messages.push(`付不起${name}的工资，${name}不干了。`)
        dismissed.push(helper.npcId)
        continue
      }

      switch (helper.task) {
        case 'water': {
          const unwatered = farmStore.plots.filter(p => (p.state === 'planted' || p.state === 'growing') && !p.watered)
          const count = Math.min(unwatered.length, Math.floor(4 * efficiency) + Math.floor(Math.random() * 3))
          for (let i = 0; i < count; i++) farmStore.waterPlot(unwatered[i]!.id)
          if (count > 0) {
            // 说清楚浇的是「今天这一轮」，否则玩家一早看到地是干的会以为雇工没干活
            messages.push(`${name}一早帮你浇了${count}块地，今天这些地不用再浇了。(-${helper.dailyWage}文)`)
          } else if (farmStore.plots.some(p => p.state === 'planted' || p.state === 'growing')) {
            messages.push(`${name}来时地已经浇过了（下雨或洒水器），今天不用他动手。(-${helper.dailyWage}文)`)
          } else {
            messages.push(`${name}今天没什么可浇的——地里还没种东西。(-${helper.dailyWage}文)`)
          }
          break
        }
        case 'feed': {
          // 早上按默认饲料喂（不足补干草，背包、仓库都会用）
          const result = animalStore.feedAll()
          const fishPondStore = useFishPondStore()
          const fedFish = fishPondStore.pond.built && !fishPondStore.pond.fedToday ? fishPondStore.feedFish() : false
          const done: string[] = []
          if (result.fedCount > 0) done.push(`${result.fedCount}只牲畜（${formatFeedUsage(result.used)}）`)
          if (fedFish) done.push('鱼塘的鱼')
          const shortage = result.noFeedCount > 0 ? `饲料不足，${result.noFeedCount}只牲畜未喂。` : ''
          if (done.length > 0) {
            messages.push(`${name}帮你喂了${done.join('和')}。${shortage}(-${helper.dailyWage}文)`)
          } else if (shortage) {
            messages.push(`${name}发现${shortage}(-${helper.dailyWage}文)`)
          } else {
            messages.push(`${name}今天没什么需要喂的。(-${helper.dailyWage}文)`)
          }
          break
        }
        case 'harvest': {
          const harvestable = farmStore.plots.filter(p => p.state === 'harvestable')
          const count = Math.min(harvestable.length, Math.floor(5 * efficiency))
          // 按作物名统计，让玩家清楚到底收回来了什么，而不是只看到一句「收了N块地」
          const collected = new Map<string, number>()
          // 多茬作物收满后地块清空，单独记一条
          const exhaustedNames: string[] = []
          let leftInField = 0
          for (let i = 0; i < count; i++) {
            // 主背包和临时背包都满了就不再下地：作物留在田里，不会收了却放不进背包
            if (inventoryStore.isAllFull) {
              leftInField = count - i
              break
            }
            const result = farmStore.harvestPlot(harvestable[i]!.id)
            if (!result.cropId) continue
            const itemName = getItemById(result.cropId)?.name ?? result.cropId
            // 地块等级：每级额外 +1，与主产出同为普通品质
            const quantity = 1 + result.bonus
            if (inventoryStore.addItem(result.cropId, quantity, 'normal')) {
              collected.set(itemName, (collected.get(itemName) ?? 0) + quantity)
            }
            if (result.exhausted) exhaustedNames.push(itemName)
          }
          const wageLabel = `(-${helper.dailyWage}文)`
          const leftLabel = `背包放不下，${name}只好把${leftInField}份收成留在了田里。`
          if (collected.size > 0) {
            const detail = [...collected.entries()].map(([n, c]) => `${n}×${c}`).join('、')
            messages.push(`${name}帮你收了${detail}，已放进背包。${wageLabel}`)
            if (leftInField > 0) messages.push(leftLabel)
          } else if (leftInField > 0) {
            messages.push(`${leftLabel}${wageLabel}`)
          } else {
            messages.push(`${name}今天没什么可收的——地里还没有成熟的作物。${wageLabel}`)
          }
          if (exhaustedNames.length > 0) messages.push(formatExhaustedLog(exhaustedNames))
          break
        }
        case 'collect': {
          // 收取加工坊里已完成的产物，省去玩家逐个点收
          const processingStore = useProcessingStore()
          // 收取前按产物汇总实际数量（含设备等级），收取后槽位会被重置
          const totals = new Map<string, number>()
          for (const slot of processingStore.machines) {
            const outputId = slot.ready && slot.recipeId ? getProcessingRecipeById(slot.recipeId)?.outputItemId : undefined
            if (!outputId) continue
            const outputName = getItemById(outputId)?.name ?? outputId
            totals.set(outputName, (totals.get(outputName) ?? 0) + processingStore.getSlotOutputQuantity(slot))
          }
          const collected = processingStore.collectAllReady()
          if (collected > 0) {
            const detail = [...totals.entries()].map(([n, c]) => `${n}×${c}`).join('、')
            messages.push(`${name}帮你从加工坊收了${detail}。(-${helper.dailyWage}文)`)
          } else messages.push(`${name}去加工坊转了一圈，今天没有做好的东西。(-${helper.dailyWage}文)`)
          break
        }
        case 'weed': {
          let cleared = 0
          for (const plot of farmStore.plots) {
            if (plot.weedy) {
              farmStore.clearWeed(plot.id)
              cleared++
            }
            if (plot.infested) {
              farmStore.curePest(plot.id)
              cleared++
            }
          }
          if (cleared > 0) messages.push(`${name}清理了${cleared}处杂草和虫害。(-${helper.dailyWage}文)`)
          else messages.push(`${name}今天田里挺干净的。(-${helper.dailyWage}文)`)
          break
        }
        case 'bait': {
          const fishingStore = useFishingStore()
          const baited = fishingStore.baitAllCrabPots()
          if (baited > 0) messages.push(`${name}帮你给${baited}个蟹笼装了饵。(-${helper.dailyWage}文)`)
          else messages.push(`${name}今天蟹笼都有饵了。(-${helper.dailyWage}文)`)
          break
        }
      }
    }
    return { messages, dismissedNpcs: dismissed }
  }

  /** 子女名字池（按性别） */
  const CHILD_NAMES_MALE = ['小龙', '小宝', '团子', '年年']
  const CHILD_NAMES_FEMALE = ['小凤', '阿花', '豆豆', '圆圆']

  /** 再要一个孩子前，最小的孩子至少要长到的天数（约两个季节，刚会走路） */
  const MIN_DAYS_BETWEEN_CHILDREN = 56

  /** 获取NPC状态 */
  const getNpcState = (npcId: string): NpcState | undefined => {
    return npcStates.value.find(s => s.npcId === npcId)
  }

  /** 获取好感等级 */
  const getFriendshipLevel = (npcId: string): FriendshipLevel => {
    const state = getNpcState(npcId)
    if (!state) return 'stranger'
    for (const t of FRIENDSHIP_THRESHOLDS) {
      if (state.friendship >= t.min) return t.level
    }
    return 'stranger'
  }

  /** 检查NPC今天是否生日 */
  const isBirthday = (npcId: string): boolean => {
    const npcDef = getNpcById(npcId)
    if (!npcDef?.birthday) return false
    const gameStore = useGameStore()
    return npcDef.birthday.season === gameStore.season && npcDef.birthday.day === gameStore.day
  }

  /** 今天还能不能给这位村民送礼（含生日额外一次） */
  const canGiftToday = (npcId: string): boolean => {
    const state = getNpcState(npcId)
    if (!state) return false
    if (isBirthday(npcId) && !state.birthdayGiftGiven) return true
    return !state.giftedToday && state.giftsThisWeek < 2
  }

  /** 送礼状态说明文案，供界面直接展示 */
  const getGiftStatusText = (npcId: string): string => {
    const state = getNpcState(npcId)
    if (!state) return ''
    if (isBirthday(npcId) && !state.birthdayGiftGiven) return '生日礼 ×4'
    if (state.giftedToday) return '今日已送'
    if (state.giftsThisWeek >= 2) return '本周已送满'
    return `可送礼 ${state.giftsThisWeek}/2`
  }

  /** 获取今天过生日的NPC (null if none) */
  const getTodayBirthdayNpc = (): string | null => {
    const gameStore = useGameStore()
    for (const npc of NPCS) {
      if (npc.birthday && npc.birthday.season === gameStore.season && npc.birthday.day === gameStore.day) {
        return npc.id
      }
    }
    return null
  }

  /** 检查是否有可触发的心事件（对话后调用） */
  const checkHeartEvent = (npcId: string): HeartEventDef | null => {
    const state = getNpcState(npcId)
    if (!state) return null
    const events = getHeartEventsForNpc(npcId)
    for (const event of events) {
      // 知己事件仅知己触发
      if (event.requiresZhiji && !state.zhiji) continue
      // 知己不触发恋爱告白（heart_8）
      if (!event.requiresZhiji && state.zhiji && event.id.endsWith('_heart_8')) continue
      if (state.friendship >= event.requiredFriendship && !state.triggeredHeartEvents.includes(event.id)) {
        return event
      }
    }
    return null
  }

  /** 标记心事件为已触发 */
  const markHeartEventTriggered = (npcId: string, eventId: string) => {
    const state = getNpcState(npcId)
    if (state && !state.triggeredHeartEvents.includes(eventId)) {
      state.triggeredHeartEvents.push(eventId)
    }
  }

  /** 调整好感度（心事件选择结果） */
  const adjustFriendship = (npcId: string, amount: number) => {
    const state = getNpcState(npcId)
    if (state) {
      state.friendship = Math.max(0, state.friendship + amount)
    }
  }

  /** 替换对话中的占位符 */
  const replaceDialoguePlaceholders = (text: string): string => {
    const playerStore = usePlayerStore()
    return text.replace(/\{player\}/g, playerStore.playerName).replace(/\{title\}/g, playerStore.honorific)
  }

  /** 从候选池里挑一句，尽量避开上一次说过的那句 */
  const pickDialogue = (pool: string[], lastSaid?: string): string => {
    if (pool.length === 0) return '……'
    const fresh = pool.length > 1 && lastSaid ? pool.filter(line => line !== lastSaid) : pool
    const candidates = fresh.length > 0 ? fresh : pool
    return candidates[Math.floor(Math.random() * candidates.length)]!
  }

  /** 与NPC对话 (+20好感) */
  const talkTo = (npcId: string): { message: string; friendshipGain: number } | null => {
    const state = getNpcState(npcId)
    if (!state) return null
    if (state.talkedToday) return null

    state.talkedToday = true
    state.friendship += 20

    const npcDef = getNpcById(npcId)
    if (!npcDef) return null

    // 已婚NPC有特殊对话
    if (state.married) {
      const playerStore = usePlayerStore()
      const gameStore = useGameStore()
      const name = playerStore.playerName

      const marriedDialogues = [
        `${name}，今天辛苦了，早点回来吃饭。`,
        `我给${name}留了饭菜，还热着呢。`,
        '田里的活干完了吗？别太累了。',
        `有${name}在身边，每天都很开心。`,
        '今天想吃什么？我去准备。',
        '家里收拾好了，你歇会儿吧。',
        `和${name}在一起的日子，真好。`,
        `${name}，今天精神不错嘛。`
      ]

      const seasonDialogues: Record<string, string[]> = {
        spring: [`春天到了，院子里的花都开了呢。`, `${name}，春播忙完了吗？`],
        summer: [`好热啊……${name}多喝水。`, '夏天的西瓜最解暑了。'],
        autumn: [`秋天的风真舒服。${name}，要不要一起散步？`, '丰收的季节，辛苦种的东西都有了回报。'],
        winter: [`外面好冷，${name}快进屋暖和暖和。`, '冬天就该窝在家里喝热茶。']
      }

      const weatherDialogues: Record<string, string | null> = {
        rainy: '下雨了，田里不用浇水，在家歇歇吧。',
        stormy: '外面风雨好大，今天别出远门了。',
        snowy: '下雪了呢，外面白茫茫的，真好看。',
        windy: '风好大，出门小心别着凉了。',
        sunny: null,
        cloudy: null,
        green_rain: null
      }

      const pool = [...marriedDialogues, ...(seasonDialogues[gameStore.season] ?? [])]
      const weatherLine = weatherDialogues[gameStore.weather]
      if (weatherLine) pool.push(weatherLine)

      const message = pickDialogue(pool, state.lastDialogue)
      state.lastDialogue = message
      return { message, friendshipGain: 20 }
    }

    // 知己NPC使用知己专属对话
    if (state.zhiji && npcDef.zhijiDialogues?.length) {
      const raw = pickDialogue(npcDef.zhijiDialogues, state.lastDialogue)
      state.lastDialogue = raw
      return { message: replaceDialoguePlaceholders(raw), friendshipGain: 20 }
    }

    // 约会中NPC使用约会对话
    if (state.dating && npcDef.datingDialogues && npcDef.datingDialogues.length > 0) {
      const raw = pickDialogue(npcDef.datingDialogues, state.lastDialogue)
      state.lastDialogue = raw
      return { message: replaceDialoguePlaceholders(raw), friendshipGain: 20 }
    }

    // 普通关系：好感档台词 + 专属闲聊 + 情境闲聊混合，避免复读
    const gameStoreRef = useGameStore()
    const level = getFriendshipLevel(npcId)
    const pool = [...npcDef.dialogues[level]]
    pool.push(
      ...buildChatterPool(npcId, {
        season: gameStoreRef.season,
        weather: gameStoreRef.weather,
        period: gameStoreRef.timePeriod,
        level
      })
    )

    const raw = pickDialogue(pool, state.lastDialogue)
    state.lastDialogue = raw

    return { message: replaceDialoguePlaceholders(raw), friendshipGain: 20 }
  }

  /**
   * 纯闲聊：不加好感、不占用每日对话次数、不消耗时间。
   * 好感已经聊过之后，玩家仍然可以多听几句——村民不该是点一次就没反应的木头人。
   */
  const chatWith = (npcId: string): string | null => {
    const state = getNpcState(npcId)
    const npcDef = getNpcById(npcId)
    if (!state || !npcDef) return null

    const gameStoreRef = useGameStore()
    const level = getFriendshipLevel(npcId)
    const pool = buildChatterPool(npcId, {
      season: gameStoreRef.season,
      weather: gameStoreRef.weather,
      period: gameStoreRef.timePeriod,
      level
    })
    if (pool.length === 0) return null

    const raw = pickDialogue(pool, state.lastDialogue)
    state.lastDialogue = raw
    return replaceDialoguePlaceholders(raw)
  }

  /** 送礼给NPC (每天1次, 每周2次) */
  const giveGift = (
    npcId: string,
    itemId: string,
    giftBonusMultiplier: number = 1,
    quality: Quality = 'normal'
  ): { gain: number; reaction: string } | null => {
    const state = getNpcState(npcId)
    if (!state) return null

    // 生日礼走独立额度：不占每日一次、也不占每周两次，但本身只能送一次。
    // 这样即使本周已送满，生日当天照样能额外送一份。
    const isBirthdayGift = isBirthday(npcId) && !state.birthdayGiftGiven
    if (!isBirthdayGift) {
      if (state.giftedToday) return null
      if (state.giftsThisWeek >= 2) return null
    }

    // 背包、仓库里的都能送
    if (!removeCombinedItem(itemId, 1, quality)) return null

    if (isBirthdayGift) {
      state.birthdayGiftGiven = true
    } else {
      state.giftedToday = true
      state.giftsThisWeek++
    }
    const npcDef = getNpcById(npcId)
    if (!npcDef) return null

    let gain: number
    let reaction: string

    if (npcDef.lovedItems.includes(itemId)) {
      gain = 80
      reaction = '非常喜欢'
    } else if (npcDef.likedItems.includes(itemId)) {
      gain = 45
      reaction = '还不错'
    } else if (npcDef.hatedItems.includes(itemId)) {
      gain = -40
      reaction = '讨厌'
    } else {
      gain = 20
      reaction = '一般'
    }

    // 品质加成
    const qualityMultiplier: Record<Quality, number> = {
      normal: 1.0,
      fine: 1.25,
      excellent: 1.5,
      supreme: 2.0
    }
    // 生日加成 (4倍)
    const birthdayMultiplier = isBirthday(npcId) ? 4 : 1

    gain = Math.floor(gain * qualityMultiplier[quality] * birthdayMultiplier * giftBonusMultiplier)
    state.friendship = Math.max(0, state.friendship + gain)

    return { gain, reaction }
  }

  /** 赠帕开启约会 (需2000好感/8心) */
  const startDating = (npcId: string): { success: boolean; message: string } => {
    const state = getNpcState(npcId)
    if (!state) return { success: false, message: 'NPC不存在。' }

    const npcDef = getNpcById(npcId)
    if (!npcDef?.marriageable) return { success: false, message: '无法与此人约会。' }

    const playerStore = usePlayerStore()
    if (npcDef.gender === playerStore.gender) {
      return { success: false, message: '只能向异性赠帕。' }
    }

    if (state.dating) return { success: false, message: '你们已经在约会了。' }
    if (state.married) return { success: false, message: '你们已经结婚了。' }
    if (npcStates.value.some(s => s.married)) return { success: false, message: '你已经结婚了。' }
    if (state.friendship < 2000) return { success: false, message: '好感度不足（需要8心/2000）。' }

    if (!removeCombinedItem('silk_ribbon')) {
      return { success: false, message: '需要一条丝帕。' }
    }

    state.dating = true
    state.friendship += 160
    return {
      success: true,
      message: `${npcDef.name}羞红了脸，接过了你的丝帕……你们开始约会了！`
    }
  }

  /** 求婚 (需2500好感/10心) */
  const propose = (npcId: string): { success: boolean; message: string } => {
    const state = getNpcState(npcId)
    if (!state) return { success: false, message: 'NPC不存在。' }

    const npcDef = getNpcById(npcId)
    if (!npcDef?.marriageable) return { success: false, message: '这个人无法求婚。' }

    // 只允许异性求婚
    const playerStore = usePlayerStore()
    if (npcDef.gender === playerStore.gender) {
      return { success: false, message: '只能向异性求婚。' }
    }

    // 检查是否已有配偶
    const alreadyMarried = npcStates.value.some(s => s.married)
    if (alreadyMarried) return { success: false, message: '你已经结婚了。' }

    // 检查是否正在筹备婚礼
    if (weddingCountdown.value > 0) return { success: false, message: '婚礼正在筹备中。' }

    // 需要先约会
    if (!state.dating) return { success: false, message: '需要先赠帕约会。' }

    if (state.friendship < 2500) return { success: false, message: '好感度不足（需要10心/2500）。' }

    if (!removeCombinedItem('jade_ring')) {
      return { success: false, message: '需要一枚翡翠戒指。' }
    }

    // 设置婚礼倒计时而非立即结婚
    weddingCountdown.value = 3
    weddingNpcId.value = npcId
    state.friendship += 400
    return {
      success: true,
      message: `${npcDef.name}含泪接受了你的翡翠戒指……婚礼将在3天后举行！`
    }
  }

  /** 获取已婚配偶状态 */
  const getSpouse = (): NpcState | null => {
    return npcStates.value.find(s => s.married) ?? null
  }

  /** 获取知己状态 */
  const getZhiji = (): NpcState | null => {
    return npcStates.value.find(s => s.zhiji) ?? null
  }

  /** 赠玉结为知己 (需同性+2000好感) */
  const becomeZhiji = (npcId: string): { success: boolean; message: string } => {
    const state = getNpcState(npcId)
    if (!state) return { success: false, message: 'NPC不存在。' }

    const npcDef = getNpcById(npcId)
    if (!npcDef?.marriageable) return { success: false, message: '无法与此人结为知己。' }

    const playerStore = usePlayerStore()
    if (npcDef.gender !== playerStore.gender) {
      return { success: false, message: '只能与同性结为知己。' }
    }

    if (state.zhiji) return { success: false, message: '你们已经是知己了。' }
    if (state.dating || state.married) return { success: false, message: '无法与恋人或伴侣结为知己。' }
    if (npcStates.value.some(s => s.zhiji)) return { success: false, message: '你已经有知己了。' }
    if (state.friendship < 2000) return { success: false, message: '好感度不足（需要8心/2000）。' }

    if (!removeCombinedItem('zhiji_jade')) {
      return { success: false, message: '需要一块知己玉佩。' }
    }

    state.zhiji = true
    state.friendship += 160
    const label = playerStore.gender === 'male' ? '蓝颜知己' : '红颜知己'
    return {
      success: true,
      message: `${npcDef.name}郑重地接过了玉佩……你们结为了${label}！`
    }
  }

  /** 断绝知己之缘 */
  const dissolveZhiji = (): { success: boolean; message: string } => {
    const zhijiState = getZhiji()
    if (!zhijiState) return { success: false, message: '你还没有知己。' }

    const playerStore = usePlayerStore()
    if (!playerStore.spendMoney(10000)) {
      return { success: false, message: '金钱不足（需要10000文）。' }
    }

    const npcDef = getNpcById(zhijiState.npcId)
    zhijiState.zhiji = false
    zhijiState.friendship = 1000
    daysZhiji.value = 0

    return {
      success: true,
      message: `你和${npcDef?.name ?? '知己'}的知己之缘已断。`
    }
  }

  /** 每日婚礼倒计时更新 */
  const dailyWeddingUpdate = (): {
    weddingToday: boolean
    npcId: string | null
  } => {
    if (weddingCountdown.value <= 0 || !weddingNpcId.value) {
      return { weddingToday: false, npcId: null }
    }
    weddingCountdown.value--
    if (weddingCountdown.value <= 0) {
      const npcId = weddingNpcId.value
      const state = getNpcState(npcId)
      if (state) {
        state.married = true
        state.dating = false
        state.friendship = Math.max(state.friendship, 3500)
      }
      weddingNpcId.value = null
      return { weddingToday: true, npcId }
    }
    return { weddingToday: false, npcId: null }
  }

  /** 取消婚礼 */
  const cancelWedding = () => {
    weddingCountdown.value = 0
    weddingNpcId.value = null
  }

  /** 离婚 */
  const divorce = (): { success: boolean; message: string } => {
    const spouse = getSpouse()
    if (!spouse) return { success: false, message: '你还没有结婚。' }

    const playerStore = usePlayerStore()
    if (!playerStore.spendMoney(30000)) {
      return { success: false, message: '金钱不足（需要30000文）。' }
    }

    const npcDef = getNpcById(spouse.npcId)
    spouse.married = false
    spouse.dating = false
    spouse.friendship = 1000
    pregnancy.value = null
    childProposalPending.value = false
    daysMarried.value = 0
    cancelWedding()

    return {
      success: true,
      message: `你和${npcDef?.name ?? '配偶'}的婚姻结束了。`
    }
  }

  /** 放生子女 */
  const releaseChild = (childId: number): { success: boolean; message: string } => {
    const child = children.value.find(c => c.id === childId)
    if (!child) return { success: false, message: '找不到这个孩子。' }

    const playerStore = usePlayerStore()
    if (!playerStore.spendMoney(10000)) {
      return { success: false, message: '金钱不足（需要10000文）。' }
    }

    const name = child.name
    children.value = children.value.filter(c => c.id !== childId)
    return { success: true, message: `${name}被送往了远方亲戚家。` }
  }

  // ============================================================
  // 孕期养成系统
  // ============================================================

  const PREGNANCY_STAGE_CONFIG: Record<PregnancyStage, { days: number; label: string }> = {
    early: { days: 5, label: '初期' },
    mid: { days: 5, label: '中期' },
    late: { days: 5, label: '后期' },
    ready: { days: 3, label: '待产期' }
  }

  const STAGE_ORDER: PregnancyStage[] = ['early', 'mid', 'late', 'ready']

  const MEDICAL_PLANS = {
    normal: { cost: 1000, successRate: 0.8, label: '普通接生' },
    advanced: { cost: 5000, successRate: 0.95, label: '高级接生' },
    luxury: { cost: 15000, successRate: 1.0, label: '豪华接生' }
  } as const

  /** 检查配偶是否应提议要孩子（每日调用） */
  const checkChildProposal = (): boolean => {
    const spouse = getSpouse()
    if (!spouse) return false
    if (children.value.length >= 2) return false
    if (pregnancy.value !== null) return false
    if (childProposalPending.value) return false
    if (daysMarried.value < 7) return false
    if (spouse.friendship < 3000) return false
    // 刚添了孩子就再提，既不合情理也很扰人——最小的孩子要长到会走路才会再议
    if (children.value.length > 0) {
      const youngestAge = Math.min(...children.value.map(c => c.daysOld))
      if (youngestAge < MIN_DAYS_BETWEEN_CHILDREN) return false
    }
    // 拒绝冷却：7天基础 + 每次拒绝额外7天
    if (childProposalDeclinedCount.value > 0) {
      const cooldownDays = 7 + childProposalDeclinedCount.value * 7
      if (daysSinceProposalDecline.value < cooldownDays) return false
    }
    return Math.random() < 0.05
  }

  /** 触发提议（设置等待标记） */
  const triggerChildProposal = () => {
    childProposalPending.value = true
  }

  /** 玩家回应提议 */
  const respondToChildProposal = (response: ProposalResponse): { message: string; friendshipChange: number } => {
    childProposalPending.value = false
    const spouse = getSpouse()

    switch (response) {
      case 'accept':
        pregnancy.value = {
          stage: 'early',
          daysInStage: 0,
          stageDays: PREGNANCY_STAGE_CONFIG.early.days,
          careScore: 50,
          caredToday: false,
          giftedForPregnancy: false,
          companionToday: false,
          medicalPlan: null
        }
        if (spouse) spouse.friendship += 100
        childProposalDeclinedCount.value = 0
        daysSinceProposalDecline.value = 0
        return { message: '你们决定迎接新的家庭成员。', friendshipChange: 100 }

      case 'decline':
        if (spouse) spouse.friendship = Math.max(0, spouse.friendship - 50)
        childProposalDeclinedCount.value++
        daysSinceProposalDecline.value = 0
        return { message: '你委婉地拒绝了。', friendshipChange: -50 }

      case 'wait':
        daysSinceProposalDecline.value = 0
        childProposalDeclinedCount.value++ // 也计入冷却
        return { message: '你说了再等等看。', friendshipChange: 0 }
    }
  }

  /** 孕期照料操作 */
  const performPregnancyCare = (
    action: 'gift' | 'companion' | 'supplement' | 'rest'
  ): { success: boolean; message: string; careGain: number } => {
    if (!pregnancy.value) return { success: false, message: '没有待产。', careGain: 0 }

    let careGain = 0
    let message = ''

    switch (action) {
      case 'gift': {
        if (pregnancy.value.giftedForPregnancy) {
          return {
            success: false,
            message: '今天已经送过礼物了。',
            careGain: 0
          }
        }
        pregnancy.value.giftedForPregnancy = true
        careGain = pregnancy.value.stage === 'early' ? 5 : 3
        message = '你送了一份贴心的礼物。'
        break
      }
      case 'companion': {
        if (pregnancy.value.companionToday) {
          return { success: false, message: '今天已经陪伴过了。', careGain: 0 }
        }
        pregnancy.value.companionToday = true
        careGain = pregnancy.value.stage === 'mid' ? 5 : 3
        message = '你陪伴了一会儿，聊了很多。'
        break
      }
      case 'supplement': {
        const inventoryStore = useInventoryStore()
        const supplementItems: { id: string; gain: number }[] = [
          { id: 'ginseng', gain: 6 },
          { id: 'ginseng_tea', gain: 5 },
          { id: 'herb', gain: 3 },
          { id: 'green_tea_drink', gain: 3 },
          { id: 'chrysanthemum_tea', gain: 3 },
          { id: 'osmanthus_tea', gain: 3 }
        ]
        let found = false
        for (const si of supplementItems) {
          if (inventoryStore.removeItem(si.id, 1)) {
            found = true
            careGain = si.gain
            const itemDef = getItemById(si.id)
            message = `服用了${itemDef?.name ?? '补品'}。`
            break
          }
        }
        if (!found) {
          return {
            success: false,
            message: '没有合适的补品（人参/草药/茶饮）。',
            careGain: 0
          }
        }
        break
      }
      case 'rest': {
        if (pregnancy.value.caredToday) {
          return {
            success: false,
            message: '今天已经安排过休息了。',
            careGain: 0
          }
        }
        careGain = pregnancy.value.stage === 'late' ? 5 : 2
        message = '你让配偶好好休息了一天。'
        break
      }
    }

    pregnancy.value.careScore = Math.min(100, pregnancy.value.careScore + careGain)
    pregnancy.value.caredToday = true
    return { success: true, message, careGain }
  }

  /** 选择接生方式（仅待产期） */
  const chooseMedicalPlan = (plan: 'normal' | 'advanced' | 'luxury'): { success: boolean; message: string } => {
    if (!pregnancy.value) return { success: false, message: '没有待产。' }
    if (pregnancy.value.stage !== 'ready') return { success: false, message: '还没到待产期。' }

    const planInfo = MEDICAL_PLANS[plan]
    const playerStore = usePlayerStore()
    if (!playerStore.spendMoney(planInfo.cost)) {
      return {
        success: false,
        message: `金钱不足（需要${planInfo.cost}文）。`
      }
    }

    pregnancy.value.medicalPlan = plan
    return {
      success: true,
      message: `选择了${planInfo.label}（${planInfo.cost}文）。`
    }
  }

  /** 分娩处理（内部方法） */
  const handleDelivery = (): {
    born?: { name: string; quality: 'normal' | 'premature' | 'healthy' }
    miscarriage?: boolean
  } => {
    if (!pregnancy.value) return {}

    const plan = pregnancy.value.medicalPlan ?? 'normal'
    const planInfo = MEDICAL_PLANS[plan]

    // 成功率 = 医疗方案基础率 + 安产分加成（最高+15%）
    const careBonus = (pregnancy.value.careScore / 100) * 0.15
    const totalSuccessRate = Math.min(1.0, planInfo.successRate + careBonus)

    const success = Math.random() < totalSuccessRate

    if (!success) {
      pregnancy.value = null
      const spouse = getSpouse()
      if (spouse) {
        spouse.friendship = Math.max(0, spouse.friendship - 200)
      }
      return { miscarriage: true }
    }

    // 根据安产分决定出生品质
    const birthQuality: 'normal' | 'premature' | 'healthy' =
      pregnancy.value.careScore >= 80 ? 'healthy' : pregnancy.value.careScore < 40 ? 'premature' : 'normal'

    const isBoy = Math.random() < 0.5
    const namePool = isBoy ? CHILD_NAMES_MALE : CHILD_NAMES_FEMALE
    const usedNames = children.value.map(c => c.name)
    const availableNames = namePool.filter(n => !usedNames.includes(n))
    const name = availableNames[Math.floor(Math.random() * availableNames.length)] ?? '小宝'

    children.value.push({
      id: nextChildId.value++,
      name,
      daysOld: 0,
      stage: 'baby',
      friendship: birthQuality === 'healthy' ? 30 : 0,
      interactedToday: false,
      birthQuality
    })

    pregnancy.value = null
    return { born: { name, quality: birthQuality } }
  }

  /** 每日孕期更新 */
  const dailyPregnancyUpdate = (): {
    stageChanged?: { from: PregnancyStage; to: PregnancyStage }
    born?: { name: string; quality: 'normal' | 'premature' | 'healthy' }
    miscarriage?: boolean
  } => {
    // 结婚天数递增
    if (getSpouse()) daysMarried.value++

    // 拒绝冷却计时递增
    if (childProposalDeclinedCount.value > 0) {
      daysSinceProposalDecline.value++
    }

    if (!pregnancy.value) return {}

    // 重置每日照料标记
    pregnancy.value.caredToday = false
    pregnancy.value.giftedForPregnancy = false
    pregnancy.value.companionToday = false

    pregnancy.value.daysInStage++

    // 检查阶段完成
    if (pregnancy.value.daysInStage >= pregnancy.value.stageDays) {
      const currentStageIndex = STAGE_ORDER.indexOf(pregnancy.value.stage)

      if (pregnancy.value.stage === 'ready') {
        // 分娩
        return handleDelivery()
      }

      // 进入下一阶段
      const from = pregnancy.value.stage
      const nextStage = STAGE_ORDER[currentStageIndex + 1]!
      pregnancy.value.stage = nextStage
      pregnancy.value.daysInStage = 0
      pregnancy.value.stageDays = PREGNANCY_STAGE_CONFIG[nextStage].days

      return { stageChanged: { from, to: nextStage } }
    }

    return {}
  }

  /** 每日子女成长更新（仅已出生子女），返回成长里程碑文案 */
  const dailyChildUpdate = (): string[] => {
    const milestones: string[] = []
    const spouseName = (() => {
      const spouse = getSpouse()
      return spouse ? (getNpcById(spouse.npcId)?.name ?? '') : ''
    })()

    for (const child of children.value) {
      child.daysOld++
      child.interactedToday = false

      // 跨阶段时给出可感知的成长事件，而不是在后台悄悄翻页
      const nextStage = getChildStageByAge(child.daysOld)
      if (nextStage !== child.stage) {
        child.stage = nextStage
        milestones.push(fillChildText(pickMilestone(nextStage), child.name, spouseName))
      }
    }

    // 长成少年的孩子会主动分担农活
    const teens = children.value.filter(c => c.stage === 'teen')
    if (teens.length > 0) {
      const farmStore = useFarmStore()
      const unwatered = farmStore.plots.filter(p => (p.state === 'planted' || p.state === 'growing') && !p.watered)
      let watered = 0
      for (const teen of teens) {
        for (let i = 0; i < TEEN_HELP_PLOTS && watered < unwatered.length; i++) {
          farmStore.waterPlot(unwatered[watered]!.id)
          watered++
        }
        if (watered === 0) break
        milestones.push(`${teen.name}一早就去田里帮忙了。`)
        break
      }
      if (watered > 0) {
        milestones.push(`孩子帮你浇了${watered}块地。`)
      }
    }

    return milestones
  }

  /** 与子女互动 */
  const interactWithChild = (childId: number): { message: string; item?: string } | null => {
    const child = children.value.find(c => c.id === childId)
    if (!child) return null
    if (child.interactedToday) return null

    child.interactedToday = true
    child.friendship = Math.min(300, child.friendship + 2)

    const spouse = getSpouse()
    const spouseName = spouse ? (getNpcById(spouse.npcId)?.name ?? '') : ''
    const message = fillChildText(pickInteraction(child.stage), child.name, spouseName)

    // 大些的孩子会往家里带点小东西
    const pool = CHILD_GIFT_POOL[child.stage]
    if (pool.length > 0 && Math.random() < CHILD_GIFT_CHANCE[child.stage]) {
      const item = pool[Math.floor(Math.random() * pool.length)]!
      return { message: `${message}（+2好感）`, item }
    }

    return { message: `${message}（+2好感）` }
  }

  /** 检查NPC是否有每日提示功能 */
  const hasDailyTip = (npcId: string): boolean => {
    return (TIP_NPC_IDS as readonly string[]).includes(npcId)
  }

  /** 检查NPC今天是否已给过提示 */
  const isTipGivenToday = (npcId: string): boolean => {
    return tipGivenToday.value[npcId] ?? false
  }

  /** 获取NPC的每日提示 */
  const getDailyTip = (npcId: string): string | null => {
    if (!hasDailyTip(npcId)) return null
    if (tipGivenToday.value[npcId]) return null

    tipGivenToday.value[npcId] = true
    const gameStore = useGameStore()

    switch (npcId) {
      case 'li_yu':
        return WEATHER_TIPS[gameStore.tomorrowWeather]
      case 'zhou_xiucai':
        return getFortuneTip(gameStore.dailyLuck)
      case 'wang_dashen': {
        const cookingStore = useCookingStore()
        const unlockedRecipes = RECIPES.filter(r => cookingStore.unlockedRecipes.includes(r.id))
        if (unlockedRecipes.length === 0) return NO_RECIPE_TIP
        // 每周推荐一个固定食谱（基于年+周数的种子）
        const weekIndex = Math.floor((gameStore.day - 1) / 7)
        const seed = (gameStore.year - 1) * 16 + ['spring', 'summer', 'autumn', 'winter'].indexOf(gameStore.season) * 4 + weekIndex
        const recipe = unlockedRecipes[seed % unlockedRecipes.length]!
        const ingredientNames = recipe.ingredients.map(ing => {
          const item = getItemById(ing.itemId)
          return item ? `${item.name}×${ing.quantity}` : ing.itemId
        })
        return getRecipeTipMessage(recipe.name, ingredientNames)
      }
      case 'liu_cunzhang':
        return getLivingTip(gameStore.day, gameStore.year)
      default:
        return null
    }
  }

  /** 每日重置对话和送礼状态 + 伴侣好感衰减 */
  const dailyReset = () => {
    const gameStore = useGameStore()

    // 重置每日提示
    tipGivenToday.value = {}

    for (const state of npcStates.value) {
      // 只有已婚伴侣不聊天才会掉好感，普通NPC不衰减
      if (!state.talkedToday && state.married) {
        state.friendship = Math.max(0, state.friendship - 10)
      }
      // 知己不聊天也会掉好感（衰减较少）
      if (!state.talkedToday && state.zhiji) {
        state.friendship = Math.max(0, state.friendship - 5)
      }
      state.talkedToday = false
      state.giftedToday = false
      // 生日过完就把生日礼标记清掉，明年生日再用
      state.birthdayGiftGiven = false
      // 每周日重置周送礼计数 (day 7,14,21,28)
      if (gameStore.day % 7 === 0) {
        state.giftsThisWeek = 0
      }
    }

    // 知己天数递增
    if (getZhiji()) daysZhiji.value++
  }

  // ============================================================
  // 村民备注
  // ============================================================

  /** 玩家给村民写的备注（npcId → 备注） */
  const npcNotes = ref<Record<string, string>>({})

  /** 规整备注：去首尾空白，按字截断 */
  const normalizeNote = (note: string): string => Array.from(note.trim()).slice(0, NPC_NOTE_MAX_LENGTH).join('').trim()

  /** 设置备注；规整后为空则删除 */
  const setNpcNote = (npcId: string, note: string): void => {
    const normalized = normalizeNote(note)
    const next: Record<string, string> = {}
    for (const [id, value] of Object.entries(npcNotes.value)) {
      if (id !== npcId) next[id] = value
    }
    if (normalized) next[npcId] = normalized
    npcNotes.value = next
  }

  /** 获取备注，无备注返回空串 */
  const getNpcNote = (npcId: string): string => npcNotes.value[npcId] ?? ''

  /** 界面显示名：有备注为「原名(备注)」；找不到村民返回 npcId */
  const getNpcDisplayName = (npcId: string): string => {
    const name = getNpcById(npcId)?.name
    if (!name) return npcId
    const note = npcNotes.value[npcId]
    return note ? `${name}(${note})` : name
  }

  /** 读档：只保留字符串备注 */
  const loadNpcNotes = (raw: unknown): Record<string, string> => {
    if (!raw || typeof raw !== 'object') return {}
    const result: Record<string, string> = {}
    for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
      if (typeof value !== 'string') continue
      const note = normalizeNote(value)
      if (note) result[id] = note
    }
    return result
  }

  const serialize = () => {
    return {
      npcStates: npcStates.value,
      children: children.value,
      nextChildId: nextChildId.value,
      daysMarried: daysMarried.value,
      daysZhiji: daysZhiji.value,
      pregnancy: pregnancy.value,
      childProposalPending: childProposalPending.value,
      childProposalDeclinedCount: childProposalDeclinedCount.value,
      daysSinceProposalDecline: daysSinceProposalDecline.value,
      // 旧字段保留以兼容
      pendingChild: false,
      childCountdown: 0,
      weddingCountdown: weddingCountdown.value,
      weddingNpcId: weddingNpcId.value,
      hiredHelpers: hiredHelpers.value,
      npcNotes: npcNotes.value,
      friendshipVersion: 2
    }
  }

  const deserialize = (data: ReturnType<typeof serialize>) => {
    const isOldScale = !(data as any).friendshipVersion || (data as any).friendshipVersion < 2
    const savedStates = data.npcStates.map(s => ({
      ...s,
      // 旧存档好感度迁移: ×8 (300制→2500制)
      friendship: isOldScale ? Math.round(s.friendship * 8) : s.friendship,
      married: s.married ?? false,
      dating: s.dating ?? false,
      zhiji: (s as any).zhiji ?? false,
      giftsThisWeek: (s as any).giftsThisWeek ?? 0,
      triggeredHeartEvents: s.triggeredHeartEvents ?? []
    }))
    // 合并：保留已保存的状态，为新增NPC补充默认状态
    const savedIds = new Set(savedStates.map(s => s.npcId))
    const newNpcStates: NpcState[] = NPCS.filter(npc => !savedIds.has(npc.id)).map(npc => ({
      npcId: npc.id,
      friendship: 0,
      talkedToday: false,
      giftedToday: false,
      giftsThisWeek: 0,
      dating: false,
      married: false,
      zhiji: false,
      triggeredHeartEvents: []
    }))
    npcStates.value = [...savedStates, ...newNpcStates]
    children.value = ((data as any).children ?? []).map((c: any) => ({
      ...c,
      birthQuality: c.birthQuality ?? 'normal'
    }))
    // 旧存档无 nextChildId → 从已有子女推算
    nextChildId.value =
      (data as any).nextChildId ?? (children.value.length > 0 ? Math.max(...children.value.map((c: ChildState) => c.id)) + 1 : 0)
    daysMarried.value = (data as any).daysMarried ?? 0
    daysZhiji.value = (data as any).daysZhiji ?? 0

    // 新孕期系统
    pregnancy.value = (data as any).pregnancy ?? null
    childProposalPending.value = (data as any).childProposalPending ?? false
    childProposalDeclinedCount.value = (data as any).childProposalDeclinedCount ?? 0
    daysSinceProposalDecline.value = (data as any).daysSinceProposalDecline ?? 0

    // 旧存档迁移：pendingChild → pregnancy
    if ((data as any).pendingChild && !pregnancy.value) {
      const oldCountdown: number = (data as any).childCountdown ?? 0
      let stage: PregnancyStage = 'early'
      if (oldCountdown <= 3) stage = 'ready'
      else if (oldCountdown <= 8) stage = 'late'
      else if (oldCountdown <= 13) stage = 'mid'
      pregnancy.value = {
        stage,
        daysInStage: 0,
        stageDays: PREGNANCY_STAGE_CONFIG[stage].days,
        careScore: 50,
        caredToday: false,
        giftedForPregnancy: false,
        companionToday: false,
        medicalPlan: null
      }
    }

    weddingCountdown.value = (data as any).weddingCountdown ?? 0
    weddingNpcId.value = (data as any).weddingNpcId ?? null
    hiredHelpers.value = (data as any).hiredHelpers ?? []
    npcNotes.value = loadNpcNotes((data as any).npcNotes ?? {})
  }

  return {
    npcStates,
    children,
    nextChildId,
    daysMarried,
    daysZhiji,
    pregnancy,
    childProposalPending,
    childProposalDeclinedCount,
    daysSinceProposalDecline,
    weddingCountdown,
    weddingNpcId,
    hiredHelpers,
    HELPER_WAGES,
    HELPER_TASK_NAMES,
    HELPER_TASK_DESCRIPTIONS,
    getNpcState,
    getFriendshipLevel,
    isBirthday,
    canGiftToday,
    getGiftStatusText,
    getTodayBirthdayNpc,
    checkHeartEvent,
    markHeartEventTriggered,
    adjustFriendship,
    talkTo,
    chatWith,
    giveGift,
    startDating,
    propose,
    getSpouse,
    getZhiji,
    becomeZhiji,
    dissolveZhiji,
    dailyWeddingUpdate,
    cancelWedding,
    divorce,
    releaseChild,
    getHireableNpcs,
    hireHelper,
    dismissHelper,
    processDailyHelpers,
    checkChildProposal,
    triggerChildProposal,
    respondToChildProposal,
    performPregnancyCare,
    chooseMedicalPlan,
    dailyPregnancyUpdate,
    interactWithChild,
    dailyChildUpdate,
    dailyReset,
    hasDailyTip,
    isTipGivenToday,
    getDailyTip,
    tipGivenToday,
    npcNotes,
    setNpcNote,
    getNpcNote,
    getNpcDisplayName,
    PREGNANCY_STAGE_CONFIG,
    MEDICAL_PLANS,
    serialize,
    deserialize
  }
})
