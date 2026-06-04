import { beforeEach, describe, expect, it } from 'vitest'
import { createTestPinia } from '@/test/pinia'
import { useAnimalStore } from './useAnimalStore'
import { useInventoryStore } from './useInventoryStore'
import { useGameStore } from './useGameStore'
import { HAY_ITEM_ID } from '@/data'
import type { Animal } from '@/types'

function makeAnimal(id: string, wasFed = false): Animal {
  return {
    id,
    type: 'chicken',
    name: '测试鸡',
    friendship: 0,
    mood: 128,
    daysOwned: 0,
    daysSinceProduct: 0,
    wasFed,
    fedWith: null,
    wasPetted: false,
    hunger: 0,
    sick: false,
    sickDays: 0
  }
}

describe('牧场一键喂食', () => {
  beforeEach(() => {
    createTestPinia()
    useGameStore()
  })

  it('feedAll 用指定饲料批量喂养未喂食动物', () => {
    const animal = useAnimalStore()
    const inv = useInventoryStore()
    animal.animals = [makeAnimal('a1'), makeAnimal('a2'), makeAnimal('a3', true)]
    inv.addItem(HAY_ITEM_ID, 2)

    const { fedCount, noFeedCount } = animal.feedAll(HAY_ITEM_ID)
    expect(fedCount).toBe(2)
    expect(noFeedCount).toBe(0)
    expect(animal.animals[0]!.wasFed).toBe(true)
    expect(animal.animals[0]!.fedWith).toBe(HAY_ITEM_ID)
    expect(animal.animals[1]!.wasFed).toBe(true)
    expect(inv.getItemCount(HAY_ITEM_ID)).toBe(0)
  })

  it('饲料不足时统计无法喂食数量', () => {
    const animal = useAnimalStore()
    const inv = useInventoryStore()
    animal.animals = [makeAnimal('a1'), makeAnimal('a2')]
    inv.addItem(HAY_ITEM_ID, 1)

    const { fedCount, noFeedCount } = animal.feedAll(HAY_ITEM_ID)
    expect(fedCount).toBe(1)
    expect(noFeedCount).toBe(1)
  })
})
