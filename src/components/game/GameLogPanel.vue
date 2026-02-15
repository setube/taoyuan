<template>
  <div ref="scrollRef" class="game-log-panel">
    <div v-for="entry in logEntries" :key="entry.id" class="game-log-line">
      <span class="game-log-meta">
        <span v-if="entry.speaker" class="game-log-speaker">{{
          entry.speaker
        }}</span>
        <span class="game-log-time">{{
          formatTime(entry.time || new Date())
        }}</span>
      </span>
      <span class="game-log-msg whitespace-pre-line">{{ entry.text }}</span>
    </div>
    <div
      v-if="logEntries.length === 0"
      class="game-log-empty text-muted text-xs"
    >
      暂无消息
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from "vue";
import { useGameLog } from "@/composables/useGameLog";

const { logEntries } = useGameLog();
const scrollRef = ref<HTMLElement | null>(null);

/** Real-world time display (locale time string). */
function formatTime(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

watch(
  () => logEntries.value.length,
  () => {
    nextTick(() => {
      if (scrollRef.value) {
        scrollRef.value.scrollTop = scrollRef.value.scrollHeight;
      }
    });
  },
);
</script>

<style scoped>
.game-log-panel {
  height: 132px;
  max-height: 22vh;
  overflow-y: auto;
  overflow-x: hidden;
  background: var(--color-bg);
  border: 1px solid oklch(from var(--color-accent) l c h / 0.2);
  border-radius: 2px;
  padding: 6px 8px;
  font-size: 12px;
  color: var(--color-text);
}

.game-log-line {
  line-height: 1.4;
  word-break: break-word;
  padding: 4px 0;
  border-bottom: 1px solid oklch(from var(--color-accent) l c h / 0.08);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.game-log-line:last-child {
  border-bottom: none;
}

.game-log-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 10px;
  color: var(--color-muted);
}

.game-log-speaker {
  font-weight: 600;
  color: var(--color-accent);
}

.game-log-time {
  flex-shrink: 0;
}

.game-log-msg {
  padding-left: 0;
}

.game-log-empty {
  padding: 8px 0;
  text-align: center;
}
</style>
