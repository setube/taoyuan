import { describe, expect, it, beforeEach } from 'vitest'
import { createTestPinia } from '@/test/pinia'
import { useInventoryStore } from '@/stores/useInventoryStore'
import {
  applyMaterialDevCheat,
  MATERIAL_DEV_CHEAT_CAPACITY,
  MATERIAL_DEV_CHEAT_ORE_IDS,
  MATERIAL_DEV_CHEAT_ORE_QTY,
  MATERIAL_DEV_CHEAT_WOOD_QTY,
  tryMaterialDevCheat
} from './materialDevCheat'

describe('materialDevCheat', () => {
  beforeEach(() => {
    createTestPinia()
  })

  it('matches 朵朵大王 test phrase', () => {
    expect(tryMaterialDevCheat('咪西咪西华不拉熙，朵朵大王，给！')).toBe(true)
  })

  it('ignores unrelated chat', () => {
    expect(tryMaterialDevCheat('今天去砍树')).toBe(false)
  })

  it('grants wood, ores and expands capacity', () => {
    const inv = useInventoryStore()
    applyMaterialDevCheat()
    expect(inv.capacity).toBe(MATERIAL_DEV_CHEAT_CAPACITY)
    expect(inv.getItemCount('wood')).toBe(MATERIAL_DEV_CHEAT_WOOD_QTY)
    for (const oreId of MATERIAL_DEV_CHEAT_ORE_IDS) {
      expect(inv.getItemCount(oreId)).toBe(MATERIAL_DEV_CHEAT_ORE_QTY)
    }
  })
})
