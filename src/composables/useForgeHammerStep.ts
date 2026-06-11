import { onUnmounted, ref } from 'vue'
import type { RhythmGrade } from '@/composables/useRhythmMinigame'

export const FORGE_HAMMER_DURATION_SEC = 8

/** 落锤次数 → 得分（满分 50，与节奏步一致） */
export const scoreHammerClicks = (clicks: number): { grade: RhythmGrade; score: number } => {
  if (clicks >= 28) return { grade: 'perfect', score: 50 }
  if (clicks >= 22) return { grade: 'good', score: 30 }
  return { grade: 'poor', score: 10 }
}

export interface ForgeHammerStepOptions {
  durationSec?: number
}

/** 锻打步：限时连点（参考龙舟划桨） */
export function useForgeHammerStep(options: ForgeHammerStepOptions = {}) {
  const durationSec = options.durationSec ?? FORGE_HAMMER_DURATION_SEC

  const timeLeft = ref(durationSec)
  const clickCount = ref(0)
  const hammerProgress = ref(0)
  const isRunning = ref(false)
  const striking = ref(false)

  let countdownTimer: ReturnType<typeof setInterval> | null = null
  let strikeTimeout: ReturnType<typeof setTimeout> | null = null

  const stopTimer = () => {
    if (countdownTimer) clearInterval(countdownTimer)
    countdownTimer = null
    isRunning.value = false
  }

  const start = (durationOverride?: number) => {
    stopTimer()
    const d = durationOverride ?? durationSec
    timeLeft.value = d
    clickCount.value = 0
    hammerProgress.value = 0
    isRunning.value = true

    countdownTimer = setInterval(() => {
      timeLeft.value--
      if (timeLeft.value <= 0) stopTimer()
    }, 1000)
  }

  const strike = (): boolean => {
    if (!isRunning.value) return false
    clickCount.value++
    hammerProgress.value = Math.min(100, hammerProgress.value + 2.5)
    striking.value = true
    if (strikeTimeout) clearTimeout(strikeTimeout)
    strikeTimeout = setTimeout(() => {
      striking.value = false
    }, 120)
    return true
  }

  const finish = (): { grade: RhythmGrade; score: number; clicks: number } => {
    stopTimer()
    const { grade, score } = scoreHammerClicks(clickCount.value)
    return { grade, score, clicks: clickCount.value }
  }

  const reset = () => {
    stopTimer()
    timeLeft.value = durationSec
    clickCount.value = 0
    hammerProgress.value = 0
    striking.value = false
  }

  onUnmounted(() => {
    stopTimer()
    if (strikeTimeout) clearTimeout(strikeTimeout)
  })

  return {
    timeLeft,
    clickCount,
    hammerProgress,
    isRunning,
    striking,
    durationSec,
    start,
    strike,
    finish,
    reset
  }
}
