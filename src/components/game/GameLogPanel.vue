<template>
  <div ref="scrollRef" class="game-log-panel" tabindex="0">
    <div
      v-for="entry in logEntries"
      :key="entry.id"
      class="game-log-line"
      :class="{
        'game-log-line-pre-choice': entry.variant === 'narrator-before-choice',
      }"
    >
      <span class="game-log-meta">
        <span class="game-log-speaker">{{
          entry.speaker ?? DEFAULT_SPEAKER
        }}</span>
        <span class="game-log-time">{{
          formatTime(entry.time || new Date())
        }}</span>
      </span>
      <span class="game-log-msg whitespace-pre-line">{{ entry.text }}</span>
    </div>
    <!-- Pending choice line (main character: gold clickable options) -->
    <div v-if="pendingChoice" class="game-log-line game-log-choice">
      <span class="game-log-meta">
        <span class="game-log-speaker">{{ pendingChoice.speaker }}</span>
        <span class="game-log-time">{{ formatTime(choiceTime) }}</span>
      </span>
      <span class="game-log-msg game-log-choices">
        <button
          v-for="(opt, i) in pendingChoice.options"
          :key="i"
          type="button"
          class="game-log-choice-opt"
          @click="resolveChoice(i)"
        >
          {{ i + 1 }}. {{ opt }}
        </button>
        <span class="game-log-choice-hint">按 1 / 2 / 3 选择</span>
      </span>
    </div>
    <div
      v-if="logEntries.length === 0 && !pendingChoice"
      class="game-log-empty text-muted text-xs"
    >
      暂无消息
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted } from "vue";
import { useGameLog, DEFAULT_SPEAKER } from "@/composables/useGameLog";

const { logEntries, pendingChoice, resolveChoice } = useGameLog();
const scrollRef = ref<HTMLElement | null>(null);
const choiceTime = ref(new Date());

/** Real-world time display (locale time string). */
function formatTime(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function scrollToBottom() {
  nextTick(() => {
    if (scrollRef.value) {
      scrollRef.value.scrollTop = scrollRef.value.scrollHeight;
    }
  });
}

watch(
  () => logEntries.value.length,
  () => scrollToBottom(),
);

watch(
  () => !!pendingChoice.value,
  (hasChoice) => {
    if (hasChoice) {
      choiceTime.value = new Date();
      scrollToBottom();
    }
  },
);

function onKeyDown(e: KeyboardEvent) {
  if (!pendingChoice.value) return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const key = e.key;
  if (key === "1") {
    e.preventDefault();
    resolveChoice(0);
  } else if (key === "2") {
    e.preventDefault();
    resolveChoice(1);
  } else if (key === "3") {
    e.preventDefault();
    resolveChoice(2);
  }
}

onMounted(() => {
  window.addEventListener("keydown", onKeyDown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", onKeyDown);
});
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

@media (min-width: 768px) {
  .game-log-panel {
    height: 100%;
    min-height: 0;
    max-height: none;
  }
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

/* Narrator text immediately before a choice (different color) */
.game-log-line-pre-choice .game-log-msg {
  color: var(--color-muted);
  font-style: italic;
}

.game-log-empty {
  padding: 8px 0;
  text-align: center;
}

.game-log-choices {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.5em 1em;
}

.game-log-choice-opt {
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  font-size: 12px;
  color: oklch(0.75 0.15 85);
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.game-log-choice-opt:hover {
  color: oklch(0.85 0.18 85);
}

.game-log-choice-hint {
  font-size: 10px;
  color: var(--color-muted);
}
</style>
