import { useInventoryStore } from '@/stores/useInventoryStore'
import { useWarehouseStore } from '@/stores/useWarehouseStore'
import { getItemById } from '@/data/items'
import { getAddedValue } from '@/composables/useItemStacks'
import type { InventoryItem, Quality } from '@/types'

/** 背包 + 仓库按物品、品质合计的一条 */
export interface CombinedStack {
  itemId: string
  quality: Quality
  quantity: number
}

/** 背包 + 仓库所有箱子按物品、品质合计（背包里有的排在前面） */
export const getCombinedStacks = (filter: (stack: InventoryItem) => boolean): CombinedStack[] => {
  const inv = useInventoryStore()
  const wh = useWarehouseStore()
  const totals = new Map<string, CombinedStack>()
  const pools = wh.unlocked ? [inv.items, ...wh.chests.map(c => c.items)] : [inv.items]
  for (const pool of pools) {
    for (const stack of pool) {
      if (!filter(stack)) continue
      const key = `${stack.itemId}:${stack.quality}`
      const prev = totals.get(key)
      totals.set(key, { itemId: stack.itemId, quality: stack.quality, quantity: (prev?.quantity ?? 0) + stack.quantity })
    }
  }
  return [...totals.values()]
}

/** 可送礼、供奉的物品：背包+仓库合计，种子除外 */
export const getGiftableStacks = (): CombinedStack[] =>
  getCombinedStacks(stack => {
    const def = getItemById(stack.itemId)
    return !!def && def.category !== 'seed'
  })

/** 合计背包 + 仓库所有箱子中某物品数量 */
export const getCombinedItemCount = (itemId: string, quality?: Quality): number => {
  const inv = useInventoryStore()
  const wh = useWarehouseStore()
  let total = inv.getItemCount(itemId, quality)
  if (wh.unlocked) {
    for (const chest of wh.chests) {
      total += wh.getChestItemCount(chest.id, itemId, quality)
    }
  }
  return total
}

/** 背包+仓库所有箱子是否合计拥有足够数量 */
export const hasCombinedItem = (itemId: string, quantity: number = 1): boolean => getCombinedItemCount(itemId) >= quantity

const QUALITY_ORDER: Quality[] = ['normal', 'fine', 'excellent', 'supreme']

/** 参与合计扣除的箱子：虚空原料箱在前，其余按顺序（仓库未解锁时为空） */
const getConsumeChests = () => {
  const wh = useWarehouseStore()
  if (!wh.unlocked) return []
  const voidInput = wh.getVoidInputChest()
  return voidInput ? [voidInput, ...wh.chests.filter(c => c.id !== voidInput.id)] : [...wh.chests]
}

/** 背包、箱子里该物品出现过的陈酿增值档（含 0），从低到高 */
const getAddedValueTiers = (itemId: string, chests: { items: InventoryItem[] }[]): number[] => {
  const values = [useInventoryStore().items, ...chests.map(c => c.items)].flatMap(pool =>
    pool.filter(s => s.itemId === itemId).map(getAddedValue)
  )
  return [...new Set([0, ...values])].sort((a, b) => a - b)
}

/**
 * 背包+仓库合计扣除。无陈酿增值的先用，再按增值从低到高；不指定品质时同一增值内从低品质用起。
 * 同一档内按背包 → 虚空原料箱 → 其余箱子扣，仓库里还有普通的酒时不会先用掉背包里的陈酿酒。
 */
export const removeCombinedItem = (itemId: string, quantity: number = 1, quality?: Quality): boolean => {
  if (getCombinedItemCount(itemId, quality) < quantity) return false

  const inv = useInventoryStore()
  const wh = useWarehouseStore()
  const chests = getConsumeChests()
  const qualities = quality !== undefined ? [quality] : QUALITY_ORDER
  let remaining = quantity
  for (const tier of getAddedValueTiers(itemId, chests)) {
    for (const q of qualities) {
      const fromInv = Math.min(remaining, inv.getItemCount(itemId, q, tier))
      if (fromInv > 0) {
        inv.removeItem(itemId, fromInv, q, tier)
        remaining -= fromInv
      }
      for (const chest of chests) {
        if (remaining <= 0) return true
        const take = Math.min(remaining, wh.getChestItemCount(chest.id, itemId, q, tier))
        if (take > 0) {
          wh.removeItemFromChest(chest.id, itemId, take, q, tier)
          remaining -= take
        }
      }
      if (remaining <= 0) return true
    }
  }

  return true
}

/** 背包+仓库里最先会被 removeCombinedItem 用掉的那件的品质（最低增值档里的最低品质） */
export const getLowestCombinedQuality = (itemId: string): Quality => {
  const inv = useInventoryStore()
  const wh = useWarehouseStore()
  const chests = getConsumeChests()
  for (const tier of getAddedValueTiers(itemId, chests)) {
    for (const q of QUALITY_ORDER) {
      if (inv.getItemCount(itemId, q, tier) > 0) return q
      if (chests.some(c => wh.getChestItemCount(c.id, itemId, q, tier) > 0)) return q
    }
  }
  return 'normal'
}
