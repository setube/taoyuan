import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  PersonaId,
  SystemMessage,
  SystemMessageKind,
  ConnectionMode,
  SystemQuest,
  MeritBuff,
  MeritShopOffer,
  MemoryTimelineEntry,
  SystemAffinityDaily,
  SystemMemoryState,
  AffinityBehaviorKey,
  SystemTriggerType
} from '@/types/system'
import {
  AFFINITY_MILESTONES,
  createDefaultAffinityDaily,
  createDefaultMemoryState
} from '@/types/system'
import { MERIT_CATALOG, getMeritBagExpandCost } from '@/data/meritShop'
import { PERSONA_AWAKENING_GIFTS } from '@/data/personaAwakeningGifts'
import {
  applyMeritEffect,
  canPurchaseOffer,
  catalogToOffer,
  expireTimedBuffs,
  getPurchaseCount,
  isOfferSoldOut,
  migratePurchasedCatalogIds,
  recordMeritPurchase
} from '@/composables/meritShopEngine'
import {
  meritWishApiToOffer,
  type MeritWishApiResponse
} from '@/composables/meritWishEngine'
import { tryMeritDevCheat } from '@/composables/meritDevCheat'
import { applyMaterialDevCheat, tryMaterialDevCheat } from '@/composables/materialDevCheat'
import { applyRecipeDevCheat, tryRecipeDevCheat } from '@/composables/recipeDevCheat'
import { getAnalyticsSessionId, getAnalyticsVisitorId } from '@/composables/useAnalytics'
import { matchKnowledge } from '@/data/systemKnowledge'
import {
  checkPanelAbsencePenalties,
  ensureAffinityDaily,
  evaluatePersonaBehavior,
  GEM_ITEM_IDS,
  isTeaOrIncenseGift,
  onAdviceAdoptedDaily,
  onPanelOpenDaily,
  onPlayerChatDaily,
  RARE_DROP_IDS,
  SPICY_RECIPE_IDS,
  SWEET_RECIPE_IDS,
  TEA_DRINK_IDS
} from '@/composables/systemAffinityEngine'
import {
  appendTimeline,
  buildPeriodicSummary,
  detectOfflineDays,
  pickMilestoneRecall,
  recordCropHarvest,
  recordFirstCrop,
  recordFirstDeathFloor,
  recordFirstExpansion,
  recordFirstFish,
  recordFirstMaxFriendNpc,
  shouldWritePeriodicSummary,
  trackMiningActivity,
  updateDeepestMine
} from '@/composables/systemMemoryEngine'
import {
  getAbsenceWelcomeMessage,
  getGoodnightMessage,
  getProactiveCareMessage,
  shouldShowMilestoneRecall
} from '@/composables/systemCompanionEngine'
import {
  buildTriggerEventSummary,
  buildTriggerMessage,
  canFireTrigger,
  evaluateStaminaAlert,
  markTriggerFired,
  type TriggerPayload
} from '@/composables/systemTriggerEngine'
import { getNpcById } from '@/data/npcs'
import { getItemById } from '@/data/items'
import { useGameStore } from '@/stores/useGameStore'
import { usePlayerStore } from '@/stores/usePlayerStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useInventoryStore } from '@/stores/useInventoryStore'
import { useSkillStore } from '@/stores/useSkillStore'
import { useHomeStore } from '@/stores/useHomeStore'
import { useTavernStore } from '@/stores/useTavernStore'
import { createId } from '@/utils/id'
import { getBackendUrl } from '@/utils/backendUrl'
import { useSaveStore } from './useSaveStore'
import { getCombinedItemCount } from '@/composables/useCombinedInventory'
import {
  applyNegotiation,
  countActiveQuests,
  createQuestFromTemplate,
  formatQuestDescription,
  getQuestAnnouncement,
  getQuestRequestRedirectReply,
  getNegotiationPersonaLine,
  isQuestRequestIntent,
  MAX_ACTIVE_QUESTS,
  getExpireMessage,
  pickQuestTemplate,
  processExpiredQuests,
  reconcileQuestsOnLoad as reconcileQuestsEngine,
  recordFeastCompleted,
  recordTavernDailyRevenue,
  canSubmitSystemQuest,
  consumeQuestSubmissionMaterials,
  type QuestProgressContext,
  type QuestValidationContext
} from '@/composables/systemQuestEngine'
import { requestAiQuestDispatch } from '@/composables/systemQuestDispatch'
import { buildGameContext } from '@/composables/buildGameContext'
import type { QuestNegotiationType, QuestOutcomeAlert } from '@/types/system'
import {
  buildOfflineQuestEvaluation,
  type QuestEvaluationOutcome
} from '@/composables/questEvaluationEngine'
import { useAchievementStore } from '@/stores/useAchievementStore'
import { useNpcStore } from '@/stores/useNpcStore'
import { useWarehouseStore } from '@/stores/useWarehouseStore'
import { useAnimalStore } from '@/stores/useAnimalStore'
import { useFishPondStore } from '@/stores/useFishPondStore'
import { useBreedingStore } from '@/stores/useBreedingStore'

export const useSystemStore = defineStore('system', () => {
  // === 人格 ===
  const personaId = ref<PersonaId | null>(null)

  // === 觉醒 ===
  const awakened = ref(false)
  const firstContactDay = ref(-1)
  const pendingAwakening = ref(false)

  // === 连接 ===
  const mode = ref<ConnectionMode>('offline')
  const backendUrl = ref<string | null>(null)
  const sessionToken = ref<string | null>(null)
  const cloudBackupEnabled = ref(false)
  const isConnecting = ref(false)
  /** 在线对话会话 ID（每存档独立，随 system 序列化） */
  const chatSessionId = ref<string | null>(null)

  const BACKEND_URL = getBackendUrl()

  /** 后端 API 公共请求 */
  const apiFetch = async (path: string, options?: RequestInit): Promise<any> => {
    try {
      const res = await fetch(`${BACKEND_URL}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(sessionToken.value ? { Authorization: `Bearer ${sessionToken.value}` } : {}),
          ...options?.headers
        }
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        throw new Error(err.error ?? `请求失败 (${res.status})`)
      }
      return res.json()
    } catch (e: any) {
      console.warn('[SystemStore]', e.message)
      return null
    }
  }

  // === 消息 ===
  const messages = ref<SystemMessage[]>([])
  const unreadCount = ref(0)

  // === 亲和度 (0~100，隐藏) ===
  const affinity = ref(0)
  const affinityMilestonesReached = ref<Set<number>>(new Set())

  // === 任务 ===
  const merit = ref(0)
  const quests = ref<SystemQuest[]>([])
  const activeBuffs = ref<MeritBuff[]>([])
  /** 玩家向 AI 许愿后生成的专属商品（随存档持久化） */
  const customShopOffers = ref<MeritShopOffer[]>([])
  /** 目录/许愿商品已兑换次数 */
  const purchasedCatalogCounts = ref<Record<string, number>>({})
  /** @deprecated 仅用于旧存档迁移 */
  const purchasedCatalogIds = ref<string[]>([])

  // === 长期记忆 ===
  const timeline = ref<MemoryTimelineEntry[]>([])
  const memoryState = ref<SystemMemoryState>(createDefaultMemoryState())
  const affinityDaily = ref<SystemAffinityDaily>(createDefaultAffinityDaily())

  // === 面板状态 ===
  const panelOpen = ref(false)
  const panelFullscreen = ref(false)
  const panelTab = ref<'chat' | 'quests' | 'shop'>('chat')
  const inputText = ref('')
  /** 新派发任务的弹窗提示（不持久化） */
  const newQuestAlert = ref<{
    questId: string
    title: string
    description: string
    reward: number
    deadline: number
  } | null>(null)
  /** 任务完成/失败结算弹窗 */
  const questOutcomeAlert = ref<QuestOutcomeAlert | null>(null)
  /** 碎碎念气泡（面板关闭时展示） */
  const bubbleVisible = ref(false)
  const bubblePayload = ref<{
    content: string
    gameDay: number
    gameSeason: import('@/types/game').Season
    gameHour: number
  } | null>(null)
  let bubbleDismissTimer: ReturnType<typeof setTimeout> | null = null
  const isStreaming = ref(false)           // 是否正在接收流式回复
  const streamingMessageId = ref<string | null>(null)  // 当前流式消息 ID

  // === Computed ===
  const displayName = computed(() => {
    const names: Record<PersonaId, string> = {
      qingluan: '青鸾', chaofeng: '嘲风', taosu: '桃酥', moyan: '墨言'
    }
    return personaId.value ? names[personaId.value] : '???'
  })

  const connectionLabel = computed(() =>
    mode.value === 'online' ? '灵识在线' : '灵识托管中'
  )

  // === Actions ===

  function awaken(persona: PersonaId, day: number) {
    personaId.value = persona
    awakened.value = true
    firstContactDay.value = day
    affinity.value = 0
    addMumbleMessage(getAwakeningGreeting(persona), day)

    const gift = PERSONA_AWAKENING_GIFTS[persona]
    if (gift.merit) merit.value += gift.merit
    if (gift.money) usePlayerStore().earnMoney(gift.money)
    if (gift.items?.length) {
      const inv = useInventoryStore()
      for (const { itemId, quantity } of gift.items) {
        inv.addItem(itemId, quantity)
      }
    }
    addMumbleMessage(gift.giftLine, day)
  }

  function dismissBubble() {
    bubbleVisible.value = false
    bubblePayload.value = null
    if (bubbleDismissTimer) {
      clearTimeout(bubbleDismissTimer)
      bubbleDismissTimer = null
    }
  }

  function captureGameTime() {
    const game = useGameStore()
    return { gameYear: game.year, gameSeason: game.season, gameHour: game.hour }
  }

  function showMumbleBubble(content: string, gameDay: number) {
    if (panelOpen.value) return
    const settings = useSettingsStore()
    if (!settings.systemBubbleEnabled) return
    const { gameSeason, gameHour } = captureGameTime()
    bubblePayload.value = { content, gameDay, gameSeason, gameHour }
    bubbleVisible.value = true
    if (bubbleDismissTimer) clearTimeout(bubbleDismissTimer)
    if (settings.systemBubbleAutoClose) {
      bubbleDismissTimer = setTimeout(() => dismissBubble(), settings.systemBubbleAutoCloseMs)
    }
  }

  function pushMessage(
    role: 'system' | 'player',
    content: string,
    gameDay: number,
    kind: SystemMessageKind
  ) {
    const { gameYear, gameSeason, gameHour } = captureGameTime()
    messages.value.push({
      id: createId(),
      role,
      kind,
      content,
      timestamp: Date.now(),
      gameDay,
      gameYear,
      gameSeason,
      gameHour
    })
    if (!panelOpen.value) {
      unreadCount.value++
      if (kind === 'mumble') showMumbleBubble(content, gameDay)
    }
    if (messages.value.length > 200) {
      messages.value = messages.value.slice(-200)
    }
  }

  /** 系统提示（任务、连接、亲和等） */
  function addSystemMessage(content: string, gameDay = 0, kind: SystemMessageKind = 'notice') {
    pushMessage('system', content, gameDay, kind)
  }

  /** 碎碎念 / 日常问候 / 主动搭话 */
  function addMumbleMessage(content: string, gameDay = 0) {
    pushMessage('system', content, gameDay, 'mumble')
  }

  /** 对话回复（玩家主动发起） */
  function addChatMessage(content: string, gameDay = 0) {
    pushMessage('system', content, gameDay, 'chat')
  }

  function addPlayerMessage(content: string, gameDay = 0) {
    pushMessage('player', content, gameDay, 'chat')
  }

  function processPlayerInput(input: string, gameDay = 0): string | null {
    addPlayerMessage(input, gameDay)
    if (awakened.value) {
      const chatGain = onPlayerChatDaily(affinityDaily.value, gameDay)
      if (chatGain) applyAffinityGain(chatGain)
    }

    if (tryMaterialDevCheat(input)) {
      const reply = applyMaterialDevCheat()
      addSystemMessage(reply, gameDay)
      return reply
    }

    if (tryRecipeDevCheat(input)) {
      const reply = applyRecipeDevCheat()
      addSystemMessage(reply, gameDay)
      void useSaveStore().autoSave()
      return reply
    }

    const cheat = tryMeritDevCheat(input)
    if (cheat.matched) {
      merit.value += cheat.grant
      const reply = `斯巴拉西！测试口令生效：功勋 +${cheat.grant}。当前功勋：${merit.value}`
      addSystemMessage(reply, gameDay)
      return reply
    }

    if (isQuestRequestIntent(input)) {
      const reply = getQuestRequestRedirectReply(personaId.value)
      addChatMessage(reply, gameDay)
      return reply
    }

    if (mode.value === 'offline') {
      const match = matchKnowledge(input)
      if (match) {
        const reply = wrapWithPersona(match.content)
        addChatMessage(reply, gameDay)
        return reply
      }
      addChatMessage('灵识信号微弱……请尝试换个关键词，或点击「呼叫系统」链接系统以获得完整对话能力。', gameDay)
      return null
    }

    sendToBackend(input, gameDay)
    return null
  }

  function addCustomShopOffer(offer: MeritShopOffer) {
    const dup = customShopOffers.value.find(
      o => !o.purchased && o.wishPrompt === offer.wishPrompt && o.effect.type === offer.effect.type
    )
    if (dup) {
      dup.cost = offer.cost
      dup.description = offer.description
      dup.name = offer.name
      return
    }
    customShopOffers.value.push(offer)
  }

  const catalogShopOffers = computed(() => {
    const inv = useInventoryStore()
    return MERIT_CATALOG.map(catalogToOffer)
      .filter(o => o.effect.type !== 'expand_bag' || inv.capacity < inv.MAX_CAPACITY)
      .map(o => {
        const count = getPurchaseCount(o.id, purchasedCatalogCounts.value)
        const soldOut = isOfferSoldOut(o, purchasedCatalogCounts.value)
        let cost = o.cost
        if (o.id === 'bag_expand') {
          cost = getMeritBagExpandCost(inv.capacity)
        }
        return {
          ...o,
          cost,
          purchaseCount: count,
          purchased: soldOut
        }
      })
  })

  const allShopOffers = computed(() => [
    ...catalogShopOffers.value,
    ...customShopOffers.value
      .filter(o => !o.purchased)
      .map(o => ({
        ...o,
        purchaseCount: getPurchaseCount(o.id, purchasedCatalogCounts.value),
        purchased: isOfferSoldOut(o, purchasedCatalogCounts.value) || o.purchased === true
      }))
  ])

  function purchaseMeritShopItem(offerId: string): { ok: boolean; message: string } {
    const catalog = catalogShopOffers.value.find(o => o.id === offerId)
    const custom = customShopOffers.value.find(o => o.id === offerId)
    const offer = catalog ?? custom
    if (!offer) return { ok: false, message: '商品不存在。' }

    const check = canPurchaseOffer(offer, merit.value, purchasedCatalogCounts.value)
    if (!check.ok) return { ok: false, message: check.reason ?? '无法购买' }

    merit.value -= offer.cost
    const result = applyMeritEffect(offer.effect, offer)
    if (!result.ok) {
      merit.value += offer.cost
      return result
    }

    recordMeritPurchase(offer, purchasedCatalogCounts.value)

    if (result.buff && offer.effect.type !== 'max_stamina' && offer.effect.type !== 'max_hp') {
      activeBuffs.value.push(result.buff)
    }

    const msg = `兑换成功：${offer.name}（−${offer.cost} 功勋）。${result.message} 当前功勋：${merit.value}`
    addSystemMessage(msg)
    return { ok: true, message: msg }
  }

  function processMeritBuffExpiry(currentDay: number) {
    activeBuffs.value = expireTimedBuffs(activeBuffs.value, currentDay)
    customShopOffers.value = customShopOffers.value.filter(o => !o.purchased)
  }

  /** 废弃旧版全局会话键（所有路径调用，防止旧 bundle 残留） */
  function purgeLegacyChatSessionKey() {
    try {
      localStorage.removeItem('taoyuan_chat_session')
    } catch {
      /* ignore */
    }
  }

  /** 为指定槽位生成全新会话 ID（新游戏必须调用，不可复用旧会话） */
  function resetChatSessionForSlot(saveSlot: number) {
    purgeLegacyChatSessionKey()
    chatSessionId.value =
      saveSlot >= 0 ? `save-${saveSlot}-${createId()}` : createId()
  }

  /** 获取或创建当前存档的聊天会话 ID（与后端历史隔离） */
  function getChatSessionId(): string {
    purgeLegacyChatSessionKey()
    if (!chatSessionId.value) {
      resetChatSessionForSlot(useSaveStore().activeSlot)
    }
    return chatSessionId.value!
  }

  /** 读档时确保会话 ID 存在；旧存档无 ID 则按槽位生成新会话 */
  function ensureChatSessionForSlot(saveSlot: number) {
    purgeLegacyChatSessionKey()
    if (!chatSessionId.value) {
      resetChatSessionForSlot(saveSlot)
    }
  }

  /** 在线模式：SSE 流式发送消息到后端 Chat API */
  async function sendToBackend(input: string, gameDay: number) {
    isStreaming.value = true
    const msgId = createId()
    streamingMessageId.value = msgId

    // 插入占位消息
    const { gameSeason, gameHour } = captureGameTime()
    messages.value.push({
      id: msgId,
      role: 'system',
      kind: 'chat',
      content: '',
      timestamp: Date.now(),
      gameDay,
      gameSeason,
      gameHour
    })

    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionToken.value ? { Authorization: `Bearer ${sessionToken.value}` } : {})
        },
        body: JSON.stringify({
          message: input,
          personaId: personaId.value,
          sessionId: getChatSessionId(),
          visitorId: getAnalyticsVisitorId(),
          analyticsSessionId: getAnalyticsSessionId(),
          context: buildGameContext()
        })
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        throw new Error(err.error ?? `请求失败 (${res.status})`)
      }

      // 检查是否为 JSON 响应（知识匹配）
      const contentType = res.headers.get('Content-Type') ?? ''
      if (contentType.includes('application/json')) {
        const result = await res.json()
        if (result.type === 'wish') {
          const wish = result as MeritWishApiResponse
          updateStreamingMessage(msgId, wish.reply || '（无回复）')
          const offer = meritWishApiToOffer(wish, input, gameDay)
          if (offer) addCustomShopOffer(offer)
        } else if (result.type === 'knowledge' && result.results?.length > 0) {
          const parts = result.results.map((r: any) => `${r.entry.title}：${r.entry.content}`)
          updateStreamingMessage(msgId, parts.join('\n\n'))
        } else if (result.type === 'llm' && result.message) {
          updateStreamingMessage(msgId, result.message)
        } else if (result.error) {
          throw new Error(result.error)
        } else {
          updateStreamingMessage(msgId, result.message ?? '收到。')
        }
        isStreaming.value = false
        streamingMessageId.value = null
        return
      }

      // SSE 流式读取
      const reader = res.body?.getReader()
      if (!reader) throw new Error('不支持流式读取')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? '' // 保留未完成行

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6)
          if (data === '[DONE]') continue

          try {
            const event = JSON.parse(data)
            if (event.type === 'chunk') {
              const msg = messages.value.find(m => m.id === msgId)
              if (msg) {
                msg.content += event.content
              }
            } else if (event.type === 'revision') {
              const msg = messages.value.find(m => m.id === msgId)
              if (msg && event.content) {
                msg.content = event.content
              }
            } else if (event.type === 'error') {
              throw new Error(event.error)
            }
            // meta 类型忽略
          } catch (e: any) {
            if (e.message?.includes('event.error')) throw e
            // JSON 解析失败忽略
          }
        }
      }
    } catch (e: any) {
      console.warn('[SystemStore] SSE error:', e.message)
      updateStreamingMessage(msgId, `灵识连接中断……${e.message}`)
      mode.value = 'offline'
    }

    isStreaming.value = false
    streamingMessageId.value = null

    // 清理空消息
    const msg = messages.value.find(m => m.id === msgId)
    if (msg && !msg.content.trim()) {
      msg.content = '（未收到回复）'
    }
  }

  function updateStreamingMessage(msgId: string, content: string) {
    const msg = messages.value.find(m => m.id === msgId)
    if (msg) {
      msg.content = content
    }
  }

  /** 尝试连接后端 */
  async function tryConnect(): Promise<boolean> {
    if (isConnecting.value) return false
    isConnecting.value = true
    try {
      // 设备注册（getDeviceId 是 store 实例方法，非模块顶层导出）
      const mod = await import('@/stores/useSaveStore')
      const saveStore = mod.useSaveStore()
      const deviceId = saveStore.getDeviceId()
      const result = await apiFetch('/api/v1/device/register', {
        method: 'POST',
        body: JSON.stringify({ deviceId })
      })
      if (result?.token) {
        sessionToken.value = result.token
        backendUrl.value = BACKEND_URL
        mode.value = 'online'
        cloudBackupEnabled.value = true
        addSystemMessage('灵识已连接。在线对话已就绪。')
        return true
      }
      addSystemMessage('连接失败：后端未响应。请确认服务已启动。')
      return false
    } catch (e) {
      addSystemMessage(`连接异常：${e instanceof Error ? e.message : String(e)}`)
      return false
    } finally {
      isConnecting.value = false
    }
  }

  /** 断开后端连接 */
  function disconnect() {
    mode.value = 'offline'
    sessionToken.value = null
    addSystemMessage('已断开连接，切回灵识托管模式。')
  }

  function openPanel(tab?: 'chat' | 'quests' | 'shop') {
    panelTab.value = tab ?? 'chat'
    panelOpen.value = true
    unreadCount.value = 0
    dismissBubble()
    if (!awakened.value) return
    const day = useGameStore().day
    memoryState.value.lastPanelOpenDay = day
    const gain = onPanelOpenDaily(affinityDaily.value, day)
    if (gain) applyAffinityGain(gain)
    if (shouldShowMilestoneRecall(memoryState.value, day)) {
      const recall = pickMilestoneRecall(memoryState.value, personaId.value)
      if (recall) addMumbleMessage(recall, day)
    }
  }

  function closePanel() {
    panelOpen.value = false
  }

  function toggleFullscreen() {
    panelFullscreen.value = !panelFullscreen.value
  }

  // === 亲和度与陪伴 ===
  function applyAffinityGain(result: { delta: number; reason?: string }) {
    if (!result.delta) return
    adjustAffinity(result.delta)
    if (result.reason && Math.abs(result.delta) >= 2) {
      const sign = result.delta > 0 ? '+' : ''
      addSystemMessage(`（亲和 ${sign}${result.delta}：${result.reason}）`)
    }
  }

  function pushTimeline(entry: Omit<MemoryTimelineEntry, 'createdAt'>) {
    timeline.value = appendTimeline(timeline.value, entry)
  }

  function notifyAffinityBehavior(behavior: AffinityBehaviorKey) {
    if (!awakened.value) return
    const gain = evaluatePersonaBehavior(personaId.value, behavior, memoryState.value)
    if (gain) applyAffinityGain(gain)
  }

  function onFoodConsumed(itemOrRecipeId: string, isRecipe = false) {
    if (!awakened.value) return
    const id = isRecipe ? itemOrRecipeId : itemOrRecipeId
    if (TEA_DRINK_IDS.has(id) || (!isRecipe && id.includes('tea'))) {
      notifyAffinityBehavior('drink_tea')
    }
    if (isRecipe && SWEET_RECIPE_IDS.has(id)) notifyAffinityBehavior('eat_sweet')
    if (isRecipe && SPICY_RECIPE_IDS.has(id)) notifyAffinityBehavior('eat_spicy')
  }

  function onNpcGift(itemId: string, npcId: string, reaction: string) {
    if (!awakened.value) return
    const npc = getNpcById(npcId)
    if (!npc) return
    if (reaction === '讨厌' || npc.hatedItems.includes(itemId)) {
      if (itemId === 'stone' || itemId === 'weed' || npc.hatedItems.includes(itemId)) {
        notifyAffinityBehavior('gift_rude')
      }
    } else if (
      (npc.lovedItems.includes(itemId) || npc.likedItems.includes(itemId)) &&
      isTeaOrIncenseGift(itemId)
    ) {
      notifyAffinityBehavior('gift_tea_liked')
    }
  }

  function onCropHarvested(cropId: string, season: string) {
    if (!awakened.value) return
    const day = useGameStore().day
    const first = recordFirstCrop(memoryState.value, cropId, day)
    recordCropHarvest(memoryState.value)
    if (first) pushTimeline(first)
    if (season === 'spring') notifyAffinityBehavior('spring_harvest')
  }

  function onFishCaught(fishId: string, difficulty: string) {
    if (!awakened.value) return
    const day = useGameStore().day
    const first = recordFirstFish(memoryState.value, fishId, day)
    if (first) pushTimeline(first)
    if (difficulty === 'legendary' || RARE_DROP_IDS.has(fishId)) {
      notifyAffinityBehavior('rare_drop')
    }
    const game = useGameStore()
    if (game.weather === 'stormy') notifyAffinityBehavior('stormy_adventure')
  }

  function onMineFloorReached(floor: number, isBossFloor = false) {
    if (!awakened.value) return
    updateDeepestMine(memoryState.value, floor)
    trackMiningActivity(memoryState.value, useGameStore().day)
    if (floor > 40) notifyAffinityBehavior('mine_floor_40')
    const game = useGameStore()
    if (game.weather === 'stormy') notifyAffinityBehavior('stormy_adventure')
    fireSystemTrigger('mine_new_floor', { floor })
    if (isBossFloor) fireSystemTrigger('mine_boss_near', { floor })
  }

  function onSafePointUnlocked(floor: number) {
    fireSystemTrigger('safe_point', { floor })
  }

  function onSeasonChange(oldSeason: string, newSeason: string) {
    fireSystemTrigger('season_change', {
      oldSeason: oldSeason as TriggerPayload['oldSeason'],
      season: newSeason as TriggerPayload['season']
    })
  }

  function onFestivalDay(festivalName: string) {
    fireSystemTrigger('festival', { festivalName })
  }

  function onSkillLevelUp(skillType: string, newLevel: number) {
    fireSystemTrigger('skill_level_up', { skillType, skillLevel: newLevel })
  }

  function onStaminaThreshold() {
    const player = usePlayerStore()
    const { band, fire } = evaluateStaminaAlert(
      memoryState.value.staminaAlertBand,
      player.stamina,
      player.maxStamina
    )
    memoryState.value.staminaAlertBand = band
    if (fire) fireSystemTrigger(fire)
  }

  function onInventoryPressure(usageRatio: number) {
    if (usageRatio >= 0.8) fireSystemTrigger('inventory_full')
  }

  function onProcessingDone(itemId: string) {
    const def = getItemById(itemId)
    fireSystemTrigger('processing_done', { itemName: def?.name ?? itemId })
    onProcessingCollected(itemId)
  }

  function onMineDefeat(floor: number) {
    if (!awakened.value) return
    const day = useGameStore().day
    const entry = recordFirstDeathFloor(memoryState.value, floor, day)
    if (entry) pushTimeline(entry)
    const player = usePlayerStore()
    if (player.hp < player.getMaxHp() * 0.5) notifyAffinityBehavior('mine_injured')
  }

  function onMineLeaveEarly() {
    if (!awakened.value) return
    const player = usePlayerStore()
    if (player.stamina >= player.maxStamina * 0.3) notifyAffinityBehavior('early_retreat')
  }

  function onRareItemObtained(itemId: string) {
    if (RARE_DROP_IDS.has(itemId)) notifyAffinityBehavior('rare_drop')
  }

  function onAnimalCare() {
    notifyAffinityBehavior('pet_or_feed_animal')
  }

  function onMuseumGemDonate(itemId: string) {
    if (GEM_ITEM_IDS.has(itemId)) notifyAffinityBehavior('museum_gem_donate')
  }

  function onHomeUpgraded(level: number) {
    if (!awakened.value) return
    const entry = recordFirstExpansion(memoryState.value, level, useGameStore().day)
    if (entry) pushTimeline(entry)
  }

  function onNpcMaxFriendship(npcId: string) {
    if (!awakened.value) return
    const entry = recordFirstMaxFriendNpc(memoryState.value, npcId, useGameStore().day)
    if (entry) pushTimeline(entry)
  }

  function onPerfectFeast() {
    notifyAffinityBehavior('perfect_feast')
  }

  function onProcessingCollected(outputItemId: string) {
    if (outputItemId === 'osmanthus_wine') notifyAffinityBehavior('brew_osmanthus_wine')
  }

  function processGoodnight(endingDay: number, recoveryMode: 'normal' | 'late' | 'passout') {
    if (!awakened.value || !personaId.value) return
    addSystemMessage(getGoodnightMessage(personaId.value, recoveryMode), endingDay)
    if (useGameStore().hour >= 24) notifyAffinityBehavior('late_night')
  }

  function processCompanionNewDay(newDay: number) {
    if (!awakened.value || !personaId.value) return
    const endingDay = newDay - 1
    if (endingDay >= 1) {
      for (const penalty of checkPanelAbsencePenalties(memoryState.value, endingDay, personaId.value)) {
        applyAffinityGain(penalty)
      }
    }
    affinityDaily.value = ensureAffinityDaily(affinityDaily.value, newDay)

    if (shouldWritePeriodicSummary(memoryState.value, newDay)) {
      const player = usePlayerStore()
      const npc = useNpcStore()
      const achievement = useAchievementStore()
      let maxNpcId: string | null = null
      let maxFriend = 0
      for (const s of npc.npcStates) {
        if (s.friendship > maxFriend) {
          maxFriend = s.friendship
          maxNpcId = s.npcId
        }
      }
      const game = useGameStore()
      const summary = buildPeriodicSummary({
        day: newDay,
        season: game.season,
        year: game.year,
        totalCropsHarvested: memoryState.value.totalCropsHarvested,
        money: player.money,
        deepestMineFloor: Math.max(memoryState.value.deepestMineFloor, achievement.stats.highestMineFloor),
        maxNpcFriendship: maxFriend,
        maxNpcId,
        affinity: affinity.value
      })
      memoryState.value.lastPeriodicSummaryDay = newDay
      pushTimeline({ day: newDay, summary, trigger: 'periodic' })
      addMumbleMessage(`【记忆摘要】${summary}`, newDay)
    }

    const player = usePlayerStore()
    const care = getProactiveCareMessage(personaId.value, {
      stamina: player.stamina,
      maxStamina: player.maxStamina,
      hp: player.hp,
      maxHp: player.getMaxHp(),
      animalNeglectStreak: memoryState.value.animalNeglectStreak,
      consecutiveMiningDays: memoryState.value.consecutiveMiningDays,
      season: useGameStore().season
    })
    if (care) addSystemMessage(care, newDay)

    checkBirthdayNpcs()
    const weather = useGameStore().weather
    if (weather === 'stormy' || weather === 'green_rain' || weather === 'windy') {
      fireSystemTrigger('weather_special', {
        weather,
        weatherName: useGameStore().weatherName
      })
    }
  }

  function onAnimalNeglectDay(unfedCount: number) {
    if (!awakened.value || unfedCount <= 0) return
    memoryState.value.animalNeglectStreak++
    if (memoryState.value.animalNeglectStreak >= 3) {
      notifyAffinityBehavior('animal_neglect')
    }
  }

  function onAnimalCareDay() {
    memoryState.value.animalNeglectStreak = 0
    delete memoryState.value.onceFlags['behavior_animal_neglect']
  }

  function onSaveLoaded() {
    if (!awakened.value) return
    const now = Date.now()
    const offlineDays = detectOfflineDays(memoryState.value.lastOnlineRealMs, now)
    memoryState.value.lastOnlineRealMs = now
    const day = useGameStore().day
    if (offlineDays >= 3 && memoryState.value.absenceWelcomeDay !== day && personaId.value) {
      memoryState.value.absenceWelcomeDay = day
      addMumbleMessage(getAbsenceWelcomeMessage(personaId.value, offlineDays), day)
      pushTimeline({
        day,
        summary: `离线 ${offlineDays} 天后回归`,
        trigger: 'milestone'
      })
    }
  }

  function touchOnlineTime() {
    memoryState.value.lastOnlineRealMs = Date.now()
  }

  /** 在线模式：事件搭话走 LLM，失败回退模板 */
  async function sendTriggerToBackend(type: SystemTriggerType, payload: TriggerPayload, gameDay: number) {
    const persona = personaId.value!
    const templateHint = buildTriggerMessage(persona, type, payload)
    const eventSummary = buildTriggerEventSummary(type, payload)
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/chat/trigger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionToken.value ? { Authorization: `Bearer ${sessionToken.value}` } : {})
        },
        body: JSON.stringify({
          personaId: persona,
          triggerType: type,
          eventSummary,
          templateHint,
          affinity: affinity.value,
          context: buildGameContext()
        })
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as { message?: string }
      if (data.message?.trim()) {
        addMumbleMessage(data.message.trim(), gameDay)
        return
      }
    } catch (e) {
      console.warn('[SystemStore] trigger LLM failed:', e)
    }
    addMumbleMessage(templateHint, gameDay)
  }

  /** §5.2 事件驱动主动搭话（含 §5.4 冷却与每日上限） */
  function fireSystemTrigger(type: SystemTriggerType, payload: TriggerPayload = {}) {
    if (!awakened.value || !personaId.value) return
    const game = useGameStore()
    if (!canFireTrigger(memoryState.value, type, game.day, game.hour, mode.value)) return
    markTriggerFired(memoryState.value, type, game.day, game.hour)
    if (mode.value === 'online') {
      void sendTriggerToBackend(type, payload, game.day)
      return
    }
    addMumbleMessage(buildTriggerMessage(personaId.value, type, payload), game.day)
  }

  function checkNpcHeartUp(npcId: string, before: number, after: number) {
    const oldHearts = Math.floor(before / 250)
    const newHearts = Math.floor(after / 250)
    if (newHearts > oldHearts) {
      fireSystemTrigger('npc_heart_up', {
        npcId,
        npcName: getNpcById(npcId)?.name,
        hearts: newHearts
      })
    }
  }

  function checkBirthdayNpcs() {
    const npc = useNpcStore()
    for (const state of npc.npcStates) {
      if (npc.isBirthday(state.npcId)) {
        fireSystemTrigger('npc_birthday', {
          npcId: state.npcId,
          npcName: getNpcById(state.npcId)?.name
        })
      }
    }
  }

  function adjustAffinity(delta: number) {
    const old = affinity.value
    affinity.value = Math.max(0, Math.min(100, affinity.value + delta))

    for (const milestone of Object.values(AFFINITY_MILESTONES)) {
      if (old < milestone && affinity.value >= milestone && !affinityMilestonesReached.value.has(milestone)) {
        affinityMilestonesReached.value.add(milestone)
        handleMilestone(milestone)
      }
    }
  }

  function handleMilestone(milestone: number) {
    if (!personaId.value) return
    const lines: Record<number, Record<PersonaId, string>> = {
      30: {
        qingluan: '小友，今日气色不错。',
        chaofeng: '……行吧，你也没那么菜。',
        taosu: '主人今天好棒！桃酥越来越喜欢主人了~(◕ᴗ◕✿)',
        moyan: '……不错。'
      },
      50: {
        qingluan: '小友近来勤勉，吾心甚慰。',
        chaofeng: '咳。你最近表现还行——别得意，就还行。',
        taosu: '主人主人！桃酥偷偷告诉你，桃酥最喜欢主人了！(≧▽≦)',
        moyan: '评估：宿主效率排名前 30%。……尚可。'
      },
      70: {
        qingluan: '千年前，吾曾有一宿主，是位茶农……改日再叙。',
        chaofeng: '……你想知道我在天庭到底干了什么吗？算了，改天再说。',
        taosu: '桃酥其实记性可好了。主人说过的每一句话桃酥都记得……但是这是秘密！',
        moyan: '我有一位宿主，活到 92 岁。他最后一条记录是"今日无事"。……那天不是无事。'
      },
      100: {
        qingluan: '此物伴吾千年，今赠予小友。愿它护你平安。',
        chaofeng: '拿去，就这一片——不是心疼你，是怕你死在矿里太丢我的人。',
        taosu: '这是桃酥存了好久好久的……给主人吃，吃了就能多陪桃酥一会儿。',
        moyan: '这本笔记现在是空白的。第十七页之后，是留给你的。建议：好好活着。我会记录。'
      }
    }
    const line = lines[milestone]?.[personaId.value]
    if (line) {
      addMumbleMessage(line)
      pushTimeline({
        day: useGameStore().day,
        summary: `亲和里程碑 ${milestone}：${line.slice(0, 24)}…`,
        trigger: 'affinity'
      })
    }
  }

  // === 序列化 ===
  function serialize() {
    return {
      personaId: personaId.value,
      awakened: awakened.value,
      firstContactDay: firstContactDay.value,
      messages: messages.value.slice(-200),
      affinity: affinity.value,
      affinityMilestonesReached: Array.from(affinityMilestonesReached.value),
      merit: merit.value,
      quests: quests.value,
      lastQuestDay: lastQuestDay.value,
      activeBuffs: activeBuffs.value,
      customShopOffers: customShopOffers.value,
      purchasedCatalogCounts: purchasedCatalogCounts.value,
      timeline: timeline.value,
      memoryState: memoryState.value,
      affinityDaily: affinityDaily.value,
      cloudBackupEnabled: cloudBackupEnabled.value,
      sessionToken: sessionToken.value,
      chatSessionId: chatSessionId.value,
      mode: mode.value
    }
  }

  function deserialize(data: any, saveSlot = -1) {
    if (!data) return
    personaId.value = data.personaId ?? null
    awakened.value = data.awakened ?? false
    firstContactDay.value = data.firstContactDay ?? -1
    messages.value = (data.messages ?? []).map((m: SystemMessage) => ({
      ...m,
      kind: m.kind ?? (m.role === 'player' ? 'chat' : 'notice')
    }))
    affinity.value = data.affinity ?? 0
    affinityMilestonesReached.value = new Set(data.affinityMilestonesReached ?? [])
    merit.value = data.merit ?? 0
    quests.value = (data.quests ?? []).map((q: SystemQuest) => ({
      ...q,
      expired: q.expired ?? false,
      progress: q.progress ?? 0,
      swappedType: q.swappedType ?? false,
      evaluationPending: q.evaluationPending ?? false
    }))
    lastQuestDay.value = data.lastQuestDay ?? -1
    activeBuffs.value = data.activeBuffs ?? []
    customShopOffers.value = data.customShopOffers ?? []
    purchasedCatalogCounts.value = data.purchasedCatalogCounts ?? migratePurchasedCatalogIds(data.purchasedCatalogIds ?? [])
    purchasedCatalogIds.value = data.purchasedCatalogIds ?? []
    cloudBackupEnabled.value = data.cloudBackupEnabled ?? false
    timeline.value = data.timeline ?? []
    memoryState.value = { ...createDefaultMemoryState(), ...(data.memoryState ?? {}) }
    affinityDaily.value = { ...createDefaultAffinityDaily(), ...(data.affinityDaily ?? {}) }
    sessionToken.value = data.sessionToken ?? null
    chatSessionId.value = data.chatSessionId ?? null
    // 恢复在线模式（有 token 且之前是在线模式）
    if (data.sessionToken && data.mode === 'online') {
      mode.value = 'online'
    } else if (!data.sessionToken) {
      mode.value = 'offline'
    }
    ensureChatSessionForSlot(saveSlot)
  }

  // === 任务系统 ===
  const lastQuestDay = ref(-1)
  const questDispatchInFlight = ref(false)

  function buildQuestProgressContext(): QuestProgressContext {
    const achievement = useAchievementStore()
    const skill = useSkillStore()
    const home = useHomeStore()
    const tavern = useTavernStore()
    const warehouse = useWarehouseStore()
    const animal = useAnimalStore()
    const fishPond = useFishPondStore()
    const breeding = useBreedingStore()
    return {
      tavernLevel: tavern.tavernLevel,
      farmhouseLevel: home.farmhouseLevel,
      highestMineFloor: achievement.stats.highestMineFloor,
      greenhouseUnlocked: home.greenhouseUnlocked,
      caveUnlocked: home.caveUnlocked,
      warehouseUnlocked: warehouse.unlocked,
      animalCount: animal.animals.length,
      fishPondBuilt: fishPond.pond.built,
      breedingStationCount: breeding.stationCount,
      getSkillLevel: (skillType: string) => {
        const types = ['farming', 'foraging', 'fishing', 'mining', 'combat', 'cooking'] as const
        if ((types as readonly string[]).includes(skillType)) {
          return skill.getSkill(skillType as (typeof types)[number]).level
        }
        return 0
      }
    }
  }

  function buildQuestContext(): QuestValidationContext {
    const achievement = useAchievementStore()
    const npc = useNpcStore()
    const skill = useSkillStore()
    const tavern = useTavernStore()
    return {
      getItemCount: (itemId: string) => getCombinedItemCount(itemId),
      highestMineFloor: achievement.stats.highestMineFloor,
      getNpcFriendship: (npcId: string) => npc.npcStates.find(n => n.npcId === npcId)?.friendship ?? 0,
      maxNpcFriendship: () => Math.max(0, ...npc.npcStates.map(n => n.friendship)),
      getSkillLevel: (skillType: string) => {
        const types = ['farming', 'foraging', 'fishing', 'mining', 'combat', 'cooking'] as const
        if ((types as readonly string[]).includes(skillType)) {
          return skill.getSkill(skillType as (typeof types)[number]).level
        }
        return 0
      },
      tavernReputation: tavern.reputation
    }
  }

  async function requestQuestEvaluation(questId: string, outcome: QuestEvaluationOutcome) {
    const q = quests.value.find(item => item.id === questId)
    if (!q) return
    q.evaluationPending = true
    const gameStore = useGameStore()
    const persona = personaId.value ?? 'qingluan'
    const ctx = {
      currentDay: gameStore.day,
      merit: merit.value,
      affinity: affinity.value
    }
    let evaluation = ''
    if (mode.value === 'online' && sessionToken.value) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/v1/quest/evaluate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionToken.value}`
          },
          body: JSON.stringify({
            personaId: persona,
            outcome,
            quest: { ...q },
            context: buildGameContext()
          })
        })
        if (res.ok) {
          const data = (await res.json()) as { evaluation?: string }
          evaluation = (data.evaluation ?? '').trim()
        }
      } catch {
        /* 离线兜底 */
      }
    }
    if (!evaluation) {
      evaluation = buildOfflineQuestEvaluation(q, outcome, persona, ctx)
    }
    q.evaluation = evaluation
    q.evaluationPending = false
  }

  function showQuestOutcomeAlert(
    q: SystemQuest,
    type: QuestOutcomeAlert['type'],
    meritBefore: number,
    meritAfter: number
  ) {
    questOutcomeAlert.value = {
      type,
      questId: q.id,
      title: q.title ?? q.type,
      description: q.description ?? formatQuestDescription(q),
      reward: q.reward,
      fine: q.fine ?? (type === 'failed' ? Math.ceil(q.reward * 0.5) : 0),
      meritBefore,
      meritAfter,
      endedDay: q.endedDay ?? useGameStore().day
    }
  }

  function completeQuest(questId: string) {
    const q = quests.value.find(item => item.id === questId)
    if (!q || q.completed || q.expired) return
    const meritBefore = merit.value
    q.completed = true
    q.endedDay = useGameStore().day
    merit.value += q.reward
    addSystemMessage(
      `任务「${q.title ?? q.type}」完成！获得 ${q.reward} 功勋。当前功勋：${merit.value}`
    )
    showQuestOutcomeAlert(q, 'completed', meritBefore, merit.value)
    void requestQuestEvaluation(questId, 'completed')
  }

  function failQuest(questId: string, fine: number) {
    const q = quests.value.find(item => item.id === questId)
    if (!q || q.completed || q.expired) return
    const meritBefore = merit.value
    q.expired = true
    q.endedDay = useGameStore().day
    q.fine = fine
    merit.value -= fine
    addSystemMessage(getExpireMessage(q, fine))
    showQuestOutcomeAlert(q, 'failed', meritBefore, merit.value)
    void requestQuestEvaluation(questId, 'failed')
  }

  function dismissQuestOutcomeAlert() {
    questOutcomeAlert.value = null
  }

  function viewQuestOutcomeInPanel() {
    questOutcomeAlert.value = null
    openPanel('quests')
  }

  /** 保留调用点；任务改为手动提交，不再自动结算 */
  function validateQuests(): void {
    /* no-op */
  }

  function canSubmitQuest(questId: string): boolean {
    const q = quests.value.find(item => item.id === questId)
    if (!q) return false
    return canSubmitSystemQuest(q, buildQuestContext())
  }

  function submitQuest(questId: string): { ok: boolean; reason?: string } {
    const q = quests.value.find(item => item.id === questId)
    if (!q || !q.accepted || q.completed || q.expired) {
      return { ok: false, reason: 'not_found' }
    }
    if (!canSubmitSystemQuest(q, buildQuestContext())) {
      return { ok: false, reason: 'not_ready' }
    }
    const consumed = consumeQuestSubmissionMaterials(q)
    if (!consumed.ok) {
      return { ok: false, reason: consumed.reason ?? 'materials' }
    }
    completeQuest(questId)
    return { ok: true }
  }

  function processQuestExpiry(currentDay: number): void {
    const { expiredIds } = processExpiredQuests(quests.value, currentDay)
    for (const id of expiredIds) {
      const q = quests.value.find(item => item.id === id)
      if (!q) continue
      const fine = q.fine ?? Math.ceil(q.reward * 0.5)
      failQuest(id, fine)
    }
  }

  function pushNewQuestAlert(quest: typeof quests.value[0]) {
    newQuestAlert.value = {
      questId: quest.id,
      title: quest.title ?? quest.type,
      description: quest.description ?? formatQuestDescription(quest),
      reward: quest.reward,
      deadline: quest.deadline
    }
  }

  function assignQuestFromTemplate(currentDay: number) {
    const progress = buildQuestProgressContext()
    const template = pickQuestTemplate(currentDay, quests.value, progress)
    if (!template) return false

    lastQuestDay.value = currentDay
    const quest = createQuestFromTemplate(template, currentDay, affinity.value, createId)
    quests.value.push(quest)
    const persona = personaId.value ?? 'qingluan'
    addSystemMessage(getQuestAnnouncement(quest, persona), currentDay)
    pushNewQuestAlert(quest)
    return true
  }

  async function assignQuestFromAi(currentDay: number): Promise<boolean> {
    const persona = personaId.value ?? 'qingluan'
    const result = await requestAiQuestDispatch({
      personaId: persona,
      affinity: affinity.value,
      merit: merit.value,
      currentDay,
      sessionToken: sessionToken.value
    })
    if (!result) return false

    lastQuestDay.value = currentDay
    const quest = { ...result.quest, id: createId() }
    quests.value.push(quest)
    addSystemMessage(result.announcement, currentDay)
    pushNewQuestAlert(quest)
    return true
  }

  async function requestSystemQuest(): Promise<{ ok: boolean; message: string }> {
    if (!awakened.value) {
      return { ok: false, message: '系统尚未觉醒，请先完成首次过夜。' }
    }
    if (questDispatchInFlight.value) {
      return { ok: false, message: '正在生成任务，请稍候…' }
    }
    const active = countActiveQuests(quests.value)
    if (active >= MAX_ACTIVE_QUESTS) {
      return {
        ok: false,
        message: `最多同时持有 ${MAX_ACTIVE_QUESTS} 个任务（当前 ${active}/${MAX_ACTIVE_QUESTS}），请先完成或处理现有任务。`
      }
    }

    const currentDay = useGameStore().day
    questDispatchInFlight.value = true
    try {
      let ok = false
      if (mode.value === 'online' && sessionToken.value) {
        ok = await assignQuestFromAi(currentDay)
        if (!ok) ok = assignQuestFromTemplate(currentDay)
      } else {
        ok = assignQuestFromTemplate(currentDay)
      }
      if (!ok) {
        return { ok: false, message: '暂无适合当前进度的任务，稍后再试。' }
      }
      return { ok: true, message: '新任务已生成，可先议价再接受。' }
    } finally {
      questDispatchInFlight.value = false
    }
  }

  function dismissNewQuestAlert() {
    newQuestAlert.value = null
  }

  function viewNewQuestAlert() {
    const id = newQuestAlert.value?.questId
    newQuestAlert.value = null
    openPanel('quests')
    if (id) {
      addSystemMessage('新任务已列入「任务」页，可先议价再接受。')
    }
  }

  function acceptQuest(questId: string) {
    const q = quests.value.find(item => item.id === questId)
    if (!q || q.accepted || q.completed || q.expired) return
    // 功勋可为负，接受任务不受功勋余额限制
    q.accepted = true
    q.acceptedDay = useGameStore().day
    addSystemMessage(`已接受任务「${q.title ?? q.type}」。期限：第 ${q.deadline} 日。`)
    const adviceGain = onAdviceAdoptedDaily(affinityDaily.value, useGameStore().day)
    if (adviceGain) applyAffinityGain(adviceGain)
    validateQuests()
  }

  function negotiateQuest(questId: string, kind: QuestNegotiationType) {
    const idx = quests.value.findIndex(item => item.id === questId)
    if (idx < 0) return
    const q = quests.value[idx]!
    const persona = personaId.value ?? 'qingluan'
    const result = applyNegotiation(q, kind, useGameStore().day, affinity.value)
    if (!result.ok) {
      addSystemMessage(result.message)
      return
    }
    if (result.newQuest) {
      quests.value[idx] = result.newQuest
    }
    addSystemMessage(getNegotiationPersonaLine(persona, quests.value[idx]!.negotiationRounds))
    if (result.message) addSystemMessage(result.message)
  }

  function reconcileQuestsOnLoad(currentDay: number) {
    const result = reconcileQuestsEngine(quests.value, currentDay, buildQuestProgressContext())
    for (const id of result.expired.expiredIds) {
      const q = quests.value.find(item => item.id === id)
      if (!q || q.expired) continue
      const fine = Math.ceil(q.reward * 0.5)
      q.expired = true
      q.endedDay = currentDay
      q.fine = fine
      merit.value -= fine
      const persona = personaId.value ?? 'qingluan'
      q.evaluation = buildOfflineQuestEvaluation(q, 'failed', persona, {
        currentDay,
        merit: merit.value,
        affinity: affinity.value
      })
      q.evaluationPending = false
    }
    validateQuests()
  }

  function onTavernRevenue(revenue: number) {
    recordTavernDailyRevenue(quests.value, revenue)
    validateQuests()
  }

  function onFeastCompleted() {
    recordFeastCompleted(quests.value)
    validateQuests()
  }

  return {
    personaId, awakened, firstContactDay, pendingAwakening,
    mode, backendUrl, sessionToken, cloudBackupEnabled, isConnecting,
    messages, unreadCount,
    affinity, affinityMilestonesReached,
    merit, quests, activeBuffs, customShopOffers, purchasedCatalogCounts,
    catalogShopOffers, allShopOffers, purchaseMeritShopItem, processMeritBuffExpiry,
    timeline, memoryState, affinityDaily,
    panelOpen, panelFullscreen, panelTab, inputText,
    newQuestAlert, dismissNewQuestAlert, viewNewQuestAlert,
    questOutcomeAlert, dismissQuestOutcomeAlert, viewQuestOutcomeInPanel,
    bubbleVisible, bubblePayload,
    displayName, connectionLabel,
    isStreaming, streamingMessageId,
    awaken, addSystemMessage, addMumbleMessage, addChatMessage, addPlayerMessage, processPlayerInput,
    dismissBubble,
    tryConnect, disconnect, sendToBackend,
    openPanel, closePanel, toggleFullscreen,
    adjustAffinity,
    requestSystemQuest, questDispatchInFlight, MAX_ACTIVE_QUESTS,
    acceptQuest, negotiateQuest, validateQuests,
    canSubmitQuest, submitQuest,
    processQuestExpiry, reconcileQuestsOnLoad, completeQuest,
    onTavernRevenue, onFeastCompleted,
    notifyAffinityBehavior, onFoodConsumed, onNpcGift, onCropHarvested,
    onFishCaught, onMineFloorReached, onMineDefeat, onMineLeaveEarly,
    onRareItemObtained, onAnimalCare, onMuseumGemDonate, onHomeUpgraded,
    onNpcMaxFriendship, onPerfectFeast, onProcessingCollected,
    processGoodnight, processCompanionNewDay, onAnimalNeglectDay, onAnimalCareDay,
    onSaveLoaded, touchOnlineTime,
    fireSystemTrigger, checkNpcHeartUp, onSafePointUnlocked, onSeasonChange, onFestivalDay,
    onSkillLevelUp, onStaminaThreshold, onInventoryPressure, onProcessingDone,
    serialize, deserialize, ensureChatSessionForSlot, resetChatSessionForSlot
  }
})

// === 辅助函数 ===

function getAwakeningGreeting(persona: PersonaId): string {
  const greetings: Record<PersonaId, string> = {
    qingluan: '吾名青鸾。上古仙禽一缕灵识，寄于君之铜钥。今后，吾与君同行。',
    chaofeng: '啧，终于醒了？我是嘲风，龙生九子知道吧？以后我罩你——别给我丢人就行。',
    taosu: '主人主人！桃酥等了你好久好久！我是桃酥，以后就是主人的伙伴啦 (◕ᴗ◕✿)',
    moyan: '墨言。记录者。你的数据从现在开始纳入记录。建议尽快开始行动。'
  }
  return greetings[persona]
}

export function getMorningGreeting(persona: PersonaId, season: string): string {
  const templates: Record<PersonaId, string[]> = {
    qingluan: [
      '今日天朗气清，宜出行。',
      '辰时已至。宿主，新一日开始了。',
      '春分将至，田垄间可播种矣。宿主早安。'
    ],
    chaofeng: [
      '啧，新的一天。别磨蹭，下矿还是种田？',
      '早啊菜鸟。今天打算干什么？',
      '醒了？行，今天别又死在矿里。'
    ],
    taosu: [
      '主人早安！今天阳光金灿灿的~(◕ᴗ◕✿)',
      '早呀主人！今天也要开开心心的哦~',
      '主人起来啦！桃酥好开心！今天做什么好呢~'
    ],
    moyan: [
      '今日晴。建议：户外作业。',
      '晨间数据已更新。建议检查作物状态。',
      '新一天开始。效率评估重置。'
    ]
  }
  const pool = templates[persona] ?? templates.qingluan
  return pool[Math.floor(Math.random() * pool.length)]
}

function wrapWithPersona(content: string): string {
  return content
}
