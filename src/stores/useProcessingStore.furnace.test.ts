import { beforeEach, describe, expect, it } from 'vitest'
import { createTestPinia } from '@/test/pinia'
import { useProcessingStore } from './useProcessingStore'
import { useInventoryStore } from './useInventoryStore'
import { useGameStore } from './useGameStore'

describe('useProcessingStore 熔炉批量投入', () => {
  beforeEach(() => {
    createTestPinia()
    useGameStore()
  })

  it('startProcessing 支持 1～5 个矿石并记录 inputAmount', () => {
    const proc = useProcessingStore()
    proc.machines.push({
      machineType: 'furnace',
      recipeId: null,
      inputItemId: null,
      daysProcessed: 0,
      totalDays: 0,
      ready: false
    })

    const inv = useInventoryStore()
    inv.addItem('copper_ore', 10)

    expect(proc.startProcessing(0, 'smelt_copper', undefined, 3)).toBe(true)
    expect(proc.machines[0]!.inputAmount).toBe(3)
    expect(inv.getItemCount('copper_ore')).toBe(7)

    expect(proc.startProcessing(0, 'smelt_copper', undefined, 99)).toBe(false)
  })
})
