import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSystemStore } from '@/stores/useSystemStore'
import {
  adjustStaminaCostForMerit,
  adjustMineDamageForMerit,
  applyMeritCropYieldBonus,
  getMeritTavernGuestBonus
} from './useMeritEffects'

describe('useMeritEffects', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('reduces farming stamina cost with clever_hands buff', () => {
    const store = useSystemStore()
    store.activeBuffs.push({
      id: 'test',
      name: '巧手',
      description: '',
      cost: 0,
      type: 'permanent',
      effect: { type: 'stamina_cost_reduction', value: 0.2 }
    })
    expect(adjustStaminaCostForMerit(10, 'farming')).toBe(8)
    expect(adjustStaminaCostForMerit(10, 'mining')).toBe(10)
  })

  it('reduces mine damage with iron_bone', () => {
    const store = useSystemStore()
    store.activeBuffs.push({
      id: 'test',
      name: '铁骨',
      description: '',
      cost: 0,
      type: 'permanent',
      effect: { type: 'mine_damage_reduction', value: 0.1 }
    })
    expect(adjustMineDamageForMerit(10)).toBe(9)
  })

  it('adds tavern guest bonus as flat count', () => {
    const store = useSystemStore()
    store.activeBuffs.push({
      id: 'test',
      name: '酒肆盛名',
      description: '',
      cost: 0,
      type: 'permanent',
      effect: { type: 'tavern_guests', value: 2 }
    })
    expect(getMeritTavernGuestBonus()).toBe(2)
  })

  it('crop yield bonus can increase quantity', () => {
    const store = useSystemStore()
    store.activeBuffs.push({
      id: 'test',
      name: '丰穰',
      description: '',
      cost: 0,
      type: 'permanent',
      effect: { type: 'crop_yield', value: 1 }
    })
    expect(applyMeritCropYieldBonus(1)).toBeGreaterThanOrEqual(1)
  })
})
