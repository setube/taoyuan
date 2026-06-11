import { describe, expect, it } from 'vitest'
import {
  getBlueprintById,
  getRecipesForBlueprint,
  getShopBlueprintsForSun
} from '@/data/forgeBlueprints'

describe('forgeBlueprints', () => {
  it('bp_boss_frost_queen_set 解锁 4 条配方', () => {
    const bp = getBlueprintById('bp_boss_frost_queen_set')
    expect(bp).toBeDefined()
    expect(bp!.kind).toBe('set')
    expect(bp!.setId).toBe('frost_queen_set')
    expect(bp!.unlocksRecipeIds).toHaveLength(4)

    const recipes = getRecipesForBlueprint('bp_boss_frost_queen_set')
    expect(recipes).toHaveLength(4)
    expect(recipes.map(r => r.targetDefId).sort()).toEqual([
      'frost_queen_circlet',
      'frost_queen_slippers',
      'frost_queen_sting',
      'frost_queen_tiara'
    ])
    expect(recipes.every(r => r.setId === 'frost_queen_set' && r.isSetPiece)).toBe(true)
  })

  it('孙铁匠商店友好后多 2 张图', () => {
    expect(getShopBlueprintsForSun(false)).toHaveLength(5)
    expect(getShopBlueprintsForSun(true)).toHaveLength(7)
  })
})
