<template>
  <div>
    <div class="flex items-center space-x-1.5 text-sm text-accent mb-1">
      <Landmark :size="14" />
      <span>钱庄</span>
    </div>
    <p class="text-xs text-muted mb-3">
      可借 100～3000 文，期限 {{ LOAN_TERM_DAYS }} 日，日息 {{ LOAN_DAILY_RATE * 100 }}%，累计利息上限
      {{ LOAN_MAX_INTEREST_RATE * 100 }}%。逾期后休息仅恢复 50% 体力。
    </p>

    <div class="border border-accent/20 rounded-xs p-3 mb-3">
      <p class="text-xs text-muted mb-1">手头铜钱</p>
      <p class="text-sm text-accent">{{ playerStore.money }} 文</p>
    </div>

    <template v-if="bankStore.hasActiveLoan">
      <div
        class="border rounded-xs p-3 mb-3 space-y-2"
        :class="bankStore.isOverdue() ? 'border-danger/40 bg-danger/5' : 'border-accent/20'"
      >
        <p class="text-sm text-accent">当前借款</p>
        <div class="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
          <span class="text-muted">本金</span>
          <span>{{ bankStore.loan?.principal }} 文</span>
          <span class="text-muted">累计利息</span>
          <span>{{ bankStore.loan?.interestAccrued }} 文</span>
          <span class="text-muted">应还合计</span>
          <span class="text-accent">{{ bankStore.totalOwed }} 文</span>
          <span class="text-muted">已借天数</span>
          <span>{{ bankStore.loan?.daysElapsed }} 日</span>
          <span class="text-muted">剩余期限</span>
          <span :class="bankStore.isOverdue() ? 'text-danger' : ''">
            {{ bankStore.isOverdue() ? '已逾期' : `${bankStore.daysRemaining} 日` }}
          </span>
          <span class="text-muted">今日利息</span>
          <span>约 {{ bankStore.dailyInterestAmount }} 文/日</span>
          <span class="text-muted">利息上限</span>
          <span>{{ bankStore.maxInterestCap }} 文</span>
        </div>
        <p v-if="bankStore.isOverdue()" class="text-xs text-danger">已逾期：睡觉只能恢复 50% 体力，请尽快还款。</p>
        <p v-else-if="bankStore.daysRemaining <= 1" class="text-xs text-muted">即将到期，请留意还款。</p>
      </div>
      <Button
        class="w-full justify-center !bg-accent !text-bg"
        :disabled="playerStore.money < bankStore.totalOwed"
        @click="handleRepay"
      >
        还清 {{ bankStore.totalOwed }} 文
      </Button>
      <p v-if="playerStore.money < bankStore.totalOwed" class="text-xs text-danger text-center mt-2">铜钱不足，无法还款</p>
    </template>

    <template v-else>
      <p class="text-xs text-muted mb-2">选择借款额度（同时只能有一笔）</p>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <Button
          v-for="amt in LOAN_AMOUNTS"
          :key="amt"
          class="justify-center"
          @click="handleBorrow(amt)"
        >
          借 {{ amt }} 文
        </Button>
      </div>
    </template>

    <p v-if="feedback" class="text-xs text-center mt-3" :class="feedbackOk ? 'text-success' : 'text-muted'">{{ feedback }}</p>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { Landmark } from 'lucide-vue-next'
  import { useBankStore } from '@/stores/useBankStore'
  import { usePlayerStore } from '@/stores/usePlayerStore'
  import { LOAN_AMOUNTS, LOAN_TERM_DAYS, LOAN_DAILY_RATE, LOAN_MAX_INTEREST_RATE, type LoanAmount } from '@/data/bank'
  import Button from '@/components/game/Button.vue'

  const bankStore = useBankStore()
  const playerStore = usePlayerStore()

  const feedback = ref('')
  const feedbackOk = ref(false)

  const handleBorrow = (amount: LoanAmount) => {
    const result = bankStore.borrow(amount)
    feedback.value = result.message
    feedbackOk.value = result.success
  }

  const handleRepay = () => {
    const result = bankStore.repay()
    feedback.value = result.message
    feedbackOk.value = result.success
  }
</script>
