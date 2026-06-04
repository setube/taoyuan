import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { InventoryItem, Quality, Tool, ToolType, ToolTier, OwnedWeapon, OwnedRing, RingEffectType, OwnedHat, OwnedShoe } from '@/types'

/** 装备方案 */
export interface EquipmentPreset {
  id: string
  name: string
  weaponDefId: string | null
  ringSlot1DefId: string | null
  ringSlot2DefId: string | null
  hatDefId: string | null
  shoeDefId: string | null
}
import { showFloat } from '@/composables/useGameLog'
import { getItemById } from '@/data/items'
import { getWeaponById, getEnchantmentById, getWeaponSellPrice } from '@/data/weapons'
import { getRingById } from '@/data/rings'
import { getHatById } from '@/data/hats'
import { getShoeById } from '@/data/shoes'
import { EQUIPMENT_SETS } from '@/data/equipmentSets'
import { usePlayerStore } from './usePlayerStore'
import { useAchievementStore } from './useAchievementStore'
import { hasCombinedItem, removeCombinedItem } from '@/composables/useCombinedInventory'

const INITIAL_CAPACITY = 24
const MAX_CAPACITY = 60
const MAX_STACK = 999
const TEMP_CAPACITY = 10

export const useInventoryStore = defineStore('inventory', () => {
  const items = ref<InventoryItem[]>([])
  const capacity = ref(INITIAL_CAPACITY)
  const tools = ref<Tool[]>([
    { type: 'wateringCan', tier: 'basic' },
    { type: 'hoe', tier: 'basic' },
    { type: 'pickaxe', tier: 'basic' },
    { type: 'fishingRod', tier: 'basic' },
    { type: 'scythe', tier: 'basic' },
    { type: 'axe', tier: 'basic' },
    { type: 'pan', tier: 'basic' }
  ])

  /** 拥有的武器列表 */
  const ownedWeapons = ref<OwnedWeapon[]>([{ defId: 'wooden_stick', enchantmentId: null }])
  /** 当前装备的武器索引 */
  const equippedWeaponIndex = ref(0)

  /** 拥有的戒指列表 */
  const ownedRings = ref<OwnedRing[]>([])
  /** 装备的戒指索引（2个槽位，-1 = 空） */
  const equippedRingSlot1 = ref(-1)
  const equippedRingSlot2 = ref(-1)

  /** 拥有的帽子列表 */
  const ownedHats = ref<OwnedHat[]>([])
  /** 当前装备的帽子索引（-1 = 空） */
  const equippedHatIndex = ref(-1)

  /** 拥有的鞋子列表 */
  const ownedShoes = ref<OwnedShoe[]>([])
  /** 当前装备的鞋子索引（-1 = 空） */
  const equippedShoeIndex = ref(-1)

  /** 装备方案列表 */
  const equipmentPresets = ref<EquipmentPreset[]>([])
  /** 当前使用的方案ID */
  const activePresetId = ref<string | null>(null)

  /** 正在升级中的工具（2天等待期） */
  const pendingUpgrade = ref<{ toolType: ToolType; targetTier: ToolTier; daysRemaining: number } | null>(null)

  const isFull = computed(() => items.value.length >= capacity.value)

  /** 临时背包（溢出缓冲区） */
  const tempItems = ref<InventoryItem[]>([])
  const isTempFull = computed(() => tempItems.value.length >= TEMP_CAPACITY)
  /** 主背包+临时背包均满 */
  const isAllFull = computed(() => isFull.value && isTempFull.value)

  /** 获取当前装备的武器 */
  const getEquippedWeapon = (): OwnedWeapon => {
    return ownedWeapons.value[equippedWeaponIndex.value] ?? { defId: 'wooden_stick', enchantmentId: null }
  }

  /** 获取武器攻击力（含附魔加成） */
  const getWeaponAttack = (): number => {
    const owned = getEquippedWeapon()
    const def = getWeaponById(owned.defId)
    if (!def) return 5
    let attack = def.attack
    if (owned.enchantmentId) {
      const enchant = getEnchantmentById(owned.enchantmentId)
      if (enchant) attack += enchant.attackBonus
    }
    return attack
  }

  /** 获取武器暴击率（含附魔加成） */
  const getWeaponCritRate = (): number => {
    const owned = getEquippedWeapon()
    const def = getWeaponById(owned.defId)
    if (!def) return 0.02
    let critRate = def.critRate
    if (owned.enchantmentId) {
      const enchant = getEnchantmentById(owned.enchantmentId)
      if (enchant) critRate += enchant.critBonus
    }
    return critRate
  }

  /** 添加武器到收藏 */
  const addWeapon = (defId: string, enchantmentId: string | null = null): boolean => {
    ownedWeapons.value.push({ defId, enchantmentId })
    useAchievementStore().discoverItem(defId)
    return true
  }

  /** 检查是否已拥有某武器（不含附魔区分） */
  const hasWeapon = (defId: string): boolean => {
    return ownedWeapons.value.some(w => w.defId === defId)
  }

  /** 检查是否已拥有完全相同的武器（同defId + 同附魔） */
  const hasWeaponExact = (defId: string, enchantmentId: string | null): boolean => {
    return ownedWeapons.value.some(w => w.defId === defId && w.enchantmentId === enchantmentId)
  }

  /** 装备武器（按索引） */
  const equipWeapon = (index: number): boolean => {
    if (index < 0 || index >= ownedWeapons.value.length) return false
    equippedWeaponIndex.value = index
    return true
  }

  /** 卖出武器（不能卖装备中的武器，不能卖唯一武器） */
  const sellWeapon = (index: number): { success: boolean; message: string } => {
    if (ownedWeapons.value.length <= 1) return { success: false, message: '至少保留一把武器。' }
    if (index === equippedWeaponIndex.value) return { success: false, message: '不能卖出装备中的武器，请先切换。' }
    if (index < 0 || index >= ownedWeapons.value.length) return { success: false, message: '无效索引。' }
    const weapon = ownedWeapons.value[index]!
    const price = getWeaponSellPrice(weapon.defId, weapon.enchantmentId)
    const playerStore = usePlayerStore()
    playerStore.earnMoney(price)
    ownedWeapons.value.splice(index, 1)
    // 修正装备索引
    if (equippedWeaponIndex.value > index) {
      equippedWeaponIndex.value--
    }
    const def = getWeaponById(weapon.defId)
    return { success: true, message: `卖出了${def?.name ?? '武器'}，获得${price}文。` }
  }

  /** 添加物品到背包 */
  const addItem = (itemId: string, quantity: number = 1, quality: Quality = 'normal'): boolean => {
    // 校验物品是否存在
    if (!getItemById(itemId)) return false
    // 自动注册到图鉴
    useAchievementStore().discoverItem(itemId)
    let remaining = quantity

    // 先填充已有的同类栈
    for (const slot of items.value) {
      if (remaining <= 0) break
      if (slot.itemId === itemId && slot.quality === quality && slot.quantity < MAX_STACK) {
        const canAdd = Math.min(remaining, MAX_STACK - slot.quantity)
        slot.quantity += canAdd
        remaining -= canAdd
      }
    }

    // 剩余部分创建新栈
    while (remaining > 0 && !isFull.value) {
      const batch = Math.min(remaining, MAX_STACK)
      items.value.push({ itemId, quantity: batch, quality })
      remaining -= batch
    }

    // 溢出到临时背包
    if (remaining > 0) {
      for (const slot of tempItems.value) {
        if (remaining <= 0) break
        if (slot.itemId === itemId && slot.quality === quality && slot.quantity < MAX_STACK) {
          const canAdd = Math.min(remaining, MAX_STACK - slot.quantity)
          slot.quantity += canAdd
          remaining -= canAdd
        }
      }
      while (remaining > 0 && !isTempFull.value) {
        const batch = Math.min(remaining, MAX_STACK)
        tempItems.value.push({ itemId, quantity: batch, quality })
        remaining -= batch
      }
    }

    if (remaining > 0) {
      const name = getItemById(itemId)?.name ?? itemId
      showFloat(`背包已满！${name}×${remaining}丢失了`, 'danger')
    } else {
      // 背包快满预警：剩余格数 ≤ 3 时提示一次
      const freeSlots = capacity.value - items.value.length
      if (freeSlots <= 3) {
        showFloat(`背包快满了！剩余${freeSlots}格`, 'accent')
      }
    }

    return remaining <= 0
  }

  /** 移除物品（支持跨栈删除）。quality 不传时优先消耗低品质 */
  const removeItem = (itemId: string, quantity: number = 1, quality?: Quality): boolean => {
    // 先检查总数是否足够
    const matchQuality = (i: { itemId: string; quality: Quality }) =>
      i.itemId === itemId && (quality === undefined || i.quality === quality)
    const total = items.value.filter(matchQuality).reduce((sum, i) => sum + i.quantity, 0)
    if (total < quantity) return false

    // 不指定品质时按 normal → fine → excellent → supreme 顺序消耗
    const qualityOrder: Quality[] = ['normal', 'fine', 'excellent', 'supreme']
    let remaining = quantity
    for (const q of quality !== undefined ? [quality] : qualityOrder) {
      for (let i = items.value.length - 1; i >= 0 && remaining > 0; i--) {
        const slot = items.value[i]!
        if (slot.itemId !== itemId || slot.quality !== q) continue
        const take = Math.min(remaining, slot.quantity)
        slot.quantity -= take
        remaining -= take
        if (slot.quantity <= 0) {
          items.value.splice(i, 1)
        }
      }
    }
    return true
  }

  /** 查询物品数量 */
  const getItemCount = (itemId: string, quality?: Quality): number => {
    return items.value
      .filter(i => i.itemId === itemId && (quality === undefined || i.quality === quality))
      .reduce((sum, i) => sum + i.quantity, 0)
  }

  /** 检查是否拥有足够数量 */
  const hasItem = (itemId: string, quantity: number = 1): boolean => {
    return getItemCount(itemId) >= quantity
  }

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

  /** 切换物品锁定状态 */
  const toggleLock = (itemId: string, quality: Quality) => {
    const slot = items.value.find(i => i.itemId === itemId && i.quality === quality)
    if (slot) slot.locked = !slot.locked
  }

  /** 一键整理背包（按分类→物品ID→品质排序，合并同类栈） */
  const sortItems = () => {
    // 先合并同类栈（任一栈锁定则合并后保持锁定）
    const merged: InventoryItem[] = []
    for (const item of items.value) {
      const existing = merged.find(m => m.itemId === item.itemId && m.quality === item.quality)
      if (existing) {
        existing.quantity += item.quantity
        if (item.locked) existing.locked = true
      } else {
        merged.push({ ...item })
      }
    }
    // 拆分超过 MAX_STACK 的栈（保留锁定状态）
    const split: InventoryItem[] = []
    for (const item of merged) {
      let remaining = item.quantity
      while (remaining > 0) {
        const batch = Math.min(remaining, MAX_STACK)
        split.push({ itemId: item.itemId, quantity: batch, quality: item.quality, locked: item.locked })
        remaining -= batch
      }
    }
    // 按分类 → 物品ID → 品质排序
    const qualityOrder: Record<string, number> = { normal: 0, fine: 1, excellent: 2, supreme: 3 }
    split.sort((a, b) => {
      const defA = getItemById(a.itemId)
      const defB = getItemById(b.itemId)
      const catA = CATEGORY_ORDER[defA?.category ?? 'misc'] ?? 20
      const catB = CATEGORY_ORDER[defB?.category ?? 'misc'] ?? 20
      if (catA !== catB) return catA - catB
      if (a.itemId !== b.itemId) return a.itemId.localeCompare(b.itemId)
      return (qualityOrder[a.quality] ?? 0) - (qualityOrder[b.quality] ?? 0)
    })
    items.value = split
  }

  /** 扩容背包 */
  const expandCapacity = (): boolean => {
    if (capacity.value >= MAX_CAPACITY) return false
    capacity.value += 4
    return true
  }

  /** 超限扩容背包（+1格，突破 MAX_CAPACITY） */
  const expandCapacityExtra = (): boolean => {
    capacity.value += 1
    return true
  }

  /** 将临时背包中的物品转移到主背包 */
  const moveFromTemp = (index: number): boolean => {
    if (index < 0 || index >= tempItems.value.length) return false
    const tempSlot = tempItems.value[index]!
    const { itemId, quality } = tempSlot
    let remaining = tempSlot.quantity

    for (const slot of items.value) {
      if (remaining <= 0) break
      if (slot.itemId === itemId && slot.quality === quality && slot.quantity < MAX_STACK) {
        const canAdd = Math.min(remaining, MAX_STACK - slot.quantity)
        slot.quantity += canAdd
        remaining -= canAdd
      }
    }
    while (remaining > 0 && !isFull.value) {
      const batch = Math.min(remaining, MAX_STACK)
      items.value.push({ itemId, quantity: batch, quality })
      remaining -= batch
    }

    if (remaining <= 0) {
      tempItems.value.splice(index, 1)
      return true
    }
    tempSlot.quantity = remaining
    return false
  }

  /** 一键将所有可转移的临时背包物品移入主背包 */
  const moveAllFromTemp = (): number => {
    let movedCount = 0
    for (let i = tempItems.value.length - 1; i >= 0; i--) {
      if (isFull.value) break
      if (moveFromTemp(i)) movedCount++
    }
    return movedCount
  }

  /** 丢弃临时背包中的物品 */
  const discardTempItem = (index: number): boolean => {
    if (index < 0 || index >= tempItems.value.length) return false
    tempItems.value.splice(index, 1)
    return true
  }

  /** 获取工具 */
  const getTool = (type: ToolType): Tool | undefined => {
    return tools.value.find(t => t.type === type)
  }

  /** 获取工具等级对应的体力消耗倍率 */
  const getToolStaminaMultiplier = (type: ToolType): number => {
    const tool = getTool(type)
    if (!tool) return 1
    const multipliers: Record<ToolTier, number> = { basic: 1.0, iron: 0.8, steel: 0.6, iridium: 0.4 }
    return multipliers[tool.tier]
  }

  /** 获取工具等级对应的批量操作数量（蓄力机制） */
  const getToolBatchCount = (type: ToolType): number => {
    const tool = getTool(type)
    if (!tool) return 1
    const counts: Record<ToolTier, number> = { basic: 1, iron: 2, steel: 4, iridium: 8 }
    return counts[tool.tier]
  }

  /** 升级工具 */
  const upgradeTool = (type: ToolType): boolean => {
    const tool = getTool(type)
    if (!tool) return false
    const tiers: ToolTier[] = ['basic', 'iron', 'steel', 'iridium']
    const currentIndex = tiers.indexOf(tool.tier)
    if (currentIndex >= tiers.length - 1) return false
    tool.tier = tiers[currentIndex + 1]!
    return true
  }

  /** 检查工具是否可用（未在升级中） */
  const isToolAvailable = (type: ToolType): boolean => {
    return !pendingUpgrade.value || pendingUpgrade.value.toolType !== type
  }

  /** 开始升级工具（进入2天等待期） */
  const startUpgrade = (type: ToolType, targetTier: ToolTier): boolean => {
    if (pendingUpgrade.value) return false
    pendingUpgrade.value = { toolType: type, targetTier, daysRemaining: 2 }
    return true
  }

  /** 每日升级进度更新，返回完成的工具名（若有） */
  const dailyUpgradeUpdate = (): { completed: boolean; toolType: ToolType; targetTier: ToolTier } | null => {
    if (!pendingUpgrade.value) return null
    pendingUpgrade.value.daysRemaining--
    if (pendingUpgrade.value.daysRemaining <= 0) {
      const { toolType, targetTier } = pendingUpgrade.value
      upgradeTool(toolType)
      pendingUpgrade.value = null
      return { completed: true, toolType, targetTier }
    }
    return null
  }

  // ============================================================
  // 戒指系统
  // ============================================================

  /** 添加戒指到收藏 */
  const addRing = (defId: string): boolean => {
    ownedRings.value.push({ defId })
    useAchievementStore().discoverItem(defId)
    return true
  }

  /** 检查是否已拥有某戒指 */
  const hasRing = (defId: string): boolean => {
    return ownedRings.value.some(r => r.defId === defId)
  }

  /** 装备戒指到指定槽位（0 或 1），禁止两个槽位装备同defId戒指 */
  const equipRing = (ringIndex: number, slot: 0 | 1): boolean => {
    if (ringIndex < 0 || ringIndex >= ownedRings.value.length) return false
    const targetSlot = slot === 0 ? equippedRingSlot1 : equippedRingSlot2
    const otherSlot = slot === 0 ? equippedRingSlot2 : equippedRingSlot1
    // 已在目标槽位，无操作
    if (targetSlot.value === ringIndex) return true
    // 同一枚戒指在另一个槽位 → 交换
    if (otherSlot.value === ringIndex) {
      otherSlot.value = targetSlot.value // 可能是 -1
      targetSlot.value = ringIndex
      return true
    }
    // 禁止两个槽位装备同defId戒指
    const targetDefId = ownedRings.value[ringIndex]!.defId
    if (otherSlot.value >= 0 && otherSlot.value < ownedRings.value.length && ownedRings.value[otherSlot.value]!.defId === targetDefId) {
      return false
    }
    targetSlot.value = ringIndex
    return true
  }

  /** 卸下戒指（指定槽位） */
  const unequipRing = (slot: 0 | 1): boolean => {
    if (slot === 0) {
      if (equippedRingSlot1.value < 0) return false
      equippedRingSlot1.value = -1
    } else {
      if (equippedRingSlot2.value < 0) return false
      equippedRingSlot2.value = -1
    }
    return true
  }

  /** 卖出戒指（自动卸下已装备的戒指） */
  const sellRing = (index: number): { success: boolean; message: string } => {
    if (index < 0 || index >= ownedRings.value.length) return { success: false, message: '无效索引。' }
    const ring = ownedRings.value[index]!
    const def = getRingById(ring.defId)
    const price = def?.sellPrice ?? 0
    // 自动卸下
    if (equippedRingSlot1.value === index) equippedRingSlot1.value = -1
    if (equippedRingSlot2.value === index) equippedRingSlot2.value = -1
    const playerStore = usePlayerStore()
    playerStore.earnMoney(price)
    ownedRings.value.splice(index, 1)
    // 修正装备索引
    if (equippedRingSlot1.value > index) equippedRingSlot1.value--
    if (equippedRingSlot2.value > index) equippedRingSlot2.value--
    return { success: true, message: `卖出了${def?.name ?? '戒指'}，获得${price}文。` }
  }

  /** 查询某种装备效果的合计值（戒指+帽子+鞋子叠加） */
  const getEquipmentBonus = (effectType: RingEffectType): number => {
    let total = 0
    // 戒指（2槽位）
    const ringIndices = [equippedRingSlot1.value, equippedRingSlot2.value]
    for (const idx of ringIndices) {
      if (idx < 0 || idx >= ownedRings.value.length) continue
      const ring = ownedRings.value[idx]!
      const def = getRingById(ring.defId)
      if (def) {
        for (const eff of def.effects) {
          if (eff.type === effectType) total += eff.value
        }
      }
    }
    // 帽子（1槽位）
    if (equippedHatIndex.value >= 0 && equippedHatIndex.value < ownedHats.value.length) {
      const hat = ownedHats.value[equippedHatIndex.value]!
      const def = getHatById(hat.defId)
      if (def) {
        for (const eff of def.effects) {
          if (eff.type === effectType) total += eff.value
        }
      }
    }
    // 鞋子（1槽位）
    if (equippedShoeIndex.value >= 0 && equippedShoeIndex.value < ownedShoes.value.length) {
      const shoe = ownedShoes.value[equippedShoeIndex.value]!
      const def = getShoeById(shoe.defId)
      if (def) {
        for (const eff of def.effects) {
          if (eff.type === effectType) total += eff.value
        }
      }
    }
    // 套装奖励
    for (const b of activeSetBonuses.value) {
      if (b.type === effectType) total += b.value
    }
    return total
  }

  /** 查询某种戒指效果的合计值（代理到 getEquipmentBonus，包含帽子/鞋子加成） */
  const getRingEffectValue = (effectType: RingEffectType): number => {
    return getEquipmentBonus(effectType)
  }

  // ============================================================
  // 套装系统
  // ============================================================

  /** 计算当前装备中每个套装的激活件数 */
  const _getSetPieceCount = (set: (typeof EQUIPMENT_SETS)[number]): number => {
    let count = 0
    // 武器（可选字段）
    if (set.pieces.weapon) {
      const w = ownedWeapons.value[equippedWeaponIndex.value]
      if (w && w.defId === set.pieces.weapon) count++
    }
    // 戒指：两个槽位只算一次（避免两个同ID戒指重复计数）
    let ringMatched = false
    for (const idx of [equippedRingSlot1.value, equippedRingSlot2.value]) {
      if (!ringMatched && idx >= 0 && idx < ownedRings.value.length && ownedRings.value[idx]!.defId === set.pieces.ring) {
        ringMatched = true
        count++
      }
    }
    if (
      equippedHatIndex.value >= 0 &&
      equippedHatIndex.value < ownedHats.value.length &&
      ownedHats.value[equippedHatIndex.value]!.defId === set.pieces.hat
    )
      count++
    if (
      equippedShoeIndex.value >= 0 &&
      equippedShoeIndex.value < ownedShoes.value.length &&
      ownedShoes.value[equippedShoeIndex.value]!.defId === set.pieces.shoe
    )
      count++
    return count
  }

  /** 当前激活的套装奖励效果列表 */
  const activeSetBonuses = computed(() => {
    const bonuses: { type: RingEffectType; value: number }[] = []
    for (const set of EQUIPMENT_SETS) {
      const count = _getSetPieceCount(set)
      for (const bonus of set.bonuses) {
        if (count >= bonus.count) bonuses.push(...bonus.effects)
      }
    }
    return bonuses
  })

  /** 套装激活状态（供UI显示） */
  const activeSets = computed(() => {
    return EQUIPMENT_SETS.map(set => {
      const equippedCount = _getSetPieceCount(set)
      return {
        id: set.id,
        name: set.name,
        description: set.description,
        equippedCount,
        bonuses: set.bonuses.map(b => ({
          count: b.count,
          description: b.description,
          active: equippedCount >= b.count
        }))
      }
    }).filter(s => s.equippedCount > 0)
  })

  /** 合成戒指 */
  const craftRing = (defId: string): { success: boolean; message: string } => {
    const def = getRingById(defId)
    if (!def || !def.recipe) return { success: false, message: '该戒指无法合成。' }

    // 检查材料
    for (const mat of def.recipe) {
      if (!hasCombinedItem(mat.itemId, mat.quantity)) {
        const matName = getItemById(mat.itemId)?.name ?? mat.itemId
        return { success: false, message: `材料不足：${matName}。` }
      }
    }

    // 检查铜钱（延迟导入避免循环依赖）
    const playerStore = usePlayerStore()
    if (playerStore.money < def.recipeMoney) {
      return { success: false, message: `铜钱不足（需要${def.recipeMoney}文）。` }
    }

    // 消耗材料
    for (const mat of def.recipe) {
      removeCombinedItem(mat.itemId, mat.quantity)
    }
    playerStore.spendMoney(def.recipeMoney)

    // 添加戒指
    addRing(defId)
    return { success: true, message: `合成了${def.name}！` }
  }

  // ============================================================
  // 帽子系统
  // ============================================================

  /** 添加帽子到收藏 */
  const addHat = (defId: string): boolean => {
    ownedHats.value.push({ defId })
    useAchievementStore().discoverItem(defId)
    return true
  }

  /** 检查是否已拥有某帽子 */
  const hasHat = (defId: string): boolean => {
    return ownedHats.value.some(h => h.defId === defId)
  }

  /** 装备帽子 */
  const equipHat = (index: number): boolean => {
    if (index < 0 || index >= ownedHats.value.length) return false
    equippedHatIndex.value = index
    return true
  }

  /** 卸下帽子 */
  const unequipHat = (): boolean => {
    if (equippedHatIndex.value < 0) return false
    equippedHatIndex.value = -1
    return true
  }

  /** 卖出帽子 */
  const sellHat = (index: number): { success: boolean; message: string } => {
    if (index < 0 || index >= ownedHats.value.length) return { success: false, message: '无效索引。' }
    const hat = ownedHats.value[index]!
    const def = getHatById(hat.defId)
    const price = def?.sellPrice ?? 0
    // 自动卸下
    if (equippedHatIndex.value === index) equippedHatIndex.value = -1
    const playerStore = usePlayerStore()
    playerStore.earnMoney(price)
    ownedHats.value.splice(index, 1)
    // 修正装备索引
    if (equippedHatIndex.value > index) equippedHatIndex.value--
    return { success: true, message: `卖出了${def?.name ?? '帽子'}，获得${price}文。` }
  }

  /** 合成帽子 */
  const craftHat = (defId: string): { success: boolean; message: string } => {
    const def = getHatById(defId)
    if (!def || !def.recipe) return { success: false, message: '该帽子无法合成。' }
    for (const mat of def.recipe) {
      if (!hasCombinedItem(mat.itemId, mat.quantity)) {
        const matName = getItemById(mat.itemId)?.name ?? mat.itemId
        return { success: false, message: `材料不足：${matName}。` }
      }
    }
    const playerStore = usePlayerStore()
    if (playerStore.money < def.recipeMoney) {
      return { success: false, message: `铜钱不足（需要${def.recipeMoney}文）。` }
    }
    for (const mat of def.recipe) {
      removeCombinedItem(mat.itemId, mat.quantity)
    }
    playerStore.spendMoney(def.recipeMoney)
    addHat(defId)
    return { success: true, message: `合成了${def.name}！` }
  }

  // ============================================================
  // 鞋子系统
  // ============================================================

  /** 添加鞋子到收藏 */
  const addShoe = (defId: string): boolean => {
    ownedShoes.value.push({ defId })
    useAchievementStore().discoverItem(defId)
    return true
  }

  /** 检查是否已拥有某鞋子 */
  const hasShoe = (defId: string): boolean => {
    return ownedShoes.value.some(s => s.defId === defId)
  }

  /** 装备鞋子 */
  const equipShoe = (index: number): boolean => {
    if (index < 0 || index >= ownedShoes.value.length) return false
    equippedShoeIndex.value = index
    return true
  }

  /** 卸下鞋子 */
  const unequipShoe = (): boolean => {
    if (equippedShoeIndex.value < 0) return false
    equippedShoeIndex.value = -1
    return true
  }

  /** 卖出鞋子 */
  const sellShoe = (index: number): { success: boolean; message: string } => {
    if (index < 0 || index >= ownedShoes.value.length) return { success: false, message: '无效索引。' }
    const shoe = ownedShoes.value[index]!
    const def = getShoeById(shoe.defId)
    const price = def?.sellPrice ?? 0
    // 自动卸下
    if (equippedShoeIndex.value === index) equippedShoeIndex.value = -1
    const playerStore = usePlayerStore()
    playerStore.earnMoney(price)
    ownedShoes.value.splice(index, 1)
    // 修正装备索引
    if (equippedShoeIndex.value > index) equippedShoeIndex.value--
    return { success: true, message: `卖出了${def?.name ?? '鞋子'}，获得${price}文。` }
  }

  /** 合成鞋子 */
  const craftShoe = (defId: string): { success: boolean; message: string } => {
    const def = getShoeById(defId)
    if (!def || !def.recipe) return { success: false, message: '该鞋子无法合成。' }
    for (const mat of def.recipe) {
      if (!hasCombinedItem(mat.itemId, mat.quantity)) {
        const matName = getItemById(mat.itemId)?.name ?? mat.itemId
        return { success: false, message: `材料不足：${matName}。` }
      }
    }
    const playerStore = usePlayerStore()
    if (playerStore.money < def.recipeMoney) {
      return { success: false, message: `铜钱不足（需要${def.recipeMoney}文）。` }
    }
    for (const mat of def.recipe) {
      removeCombinedItem(mat.itemId, mat.quantity)
    }
    playerStore.spendMoney(def.recipeMoney)
    addShoe(defId)
    return { success: true, message: `合成了${def.name}！` }
  }

  // ============================================================
  // 装备方案系统
  // ============================================================

  /** 创建空方案 */
  const createEquipmentPreset = (name: string): boolean => {
    if (equipmentPresets.value.length >= 5) return false
    equipmentPresets.value.push({
      id: Date.now().toString(),
      name,
      weaponDefId: null,
      ringSlot1DefId: null,
      ringSlot2DefId: null,
      hatDefId: null,
      shoeDefId: null
    })
    return true
  }

  /** 删除方案 */
  const deleteEquipmentPreset = (id: string) => {
    const idx = equipmentPresets.value.findIndex(p => p.id === id)
    if (idx >= 0) equipmentPresets.value.splice(idx, 1)
    if (activePresetId.value === id) activePresetId.value = null
  }

  /** 重命名方案 */
  const renameEquipmentPreset = (id: string, name: string) => {
    const preset = equipmentPresets.value.find(p => p.id === id)
    if (preset) preset.name = name.trim() || preset.name
  }

  /** 将当前装备保存到方案 */
  const saveCurrentToPreset = (id: string) => {
    const preset = equipmentPresets.value.find(p => p.id === id)
    if (!preset) return
    preset.weaponDefId = ownedWeapons.value[equippedWeaponIndex.value]?.defId ?? null
    preset.ringSlot1DefId = equippedRingSlot1.value >= 0 ? (ownedRings.value[equippedRingSlot1.value]?.defId ?? null) : null
    preset.ringSlot2DefId = equippedRingSlot2.value >= 0 ? (ownedRings.value[equippedRingSlot2.value]?.defId ?? null) : null
    preset.hatDefId = equippedHatIndex.value >= 0 ? (ownedHats.value[equippedHatIndex.value]?.defId ?? null) : null
    preset.shoeDefId = equippedShoeIndex.value >= 0 ? (ownedShoes.value[equippedShoeIndex.value]?.defId ?? null) : null
  }

  /** 应用装备方案 */
  const applyEquipmentPreset = (id: string): { success: boolean; message: string } => {
    const preset = equipmentPresets.value.find(p => p.id === id)
    if (!preset) return { success: false, message: '方案不存在。' }

    const missing: string[] = []

    // 武器
    if (preset.weaponDefId) {
      const idx = ownedWeapons.value.findIndex(w => w.defId === preset.weaponDefId)
      if (idx >= 0) equipWeapon(idx)
      else missing.push('武器')
    }

    // 戒指槽1
    let ring1Idx = -1
    if (preset.ringSlot1DefId) {
      ring1Idx = ownedRings.value.findIndex(r => r.defId === preset.ringSlot1DefId)
      if (ring1Idx >= 0) equipRing(ring1Idx, 0)
      else missing.push('戒指1')
    } else {
      unequipRing(0)
    }

    // 戒指槽2（禁止与槽1装备同defId戒指）
    if (preset.ringSlot2DefId) {
      if (preset.ringSlot2DefId === preset.ringSlot1DefId) {
        // 旧方案中两个槽保存了同defId戒指，现已禁止，跳过槽2
        unequipRing(1)
        missing.push('戒指2（不可与槽1相同）')
      } else {
        const idx = ownedRings.value.findIndex(r => r.defId === preset.ringSlot2DefId)
        if (idx >= 0) equipRing(idx, 1)
        else missing.push('戒指2')
      }
    } else {
      unequipRing(1)
    }

    // 帽子
    if (preset.hatDefId) {
      const idx = ownedHats.value.findIndex(h => h.defId === preset.hatDefId)
      if (idx >= 0) equipHat(idx)
      else missing.push('帽子')
    } else {
      unequipHat()
    }

    // 鞋子
    if (preset.shoeDefId) {
      const idx = ownedShoes.value.findIndex(s => s.defId === preset.shoeDefId)
      if (idx >= 0) equipShoe(idx)
      else missing.push('鞋子')
    } else {
      unequipShoe()
    }

    activePresetId.value = id

    if (missing.length > 0) {
      return { success: true, message: `已应用方案「${preset.name}」，但${missing.join('、')}已不在背包中。` }
    }
    return { success: true, message: `已应用方案「${preset.name}」。` }
  }

  // ============================================================
  // 装备整理
  // ============================================================

  /** 一键整理所有装备（按价值降序，装备中的置顶） */
  const sortEquipment = () => {
    // --- 武器排序 ---
    const equippedWeapon = ownedWeapons.value[equippedWeaponIndex.value]
    ownedWeapons.value.sort((a, b) => {
      const defA = getWeaponById(a.defId)
      const defB = getWeaponById(b.defId)
      // 攻击力降序
      const atkDiff = (defB?.attack ?? 0) - (defA?.attack ?? 0)
      if (atkDiff !== 0) return atkDiff
      // 附魔加成降序
      const enchA = a.enchantmentId ? (getEnchantmentById(a.enchantmentId)?.attackBonus ?? 0) : 0
      const enchB = b.enchantmentId ? (getEnchantmentById(b.enchantmentId)?.attackBonus ?? 0) : 0
      if (enchB !== enchA) return enchB - enchA
      return a.defId.localeCompare(b.defId)
    })
    equippedWeaponIndex.value = equippedWeapon ? ownedWeapons.value.indexOf(equippedWeapon) : 0

    // --- 戒指排序 ---
    const equippedRing1 = equippedRingSlot1.value >= 0 ? ownedRings.value[equippedRingSlot1.value] : undefined
    const equippedRing2 = equippedRingSlot2.value >= 0 ? ownedRings.value[equippedRingSlot2.value] : undefined
    ownedRings.value.sort((a, b) => {
      const priceA = getRingById(a.defId)?.sellPrice ?? 0
      const priceB = getRingById(b.defId)?.sellPrice ?? 0
      if (priceB !== priceA) return priceB - priceA
      return a.defId.localeCompare(b.defId)
    })
    equippedRingSlot1.value = equippedRing1 ? ownedRings.value.indexOf(equippedRing1) : -1
    equippedRingSlot2.value = equippedRing2 ? ownedRings.value.indexOf(equippedRing2) : -1

    // --- 帽子排序 ---
    const equippedHat = equippedHatIndex.value >= 0 ? ownedHats.value[equippedHatIndex.value] : undefined
    ownedHats.value.sort((a, b) => {
      const priceA = getHatById(a.defId)?.sellPrice ?? 0
      const priceB = getHatById(b.defId)?.sellPrice ?? 0
      if (priceB !== priceA) return priceB - priceA
      return a.defId.localeCompare(b.defId)
    })
    equippedHatIndex.value = equippedHat ? ownedHats.value.indexOf(equippedHat) : -1

    // --- 鞋子排序 ---
    const equippedShoe = equippedShoeIndex.value >= 0 ? ownedShoes.value[equippedShoeIndex.value] : undefined
    ownedShoes.value.sort((a, b) => {
      const priceA = getShoeById(a.defId)?.sellPrice ?? 0
      const priceB = getShoeById(b.defId)?.sellPrice ?? 0
      if (priceB !== priceA) return priceB - priceA
      return a.defId.localeCompare(b.defId)
    })
    equippedShoeIndex.value = equippedShoe ? ownedShoes.value.indexOf(equippedShoe) : -1
  }

  const serialize = () => {
    return {
      items: items.value,
      capacity: capacity.value,
      tempItems: tempItems.value,
      tools: tools.value,
      ownedWeapons: ownedWeapons.value,
      equippedWeaponIndex: equippedWeaponIndex.value,
      pendingUpgrade: pendingUpgrade.value,
      ownedRings: ownedRings.value,
      equippedRingSlot1: equippedRingSlot1.value,
      equippedRingSlot2: equippedRingSlot2.value,
      ownedHats: ownedHats.value,
      equippedHatIndex: equippedHatIndex.value,
      ownedShoes: ownedShoes.value,
      equippedShoeIndex: equippedShoeIndex.value,
      equipmentPresets: equipmentPresets.value,
      activePresetId: activePresetId.value
    }
  }

  const deserialize = (data: ReturnType<typeof serialize>) => {
    items.value = (data.items ?? []).filter(i => getItemById(i.itemId))
    capacity.value = data.capacity ?? INITIAL_CAPACITY
    tempItems.value = ((data as any).tempItems ?? []).filter((i: InventoryItem) => getItemById(i.itemId))
    tools.value = data.tools ?? [
      { type: 'wateringCan', tier: 'basic' },
      { type: 'hoe', tier: 'basic' },
      { type: 'pickaxe', tier: 'basic' },
      { type: 'fishingRod', tier: 'basic' },
      { type: 'scythe', tier: 'basic' },
      { type: 'axe', tier: 'basic' },
      { type: 'pan', tier: 'basic' }
    ]
    // 向后兼容：旧存档可能缺少新工具
    const requiredTools: ToolType[] = ['wateringCan', 'hoe', 'pickaxe', 'fishingRod', 'scythe', 'axe', 'pan']
    for (const rt of requiredTools) {
      if (!tools.value.find(t => t.type === rt)) {
        tools.value.push({ type: rt, tier: 'basic' })
      }
    }

    // 新版武器系统
    if ((data as any).ownedWeapons) {
      ownedWeapons.value = (data as any).ownedWeapons
      equippedWeaponIndex.value = (data as any).equippedWeaponIndex ?? 0
    } else {
      // 旧存档迁移：weapon: { tier: 'copper' } → ownedWeapons
      const oldWeapon = (data as any).weapon
      if (oldWeapon?.tier) {
        const tierMap: Record<string, string> = {
          wood: 'wooden_stick',
          copper: 'copper_sword',
          iron: 'iron_blade',
          gold: 'gold_halberd'
        }
        const defId = tierMap[oldWeapon.tier as string] ?? 'wooden_stick'
        ownedWeapons.value = [{ defId, enchantmentId: null }]
        equippedWeaponIndex.value = 0
      } else {
        ownedWeapons.value = [{ defId: 'wooden_stick', enchantmentId: null }]
        equippedWeaponIndex.value = 0
      }
    }

    pendingUpgrade.value = (data as any).pendingUpgrade ?? null

    // 戒指系统（向后兼容旧存档）
    ownedRings.value = ((data as Record<string, unknown>).ownedRings as OwnedRing[]) ?? []
    equippedRingSlot1.value = ((data as Record<string, unknown>).equippedRingSlot1 as number | undefined) ?? -1
    equippedRingSlot2.value = ((data as Record<string, unknown>).equippedRingSlot2 as number | undefined) ?? -1
    // 修复无效索引
    if (equippedRingSlot1.value >= ownedRings.value.length) equippedRingSlot1.value = -1
    if (equippedRingSlot2.value >= ownedRings.value.length) equippedRingSlot2.value = -1

    // 帽子系统（向后兼容旧存档）
    ownedHats.value = ((data as Record<string, unknown>).ownedHats as OwnedHat[]) ?? []
    equippedHatIndex.value = ((data as Record<string, unknown>).equippedHatIndex as number | undefined) ?? -1
    if (equippedHatIndex.value >= ownedHats.value.length) equippedHatIndex.value = -1

    // 鞋子系统（向后兼容旧存档）
    ownedShoes.value = ((data as Record<string, unknown>).ownedShoes as OwnedShoe[]) ?? []
    equippedShoeIndex.value = ((data as Record<string, unknown>).equippedShoeIndex as number | undefined) ?? -1
    if (equippedShoeIndex.value >= ownedShoes.value.length) equippedShoeIndex.value = -1

    // 装备方案（向后兼容旧存档）
    equipmentPresets.value = ((data as Record<string, unknown>).equipmentPresets as EquipmentPreset[] | undefined) ?? []
    activePresetId.value = ((data as Record<string, unknown>).activePresetId as string | null | undefined) ?? null
  }

  return {
    items,
    capacity,
    tools,
    ownedWeapons,
    equippedWeaponIndex,
    pendingUpgrade,
    isFull,
    tempItems,
    isTempFull,
    isAllFull,
    addItem,
    removeItem,
    getItemCount,
    hasItem,
    expandCapacity,
    expandCapacityExtra,
    MAX_CAPACITY,
    moveFromTemp,
    moveAllFromTemp,
    discardTempItem,
    sortItems,
    toggleLock,
    getTool,
    getToolStaminaMultiplier,
    getToolBatchCount,
    upgradeTool,
    isToolAvailable,
    startUpgrade,
    dailyUpgradeUpdate,
    getWeaponAttack,
    getWeaponCritRate,
    getEquippedWeapon,
    addWeapon,
    hasWeapon,
    hasWeaponExact,
    equipWeapon,
    sellWeapon,
    ownedRings,
    equippedRingSlot1,
    equippedRingSlot2,
    addRing,
    hasRing,
    equipRing,
    unequipRing,
    sellRing,
    getRingEffectValue,
    getEquipmentBonus,
    craftRing,
    activeSets,
    ownedHats,
    equippedHatIndex,
    addHat,
    hasHat,
    equipHat,
    unequipHat,
    sellHat,
    craftHat,
    ownedShoes,
    equippedShoeIndex,
    addShoe,
    hasShoe,
    equipShoe,
    unequipShoe,
    sellShoe,
    craftShoe,
    equipmentPresets,
    activePresetId,
    createEquipmentPreset,
    deleteEquipmentPreset,
    renameEquipmentPreset,
    saveCurrentToPreset,
    applyEquipmentPreset,
    sortEquipment,
    serialize,
    deserialize
  }
})
