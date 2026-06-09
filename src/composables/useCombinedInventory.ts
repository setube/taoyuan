import { useInventoryStore } from '@/stores/useInventoryStore'
import { useWarehouseStore } from '@/stores/useWarehouseStore'
import type { Quality } from '@/types'

export interface MaterialStockBreakdown {
  inventory: number
  warehouse: number
  total: number
}

/** 背包中某物品数量 */
export const getInventoryItemCount = (itemId: string, quality?: Quality): number => {
  return useInventoryStore().getItemCount(itemId, quality)
}

/** 仓库所有箱子中某物品数量（未解锁为 0） */
export const getWarehouseItemCount = (itemId: string, quality?: Quality): number => {
  const wh = useWarehouseStore()
  if (!wh.unlocked) return 0
  let total = 0
  for (const chest of wh.chests) {
    total += wh.getChestItemCount(chest.id, itemId, quality)
  }
  return total
}

/** 背包 + 仓库数量明细 */
export const getMaterialStockBreakdown = (itemId: string, quality?: Quality): MaterialStockBreakdown => {
  const inventory = getInventoryItemCount(itemId, quality)
  const warehouse = getWarehouseItemCount(itemId, quality)
  return { inventory, warehouse, total: inventory + warehouse }
}

/** 合计背包 + 仓库所有箱子中某物品数量 */
export const getCombinedItemCount = (itemId: string, quality?: Quality): number => {
  return getMaterialStockBreakdown(itemId, quality).total
}

/** 材料是否足够（含仓库） */
export const hasEnoughMaterial = (itemId: string, quantity: number, quality?: Quality): boolean => {
  return getCombinedItemCount(itemId, quality) >= quantity
}

/** 批量材料是否足够 */
export const materialsAreSufficient = (materials: { itemId: string; quantity: number }[]): boolean => {
  return materials.every(m => hasEnoughMaterial(m.itemId, m.quantity))
}

/** 背包+仓库所有箱子是否合计拥有足够数量 */
export const hasCombinedItem = (itemId: string, quantity: number = 1): boolean => getCombinedItemCount(itemId) >= quantity

/** 优先从背包消耗，不足部分从仓库箱子消耗（虚空原料箱优先） */
export const removeCombinedItem = (itemId: string, quantity: number = 1, quality?: Quality): boolean => {
  const inv = useInventoryStore()
  const wh = useWarehouseStore()

  // 统计总数
  const invCount = inv.getItemCount(itemId, quality)
  let warehouseTotal = 0
  const chestCounts: { id: string; count: number }[] = []
  if (wh.unlocked) {
    // 虚空原料箱排在最前面优先消耗
    const voidInput = wh.getVoidInputChest()
    const ordered = voidInput ? [voidInput, ...wh.chests.filter(c => c.id !== voidInput.id)] : [...wh.chests]
    for (const chest of ordered) {
      const cnt = wh.getChestItemCount(chest.id, itemId, quality)
      if (cnt > 0) {
        chestCounts.push({ id: chest.id, count: cnt })
        warehouseTotal += cnt
      }
    }
  }

  if (invCount + warehouseTotal < quantity) return false

  let remaining = quantity
  // 先从背包消耗
  const fromInv = Math.min(remaining, invCount)
  if (fromInv > 0) {
    inv.removeItem(itemId, fromInv, quality)
    remaining -= fromInv
  }
  // 再从箱子消耗（虚空原料箱已排在前面）
  for (const cc of chestCounts) {
    if (remaining <= 0) break
    const take = Math.min(remaining, cc.count)
    wh.removeItemFromChest(cc.id, itemId, take, quality)
    remaining -= take
  }

  return true
}

/** 查找背包+仓库所有箱子中某物品的最低品质 */
export const getLowestCombinedQuality = (itemId: string): Quality => {
  const inv = useInventoryStore()
  const wh = useWarehouseStore()
  const order: Quality[] = ['normal', 'fine', 'excellent', 'supreme']
  for (const q of order) {
    if (inv.getItemCount(itemId, q) > 0) return q
    if (wh.unlocked) {
      for (const chest of wh.chests) {
        if (wh.getChestItemCount(chest.id, itemId, q) > 0) return q
      }
    }
  }
  return 'normal'
}

/** 检查背包中是否有温室来源的指定果实 */
export const hasGreenhouseFruit = (itemId: string): boolean => {
  const inv = useInventoryStore()
  for (const slot of inv.items) {
    if (slot.itemId === itemId && slot.fromGreenhouse) return true
  }
  return false
}
