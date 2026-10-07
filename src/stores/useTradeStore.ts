import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { TradeActionResult, TradeOrder, TradePoolContext, TradeRewardDef } from '@/types'
import { getItemById } from '@/data/items'
import {
  TRADE_QUALITY_MULTIPLIER,
  TRADE_QUALITY_ORDER,
  calcOrderPoints,
  generateDailyOrders,
  generateWeeklyOrder,
  getTradeRewardById,
  getTradeUnitPrice
} from '@/data/trade'
import { addLog } from '@/composables/useGameLog'
import { getCombinedItemCount, removeCombinedItem } from '@/composables/useCombinedInventory'
import { useGameStore } from './useGameStore'
import { useInventoryStore } from './useInventoryStore'
import { useAnimalStore } from './useAnimalStore'
import { useFarmStore } from './useFarmStore'
import { useHomeStore } from './useHomeStore'
import { useProcessingStore } from './useProcessingStore'
import { useMiningStore } from './useMiningStore'

const DAYS_PER_SEASON = 28
const DAYS_PER_YEAR = 112
const DAYS_PER_WEEK = 7

/** 背包单格堆叠上限，与 useInventoryStore 保持一致 */
const INVENTORY_MAX_STACK = 999

/** 存档里的订单是否还能用（物品定义被删掉的订单直接丢弃） */
const isValidOrder = (order: TradeOrder | null | undefined): order is TradeOrder =>
  !!order && Array.isArray(order.lines) && order.lines.length > 0 && order.lines.every(line => !!getItemById(line.itemId))

/** 计数 +1（返回新对象） */
const increaseCount = (record: Record<string, number>, key: string): Record<string, number> => ({
  ...record,
  [key]: (record[key] ?? 0) + 1
})

export const useTradeStore = defineStore('trade', () => {
  /** 商会积分 */
  const points = ref(0)
  /** 今日订单 */
  const dailyOrders = ref<TradeOrder[]>([])
  /** 日单所属日序号（-1 = 未生成） */
  const dailyKey = ref(-1)
  /** 本周订单 */
  const weeklyOrder = ref<TradeOrder | null>(null)
  /** 周单与每周限兑所属周序号（-1 = 未生成） */
  const weeklyKey = ref(-1)
  /** 本周兑换次数 { itemId: 次数 } */
  const weeklyRedeemed = ref<Record<string, number>>({})
  /** 累计兑换次数 { itemId: 次数 } */
  const totalRedeemed = ref<Record<string, number>>({})

  // ==================== 日期 ====================

  /** 当前日序号（第 1 年春第 1 天 = 1） */
  const getDayIndex = (): number => {
    const gameStore = useGameStore()
    return (gameStore.year - 1) * DAYS_PER_YEAR + gameStore.seasonIndex * DAYS_PER_SEASON + gameStore.day
  }

  /** 当前周序号（每季 4 周，周不跨季） */
  const getWeekIndex = (): number => Math.floor((getDayIndex() - 1) / DAYS_PER_WEEK)

  // ==================== 订单 ====================

  /** 收集玩家进度，决定订单能出哪些物品 */
  const buildPoolContext = (): TradePoolContext => {
    const miningStore = useMiningStore()
    return {
      season: useGameStore().season,
      hasGreenhouse: useHomeStore().greenhouseUnlocked,
      animalTypes: [...new Set(useAnimalStore().animals.map(a => a.type))],
      fruitTreeTypes: [...new Set(useFarmStore().fruitTrees.map(t => t.type))],
      machineTypes: [...new Set(useProcessingStore().machines.map(m => m.machineType))],
      mineSafeFloor: miningStore.safePointFloor,
      skullCavernReached: miningStore.skullCavernBestFloor > 0
    }
  }

  /** 惰性刷新：日序号变了换日单，周序号变了换周单并清零每周限兑 */
  const refreshOrders = () => {
    const day = getDayIndex()
    const week = getWeekIndex()
    if (day === dailyKey.value && week === weeklyKey.value) return
    const ctx = buildPoolContext()
    if (day !== dailyKey.value) {
      dailyOrders.value = generateDailyOrders(ctx, day)
      dailyKey.value = day
    }
    if (week !== weeklyKey.value) {
      weeklyOrder.value = generateWeeklyOrder(ctx, week)
      weeklyKey.value = week
      weeklyRedeemed.value = {}
    }
  }

  /** 订单当前能否交付（背包 + 仓库箱子合计，全部品质都算） */
  const canDeliver = (order: TradeOrder): boolean => {
    if (order.delivered) return false
    return order.lines.every(line => getCombinedItemCount(line.itemId) >= line.quantity)
  }

  const findOrder = (orderId: string): TradeOrder | null =>
    dailyOrders.value.find(o => o.id === orderId) ?? (weeklyOrder.value?.id === orderId ? weeklyOrder.value : null)

  /** 标记已交付（替换为新对象） */
  const markDelivered = (orderId: string) => {
    dailyOrders.value = dailyOrders.value.map(o => (o.id === orderId ? { ...o, delivered: true } : o))
    if (weeklyOrder.value?.id === orderId) weeklyOrder.value = { ...weeklyOrder.value, delivered: true }
  }

  /** 从背包+仓库箱子扣除订单物品，低品质优先；返回按实际品质加成后的售价总值 */
  const takeOrderItems = (order: TradeOrder): number => {
    let value = 0
    for (const line of order.lines) {
      const unitPrice = getTradeUnitPrice(line.itemId)
      let remaining = line.quantity
      for (const quality of TRADE_QUALITY_ORDER) {
        if (remaining <= 0) break
        const take = Math.min(remaining, getCombinedItemCount(line.itemId, quality))
        if (take <= 0) continue
        removeCombinedItem(line.itemId, take, quality)
        value += unitPrice * take * TRADE_QUALITY_MULTIPLIER[quality]
        remaining -= take
      }
    }
    return value
  }

  /** 交付订单 */
  const deliverOrder = (orderId: string): TradeActionResult => {
    refreshOrders()
    const order = findOrder(orderId)
    if (!order) return { success: false, message: '订单已过期' }
    if (order.delivered) return { success: false, message: '已交付' }
    if (!canDeliver(order)) return { success: false, message: '数量不足' }

    const gained = calcOrderPoints(takeOrderItems(order), order.kind)
    points.value += gained
    markDelivered(order.id)

    const firstLine = order.lines[0]!
    const label = order.kind === 'weekly' ? '周单' : `${getItemById(firstLine.itemId)?.name ?? firstLine.itemId}×${firstLine.quantity}`
    const message = `交付${label}，积分+${gained}`
    addLog(message)
    return { success: true, message }
  }

  // ==================== 兑换 ====================

  /** 本周剩余可兑次数（无周限为 Infinity） */
  const getWeeklyRemaining = (reward: TradeRewardDef): number => {
    if (reward.weeklyLimit === undefined) return Infinity
    return Math.max(0, reward.weeklyLimit - (weeklyRedeemed.value[reward.itemId] ?? 0))
  }

  /** 总剩余可兑次数（无总限为 Infinity） */
  const getTotalRemaining = (reward: TradeRewardDef): number => {
    if (reward.totalLimit === undefined) return Infinity
    return Math.max(0, reward.totalLimit - (totalRedeemed.value[reward.itemId] ?? 0))
  }

  /** 次数与积分是否都够 */
  const canRedeem = (reward: TradeRewardDef): boolean =>
    getWeeklyRemaining(reward) > 0 && getTotalRemaining(reward) > 0 && points.value >= reward.cost

  /** 背包（含临时背包）能否再放 1 个普通品质的该物品；种子进种子袋，不占格 */
  const canReceiveItem = (itemId: string): boolean => {
    const inventoryStore = useInventoryStore()
    if (inventoryStore.isSeedItem(itemId) || !inventoryStore.isAllFull) return true
    return [...inventoryStore.items, ...inventoryStore.tempItems].some(
      slot => slot.itemId === itemId && slot.quality === 'normal' && slot.quantity < INVENTORY_MAX_STACK
    )
  }

  /** 发放兑换品：装备进装备栏，其余进背包 */
  const grantReward = (reward: TradeRewardDef): boolean => {
    const inventoryStore = useInventoryStore()
    if (reward.type === 'ring') return inventoryStore.addRing(reward.itemId)
    if (reward.type === 'hat') return inventoryStore.addHat(reward.itemId)
    if (reward.type === 'shoe') return inventoryStore.addShoe(reward.itemId)
    return inventoryStore.addItem(reward.itemId, 1)
  }

  /** 积分兑换（背包满时不扣积分） */
  const redeem = (itemId: string): TradeActionResult => {
    refreshOrders()
    const reward = getTradeRewardById(itemId)
    if (!reward) return { success: false, message: '不可兑换' }
    if (getWeeklyRemaining(reward) <= 0 || getTotalRemaining(reward) <= 0) return { success: false, message: '已达上限' }
    if (points.value < reward.cost) return { success: false, message: '积分不足' }
    if (reward.type === 'item' && !canReceiveItem(reward.itemId)) return { success: false, message: '背包已满' }
    if (!grantReward(reward)) return { success: false, message: '背包已满' }

    points.value -= reward.cost
    weeklyRedeemed.value = increaseCount(weeklyRedeemed.value, reward.itemId)
    totalRedeemed.value = increaseCount(totalRedeemed.value, reward.itemId)

    const message = `兑换${getItemById(reward.itemId)?.name ?? reward.itemId}，积分-${reward.cost}`
    addLog(message)
    return { success: true, message }
  }

  // ==================== 存档 ====================

  const serialize = () => ({
    points: points.value,
    dailyOrders: dailyOrders.value,
    dailyKey: dailyKey.value,
    weeklyOrder: weeklyOrder.value,
    weeklyKey: weeklyKey.value,
    weeklyRedeemed: weeklyRedeemed.value,
    totalRedeemed: totalRedeemed.value
  })

  /** 反序列化；旧存档没有商会数据时传 undefined，全部取默认值 */
  const deserialize = (data: Partial<ReturnType<typeof serialize>> | null | undefined) => {
    const savedWeekly = data?.weeklyOrder
    points.value = data?.points ?? 0
    dailyOrders.value = (data?.dailyOrders ?? []).filter(isValidOrder)
    dailyKey.value = data?.dailyKey ?? -1
    weeklyOrder.value = isValidOrder(savedWeekly) ? savedWeekly : null
    weeklyKey.value = data?.weeklyKey ?? -1
    weeklyRedeemed.value = data?.weeklyRedeemed ?? {}
    totalRedeemed.value = data?.totalRedeemed ?? {}
  }

  return {
    points,
    dailyOrders,
    dailyKey,
    weeklyOrder,
    weeklyKey,
    weeklyRedeemed,
    totalRedeemed,
    refreshOrders,
    canDeliver,
    deliverOrder,
    getWeeklyRemaining,
    getTotalRemaining,
    canRedeem,
    redeem,
    serialize,
    deserialize
  }
})
