import { onUnmounted, ref } from 'vue'
import type { Weather } from '@/types'
import { FORGE_WEATHER_MINIGAME } from '@/data/forgeWeather'
import { gradeRhythmOffset, type RhythmGrade } from '@/composables/useRhythmMinigame'

export interface ForgeQuenchStepOptions {
  coolSpeed?: number
  zoneHalfWidth?: number
  targetRange?: { min: number; max: number }
  tickMs?: number
}

/** 过短松手视为误触，继续淬火 */
export const MIN_QUENCH_HOLD_MS = 280

export const buildForgeQuenchOptions = (
  weather: Weather,
  zoneWidthMult = 1
): ForgeQuenchStepOptions => {
  const mods = FORGE_WEATHER_MINIGAME[weather]
  let coolSpeed = 1.0
  if (mods?.allStepsSpeedMult) coolSpeed *= mods.allStepsSpeedMult
  if (mods?.stepSpeedMult?.quench) coolSpeed *= mods.stepSpeedMult.quench!

  let zoneHalfWidth = 12 * zoneWidthMult
  if (mods?.stepZoneWidthMult?.quench) zoneHalfWidth *= mods.stepZoneWidthMult.quench!

  return { coolSpeed, zoneHalfWidth }
}

/** 第三步淬火：按住降温，适温区松手（与起炉反向） */
export function useForgeQuenchStep(options: ForgeQuenchStepOptions = {}) {
  const {
    coolSpeed = 1.0,
    zoneHalfWidth: initialZoneHalf = 12,
    targetRange = { min: 22, max: 58 },
    tickMs = 50
  } = options

  const tempPct = ref(100)
  const targetPosition = ref(40)
  const targetZoneHalfWidth = ref(initialZoneHalf)
  const isHolding = ref(false)
  const isActive = ref(false)

  let coolTimer: ReturnType<typeof setInterval> | null = null
  let activeZoneHalf = initialZoneHalf
  let activeCoolSpeed = coolSpeed
  let holdStartedAt = 0

  const rollTarget = () => {
    const span = targetRange.max - targetRange.min
    targetPosition.value = targetRange.min + Math.random() * span
  }

  const stopCooling = () => {
    if (coolTimer) clearInterval(coolTimer)
    coolTimer = null
  }

  const start = (override?: ForgeQuenchStepOptions) => {
    stopCooling()
    activeCoolSpeed = override?.coolSpeed ?? coolSpeed
    activeZoneHalf = override?.zoneHalfWidth ?? initialZoneHalf
    tempPct.value = 100
    isHolding.value = false
    isActive.value = true
    holdStartedAt = 0
    targetZoneHalfWidth.value = activeZoneHalf
    rollTarget()
  }

  const beginHold = (): boolean => {
    if (!isActive.value || tempPct.value <= 0 || isHolding.value) return false
    isHolding.value = true
    holdStartedAt = Date.now()
    stopCooling()
    coolTimer = setInterval(() => {
      tempPct.value = Math.max(0, tempPct.value - activeCoolSpeed)
      if (tempPct.value <= 0) {
        isHolding.value = false
        stopCooling()
      }
    }, tickMs)
    return true
  }

  const release = (): { grade: RhythmGrade; score: number; offset: number } | null => {
    if (!isActive.value) return null
    if (!isHolding.value && tempPct.value >= 100) return null

    if (
      isHolding.value &&
      holdStartedAt > 0 &&
      Date.now() - holdStartedAt < MIN_QUENCH_HOLD_MS
    ) {
      return null
    }

    const wasHolding = isHolding.value
    isHolding.value = false
    holdStartedAt = 0
    stopCooling()

    if (!wasHolding && tempPct.value >= 100) return null

    isActive.value = false
    const offset = Math.abs(tempPct.value - targetPosition.value)
    const { grade, score } = gradeRhythmOffset(offset)
    return { grade, score, offset }
  }

  /** 温度归零仍未松手：按当前温度判分 */
  const forceFinish = (): { grade: RhythmGrade; score: number; offset: number } => {
    isHolding.value = false
    stopCooling()
    isActive.value = false
    const offset = Math.abs(tempPct.value - targetPosition.value)
    return { ...gradeRhythmOffset(offset), offset }
  }

  const reset = () => {
    stopCooling()
    tempPct.value = 100
    isHolding.value = false
    isActive.value = false
    holdStartedAt = 0
  }

  onUnmounted(reset)

  return {
    tempPct,
    targetPosition,
    targetZoneHalfWidth,
    isHolding,
    isActive,
    start,
    beginHold,
    release,
    forceFinish,
    reset
  }
}
