import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useGameStore } from './useGameStore'
import { usePlayerStore } from './usePlayerStore'
import { useInventoryStore } from './useInventoryStore'
import { useSkillStore } from './useSkillStore'
import { useWalletStore } from './useWalletStore'
import { getCropsBySeason, getItemById } from '@/data'
import { isProtectedItem } from '@/data/items'
import { BAITS, TACKLES, FERTILIZERS } from '@/data/processing'
import { isTravelingMerchantDay, generateMerchantStock, TRAVELING_MERCHANT_POOL } from '@/data/travelingMerchant'
import { getMarketMultiplier } from '@/data/market'
import type { MarketCategory } from '@/data/market'
import type { TravelingMerchantStock } from '@/data/travelingMerchant'
import type { Quality } from '@/types'
import { useHiddenNpcStore } from './useHiddenNpcStore'

/** 商铺商品项 */
export interface ShopItemEntry {
  itemId: string
  name: string
  price: number
  description: string
}

export const useShopStore = defineStore('shop', () => {
  const gameStore = useGameStore()
  const playerStore = usePlayerStore()
  const inventoryStore = useInventoryStore()
  const skillStore = useSkillStore()

  // === 多商铺导航 ===

  /** 当前选中的商铺（null=商圈总览） */
  const currentShopId = ref<string | null>(null)

  // === 折扣系统 ===

  /** 计算折扣后的价格 */
  const applyDiscount = (price: number): number => {
    const walletStore = useWalletStore()
    const discount = walletStore.getShopDiscount()
    const ringDiscount = inventoryStore.getRingEffectValue('shop_discount')
    // 仙缘能力：狐眼（hu_xian_1）商店价格降低
    const spiritDiscount = useHiddenNpcStore().getAbilityValue('hu_xian_1') / 100
    return Math.floor(price * (1 - discount) * (1 - ringDiscount) * (1 - spiritDiscount))
  }

  // === 万物铺 (陈伯) ===

  /** 当前季节可购买的种子 */
  const availableSeeds = computed(() => {
    return getCropsBySeason(gameStore.season)
      .filter(crop => crop.seedPrice > 0)
      .map(crop => ({
        seedId: crop.seedId,
        cropName: crop.name,
        price: crop.seedPrice,
        growthDays: crop.growthDays,
        sellPrice: crop.sellPrice,
        regrowth: crop.regrowth ?? false,
        regrowthDays: crop.regrowthDays,
        season: crop.season
      }))
  })

  /** 购买种子（种子进种子袋，不受背包格数限制） */
  const buySeed = (seedId: string, quantity: number = 1): boolean => {
    const seed = availableSeeds.value.find(s => s.seedId === seedId)
    if (!seed) return false
    const totalCost = applyDiscount(seed.price) * quantity
    if (!playerStore.spendMoney(totalCost)) return false
    if (!inventoryStore.addItem(seedId, quantity)) {
      playerStore.earnMoney(totalCost)
      return false
    }
    return true
  }

  // === 铁匠铺 (孙铁匠) ===

  // 只卖原矿，不卖冶炼好的锭——锭必须自己用熔炉炼，否则熔炉就没有存在意义了
  const blacksmithItems = computed<ShopItemEntry[]>(() => [
    {
      itemId: 'copper_ore',
      name: '铜矿',
      price: 100,
      description: '矿洞中常见的铜矿，需用熔炉冶炼成锭'
    },
    {
      itemId: 'iron_ore',
      name: '铁矿',
      price: 200,
      description: '中层矿洞出产的铁矿，需用熔炉冶炼成锭'
    },
    {
      itemId: 'gold_ore',
      name: '金矿',
      price: 400,
      description: '深层矿洞出产的金矿，需用熔炉冶炼成锭'
    },
    {
      itemId: 'charcoal',
      name: '木炭',
      price: 100,
      description: '烧制的木炭，冶炼的燃料'
    }
  ])

  // === 药铺 (林老) ===

  /** 可购买的肥料（shopPrice != null） */
  const shopFertilizers = computed(() =>
    FERTILIZERS.filter(f => f.shopPrice !== null).map(f => ({
      id: f.id,
      name: f.name,
      description: f.description,
      price: f.shopPrice!
    }))
  )

  const apothecaryItems = computed<ShopItemEntry[]>(() => [
    { itemId: 'herb', name: '草药', price: 50, description: '山间野生的草药' },
    {
      itemId: 'ginseng',
      name: '人参',
      price: 600,
      description: '极其珍贵的野生人参'
    },
    {
      itemId: 'animal_medicine',
      name: '兽药',
      price: 150,
      description: '治疗生病的牲畜'
    },
    {
      itemId: 'premium_feed',
      name: '精饲料',
      price: 200,
      description: '提升动物心情和好感'
    },
    {
      itemId: 'nourishing_feed',
      name: '滋补饲料',
      price: 250,
      description: '加速动物产出'
    },
    {
      itemId: 'vitality_feed',
      name: '活力饲料',
      price: 300,
      description: '喂食必定治愈疾病'
    },
    {
      itemId: 'fish_feed',
      name: '鱼饲料',
      price: 30,
      description: '鱼塘专用饲料'
    },
    {
      itemId: 'water_purifier',
      name: '水质改良剂',
      price: 100,
      description: '改善鱼塘水质'
    }
  ])

  // === 渔具铺 (秋月) ===

  /** 可购买的鱼饵（shopPrice != null） */
  const shopBaits = computed(() =>
    BAITS.filter(b => b.shopPrice !== null).map(b => ({
      id: b.id,
      name: b.name,
      description: b.description,
      price: b.shopPrice!
    }))
  )

  /** 可购买的浮漂（shopPrice != null） */
  const shopTackles = computed(() =>
    TACKLES.filter(t => t.shopPrice !== null).map(t => ({
      id: t.id,
      name: t.name,
      description: t.description,
      price: t.shopPrice!
    }))
  )

  /** 渔具铺其他商品 */
  const fishingShopItems = computed<ShopItemEntry[]>(() => [
    {
      itemId: 'crab_pot',
      name: '蟹笼',
      price: 1500,
      description: '放置在钓鱼地点，每日自动捕获水产（需鱼饵）'
    }
  ])

  // === 绸缎庄 (素素) ===

  const textileItems = computed<ShopItemEntry[]>(() => [
    {
      itemId: 'cloth',
      name: '布匹',
      price: 1200,
      description: '用羊毛纺织的布匹'
    },
    {
      itemId: 'silk_cloth',
      name: '丝绸',
      price: 500,
      description: '华美的丝绸'
    },
    {
      itemId: 'alpaca_cloth',
      name: '羊驼绒',
      price: 900,
      description: '极其柔软的羊驼绒布'
    },
    {
      itemId: 'felt',
      name: '毛毡',
      price: 600,
      description: '用兔毛压制的毛毡'
    },
    {
      itemId: 'silk_ribbon',
      name: '丝帕',
      price: 500,
      description: '精心绣制的丝帕'
    },
    {
      itemId: 'jade_ring',
      name: '翡翠戒指',
      price: 1500,
      description: '可以用来求婚'
    },
    {
      itemId: 'zhiji_jade',
      name: '知己玉佩',
      price: 1500,
      description: '赠予同性挚友可结为知己'
    },
    {
      itemId: 'pine_incense',
      name: '松香',
      price: 250,
      description: '清新的松香'
    },
    {
      itemId: 'camphor_incense',
      name: '樟脑香',
      price: 400,
      description: '提神醒脑'
    },
    {
      itemId: 'osmanthus_incense',
      name: '桂花香',
      price: 800,
      description: '馥郁的桂花香'
    }
  ])

  // === 通用购买/出售 ===

  /** 购买通用物品 */
  const buyItem = (itemId: string, price: number, quantity: number = 1): boolean => {
    if (
      !inventoryStore.isSeedItem(itemId) &&
      inventoryStore.isAllFull &&
      !inventoryStore.items.some(s => s.itemId === itemId && s.quantity + quantity <= 999)
    ) {
      return false
    }
    const totalCost = applyDiscount(price) * quantity
    if (!playerStore.spendMoney(totalCost)) return false
    if (!inventoryStore.addItem(itemId, quantity)) {
      playerStore.earnMoney(totalCost)
      return false
    }
    return true
  }

  /** 计算不含行情系数的基础售价 */
  const _basePrice = (itemId: string, quantity: number, quality: Quality): number => {
    const itemDef = getItemById(itemId)
    if (!itemDef) return 0
    const qualityMultiplier: Record<Quality, number> = {
      normal: 1.0,
      fine: 1.25,
      excellent: 1.5,
      supreme: 2.0
    }
    let bonus = 1.0
    if (itemDef.category === 'processed' && skillStore.getSkill('farming').perk10 === 'artisan') bonus *= 1.25
    if (itemDef.category === 'crop' && skillStore.getSkill('farming').perk5 === 'harvester') bonus *= 1.1
    if (itemDef.category === 'animal_product' && skillStore.getSkill('farming').perk5 === 'rancher') bonus *= 1.2
    if (itemDef.category === 'fish' && skillStore.getSkill('fishing').perk5 === 'fisher') bonus *= 1.25
    if (itemDef.category === 'fish' && skillStore.getSkill('fishing').perk10 === 'aquaculture') bonus *= 1.5
    if (itemDef.category === 'fish' && gameStore.farmMapType === 'riverland') bonus *= 1.1
    if (itemDef.category === 'ore' && skillStore.getSkill('mining').perk10 === 'blacksmith') bonus *= 1.5
    const ringSelBonus = inventoryStore.getRingEffectValue('sell_price_bonus')
    // 仙缘结缘：狐仙出售加成
    const hiddenNpcStore = useHiddenNpcStore()
    const sellBonusData = hiddenNpcStore.getBondBonusByType('sell_bonus')
    const spiritSellBonus = sellBonusData?.type === 'sell_bonus' ? sellBonusData.percent / 100 : 0
    return Math.floor(itemDef.sellPrice * quantity * qualityMultiplier[quality] * bonus * (1 + ringSelBonus) * (1 + spiritSellBonus))
  }

  /** 计算物品售价（不执行出售，用于估价） */
  const calculateSellPrice = (itemId: string, quantity: number, quality: Quality): number => {
    const itemDef = getItemById(itemId)
    if (!itemDef) return 0
    const recentVolume = getRecentShipping()[itemDef.category as MarketCategory] ?? 0
    const marketMultiplier = getMarketMultiplier(itemDef.category, gameStore.year, gameStore.seasonIndex, gameStore.day, recentVolume)
    return Math.floor(_basePrice(itemId, quantity, quality) * marketMultiplier)
  }

  /** 计算不含行情的基础售价（用于显示原价） */
  const calculateBaseSellPrice = (itemId: string, quantity: number, quality: Quality): number => {
    return _basePrice(itemId, quantity, quality)
  }

  /** 出售物品，返回实际售价（0表示失败） */
  const sellItem = (itemId: string, quantity: number = 1, quality: Quality = 'normal'): number => {
    // 限定物品一律不收：误卖会直接卡死进度
    if (isProtectedItem(itemId)) return 0
    // 卖出前先收集陈酿增值（按将消耗的 slot 计算）
    const pool = inventoryStore.items
    let remainingToCount = quantity
    let totalAddedValue = 0
    for (let i = pool.length - 1; i >= 0 && remainingToCount > 0; i--) {
      const slot = pool[i]!
      if (slot.itemId !== itemId || slot.quality !== quality) continue
      const take = Math.min(remainingToCount, slot.quantity)
      totalAddedValue += (slot.addedValue ?? 0) * take
      remainingToCount -= take
    }
    if (!inventoryStore.removeItem(itemId, quantity, quality)) return 0
    const totalPrice = calculateSellPrice(itemId, quantity, quality) + totalAddedValue
    playerStore.earnMoney(totalPrice)
    return totalPrice
  }

  // === 旅行商人 ===

  const travelingStock = ref<TravelingMerchantStock[]>([])
  const travelingStockKey = ref('')

  const isMerchantHere = computed(() => isTravelingMerchantDay(gameStore.day))

  const refreshMerchantStock = () => {
    const key = `${gameStore.year}_${gameStore.seasonIndex}_${gameStore.day}`
    if (travelingStockKey.value === key) return
    travelingStock.value = generateMerchantStock(gameStore.year, gameStore.seasonIndex, gameStore.day, gameStore.season)
    // 仙缘能力：狐运（hu_xian_3）旅行商人多1件稀有品
    if (useHiddenNpcStore().isAbilityActive('hu_xian_3')) {
      const existingIds = new Set(travelingStock.value.map(s => s.itemId))
      const available = TRAVELING_MERCHANT_POOL.filter(p => !existingIds.has(p.itemId))
      if (available.length > 0) {
        const pick = available[Math.floor(Math.random() * available.length)]!
        const def = getItemById(pick.itemId)
        let price = pick.basePrice
        if (def && def.sellPrice > 0) price = Math.max(price, def.sellPrice * 2)
        travelingStock.value.push({
          itemId: pick.itemId,
          name: pick.name,
          price,
          quantity: 1
        })
      }
    }
    travelingStockKey.value = key
  }

  const buyFromTraveler = (itemId: string): boolean => {
    const item = travelingStock.value.find(s => s.itemId === itemId)
    if (!item || item.quantity <= 0) return false
    if (
      !inventoryStore.isSeedItem(itemId) &&
      inventoryStore.isAllFull &&
      !inventoryStore.items.some(s => s.itemId === itemId && s.quantity < 999)
    ) {
      return false
    }
    const finalPrice = applyDiscount(item.price)
    if (!playerStore.spendMoney(finalPrice)) return false
    if (!inventoryStore.addItem(itemId)) {
      playerStore.earnMoney(finalPrice)
      return false
    }
    item.quantity--
    return true
  }

  // === 出货箱 ===

  /** 出货箱中的物品 */
  const shippingBox = ref<{ itemId: string; quantity: number; quality: Quality }[]>([])

  /** 添加物品到出货箱 */
  const addToShippingBox = (itemId: string, quantity: number, quality: Quality): boolean => {
    // 出货箱等同于隔夜出售，同样要挡住限定物品
    if (isProtectedItem(itemId)) return false
    if (!inventoryStore.removeItem(itemId, quantity, quality)) return false
    const existing = shippingBox.value.find(s => s.itemId === itemId && s.quality === quality)
    if (existing) {
      existing.quantity += quantity
    } else {
      shippingBox.value.push({ itemId, quantity, quality })
    }
    return true
  }

  /** 从出货箱取回物品 */
  const removeFromShippingBox = (itemId: string, quantity: number, quality: Quality): boolean => {
    const idx = shippingBox.value.findIndex(s => s.itemId === itemId && s.quality === quality)
    if (idx === -1) return false
    const entry = shippingBox.value[idx]!
    if (entry.quantity < quantity) return false
    // 先计算背包可用空间，避免 addItem 部分添加的副作用（种子回种子袋，不受格数限制）
    const MAX_STACK = 999
    let space = 0
    if (inventoryStore.isSeedItem(itemId)) {
      space = quantity
    } else {
      for (const s of inventoryStore.items) {
        if (s.itemId === itemId && s.quality === quality && s.quantity < MAX_STACK) {
          space += MAX_STACK - s.quantity
        }
      }
      space += (inventoryStore.capacity - inventoryStore.items.length) * MAX_STACK
    }
    const toTransfer = Math.min(quantity, space)
    if (toTransfer <= 0) return false
    // 先从出货箱移除，再添加到背包
    entry.quantity -= toTransfer
    if (entry.quantity <= 0) {
      shippingBox.value.splice(idx, 1)
    }
    inventoryStore.addItem(itemId, toTransfer, quality)
    return true
  }

  /** 处理出货箱结算（日结时调用），返回总收入 */
  const processShippingBox = (): number => {
    let total = 0
    const dayKey = `${gameStore.year}-${gameStore.seasonIndex}-${gameStore.day}`
    const dayRecord: Record<string, number> = {
      ...(shippingHistory.value[dayKey] ?? {})
    }
    for (const entry of shippingBox.value) {
      total += calculateSellPrice(entry.itemId, entry.quantity, entry.quality)
      // 记录出货收集
      if (!shippedItems.value.includes(entry.itemId)) {
        shippedItems.value.push(entry.itemId)
      }
      // 记录品类出货量（供需系数用）
      const def = getItemById(entry.itemId)
      if (def) {
        dayRecord[def.category] = (dayRecord[def.category] ?? 0) + entry.quantity
      }
    }
    shippingHistory.value[dayKey] = dayRecord
    _pruneShippingHistory()
    shippingBox.value = []
    return total
  }

  // === 出货收集 ===

  /** 已出货过的物品 ID 集合 */
  const shippedItems = ref<string[]>([])

  // === 出货历史（供需系数用） ===

  /** 近期出货记录：dayKey → { category → quantity } */
  const shippingHistory = ref<Record<string, Record<string, number>>>({})

  /** 将日期转为绝对天数（用于比较距离） */
  const _toAbsoluteDay = (year: number, seasonIndex: number, day: number): number => {
    return (year - 1) * 112 + seasonIndex * 28 + day
  }

  /** 清理超过7天的出货记录 */
  const _pruneShippingHistory = () => {
    const now = _toAbsoluteDay(gameStore.year, gameStore.seasonIndex, gameStore.day)
    const keys = Object.keys(shippingHistory.value)
    for (const key of keys) {
      const parts = key.split('-').map(Number)
      const abs = _toAbsoluteDay(parts[0]!, parts[1]!, parts[2]!)
      if (now - abs > 7) {
        delete shippingHistory.value[key]
      }
    }
  }

  /** 获取近7天各品类总出货量 */
  const getRecentShipping = (): Partial<Record<MarketCategory, number>> => {
    _pruneShippingHistory()
    const result: Partial<Record<MarketCategory, number>> = {}
    for (const record of Object.values(shippingHistory.value)) {
      for (const [cat, qty] of Object.entries(record)) {
        result[cat as MarketCategory] = (result[cat as MarketCategory] ?? 0) + qty
      }
    }
    return result
  }

  // === 序列化 ===

  const serialize = () => ({
    travelingStockKey: travelingStockKey.value,
    travelingStock: travelingStock.value,
    shippingBox: shippingBox.value,
    shippedItems: shippedItems.value,
    shippingHistory: shippingHistory.value
  })

  const deserialize = (data: any) => {
    travelingStockKey.value = data?.travelingStockKey ?? ''
    travelingStock.value = data?.travelingStock ?? []
    shippingBox.value = data?.shippingBox ?? []
    shippedItems.value = data?.shippedItems ?? []
    shippingHistory.value = data?.shippingHistory ?? {}
    currentShopId.value = null
  }

  return {
    // 导航
    currentShopId,
    // 折扣
    applyDiscount,
    // 万物铺
    availableSeeds,
    buySeed,
    // 铁匠铺
    blacksmithItems,
    // 渔具铺
    shopBaits,
    shopTackles,
    fishingShopItems,
    // 药铺
    shopFertilizers,
    apothecaryItems,
    // 绸缎庄
    textileItems,
    // 通用
    buyItem,
    sellItem,
    calculateSellPrice,
    calculateBaseSellPrice,
    // 旅行商人
    travelingStock,
    isMerchantHere,
    refreshMerchantStock,
    buyFromTraveler,
    // 出货箱
    shippingBox,
    addToShippingBox,
    removeFromShippingBox,
    processShippingBox,
    // 出货收集
    shippedItems,
    // 行情供需
    getRecentShipping,
    // 序列化
    serialize,
    deserialize
  }
})
