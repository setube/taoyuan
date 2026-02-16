<template>
  <div class="game-panel max-w-sm w-full">
    <h3 class="text-accent text-sm mb-3 flex items-center gap-1">
      <Sparkles :size="14" />
      年末烟花会
    </h3>

    <!-- 准备 -->
    <div v-if="phase === 'ready'">
      <p class="text-xs text-muted mb-3">记住烟花绽放的顺序，然后按顺序点击复现！共5轮，每轮多一个位置，考验你的记忆力！</p>
      <button class="btn w-full text-xs" @click="startGame">开始烟花会！</button>
    </div>

    <!-- 游戏中 -->
    <div v-else-if="phase !== 'finished'">
      <div class="flex items-center justify-between mb-2">
        <p class="text-xs text-muted">第 {{ round + 1 }} / 5 轮</p>
        <p class="text-xs text-muted">
          得分：
          <span class="text-accent">{{ score }}</span>
          文
        </p>
      </div>

      <!-- 轮数进度点 -->
      <div class="flex justify-center gap-1.5 mb-2">
        <div v-for="i in 5" :key="i" class="w-2 h-2" :class="roundDotClass(i - 1)" />
      </div>

      <p
        class="text-xs text-center mb-3 py-1 border border-accent/10"
        :class="{
          'text-accent': phase === 'watching',
          'text-success': phase === 'repeating',
          'text-danger': phase === 'round_fail'
        }"
      >
        {{ phaseText }}
      </p>

      <!-- 回忆倒计时 -->
      <div v-if="phase === 'repeating'" class="mb-2">
        <div class="flex items-center justify-between mb-1">
          <p class="text-xs text-muted">{{ playerInput.length }} / {{ sequence.length }}</p>
          <p class="text-xs" :class="recallTimeLeft <= 3 ? 'text-danger time-pulse' : 'text-accent'">{{ recallTimeLeft }}s</p>
        </div>
        <div class="h-1 bg-bg border border-accent/20">
          <div
            class="h-full transition-all duration-1000 ease-linear"
            :class="recallTimeLeft <= 3 ? 'bg-danger/60' : 'bg-accent/60'"
            :style="{ width: `${(recallTimeLeft / recallTimeLimit) * 100}%` }"
          />
        </div>
      </div>

      <!-- 6个发射位置（2×3网格）夜空背景 -->
      <div class="grid grid-cols-3 gap-2 mb-4 p-2 night-sky border border-accent/10">
        <button
          v-for="i in 6"
          :key="i"
          class="h-16 border relative overflow-hidden flex items-center justify-center transition-all duration-100"
          :class="{
            'border-accent/30 hover:border-accent/60': phase === 'repeating',
            'border-accent/10': phase !== 'repeating',
            'pointer-events-none': phase !== 'repeating'
          }"
          @click="clickPad(i - 1)"
        >
          <!-- 烟花绽放效果 -->
          <div v-if="activeFirework === i - 1" class="firework-bloom absolute inset-0 flex items-center justify-center">
            <div class="firework-particle" :style="{ '--fw-color': fireworkColors[i - 1] }">
              <Sparkle :size="18" />
            </div>
            <!-- 散射粒子 -->
            <Asterisk :size="10" class="particle p1" :style="{ color: fireworkColors[i - 1] }" />
            <Asterisk :size="10" class="particle p2" :style="{ color: fireworkColors[i - 1] }" />
            <Asterisk :size="10" class="particle p3" :style="{ color: fireworkColors[i - 1] }" />
            <Asterisk :size="10" class="particle p4" :style="{ color: fireworkColors[i - 1] }" />
          </div>

          <!-- 正确点击反馈 -->
          <div v-if="correctFlash === i - 1" class="correct-bloom absolute inset-0 bg-success/20" />

          <!-- 错误反馈 -->
          <div v-if="wrongFlash === i - 1" class="wrong-flash-bg absolute inset-0 bg-danger/20" />

          <!-- 位置编号 -->
          <span class="text-xs relative z-10" :class="phase === 'repeating' ? 'text-accent/50' : 'text-accent/20'">{{ i }}</span>
        </button>
      </div>
    </div>

    <!-- 最终结果 -->
    <div v-else>
      <p class="text-xs text-muted mb-2">烟花会结束！</p>

      <!-- 轮数进度点（最终状态） -->
      <div class="flex justify-center gap-1.5 mb-3">
        <div v-for="i in 5" :key="i" class="w-2 h-2" :class="roundDotClass(i - 1)" />
      </div>

      <div class="border border-accent/20 p-3 mb-3 text-center">
        <p class="text-xs mb-1">
          通过轮数：
          <span class="text-success">{{ completedRounds }}</span>
          / 5 轮
        </p>
        <p class="text-xs">
          总奖金：
          <span class="text-accent">{{ score }}</span>
          文
          <span v-if="completedRounds === 5" class="text-accent finish-flash">（全通+200文！）</span>
        </p>
      </div>
      <button class="btn w-full text-xs" @click="handleClaim">领取奖励</button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onUnmounted } from 'vue'
  import { Sparkles, Sparkle, Asterisk } from 'lucide-vue-next'
  import {
    sfxGameStart,
    sfxRewardClaim,
    sfxCountdownTick,
    sfxCountdownFinal,
    sfxFireworkLaunch,
    sfxFireworkBoom,
    sfxMiniPerfect,
    sfxMiniFail,
    sfxRankFirst
  } from '@/composables/useAudio'

  const emit = defineEmits<{ complete: [prize: number] }>()

  type Phase = 'ready' | 'watching' | 'repeating' | 'round_success' | 'round_fail' | 'finished'
  const phase = ref<Phase>('ready')

  const round = ref(0)
  const score = ref(0)
  const completedRounds = ref(0)
  const sequence = ref<number[]>([])
  const playerInput = ref<number[]>([])
  const activeFirework = ref(-1)
  const correctFlash = ref(-1)
  const wrongFlash = ref(-1)
  /** 记录每轮通过/失败: true=通过, false=失败, null=未到 */
  const roundResults = ref<(boolean | null)[]>([null, null, null, null, null])
  /** 回忆阶段倒计时 */
  const recallTimeLeft = ref(0)
  const recallTimeLimit = ref(0)

  /** Design tokens: accent, danger, success (matches --color-accent, --color-danger, --color-success) */
  const fireworkColors = ['#c8a45c', '#c34043', '#5a9e6f', '#c8a45c', '#c34043', '#5a9e6f']

  let showTimeout: ReturnType<typeof setTimeout> | null = null
  let phaseTimeout: ReturnType<typeof setTimeout> | null = null
  let recallTimer: ReturnType<typeof setInterval> | null = null

  const phaseText = computed(() => {
    switch (phase.value) {
      case 'watching':
        return '看好烟花顺序...'
      case 'repeating':
        return '按顺序点击！'
      case 'round_success':
        return '记忆正确！+150文'
      case 'round_fail':
        return '记错了...'
      default:
        return ''
    }
  })

  const roundDotClass = (idx: number) => {
    const r = roundResults.value[idx]
    if (r === true) return 'bg-success'
    if (r === false) return 'bg-danger'
    if (idx === round.value && phase.value !== 'finished') return 'bg-accent dot-pulse'
    return 'bg-accent/20'
  }

  const generateSequence = (length: number): number[] => {
    const seq: number[] = []
    for (let i = 0; i < length; i++) {
      seq.push(Math.floor(Math.random() * 6))
    }
    return seq
  }

  const startGame = () => {
    sfxGameStart()
    round.value = 0
    score.value = 0
    completedRounds.value = 0
    roundResults.value = [null, null, null, null, null]
    startRound()
  }

  const startRound = () => {
    const seqLength = round.value + 2 // 第1轮2个，第5轮6个
    sequence.value = generateSequence(seqLength)
    playerInput.value = []
    phase.value = 'watching'

    // 展示间隔随轮次加快: 第1轮500ms → 第5轮350ms
    const showDelay = Math.max(350, 500 - round.value * 40)
    const flashDuration = Math.max(350, 500 - round.value * 40)

    // 展示序列
    let idx = 0
    const showNext = () => {
      if (idx < sequence.value.length) {
        activeFirework.value = sequence.value[idx]!
        sfxFireworkLaunch()
        setTimeout(() => sfxFireworkBoom(), 200)
        showTimeout = setTimeout(() => {
          activeFirework.value = -1
          idx++
          showTimeout = setTimeout(showNext, showDelay * 0.5)
        }, flashDuration)
      } else {
        // 展示完毕，进入玩家输入，开始倒计时
        phase.value = 'repeating'
        // 回忆时间: 基础5秒 + 每个位置1.5秒，随轮次略减
        const timePerSlot = Math.max(1.0, 1.5 - round.value * 0.1)
        recallTimeLimit.value = Math.ceil(5 + seqLength * timePerSlot)
        recallTimeLeft.value = recallTimeLimit.value
        recallTimer = setInterval(() => {
          recallTimeLeft.value--
          if (recallTimeLeft.value <= 3 && recallTimeLeft.value > 0) sfxCountdownFinal()
          else if (recallTimeLeft.value > 3) sfxCountdownTick()
          if (recallTimeLeft.value <= 0) {
            // 超时，本轮失败
            sfxMiniFail()
            if (recallTimer) clearInterval(recallTimer)
            recallTimer = null
            roundResults.value[round.value] = false
            phase.value = 'round_fail'
            phaseTimeout = setTimeout(() => {
              phase.value = 'finished'
            }, 1200)
          }
        }, 1000)
      }
    }
    showTimeout = setTimeout(showNext, 500)
  }

  const clickPad = (idx: number) => {
    if (phase.value !== 'repeating') return

    const expectedIdx = playerInput.value.length
    const expected = sequence.value[expectedIdx]

    if (idx === expected) {
      // 正确
      sfxFireworkBoom()
      playerInput.value.push(idx)
      correctFlash.value = idx
      activeFirework.value = idx
      setTimeout(() => {
        correctFlash.value = -1
        activeFirework.value = -1
      }, 300)

      if (playerInput.value.length === sequence.value.length) {
        // 本轮全部正确
        if (recallTimer) clearInterval(recallTimer)
        recallTimer = null
        completedRounds.value++
        score.value += 150
        roundResults.value[round.value] = true
        sfxMiniPerfect()
        phase.value = 'round_success'

        phaseTimeout = setTimeout(() => {
          round.value++
          if (round.value >= 5) {
            score.value += 200 // 全通奖励
            sfxRankFirst()
            phase.value = 'finished'
          } else {
            startRound()
          }
        }, 1000)
      }
    } else {
      // 错误
      sfxMiniFail()
      wrongFlash.value = idx
      setTimeout(() => {
        wrongFlash.value = -1
      }, 400)
      if (recallTimer) clearInterval(recallTimer)
      recallTimer = null
      roundResults.value[round.value] = false
      phase.value = 'round_fail'

      phaseTimeout = setTimeout(() => {
        phase.value = 'finished'
      }, 1200)
    }
  }

  const handleClaim = () => {
    sfxRewardClaim()
    emit('complete', score.value)
  }

  onUnmounted(() => {
    if (showTimeout) clearTimeout(showTimeout)
    if (phaseTimeout) clearTimeout(phaseTimeout)
    if (recallTimer) clearInterval(recallTimer)
  })
</script>

<style scoped>
  .night-sky {
    background: linear-gradient(180deg, oklch(from var(--color-bg) l c h / 0.6) 0%, oklch(from var(--color-bg) l c h / 0.3) 100%);
  }

  .firework-bloom {
    animation: firework-bloom 0.6s ease-out;
  }

  @keyframes firework-bloom {
    0% {
      transform: scale(0.2);
      opacity: 0;
    }
    40% {
      transform: scale(1.2);
      opacity: 1;
    }
    100% {
      transform: scale(1);
      opacity: 0.8;
    }
  }

  .firework-particle {
    color: var(--fw-color, var(--color-accent));
    animation: particle-scatter 0.6s ease-out;
  }

  @keyframes particle-scatter {
    0% {
      transform: scale(0.5);
      opacity: 0;
    }
    50% {
      transform: scale(1.8);
      opacity: 1;
    }
    100% {
      transform: scale(1);
      opacity: 0.6;
    }
  }

  /* 散射粒子 */
  .particle {
    position: absolute;
    opacity: 0;
  }

  .p1 {
    animation: scatter-1 0.6s ease-out;
  }
  .p2 {
    animation: scatter-2 0.6s ease-out;
  }
  .p3 {
    animation: scatter-3 0.6s ease-out;
  }
  .p4 {
    animation: scatter-4 0.6s ease-out;
  }

  @keyframes scatter-1 {
    0% {
      transform: translate(0, 0);
      opacity: 0;
    }
    30% {
      opacity: 1;
    }
    100% {
      transform: translate(-12px, -12px);
      opacity: 0;
    }
  }
  @keyframes scatter-2 {
    0% {
      transform: translate(0, 0);
      opacity: 0;
    }
    30% {
      opacity: 1;
    }
    100% {
      transform: translate(12px, -12px);
      opacity: 0;
    }
  }
  @keyframes scatter-3 {
    0% {
      transform: translate(0, 0);
      opacity: 0;
    }
    30% {
      opacity: 1;
    }
    100% {
      transform: translate(-12px, 10px);
      opacity: 0;
    }
  }
  @keyframes scatter-4 {
    0% {
      transform: translate(0, 0);
      opacity: 0;
    }
    30% {
      opacity: 1;
    }
    100% {
      transform: translate(12px, 10px);
      opacity: 0;
    }
  }

  .correct-bloom {
    animation: correct-bloom 0.3s ease-out;
  }

  @keyframes correct-bloom {
    0% {
      opacity: 0;
    }
    50% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }

  .wrong-flash-bg {
    animation: wrong-flash-anim 0.4s ease-in-out;
  }

  @keyframes wrong-flash-anim {
    0%,
    100% {
      opacity: 0;
    }
    30% {
      opacity: 1;
    }
    70% {
      opacity: 0.5;
    }
  }

  .dot-pulse {
    animation: dot-pulse 1s ease-in-out infinite;
  }

  @keyframes dot-pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.4;
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

  .finish-flash {
    animation: finish-flash 0.6s ease-in-out 3;
  }

  @keyframes finish-flash {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.3;
    }
  }
</style>
