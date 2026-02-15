<template>
  <div
    class="status-bar flex flex-col gap-1"
    :class="
      vertical
        ? 'status-bar-vertical border-r border-accent/30 pr-1.5 py-1.5'
        : 'border-b border-accent/30 pb-2 md:pb-3'
    "
  >
    <!-- 第一块：日期时间天气 + 金币 -->
    <div
      :class="
        vertical
          ? 'status-bar-vertical-block text-xs flex flex-col gap-0.5'
          : 'text-xs md:text-sm flex items-center justify-between'
      "
    >
      <div
        :class="
          vertical
            ? 'flex flex-col gap-0.5'
            : 'flex items-center gap-2 md:gap-3'
        "
      >
        <span class="text-accent font-bold">末日生存</span>
        <span class="text-muted text-xs max-w-full truncate">{{
          playerStore.playerName
        }}</span>
        <span :class="vertical ? '' : 'hidden md:inline'"
          >第{{ gameStore.year }}年</span
        >
        <span
          >{{ SEASON_NAMES[gameStore.season] }} 第{{ gameStore.day }}天</span
        >
        <span
          :class="
            vertical ? 'text-muted text-xs' : 'text-muted hidden md:inline'
          "
          >({{ gameStore.weekdayName }})</span
        >
        <span :class="{ 'text-danger': gameStore.isLateNight }">{{
          gameStore.timeDisplay
        }}</span>
        <span class="text-muted">{{ WEATHER_NAMES[gameStore.weather] }}</span>
      </div>
      <span class="text-accent shrink-0">
        <Coins :size="12" class="inline" />
        {{ playerStore.money }}文
      </span>
    </div>

    <!-- 第二块：状态条 -->
    <div
      class="text-xs"
      :class="
        vertical
          ? 'flex flex-col gap-1'
          : 'flex items-center justify-between flex-wrap gap-y-1'
      "
    >
      <div
        :class="
          vertical
            ? 'flex flex-col gap-1.5'
            : 'flex items-center gap-2 md:gap-4 flex-wrap gap-y-1'
        "
      >
        <!-- 体力 -->
        <div class="flex items-center gap-1">
          <span
            :class="{ 'text-danger stamina-critical': playerStore.isExhausted }"
          >
            <Zap :size="12" class="inline" />
            {{ playerStore.stamina }}/{{ playerStore.maxStamina }}
          </span>
          <div
            class="h-2 bg-bg rounded-xs border border-accent/20 flex-1 min-w-0"
            :class="vertical ? 'w-full' : 'w-14 md:w-20'"
          >
            <div
              class="h-full rounded-xs transition-all duration-300"
              :class="staminaBarColor"
              :style="{ width: playerStore.staminaPercent + '%' }"
            />
          </div>
        </div>
        <!-- HP（矿洞或受伤时显示） -->
        <div v-if="showHpBar" class="flex items-center gap-1">
          <span
            :class="{
              'text-danger stamina-critical': playerStore.getIsLowHp(),
            }"
          >
            <Heart :size="12" class="inline" />
            {{ playerStore.hp }}/{{ playerStore.getMaxHp() }}
          </span>
          <div
            class="h-2 bg-bg rounded-xs border border-accent/20 flex-1 min-w-0"
            :class="vertical ? 'w-full' : 'w-12 md:w-16'"
          >
            <div
              class="h-full rounded-xs transition-all duration-300"
              :class="hpBarColor"
              :style="{ width: playerStore.getHpPercent() + '%' }"
            />
          </div>
        </div>
        <!-- 剩余时间 -->
        <div class="flex items-center gap-1">
          <Clock :size="12" class="inline" />
          <div
            class="h-2 bg-bg rounded-xs border border-accent/20 flex-1 min-w-0"
            :class="vertical ? 'w-full' : 'w-12 md:w-16'"
          >
            <div
              class="h-full rounded-xs transition-all duration-300"
              :class="timeBarColor"
              :style="{ width: timePercent + '%' }"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import {
  useGameStore,
  usePlayerStore,
  SEASON_NAMES,
  WEATHER_NAMES,
} from "@/stores";
import { DAY_START_HOUR, DAY_END_HOUR } from "@/data/timeConstants";
import { Zap, Heart, Clock, Coins } from "lucide-vue-next";

defineProps<{ vertical?: boolean }>();

const gameStore = useGameStore();
const playerStore = usePlayerStore();

const staminaBarColor = computed(() => {
  const pct = playerStore.staminaPercent;
  if (pct <= 12) return "bg-danger stamina-critical";
  if (pct <= 35) return "bg-danger";
  if (pct <= 60) return "bg-accent";
  return "bg-success";
});

/** HP 条是否显示：战斗中或HP不满 */
const showHpBar = computed(() => {
  return playerStore.hp < playerStore.getMaxHp();
});

const hpBarColor = computed(() => {
  const pct = playerStore.getHpPercent();
  if (pct <= 25) return "bg-danger stamina-critical";
  if (pct <= 60) return "bg-danger";
  return "bg-success";
});

/** 剩余时间百分比 */
const timePercent = computed(() => {
  const total = DAY_END_HOUR - DAY_START_HOUR; // 20 hours
  const remaining = DAY_END_HOUR - gameStore.hour;
  return Math.max(0, Math.round((remaining / total) * 100));
});

const timeBarColor = computed(() => {
  if (gameStore.isLateNight) return "bg-danger";
  if (timePercent.value <= 25) return "bg-danger";
  if (timePercent.value <= 50) return "bg-accent";
  return "bg-success";
});
</script>

<style scoped>
/* 体力条闪烁 */
@keyframes staminaPulse {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.4;
  }
}

.stamina-critical {
  animation: staminaPulse 1s ease-in-out infinite;
}

.status-bar-vertical {
  min-width: 0;
  font-size: 11px;
}

.status-bar-vertical .status-bar-vertical-block {
  font-size: 11px;
}
</style>
