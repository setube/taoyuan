<template>
  <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" @click.self="emit('close')">
    <div class="game-panel max-w-md w-full">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
          <component :is="icon" :size="20" class="text-accent" />
          <h2 class="text-accent text-sm font-medium">{{ name }}</h2>
        </div>
        <button @click="emit('close')" class="text-muted hover:text-accent transition-colors">
          <X :size="16" />
        </button>
      </div>

      <!-- Description / Flavor Text -->
      <p class="text-xs text-muted leading-relaxed mb-4">
        {{ description }}
      </p>

      <!-- Primary Actions -->
      <div v-if="primaryActions.length > 0" class="space-y-2 mb-4">
        <h3 class="text-accent text-[10px] uppercase tracking-wide mb-2">主要操作</h3>
        <button
          v-for="action in primaryActions"
          :key="action.id"
          class="btn w-full text-xs justify-start"
          :disabled="action.disabled"
          @click="handleAction(action)"
        >
          {{ action.label }}
          <span v-if="action.badge" class="ml-auto text-[10px] text-muted">{{ action.badge }}</span>
        </button>
      </div>

      <!-- General Actions -->
      <div v-if="generalActions && generalActions.length > 0" class="space-y-1">
        <h3 class="text-muted text-[10px] uppercase tracking-wide mb-2">通用操作</h3>
        <button
          v-for="action in generalActions"
          :key="action.id"
          class="btn w-full text-xs justify-start opacity-75 hover:opacity-100"
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
