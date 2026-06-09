import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Season } from '@/types'
import { getItemById } from '@/data'
import { RECIPES } from '@/data/recipes'
import {
  getTavernUpgrade,
  getGuidePrice,
  clampPlayerPrice,
  DEFAULT_TAVERN_NAME,
  normalizeTavernName,
  TAVERN_EMPLOYEE_NAMES,
  calcEmployeeSalary,
  calcTrainingCost,
  calcTrainingGain,
  type TavernMenuSlotType
} from '@/data/tavern'
import { getNpcTavernPref, NPC_TAVERN_PREFS } from '@/data/npcTavernPrefs'
import { FRUIT_TREE_DEFS } from '@/data/fruitTrees'
import { usePlayerStore } from './usePlayerStore'
import { useCookingStore } from './useCookingStore'
import { useHomeStore } from './useHomeStore'
import { useGameStore } from './useGameStore'
import { useSkillStore } from './useSkillStore'
import { useNpcStore } from './useNpcStore'
import { getCombinedItemCount, removeCombinedItem } from '@/composables/useCombinedInventory'

export type TavernTodayMode = 'auto' | 'manual' | 'closed'

export interface TavernMenuSlot {
  type: TavernMenuSlotType
  itemId: string | null
  priceMult: number
  cellarSlotIndex?: number
}

export interface TavernEmployee {
  id: string
  name: string
  role: 'chef' | 'waiter'
  cooking: number
  eq: number
  iq: number
  stamina: number
  maxStamina: number
  salary: number
  onDuty: boolean
}

export interface ManualGuest {
  isNpc: boolean
  npcId?: string
  slotIndex: number
  favoriteMatch: boolean
}

export interface ManualSession {
  step: 'check' | 'serve' | 'kitchen' | 'deliver' | 'checkout' | 'done'
  queue: ManualGuest[]
  currentIndex: number
  todayEarnings: number
  todayTips: number
  servedCount: number
}

export interface FeastOrder {
  id: string
  npcId: string
  itemIds: string[]
  rewardMoney: number
  rewardReputation: number
  deadlineDay: number
  completed: boolean
}

export interface TavernCandidate {
  name: string
  role: 'chef' | 'waiter'
  cooking: number
  eq: number
  iq: number
  stamina: number
  salary: number
}

const WINE_IDS = new Set([
  'watermelon_wine', 'osmanthus_wine', 'peach_wine', 'jujube_wine',
  'corn_wine', 'cactus_wine', 'date_wine', 'rice_vinegar'
])

export function getItemMenuCategory(itemId: string): TavernMenuSlotType | null {
  const item = getItemById(itemId)
  if (!item) return null
  if (WINE_IDS.has(itemId) || itemId.endsWith('_wine')) return 'wine'
  if (item.category === 'fruit') return 'fruit'
  if (item.category === 'food') return 'dish'
  if (item.category === 'processed') return 'snack'
  return null
}

function emptyMenuSlots(level: number): TavernMenuSlot[] {
  const def = getTavernUpgrade(level)
  if (!def) return []
  const slots: TavernMenuSlot[] = []
  const pushSlots = (type: TavernMenuSlotType, count: number) => {
    for (let i = 0; i < count; i++) slots.push({ type, itemId: null, priceMult: 1 })
  }
  pushSlots('wine', def.slots.wine)
  pushSlots('dish', def.slots.dish)
  pushSlots('snack', def.slots.snack)
  pushSlots('fruit', def.slots.fruit)
  pushSlots('cellar', def.slots.cellar)
  return slots
}

export const useTavernStore = defineStore('tavern', () => {
  const tavernLevel = ref(0)
  const customName = ref('')
  const reputation = ref(50)
  const todayMode = ref<TavernTodayMode>('auto')
  const menuSlots = ref<TavernMenuSlot[]>([])
  const employees = ref<TavernEmployee[]>([])
  const manualSession = ref<ManualSession | null>(null)
  const feastOrders = ref<FeastOrder[]>([])
  const candidates = ref<TavernCandidate[]>([])
  const manualStaminaUsed = ref(0)

  const isBuilt = computed(() => tavernLevel.value >= 1)
  const currentUpgrade = computed(() => getTavernUpgrade(tavernLevel.value))
  const nextUpgrade = computed(() => getTavernUpgrade(tavernLevel.value + 1))

  /** 扩建等级默认名（如前厅·贰） */
  const tierName = computed(() => currentUpgrade.value?.name ?? DEFAULT_TAVERN_NAME)

  /** 玩家自定义店名；未设时回退扩建等级名 */
  const displayName = computed(() => {
    const custom = normalizeTavernName(customName.value)
    return custom || tierName.value
  })

  const canBuild = computed(() => {
    const home = useHomeStore()
    return home.farmhouseLevel >= 3 && tavernLevel.value === 0
  })

  /** 是否有空余员工槽位可招聘 */
  const canHireStaff = computed(() => {
    const def = currentUpgrade.value
    if (!def) return false
    const chefCount = employees.value.filter(e => e.role === 'chef').length
    const waiterCount = employees.value.filter(e => e.role === 'waiter').length
    return chefCount < def.staffMax.chef || waiterCount < def.staffMax.waiter
  })

  const getEffectiveCookingLevel = (): number => {
    const skill = useSkillStore().getSkill('cooking')
    let level = skill.level
    if (skill.perk10 === 'tavern_master') level = Math.min(10, level + 2)
    return level
  }

  const hasTavernMaster = (): boolean => useSkillStore().getSkill('cooking').perk10 === 'tavern_master'

  const getSlotStock = (slot: TavernMenuSlot): number => {
    if (!slot.itemId) return 0
    if (slot.type === 'cellar' && slot.cellarSlotIndex != null) {
      const home = useHomeStore()
      return slot.cellarSlotIndex < home.cellarSlots.length ? 1 : 0
    }
    return getCombinedItemCount(slot.itemId)
  }

  const getSlotGuidePrice = (slot: TavernMenuSlot, season?: Season): number => {
    if (!slot.itemId) return 0
    const item = getItemById(slot.itemId)
    if (!item) return 0
    const gameSeason = season ?? useGameStore().season
    let sellPrice = item.sellPrice
    let addedValue = 0
    if (slot.type === 'cellar' && slot.cellarSlotIndex != null) {
      const cellar = useHomeStore().cellarSlots[slot.cellarSlotIndex]
      if (cellar) addedValue = cellar.addedValue
    }
    return getGuidePrice({
      slot: slot.type,
      sellPrice,
      season: gameSeason,
      fruitItemId: slot.type === 'fruit' ? slot.itemId : undefined,
      addedValue,
      tavernMaster: hasTavernMaster() && (slot.type === 'dish' || slot.type === 'snack')
    })
  }

  const getSlotSellPrice = (slot: TavernMenuSlot, season?: Season): number => {
    const guide = getSlotGuidePrice(slot, season)
    return clampPlayerPrice(guide, slot.priceMult)
  }

  const consumeSlotStock = (slot: TavernMenuSlot): boolean => {
    if (!slot.itemId) return false
    if (slot.type === 'cellar' && slot.cellarSlotIndex != null) {
      const home = useHomeStore()
      if (slot.cellarSlotIndex >= home.cellarSlots.length) return false
      home.cellarSlots.splice(slot.cellarSlotIndex, 1)
      return true
    }
    return removeCombinedItem(slot.itemId, 1)
  }

  const getActiveMenuSlots = (): TavernMenuSlot[] => {
    return menuSlots.value.filter(s => s.itemId && getSlotStock(s) > 0)
  }

  const buildTavern = (name?: string): boolean => {
    if (!canBuild.value) return false
    const def = getTavernUpgrade(1)!
    const player = usePlayerStore()
    for (const mat of def.materialCost) {
      if (getCombinedItemCount(mat.itemId) < mat.quantity) return false
    }
    if (!player.spendMoney(def.cost)) return false
    for (const mat of def.materialCost) removeCombinedItem(mat.itemId, mat.quantity)
    tavernLevel.value = 1
    menuSlots.value = emptyMenuSlots(1)
    reputation.value = 50
    if (name !== undefined) {
      customName.value = normalizeTavernName(name)
    }
    return true
  }

  const setCustomName = (name: string): boolean => {
    if (tavernLevel.value < 1) return false
    const normalized = normalizeTavernName(name)
    if (!normalized) return false
    customName.value = normalized
    return true
  }

  const upgradeTavern = (): boolean => {
    const next = nextUpgrade.value
    if (!next || tavernLevel.value < 1) return false
    const player = usePlayerStore()
    for (const mat of next.materialCost) {
      if (getCombinedItemCount(mat.itemId) < mat.quantity) return false
    }
    if (!player.spendMoney(next.cost)) return false
    for (const mat of next.materialCost) removeCombinedItem(mat.itemId, mat.quantity)
    const oldSlots = [...menuSlots.value]
    tavernLevel.value = next.level
    const newSlots = emptyMenuSlots(next.level)
    // 按类型匹配：保留同类型旧槽位的上架选择
    for (const newSlot of newSlots) {
      const oldMatch = oldSlots.find(s => s.type === newSlot.type && s.itemId)
      if (oldMatch) {
        newSlot.itemId = oldMatch.itemId
        newSlot.priceMult = oldMatch.priceMult
        newSlot.cellarSlotIndex = oldMatch.cellarSlotIndex
        oldMatch.itemId = null // 防止同一旧槽被重复匹配
      }
    }
    menuSlots.value = newSlots
    return true
  }

  const setMenuSlot = (index: number, itemId: string | null, cellarSlotIndex?: number): boolean => {
    const slot = menuSlots.value[index]
    if (!slot) return false
    if (itemId) {
      if (slot.type === 'cellar') {
        if (cellarSlotIndex == null) return false
        const cellar = useHomeStore().cellarSlots[cellarSlotIndex]
        if (!cellar) return false
        slot.itemId = cellar.itemId
        slot.cellarSlotIndex = cellarSlotIndex
      } else {
        const cat = getItemMenuCategory(itemId)
        if (cat !== slot.type) return false
        slot.itemId = itemId
        slot.cellarSlotIndex = undefined
      }
    } else {
      slot.itemId = null
      slot.cellarSlotIndex = undefined
    }
    return true
  }

  const setSlotPriceMult = (index: number, mult: number): void => {
    const slot = menuSlots.value[index]
    if (!slot) return
    slot.priceMult = Math.max(0.85, Math.min(1.4, Math.round(mult * 100) / 100))
  }

  const setTodayMode = (mode: TavernTodayMode): boolean => {
    if (tavernLevel.value < 1) return false
    if (mode === 'manual' && manualSession.value) return false
    if (todayMode.value === 'manual' && mode === 'auto') return false
    todayMode.value = mode
    return true
  }

  const refreshCandidates = (): void => {
    const def = currentUpgrade.value
    if (!def) return
    const chefCount = employees.value.filter(e => e.role === 'chef').length
    const waiterCount = employees.value.filter(e => e.role === 'waiter').length
    const pool: TavernCandidate[] = []
    const roles: ('chef' | 'waiter')[] = []
    if (chefCount < def.staffMax.chef) roles.push('chef')
    if (waiterCount < def.staffMax.waiter) roles.push('waiter')
    if (roles.length === 0) {
      candidates.value = []
      return
    }
    for (let i = 0; i < 3; i++) {
      const role = roles[i % roles.length]!
      const cooking = 2 + Math.floor(Math.random() * 6)
      const eq = 2 + Math.floor(Math.random() * 6)
      const iq = 2 + Math.floor(Math.random() * 6)
      const stamina = 80 + Math.floor(Math.random() * 20)
      const adjCooking = role === 'chef' ? cooking + 2 : cooking
      const adjEq = role === 'waiter' ? eq + 2 : eq
      pool.push({
        name: TAVERN_EMPLOYEE_NAMES[Math.floor(Math.random() * TAVERN_EMPLOYEE_NAMES.length)]!,
        role,
        cooking: adjCooking,
        eq: adjEq,
        iq,
        stamina,
        salary: calcEmployeeSalary({ cooking: adjCooking, eq: adjEq, iq })
      })
    }
    candidates.value = pool
  }

  const hireCandidate = (index: number): boolean => {
    const c = candidates.value[index]
    const def = currentUpgrade.value
    if (!c || !def) return false
    const count = employees.value.filter(e => e.role === c.role).length
    const max = c.role === 'chef' ? def.staffMax.chef : def.staffMax.waiter
    if (count >= max) return false
    employees.value.push({
      id: `emp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: c.name,
      role: c.role,
      cooking: c.cooking,
      eq: c.eq,
      iq: c.iq,
      stamina: c.stamina,
      maxStamina: c.stamina,
      salary: c.salary,
      onDuty: true
    })
    candidates.value.splice(index, 1)
    return true
  }

  const trainEmployee = (empId: string, attr: 'cooking' | 'eq' | 'iq' | 'stamina'): boolean => {
    const emp = employees.value.find(e => e.id === empId)
    if (!emp) return false
    const cost = calcTrainingCost(emp[attr])
    if (!usePlayerStore().spendMoney(cost)) return false
    const gain = calcTrainingGain(emp.iq)
    if (attr === 'stamina') {
      emp.maxStamina += gain
      emp.stamina = Math.min(emp.maxStamina, emp.stamina + gain)
    } else {
      emp[attr] = Math.min(10, emp[attr] + gain)
      emp.salary = calcEmployeeSalary(emp)
    }
    return true
  }

  const toggleEmployeeDuty = (empId: string): void => {
    const emp = employees.value.find(e => e.id === empId)
    if (emp) emp.onDuty = !emp.onDuty
  }

  const buildManualQueue = (): ManualGuest[] => {
    const def = currentUpgrade.value!
    const active = getActiveMenuSlots()
    const activeEntries = menuSlots.value
      .map((slot, index) => ({ slot, index }))
      .filter(({ slot }) => slot.itemId && getSlotStock(slot) > 0)
    if (activeEntries.length === 0) return []
    const guestCount = Math.max(2, Math.floor(def.baseGuests * (0.9 + reputation.value / 200) * 1.15))
    const queue: ManualGuest[] = []
    for (let i = 0; i < guestCount; i++) {
      const isNpc = Math.random() < 0.25
      let npcId: string | undefined
      let favoriteMatch = false
      if (isNpc) {
        const npcIds = NPC_TAVERN_PREFS.map(p => p.npcId)
        npcId = npcIds[Math.floor(Math.random() * npcIds.length)]!
        const pref = getNpcTavernPref(npcId)
        if (pref) {
          const favIds = [pref.favoriteDrink, pref.favoriteDish, pref.favoriteFruit].filter(Boolean) as string[]
          favoriteMatch = active.some(s => favIds.includes(s.itemId!))
        }
      }
      const entry = activeEntries[Math.floor(Math.random() * activeEntries.length)]!
      queue.push({ isNpc, npcId, slotIndex: entry.index, favoriteMatch })
    }
    return queue
  }

  const startManualShift = (): boolean => {
    if (tavernLevel.value < 1 || todayMode.value === 'manual') return false
    const queue = buildManualQueue()
    if (queue.length === 0) return false
    todayMode.value = 'manual'
    manualStaminaUsed.value = 0
    manualSession.value = {
      step: 'check',
      queue,
      currentIndex: 0,
      todayEarnings: 0,
      todayTips: 0,
      servedCount: 0
    }
    return true
  }

  const getManualStaminaCost = (step: ManualSession['step']): number => {
    const costs: Record<string, number> = { serve: 4, kitchen: 8, deliver: 5, checkout: 3 }
    const base = costs[step] ?? 0
    if (step === 'kitchen' && base > 0) {
      const reduction = useSkillStore().getStaminaReduction('cooking')
      return Math.max(1, Math.floor(base * (1 - reduction)))
    }
    return base
  }

  const advanceManualStep = (): { success: boolean; message: string } => {
    const session = manualSession.value
    if (!session || session.step === 'done') return { success: false, message: '当前无营业会话。' }
    const player = usePlayerStore()
    const maxStamina = player.maxStamina
    if (manualStaminaUsed.value >= maxStamina) return { success: false, message: '今日体力已用尽，请打烊。' }

    if (session.step === 'check') {
      session.step = 'serve'
      return { success: true, message: '开铺检查完毕，客人陆续进店。' }
    }

    if (session.currentIndex >= session.queue.length) {
      session.step = 'done'
      return { success: true, message: '所有客人已接待完毕。' }
    }

    const stepFlow: ManualSession['step'][] = ['serve', 'kitchen', 'deliver', 'checkout']
    const cost = getManualStaminaCost(session.step)
    if (cost > 0) {
      if (!player.consumeStamina(cost)) return { success: false, message: '体力不足。' }
      manualStaminaUsed.value += cost
      useGameStore().advanceTime(15)
    }

    const idx = stepFlow.indexOf(session.step)
    if (idx < stepFlow.length - 1) {
      session.step = stepFlow[idx + 1]!
      return { success: true, message: '继续接待中……' }
    }

    const guest = session.queue[session.currentIndex]!
    const slot = menuSlots.value[guest.slotIndex]!
    if (getSlotStock(slot) <= 0) {
      reputation.value = Math.max(0, reputation.value - 1)
      session.currentIndex++
      session.step = 'serve'
      return { success: true, message: '缺货，客人扫兴离去，口碑-1。' }
    }

    const cookLevel = getEffectiveCookingLevel()
    const mistakeRate = Math.max(0, 0.08 - cookLevel * 0.007 - (hasTavernMaster() ? 0.03 : 0))
    const home = useHomeStore()
    const farmhouseBonus = home.farmhouseLevel >= 1 ? 0.02 : 0
    const finalMistake = Math.max(0, mistakeRate - farmhouseBonus)
    if (Math.random() < finalMistake) {
      session.step = 'kitchen'
      return { success: true, message: '菜品失误，需重做。' }
    }

    if (!consumeSlotStock(slot)) {
      session.currentIndex++
      session.step = 'serve'
      return { success: true, message: '扣料失败，跳过该客。' }
    }

    const price = getSlotSellPrice(slot)
    const tipRate = 0.05 + cookLevel * 0.02 + (guest.favoriteMatch ? 0.08 : 0)
    const tip = Math.floor(price * tipRate)
    session.todayEarnings += price
    session.todayTips += tip
    session.servedCount++

    if (guest.isNpc && guest.npcId) {
      const gain = guest.favoriteMatch ? 3 : 1
      useNpcStore().adjustFriendship(guest.npcId, gain)
    }

    session.currentIndex++
    session.step = 'serve'
    return { success: true, message: `结账 ${price} 文${tip > 0 ? `，小费 ${tip} 文` : ''}。` }
  }

  const closeManualShift = (): { revenue: number; tips: number } => {
    const session = manualSession.value
    if (!session) return { revenue: 0, tips: 0 }
    const total = session.todayEarnings + session.todayTips
    if (total > 0) usePlayerStore().earnMoney(total)
    reputation.value = Math.min(100, reputation.value + Math.floor(session.servedCount / 3))
    manualSession.value = null
    return { revenue: session.todayEarnings, tips: session.todayTips }
  }

  const checkFeastUnlocks = (): void => {
    const npcStore = useNpcStore()
    for (const pref of NPC_TAVERN_PREFS) {
      const p = getNpcTavernPref(pref.npcId)
      if (!p?.feastUnlockHearts) continue
      const state = npcStore.getNpcState(pref.npcId)
      if (!state) continue
      const hearts = p.feastUnlockHearts * 250
      if (state.friendship < hearts) continue
      if (feastOrders.value.some(o => o.npcId === pref.npcId && !o.completed)) continue
      const favItems = [p.favoriteDrink, p.favoriteDish, p.favoriteFruit].filter(Boolean) as string[]
      if (favItems.length === 0) continue
      feastOrders.value.push({
        id: `feast_${pref.npcId}_${Date.now()}`,
        npcId: pref.npcId,
        itemIds: favItems.slice(0, 2),
        rewardMoney: 500 + hearts,
        rewardReputation: 5,
        deadlineDay: useGameStore().day + 7,
        completed: false
      })
    }
  }

  const completeFeast = (orderId: string): boolean => {
    const order = feastOrders.value.find(o => o.id === orderId && !o.completed)
    if (!order) return false
    if (useGameStore().day > order.deadlineDay) return false
    for (const itemId of order.itemIds) {
      if (getCombinedItemCount(itemId) < 1) return false
    }
    for (const itemId of order.itemIds) removeCombinedItem(itemId, 1)
    order.completed = true
    usePlayerStore().earnMoney(order.rewardMoney)
    reputation.value = Math.min(100, reputation.value + order.rewardReputation)
    useNpcStore().adjustFriendship(order.npcId, 50)
    return true
  }

  const getUnlockedMenuItems = (type: TavernMenuSlotType): { id: string; name: string; cellarIndex?: number }[] => {
    const cooking = useCookingStore()
    const items: { id: string; name: string; cellarIndex?: number }[] = []
    if (type === 'cellar') {
      const home = useHomeStore()
      home.cellarSlots.forEach((s, i) => {
        const def = getItemById(s.itemId)
        if (def) items.push({ id: s.itemId, name: `${def.name}（窖${i + 1}）`, cellarIndex: i })
      })
      return items
    }
    if (type === 'dish' || type === 'snack') {
      for (const recipe of RECIPES) {
        const outId = `food_${recipe.id}`
        if (!cooking.unlockedRecipes.includes(recipe.id)) continue
        const cat = getItemMenuCategory(outId)
        if (cat === type) {
          const def = getItemById(outId)
          if (def) items.push({ id: outId, name: def.name })
        }
      }
    }
    if (type === 'wine') {
      for (const id of WINE_IDS) {
        const def = getItemById(id)
        if (def) items.push({ id, name: def.name })
      }
    }
    if (type === 'fruit') {
      for (const t of FRUIT_TREE_DEFS) {
        const def = getItemById(t.fruitId)
        if (def) items.push({ id: t.fruitId, name: def.name })
      }
    }
    return items
  }

  const onNewDay = (): void => {
    if (manualSession.value) closeManualShift()
    todayMode.value = 'auto'
    manualStaminaUsed.value = 0
    for (const emp of employees.value) {
      emp.stamina = Math.min(emp.maxStamina, emp.stamina + Math.floor(emp.maxStamina * 0.5))
    }
    feastOrders.value = feastOrders.value.filter(o => !o.completed && useGameStore().day <= o.deadlineDay)
    checkFeastUnlocks()
  }

  const serialize = () => ({
    tavernLevel: tavernLevel.value,
    customName: customName.value,
    reputation: reputation.value,
    todayMode: todayMode.value,
    menuSlots: menuSlots.value,
    employees: employees.value,
    manualSession: manualSession.value,
    feastOrders: feastOrders.value,
    manualStaminaUsed: manualStaminaUsed.value
  })

  const deserialize = (data: any) => {
    tavernLevel.value = data?.tavernLevel ?? 0
    customName.value = data?.customName ?? ''
    reputation.value = data?.reputation ?? 50
    todayMode.value = data?.todayMode ?? 'auto'
    menuSlots.value = data?.menuSlots ?? (tavernLevel.value > 0 ? emptyMenuSlots(tavernLevel.value) : [])
    employees.value = data?.employees ?? []
    manualSession.value = data?.manualSession ?? null
    feastOrders.value = data?.feastOrders ?? []
    manualStaminaUsed.value = data?.manualStaminaUsed ?? 0
    if (tavernLevel.value > 0 && menuSlots.value.length === 0) {
      menuSlots.value = emptyMenuSlots(tavernLevel.value)
    }
  }

  return {
    tavernLevel,
    customName,
    tierName,
    displayName,
    reputation,
    todayMode,
    menuSlots,
    employees,
    manualSession,
    feastOrders,
    candidates,
    manualStaminaUsed,
    isBuilt,
    currentUpgrade,
    nextUpgrade,
    canBuild,
    canHireStaff,
    getEffectiveCookingLevel,
    hasTavernMaster,
    getSlotStock,
    getSlotGuidePrice,
    getSlotSellPrice,
    getActiveMenuSlots,
    buildTavern,
    setCustomName,
    upgradeTavern,
    setMenuSlot,
    setSlotPriceMult,
    setTodayMode,
    refreshCandidates,
    hireCandidate,
    trainEmployee,
    toggleEmployeeDuty,
    startManualShift,
    advanceManualStep,
    closeManualShift,
    checkFeastUnlocks,
    completeFeast,
    getUnlockedMenuItems,
    consumeSlotStock,
    onNewDay,
    serialize,
    deserialize
  }
})
