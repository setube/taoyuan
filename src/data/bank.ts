/** 钱庄借款常量 */
export const LOAN_AMOUNTS = [100, 500, 1000, 2000, 3000] as const

export type LoanAmount = (typeof LOAN_AMOUNTS)[number]

/** 还款期限（游戏日） */
export const LOAN_TERM_DAYS = 7

/** 每日利息（本金比例） */
export const LOAN_DAILY_RATE = 0.01

/** 累计利息上限（本金比例） */
export const LOAN_MAX_INTEREST_RATE = 0.1
