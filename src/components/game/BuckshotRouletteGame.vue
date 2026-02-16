<template>
  <div class="game-panel max-w-xs w-full">
    <p class="text-sm text-accent text-center mb-1">—— 恶魔轮盘 ——</p>

    <!-- 弹仓信息 -->
    <div class="border border-accent/20 rounded-xs p-2 mb-3">
      <div class="flex items-center justify-between text-xs">
        <span class="text-muted">弹仓</span>
        <span>
          <span v-for="i in liveRemaining" :key="'l' + i" class="text-danger">&bull;</span>
          <span v-for="i in blankRemaining" :key="'b' + i" class="text-muted">&bull;</span>
          <span class="text-muted ml-1">({{ liveRemaining }}实{{ blankRemaining }}空)</span>
        </span>
      </div>
      <div class="flex items-center justify-between text-xs mt-0.5">
        <span class="text-muted">进度</span>
        <span>第{{ shellIndex + 1 }}发 / 共{{ shells.length }}发</span>
      </div>
    </div>

    <!-- HP 显示 -->
    <div class="flex items-center gap-3 mb-3">
      <!-- 玩家HP -->
      <div class="flex-1">
        <div class="flex items-center justify-between text-xs mb-0.5">
          <span :class="isPlayerTurn && !gameOver ? 'text-accent' : 'text-muted'">你</span>
          <span class="text-text">{{ playerHP }}/{{ maxPlayerHP }}</span>
        </div>
        <div class="h-1.5 bg-panel rounded-full overflow-hidden" :class="{ 'buckshot-flash-red': playerHit }">
          <div
            class="h-full transition-all duration-300"
            :class="playerHP > 2 ? 'bg-success' : playerHP > 1 ? 'bg-accent' : 'bg-danger'"
            :style="{ width: (playerHP / maxPlayerHP) * 100 + '%' }"
          />
        </div>
      </div>

      <span class="text-xs text-muted/40">VS</span>

      <!-- 庄家HP -->
      <div class="flex-1">
        <div class="flex items-center justify-between text-xs mb-0.5">
          <span :class="!isPlayerTurn && !gameOver ? 'text-danger' : 'text-muted'">庄家</span>
          <span class="text-text">{{ dealerHP }}/{{ maxDealerHP }}</span>
        </div>
        <div class="h-1.5 bg-panel rounded-full overflow-hidden" :class="{ 'buckshot-flash-red': dealerHit }">
          <div
            class="h-full transition-all duration-300"
            :class="dealerHP > 2 ? 'bg-success' : dealerHP > 1 ? 'bg-accent' : 'bg-danger'"
            :style="{ width: (dealerHP / maxDealerHP) * 100 + '%' }"
          />
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div v-if="isPlayerTurn && !gameOver" class="flex gap-2 mb-3">
      <button class="btn text-xs flex-1 justify-center" :disabled="animating" @click="shootOpponent">射向庄家</button>
      <button class="btn text-xs flex-1 justify-center" :disabled="animating" @click="shootSelf">射向自己</button>
    </div>

    <!-- 庄家回合提示 -->
    <p v-if="!isPlayerTurn && !gameOver" class="text-xs text-muted/40 text-center mb-3">庄家思考中…</p>

    <!-- 行动日志 -->
    <div v-if="actionLog.length > 0" class="border border-accent/10 rounded-xs p-2 mb-3 max-h-24 overflow-y-auto">
      <p
        v-for="(log, i) in actionLog"
        :key="i"
        class="text-[10px] leading-relaxed"
        :class="i === actionLog.length - 1 ? 'text-text' : 'text-muted/60'"
      >
        {{ log }}
      </p>
    </div>

    <!-- 结果 -->
    <template v-if="gameOver">
      <div class="border border-accent/10 rounded-xs p-3 text-center mb-3">
        <p class="text-sm" :class="won ? 'text-success' : draw ? 'text-accent' : 'text-danger'">
          {{ won ? '你赢了！' : draw ? '平局' : '你输了…' }}
        </p>
        <p class="text-xs mt-0.5" :class="won ? 'text-success' : draw ? 'text-accent' : 'text-danger'">
          {{
            won
              ? '+' + BUCKSHOT_BET_AMOUNT * BUCKSHOT_WIN_MULTIPLIER + '文'
              : draw
                ? '退还' + BUCKSHOT_BET_AMOUNT + '文'
                : '-' + BUCKSHOT_BET_AMOUNT + '文'
          }}
        </p>
      </div>
      <button class="btn text-xs w-full justify-center" @click="emit('complete', won, draw)">确定</button>
    </template>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, nextTick, onMounted } from 'vue'
  import { BUCKSHOT_BET_AMOUNT, BUCKSHOT_WIN_MULTIPLIER, dealerDecide } from '@/data/hanhai'
  import { sfxGunshot, sfxGunEmpty, sfxCasinoWin, sfxCasinoLose } from '@/composables/useAudio'
  import type { BuckshotSetup, ShellType } from '@/types'

  const props = defineProps<{ setup: BuckshotSetup }>()
  const emit = defineEmits<{ complete: [won: boolean, draw: boolean] }>()

  // 游戏状态
  const shells = ref<ShellType[]>([...props.setup.shells])
  const shellIndex = ref(0)
  const playerHP = ref(props.setup.playerHP)
  const dealerHP = ref(props.setup.dealerHP)
  const maxPlayerHP = props.setup.playerHP
  const maxDealerHP = props.setup.dealerHP
  const playerFirst = Math.random() < 0.5
  const isPlayerTurn = ref(playerFirst)
  const gameOver = ref(false)
  const won = ref(false)
  const draw = ref(false)
  const actionLog = ref<string[]>([])
  const animating = ref(false)

  // 受击动画
  const playerHit = ref(false)
  const dealerHit = ref(false)

  const liveRemaining = computed(() => {
    let count = 0
    for (let i = shellIndex.value; i < shells.value.length; i++) {
      if (shells.value[i] === 'live') count++
    }
    return count
  })

  const blankRemaining = computed(() => {
    let count = 0
    for (let i = shellIndex.value; i < shells.value.length; i++) {
      if (shells.value[i] === 'blank') count++
    }
    return count
  })

  const addActionLog = (msg: string) => {
    actionLog.value.push(msg)
  }

  const triggerHitAnim = (target: 'player' | 'dealer') => {
    if (target === 'player') {
      playerHit.value = true
      setTimeout(() => {
        playerHit.value = false
      }, 400)
    } else {
      dealerHit.value = true
      setTimeout(() => {
        dealerHit.value = false
      }, 400)
    }
  }

  const getCurrentShell = (): ShellType | null => {
    if (shellIndex.value >= shells.value.length) return null
    return shells.value[shellIndex.value]!
  }

  const consumeShell = () => {
    shellIndex.value++
  }

  const checkGameEnd = () => {
    if (playerHP.value <= 0) {
      gameOver.value = true
      won.value = false
      sfxCasinoLose()
      addActionLog('你倒下了……')
      return true
    }
    if (dealerHP.value <= 0) {
      gameOver.value = true
      won.value = true
      sfxCasinoWin()
      addActionLog('庄家倒下了！')
      return true
    }
    if (shellIndex.value >= shells.value.length) {
      // 弹药用完，比较剩余HP
      if (playerHP.value > dealerHP.value) {
        gameOver.value = true
        won.value = true
        sfxCasinoWin()
        addActionLog('弹药用尽，你的生命值更高——你赢了！')
      } else if (playerHP.value < dealerHP.value) {
        gameOver.value = true
        won.value = false
        sfxCasinoLose()
        addActionLog('弹药用尽，庄家生命值更高——你输了…')
      } else {
        // 平局，退还下注
        gameOver.value = true
        draw.value = true
        addActionLog('弹药用尽，生命值相同——平局！')
      }
      return true
    }
    return false
  }

  const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))

  /** 玩家射击对方 */
  const shootOpponent = async () => {
    if (animating.value || gameOver.value) return
    animating.value = true
    const shell = getCurrentShell()
    consumeShell()

    if (shell === 'live') {
      sfxGunshot()
      dealerHP.value = Math.max(0, dealerHP.value - 1)
      triggerHitAnim('dealer')
      addActionLog('你射向庄家——实弹！庄家 -1HP')
    } else {
      sfxGunEmpty()
      addActionLog('你射向庄家——空弹，未命中。')
    }

    await nextTick()

    if (!checkGameEnd()) {
      isPlayerTurn.value = false
      await delay(800)
      animating.value = false
      void dealerTurn()
    } else {
      animating.value = false
    }
  }

  /** 玩家射击自己 */
  const shootSelf = async () => {
    if (animating.value || gameOver.value) return
    animating.value = true
    const shell = getCurrentShell()
    consumeShell()

    if (shell === 'blank') {
      sfxGunEmpty()
      addActionLog('你射向自己——空弹！获得额外回合。')
      // 额外回合，不切换
      await delay(400)
      animating.value = false
      if (checkGameEnd()) return
    } else {
      sfxGunshot()
      playerHP.value = Math.max(0, playerHP.value - 1)
      triggerHitAnim('player')
      addActionLog('你射向自己——实弹！你 -1HP')
      await nextTick()

      if (!checkGameEnd()) {
        isPlayerTurn.value = false
        await delay(800)
        animating.value = false
        void dealerTurn()
      } else {
        animating.value = false
      }
    }
  }

  /** 庄家回合 */
  const dealerTurn = async () => {
    if (gameOver.value) return
    animating.value = true

    await delay(800)

    if (shellIndex.value >= shells.value.length) {
      checkGameEnd()
      animating.value = false
      return
    }

    const decision = dealerDecide(shells.value, shellIndex.value, false)
    const shell = getCurrentShell()
    consumeShell()

    if (decision === 'opponent') {
      // 射玩家
      if (shell === 'live') {
        sfxGunshot()
        playerHP.value = Math.max(0, playerHP.value - 1)
        triggerHitAnim('player')
        addActionLog('庄家射向你——实弹！你 -1HP')
      } else {
        sfxGunEmpty()
        addActionLog('庄家射向你——空弹，未命中。')
      }
      await nextTick()

      if (!checkGameEnd()) {
        isPlayerTurn.value = true
        animating.value = false
      } else {
        animating.value = false
      }
    } else {
      // 射自己
      if (shell === 'blank') {
        sfxGunEmpty()
        addActionLog('庄家射向自己——空弹！庄家获得额外回合。')
        await delay(600)
        if (!checkGameEnd()) {
          await dealerTurn()
        } else {
          animating.value = false
        }
      } else {
        sfxGunshot()
        dealerHP.value = Math.max(0, dealerHP.value - 1)
        triggerHitAnim('dealer')
        addActionLog('庄家射向自己——实弹！庄家 -1HP')
        await nextTick()

        if (!checkGameEnd()) {
          isPlayerTurn.value = true
          animating.value = false
        } else {
          animating.value = false
        }
      }
    }
  }

  onMounted(() => {
    if (playerFirst) {
      addActionLog('你先手。')
    } else {
      addActionLog('庄家先手。')
      void dealerTurn()
    }
  })
</script>

<style scoped>
  .buckshot-flash-red {
    animation: buckshot-hit 0.3s ease-in-out;
  }

  @keyframes buckshot-hit {
    0%,
    100% {
      background-color: var(--color-panel);
    }
    50% {
      background-color: oklch(from var(--color-danger) l c h / 0.4);
    }
  }
</style>
