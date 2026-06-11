<script setup lang="ts">
import { computed } from 'vue'
import { MessageCircle } from 'lucide-vue-next'
import { useSystemStore } from '@/stores/useSystemStore'
import { truncateBubbleText, formatMessageTime, formatGameDayLabel, hasMessageTime } from '@/composables/useSystemChatGroups'

const store = useSystemStore()

const preview = computed(() =>
  store.bubblePayload ? truncateBubbleText(store.bubblePayload.content, 56) : ''
)

const bubbleTime = computed(() => {
  const p = store.bubblePayload
  if (!p) return ''
  if (hasMessageTime(p)) return formatMessageTime(p)
  if (p.gameDay > 0) return formatGameDayLabel(p.gameDay)
  return ''
})

function openChat() {
  store.openPanel('chat')
  store.dismissBubble()
}
</script>

<template>
  <Transition name="bubble-pop">
    <button
      v-if="store.bubbleVisible && store.bubblePayload"
      type="button"
      class="system-bubble"
      :title="store.bubblePayload.content"
      @click="openChat"
    >
      <div class="system-bubble__header">
        <MessageCircle :size="14" class="text-accent shrink-0" />
        <span class="system-bubble__name">{{ store.displayName }}</span>
        <span v-if="bubbleTime" class="system-bubble__time">{{ bubbleTime }}</span>
        <span class="system-bubble__tag">碎碎念</span>
      </div>
      <p class="system-bubble__text">{{ preview }}</p>
      <span class="system-bubble__hint">点击查看</span>
    </button>
  </Transition>
</template>

<style scoped>
.system-bubble {
  position: fixed;
  right: 12px;
  z-index: 45;
  max-width: min(300px, calc(100vw - 24px));
  padding: 12px 14px;
  text-align: left;
  border-radius: 8px;
  background: rgb(var(--color-panel));
  border: 2px solid rgba(var(--color-accent), 0.55);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  cursor: pointer;
  bottom: calc(env(safe-area-inset-bottom, 12px) + 12px + 48px * 4 + 52px);
  animation: bubble-float 3s ease-in-out infinite;
}

.system-bubble:hover {
  border-color: var(--color-accent);
}

.system-bubble__header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}

.system-bubble__name {
  font-size: 13px;
  font-weight: bold;
  color: var(--color-accent);
}

.system-bubble__time {
  font-size: 11px;
  color: var(--color-muted);
}

.system-bubble__tag {
  margin-left: auto;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 3px;
  background: color-mix(in srgb, var(--color-accent) 15%, transparent);
  color: var(--color-accent);
}

.system-bubble__text {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: rgb(var(--color-text));
}

.system-bubble__hint {
  display: block;
  margin-top: 6px;
  font-size: 11px;
  color: var(--color-muted);
}

.bubble-pop-enter-active,
.bubble-pop-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.bubble-pop-enter-from,
.bubble-pop-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.96);
}

@keyframes bubble-float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px);
  }
}
</style>
