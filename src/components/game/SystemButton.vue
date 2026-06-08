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
  bottom: calc(env(safe-area-inset-bottom, 12px) + 12px + 48px * 4);
}
.system-float-btn:hover {
  border-color: rgba(var(--color-accent), 0.7);
}
</style>