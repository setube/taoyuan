import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { InventoryItem, Quality, Chest, ChestTier, VoidChestRole } from '@/types'
import { getItemById, CHEST_DEFS, ITEM_CATEGORY_NAMES } from '@/data/items'
import { useInventoryStore } from './useInventoryStore'
import {
  normalizeAddedValue,
  getAddedValue,
  putIntoStacks,
  takeFromStacks,
  countStacks,
  getStackSpace,
  mergeStacks
} from '@/composables/useItemStacks'

const INITIAL_MAX_CHESTS = 3
const MAX_CHESTS_CAP = 10
const UNLOCK_COST = 50000
/** 每次扩建仓库为总仓追加的格数 */
const MAIN_CHEST_CAPACITY_PER_EXPAND = 30

export const useWarehouseStore = defineStore('warehouse', () => {
  const unlocked = ref(false)
  const chests = ref<Chest[]>([])
  const maxChests = ref(INITIAL_MAX_CHESTS)

  const hasVoidChest = computed(() => chests.value.some(c => c.tier === 'void'))

  // ---- 总仓 ----

  /** 总仓：解锁即赠的大仓库，按类归档、不可拆除 */
  const mainChest = computed(() => chests.value.find(c => c.tier === 'main') ?? null)

  /**
   * 总仓容量：基础值 + 每次扩建追加。
   * 让「扩建仓库」同时抬高总仓，玩家不必为了空间再去造一堆小箱子。
   */
  const mainChestCapacity = computed(() => {
    const extraSlots = Math.max(0, maxChests.value - INITIAL_MAX_CHESTS)
    return CHEST_DEFS.main.capacity + extraSlots * MAIN_CHEST_CAPACITY_PER_EXPAND
  })

  /** 确保总仓存在（解锁时与旧存档迁移时调用） */
  const ensureMainChest = () => {
    if (mainChest.value) return
    // 总仓固定放在最前面，且不占用 maxChests 的名额
    chests.value.unshift({
      id: 'chest_main',
      tier: 'main',
      label: CHEST_DEFS.main.name,
      items: [],
      voidRole: 'none'
    })
  }

  /** 玩家自造的箱子数（不含总仓），用于与 maxChests 比较 */
  const craftedChestCount = computed(() => chests.value.filter(c => c.tier !== 'main').length)

  /** 解锁仓库：同时把总仓建好，解锁后立刻能用 */
  const unlock = () => {
    unlocked.value = true
    ensureMainChest()
  }

  // ---- 箱子管理 ----

  /** 创建箱子 */
  const addChest = (tier: ChestTier, label?: string): boolean => {
    if (tier === 'main') return false
    if (craftedChestCount.value >= maxChests.value) return false
    const def = CHEST_DEFS[tier]
    chests.value.push({
      id: `chest_${Date.now()}`,
      tier,
      label: label ?? def.name,
      items: [],
      voidRole: 'none'
    })
    return true
  }

  /** 删除空箱子（总仓不可删） */
  const removeChest = (chestId: string): boolean => {
    const idx = chests.value.findIndex(c => c.id === chestId)
    if (idx === -1) return false
    if (chests.value[idx]!.tier === 'main') return false
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

  /** 获取箱子容量（总仓随扩建增长） */
  const getChestCapacity = (chestId: string): number => {
    const chest = chests.value.find(c => c.id === chestId)
    if (!chest) return 0
    if (chest.tier === 'main') return mainChestCapacity.value
    return CHEST_DEFS[chest.tier].capacity
  }

  /** 箱子是否已满 */
  const isChestFull = (chestId: string): boolean => {
    const chest = chests.value.find(c => c.id === chestId)
    if (!chest) return true
    return chest.items.length >= getChestCapacity(chestId)
  }

  // ---- 物品操作 ----

  /** 直接往箱子加物品（内部/自动路由用，addedValue：每件陈酿增值） */
  const addItemToChest = (
    chestId: string,
    itemId: string,
    quantity: number = 1,
    quality: Quality = 'normal',
    addedValue: number = 0
  ): boolean => {
    const chest = chests.value.find(c => c.id === chestId)
    if (!chest) return false
    return putIntoStacks(chest.items, getChestCapacity(chestId), itemId, quantity, quality, normalizeAddedValue(addedValue)) <= 0
  }

  /** 直接从箱子移除物品（addedValue 不传时优先消耗无陈酿增值的） */
  const removeItemFromChest = (chestId: string, itemId: string, quantity: number = 1, quality?: Quality, addedValue?: number): boolean => {
    const chest = chests.value.find(c => c.id === chestId)
    if (!chest) return false
    return takeFromStacks(chest.items, itemId, quantity, quality, addedValue === undefined ? undefined : normalizeAddedValue(addedValue))
  }

  /** 查询箱子内物品数量 */
  const getChestItemCount = (chestId: string, itemId: string, quality?: Quality, addedValue?: number): number => {
    const chest = chests.value.find(c => c.id === chestId)
    if (!chest) return 0
    return countStacks(chest.items, itemId, quality, addedValue === undefined ? undefined : normalizeAddedValue(addedValue))
  }

  // ---- 存取操作（背包 ↔ 箱子）----

  /** 从背包存入箱子，返回实际存入数量（0 = 失败） */
  const depositToChest = (chestId: string, itemId: string, quantity: number, quality: Quality, addedValue: number = 0): number => {
    const inv = useInventoryStore()
    const chest = chests.value.find(c => c.id === chestId)
    if (!chest) return 0
    const added = normalizeAddedValue(addedValue)

    // 计算箱子可容纳数量
    const canStore = getStackSpace(chest.items, getChestCapacity(chestId), itemId, quality, added)
    const actual = Math.min(quantity, canStore)
    if (actual <= 0) return 0

    if (!inv.removeItem(itemId, actual, quality, added)) return 0
    addItemToChest(chestId, itemId, actual, quality, added)
    return actual
  }

  /** 从箱子取出到背包，返回实际取出数量（0 = 失败）；背包和临时背包放得下多少取多少 */
  const withdrawFromChest = (chestId: string, itemId: string, quantity: number, quality: Quality, addedValue: number = 0): number => {
    const inv = useInventoryStore()
    const chest = chests.value.find(c => c.id === chestId)
    if (!chest) return 0
    const added = normalizeAddedValue(addedValue)

    const available = getChestItemCount(chestId, itemId, quality, added)
    const actual = Math.min(quantity, available, inv.getReceivableQuantity(itemId, quality, added))
    if (actual <= 0) return 0

    // 先从箱子移除，再加入背包（数量已按可放空间截断，不会溢出丢失）
    removeItemFromChest(chestId, itemId, actual, quality, added)
    inv.addItem(itemId, actual, quality, added)
    return actual
  }

  // ---- 仓库扩容 ----

  /** 扩容仓库（增加箱子槽位） */
  const expandMaxChests = (): boolean => {
    if (maxChests.value >= MAX_CHESTS_CAP) return false
    maxChests.value += 1
    return true
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

  const qualityOrder: Record<string, number> = {
    normal: 0,
    fine: 1,
    excellent: 2,
    supreme: 3
  }

  /** 一键整理箱子（按分类→物品ID→品质→陈酿增值排序，合并同类栈） */
  const sortChest = (chestId: string) => {
    const chest = getChest(chestId)
    if (!chest || chest.items.length === 0) return
    // 合并同栈并拆分超过 MAX_STACK 的栈（陈酿增值不同的不合并）
    const split = mergeStacks(chest.items)
    split.sort((a, b) => {
      const defA = getItemById(a.itemId)
      const defB = getItemById(b.itemId)
      const catA = CATEGORY_ORDER[defA?.category ?? 'misc'] ?? 20
      const catB = CATEGORY_ORDER[defB?.category ?? 'misc'] ?? 20
      if (catA !== catB) return catA - catB
      if (a.itemId !== b.itemId) return a.itemId.localeCompare(b.itemId)
      if (a.quality !== b.quality) return (qualityOrder[a.quality] ?? 0) - (qualityOrder[b.quality] ?? 0)
      return getAddedValue(a) - getAddedValue(b)
    })
    chest.items = split
  }

  /**
   * 一键把背包里的东西收进总仓。
   * 默认只收「已经在总仓里有同类」的物品（补货），传 all=true 则收全部可存物品。
   * 种子、受保护物品、锁定物品不动。返回收入的物品数。
   */
  const stowToMain = (all = false): { kinds: number; total: number } => {
    const inv = useInventoryStore()
    const main = mainChest.value
    if (!main) return { kinds: 0, total: 0 }
    const known = new Set(main.items.map(i => i.itemId))
    const snapshot = inv.items
      .filter(i => {
        if (i.locked) return false
        const def = getItemById(i.itemId)
        if (!def || def.category === 'seed' || def.protected) return false
        return all || known.has(i.itemId)
      })
      .map(i => ({ itemId: i.itemId, quality: i.quality, quantity: i.quantity, addedValue: getAddedValue(i) }))

    let kinds = 0
    let total = 0
    for (const item of snapshot) {
      const stored = depositToChest(main.id, item.itemId, item.quantity, item.quality, item.addedValue)
      if (stored > 0) {
        kinds++
        total += stored
      }
    }
    if (total > 0) sortChest(main.id)
    return { kinds, total }
  }

  /** 总仓按类别分组（供界面渲染分区） */
  const getMainChestGroups = (): { category: string; name: string; items: InventoryItem[] }[] => {
    const main = mainChest.value
    if (!main) return []
    const groups = new Map<string, InventoryItem[]>()
    for (const item of main.items) {
      const cat = getItemById(item.itemId)?.category ?? 'misc'
      const list = groups.get(cat) ?? []
      list.push(item)
      groups.set(cat, list)
    }
    return [...groups.entries()]
      .sort((a, b) => (CATEGORY_ORDER[a[0]] ?? 99) - (CATEGORY_ORDER[b[0]] ?? 99))
      .map(([category, items]) => ({
        category,
        name: ITEM_CATEGORY_NAMES[category as keyof typeof ITEM_CATEGORY_NAMES] ?? category,
        items
      }))
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
            voidRole: 'none'
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
      chests.value = (data.chests as Chest[]) ?? []
    }

    // 兼容旧存档：如果有箱子但未标记解锁，自动解锁
    if (!unlocked.value && chests.value.length > 0) unlocked.value = true
    // 已解锁的旧存档补发总仓，让老玩家也能直接用上
    if (unlocked.value) ensureMainChest()
  }

  return {
    unlocked,
    chests,
    maxChests,
    hasVoidChest,
    mainChest,
    mainChestCapacity,
    craftedChestCount,
    unlock,
    stowToMain,
    getMainChestGroups,
    UNLOCK_COST,
    MAX_CHESTS_CAP,
    addChest,
    removeChest,
    renameChest,
    getChest,
    getChestCapacity,
    isChestFull,
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
