<template>
  <div class="border-b border-accent/30 pb-2 md:pb-3 flex flex-col space-y-1">
    <!-- 第一行：日期时间天气 + 铜钱 -->
    <div class="flex items-center justify-between text-xs md:text-sm">
      <div class="flex items-center space-x-2 md:space-x-3">
        <span class="text-accent font-bold">桃源乡</span>
        <span class="text-muted text-xs max-w-16 truncate">{{ playerStore.playerName }}</span>
        <span class="hidden md:inline">第{{ gameStore.year }}年</span>
        <span>{{ SEASON_NAMES[gameStore.season] }} 第{{ gameStore.day }}天</span>
        <span class="text-muted hidden md:inline">({{ gameStore.weekdayName }})</span>
        <span :class="{ 'text-danger': gameStore.isLateNight }">{{ gameStore.timeDisplay }}</span>
        <span class="text-muted">{{ WEATHER_NAMES[gameStore.weather] }}</span>
        <!-- 系统灵识 / 云备（觉醒后显示） -->
        <span
          v-if="systemStore.awakened"
          class="hidden sm:flex items-center gap-1.5 border-l border-accent/20 pl-2 ml-0.5"
        >
          <template v-if="systemStore.mode === 'online'">
            <button
              type="button"
              class="text-[10px] text-green-400 flex items-center gap-0.5 hover:text-green-300 transition-colors"
              title="点击断开灵识连接"
              @click="systemStore.disconnect()"
            >
              <Wifi :size="10" />
              灵识在线
            </button>
            <button
              type="button"
              class="text-[10px] px-1 py-0.5 rounded border transition-colors flex items-center gap-0.5"
              :class="systemStore.cloudBackupEnabled
                ? 'border-green-500/40 bg-green-500/10 text-green-400'
                : 'border-accent/20 text-muted hover:text-gray-300'"
              :title="systemStore.cloudBackupEnabled ? '云备份已开启，点击关闭' : '点击开启云备份'"
              @click="systemStore.cloudBackupEnabled = !systemStore.cloudBackupEnabled"
            >
              <Cloud :size="10" />
              云备
            </button>
          </template>
          <template v-else>
            <span class="text-[10px] text-muted flex items-center gap-0.5">
              <WifiOff :size="10" />
              灵识托管
            </span>
            <button
              type="button"
              class="text-[10px] px-1 py-0.5 border border-accent/30 rounded hover:bg-accent/10 text-accent disabled:opacity-50 flex items-center gap-0.5"
              :disabled="systemStore.isConnecting"
              @click="systemStore.tryConnect()"
            >
              <Loader2 v-if="systemStore.isConnecting" :size="10" class="animate-spin" />
              <Wifi v-else :size="10" />
              {{ systemStore.isConnecting ? '连接中' : '呼叫' }}
            </button>
          </template>
        </span>
        <!-- 移动端：紧凑灵识状态 -->
        <span v-if="systemStore.awakened" class="sm:hidden flex items-center gap-1">
          <button
            v-if="systemStore.mode === 'online'"
            type="button"
            class="text-[10px] text-green-400 flex items-center gap-0.5"
            @click="systemStore.disconnect()"
          >
            <Wifi :size="10" />
          </button>
          <button
            v-else
            type="button"
            class="text-[10px] text-muted"
            :disabled="systemStore.isConnecting"
            @click="systemStore.tryConnect()"
          >
            <WifiOff :size="10" />
          </button>
          <button
            v-if="systemStore.mode === 'online'"
            type="button"
            class="text-[10px] px-1 rounded border"
            :class="systemStore.cloudBackupEnabled ? 'border-green-500/40 text-green-400' : 'border-accent/20 text-muted'"
            @click="systemStore.cloudBackupEnabled = !systemStore.cloudBackupEnabled"
          >
            <Cloud :size="10" />
          </button>
        </span>
      </div>
      <span class="text-accent shrink-0">
        <Coins :size="12" class="inline" />
        {{ playerStore.money }}文
      </span>
    </div>

    <!-- 第二行：状态条 + 音频控制 -->
    <div class="flex items-center justify-between text-xs flex-wrap">
      <div class="flex items-center space-x-2 md:space-x-4 flex-wrap">
        <!-- 体力 -->
        <div class="flex items-center space-x-1">
          <span :class="{ 'text-danger stamina-critical': playerStore.isExhausted }">
            <Zap :size="12" class="inline" />
            {{ playerStore.stamina }}/{{ playerStore.maxStamina }}
          </span>
          <div class="w-14 md:w-20 h-2 bg-bg rounded-xs border border-accent/20">
            <div
              class="h-full rounded-xs transition-all duration-300"
              :class="staminaBarColor"
              :style="{ width: playerStore.staminaPercent + '%' }"
            />
          </div>
        </div>
        <!-- HP（矿洞或受伤时显示） -->
        <div v-if="showHpBar" class="flex items-center space-x-1">
          <span :class="{ 'text-danger stamina-critical': playerStore.getIsLowHp() }">
            <Heart :size="12" class="inline" />
            {{ playerStore.hp }}/{{ playerStore.getMaxHp() }}
          </span>
          <div class="w-12 md:w-16 h-2 bg-bg rounded-xs border border-accent/20">
            <div
              class="h-full rounded-xs transition-all duration-300"
              :class="hpBarColor"
              :style="{ width: playerStore.getHpPercent() + '%' }"
            />
          </div>
        </div>
        <!-- 剩余时间 -->
        <div class="flex items-center space-x-1">
          <Clock :size="12" class="tinline" />
          <div class="w-12 md:w-16 h-2 bg-bg rounded-xs border border-accent/20">
            <div class="h-full rounded-xs transition-all duration-300" :class="timeBarColor" :style="{ width: timePercent + '%' }" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { useGameStore, SEASON_NAMES, WEATHER_NAMES } from '@/stores/useGameStore'
  import { usePlayerStore } from '@/stores/usePlayerStore'
  import { useSystemStore } from '@/stores/useSystemStore'
  import { DAY_START_HOUR, DAY_END_HOUR } from '@/data/timeConstants'
  import { Zap, Heart, Clock, Coins, Wifi, WifiOff, Loader2, Cloud } from 'lucide-vue-next'

  const gameStore = useGameStore()
  const playerStore = usePlayerStore()
  const systemStore = useSystemStore()

  const staminaBarColor = computed(() => {
    const pct = playerStore.staminaPercent
    if (pct <= 12) return 'bg-danger stamina-critical'
    if (pct <= 35) return 'bg-danger'
    if (pct <= 60) return 'bg-accent'
    return 'bg-success'
  })

  /** HP 条是否显示：在矿洞中或HP不满 */
  const showHpBar = computed(() => {
    return gameStore.currentLocationGroup === 'mine' || playerStore.hp < playerStore.getMaxHp()
  })

  const hpBarColor = computed(() => {
    const pct = playerStore.getHpPercent()
    if (pct <= 25) return 'bg-danger stamina-critical'
    if (pct <= 60) return 'bg-danger'
    return 'bg-success'
  })

  /** 剩余时间百分比 */
  const timePercent = computed(() => {
    const total = DAY_END_HOUR - DAY_START_HOUR // 20 hours
    const remaining = DAY_END_HOUR - gameStore.hour
    return Math.max(0, Math.round((remaining / total) * 100))
  })

  const timeBarColor = computed(() => {
    if (gameStore.isLateNight) return 'bg-danger'
    if (timePercent.value <= 25) return 'bg-danger'
    if (timePercent.value <= 50) return 'bg-accent'
    return 'bg-success'
  })
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
