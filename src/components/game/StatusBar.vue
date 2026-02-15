<template>
  <div class="border-b border-accent/30 pb-2 md:pb-3 flex flex-col gap-1">
    <!-- 第一行：日期时间天气 + 金币 -->
    <div class="flex items-center justify-between text-xs md:text-sm">
      <div class="flex items-center gap-2 md:gap-3">
        <span class="text-accent font-bold">末日生存</span>
        <span class="text-muted text-xs max-w-16 truncate">{{
          playerStore.playerName
        }}</span>
        <span class="hidden md:inline">第{{ gameStore.year }}年</span>
        <span
          >{{ SEASON_NAMES[gameStore.season] }} 第{{ gameStore.day }}天</span
        >
        <span class="text-muted hidden md:inline"
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

    <!-- 第二行：状态条 + 音频控制 -->
    <div class="flex items-center justify-between text-xs flex-wrap gap-y-1">
      <div class="flex items-center gap-2 md:gap-4 flex-wrap gap-y-1">
        <!-- 体力 -->
        <div class="flex items-center gap-1">
          <span
            :class="{ 'text-danger stamina-critical': playerStore.isExhausted }"
          >
            <Zap :size="12" class="inline" />
            {{ playerStore.stamina }}/{{ playerStore.maxStamina }}
          </span>
          <div
            class="w-14 md:w-20 h-2 bg-bg rounded-xs border border-accent/20"
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
            class="w-12 md:w-16 h-2 bg-bg rounded-xs border border-accent/20"
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
          <Clock :size="12" class="tinline" />
          <div
            class="w-12 md:w-16 h-2 bg-bg rounded-xs border border-accent/20"
          >
            <div
              class="h-full rounded-xs transition-all duration-300"
              :class="timeBarColor"
              :style="{ width: timePercent + '%' }"
            />
          </div>
        </div>
      </div>
      <!-- 操作按钮 -->
      <div class="flex items-center gap-1 shrink-0">
        <button
          class="hidden! btn text-xs py-0 px-2 min-h-0 md:flex!"
          @click="showMobileMap = true"
        >
          <Map :size="12" />
          地图
        </button>
        <button
          class="hidden! btn btn-danger text-xs py-0 px-2 min-h-0 md:flex!"
          @click.stop="handleSleep"
        >
          <Moon :size="12" />
          {{ sleepLabel }}
        </button>
        <button
          class="hidden! btn btn-danger text-xs py-0 px-2 min-h-0 md:flex!"
          @click="showSettings = true"
        >
          <SettingsIcon :size="14" />
          <span class="hidden md:flex">设置</span>
        </button>
      </div>
    </div>
    <MobileMapMenu
      :open="showMobileMap"
      :current="currentPanel"
      @close="showMobileMap = false"
    />
    <SettingsDialog :open="showSettings" @close="showSettings = false" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import {
  useGameStore,
  usePlayerStore,
  SEASON_NAMES,
  WEATHER_NAMES,
} from "@/stores";
import MobileMapMenu from "@/components/game/MobileMapMenu.vue";
import SettingsDialog from "@/components/game/SettingsDialog.vue";
import { DAY_START_HOUR, DAY_END_HOUR } from "@/data/timeConstants";
import {
  Zap,
  Heart,
  Clock,
  Coins,
  Moon,
  Map,
  Settings as SettingsIcon,
} from "lucide-vue-next";

const emit = defineEmits<{ "request-sleep": [] }>();

const route = useRoute();
const gameStore = useGameStore();
const playerStore = usePlayerStore();

/** 地图菜单 */
const showMobileMap = ref(false);

/** 设置弹窗 */
const showSettings = ref(false);

/** 从路由名称获取当前面板标识 */
const currentPanel = computed(() => {
  return (route.name as string) ?? "base";
});

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

const sleepLabel = computed(() => {
  if (gameStore.hour >= 24) return "倒头就睡";
  if (gameStore.hour >= 20) return "回家休息";
  return "休息";
});

const handleSleep = () => {
  emit("request-sleep");
};
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
</style>
