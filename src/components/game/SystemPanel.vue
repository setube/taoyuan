<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import { X, ArrowUp, Maximize2, Minimize2 } from 'lucide-vue-next'
import { useSystemStore } from '@/stores/useSystemStore'

const store = useSystemStore()
const inputEl = ref<HTMLInputElement | null>()
const activeTab = ref<'chat' | 'quests' | 'shop'>('chat')

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

watch(() => store.panelOpen, async (open) => {
  if (open) {
    await nextTick()
    inputEl.value?.focus()
  }
})

const meritShopItems = [
  { id: 'stamina_small', name: '体力微增', desc: '体力上限 +5（永久）', cost: 15, category: 'stat' as const },
  { id: 'stamina_medium', name: '体力增进', desc: '体力上限 +10（永久）', cost: 30, category: 'stat' as const },
  { id: 'clever_hands', name: '巧手', desc: '农耕/采集体力消耗 −5%（永久）', cost: 20, category: 'stat' as const },
  { id: 'keen_eye', name: '慧眼', desc: '钓鱼上钩率 +8%（永久）', cost: 20, category: 'stat' as const },
  { id: 'iron_bone', name: '铁骨', desc: '矿洞受伤减免 10%（永久）', cost: 25, category: 'stat' as const },
  { id: 'fortune', name: '财运亨通', desc: '出售价格 +5%（永久）', cost: 80, category: 'buff' as const },
  { id: 'fortune_extreme', name: '财运亨通·极', desc: '出售价格 +10%（永久）', cost: 180, category: 'buff' as const },
  { id: 'harvest', name: '丰穰之力', desc: '作物收获量 +10%（永久）', cost: 60, category: 'buff' as const },
  { id: 'livestock', name: '畜牧之心', desc: '动物产出频率 +15%（永久）', cost: 50, category: 'buff' as const },
]
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
          ? 'w-full h-full max-w-none max-h-none bg-[#1a1a1a]'
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
            :class="activeTab === tab[0] ? 'bg-accent/20 text-accent' : 'text-muted hover:text-gray-300'"
          >{{ tab[1] }}</button>
        </div>

        <!-- 对话标签页 -->
        <template v-if="activeTab === 'chat'">
          <div class="flex-1 overflow-y-auto px-3 py-2 space-y-2 text-xs min-h-0">
            <div v-if="store.messages.length === 0" class="text-muted text-center py-8">
              系统伙伴已就绪。输入关键词查询游戏知识，或连接后端解锁完整对话。
            </div>
            <div
              v-for="msg in store.messages"
              :key="msg.id"
              :class="msg.role === 'system' ? 'text-accent/90' : 'text-gray-300 text-right'"
            >
              <span v-if="msg.role === 'system'" class="font-bold mr-1">{{ store.displayName }}：</span>
              {{ msg.content }}
            </div>
            <div v-if="store.mode === 'offline'" class="text-[10px] text-muted text-center pt-2">
              灵识托管中 — 仅知识库可用
            </div>
          </div>

          <div class="flex items-center gap-2 px-3 py-2 border-t border-accent/20 shrink-0">
            <input
              ref="inputEl"
              v-model="store.inputText"
              @keydown="handleKeydown"
              placeholder="输入关键词查询游戏知识…"
              class="flex-1 bg-transparent border border-accent/20 rounded px-2 py-1 text-xs text-gray-200 placeholder:text-muted focus:outline-none focus:border-accent/50"
            />
            <button @click="sendMessage" class="p-1 hover:text-accent shrink-0">
              <ArrowUp :size="16" />
            </button>
          </div>
        </template>

        <!-- 任务标签页 -->
        <div v-if="activeTab === 'quests'" class="flex-1 overflow-y-auto px-3 py-2 space-y-2 text-xs min-h-0">
          <div v-if="store.quests.length === 0" class="text-muted text-center py-8">
            暂无任务。系统将在后续游戏日中派发任务。
          </div>
          <div
            v-for="q in store.quests"
            :key="q.id"
            class="border border-accent/10 rounded p-2"
            :class="q.completed ? 'opacity-50' : ''"
          >
            <div class="flex justify-between items-center">
              <span class="font-bold text-accent">{{ q.type }}</span>
              <span class="text-[10px] text-muted">
                {{ '★'.repeat(q.difficulty) }} · {{ q.completed ? '已完成' : `期限 ${q.deadline}日` }}
              </span>
            </div>
            <div class="text-gray-400 mt-1">功勋：{{ q.reward }}</div>
            <button
              v-if="!q.completed"
              @click="store.completeQuest(q.id)"
              class="mt-1 text-[10px] text-accent hover:underline"
            >标记完成（调试用）</button>
          </div>
          <div class="text-[10px] text-muted text-center pt-1">
            功勋余额：{{ store.merit }}
          </div>
        </div>

        <!-- 商店标签页 -->
        <div v-if="activeTab === 'shop'" class="flex-1 overflow-y-auto px-3 py-2 space-y-2 text-xs min-h-0">
          <div class="text-accent font-bold text-xs mb-1">属性提升</div>
          <div v-for="item in meritShopItems.filter(i => i.category === 'stat')" :key="item.id"
            class="flex justify-between items-center border border-accent/10 rounded p-1.5">
            <div>
              <div class="text-gray-200">{{ item.name }}</div>
              <div class="text-[10px] text-muted">{{ item.desc }}</div>
            </div>
            <button class="text-[10px] px-2 py-0.5 border border-accent/30 rounded hover:bg-accent/10 text-accent shrink-0 ml-2"
              :disabled="store.merit < item.cost">
              {{ item.cost }} 功勋
            </button>
          </div>
          <div class="text-accent font-bold text-xs mb-1 mt-3">金手指</div>
          <div v-for="item in meritShopItems.filter(i => i.category === 'buff')" :key="item.id"
            class="flex justify-between items-center border border-accent/10 rounded p-1.5">
            <div>
              <div class="text-gray-200">{{ item.name }}</div>
              <div class="text-[10px] text-muted">{{ item.desc }}</div>
            </div>
            <button class="text-[10px] px-2 py-0.5 border border-accent/30 rounded hover:bg-accent/10 text-accent shrink-0 ml-2"
              :disabled="store.merit < item.cost">
              {{ item.cost }} 功勋
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>