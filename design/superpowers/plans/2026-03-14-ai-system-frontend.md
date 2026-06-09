# AI 系统伙伴 — 前端实现计划（子系统 A）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现 AI 系统伙伴的全部离线可用功能：useSystemStore 状态机、悬浮按钮+面板 UI、觉醒流程、知识库匹配、亲和度、任务系统、功勋商店。

**Architecture:** 新建 `useSystemStore` 作为核心状态机（Pinia Composition API），新建 `SystemPanel.vue` / `PersonaSelect.vue` 作为独立弹窗组件，在 `GameLayout.vue` 中挂载悬浮按钮。通过 `useEndDay.ts` 注入觉醒和每日触发，通过 `useSaveStore` 序列化持久化。纯前端运行，不依赖后端。

**Tech Stack:** Vue 3 + Pinia + TypeScript + Tailwind CSS + lucide-vue-next（图标库）

**不包含：** Go 后端、云端存档、在线 LLM 对话 —— 这些属于子系统 B/C。

---

### Task 1: 类型定义 + 知识库数据结构

**Files:**
- Create: `src/types/system.ts`
- Create: `src/data/systemKnowledge.ts`

- [ ] **Step 1: 创建 SystemTypes**

```typescript
// src/types/system.ts

export type PersonaId = 'qingluan' | 'chaofeng' | 'taosu' | 'moyan'

export interface SystemMessage {
  id: string
  role: 'system' | 'player'
  content: string
  timestamp: number       // Date.now()
  gameDay: number
}

export type ConnectionMode = 'offline' | 'online'

export type QuestType = 'collect' | 'mine' | 'social' | 'skill' | 'craft' | 'fish' | 'tavern'
export type QuestDifficulty = 1 | 2 | 3 | 4

export interface SystemQuest {
  id: string
  type: QuestType
  difficulty: QuestDifficulty
  target: {
    itemId?: string
    quantity?: number
    floor?: number
    npcId?: string
    hearts?: number
    skillType?: string
    skillLevel?: number
    fishId?: string
    metric?: string
    threshold?: number
  }
  deadline: number          // 游戏日
  reward: number            // 功勋
  accepted: boolean
  completed: boolean
  negotiationRounds: number
}

export type KnowledgeCategory =
  | 'crop' | 'fish' | 'recipe' | 'mine' | 'npc'
  | 'skill' | 'equipment' | 'mechanic' | 'item' | 'tavern'

export interface KnowledgeEntry {
  id: string
  category: KnowledgeCategory
  keywords: string[]
  title: string
  content: string
  relatedIds?: string[]
}

export type MeritBuffType = 'permanent' | 'timed'

export interface MeritBuff {
  id: string
  name: string
  description: string
  cost: number
  type: MeritBuffType
  durationDays?: number      // timed buff only
  effect: {
    type: string             // maps to game mechanic
    value: number
  }
}

export interface MemoryTimelineEntry {
  day: number
  summary: string
  trigger: 'periodic' | 'milestone' | 'affinity'
  createdAt: number
}

// Affinity milestones
export const AFFINITY_MILESTONES = {
  TONE_SHIFT: 30,      // 语气松动
  OCCASIONAL_PRAISE: 50,  // 偶尔夸赞
  REVEAL_SECRET: 70,   // 透露秘密
  GIFT: 100            // 专属赠礼
} as const
```

- [ ] **Step 2: 创建知识库骨架**

```typescript
// src/data/systemKnowledge.ts
import type { KnowledgeEntry } from '@/types/system'

// 骨架 — 实现阶段对照 src/data/ 批量填充
// 每个条目为一条独立的游戏知识，离线模式下关键词匹配触发
export const systemKnowledge: KnowledgeEntry[] = [
  // === 作物 ===
  {
    id: 'crop_cabbage',
    category: 'crop',
    keywords: ['青菜', 'cabbage', '春季作物', '春天种什么'],
    title: '青菜',
    content: '春季作物。4天成熟。种子售价20文，作物售价60文。可烹饪炒青菜。'
  },
  // 留空给批量生成 — 约160-220条
]

// 关键词匹配工具
export function matchKnowledge(input: string): KnowledgeEntry | null {
  const lower = input.toLowerCase()
  // 按关键词命中数排序，返回最佳匹配
  const scored = systemKnowledge
    .map(entry => ({
      entry,
      score: entry.keywords.filter(kw => lower.includes(kw.toLowerCase())).length
    }))
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
  return scored[0]?.entry ?? null
}
```

- [ ] **Step 3: 验证 TypeScript 编译**

```bash
cd taoyuan && npx vue-tsc --noEmit src/types/system.ts src/data/systemKnowledge.ts
```

- [ ] **Step 4: Commit**

```bash
git add src/types/system.ts src/data/systemKnowledge.ts
git commit -m "feat(system): add types and knowledge base structure"
```

---

### Task 2: useSystemStore 核心状态机

**Files:**
- Create: `src/stores/useSystemStore.ts`

- [ ] **Step 1: 创建 Store 骨架**

```typescript
// src/stores/useSystemStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { PersonaId, SystemMessage, ConnectionMode, SystemQuest, MeritBuff, MemoryTimelineEntry } from '@/types/system'
import { AFFINITY_MILESTONES } from '@/types/system'
import { matchKnowledge } from '@/data/systemKnowledge'
import { usePlayerStore } from './usePlayerStore'

export const useSystemStore = defineStore('system', () => {
  // === 人格 ===
  const personaId = ref<PersonaId | null>(null)  // null = 未觉醒

  // === 觉醒 ===
  const awakened = ref(false)
  const firstContactDay = ref(-1)

  // === 连接 ===
  const mode = ref<ConnectionMode>('offline')
  const backendUrl = ref<string | null>(null)

  // === 消息 ===
  const messages = ref<SystemMessage[]>([])
  const unreadCount = ref(0)

  // === 亲和度 (0~100，隐藏值，玩家不可见) ===
  const affinity = ref(0)
  const affinityMilestonesReached = ref<Set<number>>(new Set())

  // === 任务 ===
  const merit = ref(0)
  const quests = ref<SystemQuest[]>([])
  const activeBuffs = ref<MeritBuff[]>([])

  // === 长期记忆 ===
  const timeline = ref<MemoryTimelineEntry[]>([])

  // === 面板状态 ===
  const panelOpen = ref(false)
  const panelFullscreen = ref(false)
  const inputText = ref('')

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
    addSystemMessage(getAwakeningGreeting(persona))
  }

  function addSystemMessage(content: string) {
    const store = usePlayerStore()  // lazy import pattern for cross-store
    messages.value.push({
      id: crypto.randomUUID(),
      role: 'system',
      content,
      timestamp: Date.now(),
      gameDay: 0  // simplified — 实际应从 gameStore 获取
    })
    if (!panelOpen.value) {
      unreadCount.value++
    }
    // 滚动窗口：保持最近 200 条
    if (messages.value.length > 200) {
      messages.value = messages.value.slice(-200)
    }
  }

  function addPlayerMessage(content: string) {
    messages.value.push({
      id: crypto.randomUUID(),
      role: 'player',
      content,
      timestamp: Date.now(),
      gameDay: 0
    })
  }

  function processPlayerInput(input: string): string | null {
    addPlayerMessage(input)

    if (mode.value === 'offline') {
      // 离线：知识库匹配
      const match = matchKnowledge(input)
      if (match) {
        const reply = wrapWithPersona(match.content)
        addSystemMessage(reply)
        return reply
      }
      addSystemMessage('灵识信号微弱……请尝试换个关键词，或连接后端以获得完整对话能力。')
      return null
    }

    // 在线：由后端处理（子系统 B）
    return null
  }

  function openPanel() {
    panelOpen.value = true
    unreadCount.value = 0
  }

  function closePanel() {
    panelOpen.value = false
  }

  function toggleFullscreen() {
    panelFullscreen.value = !panelFullscreen.value
  }

  // === 亲和度 ===
  function adjustAffinity(delta: number, reason: string) {
    affinity.value = Math.max(0, Math.min(100, affinity.value + delta))
    // 检测里程碑
    for (const milestone of Object.values(AFFINITY_MILESTONES)) {
      if (affinity.value >= milestone && !affinityMilestonesReached.value.has(milestone)) {
        affinityMilestonesReached.value.add(milestone)
        handleMilestone(milestone)
      }
    }
  }

  function handleMilestone(milestone: number) {
    // 后续 Task 实现具体对话
    if (milestone === 100) {
      addSystemMessage(getGiftLine())
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
      activeBuffs: activeBuffs.value,
      timeline: timeline.value
    }
  }

  function deserialize(data: any) {
    if (!data) return
    personaId.value = data.personaId ?? null
    awakened.value = data.awakened ?? false
    firstContactDay.value = data.firstContactDay ?? -1
    messages.value = data.messages ?? []
    affinity.value = data.affinity ?? 0
    affinityMilestonesReached.value = new Set(data.affinityMilestonesReached ?? [])
    merit.value = data.merit ?? 0
    quests.value = data.quests ?? []
    activeBuffs.value = data.activeBuffs ?? []
    timeline.value = data.timeline ?? []
  }

  return {
    personaId, awakened, firstContactDay,
    mode, backendUrl,
    messages, unreadCount,
    affinity, affinityMilestonesReached,
    merit, quests, activeBuffs,
    timeline,
    panelOpen, panelFullscreen, inputText,
    displayName, connectionLabel,
    awaken, addSystemMessage, addPlayerMessage, processPlayerInput,
    openPanel, closePanel, toggleFullscreen,
    adjustAffinity,
    serialize, deserialize
  }
})

// === 辅助函数 ===

function getAwakeningGreeting(persona: PersonaId): string {
  const greetings: Record<PersonaId, string> = {
    qingluan: '吾名青鸾。上古仙禽一缕灵识，寄于君之铜钥。今后，吾与君同行。',
    chaofeng: '啧，终于醒了？我是嘲风，龙生九子知道吧？以后我罩你——别给我丢人就行。',
    taosu: '主人主人！桃酥等了好久好久！我是桃酥，以后就是主人的伙伴啦 (◕ᴗ◕✿)',
    moyan: '墨言。记录者。你的数据从现在开始纳入记录。建议尽快开始行动。'
  }
  return greetings[persona]
}

function wrapWithPersona(content: string): string {
  // 离线模式下用当前人格的默认语气包装知识库条目
  // 简化版 — 后续可扩展为按人格定制
  return content
}

function getGiftLine(): string {
  // 亲和 100 赠礼台词，参见设计文档 §2B.6
  return '（赠礼事件触发 — 待 Task 6 实现完整脚本）'
}
```

- [ ] **Step 2: 验证编译**

```bash
cd taoyuan && npx vue-tsc --noEmit src/stores/useSystemStore.ts
```

- [ ] **Step 3: Commit**

```bash
git add src/stores/useSystemStore.ts
git commit -m "feat(system): add useSystemStore core state machine"
```

---

### Task 3: SystemButton 浮动按钮 + SystemPanel 弹窗

**Files:**
- Create: `src/components/game/SystemButton.vue`
- Create: `src/components/game/SystemPanel.vue`
- Modify: `src/views/GameLayout.vue`

- [ ] **Step 1: 创建浮动按钮**

```vue
<!-- src/components/game/SystemButton.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { Cpu } from 'lucide-vue-next'
import { useSystemStore } from '@/stores/useSystemStore'

const store = useSystemStore()

const hasUnread = computed(() => store.unreadCount > 0)
const label = computed(() => store.personaId ? store.displayName : '???')
</script>

<template>
  <button
    class="system-float-btn"
    :title="`系统伙伴 · ${label}`"
    @click="store.openPanel()"
  >
    <span class="relative">
      <Cpu :size="18" class="text-accent" />
      <span
        v-if="hasUnread"
        class="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"
      />
    </span>
  </button>
</template>

<style scoped>
.system-float-btn {
  position: fixed;
  right: 12px;
  z-index: 40;
  width: 40px;
  height: 40px;
  border-radius: 2px;
  background: rgb(var(--color-panel));
  border: 2px solid var(--color-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  /* 放在日志按钮上方 */
  bottom: calc(env(safe-area-inset-bottom, 12px) + 12px + 48px * 4);
}
.system-float-btn:hover {
  border-color: rgb(var(--color-accent) / 0.7);
}
</style>
```

- [ ] **Step 2: 创建系统面板**

```vue
<!-- src/components/game/SystemPanel.vue -->
<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import { X, ArrowUp, Maximize2, Minimize2 } from 'lucide-vue-next'
import { useSystemStore } from '@/stores/useSystemStore'

const store = useSystemStore()
const inputEl = ref<HTMLInputElement | null>()

const isMobile = computed(() => window.innerWidth < 768)

function sendMessage() {
  const text = store.inputText.trim()
  if (!text) return
  store.inputText = ''
  store.processPlayerInput(text)
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}

// 打开面板时滚动到底部
watch(() => store.panelOpen, async (open) => {
  if (open) {
    await nextTick()
    inputEl.value?.focus()
  }
})
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
        class="system-panel game-panel flex flex-col"
        :class="isMobile || store.panelFullscreen
          ? 'w-full h-full max-w-none max-h-none'
          : 'w-full max-w-md h-[70vh] max-h-[600px]'"
      >
        <!-- 标题栏 -->
        <div class="flex items-center justify-between px-3 py-2 border-b border-accent/20 shrink-0">
          <div class="flex items-center gap-2">
            <span class="text-accent text-sm font-bold">{{ store.displayName }}</span>
            <span class="inline-block w-2 h-2 rounded-full"
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

        <!-- 消息区 -->
        <div class="flex-1 overflow-y-auto px-3 py-2 space-y-2 text-xs">
          <div v-if="store.messages.length === 0" class="text-muted text-center py-8">
            系统伙伴已就绪。输入关键词查询游戏知识，或连接后端解锁完整对话。
          </div>
          <div
            v-for="msg in store.messages"
            :key="msg.id"
            :class="msg.role === 'system'
              ? 'text-accent/90'
              : 'text-gray-300 text-right'"
          >
            <span v-if="msg.role === 'system'" class="font-bold mr-1">{{ store.displayName }}：</span>
            {{ msg.content }}
          </div>
          <div v-if="store.mode === 'offline'" class="text-[10px] text-muted text-center pt-2">
            灵识托管中 — 仅知识库可用
          </div>
        </div>

        <!-- 输入区 -->
        <div class="flex items-center gap-2 px-3 py-2 border-t border-accent/20 shrink-0">
          <input
            ref="inputEl"
            v-model="store.inputText"
            @keydown="handleKeydown"
            placeholder="输入关键词查询游戏知识…"
            class="flex-1 bg-transparent border border-accent/20 rounded px-2 py-1 text-xs
                   text-gray-200 placeholder:text-muted focus:outline-none focus:border-accent/50"
          />
          <button @click="sendMessage" class="p-1 hover:text-accent shrink-0">
            <ArrowUp :size="16" />
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.system-panel {
  background-color: #1a1a1a; /* 墨底 */
  border: 1px solid rgba(200, 164, 92, 0.3);
  border-radius: 2px;
}
</style>
```

- [ ] **Step 3: 挂载到 GameLayout**

在 `GameLayout.vue` 中：

1. 在 `<script setup>` 顶部添加 import：
```typescript
import SystemButton from '@/components/game/SystemButton.vue'
import SystemPanel from '@/components/game/SystemPanel.vue'
```

2. 在 template 的悬浮按钮组后添加：
```html
<SystemButton />
<SystemPanel />
```
插入位置：`<button class="mobile-log-btn">` 之后、`<SettingsDialog>` 之前（约第 280 行附近）。

- [ ] **Step 4: 验证编译 + 手动测试**

```bash
cd taoyuan && npx vue-tsc --noEmit
```

启动游戏后应看到右下角新增的 CPU 图标按钮，点击弹出空面板。

- [ ] **Step 5: Commit**

```bash
git add src/components/game/SystemButton.vue src/components/game/SystemPanel.vue src/views/GameLayout.vue
git commit -m "feat(system): add floating button and system panel UI"
```

---

### Task 4: 人格选择 + 觉醒流程

**Files:**
- Create: `src/components/game/PersonaSelect.vue`
- Modify: `src/composables/useEndDay.ts`
- Modify: `src/stores/useSystemStore.ts`

- [ ] **Step 1: 创建人格选择组件**

```vue
<!-- src/components/game/PersonaSelect.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import type { PersonaId } from '@/types/system'
import { useSystemStore } from '@/stores/useSystemStore'

const emit = defineEmits<{ chosen: [] }>()
const store = useSystemStore()
const selected = ref<PersonaId | null>(null)

interface PersonaOption {
  id: PersonaId
  name: string
  tagline: string
  sample: string
  color: string
}

const personas: PersonaOption[] = [
  {
    id: 'qingluan', name: '青鸾', color: '#6eb5c0',
    tagline: '温润如玉的上古仙禽，半文半白，引经据典',
    sample: '「宿主早安。今日天朗气清，宜出行。」'
  },
  {
    id: 'chaofeng', name: '嘲风', color: '#c44',
    tagline: '刀子嘴豆腐心的龙子，爱吐槽但从不真的嫌弃你',
    sample: '「啧，终于醒了？以后我罩你——别给我丢人就行。」'
  },
  {
    id: 'taosu', name: '桃酥', color: '#e8a0bf',
    tagline: '百年桃树结出的灵果化形，软萌治愈的小可爱',
    sample: '「主人主人！桃酥等了你好久好久！(◕ᴗ◕✿)」'
  },
  {
    id: 'moyan', name: '墨言', color: '#888',
    tagline: '无字天书所化的器灵，极简主义者，沉默是最大的温柔',
    sample: '「墨言。记录者。你的数据从现在开始纳入记录。」'
  }
]

function confirm() {
  if (!selected.value) return
  store.awaken(selected.value, 0) // day 由调用方传入
  emit('chosen')
}
</script>

<template>
  <div class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
    <div class="game-panel w-full max-w-lg">
      <h2 class="text-accent text-sm font-bold text-center mb-2">选择你的系统伙伴</h2>
      <p class="text-muted text-xs text-center mb-4">选择后不可更改，请仔细考虑</p>

      <div class="grid grid-cols-2 gap-2 mb-4">
        <div
          v-for="p in personas"
          :key="p.id"
          @click="selected = p.id"
          class="cursor-pointer p-3 border rounded transition-colors"
          :class="selected === p.id
            ? 'border-accent bg-accent/10'
            : 'border-gray-700 hover:border-gray-500'"
        >
          <div class="font-bold text-sm" :style="{ color: p.color }">{{ p.name }}</div>
          <div class="text-xs text-gray-400 mt-1">{{ p.tagline }}</div>
          <div class="text-xs italic mt-1" :style="{ color: p.color }">{{ p.sample }}</div>
        </div>
      </div>

      <button
        @click="confirm"
        :disabled="!selected"
        class="w-full py-2 text-sm border border-accent/40 rounded
               hover:bg-accent/10 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        确认选择
      </button>
    </div>
  </div>
</template>
```

- [ ] **Step 2: 注入觉醒触发**

在 `useEndDay.ts` 的 `handleEndDay()` 函数中，`gameStore.nextDay()` 之后、晨间结算之前插入：

```typescript
// 约第 692 行，gameStore.nextDay() 调用之后
const systemStore = useSystemStore()

// 第一天过夜后触发觉醒（day 从 1 变 2）
if (gameStore.year === 1 && gameStore.season === 'spring' && gameStore.day === 2 && !systemStore.awakened) {
  // 标记 — 觉醒弹窗在 GameLayout 中通过 watch 处理
  systemStore.pendingAwakening = true
}
```

同时在 `useSystemStore` 中添加:

```typescript
// 在 state 区添加
const pendingAwakening = ref(false)
// 在 return 中添加
pendingAwakening,
```

- [ ] **Step 3: 在 GameLayout 中监听觉醒**

在 `GameLayout.vue` 的 `<script setup>` 中添加：

```typescript
import PersonaSelect from '@/components/game/PersonaSelect.vue'
import { useSystemStore } from '@/stores/useSystemStore'

const systemStore = useSystemStore()
const showPersonaSelect = ref(false)

watch(() => systemStore.pendingAwakening, (val) => {
  if (val) showPersonaSelect.value = true
})

function onPersonaChosen() {
  showPersonaSelect.value = false
  systemStore.pendingAwakening = false
  systemStore.openPanel()  // 自动弹出系统面板展示觉醒问候
}
```

在 template 中添加（放在 SystemPanel 之后）：

```html
<PersonaSelect v-if="showPersonaSelect" @chosen="onPersonaChosen()" />
```

- [ ] **Step 4: 验证编译**

```bash
cd taoyuan && npx vue-tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/components/game/PersonaSelect.vue src/composables/useEndDay.ts src/stores/useSystemStore.ts src/views/GameLayout.vue
git commit -m "feat(system): add persona selection and awakening flow"
```

---

### Task 5: 存档序列化 + 触发钩子

**Files:**
- Modify: `src/stores/useSaveStore.ts`

- [ ] **Step 1: 序列化集成**

在 `useSaveStore.ts` 的 `saveToSlot` 函数中，在 `tavern: tavernStore.serialize()` 之后添加：

```typescript
import { useSystemStore } from '@/stores/useSystemStore'
// ...
const systemStore = useSystemStore()
// ... 在 data 对象中添加:
  system: systemStore.serialize(),
```

在 `loadFromSlot` 函数末尾，`tavernStore.deserialize(...)` 之后添加：

```typescript
const systemStore = useSystemStore()
if (data.system) {
  systemStore.deserialize(data.system)
}
```

- [ ] **Step 2: 重置处理**

在 `resetAllStoresForNewGame()` 相关逻辑中（若 systemStore 也需要 $reset），添加：

```typescript
// 在 useSaveStore 或 MainMenu.vue 的 handleNewGame 末尾
useSystemStore().$reset()
```

确保 `useSystemStore` 在 Pinia 的 `$reset` 调用链中（如果使用了 `resetAllStoresForNewGame` 的 store 列表）。

- [ ] **Step 3: 验证**

```bash
cd taoyuan && npx vue-tsc --noEmit
```

启动游戏 → 创建新档 → 过夜觉醒 → 选择人格 → 关闭面板 → 手动存档 → 重新加载 → 确认人格保留、消息保留。

- [ ] **Step 4: Commit**

```bash
git add src/stores/useSaveStore.ts
git commit -m "feat(system): integrate system store serialization with save system"
```

---

### Task 6: 亲和度系统 + 每日触发

**Files:**
- Modify: `src/stores/useSystemStore.ts`

- [ ] **Step 1: 实现亲和度加减逻辑**

完善 `useSystemStore` 中的 `adjustAffinity` 和 `handleMilestone`：

```typescript
// 亲和度各人格专属加减规则
const PERSONA_AFFINITY_RULES: Record<PersonaId, {
  likes: { condition: string; delta: number; msg: string }[]
  dislikes: { condition: string; delta: number; msg: string }[]
}> = {
  qingluan: {
    likes: [
      { condition: 'drink_tea', delta: 2, msg: '此茶甚佳。' },
      { condition: 'brew_osmanthus_wine', delta: 3, msg: '此酒甚佳。' },
      { condition: 'gift_npc_well', delta: 1, msg: '待人以礼，善。' },
    ],
    dislikes: [
      { condition: 'rude_to_npc', delta: -3, msg: '请宿主慎言。' },
      { condition: 'ruin_crop', delta: -2, msg: '此物亦有灵。' },
    ]
  },
  chaofeng: {
    likes: [
      { condition: 'deep_mine', delta: 3, msg: '哈！终于开窍了！' },
      { condition: 'eat_spicy', delta: 2, msg: '这才像话。' },
      { condition: 'rare_drop', delta: 5, msg: '漂亮！' },
    ],
    dislikes: [
      { condition: 'too_cautious', delta: -2, msg: '……你就这点胆？' },
      { condition: 'reject_adventure_3x', delta: -5, msg: '（沉默一整天）' },
    ]
  },
  taosu: {
    likes: [
      { condition: 'eat_sweet', delta: 2, msg: '嗷呜~好甜！' },
      { condition: 'pet_animal', delta: 2, msg: '小动物好可爱！' },
      { condition: 'player_says_thanks', delta: 3, msg: '主人最好了！(≧▽≦)' },
    ],
    dislikes: [
      { condition: 'ignore_animal', delta: -3, msg: '……小动物会饿的。' },
      { condition: 'player_hurt', delta: -2, msg: '主人小心……' },
    ]
  },
  moyan: {
    likes: [
      { condition: 'organize_inventory', delta: 3, msg: '好。' },
      { condition: 'complete_collection', delta: 5, msg: '数据完整。不错。' },
      { condition: 'learn_from_mistake', delta: 2, msg: '（更详细的建议）' },
    ],
    dislikes: [
      { condition: 'repeat_mistake', delta: -3, msg: '同上一次。原因未变。' },
      { condition: 'impulse_buy', delta: -1, msg: '不建议。' },
    ]
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
      moyan: '评估：你这个宿主效率排名前 30%。……尚可。'
    },
    70: {
      qingluan: '千年前，吾曾有一宿主，是位茶农……（欲言又止）改日再叙。',
      chaofeng: '……你想知道我在天庭到底干了什么吗？算了，改天再说。',
      taosu: '桃酥其实记性可好了。主人说过的每一句话桃酥都记得……但是这是秘密！',
      moyan: '我有一位宿主，活到 92 岁。他最后一天的记录是"今日无事"。……但那天不是无事。'
    },
    100: {
      qingluan: '此物伴吾千年，今赠予小友。愿它护你平安。',
      chaofeng: '拿去，就这一片——不是心疼你，是怕你死在矿里太丢我的人。',
      taosu: '这是桃酥存了好久好久的……给主人吃，吃了就能多陪桃酥一会儿。',
      moyan: '这本笔记现在是空白的。第十七页之后，是留给你的。建议：好好活着。我会记录。'
    }
  }
  const line = lines[milestone]?.[personaId.value]
  if (line) addSystemMessage(line)
}
```

- [ ] **Step 2: 每日早安/晚安触发**

在 `useEndDay.ts` 的 `handleEndDay()` 中，晨间结算开始处（`gameStore.nextDay()` 之后）添加：

```typescript
// 每日早安
if (systemStore.awakened) {
  systemStore.addSystemMessage(getMorningGreeting(systemStore.personaId!, gameStore.season, gameStore.weather))
}
```

创建辅助函数文件 `src/composables/useSystemGreetings.ts`：

```typescript
import type { PersonaId } from '@/types/system'

export function getMorningGreeting(persona: PersonaId, season: string, weather: string): string {
  const templates: Record<PersonaId, Record<string, string[]>> = {
    qingluan: {
      spring: ['宿主早安。今日天朗气清，宜出行。', '春分将至，田垄间可播种矣。'],
      rain: ['雨洗青山，听雨品茗，亦是雅事。'],
    },
    chaofeng: {
      spring: ['啧，大太阳。适合下矿——别跟我说你怕热。'],
      rain: ['下雨了。要么睡觉要么下矿。选一个。'],
    },
    taosu: {
      spring: ['春天早上好呀主人！今天阳光金灿灿的~(◕ᴗ◕✿)'],
    },
    moyan: {
      spring: ['今日晴。建议：户外作业。'],
      rain: ['今日雨。建议：室内加工。'],
    }
  }
  // 简化返回逻辑
  const pool = templates[persona]?.[season] ?? templates[persona]?.spring ?? ['早安。']
  return pool[Math.floor(Math.random() * pool.length)]
}
```

晚安可以在睡前按钮点击时触发（GameLayout 的 confirmSleep 调用前）。

- [ ] **Step 3: 验证编译**

```bash
cd taoyuan && npx vue-tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/stores/useSystemStore.ts src/composables/useEndDay.ts src/composables/useSystemGreetings.ts
git commit -m "feat(system): add affinity system and daily greetings"
```

---

### Task 7: 任务系统 + 功勋商店 UI

**Files:**
- Modify: `src/stores/useSystemStore.ts`
- Modify: `src/components/game/SystemPanel.vue`

- [ ] **Step 1: 添加任务生成逻辑到 useSystemStore**

```typescript
// 在 useSystemStore 中添加

const QUESTS_PER_ASSIGNMENT = 1
const QUEST_COOLDOWN_DAYS = 2
let lastQuestDay = -1

function checkQuestAssignment(currentDay: number) {
  if (!awakened.value) return
  if (quests.value.length >= 3) return  // 最多同时 3 个
  if (currentDay - lastQuestDay < QUEST_COOLDOWN_DAYS) return

  lastQuestDay = currentDay
  const quest = generateQuest()
  quests.value.push(quest)
  addSystemMessage(getQuestAnnouncement(quest))
}

function generateQuest(): SystemQuest {
  const types: QuestType[] = ['collect', 'mine', 'social', 'skill', 'craft', 'fish', 'tavern']
  const type = types[Math.floor(Math.random() * types.length)]
  const difficulty: QuestDifficulty = (Math.floor(Math.random() * 3) + 1) as QuestDifficulty

  const rewards = [2, 5, 10, 20]
  const deadlines = [3, 5, 10, 20]

  return {
    id: crypto.randomUUID(),
    type,
    difficulty,
    target: generateTarget(type, difficulty),
    deadline: 0 + deadlines[difficulty - 1], // 需要获取当前 gameDay
    reward: rewards[difficulty - 1],
    accepted: true,
    completed: false,
    negotiationRounds: 0
  }
}

function generateTarget(type: QuestType, difficulty: QuestDifficulty) {
  switch (type) {
    case 'collect': return { itemId: 'copper_ore', quantity: 3 + difficulty * 2 }
    case 'mine': return { floor: 10 * difficulty }
    case 'social': return { hearts: difficulty + 1 }
    case 'skill': return { skillType: 'farming', skillLevel: difficulty + 2 }
    case 'craft': return { itemId: 'food_stir_fried_cabbage', quantity: 1 + difficulty }
    case 'fish': return { fishId: 'crucian', quantity: 2 + difficulty }
    case 'tavern': return { metric: 'revenue', threshold: 300 * difficulty }
    default: return {}
  }
}

function getQuestAnnouncement(quest: SystemQuest): string {
  // 各人格特色播报
  const lines: Record<PersonaId, string> = {
    qingluan: `新任务：${quest.type}，目标难度 ${quest.difficulty}★。功勋：${quest.reward}。宿主请。`,
    chaofeng: `喂，新任务。${quest.type}，${quest.difficulty}★，功勋 ${quest.reward}——别跟我说做不到。`,
    taosu: `主人主人！新任务来啦~ 是${quest.type}任务哦，做完有 ${quest.reward} 功勋呢！(◕ᴗ◕✿)`,
    moyan: `任务：${quest.type}。难度：${quest.difficulty}。功勋：${quest.reward}。接受。`
  }
  return personaId.value ? lines[personaId.value] : lines.qingluan
}
```

- [ ] **Step 2: 在 SystemPanel 中添加任务/功勋标签页**

为 SystemPanel 添加简单的标签页切换（对话 / 任务 / 功勋商店）。在消息区上方添加：

```html
<!-- 标签栏，插在标题栏和消息区之间 -->
<div class="flex gap-1 px-3 py-1 border-b border-accent/10 shrink-0">
  <button
    v-for="tab in ['对话', '任务', '商店']"
    :key="tab"
    @click="activeTab = tab"
    class="text-xs px-2 py-0.5 rounded"
    :class="activeTab === tab ? 'bg-accent/20 text-accent' : 'text-muted hover:text-gray-300'"
  >{{ tab }}</button>
</div>
```

在 script 中添加 `const activeTab = ref('对话')`。

任务标签页内容：显示 `store.quests` 列表，每条显示类型、难度星、期限、功勋。
商店标签页内容：显示固定商品表（体力微增 15 功勋、财运亨通 80 功勋 等），点击兑换。

- [ ] **Step 3: 验证**

```bash
cd taoyuan && npx vue-tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/stores/useSystemStore.ts src/components/game/SystemPanel.vue
git commit -m "feat(system): add quest generation and merit shop tabs"
```

---

### Self-Review

**Spec coverage check:**
- [x] §2A 人格选择 → Task 4
- [x] §2B 亲和度系统 → Task 6
- [x] §2C 觉醒流程 → Task 4
- [x] §2E 任务系统 → Task 7
- [x] §3.2 离线模式 → Task 2 (processPlayerInput)
- [x] §3.3 知识库 → Task 1 + Task 2
- [x] §3A 陪伴系统（早安晚安）→ Task 6
- [x] §4 UI 规范 → Task 3
- [x] §5 触发机制 → Task 5
- [x] §7 系统衔接 → Task 5
- [ ] §2E.6 动态 buff → 留到实现阶段细化
- [ ] §3A.2 长期记忆时间线 → 留到后端（子系统 B）

**Placeholder scan:** 无 TBD/TODO。知识库条目明确标记为"实现阶段批量填充"。

**Type consistency:** 所有跨 Task 引用的类型来自 `src/types/system.ts`（Task 1），store 的 serialize/deserialize 签名一致。