import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Season } from '@/types'
import { useGameStore } from './useGameStore'
import { usePlayerStore } from './usePlayerStore'
import { addLog } from '@/composables/useGameLog'
import {
  LOAN_AMOUNTS,
  LOAN_TERM_DAYS,
  LOAN_DAILY_RATE,
  LOAN_MAX_INTEREST_RATE,
  type LoanAmount
} from '@/data/bank'

const SEASON_ORDER: Season[] = ['spring', 'summer', 'autumn', 'winter']

export interface ActiveLoan {
  principal: number
  interestAccrued: number
  daysElapsed: number
  borrowedAtAbsoluteDay: number
}

/** 将游戏日期转为绝对日序（用于期限计算） */
export const toAbsoluteDay = (year: number, season: Season, day: number): number => {
  return (year - 1) * 112 + SEASON_ORDER.indexOf(season) * 28 + (day - 1)
}

export const useBankStore = defineStore('bank', () => {
  const loan = ref<ActiveLoan | null>(null)

  const hasActiveLoan = computed(() => loan.value !== null)

  const totalOwed = computed(() => {
    if (!loan.value) return 0
    return loan.value.principal + loan.value.interestAccrued
  })

  const maxInterestCap = computed(() => {
    if (!loan.value) return 0
    return Math.floor(loan.value.principal * LOAN_MAX_INTEREST_RATE)
  })

  const dailyInterestAmount = computed(() => {
    if (!loan.value) return 0
    return Math.floor(loan.value.principal * LOAN_DAILY_RATE)
  })

  const dueAbsoluteDay = computed(() => {
    if (!loan.value) return 0
    return loan.value.borrowedAtAbsoluteDay + LOAN_TERM_DAYS
  })

  const currentAbsoluteDay = (): number => {
    const g = useGameStore()
    return toAbsoluteDay(g.year, g.season, g.day)
  }

  const daysRemaining = computed(() => {
    if (!loan.value) return 0
    return Math.max(0, dueAbsoluteDay.value - currentAbsoluteDay())
  })

  const isOverdue = (): boolean => {
    if (!loan.value) return false
    return currentAbsoluteDay() > dueAbsoluteDay.value
  }

  const canBorrow = (amount: LoanAmount): { ok: boolean; message?: string } => {
    if (loan.value) return { ok: false, message: '已有未结清的借款，请先还款。' }
    if (!LOAN_AMOUNTS.includes(amount)) return { ok: false, message: '无效的借款额度。' }
    return { ok: true }
  }

  const borrow = (amount: LoanAmount): { success: boolean; message: string } => {
    const check = canBorrow(amount)
    if (!check.ok) return { success: false, message: check.message! }

    const g = useGameStore()
    const playerStore = usePlayerStore()
    const abs = toAbsoluteDay(g.year, g.season, g.day)

    loan.value = {
      principal: amount,
      interestAccrued: 0,
      daysElapsed: 0,
      borrowedAtAbsoluteDay: abs
    }
    playerStore.earnMoney(amount)
    addLog(`钱庄借入${amount}文，${LOAN_TERM_DAYS}日内还清（日息${LOAN_DAILY_RATE * 100}%，总息上限${LOAN_MAX_INTEREST_RATE * 100}%）。`)
    return { success: true, message: `借入${amount}文，请按期还款。` }
  }

  /** 日结时计息（在 nextDay 之前调用） */
  const processEndOfDay = (): void => {
    if (!loan.value) return

    const cap = Math.floor(loan.value.principal * LOAN_MAX_INTEREST_RATE)
    const daily = Math.floor(loan.value.principal * LOAN_DAILY_RATE)
    const remaining = cap - loan.value.interestAccrued

    if (remaining > 0 && daily > 0) {
      const add = Math.min(daily, remaining)
      loan.value.interestAccrued += add
      addLog(`钱庄计息：+${add}文（累计利息${loan.value.interestAccrued}文）。`)
    }

    loan.value.daysElapsed += 1

    if (currentAbsoluteDay() > dueAbsoluteDay.value) {
      addLog('钱庄借款已逾期！今日休息仅能恢复50%体力，请尽快还款。')
    }
  }

  const repay = (): { success: boolean; message: string } => {
    if (!loan.value) return { success: false, message: '当前没有借款。' }

    const owed = totalOwed.value
    const playerStore = usePlayerStore()
    if (!playerStore.spendMoney(owed)) {
      return { success: false, message: `还款需要${owed}文，铜钱不足。` }
    }

    const interest = loan.value.interestAccrued
    const principal = loan.value.principal
    loan.value = null
    addLog(`已还清钱庄借款：本金${principal}文，利息${interest}文，合计${owed}文。`)
    return { success: true, message: `还款成功，共支付${owed}文。` }
  }

  const serialize = () => ({
    loan: loan.value
  })

  const deserialize = (data: { loan?: ActiveLoan | null } | null | undefined) => {
    loan.value = data?.loan ?? null
  }

  return {
    loan,
    hasActiveLoan,
    totalOwed,
    maxInterestCap,
    dailyInterestAmount,
    daysRemaining,
    dueAbsoluteDay,
    isOverdue,
    canBorrow,
    borrow,
    processEndOfDay,
    repay,
    serialize,
    deserialize
  }
})
