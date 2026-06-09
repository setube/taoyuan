import { beforeEach, describe, expect, it } from 'vitest'
import { createTestPinia } from '@/test/pinia'
import { useTavernStore } from '@/stores/useTavernStore'
import { useHomeStore } from '@/stores/useHomeStore'
import { usePlayerStore } from '@/stores/usePlayerStore'
import { useInventoryStore } from '@/stores/useInventoryStore'
import { runTavernEndDay } from './tavernSimulate'

describe('tavernSimulate', () => {
  beforeEach(() => {
    createTestPinia()
    useHomeStore().farmhouseLevel = 3
    const player = usePlayerStore()
    player.money = 200000
    const inv = useInventoryStore()
    inv.addItem('wood', 200)
    inv.addItem('iron_bar', 20)
    inv.addItem('corn_wine', 10)
  })

  it('todayMode manual 时不演算', () => {
    const tavern = useTavernStore()
    tavern.buildTavern()
    tavern.todayMode = 'manual'
    expect(runTavernEndDay()).toBeNull()
  })

  it('auto 模式工资只扣一次', () => {
    const tavern = useTavernStore()
    tavern.buildTavern()
    tavern.tavernLevel = 2
    tavern.menuSlots = [
      { type: 'wine', itemId: 'corn_wine', priceMult: 1 }
    ]
    tavern.employees.push({
      id: 'emp_test_waiter',
      name: '小测',
      role: 'waiter',
      cooking: 3,
      eq: 4,
      iq: 3,
      stamina: 90,
      maxStamina: 90,
      salary: 120,
      onDuty: true
    })
    tavern.todayMode = 'auto'

    const player = usePlayerStore()
    const before = player.money
    const result = runTavernEndDay()

    expect(result).not.toBeNull()
    expect(player.money).toBe(before + result!.revenue - result!.wages)
  })
})
