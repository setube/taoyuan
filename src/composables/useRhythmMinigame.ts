import { onUnmounted, ref } from 'vue'
import type { Weather } from '@/types'
import { FORGE_WEATHER_MINIGAME, type ForgeMinigameStep } from '@/data/forgeWeather'

export type RhythmGrade = 'perfect' | 'good' | 'poor'

export interface RhythmStepDef {
  label: string
  shortLabel: string
  hint: string
  action: string
  lowLabel: string
  highLabel: string
  /** 锻造步骤 id（斗茶可省略） */
  forgeStep?: ForgeMinigameStep
}

export const PERFECT_OFFSET = 4
export const GOOD_OFFSET = 12

export const gradeRhythmOffset = (offset: number): { grade: RhythmGrade; score: number } => {
  if (offset <= PERFECT_OFFSET) return { grade: 'perfect', score: 50 }
  if (offset <= GOOD_OFFSET) return { grade: 'good', score: 30 }
  return { grade: 'poor', score: 10 }
}

export interface RhythmStepContext {
  roundIndex: number
  stepIndex: number
  forgeStep?: ForgeMinigameStep
}

export interface RhythmMinigameOptions {
  /** 每步基础条速（默认 1.0） */
  baseFillSpeed?: number
  /** 动态条速 */
  getFillSpeed?: (ctx: RhythmStepContext) => number
  /** 目标区半宽（px，默认 12） */
  getTargetZoneHalfWidth?: (ctx: RhythmStepContext) => number
  /** 目标区中心随机范围 */
  targetRange?: { min: number; max: number }
  tickMs?: number
  steps?: RhythmStepDef[]
}

/**
 * 斗茶 / 锻造共用的节奏条引擎（填充 + 目标区判定）。
 */
export function useRhythmMinigame(options: RhythmMinigameOptions = {}) {
  const {
    baseFillSpeed = 1.0,
    getFillSpeed,
    getTargetZoneHalfWidth,
    targetRange = { min: 25, max: 80 },
    tickMs = 50,
    steps = []
  } = options

  const fillPct = ref(0)
  const targetPosition = ref(50)
  const targetZoneHalfWidth = ref(12)
  const roundIndex = ref(0)
  const stepIndex = ref(0)
  const totalScore = ref(0)
  const roundScore = ref(0)
  const isRunning = ref(false)

  let fillTimer: ReturnType<typeof setInterval> | null = null

  const stepContext = (): RhythmStepContext => ({
    roundIndex: roundIndex.value,
    stepIndex: stepIndex.value,
    forgeStep: steps[stepIndex.value]?.forgeStep
  })

  const resolveSpeed = (): number => {
    if (getFillSpeed) return getFillSpeed(stepContext())
    const roundBonus = roundIndex.value * 0.4
    const stepBonus = stepIndex.value * 0.2
    return baseFillSpeed + roundBonus + stepBonus
  }

  const resolveZoneHalfWidth = (): number => {
    if (getTargetZoneHalfWidth) return getTargetZoneHalfWidth(stepContext())
    return 12
  }

  const rollTarget = () => {
    const span = targetRange.max - targetRange.min
    targetPosition.value = targetRange.min + Math.random() * span
  }

  const startStep = () => {
    stopFill()
    fillPct.value = 0
    rollTarget()
    targetZoneHalfWidth.value = resolveZoneHalfWidth()
    isRunning.value = true
    const speed = resolveSpeed()
    fillTimer = setInterval(() => {
      fillPct.value = Math.min(100, fillPct.value + speed)
      if (fillPct.value >= 100) lockStep()
    }, tickMs)
  }

  const stopFill = () => {
    if (fillTimer) clearInterval(fillTimer)
    fillTimer = null
    isRunning.value = false
  }

  const lockStep = (): { grade: RhythmGrade; score: number; offset: number } => {
    stopFill()
    const offset = Math.abs(fillPct.value - targetPosition.value)
    const { grade, score } = gradeRhythmOffset(offset)
    roundScore.value += score
    totalScore.value += score
    return { grade, score, offset }
  }

  const advanceStep = (stepsPerRound: number): 'continue' | 'round_complete' => {
    stepIndex.value++
    if (stepIndex.value >= stepsPerRound) {
      return 'round_complete'
    }
    return 'continue'
  }

  const startNextRound = () => {
    roundIndex.value++
    stepIndex.value = 0
    roundScore.value = 0
  }

  const resetGame = () => {
    stopFill()
    roundIndex.value = 0
    stepIndex.value = 0
    totalScore.value = 0
    roundScore.value = 0
    fillPct.value = 0
  }

  onUnmounted(stopFill)

  return {
    fillPct,
    targetPosition,
    targetZoneHalfWidth,
    roundIndex,
    stepIndex,
    totalScore,
    roundScore,
    isRunning,
    startStep,
    stopFill,
    lockStep,
    advanceStep,
    startNextRound,
    resetGame,
    gradeRhythmOffset
  }
}

/** 锻造小游戏选项（含 §7.4 天气修正） */
export const buildForgeRhythmOptions = (
  weather: Weather,
  zoneWidthMult = 1
): RhythmMinigameOptions => {
  const mods = FORGE_WEATHER_MINIGAME[weather]
  return {
    steps: FORGE_RHYTHM_STEPS,
    getFillSpeed: ({ forgeStep }) => {
      let speed = 1.0
      if (mods?.allStepsSpeedMult) speed *= mods.allStepsSpeedMult
      if (forgeStep && mods?.stepSpeedMult?.[forgeStep]) {
        speed *= mods.stepSpeedMult[forgeStep]!
      }
      return speed
    },
    getTargetZoneHalfWidth: ({ forgeStep }) => {
      let half = 12 * zoneWidthMult
      if (forgeStep && mods?.stepZoneWidthMult?.[forgeStep]) {
        half *= mods.stepZoneWidthMult[forgeStep]!
      }
      return half
    }
  }
}

/** 锻造三步（§6.2） */
export const FORGE_RHYTHM_STEPS: RhythmStepDef[] = [
  {
    label: '起炉',
    shortLabel: '炉',
    hint: '烧到合适火候',
    action: '定炉！',
    lowLabel: '凉',
    highLabel: '烫',
    forgeStep: 'heat'
  },
  {
    label: '锻打',
    shortLabel: '锻',
    hint: '锤准着力点',
    action: '落锤！',
    lowLabel: '轻',
    highLabel: '重',
    forgeStep: 'hammer'
  },
  {
    label: '淬火',
    shortLabel: '淬',
    hint: '按住入水，适温时松手',
    action: '松手入水！',
    lowLabel: '凉',
    highLabel: '烫',
    forgeStep: 'quench'
  }
]
