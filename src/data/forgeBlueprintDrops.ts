/** §9.11 矿洞随机图纸掉落池 */

export interface BlueprintDropPoolEntry {
  blueprintId: string
  weight: number
}

export interface FloorBlueprintDropConfig {
  monsterBaseRate: number
  treasureBaseRate: number
  pool: BlueprintDropPoolEntry[]
}

const pool = (...entries: BlueprintDropPoolEntry[]): BlueprintDropPoolEntry[] => entries

/** 按层段配置（floor 1～119；120 层不掉图纸） */
export const FLOOR_BLUEPRINT_DROPS: { minFloor: number; maxFloor: number; config: FloorBlueprintDropConfig }[] = [
  {
    minFloor: 1,
    maxFloor: 19,
    config: {
      monsterBaseRate: 0.008,
      treasureBaseRate: 0.04,
      pool: pool(
        { blueprintId: 'bp_shop_copper_ring', weight: 3 },
        { blueprintId: 'bp_shop_copper_band', weight: 2 },
        { blueprintId: 'bp_shop_copper_sword', weight: 2 },
        { blueprintId: 'bp_drop_miner_ring', weight: 2 },
        { blueprintId: 'bp_drop_miner_helmet', weight: 2 },
        { blueprintId: 'bp_drop_miner_boots', weight: 1 },
        { blueprintId: 'bp_drop_forager_ring', weight: 2 },
        { blueprintId: 'bp_drop_forager_hood', weight: 1 },
        { blueprintId: 'bp_drop_forager_boots', weight: 1 }
      )
    }
  },
  {
    minFloor: 20,
    maxFloor: 39,
    config: {
      monsterBaseRate: 0.01,
      treasureBaseRate: 0.05,
      pool: pool(
        { blueprintId: 'bp_shop_iron_blade', weight: 3 },
        { blueprintId: 'bp_shop_miner_ring', weight: 2 },
        { blueprintId: 'bp_fisher_partial', weight: 2 },
        { blueprintId: 'bp_drop_mud_ring', weight: 2 },
        { blueprintId: 'bp_drop_mud_hat', weight: 2 },
        { blueprintId: 'bp_drop_mud_shoe', weight: 2 },
        { blueprintId: 'bp_drop_obsidian_ring', weight: 2 },
        { blueprintId: 'bp_drop_obsidian_hat', weight: 1 },
        { blueprintId: 'bp_drop_obsidian_shoe', weight: 1 }
      )
    }
  },
  {
    minFloor: 40,
    maxFloor: 59,
    config: {
      monsterBaseRate: 0.012,
      treasureBaseRate: 0.06,
      pool: pool(
        { blueprintId: 'bp_drop_frost_ring', weight: 3 },
        { blueprintId: 'bp_drop_frost_hat', weight: 2 },
        { blueprintId: 'bp_drop_frost_shoe', weight: 2 },
        { blueprintId: 'bp_drop_dragon_warrior_ring', weight: 2 },
        { blueprintId: 'bp_drop_dragon_warrior_hat', weight: 2 },
        { blueprintId: 'bp_drop_dragon_warrior_shoe', weight: 1 }
      )
    }
  },
  {
    minFloor: 60,
    maxFloor: 79,
    config: {
      monsterBaseRate: 0.012,
      treasureBaseRate: 0.06,
      pool: pool(
        { blueprintId: 'bp_drop_lava_ring', weight: 3 },
        { blueprintId: 'bp_drop_lava_hat', weight: 2 },
        { blueprintId: 'bp_drop_lava_shoe', weight: 2 },
        { blueprintId: 'bp_drop_phoenix_ring', weight: 2 },
        { blueprintId: 'bp_drop_harvest_ring', weight: 2 },
        { blueprintId: 'bp_drop_harvest_hat', weight: 1 }
      )
    }
  },
  {
    minFloor: 80,
    maxFloor: 99,
    config: {
      monsterBaseRate: 0.015,
      treasureBaseRate: 0.08,
      pool: pool(
        { blueprintId: 'bp_drop_crystal_ring', weight: 3 },
        { blueprintId: 'bp_drop_crystal_hat', weight: 2 },
        { blueprintId: 'bp_drop_crystal_shoe', weight: 2 },
        { blueprintId: 'bp_drop_shadow_sov_ring', weight: 2 },
        { blueprintId: 'bp_drop_shadow_sov_hat', weight: 2 }
      )
    }
  },
  {
    minFloor: 100,
    maxFloor: 119,
    config: {
      monsterBaseRate: 0.015,
      treasureBaseRate: 0.08,
      pool: pool(
        { blueprintId: 'bp_drop_shadow_sov_shoe', weight: 3 },
        { blueprintId: 'bp_shop_merchant_ring', weight: 2 },
        { blueprintId: 'bp_drop_phoenix_hat', weight: 2 },
        { blueprintId: 'bp_drop_phoenix_shoe', weight: 2 }
      )
    }
  }
]

export const getFloorBlueprintDropConfig = (floor: number): FloorBlueprintDropConfig | null => {
  if (floor >= 120) return null
  for (const seg of FLOOR_BLUEPRINT_DROPS) {
    if (floor >= seg.minFloor && floor <= seg.maxFloor) return seg.config
  }
  return null
}

/** treasure_find 每 10% 使掉率 ×1.08，上限 ×1.5 */
export const treasureFindDropMultiplier = (treasureFind: number): number => {
  const steps = Math.floor(treasureFind / 0.1)
  return Math.min(1.5, Math.pow(1.08, steps))
}

const pickWeighted = (poolEntries: BlueprintDropPoolEntry[]): string | null => {
  const total = poolEntries.reduce((s, e) => s + e.weight, 0)
  if (total <= 0) return null
  let roll = Math.random() * total
  for (const entry of poolEntries) {
    roll -= entry.weight
    if (roll <= 0) return entry.blueprintId
  }
  return poolEntries[poolEntries.length - 1]!.blueprintId
}

/**
 * 矿洞图纸掉落 roll
 * @param floor 当前层
 * @param source 怪物击杀或宝箱
 * @param treasureFind 寻宝加成（0.1 = 10%）
 */
export const rollForgeBlueprintDrop = (
  floor: number,
  source: 'monster' | 'treasure',
  treasureFind = 0
): string | null => {
  const cfg = getFloorBlueprintDropConfig(floor)
  if (!cfg || cfg.pool.length === 0) return null

  const baseRate = source === 'treasure' ? cfg.treasureBaseRate : cfg.monsterBaseRate
  const rate = baseRate * treasureFindDropMultiplier(treasureFind)
  if (Math.random() >= rate) return null

  return pickWeighted(cfg.pool)
}
