import { describe, expect, it, vi } from 'vitest'
import {
  getFloorBlueprintDropConfig,
  rollForgeBlueprintDrop,
  treasureFindDropMultiplier
} from './forgeBlueprintDrops'
import { getBlueprintById } from './forgeBlueprints'

describe('forgeBlueprintDrops', () => {
  it('120 层不掉图纸', () => {
    expect(getFloorBlueprintDropConfig(120)).toBeNull()
  })

  it('1～19 层有浅层池', () => {
    const cfg = getFloorBlueprintDropConfig(10)
    expect(cfg).not.toBeNull()
    expect(cfg!.pool.length).toBeGreaterThan(0)
    expect(cfg!.pool.every(e => getBlueprintById(e.blueprintId))).toBeTruthy()
  })

  it('treasure_find 加成上限 1.5', () => {
    expect(treasureFindDropMultiplier(0)).toBe(1)
    expect(treasureFindDropMultiplier(0.1)).toBeCloseTo(1.08)
    expect(treasureFindDropMultiplier(1)).toBeLessThanOrEqual(1.5)
  })

  it('roll 在强制命中时返回池内图纸', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const bp = rollForgeBlueprintDrop(15, 'treasure', 0)
    expect(bp).toBeTruthy()
    expect(getBlueprintById(bp!)).toBeDefined()
    vi.restoreAllMocks()
  })
})
