<script setup lang="ts">
import { ref } from 'vue'
import type { PersonaId } from '@/types/system'
import { useSystemStore } from '@/stores/useSystemStore'
import { useGameStore } from '@/stores/useGameStore'

const emit = defineEmits<{ chosen: [] }>()
const store = useSystemStore()
const selected = ref<PersonaId | null>(null)

// 两阶段：先梦中觉醒叙述，再人格选择
const phase = ref<'dream' | 'select'>('dream')
const dreamStep = ref(0)

const dreamLines = [
  '黑暗中，你感到意识在漂浮……',
  '像是沉在深水里，又像是悬在半空中。',
  '一个不属于这个时代的声音，从很远很远的地方传来。',
  '',
  '你揉了揉眼睛，正要下床——',
  '',
  '脑海中忽然响起一个清晰的声音：',
  '',
  '「叮——检测到宿主意识波动。」',
  '「系统初始化……完成。」',
  '',
  '那个声音顿了顿，似乎在斟酌措辞……',
  '',
  '「你好。欢迎来到桃源谷。」',
  '「你已觉醒系统。」',
  '',
  '「请选择你的系统伙伴。」',
  '「注意——一旦选择，不可更改。」',
]

const allDreamLinesShown = ref(false)

function advanceDream() {
  if (dreamStep.value < dreamLines.length - 1) {
    dreamStep.value++
  } else {
    allDreamLinesShown.value = true
  }
}

function showAllDreamLines() {
  dreamStep.value = dreamLines.length - 1
  allDreamLinesShown.value = true
}

function goToSelect() {
  phase.value = 'select'
}

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

function selectPersona(id: PersonaId) {
  selected.value = id
}

function confirm() {
  if (!selected.value) return
  const gameStore = useGameStore()
  store.awaken(selected.value, gameStore.day)
  emit('chosen')
}
</script>

<template>
  <div class="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">

    <!-- 第一阶段：梦中觉醒叙述 -->
    <div v-if="phase === 'dream'" class="game-panel max-w-lg w-full max-h-[80vh] overflow-y-auto">
      <h2 class="text-accent text-sm font-bold text-center mb-4">脑海中响起一个声音</h2>

      <div class="space-y-3 mb-6 min-h-[200px]">
        <p
          v-for="(line, i) in dreamLines.slice(0, dreamStep + 1)"
          :key="i"
          class="text-sm leading-relaxed transition-all duration-500"
          :class="{
            'text-accent/90': line.startsWith('「'),
            'text-gray-300': !line.startsWith('「') && line !== '',
            'text-muted text-xs italic': i > 0 && dreamLines[i-1] === '' && line !== '',
            'h-4': line === ''
          }"
        >
          {{ line || '\u00A0' }}
        </p>
      </div>

      <div class="flex justify-center gap-2">
        <button
          v-if="!allDreamLinesShown"
          class="px-6 py-2 text-sm border border-accent/30 rounded hover:bg-accent/10 text-accent"
          @click="advanceDream"
        >
          继续
        </button>
        <button
          v-if="!allDreamLinesShown && dreamStep > 3"
          class="px-3 py-2 text-xs text-muted hover:text-gray-400"
          @click="showAllDreamLines"
        >
          跳过
        </button>
        <button
          v-if="allDreamLinesShown"
          class="px-6 py-2 text-sm border border-accent/40 rounded hover:bg-accent/10 text-accent"
          @click="goToSelect"
        >
          进入选择
        </button>
      </div>
    </div>

    <!-- 第二阶段：人格选择 -->
    <div v-else class="game-panel w-full max-w-lg">
      <h2 class="text-accent text-sm font-bold text-center mb-2">选择你的系统伙伴</h2>
      <p class="text-muted text-xs text-center mb-4">选择后不可更改，请仔细考虑</p>

      <div class="grid grid-cols-2 gap-2 mb-4">
        <div
          v-for="p in personas"
          :key="p.id"
          @click="selectPersona(p.id)"
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
        type="button"
        @click="confirm"
        :disabled="!selected"
        class="w-full py-2 text-sm border border-accent/40 rounded
               hover:bg-accent/10 disabled:opacity-30 disabled:cursor-not-allowed
               text-accent"
      >
        确认选择
      </button>
    </div>

  </div>
</template>