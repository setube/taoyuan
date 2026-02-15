<template>
  <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" @click.self="emit('close')">
    <div class="game-panel max-w-md w-full flex flex-col">
      <!-- Top: header + description -->
      <div class="flex items-start justify-between gap-2 mb-3">
        <div class="flex items-center gap-2 min-w-0">
          <component :is="icon" :size="20" class="text-accent shrink-0" />
          <h2 class="text-accent text-sm font-medium truncate">{{ name }}</h2>
        </div>
        <button @click="emit('close')" class="text-muted hover:text-accent transition-colors shrink-0" aria-label="关闭">
          <X :size="16" />
        </button>
      </div>
      <p class="text-xs text-muted leading-relaxed mb-4">
        {{ description }}
      </p>

      <!-- Bottom of modal: actions as buttons -->
      <div class="flex flex-wrap gap-2 mt-auto pt-3 border-t border-muted/30">
        <button
          v-for="action in primaryActions"
          :key="action.id"
          class="btn text-xs"
          :disabled="action.disabled"
          @click="handleAction(action)"
        >
          {{ action.label }}
          <span v-if="action.badge" class="ml-1 text-[10px] text-muted">{{ action.badge }}</span>
        </button>
        <button
          v-for="action in (generalActions ?? [])"
          :key="action.id"
          class="btn text-xs opacity-80 hover:opacity-100"
          :disabled="action.disabled"
          @click="handleAction(action)"
        >
          {{ action.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { X } from 'lucide-vue-next'
  import type { Component } from 'vue'

  export interface RoomAction {
    id: string
    label: string
    badge?: string
    disabled?: boolean
    handler: () => void
  }

  const props = defineProps<{
    name: string
    icon: Component
    description: string
    primaryActions: RoomAction[]
    generalActions?: RoomAction[]
  }>()

  const emit = defineEmits<{
    close: []
  }>()

  const handleAction = (action: RoomAction) => {
    action.handler()
    // Auto-close modal after action (can be customized)
    emit('close')
  }
</script>
