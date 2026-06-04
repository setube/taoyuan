<template>
  <div class="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4" @click.self="emit('close')">
    <div class="game-panel max-w-xs w-full">
      <p class="text-accent text-sm text-center mb-2 tracking-widest">华熙小王许愿井</p>
      <p class="text-xs text-muted text-center mb-3">请输入你现在最想做什么</p>
      <input
        v-model="wishInput"
        class="w-full bg-bg border border-accent/30 rounded-xs px-2 py-2 text-xs text-text focus:border-accent outline-none placeholder:text-muted/40 transition-colors mb-3"
        placeholder="悄悄写下你的心愿……"
        maxlength="32"
        @keyup.enter="submitWish"
      />
      <p v-if="feedback" class="text-xs text-center mb-3" :class="feedbackSuccess ? 'text-success' : 'text-muted'">
        {{ feedback }}
      </p>
      <div class="flex space-x-2">
        <Button class="flex-1 justify-center" @click="emit('close')">取消</Button>
        <Button class="flex-1 justify-center" @click="submitWish">许愿</Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { usePlayerStore } from '@/stores/usePlayerStore'
  import { useTutorialStore } from '@/stores/useTutorialStore'
  import { addLog } from '@/composables/useGameLog'
  import { WISH_WELL_CODES, WISH_WELL_LEGACY_HAOXIANG_FLAG } from '@/data/wishWellCodes'
  import Button from '@/components/game/Button.vue'

  const emit = defineEmits<{ close: [] }>()

  const playerStore = usePlayerStore()
  const tutorialStore = useTutorialStore()
  const wishInput = ref('')
  const feedback = ref('')
  const feedbackSuccess = ref(false)

  const isCodeClaimed = (flag: string, secret: string): boolean => {
    if (tutorialStore.getFlag(flag)) return true
    if (secret === '好想华熙小王' && tutorialStore.getFlag(WISH_WELL_LEGACY_HAOXIANG_FLAG)) return true
    return false
  }

  const submitWish = () => {
    const text = wishInput.value.trim()
    if (!text) {
      feedback.value = '请先写下你的心愿。'
      feedbackSuccess.value = false
      return
    }

    const code = WISH_WELL_CODES.find(c => c.secret === text)
    if (!code) {
      feedback.value = '井水微微荡漾，似乎还在等待那句真心话……'
      feedbackSuccess.value = false
      return
    }

    if (isCodeClaimed(code.flag, code.secret)) {
      feedback.value = '这句心愿许愿井已经听过了，每条口令只能生效一次。'
      feedbackSuccess.value = false
      return
    }

    playerStore.earnMoney(code.reward)
    tutorialStore.setFlag(code.flag)
    if (code.secret === '好想华熙小王') {
      tutorialStore.setFlag(WISH_WELL_LEGACY_HAOXIANG_FLAG)
    }
    feedback.value = `井底泛起金光，你获得了 ${code.reward} 金币！`
    feedbackSuccess.value = true
    addLog(`华熙小王许愿井：「${code.secret}」→ 获得 ${code.reward} 文。`)
  }
</script>
