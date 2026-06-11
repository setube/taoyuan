import { useInventoryStore } from '@/stores/useInventoryStore'

/** 开发/测试口令：咪西咪西华不拉熙，朵朵大王，给！ */
export const MATERIAL_DEV_CHEAT_WOOD_QTY = 9999
export const MATERIAL_DEV_CHEAT_ORE_QTY = 500
export const MATERIAL_DEV_CHEAT_CAPACITY = 5000

export const MATERIAL_DEV_CHEAT_ORE_IDS = [
  'copper_ore',
  'iron_ore',
  'gold_ore',
  'crystal_ore',
  'shadow_ore',
  'void_ore',
  'iridium_ore'
] as const

export function tryMaterialDevCheat(input: string): boolean {
  if (!/咪西咪西/.test(input)) return false
  if (!/朵朵大王/.test(input)) return false
  if (!/给/.test(input)) return false
  return true
}

export function applyMaterialDevCheat(): string {
  const inv = useInventoryStore()
  inv.capacity = MATERIAL_DEV_CHEAT_CAPACITY
  inv.addItem('wood', MATERIAL_DEV_CHEAT_WOOD_QTY)
  for (const oreId of MATERIAL_DEV_CHEAT_ORE_IDS) {
    inv.addItem(oreId, MATERIAL_DEV_CHEAT_ORE_QTY)
  }
  return (
    `朵朵大王收到！木材×${MATERIAL_DEV_CHEAT_WOOD_QTY}，` +
    `各矿石×${MATERIAL_DEV_CHEAT_ORE_QTY}，` +
    `背包容量→${MATERIAL_DEV_CHEAT_CAPACITY}。`
  )
}
