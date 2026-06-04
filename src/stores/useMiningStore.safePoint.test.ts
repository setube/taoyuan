import { beforeEach, describe, expect, it } from 'vitest'
import { createTestPinia } from '@/test/pinia'
import { useMiningStore } from './useMiningStore'
import { useGameStore } from './useGameStore'

describe('矿洞安全点', () => {
  beforeEach(() => {
    createTestPinia()
    useGameStore()
  })

  it('到达新安全点时提示下次可直接进入的层数', () => {
    const mining = useMiningStore()
    mining.$patch({
      isExploring: true,
      isInSkullCavern: false,
      currentFloor: 4,
      safePointFloor: 0,
      stairsFound: true,
      stairsUsable: true
    })
    const result = mining.goNextFloor()
    expect(result.success).toBe(true)
    expect(mining.currentFloor).toBe(5)
    expect(mining.safePointFloor).toBe(5)
    expect(mining.pendingSafePointEntryFloor).toBe(6)
    mining.clearSafePointNotice()
    expect(mining.pendingSafePointEntryFloor).toBeNull()
  })

  it('可从已解锁安全点直接进入对应层数', () => {
    const mining = useMiningStore()
    mining.safePointFloor = 10
    mining.enterMine(10)
    expect(mining.currentFloor).toBe(11)
    expect(mining.getUnlockedSafePoints()).toEqual([0, 5, 10])
  })
})
