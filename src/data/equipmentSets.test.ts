import { describe, expect, it } from 'vitest'
import { beforeEach } from 'vitest'
import { createTestPinia } from '@/test/pinia'
import { EQUIPMENT_SETS } from '@/data/equipmentSets'
import { FORGE_SET_RECIPES } from '@/data/forgeSets'
import { useInventoryStore } from '@/stores/useInventoryStore'
import type { Quality } from '@/types'

describe('equipmentSets', () => {
  it('套装表覆盖 spec §9.13 全部 setId（24 可锻造 + 公会勇士）', () => {
    expect(EQUIPMENT_SETS.length).toBeGreaterThanOrEqual(24)
    const ids = EQUIPMENT_SETS.map(s => s.id)
    expect(ids).toContain('master_smith_set')
    expect(ids).toContain('mud_king_set')
    expect(ids).toContain('guild_champion_set')
  })

  it('可锻造套均有配方（除公会勇士）', () => {
    const forgeable = EQUIPMENT_SETS.filter(s => s.id !== 'guild_champion_set')
    for (const set of forgeable) {
      const recipes = FORGE_SET_RECIPES.filter(r => r.setId === set.id)
      const expected = (set.pieces.weapon ? 1 : 0) + 3
      expect(recipes.length).toBe(expected)
    }
  })
})

describe('equipSet', () => {
  beforeEach(() => createTestPinia())

  it('按品质最高穿戴 miner_set', () => {
    const inv = useInventoryStore()
    inv.addCraftedRing({
      defId: 'miners_ring',
      recipeId: 'forge_ring_miners_ring',
      quality: 'fine' as Quality,
      affixes: [],
      setId: 'miner_set',
      forgedDay: 1,
      forgeScore: 80
    })
    inv.addCraftedRing({
      defId: 'miners_ring',
      recipeId: 'forge_ring_miners_ring',
      quality: 'supreme' as Quality,
      affixes: [],
      setId: 'miner_set',
      forgedDay: 1,
      forgeScore: 130
    })
    inv.addHat('miner_helmet')
    inv.addShoe('miner_boots')

    const result = inv.equipSet('miner_set')
    expect(result.equipped).toBe(3)
    expect(result.missing).toHaveLength(0)
    expect(inv.equippedRingSlot1).toBe(1)
  })

  it('setId 匹配计入套装件数', () => {
    const inv = useInventoryStore()
    inv.addCraftedHat({
      defId: 'mud_crown',
      recipeId: 'x',
      quality: 'excellent',
      affixes: [],
      setId: 'mud_king_set',
      forgedDay: 1,
      forgeScore: 90
    })
    inv.equipHat(0)
    const active = inv.activeSets.find(s => s.id === 'mud_king_set')
    expect(active?.equippedCount).toBe(1)
  })
})
