import { describe, expect, it } from 'vitest'
import {
  LOAN_AMOUNTS,
  LOAN_TERM_DAYS,
  LOAN_DAILY_RATE,
  LOAN_MAX_INTEREST_RATE
} from './bank'

describe('钱庄借款常量', () => {
  it('可选借款额度为 100～3000 文', () => {
    expect(LOAN_AMOUNTS).toEqual([100, 500, 1000, 2000, 3000])
    expect(Math.min(...LOAN_AMOUNTS)).toBe(100)
    expect(Math.max(...LOAN_AMOUNTS)).toBe(3000)
  })

  it('还款期限为 7 游戏日', () => {
    expect(LOAN_TERM_DAYS).toBe(7)
  })

  it('日息 1%、累计利息上限为本金 10%', () => {
    expect(LOAN_DAILY_RATE).toBe(0.01)
    expect(LOAN_MAX_INTEREST_RATE).toBe(0.1)
  })
})
