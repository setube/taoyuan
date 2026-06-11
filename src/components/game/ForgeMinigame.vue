<template>
  <div class="game-panel max-w-sm w-full">
    <h3 class="text-accent text-sm mb-2 flex items-center space-x-1">
      <Hammer :size="14" />
      <span>当场锻造</span>
    </h3>

    <p v-if="weatherHint" class="text-[10px] text-muted mb-2">{{ weatherHint }}</p>

    <div v-if="phase === 'ready'">
      <p class="text-xs text-muted mb-3">
        起炉看准火候，锻打限时连点，淬火按住入水、适温松手——三步一气呵成。
      </p>
      <div class="flex gap-2">
        <Button class="flex-1 opacity-80" @click="emit('cancel')">取消</Button>
        <Button class="flex-1" @click="startGame">开炉！</Button>
      </div>
    </div>

    <div v-else-if="phase === 'brewing'">
      <div class="flex items-center justify-between mb-2">
        <p class="text-xs text-muted">锻造中</p>
        <p class="text-xs text-muted">
          得分：
          <span class="text-accent">{{ totalScore }}</span>
          / 150
        </p>
      </div>

      <div class="flex justify-center space-x-1 mb-2">
        <div
          v-for="(s, i) in FORGE_RHYTHM_STEPS"
          :key="i"
          class="text-xs px-2 py-0.5 border"
          :class="{
            'border-accent bg-accent/15 text-accent': stepIndex === i,
            'border-success/50 bg-success/5 text-success': i < stepIndex,
            'border-accent/15 text-muted': i > stepIndex
          }"
        >
          <Check v-if="i < stepIndex" :size="10" class="inline -mt-0.5 mr-0.5" />
          {{ s.shortLabel }}
        </div>
      </div>

      <p class="text-xs text-accent text-center mb-2">
        {{ currentStep.label }} — {{ currentStepHint }}
      </p>

      <!-- 第二步：锻打连点 -->
      <template v-if="isHammerStep">
        <div class="flex items-center justify-between mb-2">
          <p class="text-xs text-muted">剩余时间</p>
          <p class="text-sm font-bold" :class="hammerTimeLeft <= 3 ? 'text-danger time-pulse' : 'text-accent'">
            {{ hammerTimeLeft }}s
          </p>
        </div>

        <div class="border border-accent/20 p-2 mb-3">
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs text-muted">锻打进度</span>
            <span class="text-xs text-accent">{{ Math.round(hammerProgress) }}%</span>
          </div>
          <div class="h-6 bg-bg border border-accent/15 relative overflow-hidden">
            <div
              class="h-full bg-accent/40 transition-all duration-75 flex items-center justify-end pr-1"
              :class="{ 'hammer-strike': hammerStriking }"
              :style="{ width: `${hammerProgress}%` }"
            >
              <Hammer :size="12" class="text-accent" />
            </div>
          </div>
        </div>

        <div class="flex items-center space-x-2">
          <Button
            class="flex-1 py-3 text-sm active:!bg-accent active:!text-bg hammer-btn"
            :class="{ 'opacity-40': inputLocked }"
            :icon="Hammer"
            :disabled="inputLocked"
            @click="onHammerStrike"
          >
            落锤！
          </Button>
          <div class="text-center min-w-12">
            <p class="text-accent text-sm font-bold">{{ hammerClickCount }}</p>
            <p class="text-xs text-muted leading-none">次</p>
          </div>
        </div>
      </template>

      <!-- 第三步：淬火（反向控温松手） -->
      <template v-else-if="isQuenchStep">
        <div class="relative h-10 bg-bg border border-accent/20 mb-3">
          <div
            class="absolute top-0 bottom-0 border-x border-success/50 bg-success/15"
            :style="{
              width: `${quenchZoneHalfWidth * 2}px`,
              left: `calc(${quenchTargetPosition}% - ${quenchZoneHalfWidth}px)`
            }"
          />
          <div
            class="absolute top-0 bottom-0 w-1 bg-success/60"
            :style="{ left: `${quenchTargetPosition}%` }"
          />
          <span
            class="absolute -top-3.5 text-success"
            style="font-size: 8px"
            :style="{ left: `calc(${quenchTargetPosition}% - 12px)` }"
          >适温</span>
          <div
            class="absolute top-0 bottom-0 left-0 transition-none bg-danger/25"
            :style="{ width: `${quenchTempPct}%` }"
          />
          <div
            class="absolute top-0 bottom-0 w-0.5 bg-text"
            :style="{ left: `${quenchTempPct}%`, transition: 'none' }"
          />
          <div class="absolute bottom-0 left-1 right-1 flex justify-between" style="font-size: 8px">
            <span class="text-muted">凉</span>
            <span class="text-muted">烫</span>
          </div>
        </div>

        <button
          type="button"
          class="w-full py-3 text-sm border border-accent/30 rounded-xs select-none touch-none quench-btn"
          :class="{
            'bg-accent/25 text-accent': quenchIsHolding,
            'opacity-40 pointer-events-none': inputLocked
          }"
          :disabled="inputLocked"
          @pointerdown.prevent="onQuenchHoldStart"
          @pointerup="onQuenchRelease"
          @pointerleave="onQuenchRelease"
          @pointercancel="onQuenchRelease"
        >
          {{ inputLocked ? '准备淬火…' : quenchIsHolding ? '适温时松手！' : '按住入水…' }}
        </button>
      </template>

      <!-- 第一步：起炉节奏条 -->
      <template v-else>
        <div class="relative h-10 bg-bg border border-accent/20 mb-3">
          <div
            class="absolute top-0 bottom-0 border-x border-success/50 bg-success/15"
            :style="{
              width: `${targetZoneHalfWidth * 2}px`,
              left: `calc(${targetPosition}% - ${targetZoneHalfWidth}px)`
            }"
          />
          <div
            class="absolute top-0 bottom-0 w-1 bg-accent/40"
            :style="{ left: `${targetPosition}%` }"
          />
          <span
            class="absolute -top-3.5 text-success"
            style="font-size: 8px"
            :style="{ left: `calc(${targetPosition}% - 6px)` }"
          >目标</span>
          <div
            class="absolute top-0 bottom-0 left-0 transition-none"
            :class="fillPct > 95 ? 'bg-danger/40' : 'bg-accent/30'"
            :style="{ width: `${fillPct}%` }"
          />
          <div
            class="absolute top-0 bottom-0 w-0.5 bg-text"
            :style="{ left: `${fillPct}%`, transition: 'none' }"
          />
          <div class="absolute bottom-0 left-1 right-1 flex justify-between" style="font-size: 8px">
            <span class="text-muted">{{ currentStep.lowLabel }}</span>
            <span class="text-muted">{{ currentStep.highLabel }}</span>
          </div>
        </div>

        <Button
          class="w-full py-2"
          :icon="Hammer"
          :disabled="inputLocked"
          @click="onLockRhythmStep"
        >
          {{ currentStep.action }}
        </Button>
      </template>
    </div>

    <div
      v-else-if="phase === 'step_result'"
      class="text-center py-2 step-result-shield"
      @pointerdown.stop.prevent
      @pointerup.stop.prevent
      @click.stop.prevent
    >
      <div :class="lastStepGrade === 'perfect' ? 'step-perfect' : lastStepGrade === 'good' ? '' : 'step-miss'">
        <p
          class="text-xs"
          :class="{
            'text-accent': lastStepGrade === 'perfect',
            'text-success': lastStepGrade === 'good',
            'text-muted': lastStepGrade === 'poor'
          }"
        >
          {{ stepResultText }}
        </p>
        <p class="text-[10px] text-muted mt-2">下一步即将开始…</p>
      </div>
    </div>

    <div v-else-if="phase === 'finished'" class="text-center">
      <p class="text-sm text-accent mb-1">锻造完成！</p>
      <p class="text-xs text-muted mb-3">
        总分：
        <span class="text-accent">{{ totalScore }}</span>
        / 150
      </p>
      <Button class="w-full" @click="emit('complete', totalScore)">结算</Button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
  import { Hammer, Check } from 'lucide-vue-next'
  import Button from '@/components/game/Button.vue'
  import {
    buildForgeRhythmOptions,
    FORGE_RHYTHM_STEPS,
    useRhythmMinigame,
    type RhythmGrade
  } from '@/composables/useRhythmMinigame'
  import { FORGE_HAMMER_DURATION_SEC, useForgeHammerStep } from '@/composables/useForgeHammerStep'
  import { buildForgeQuenchOptions, useForgeQuenchStep } from '@/composables/useForgeQuenchStep'
  import { FORGE_WEATHER_MINIGAME, getForgeWeatherHint } from '@/data/forgeWeather'
  import { useGameStore } from '@/stores/useGameStore'
  import { useForgingPerkBonuses } from '@/composables/forgingPerks'
  import {
    sfxGameStart,
    sfxMiniGood,
    sfxMiniPerfect,
    sfxMiniPoor,
    sfxPaddle,
    sfxTeaBell,
    sfxTeaPour
  } from '@/composables/useAudio'

  const HEAT_STEP_INDEX = 0
  const HAMMER_STEP_INDEX = 1
  const QUENCH_STEP_INDEX = 2
  const STEP_RESULT_MS = 1000
  const STEP_INPUT_GRACE_MS = 450
  const QUENCH_INPUT_GRACE_MS = 700

  const props = withDefaults(
    defineProps<{
      autoStart?: boolean
    }>(),
    { autoStart: false }
  )

  const emit = defineEmits<{
    complete: [forgeScore: number]
    cancel: []
  }>()

  type Phase = 'ready' | 'brewing' | 'step_result' | 'finished'

  const gameStore = useGameStore()
  const perkBonuses = useForgingPerkBonuses()
  const weatherHint = computed(() => getForgeWeatherHint(gameStore.weather))

  const hammerDurationSec = computed(() => {
    const mods = FORGE_WEATHER_MINIGAME[gameStore.weather]
    return mods?.hammerDurationSec ?? FORGE_HAMMER_DURATION_SEC
  })

  const quenchOptions = computed(() =>
    buildForgeQuenchOptions(gameStore.weather, perkBonuses.rhythmZoneMult)
  )

  const rhythm = useRhythmMinigame(
    buildForgeRhythmOptions(gameStore.weather, perkBonuses.rhythmZoneMult)
  )
  const { stepIndex, fillPct, targetPosition, targetZoneHalfWidth, totalScore } = rhythm
  const hammer = useForgeHammerStep()
  const {
    timeLeft: hammerTimeLeft,
    clickCount: hammerClickCount,
    hammerProgress,
    striking: hammerStriking
  } = hammer
  const quench = useForgeQuenchStep()
  const {
    tempPct: quenchTempPct,
    targetPosition: quenchTargetPosition,
    targetZoneHalfWidth: quenchZoneHalfWidth,
    isHolding: quenchIsHolding
  } = quench

  const phase = ref<Phase>(props.autoStart ? 'brewing' : 'ready')
  const lastStepGrade = ref<RhythmGrade>('poor')
  const lastStepScore = ref(0)
  const lastHammerClicks = ref(0)
  const lastQuenchTemp = ref(100)
  let hammerStepDone = false
  let quenchStepDone = false
  const inputLocked = ref(false)

  let phaseTimeout: ReturnType<typeof setTimeout> | null = null
  let inputLockTimeout: ReturnType<typeof setTimeout> | null = null

  const currentStep = computed(() => FORGE_RHYTHM_STEPS[stepIndex.value]!)
  const isHammerStep = computed(
    () => phase.value === 'brewing' && stepIndex.value === HAMMER_STEP_INDEX
  )
  const isQuenchStep = computed(
    () => phase.value === 'brewing' && stepIndex.value === QUENCH_STEP_INDEX
  )

  const currentStepHint = computed(() => {
    if (isHammerStep.value) {
      return `${hammerDurationSec.value} 秒内尽量多落锤（28 次以上更佳）`
    }
    if (isQuenchStep.value) {
      return '按住按钮降温，绿区适温时松手入水'
    }
    return currentStep.value.hint
  })

  const stepResultText = computed(() => {
    if (lastQuenchTemp.value < 100) {
      const prefix =
        lastStepGrade.value === 'perfect' ? '淬火精准！' : lastStepGrade.value === 'good' ? '淬火尚可。' : '淬火偏了…'
      return `${prefix} 入水温度 ${Math.round(lastQuenchTemp.value)}%，+${lastStepScore.value}分`
    }
    if (lastHammerClicks.value > 0) {
      const prefix =
        lastStepGrade.value === 'perfect' ? '精准！' : lastStepGrade.value === 'good' ? '还行。' : '偏了…'
      return `${prefix} 落锤 ${lastHammerClicks.value} 次，+${lastStepScore.value}分`
    }
    if (lastStepGrade.value === 'perfect') return `精准！+${lastStepScore.value}分`
    if (lastStepGrade.value === 'good') return `还行。+${lastStepScore.value}分`
    return `偏了… +${lastStepScore.value}分`
  })

  const clearPhaseTimeout = () => {
    if (phaseTimeout) clearTimeout(phaseTimeout)
    phaseTimeout = null
  }

  const clearInputLockTimeout = () => {
    if (inputLockTimeout) clearTimeout(inputLockTimeout)
    inputLockTimeout = null
  }

  const lockStepInput = (ms: number) => {
    inputLocked.value = true
    clearInputLockTimeout()
    inputLockTimeout = setTimeout(() => {
      inputLocked.value = false
      inputLockTimeout = null
    }, ms)
  }

  const playGradeSfx = (grade: RhythmGrade) => {
    setTimeout(() => {
      if (grade === 'perfect') sfxTeaBell()
      else if (grade === 'good') sfxMiniGood()
      else sfxMiniPoor()
    }, 100)
  }

  const showStepResult = (grade: RhythmGrade, score: number) => {
    lastStepGrade.value = grade
    lastStepScore.value = score
    playGradeSfx(grade)
    phase.value = 'step_result'

    clearPhaseTimeout()
    phaseTimeout = setTimeout(() => {
      advanceAfterStep()
    }, STEP_RESULT_MS)
  }

  const advanceAfterStep = () => {
    const next = rhythm.advanceStep(FORGE_RHYTHM_STEPS.length)
    if (next === 'round_complete') {
      if (totalScore.value >= 120) sfxMiniPerfect()
      phase.value = 'finished'
    } else {
      phase.value = 'brewing'
      startCurrentStep()
    }
  }

  const startCurrentStep = () => {
    hammerStepDone = false
    quenchStepDone = false

    if (stepIndex.value === HAMMER_STEP_INDEX) {
      lastHammerClicks.value = 0
      lastQuenchTemp.value = 100
      rhythm.stopFill()
      quench.reset()
      hammer.reset()
      hammer.start(hammerDurationSec.value)
      lockStepInput(STEP_INPUT_GRACE_MS)
    } else if (stepIndex.value === QUENCH_STEP_INDEX) {
      lastHammerClicks.value = 0
      lastQuenchTemp.value = 100
      rhythm.stopFill()
      hammer.reset()
      quench.reset()
      quench.start(quenchOptions.value)
      lockStepInput(QUENCH_INPUT_GRACE_MS)
    } else {
      lastHammerClicks.value = 0
      lastQuenchTemp.value = 100
      hammer.reset()
      quench.reset()
      rhythm.startStep()
      lockStepInput(STEP_INPUT_GRACE_MS)
    }
  }

  const startGame = () => {
    sfxGameStart()
    rhythm.resetGame()
    hammer.reset()
    quench.reset()
    phase.value = 'brewing'
    startCurrentStep()
  }

  const onLockRhythmStep = () => {
    if (inputLocked.value || phase.value !== 'brewing') return
    sfxTeaPour()
    const { grade, score } = rhythm.lockStep()
    showStepResult(grade, score)
  }

  const finishHammerStep = () => {
    if (hammerStepDone || phase.value !== 'brewing' || stepIndex.value !== HAMMER_STEP_INDEX) return
    hammerStepDone = true
    const { grade, score, clicks } = hammer.finish()
    lastHammerClicks.value = clicks
    totalScore.value += score
    showStepResult(grade, score)
  }

  const finishQuenchStep = (result: { grade: RhythmGrade; score: number }) => {
    if (quenchStepDone || phase.value !== 'brewing' || stepIndex.value !== QUENCH_STEP_INDEX) return
    quenchStepDone = true
    lastQuenchTemp.value = quenchTempPct.value
    totalScore.value += result.score
    showStepResult(result.grade, result.score)
  }

  const onHammerStrike = () => {
    if (inputLocked.value || phase.value !== 'brewing') return
    if (!hammer.strike()) return
    sfxPaddle()
  }

  const onQuenchHoldStart = () => {
    if (inputLocked.value || quenchStepDone || !isQuenchStep.value) return
    if (quench.beginHold()) sfxTeaPour()
  }

  const onQuenchRelease = () => {
    if (inputLocked.value || quenchStepDone || !isQuenchStep.value) return
    const result = quench.release()
    if (!result) return
    finishQuenchStep(result)
  }

  watch(hammerTimeLeft, (left, prev) => {
    if (
      phase.value === 'brewing' &&
      stepIndex.value === HAMMER_STEP_INDEX &&
      prev != null &&
      prev > 0 &&
      left <= 0
    ) {
      finishHammerStep()
    }
  })

  watch(quenchTempPct, (temp, prev) => {
    if (
      phase.value === 'brewing' &&
      stepIndex.value === QUENCH_STEP_INDEX &&
      !quenchStepDone &&
      prev != null &&
      prev > 0 &&
      temp <= 0
    ) {
      finishQuenchStep(quench.forceFinish())
    }
  })

  onMounted(() => {
    if (props.autoStart) startGame()
  })

  onUnmounted(() => {
    clearPhaseTimeout()
    clearInputLockTimeout()
    rhythm.stopFill()
    hammer.reset()
    quench.reset()
  })
</script>

<style scoped>
  .step-perfect {
    animation: step-perfect 0.4s ease-out;
  }

  @keyframes step-perfect {
    0% {
      transform: scale(0.9);
    }
    50% {
      transform: scale(1.1);
    }
    100% {
      transform: scale(1);
    }
  }

  .step-miss {
    animation: step-miss 0.3s ease-in-out;
  }

  @keyframes step-miss {
    0%,
    100% {
      transform: translateX(0);
    }
    25% {
      transform: translateX(-2px);
    }
    75% {
      transform: translateX(2px);
    }
  }

  .time-pulse {
    animation: time-pulse 0.5s ease-in-out infinite;
  }

  @keyframes time-pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  .hammer-strike {
    filter: brightness(1.15);
  }

  .hammer-btn:active {
    transform: scale(0.95);
  }

  .quench-btn:active {
    transform: scale(0.98);
  }

  .step-result-shield {
    user-select: none;
    touch-action: none;
  }
</style>
