import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { InventoryItem, Quality, Chest, ChestTier, VoidChestRole, ItemCategory } from '@/types'
import { getItemById, CHEST_DEFS } from '@/data/items'
import { getNextChestUpgradeTier } from '@/data/warehouse'
import { useInventoryStore } from './useInventoryStore'

const INITIAL_MAX_CHESTS = 5
const MAX_CHESTS_CAP = 20
const CHEST_SLOTS_PER_EXPAND = 3
const MAX_STACK = 999
const UNLOCK_COST = 500

export const useWarehouseStore = defineStore('warehouse', () => {
  const unlocked = ref(false)
  const chests = ref<Chest[]>([])
  const maxChests = ref(INITIAL_MAX_CHESTS)

  const hasVoidChest = computed(() => chests.value.some(c => c.tier === 'void'))

  // ---- 箱子管理 ----

  /** 创建箱子 */
  const addChest = (tier: ChestTier, label?: string): boolean => {
    if (chests.value.length >= maxChests.value) return false
    const def = CHEST_DEFS[tier]
    chests.value.push({
      id: `chest_${Date.now()}_${chests.value.length}`,
      tier,
      label: label ?? def.name,
      items: [],
      voidRole: 'none',
      filterCategories: []
    })
    return true
  }

  /** 删除空箱子 */
  const removeChest = (chestId: string): boolean => {
    const idx = chests.value.findIndex(c => c.id === chestId)
    if (idx === -1) return false
    if (chests.value[idx]!.items.length > 0) return false
    chests.value.splice(idx, 1)
    return true
  }

  /** 重命名箱子 */
  const renameChest = (chestId: string, label: string): boolean => {
    const trimmed = label.trim()
    if (!trimmed || trimmed.length > 8) return false
    const chest = chests.value.find(c => c.id === chestId)
    if (!chest) return false
    chest.label = trimmed
    return true
  }

  /** 获取箱子引用 */
  const getChest = (chestId: string): Chest | undefined => {
    return chests.value.find(c => c.id === chestId)
  }

  /** 获取箱子容量 */
  const getChestCapacity = (chestId: string): number => {
    const chest = chests.value.find(c => c.id === chestId)
    if (!chest) return 0
    return CHEST_DEFS[chest.tier].capacity
  }

  /** 箱子是否已满 */
  const isChestFull = (chestId: string): boolean => {
    const chest = chests.value.find(c => c.id === chestId)
    if (!chest) return true
    return chest.items.length >= CHEST_DEFS[chest.tier].capacity
  }

  /** 物品是否可存入该箱子（分类限制） */
  const canDepositItemToChest = (chestId: string, itemId: string): boolean => {
    const chest = chests.value.find(c => c.id === chestId)
    const def = getItemById(itemId)
    if (!chest || !def) return false
    if (chest.filterCategories.length === 0) return true
    return chest.filterCategories.includes(def.category)
  }

  /** 查找绑定某分类的箱子 */
  const getChestForCategory = (category: ItemCategory): Chest | undefined => {
    return chests.value.find(c => c.filterCategories.includes(category))
  }

  /** 切换箱子绑定分类（每分类全仓库仅一个箱子） */
  const toggleChestCategory = (chestId: string, category: ItemCategory): boolean => {
    const chest = chests.value.find(c => c.id === chestId)
    if (!chest) return false
    const idx = chest.filterCategories.indexOf(category)
    if (idx >= 0) {
      chest.filterCategories.splice(idx, 1)
      return true
    }
    for (const c of chests.value) {
      if (c.id !== chestId && c.filterCategories.includes(category)) {
        c.filterCategories = c.filterCategories.filter(cat => cat !== category)
      }
    }
    chest.filterCategories.push(category)
    return true
  }

  /** 升级箱子至下一材质（仅 wood→copper→iron→gold） */
  const upgradeChestTier = (chestId: string): boolean => {
    const chest = chests.value.find(c => c.id === chestId)
    if (!chest) return false
    const next = getNextChestUpgradeTier(chest.tier)
    if (!next) return false
    chest.tier = next
    return true
  }

  // ---- 物品操作 ----

  /** 直接往箱子加物品（内部/自动路由用） */
  const addItemToChest = (chestId: string, itemId: string, quantity: number = 1, quality: Quality = 'normal'): boolean => {
    const chest = chests.value.find(c => c.id === chestId)
    if (!chest) return false
    const cap = CHEST_DEFS[chest.tier].capacity
    let remaining = quantity

    for (const slot of chest.items) {
      if (remaining <= 0) break
      if (slot.itemId === itemId && slot.quality === quality && slot.quantity < MAX_STACK) {
        const canAdd = Math.min(remaining, MAX_STACK - slot.quantity)
        slot.quantity += canAdd
        remaining -= canAdd
      }
    }

    while (remaining > 0 && chest.items.length < cap) {
      const batch = Math.min(remaining, MAX_STACK)
      chest.items.push({ itemId, quantity: batch, quality })
      remaining -= batch
    }

    return remaining <= 0
  }

  /** 直接从箱子移除物品 */
  const removeItemFromChest = (chestId: string, itemId: string, quantity: number = 1, quality?: Quality): boolean => {
    const chest = chests.value.find(c => c.id === chestId)
    if (!chest) return false

    const matchQuality = (i: { itemId: string; quality: Quality }) =>
      i.itemId === itemId && (quality === undefined || i.quality === quality)
    const total = chest.items.filter(matchQuality).reduce((sum, i) => sum + i.quantity, 0)
    if (total < quantity) return false

    const qualityOrder: Quality[] = ['normal', 'fine', 'excellent', 'supreme']
    let remaining = quantity
    for (const q of quality !== undefined ? [quality] : qualityOrder) {
      for (let i = chest.items.length - 1; i >= 0 && remaining > 0; i--) {
        const slot = chest.items[i]!
        if (slot.itemId !== itemId || slot.quality !== q) continue
        const take = Math.min(remaining, slot.quantity)
        slot.quantity -= take
        remaining -= take
        if (slot.quantity <= 0) {
          chest.items.splice(i, 1)
        }
      }
    }
    return true
  }

  /** 查询箱子内物品数量 */
  const getChestItemCount = (chestId: string, itemId: string, quality?: Quality): number => {
    const chest = chests.value.find(c => c.id === chestId)
    if (!chest) return 0
    return chest.items
      .filter(i => i.itemId === itemId && (quality === undefined || i.quality === quality))
      .reduce((sum, i) => sum + i.quantity, 0)
  }

  // ---- 存取操作（背包 ↔ 箱子）----

  /** 从背包存入箱子，返回实际存入数量（0 = 失败） */
  const depositToChest = (chestId: string, itemId: string, quantity: number, quality: Quality): number => {
    const inv = useInventoryStore()
    const chest = chests.value.find(c => c.id === chestId)
    if (!chest) return 0
    if (!canDepositItemToChest(chestId, itemId)) return 0

    // 计算箱子可容纳数量
    const cap = CHEST_DEFS[chest.tier].capacity
    let canStore = 0
    for (const slot of chest.items) {
      if (slot.itemId === itemId && slot.quality === quality && slot.quantity < MAX_STACK) {
        canStore += MAX_STACK - slot.quantity
      }
    }
    const freeSlots = cap - chest.items.length
    canStore += freeSlots * MAX_STACK

    const actual = Math.min(quantity, canStore)
    if (actual <= 0) return 0

    if (!inv.removeItem(itemId, actual, quality)) return 0
    addItemToChest(chestId, itemId, actual, quality)
    return actual
  }

  /** 从箱子取出到背包 */
  const withdrawFromChest = (chestId: string, itemId: string, quantity: number, quality: Quality): boolean => {
    const inv = useInventoryStore()
    const chest = chests.value.find(c => c.id === chestId)
    if (!chest) return false

    const available = getChestItemCount(chestId, itemId, quality)
    const actual = Math.min(quantity, available)
    if (actual <= 0) return false

    // 先从箱子移除，再加入背包（addItem 会溢出到临时背包，避免物品复制）
    removeItemFromChest(chestId, itemId, actual, quality)
    inv.addItem(itemId, actual, quality)
    return true
  }

  // ---- 仓库扩容 ----

  /** 扩容仓库（增加箱子槽位） */
  const expandMaxChests = (): boolean => {
    if (maxChests.value >= MAX_CHESTS_CAP) return false
    maxChests.value += CHEST_SLOTS_PER_EXPAND
    return true
  }

  /** 按箱子绑定分类，将背包物品一键存入对应箱子 */
  const autoDepositByCategories = (): string[] => {
    const inv = useInventoryStore()
    const fullLabels = new Set<string>()
    const hasAnyCategory = chests.value.some(c => c.filterCategories.length > 0)
    if (!hasAnyCategory) return ['请先在箱子上设置存放分类。']

    const pending = inv.items.filter(i => !i.locked)
    for (const slot of pending) {
      const def = getItemById(slot.itemId)
      if (!def) continue
      const chest = getChestForCategory(def.category)
      if (!chest) continue
      const available = inv.getItemCount(slot.itemId, slot.quality)
      if (available <= 0) continue
      const actual = depositToChest(chest.id, slot.itemId, available, slot.quality)
      if (actual <= 0) fullLabels.add(chest.label)
      else if (actual < available) fullLabels.add(chest.label)
    }
    return [...fullLabels].map(label => `${label}已满`)
  }

  // ---- 虚空箱管理 ----

  /** 设置虚空箱角色（同角色互斥） */
  const setVoidRole = (chestId: string, role: VoidChestRole): boolean => {
    const chest = chests.value.find(c => c.id === chestId)
    if (!chest || chest.tier !== 'void') return false

    // 清除同角色的其他箱子
    if (role !== 'none') {
      for (const c of chests.value) {
        if (c.id !== chestId && c.tier === 'void' && c.voidRole === role) {
          c.voidRole = 'none'
        }
      }
    }
    chest.voidRole = role
    return true
  }

  /** 获取虚空原料箱 */
  const getVoidInputChest = (): Chest | null => {
    return chests.value.find(c => c.tier === 'void' && c.voidRole === 'input') ?? null
  }

  /** 获取虚空成品箱 */
  const getVoidOutputChest = (): Chest | null => {
    return chests.value.find(c => c.tier === 'void' && c.voidRole === 'output') ?? null
  }

  /** 获取所有虚空箱 */
  const getVoidChests = (): Chest[] => {
    return chests.value.filter(c => c.tier === 'void')
  }

  // ---- 箱子排序 ----

  /** 移动箱子位置（上移/下移） */
  const moveChest = (chestId: string, direction: 'up' | 'down'): boolean => {
    const idx = chests.value.findIndex(c => c.id === chestId)
    if (idx === -1) return false
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= chests.value.length) return false
    const temp = chests.value[idx]!
    chests.value[idx] = chests.value[targetIdx]!
    chests.value[targetIdx] = temp
    return true
  }

  // ---- 整理 ----

  /** 物品分类排序优先级 */
  const CATEGORY_ORDER: Record<string, number> = {
    seed: 0,
    crop: 1,
    fruit: 2,
    fish: 3,
    animal_product: 4,
    processed: 5,
    food: 6,
    ore: 7,
    gem: 8,
    material: 9,
    machine: 10,
    sprinkler: 11,
    fertilizer: 12,
    bait: 13,
    tackle: 14,
    bomb: 15,
    sapling: 16,
    gift: 17,
    fossil: 18,
    artifact: 19,
    misc: 20
  }

  const qualityOrder: Record<string, number> = { normal: 0, fine: 1, excellent: 2, supreme: 3 }

  /** 一键整理箱子（按分类→物品ID→品质排序，合并同类栈） */
  const sortChest = (chestId: string) => {
    const chest = getChest(chestId)
    if (!chest || chest.items.length === 0) return
    // 合并同类栈
    const merged: InventoryItem[] = []
    for (const item of chest.items) {
      const existing = merged.find(m => m.itemId === item.itemId && m.quality === item.quality)
      if (existing) {
        existing.quantity += item.quantity
      } else {
        merged.push({ ...item })
      }
    }
    // 拆分超过 MAX_STACK 的栈
    const split: InventoryItem[] = []
    for (const item of merged) {
      let remaining = item.quantity
      while (remaining > 0) {
        const batch = Math.min(remaining, MAX_STACK)
        split.push({ itemId: item.itemId, quantity: batch, quality: item.quality })
        remaining -= batch
      }
    }
    // 按分类 → 物品ID → 品质排序
    split.sort((a, b) => {
      const defA = getItemById(a.itemId)
      const defB = getItemById(b.itemId)
      const catA = CATEGORY_ORDER[defA?.category ?? 'misc'] ?? 20
      const catB = CATEGORY_ORDER[defB?.category ?? 'misc'] ?? 20
      if (catA !== catB) return catA - catB
      if (a.itemId !== b.itemId) return a.itemId.localeCompare(b.itemId)
      return (qualityOrder[a.quality] ?? 0) - (qualityOrder[b.quality] ?? 0)
    })
    chest.items = split
  }

  // ---- 序列化 ----

  const serialize = () => {
    return {
      unlocked: unlocked.value,
      chests: chests.value,
      maxChests: maxChests.value
    }
  }

  const deserialize = (data: Record<string, unknown>) => {
    unlocked.value = (data.unlocked as boolean) ?? false
    maxChests.value = (data.maxChests as number) ?? INITIAL_MAX_CHESTS

    // 旧存档迁移：有 items 无 chests
    if (data.items && !data.chests) {
      const oldItems = (data.items as InventoryItem[]).filter(i => getItemById(i.itemId))
      if (oldItems.length > 0) {
        // 金箱容量36，超出时分多个箱子
        const goldCap = CHEST_DEFS.gold.capacity
        const migratedChests: Chest[] = []
        for (let i = 0; i < oldItems.length; i += goldCap) {
          migratedChests.push({
            id: `migrated_chest_${migratedChests.length + 1}`,
            tier: 'gold',
            label: migratedChests.length === 0 ? '旧仓库' : `旧仓库${migratedChests.length + 1}`,
            items: oldItems.slice(i, i + goldCap),
            voidRole: 'none',
            filterCategories: []
          })
        }
        chests.value = migratedChests
        // 确保箱子槽位足够容纳迁移的箱子
        if (maxChests.value < migratedChests.length) {
          maxChests.value = migratedChests.length
        }
      } else {
        chests.value = []
      }
    } else {
      chests.value = ((data.chests as Chest[]) ?? []).map(c => ({
        ...c,
        filterCategories: c.filterCategories ?? []
      }))
    }

    // 兼容旧存档：如果有箱子但未标记解锁，自动解锁
    if (!unlocked.value && chests.value.length > 0) unlocked.value = true
  }

  return {
    unlocked,
    chests,
    maxChests,
    hasVoidChest,
    UNLOCK_COST,
    MAX_CHESTS_CAP,
    CHEST_SLOTS_PER_EXPAND,
    addChest,
    removeChest,
    renameChest,
    getChest,
    getChestCapacity,
    isChestFull,
    canDepositItemToChest,
    getChestForCategory,
    toggleChestCategory,
    upgradeChestTier,
    autoDepositByCategories,
    addItemToChest,
    removeItemFromChest,
    getChestItemCount,
    depositToChest,
    withdrawFromChest,
    expandMaxChests,
    setVoidRole,
    getVoidInputChest,
    getVoidOutputChest,
    getVoidChests,
    moveChest,
    sortChest,
    serialize,
    deserialize
  }
})
