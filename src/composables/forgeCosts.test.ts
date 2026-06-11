import { describe, expect, it, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import {
  FORGE_STAMINA_BASE,
  getForgeStaminaCost,
  getForgeTimeHours,
  getForgeToolUpgradeStamina
} from '@/composables/forgeCosts'
import { ACTION_TIME_COSTS } from '@/data/timeConstants'

describe('forgeCosts', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('基础体力与随等级减免', () => {
    expect(getForgeStaminaCost(0)).toBe(FORGE_STAMINA_BASE)
    expect(getForgeStaminaCost(10)).toBe(18)
    expect(getForgeToolUpgradeStamina(0)).toBe(20)
  })

  it('打造时间基础 2 游戏小时', () => {
    expect(getForgeTimeHours(0)).toBe(ACTION_TIME_COSTS.forge)
    expect(getForgeTimeHours(10)).toBe(ACTION_TIME_COSTS.forge)
  })
})
