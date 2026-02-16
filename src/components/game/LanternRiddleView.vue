<template>
  <div class="game-panel max-w-sm w-full">
    <h3 class="text-accent text-sm mb-3 flex items-center gap-1">
      <Lightbulb :size="14" />
      七夕猜灯谜
    </h3>

    <!-- 准备 -->
    <div v-if="phase === 'ready'">
      <p class="text-xs text-muted mb-3">广场上挂满了灯笼，每个灯笼下都有一条灯谜。共5题，每题限时，答对有奖！</p>
      <button class="btn text-xs w-full" @click="startGame">开始猜谜！</button>
    </div>

    <!-- 展示灯笼 -->
    <div v-else-if="phase === 'showing'" class="text-center py-4">
      <div class="lantern-drop mb-3">
        <div class="inline-block border-2 border-accent/50 px-6 py-3">
          <Lamp :size="20" class="text-accent mx-auto mb-1" />
          <p class="text-accent text-xs">第 {{ currentIndex + 1 }} 题</p>
        </div>
      </div>
      <!-- 进度点 -->
      <div class="flex justify-center gap-2 mt-2">
        <div v-for="i in 5" :key="i" class="w-2 h-2" :class="dotClass(i - 1)" />
      </div>
    </div>

    <!-- 答题中 -->
    <div v-else-if="phase === 'answering'">
      <!-- 进度点 + 倒计时 -->
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-1.5">
          <div v-for="i in 5" :key="i" class="w-2 h-2" :class="dotClass(i - 1)" />
        </div>
        <p class="text-xs" :class="countdown <= 3 ? 'text-danger time-pulse' : 'text-accent'">
          <Timer :size="12" class="inline -mt-0.5" />
          {{ countdown }}s
        </p>
      </div>

      <!-- 倒计时条 -->
      <div class="h-1 bg-bg border border-accent/20 mb-3">
        <div
          class="h-full transition-all duration-1000 ease-linear"
          :class="countdown <= 3 ? 'bg-danger/60' : 'bg-accent/60'"
          :style="{ width: `${(countdown / currentTimeLimit) * 100}%` }"
        />
      </div>

      <!-- 谜面 -->
      <div class="border border-accent/30 p-3 mb-3 text-center">
        <p class="text-xs text-muted mb-1">谜面</p>
        <p class="text-xs text-text leading-relaxed">{{ currentRiddle.question }}</p>
      </div>

      <!-- 选项 -->
      <div class="flex flex-col gap-2">
        <button
          v-for="(opt, i) in currentRiddle.options"
          :key="i"
          class="btn text-xs text-left w-full"
          :disabled="answered"
          :class="{ 'opacity-50': answered }"
          @click="answer(i)"
        >
          <span class="text-accent mr-1">{{ ['甲', '乙', '丙', '丁'][i] }}.</span>
          {{ opt }}
        </button>
      </div>
    </div>

    <!-- 单题结果 -->
    <div v-else-if="phase === 'result'" class="text-center">
      <!-- 进度点 -->
      <div class="flex justify-center gap-1.5 mb-3">
        <div v-for="i in 5" :key="i" class="w-2 h-2" :class="dotClass(i - 1)" />
      </div>

      <div :class="lastCorrect ? 'correct-flash' : 'wrong-shake'" class="mb-3 py-3 border border-accent/20">
        <p class="text-sm mb-1" :class="lastCorrect ? 'text-success' : 'text-danger'">
          {{ lastCorrect ? '答对了！+100文' : '答错了…' }}
        </p>
        <p class="text-xs text-muted mt-1">
          正确答案：
          <span class="text-accent">{{ currentRiddle.options[currentRiddle.answer] }}</span>
        </p>
      </div>
      <p class="text-xs text-muted">
        当前得分：
        <span class="text-accent">{{ score }}</span>
        文
      </p>
    </div>

    <!-- 最终结果 -->
    <div v-else>
      <p class="text-xs text-muted mb-2">灯谜会结束！</p>

      <!-- 进度点（最终状态） -->
      <div class="flex justify-center gap-1.5 mb-3">
        <div v-for="i in 5" :key="i" class="w-2 h-2" :class="dotClass(i - 1)" />
      </div>

      <div class="border border-accent/20 p-3 mb-3 text-center">
        <p class="text-xs mb-1">
          答对：
          <span class="text-success">{{ correctCount }}</span>
          / 5 题
        </p>
        <p class="text-xs">
          总奖金：
          <span class="text-accent">{{ score }}</span>
          文
          <span v-if="correctCount === 5" class="text-accent finish-flash">（全对+300文！）</span>
        </p>
      </div>
      <button class="btn text-xs w-full" @click="handleClaim">领取奖励</button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onUnmounted } from 'vue'
  import { Lightbulb, Lamp, Timer } from 'lucide-vue-next'
  import {
    sfxGameStart,
    sfxRewardClaim,
    sfxCountdownTick,
    sfxCountdownFinal,
    sfxRiddleReveal,
    sfxRiddleWrong,
    sfxMiniGood,
    sfxMiniPerfect
  } from '@/composables/useAudio'

  const emit = defineEmits<{ complete: [prize: number] }>()

  type Phase = 'ready' | 'showing' | 'answering' | 'result' | 'finished'
  const phase = ref<Phase>('ready')

  interface Riddle {
    question: string
    options: string[]
    answer: number
  }

  const RIDDLE_POOL: Riddle[] = [
    // === 传统灯谜 ===
    { question: '有面无口，有脚无手，听人讲话，陪人吃酒。（打一日用品）', options: ['桌子', '椅子', '茶壶', '灯笼'], answer: 0 },
    { question: '千条线，万条线，掉到水里看不见。（打一自然现象）', options: ['风', '雨', '雪', '雾'], answer: 1 },
    { question: '身穿绿衣裳，肚里水汪汪，生的子儿多，个个黑脸膛。（打一水果）', options: ['葡萄', '西瓜', '石榴', '荔枝'], answer: 1 },
    { question: '红公鸡，绿尾巴，身体钻到地底下。（打一蔬菜）', options: ['胡萝卜', '白萝卜', '红薯', '花生'], answer: 0 },
    { question: '弟兄七八个，围着柱子坐，大家一分手，衣服全扯破。（打一食物）', options: ['饺子', '包子', '蒜', '橘子'], answer: 2 },
    { question: '头戴红帽子，身穿白袍子，走路摆架子，说话伸脖子。（打一动物）', options: ['鸡', '鹅', '鹤', '鹦鹉'], answer: 1 },
    { question: '一物三口，有腿无手，谁要没它，难见亲友。（打一服饰）', options: ['帽子', '裤子', '鞋子', '手套'], answer: 1 },
    { question: '小小一姑娘，坐在水中央，身穿粉红袄，阵阵放清香。（打一植物）', options: ['睡莲', '荷花', '菊花', '兰花'], answer: 1 },
    { question: '一个老头，不跑不走，请他睡觉，他就摇头。（打一物品）', options: ['钟摆', '不倒翁', '秋千', '风车'], answer: 1 },
    { question: '有头无颈，有眼无眉，无脚能走，有翅难飞。（打一动物）', options: ['蛇', '鱼', '蚕', '蜗牛'], answer: 1 },
    { question: '驼背公公，力大无穷，爱驮什么？车水马龙。（打一物）', options: ['桥', '路', '船', '车'], answer: 0 },
    { question: '上不怕水，下不怕火，家家厨房，都有一个。（打一厨具）', options: ['菜刀', '锅', '碗', '案板'], answer: 1 },
    // === 中国文化/节日/诗词 ===
    { question: '「但愿人长久，千里共婵娟」中的「婵娟」指什么？', options: ['美人', '月亮', '太阳', '星辰'], answer: 1 },
    { question: '七夕节又叫什么节？', options: ['元宵节', '花朝节', '乞巧节', '上巳节'], answer: 2 },
    { question: '「爆竹声中一岁除」出自哪位诗人？', options: ['李白', '杜甫', '苏轼', '王安石'], answer: 3 },
    { question: '古代「五谷」中不包括以下哪一种？', options: ['稻', '麦', '棉', '黍'], answer: 2 },
    {
      question: '「清明时节雨纷纷」的下一句是？',
      options: ['路上行人欲断魂', '牧童遥指杏花村', '借问酒家何处有', '独在异乡为异客'],
      answer: 0
    },
    { question: '农历五月初五是什么节日？', options: ['中秋节', '重阳节', '端午节', '七夕节'], answer: 2 },
    { question: '「举头望明月」的下一句是？', options: ['疑是地上霜', '低头思故乡', '月是故乡明', '对影成三人'], answer: 1 },
    { question: '古代的「文房四宝」不包括以下哪项？', options: ['笔', '墨', '纸', '尺'], answer: 3 },
    { question: '「春眠不觉晓」的下一句是？', options: ['处处闻啼鸟', '花落知多少', '夜来风雨声', '春风花草香'], answer: 0 },
    { question: '二十四节气中，立春之后是哪个节气？', options: ['惊蛰', '雨水', '春分', '清明'], answer: 1 },
    { question: '古人说「岁寒三友」，指的是哪三种植物？', options: ['梅兰竹', '松竹梅', '兰菊梅', '松兰竹'], answer: 1 },
    { question: '「床前明月光」中的「床」最可能指什么？', options: ['睡床', '井栏', '胡床', '窗台'], answer: 1 },
    { question: '重阳节有什么传统习俗？', options: ['吃汤圆', '登高望远', '放河灯', '踏青'], answer: 1 },
    {
      question: '「人面不知何处去」的下一句是？',
      options: ['桃花依旧笑春风', '春风不度玉门关', '花开花落两由之', '落花时节又逢君'],
      answer: 0
    },
    { question: '端午节吃粽子是为了纪念谁？', options: ['孔子', '屈原', '李白', '诸葛亮'], answer: 1 },
    { question: '「采菊东篱下」的下一句是？', options: ['悠然见南山', '把酒问青天', '独钓寒江雪', '春来江水绿如蓝'], answer: 0 },
    // === 自然/农耕/动物 ===
    {
      question: '圆圆脸儿像苹果，又酸又甜营养多，既能做菜吃，又能当水果。（打一蔬果）',
      options: ['番茄', '苹果', '桃子', '杏子'],
      answer: 0
    },
    { question: '看看圆，摸摸麻，包着一肚小月牙。（打一食物）', options: ['核桃', '花生', '橘子', '石榴'], answer: 2 },
    { question: '白嫩小宝宝，洗澡吹泡泡，洗洗身体小，再洗不见了。（打一日用品）', options: ['毛巾', '肥皂', '牙膏', '香囊'], answer: 1 },
    {
      question: '一根竹管二尺长，开了七个小圆窗，对准一个窗口吹，悠悠乐声传四方。（打一乐器）',
      options: ['箫', '笛子', '埙', '琵琶'],
      answer: 1
    },
    { question: '说它是头牛，不能拉犁走，说它力气小，却能背屋走。（打一动物）', options: ['蜗牛', '犀牛', '水牛', '蚂蚁'], answer: 0 },
    { question: '有翅不是鸟，有腿不会跑，无巢住树上，鸣叫赛百鸟。（打一昆虫）', options: ['蜜蜂', '蝴蝶', '蝉', '蟋蟀'], answer: 2 },
    { question: '两叶花四朵，颜色白又黄，一年开一次，八月放清香。（打一植物）', options: ['兰花', '菊花', '桂花', '荷花'], answer: 2 },
    {
      question: '四四方方一座城，城里住着十万兵，派出将军去攻打，万马奔腾杀敌人。（打一物品）',
      options: ['棋盘', '算盘', '印章', '砚台'],
      answer: 0
    }
  ]

  /** 前2题7秒，后3题6秒 */
  const currentTimeLimit = ref(7)

  const gameRiddles = ref<Riddle[]>([])
  const currentIndex = ref(0)
  const countdown = ref(7)
  const score = ref(0)
  const correctCount = ref(0)
  const lastCorrect = ref(false)
  const answered = ref(false)
  const results = ref<(boolean | null)[]>([null, null, null, null, null])

  let countdownTimer: ReturnType<typeof setInterval> | null = null
  let phaseTimeout: ReturnType<typeof setTimeout> | null = null

  const currentRiddle = ref<Riddle>(RIDDLE_POOL[0]!)

  const dotClass = (idx: number) => {
    const r = results.value[idx]
    if (r === true) return 'bg-success'
    if (r === false) return 'bg-danger'
    if (idx === currentIndex.value && phase.value !== 'finished') return 'bg-accent dot-pulse'
    return 'bg-accent/20'
  }

  const pickRiddles = (): Riddle[] => {
    const pool = [...RIDDLE_POOL]
    const picked: Riddle[] = []
    for (let i = 0; i < 5; i++) {
      const idx = Math.floor(Math.random() * pool.length)
      picked.push(pool.splice(idx, 1)[0]!)
    }
    return picked
  }

  const startGame = () => {
    sfxGameStart()
    gameRiddles.value = pickRiddles()
    currentIndex.value = 0
    score.value = 0
    correctCount.value = 0
    results.value = [null, null, null, null, null]
    showNextRiddle()
  }

  const showNextRiddle = () => {
    currentRiddle.value = gameRiddles.value[currentIndex.value]!
    answered.value = false
    currentTimeLimit.value = currentIndex.value < 2 ? 7 : 6
    sfxRiddleReveal()
    phase.value = 'showing'
    phaseTimeout = setTimeout(() => {
      phase.value = 'answering'
      countdown.value = currentTimeLimit.value
      countdownTimer = setInterval(() => {
        countdown.value--
        if (countdown.value <= 3 && countdown.value > 0) sfxCountdownFinal()
        else if (countdown.value > 3) sfxCountdownTick()
        if (countdown.value <= 0) {
          answer(-1)
        }
      }, 1000)
    }, 800)
  }

  const answer = (choice: number) => {
    if (answered.value) return
    answered.value = true

    if (countdownTimer) clearInterval(countdownTimer)
    countdownTimer = null

    const correct = choice === currentRiddle.value.answer
    lastCorrect.value = correct
    results.value[currentIndex.value] = correct
    if (correct) {
      sfxMiniGood()
      correctCount.value++
      score.value += 100
    } else {
      sfxRiddleWrong()
    }
    phase.value = 'result'

    phaseTimeout = setTimeout(() => {
      currentIndex.value++
      if (currentIndex.value >= 5) {
        if (correctCount.value === 5) {
          score.value += 300
          sfxMiniPerfect()
        }
        phase.value = 'finished'
      } else {
        showNextRiddle()
      }
    }, 1500)
  }

  const handleClaim = () => {
    sfxRewardClaim()
    emit('complete', score.value)
  }

  onUnmounted(() => {
    if (countdownTimer) clearInterval(countdownTimer)
    if (phaseTimeout) clearTimeout(phaseTimeout)
  })
</script>

<style scoped>
  .lantern-drop {
    animation: lantern-drop 0.6s ease-out;
  }

  @keyframes lantern-drop {
    0% {
      transform: translateY(-20px);
      opacity: 0;
    }
    60% {
      transform: translateY(3px);
      opacity: 1;
    }
    100% {
      transform: translateY(0);
      opacity: 1;
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

  .correct-flash {
    animation: correct-flash 0.4s ease-in-out;
  }

  @keyframes correct-flash {
    0% {
      background-color: transparent;
    }
    30% {
      background-color: oklch(from var(--color-success) l c h / 0.2);
    }
    100% {
      background-color: transparent;
    }
  }

  .wrong-shake {
    animation: wrong-shake 0.4s ease-in-out;
  }

  @keyframes wrong-shake {
    0%,
    100% {
      transform: translateX(0);
    }
    20% {
      transform: translateX(-4px);
    }
    40% {
      transform: translateX(4px);
    }
    60% {
      transform: translateX(-3px);
    }
    80% {
      transform: translateX(3px);
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
