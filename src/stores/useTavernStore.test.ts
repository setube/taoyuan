import { beforeEach, describe, expect, it } from 'vitest'
import { createTestPinia } from '@/test/pinia'
import { useTavernStore } from './useTavernStore'
import { useHomeStore } from './useHomeStore'
import { usePlayerStore } from './usePlayerStore'
import { useInventoryStore } from './useInventoryStore'
import { useSkillStore } from './useSkillStore'

describe('useTavernStore', () => {
  beforeEach(() => {
    createTestPinia()
    const home = useHomeStore()
    home.farmhouseLevel = 3
    const player = usePlayerStore()
    player.money = 200000
    const inv = useInventoryStore()
    inv.addItem('wood', 200)
    inv.addItem('iron_bar', 20)
  })

  it('旧档缺省未扩建', () => {
    const store = useTavernStore()
    store.deserialize({})
    expect(store.tavernLevel).toBe(0)
    expect(store.isBuilt).toBe(false)
  })

  it('农舍 Lv3 可建造酒肆', () => {
    const store = useTavernStore()
    expect(store.buildTavern()).toBe(true)
    expect(store.tavernLevel).toBe(1)
    expect(store.menuSlots.length).toBeGreaterThan(0)
  })

  it('建造时可自定义店名', () => {
    const store = useTavernStore()
    expect(store.buildTavern('陈记酒肆')).toBe(true)
    expect(store.displayName).toBe('陈记酒肆')
    expect(store.tierName).toBe('前厅酒肆')
  })

  it('旧档无 customName 时显示扩建等级名', () => {
    const store = useTavernStore()
    store.deserialize({ tavernLevel: 1, menuSlots: [] })
    expect(store.displayName).toBe('前厅酒肆')
    expect(store.customName).toBe('')
  })

  it('亲自营业后厨体力受 cooking 等级减免', () => {
    const store = useTavernStore()
    store.buildTavern()
    useInventoryStore().addItem('corn_wine', 3)
    store.setMenuSlot(0, 'corn_wine')
    const skillStore = useSkillStore()
    skillStore.getSkill('cooking').level = 10

    store.manualSession = {
      step: 'check',
      queue: [{ isNpc: false, slotIndex: 0, favoriteMatch: false }],
      currentIndex: 0,
      todayEarnings: 0,
      todayTips: 0,
      servedCount: 0
    }
    const player = usePlayerStore()
    const before = player.stamina

    store.advanceManualStep() // check -> serve
    store.advanceManualStep() // serve, 4
    store.advanceManualStep() // kitchen, 8 with cooking reduction => 7

    expect(before - player.stamina).toBe(11)
  })
})
