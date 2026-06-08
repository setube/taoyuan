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
  store.awaken(selected.value, 0)
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
               hover:bg-accent/10 disabled:opacity-30 disabled:cursor-not-allowed
               text-accent"
      >
        确认选择
      </button>
    </div>
  </div>
</template>