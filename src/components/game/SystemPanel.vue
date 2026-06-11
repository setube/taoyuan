<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import { saveAs } from 'file-saver'
import { X, ArrowUp, Maximize2, Minimize2, ChevronDown, ChevronRight, Download, ChevronsDown } from 'lucide-vue-next'
import { useSystemStore } from '@/stores/useSystemStore'
import { useGameStore } from '@/stores/useGameStore'
import { usePlayerStore } from '@/stores/usePlayerStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useInventoryStore } from '@/stores/useInventoryStore'
import { useAchievementStore } from '@/stores/useAchievementStore'
import { useNpcStore } from '@/stores/useNpcStore'
import { useSkillStore } from '@/stores/useSkillStore'
import { useTavernStore } from '@/stores/useTavernStore'
import {
  countActiveQuests,
  formatQuestDescription,
  getQuestProgressHint,
  MAX_ACTIVE_QUESTS
} from '@/composables/systemQuestEngine'
import {
  QUEST_HISTORY_FILTER_OPTIONS,
  filterQuestsByHistory,
  formatQuestDayRange
} from '@/composables/questHistoryHelpers'
import type { QuestHistoryFilter } from '@/types/system'
import { showFloat } from '@/composables/useGameLog'
import { MERIT_WISH_MIN_AFFINITY } from '@/data/meritWishAllowed'
import {
  groupSystemMessages,
  formatGameDayLabel,
  formatMessageTime,
  hasMessageTime,
  shouldCollapseDayGroup,
  getCurrentGameSortKey,
  countGroupMessages,
  getMixedMessagesForDay,
  getMessageRenderType,
  filterDayGroups,
  getInitiallyLoadedGroupKeys,
  isStaleDayGroup,
  exportSystemChatToText,
  SYSTEM_CHAT_KIND_FILTER_OPTIONS
} from '@/composables/useSystemChatGroups'
import type { QuestNegotiationType, SystemMessage } from '@/types/system'

const store = useSystemStore()
const meritWishMinAffinity = MERIT_WISH_MIN_AFFINITY
const gameStore = useGameStore()
const playerStore = usePlayerStore()
const settingsStore = useSettingsStore()

const questStatusLabel = (q: typeof store.quests[0]) => {
  if (q.completed) return '已完成'
  if (q.expired) return '已过期'
  if (!q.accepted) return '待接受'
  return `期限 第${q.deadline}日`
}

const negotiate = (questId: string, kind: QuestNegotiationType) => {
  store.negotiateQuest(questId, kind)
}

const questProgressHint = (q: typeof store.quests[0]) => {
  if (!q.accepted) return ''
  const achievement = useAchievementStore()
  const npc = useNpcStore()
  const skill = useSkillStore()
  const tavern = useTavernStore()
  const inv = useInventoryStore()
  return getQuestProgressHint(q, {
    getItemCount: (itemId: string) => inv.getItemCount(itemId),
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
  })
}

const submitQuest = (questId: string) => {
  const res = store.submitQuest(questId)
  if (res.ok) {
    showFloat('任务已提交', 'success')
  } else if (res.reason === 'materials') {
    showFloat('材料不足，无法提交', 'danger')
  } else if (res.reason === 'not_ready') {
    showFloat('尚未达成任务条件', 'accent')
  }
}

const inputEl = ref<HTMLInputElement | null>()
const chatContainer = ref<HTMLDivElement | null>(null)
const activeTab = ref<'chat' | 'quests' | 'shop'>('chat')
const questHistoryFilter = ref<QuestHistoryFilter>('all')

const questLists = computed(() => filterQuestsByHistory(store.quests, questHistoryFilter.value))
const activeQuestCount = computed(() => countActiveQuests(store.quests))
const canRequestQuest = computed(
  () => store.awakened && activeQuestCount.value < MAX_ACTIVE_QUESTS && !store.questDispatchInFlight
)

const requestQuest = async () => {
  const res = await store.requestSystemQuest()
  if (res.ok) showFloat(res.message, 'success')
  else showFloat(res.message, 'accent')
}

watch(() => store.panelTab, tab => {
  if (activeTab.value !== tab) activeTab.value = tab
})

watch(activeTab, tab => {
  if (store.panelTab !== tab) store.panelTab = tab
  if (tab === 'quests') store.validateQuests()
})

const isMobile = computed(() => window.innerWidth < 768)

const dayGroups = computed(() => groupSystemMessages(store.messages))
const filteredDayGroups = computed(() =>
  filterDayGroups(dayGroups.value, settingsStore.systemChatKindFilter)
)
const collapsedDays = ref<Set<string>>(new Set())
/** 已加载消息内容的分组（三天以前的记录在点击展开时才加入） */
const loadedDayGroups = ref<Set<string>>(new Set())

function currentSortKey() {
  return getCurrentGameSortKey(gameStore.year, gameStore.season, gameStore.day)
}

function syncCollapsedDays() {
  const sortKey = currentSortKey()
  const next = new Set<string>()
  for (const g of filteredDayGroups.value) {
    if (shouldCollapseDayGroup(g.sortKey, sortKey, g.day)) next.add(g.groupKey)
  }
  collapsedDays.value = next
}

function syncLoadedDayGroups() {
  loadedDayGroups.value = getInitiallyLoadedGroupKeys(filteredDayGroups.value, currentSortKey())
}

function isDayGroupLoaded(group: (typeof filteredDayGroups.value)[number]) {
  if (!isStaleDayGroup(group.sortKey, currentSortKey(), group.day)) return true
  return loadedDayGroups.value.has(group.groupKey)
}

function loadDayGroup(groupKey: string) {
  const next = new Set(loadedDayGroups.value)
  next.add(groupKey)
  loadedDayGroups.value = next
}

function expandLatestDayGroup() {
  const groups = filteredDayGroups.value
  if (groups.length === 0) return
  const latest = groups[groups.length - 1]!
  loadDayGroup(latest.groupKey)
  const next = new Set(collapsedDays.value)
  next.delete(latest.groupKey)
  collapsedDays.value = next
}

function expandAllDayGroups() {
  loadedDayGroups.value = new Set(filteredDayGroups.value.map(g => g.groupKey))
  collapsedDays.value = new Set()
}

function exportAllChat() {
  if (store.messages.length === 0) {
    showFloat('暂无聊天记录', 'danger')
    return
  }
  const text = exportSystemChatToText(store.messages, store.displayName)
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const stamp = new Date().toISOString().slice(0, 16).replace('T', '-').replace(':', '')
  saveAs(blob, `桃源乡-系统聊天-${stamp}.txt`)
  showFloat('聊天记录已导出', 'success')
}

function isDayCollapsed(groupKey: string) {
  return collapsedDays.value.has(groupKey)
}

function toggleDayCollapse(groupKey: string, group: (typeof filteredDayGroups.value)[number]) {
  const next = new Set(collapsedDays.value)
  if (next.has(groupKey)) {
    next.delete(groupKey)
    if (!isDayGroupLoaded(group)) loadDayGroup(groupKey)
  } else {
    next.add(groupKey)
  }
  collapsedDays.value = next
}

function collapsedHint(group: (typeof filteredDayGroups.value)[number]) {
  const count = countGroupMessages(group)
  const action = isDayGroupLoaded(group) ? '点击展开' : '点击加载'
  return `${count} 条记录 · ${action}`
}

function isStreamingMsg(msg: SystemMessage) {
  return store.isStreaming && msg.id === store.streamingMessageId
}

/** 将简单 Markdown 转为安全 HTML，支持：**粗体**、*斜体*、有序列表、无序列表、换行 */
function renderMarkdown(text: string): string {
  // 先转义 HTML，防止注入
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // **粗体**
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="text-accent font-bold">$1</strong>')

  // *斜体*（仅在非 ** 上下文中）
  html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em class="italic">$1</em>')

  // 按行处理列表
  const lines = html.split('\n')
  const result: string[] = []
  let inOl = false
  let inUl = false

  function closeOl() {
    if (inOl) { result.push('</ol>'); inOl = false }
  }
  function closeUl() {
    if (inUl) { result.push('</ul>'); inUl = false }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const olMatch = line.match(/^(\d+)\.\s+(.+)/)
    const ulMatch = line.match(/^[-*]\s+(.+)/)

    if (olMatch) {
      closeUl()
      if (!inOl) {
        result.push('<ol class="game-list game-ol my-1">')
        inOl = true
      }
      result.push(`<li>${olMatch[2]}</li>`)
    } else if (ulMatch) {
      closeOl()
      if (!inUl) {
        result.push('<ul class="game-list game-ul my-1">')
        inUl = true
      }
      result.push(`<li>${ulMatch[1]}</li>`)
    } else {
      closeOl()
      closeUl()
      // 空行 → 段落分隔
      result.push(line || '<br>')
    }
  }
  closeOl()
  closeUl()

  return result.join('\n')
}

function sendMessage() {
  const text = store.inputText.trim()
  if (!text) return
  store.inputText = ''
  store.processPlayerInput(text, gameStore.day)
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}

function scrollToBottom() {
  nextTick(() => {
    requestAnimationFrame(() => {
      const el = chatContainer.value
      if (el) el.scrollTop = el.scrollHeight
    })
  })
}

function scrollToLatestDay() {
  expandLatestDayGroup()
  nextTick(() => {
    requestAnimationFrame(() => {
      const container = chatContainer.value
      if (!container) return
      const groups = filteredDayGroups.value
      if (groups.length === 0) return
      const latestKey = groups[groups.length - 1]!.groupKey
      const section = container.querySelector(`[data-day-key="${latestKey}"]`)
      if (section) {
        section.scrollIntoView({ block: 'end', behavior: 'auto' })
      } else {
        container.scrollTop = container.scrollHeight
      }
    })
  })
}

// 流式消息到来时自动滚动
watch(
  () => store.messages.map(m => m.content).join('|'),
  () => {
    if (store.isStreaming) scrollToBottom()
  }
)

watch(() => store.panelOpen, async (open) => {
  if (open) {
    syncCollapsedDays()
    syncLoadedDayGroups()
    activeTab.value = store.panelTab ?? 'chat'
    await nextTick()
    inputEl.value?.focus()
    scrollToLatestDay()
    setTimeout(scrollToLatestDay, 50)
    setTimeout(scrollToLatestDay, 150)
  }
})

watch(activeTab, tab => {
  if (tab === 'chat' && store.panelOpen) {
    scrollToLatestDay()
    setTimeout(scrollToLatestDay, 50)
  }
})

watch(() => settingsStore.systemChatKindFilter, () => {
  if (!store.panelOpen || activeTab.value !== 'chat') return
  const sortKey = currentSortKey()
  const next = new Set(loadedDayGroups.value)
  for (const g of filteredDayGroups.value) {
    if (!isStaleDayGroup(g.sortKey, sortKey, g.day)) next.add(g.groupKey)
  }
  loadedDayGroups.value = next
})

watch(
  () => store.messages.length,
  () => {
    if (store.panelOpen && activeTab.value === 'chat') scrollToLatestDay()
  }
)

const purchaseShopItem = (id: string) => {
  const r = store.purchaseMeritShopItem(id)
  if (!r.ok && r.message) {
    store.addSystemMessage(r.message)
  }
}

const shopByCategory = (cat: string) =>
  store.allShopOffers.filter(i => i.category === cat && !i.purchased)
</script>

<template>
  <Transition name="panel-fade">
    <div
      v-if="store.panelOpen"
      class="fixed inset-0 z-50 flex items-center justify-center"
      :class="isMobile ? 'p-0' : 'p-4'"
      @click.self="store.closePanel()"
    >
      <div
        class="flex flex-col"
        :class="isMobile || store.panelFullscreen
          ? 'w-full h-full max-w-none max-h-none bg-panel'
          : 'w-full max-w-md h-[70vh] max-h-[600px] game-panel'"
      >
        <!-- 标题栏 -->
        <div class="flex items-center justify-between px-3 py-2 border-b border-accent/20 shrink-0">
          <div class="flex items-center gap-2">
            <span class="text-accent text-sm font-bold">{{ store.displayName }}</span>
            <span
              class="inline-block w-2 h-2 rounded-full"
              :class="store.mode === 'online' ? 'bg-green-500' : 'bg-orange-400'"
            />
            <span class="text-xs text-muted">{{ store.connectionLabel }}</span>
          </div>
          <div class="flex items-center gap-1">
            <button @click="store.toggleFullscreen()" class="p-1 hover:text-accent">
              <Minimize2 v-if="store.panelFullscreen" :size="14" />
              <Maximize2 v-else :size="14" />
            </button>
            <button @click="store.closePanel()" class="p-1 hover:text-accent">
              <X :size="16" />
            </button>
          </div>
        </div>

        <!-- 标签栏 -->
        <div class="flex gap-1 px-3 py-1 border-b border-accent/10 shrink-0">
          <button
            v-for="tab in ([['chat', '对话'], ['quests', '任务'], ['shop', '商店']] as const)"
            :key="tab[0]"
            @click="activeTab = tab[0]"
            class="text-xs px-2 py-0.5 rounded transition-colors"
            :class="activeTab === tab[0] ? 'bg-accent/20 text-accent' : 'text-muted hover:text-text/80'"
          >{{ tab[1] }}</button>
        </div>

        <!-- 对话标签页 -->
        <template v-if="activeTab === 'chat'">
          <div class="status-strip shrink-0 px-3 py-2 border-b border-accent/10 space-y-1.5">
            <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <span class="text-text/90">{{ gameStore.seasonName }} 第{{ gameStore.day }}天 · {{ gameStore.timeDisplay }}</span>
              <span class="text-accent font-medium">{{ playerStore.money.toLocaleString() }} 文</span>
              <span class="text-muted">体 {{ playerStore.stamina }}/{{ playerStore.maxStamina }}</span>
              <span class="text-muted">命 {{ playerStore.hp }}/{{ playerStore.getMaxHp() }}</span>
            </div>
            <div class="flex flex-wrap items-center gap-1">
              <span class="text-[11px] text-muted shrink-0">筛选</span>
              <button
                v-for="opt in SYSTEM_CHAT_KIND_FILTER_OPTIONS"
                :key="opt.key"
                type="button"
                class="text-[11px] px-1.5 py-0.5 rounded border transition-colors"
                :class="settingsStore.systemChatKindFilter === opt.key
                  ? 'border-accent/40 bg-accent/10 text-accent'
                  : 'border-accent/20 text-muted hover:text-text/80'"
                @click="settingsStore.changeSystemChatKindFilter(opt.key)"
              >{{ opt.label }}</button>
              <div class="ml-auto flex items-center gap-1 shrink-0 flex-wrap justify-end">
                <button
                  type="button"
                  class="text-[11px] px-1.5 py-0.5 rounded border transition-colors"
                  :class="settingsStore.systemChatDisplayMode === 'sectioned'
                    ? 'border-accent/40 bg-accent/10 text-accent'
                    : 'border-accent/20 text-muted hover:text-text/80'"
                  @click="settingsStore.changeSystemChatDisplayMode('sectioned')"
                >分类</button>
                <button
                  type="button"
                  class="text-[11px] px-1.5 py-0.5 rounded border transition-colors"
                  :class="settingsStore.systemChatDisplayMode === 'mixed'
                    ? 'border-accent/40 bg-accent/10 text-accent'
                    : 'border-accent/20 text-muted hover:text-text/80'"
                  @click="settingsStore.changeSystemChatDisplayMode('mixed')"
                >时间线</button>
                <button
                  type="button"
                  class="text-[11px] px-1.5 py-0.5 rounded border border-accent/20 text-muted hover:text-text/80 transition-colors inline-flex items-center gap-0.5"
                  title="展开并加载全部日期"
                  @click="expandAllDayGroups"
                >
                  <ChevronsDown :size="11" />
                  全部展开
                </button>
                <button
                  type="button"
                  class="text-[11px] px-1.5 py-0.5 rounded border border-accent/20 text-muted hover:text-text/80 transition-colors inline-flex items-center gap-0.5"
                  title="导出全部聊天记录"
                  @click="exportAllChat"
                >
                  <Download :size="11" />
                  导出
                </button>
              </div>
            </div>
          </div>
          <div ref="chatContainer" class="flex-1 overflow-y-auto px-3 py-3 space-y-4 text-sm min-h-0 chat-scroll">
            <div v-if="store.messages.length === 0" class="text-muted text-center py-10 text-sm">
              系统伙伴已就绪。输入关键词查询游戏知识，或连接后端解锁完整对话。
            </div>
            <div
              v-else-if="filteredDayGroups.length === 0"
              class="text-muted text-center py-10 text-sm"
            >
              当前筛选下暂无消息，可切换「全部」查看。
            </div>

            <section
              v-for="group in filteredDayGroups"
              :key="group.groupKey"
              :data-day-key="group.groupKey"
              class="day-group"
            >
              <button
                type="button"
                class="day-divider w-full"
                @click="toggleDayCollapse(group.groupKey, group)"
              >
                <component :is="isDayCollapsed(group.groupKey) ? ChevronRight : ChevronDown" :size="14" class="shrink-0 opacity-60" />
                <span>{{ formatGameDayLabel(group.day, group.season, group.year) }}</span>
                <span v-if="isDayCollapsed(group.groupKey)" class="day-divider__hint">
                  {{ collapsedHint(group) }}
                </span>
              </button>

              <div v-if="!isDayCollapsed(group.groupKey) && isDayGroupLoaded(group)">
                <!-- 时间线：碎碎念 / 提示 / 对话混合，按游戏时间排序 -->
                <div v-if="settingsStore.systemChatDisplayMode === 'mixed'" class="space-y-3 pl-1">
                  <template v-for="msg in getMixedMessagesForDay(group)" :key="msg.id">
                    <div v-if="getMessageRenderType(msg) === 'mumble'" class="mumble-item">
                      <div class="msg-meta">
                        <span class="font-bold text-accent/90">{{ store.displayName }}</span>
                        <span v-if="hasMessageTime(msg)" class="msg-time">{{ formatMessageTime(msg) }}</span>
                      </div>
                      <div
                        class="game-message whitespace-pre-wrap text-accent/85 italic leading-relaxed"
                        v-html="renderMarkdown(msg.content)"
                      />
                    </div>
                    <div v-else-if="getMessageRenderType(msg) === 'notice'" class="notice-item">
                      <span v-if="hasMessageTime(msg)" class="msg-time block mb-0.5">{{ formatMessageTime(msg) }}</span>
                      <div v-html="renderMarkdown(msg.content)" />
                    </div>
                    <div v-else-if="getMessageRenderType(msg) === 'chat-player'" class="chat-player">
                      <div class="chat-player__wrap">
                        <span v-if="hasMessageTime(msg)" class="msg-time msg-time--player">{{ formatMessageTime(msg) }}</span>
                        <span class="chat-player__bubble">{{ msg.content }}</span>
                      </div>
                    </div>
                    <div v-else class="chat-system">
                      <div class="msg-meta">
                        <span class="font-bold text-accent">{{ store.displayName }}</span>
                        <span v-if="hasMessageTime(msg)" class="msg-time">{{ formatMessageTime(msg) }}</span>
                      </div>
                      <div
                        class="game-message whitespace-pre-wrap leading-relaxed"
                        v-html="renderMarkdown(msg.content)"
                      />
                      <span v-if="isStreamingMsg(msg)" class="streaming-cursor">▌</span>
                    </div>
                  </template>
                </div>

                <!-- 分类：碎碎念 / 提示 / 对话分区 -->
                <template v-else>
                <div v-if="group.mumbles.length" class="mb-4">
                  <div class="section-label">
                    <span class="section-label__dot section-label__dot--mumble" />
                    碎碎念
                  </div>
                  <div class="space-y-2 pl-1">
                    <div
                      v-for="msg in group.mumbles"
                      :key="msg.id"
                      class="mumble-item"
                    >
                      <div class="msg-meta">
                        <span class="font-bold text-accent/90">{{ store.displayName }}</span>
                        <span v-if="hasMessageTime(msg)" class="msg-time">{{ formatMessageTime(msg) }}</span>
                      </div>
                      <div
                        class="game-message whitespace-pre-wrap text-accent/85 italic leading-relaxed"
                        v-html="renderMarkdown(msg.content)"
                      />
                    </div>
                  </div>
                </div>

                <!-- 系统提示 -->
                <div v-if="group.notices.length" class="mb-4">
                  <div class="section-label">
                    <span class="section-label__dot section-label__dot--notice" />
                    提示
                  </div>
                  <div class="space-y-2 pl-1">
                    <div
                      v-for="msg in group.notices"
                      :key="msg.id"
                      class="notice-item"
                    >
                      <span v-if="hasMessageTime(msg)" class="msg-time block mb-0.5">{{ formatMessageTime(msg) }}</span>
                      <div v-html="renderMarkdown(msg.content)" />
                    </div>
                  </div>
                </div>

                <!-- 对话 -->
                <div v-if="group.chats.length">
                  <div class="section-label">
                    <span class="section-label__dot section-label__dot--chat" />
                    对话
                  </div>
                  <div class="space-y-3 pl-1">
                    <div
                      v-for="msg in group.chats"
                      :key="msg.id"
                      :class="msg.role === 'player' ? 'chat-player' : 'chat-system'"
                    >
                      <template v-if="msg.role === 'player'">
                        <div class="chat-player__wrap">
                          <span v-if="hasMessageTime(msg)" class="msg-time msg-time--player">{{ formatMessageTime(msg) }}</span>
                          <span class="chat-player__bubble">{{ msg.content }}</span>
                        </div>
                      </template>
                      <template v-else>
                        <div class="msg-meta">
                          <span class="font-bold text-accent">{{ store.displayName }}</span>
                          <span v-if="hasMessageTime(msg)" class="msg-time">{{ formatMessageTime(msg) }}</span>
                        </div>
                        <div
                          class="game-message whitespace-pre-wrap leading-relaxed"
                          v-html="renderMarkdown(msg.content)"
                        />
                        <span v-if="isStreamingMsg(msg)" class="streaming-cursor">▌</span>
                      </template>
                    </div>
                  </div>
                </div>
                </template>
              </div>
            </section>
          </div>

          <div class="flex items-center gap-2 px-3 py-2.5 border-t border-accent/20 shrink-0">
            <input
              ref="inputEl"
              v-model="store.inputText"
              @keydown="handleKeydown"
              :disabled="store.isStreaming"
              :placeholder="store.mode === 'online' ? '输入消息…' : '输入关键词查询游戏知识…'"
              class="flex-1 bg-transparent border border-accent/20 rounded px-3 py-2 text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent/50 disabled:opacity-40"
            />
            <button @click="sendMessage" :disabled="store.isStreaming" class="p-2 hover:text-accent shrink-0 disabled:opacity-40">
              <ArrowUp :size="18" />
            </button>
          </div>
        </template>

        <!-- 任务标签页 -->
        <div v-if="activeTab === 'quests'" class="flex-1 overflow-y-auto px-3 py-2 space-y-2 text-xs min-h-0">
          <div class="mb-2 p-2 border border-accent/15 rounded space-y-1.5">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="text-[11px] text-muted">
                进行中 {{ activeQuestCount }}/{{ MAX_ACTIVE_QUESTS }}
              </span>
              <button
                type="button"
                class="text-[11px] px-2 py-1 rounded border border-accent/40 bg-accent/10 text-accent disabled:opacity-40 disabled:cursor-not-allowed"
                :disabled="!canRequestQuest"
                @click="requestQuest"
              >
                {{ store.questDispatchInFlight ? '生成中…' : '请求新任务' }}
              </button>
            </div>
            <p class="text-[10px] text-muted leading-relaxed">
              任务须在本页点击按钮领取；对话中索要任务不受理。在线时由 AI 生成，离线使用模板池。
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-1 mb-2 pb-2 border-b border-accent/10">
            <span class="text-[11px] text-muted shrink-0">筛选</span>
            <button
              v-for="opt in QUEST_HISTORY_FILTER_OPTIONS"
              :key="opt.key"
              type="button"
              class="text-[11px] px-1.5 py-0.5 rounded border transition-colors"
              :class="questHistoryFilter === opt.key
                ? 'border-accent/40 bg-accent/10 text-accent'
                : 'border-accent/20 text-muted hover:text-text/80'"
              @click="questHistoryFilter = opt.key"
            >{{ opt.label }}</button>
          </div>

          <div
            v-if="questLists.active.length === 0 && questLists.completed.length === 0 && questLists.failed.length === 0"
            class="text-muted text-center py-8"
          >
            暂无任务记录。系统觉醒后，点击上方「请求新任务」领取（最多同时 {{ MAX_ACTIVE_QUESTS }} 个）。
          </div>

          <template v-if="questLists.active.length > 0">
            <p v-if="questHistoryFilter === 'all'" class="text-[10px] text-muted">进行中</p>
            <div
              v-for="q in questLists.active"
              :key="q.id"
              class="border border-accent/10 rounded p-2"
            >
              <div class="flex justify-between items-start gap-2">
                <span class="font-bold text-accent">{{ q.title ?? q.type }}</span>
                <span class="text-[10px] text-muted shrink-0">
                  {{ '★'.repeat(q.difficulty) }} · {{ questStatusLabel(q) }}
                </span>
              </div>
              <div class="text-gray-400 mt-1">{{ q.description ?? formatQuestDescription(q) }}</div>
              <div class="text-gray-500 mt-0.5">{{ formatQuestDayRange(q) }} · 功勋 +{{ q.reward }}</div>
              <div v-if="!q.accepted" class="mt-2 flex flex-wrap gap-1">
                <button
                  v-if="q.negotiationRounds < 3"
                  @click="negotiate(q.id, 'extend_deadline')"
                  class="text-[10px] px-1.5 py-0.5 border border-accent/20 rounded hover:bg-accent/10"
                >延长期限</button>
                <button
                  v-if="q.negotiationRounds < 3"
                  @click="negotiate(q.id, 'reduce_target')"
                  class="text-[10px] px-1.5 py-0.5 border border-accent/20 rounded hover:bg-accent/10"
                >降低目标</button>
                <button
                  v-if="q.negotiationRounds < 1 && !q.swappedType"
                  @click="negotiate(q.id, 'swap_type')"
                  class="text-[10px] px-1.5 py-0.5 border border-accent/20 rounded hover:bg-accent/10"
                >更换类型</button>
                <button
                  @click="store.acceptQuest(q.id)"
                  class="text-[10px] px-1.5 py-0.5 border border-accent/40 rounded bg-accent/10 text-accent"
                >接受任务</button>
              </div>
              <template v-else>
                <p v-if="questProgressHint(q)" class="text-[10px] text-accent mt-1">
                  进度 {{ questProgressHint(q) }}
                </p>
                <p class="text-[10px] text-muted mt-1">进行中 · 达标后点击提交领取功勋</p>
                <button
                  type="button"
                  class="mt-1.5 text-[10px] px-2 py-0.5 rounded border border-accent/40 bg-accent/10 text-accent disabled:opacity-40 disabled:cursor-not-allowed"
                  :disabled="!store.canSubmitQuest(q.id)"
                  @click="submitQuest(q.id)"
                >提交任务</button>
              </template>
            </div>
          </template>

          <template v-if="questLists.completed.length > 0">
            <p v-if="questHistoryFilter === 'all'" class="text-[10px] text-muted pt-1">最近已完成（最多 10 条）</p>
            <div
              v-for="q in questLists.completed"
              :key="'c-' + q.id"
              class="border border-success/20 rounded p-2"
            >
              <div class="flex justify-between items-start gap-2">
                <span class="font-bold text-success">{{ q.title ?? q.type }}</span>
                <span class="text-[10px] text-muted shrink-0">已完成 · +{{ q.reward }} 功勋</span>
              </div>
              <div class="text-gray-400 mt-1">{{ q.description ?? formatQuestDescription(q) }}</div>
              <div class="text-[10px] text-muted mt-0.5">{{ formatQuestDayRange(q) }}</div>
              <div v-if="q.evaluationPending" class="text-[10px] text-muted mt-1 italic">评价生成中…</div>
              <div v-else-if="q.evaluation" class="text-[10px] text-gray-400 mt-1.5 border-t border-accent/10 pt-1.5 leading-relaxed">
                <span class="text-accent">任务评价：</span>{{ q.evaluation }}
              </div>
            </div>
          </template>

          <template v-if="questLists.failed.length > 0">
            <p v-if="questHistoryFilter === 'all'" class="text-[10px] text-muted pt-1">最近已失败（最多 10 条）</p>
            <div
              v-for="q in questLists.failed"
              :key="'f-' + q.id"
              class="border border-danger/20 rounded p-2"
            >
              <div class="flex justify-between items-start gap-2">
                <span class="font-bold text-danger">{{ q.title ?? q.type }}</span>
                <span class="text-[10px] text-muted shrink-0">
                  已失败 · −{{ q.fine ?? Math.ceil(q.reward * 0.5) }} 功勋
                </span>
              </div>
              <div class="text-gray-400 mt-1">{{ q.description ?? formatQuestDescription(q) }}</div>
              <div class="text-[10px] text-muted mt-0.5">{{ formatQuestDayRange(q) }}</div>
              <div v-if="q.evaluationPending" class="text-[10px] text-muted mt-1 italic">评价生成中…</div>
              <div v-else-if="q.evaluation" class="text-[10px] text-gray-400 mt-1.5 border-t border-accent/10 pt-1.5 leading-relaxed">
                <span class="text-accent">任务评价：</span>{{ q.evaluation }}
              </div>
            </div>
          </template>

          <div class="text-[10px] text-muted text-center pt-2 border-t border-accent/10">
            功勋余额：{{ store.merit }}（可为负，不影响接任务）
          </div>
        </div>

        <!-- 商店标签页 -->
        <div v-if="activeTab === 'shop'" class="flex-1 overflow-y-auto px-3 py-2 space-y-2 text-xs min-h-0">
          <div class="text-[10px] text-muted mb-2">
            功勋余额：{{ store.merit }}。在线连接后向系统许愿（对话中询问），AI 评估可行方案会出现在「专属定制」。
            属性类（生命/体力上限）各最多兑换 3 次；背包扩容可多次兑换至满级。
          </div>
          <div
            v-if="store.affinity < meritWishMinAffinity"
            class="text-[10px] text-accent border border-accent/20 rounded p-2 mb-2"
          >
            专属定制未解锁：系统亲和需 {{ meritWishMinAffinity }}/100（当前 {{ store.affinity }}，与村民好感度无关）。多和系统聊天、打开面板或完成任务可提升。
          </div>
          <template v-for="section in ([['stat', '属性提升'], ['buff', '金手指'], ['timed', '限时祝福'], ['item', '稀有物品'], ['custom', '专属定制']] as const)" :key="section[0]">
            <div v-if="shopByCategory(section[0]).length" class="text-accent font-bold text-xs mb-1 mt-2">{{ section[1] }}</div>
            <div
              v-for="item in shopByCategory(section[0])"
              :key="item.id"
              class="flex justify-between items-center border border-accent/10 rounded p-1.5"
              :class="item.purchased ? 'opacity-50' : ''"
            >
              <div class="min-w-0 pr-2">
                <div class="text-gray-200">{{ item.name }}</div>
                <div class="text-[10px] text-muted">{{ item.description }}</div>
              </div>
              <button
                class="text-[10px] px-2 py-0.5 border border-accent/30 rounded hover:bg-accent/10 text-accent shrink-0"
                :disabled="item.purchased || store.merit < item.cost"
                @click="purchaseShopItem(item.id)"
              >
                <template v-if="item.purchased">
                  {{ item.maxPurchases && item.maxPurchases > 1 ? '已兑满' : '已兑' }}
                </template>
                <template v-else>
                  {{ item.cost }} 功勋
                  <span v-if="item.maxPurchases && item.maxPurchases > 1" class="text-muted">
                    ({{ item.purchaseCount ?? 0 }}/{{ item.maxPurchases }})
                  </span>
                </template>
              </button>
            </div>
          </template>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.streaming-cursor {
  animation: blink 1s step-end infinite;
  color: var(--color-accent);
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* 按天分组 */
.day-divider {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 10px 0 12px;
  padding: 4px 0;
  color: var(--color-muted);
  font-size: 13px;
  letter-spacing: 0.03em;
  background: none;
  border: none;
  cursor: pointer;
}
.day-divider:hover {
  color: var(--color-accent);
}
.day-divider__hint {
  font-size: 11px;
  color: var(--color-muted);
  opacity: 0.85;
  font-weight: normal;
}

.status-strip {
  background: color-mix(in srgb, var(--color-accent) 6%, transparent);
}

.msg-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.msg-time {
  font-size: 11px;
  color: var(--color-muted);
}
.msg-time--player {
  display: block;
  text-align: right;
  margin-bottom: 2px;
}

.section-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--color-muted);
  margin-bottom: 8px;
}
.section-label__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.section-label__dot--mumble { background: var(--color-accent); opacity: 0.7; }
.section-label__dot--notice { background: var(--color-muted); }
.section-label__dot--chat { background: var(--color-water); }

.mumble-item {
  padding: 10px 12px;
  border-left: 3px solid color-mix(in srgb, var(--color-accent) 45%, transparent);
  background: color-mix(in srgb, var(--color-accent) 8%, rgb(var(--color-panel)));
  border-radius: 0 6px 6px 0;
}

.notice-item {
  font-size: 13px;
  line-height: 1.6;
  padding: 8px 10px;
  color: rgb(var(--color-text) / 0.75);
  background: color-mix(in srgb, var(--color-muted) 12%, rgb(var(--color-panel)));
  border-radius: 4px;
}

.chat-player {
  text-align: right;
}
.chat-player__wrap {
  display: inline-block;
  max-width: 88%;
  text-align: right;
}
.chat-player__bubble {
  display: inline-block;
  padding: 10px 14px;
  border-radius: 10px 10px 2px 10px;
  background: color-mix(in srgb, var(--color-water) 18%, rgb(var(--color-panel)));
  border: 1px solid color-mix(in srgb, var(--color-water) 35%, transparent);
  color: rgb(var(--color-text));
  text-align: left;
  font-size: 14px;
  line-height: 1.55;
}

.chat-system {
  color: rgb(var(--color-text));
  font-size: 14px;
}

/* 消息容器 */
.game-message {
  display: block;
  color: inherit;
}

/* 通用列表样式 */
.game-list {
  list-style-type: none !important;
  padding-left: 0.75rem;
  margin: 0.25rem 0;
}
.game-list li {
  position: relative;
  padding-left: 0.75rem;
  margin: 0.125rem 0;
  line-height: 1.6;
}

/* 有序列表前置编号 */
.game-ol {
  counter-reset: md-ol;
}
.game-ol li {
  counter-increment: md-ol;
}
.game-ol li::before {
  content: counter(md-ol) ". ";
  position: absolute;
  left: 0;
  color: var(--color-accent);
  font-weight: bold;
}

/* 无序列表前置圆点 */
.game-ul li::before {
  content: "·";
  position: absolute;
  left: 0;
  color: var(--color-accent);
  font-weight: bold;
  font-size: 1.2em;
  line-height: 1;
}

/* 粗体 */
:deep(strong) {
  color: var(--color-accent);
  font-weight: bold;
}

/* 斜体 */
:deep(em) {
  font-style: italic;
  color: rgb(var(--color-text) / 0.7);
}
</style>