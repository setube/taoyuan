import type { InventoryItem, Quality } from '@/types'

const MAX_STACK = 999
const QUALITY_ORDER: Quality[] = ['normal', 'fine', 'excellent', 'supreme']

/** 规范化陈酿增值（文/件）：非正数一律视为 0 */
export const normalizeAddedValue = (value?: number): number => (typeof value === 'number' && value > 0 ? Math.floor(value) : 0)

/** 物品栈的陈酿增值（文/件），没有则为 0 */
export const getAddedValue = (stack: { addedValue?: number }): number => normalizeAddedValue(stack.addedValue)

/** 物品、品质、陈酿增值都相同才算同一栈，才能合并 */
export const isSameStack = (stack: InventoryItem, itemId: string, quality: Quality, addedValue: number): boolean =>
  stack.itemId === itemId && stack.quality === quality && getAddedValue(stack) === addedValue

/** 物品栈的唯一键（列表 key / 选中态用） */
export const getStackKey = (stack: InventoryItem): string => `${stack.itemId}:${stack.quality}:${getAddedValue(stack)}`

/** 新建物品栈，无增值时不写 addedValue 字段 */
export const makeStack = (itemId: string, quantity: number, quality: Quality, addedValue: number): InventoryItem =>
  addedValue > 0 ? { itemId, quantity, quality, addedValue } : { itemId, quantity, quality }

/** 放入物品：先补满同栈，再开新栈（总格数不超过 capacity），返回放不下的数量 */
export const putIntoStacks = (
  pool: InventoryItem[],
  capacity: number,
  itemId: string,
  quantity: number,
  quality: Quality,
  addedValue: number
): number => {
  let remaining = quantity
  for (const slot of pool) {
    if (remaining <= 0) break
    if (isSameStack(slot, itemId, quality, addedValue) && slot.quantity < MAX_STACK) {
      const canAdd = Math.min(remaining, MAX_STACK - slot.quantity)
      slot.quantity += canAdd
      remaining -= canAdd
    }
  }
  while (remaining > 0 && pool.length < capacity) {
    const batch = Math.min(remaining, MAX_STACK)
    pool.push(makeStack(itemId, batch, quality, addedValue))
    remaining -= batch
  }
  return remaining
}

/** 还能放入多少（同栈剩余 + 空格） */
export const getStackSpace = (pool: InventoryItem[], capacity: number, itemId: string, quality: Quality, addedValue: number): number => {
  let space = Math.max(0, capacity - pool.length) * MAX_STACK
  for (const slot of pool) {
    if (isSameStack(slot, itemId, quality, addedValue) && slot.quantity < MAX_STACK) space += MAX_STACK - slot.quantity
  }
  return space
}

/** 统计数量；quality / addedValue 不传则不限 */
export const countStacks = (pool: InventoryItem[], itemId: string, quality?: Quality, addedValue?: number): number =>
  pool
    .filter(
      s =>
        s.itemId === itemId &&
        (quality === undefined || s.quality === quality) &&
        (addedValue === undefined || getAddedValue(s) === addedValue)
    )
    .reduce((sum, s) => sum + s.quantity, 0)

/**
 * 跨栈取出物品，数量不足时返回 false 且不做改动。
 * 不指定增值时先消耗无增值的，再按增值从低到高；同一增值内按品质从低到高。
 */
export const takeFromStacks = (
  pool: InventoryItem[],
  itemId: string,
  quantity: number,
  quality?: Quality,
  addedValue?: number
): boolean => {
  if (countStacks(pool, itemId, quality, addedValue) < quantity) return false
  const values =
    addedValue !== undefined ? [addedValue] : [...new Set(pool.filter(s => s.itemId === itemId).map(getAddedValue))].sort((a, b) => a - b)
  const qualities = quality !== undefined ? [quality] : QUALITY_ORDER
  let remaining = quantity
  for (const value of values) {
    for (const q of qualities) {
      for (let i = pool.length - 1; i >= 0 && remaining > 0; i--) {
        const slot = pool[i]!
        if (!isSameStack(slot, itemId, q, value)) continue
        const take = Math.min(remaining, slot.quantity)
        slot.quantity -= take
        remaining -= take
        if (slot.quantity <= 0) pool.splice(i, 1)
      }
    }
  }
  return true
}

/** 合并同栈并拆分超过上限的栈（保留锁定与陈酿增值），不排序 */
export const mergeStacks = (pool: InventoryItem[]): InventoryItem[] => {
  const merged: InventoryItem[] = []
  for (const item of pool) {
    const addedValue = getAddedValue(item)
    const existing = merged.find(m => isSameStack(m, item.itemId, item.quality, addedValue))
    if (existing) {
      existing.quantity += item.quantity
      if (item.locked) existing.locked = true
    } else {
      const stack = makeStack(item.itemId, item.quantity, item.quality, addedValue)
      merged.push(item.locked ? { ...stack, locked: true } : stack)
    }
  }
  const split: InventoryItem[] = []
  for (const item of merged) {
    let remaining = item.quantity
    while (remaining > 0) {
      const batch = Math.min(remaining, MAX_STACK)
      split.push({ ...item, quantity: batch })
      remaining -= batch
    }
  }
  return split
}
