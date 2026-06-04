import { beforeEach, describe, expect, it } from 'vitest'
import { createTestPinia } from '@/test/pinia'
import { useBankStore, toAbsoluteDay } from './useBankStore'
import { useGameStore } from './useGameStore'
import { usePlayerStore } from './usePlayerStore'
import { LOAN_MAX_INTEREST_RATE, LOAN_TERM_DAYS } from '@/data/bank'

describe('useBankStore', () => {
  beforeEach(() => {
    createTestPinia()
    useGameStore()
  })

  it('toAbsoluteDay 按年季日换算绝对日序', () => {
    expect(toAbsoluteDay(1, 'spring', 1)).toBe(0)
    expect(toAbsoluteDay(1, 'spring', 8)).toBe(7)
    expect(toAbsoluteDay(1, 'summer', 1)).toBe(28)
  })

  it('可借入额度并入账', () => {
    const bank = useBankStore()
    const player = usePlayerStore()
    const before = player.money
    const r = bank.borrow(500)
    expect(r.success).toBe(true)
    expect(bank.hasActiveLoan).toBe(true)
    expect(bank.loan?.principal).toBe(500)
    expect(player.money).toBe(before + 500)
  })

  it('日结计息且累计不超过本金 10%', () => {
    const bank = useBankStore()
    bank.borrow(1000)
    for (let i = 0; i < 12; i++) {
      bank.processEndOfDay()
    }
    const cap = Math.floor(1000 * LOAN_MAX_INTEREST_RATE)
    expect(bank.loan!.interestAccrued).toBe(cap)
  })

  it('超过 7 日未还清视为逾期', () => {
    const bank = useBankStore()
    const game = useGameStore()
    game.$patch({ year: 1, season: 'spring', day: 1 })
    bank.borrow(100)
    expect(bank.isOverdue()).toBe(false)
    game.day = 1 + LOAN_TERM_DAYS + 1
    expect(bank.isOverdue()).toBe(true)
  })
})
