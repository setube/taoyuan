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
import { FRUIT_TREE_DEFS } from '@/data/fruitTrees'
import { WEATHER_TOTEMS } from '@/data/totems'
import { FEED_DEFS, HAY_ITEM_ID, HAY_PRICE, getFeedPrice } from '@/data/animals'
import { HANHAI_SHOP_ITEMS } from '@/data/hanhai'
import { GUILD_SHOP_ITEMS } from '@/data/guild'
import { isTravelingMerchantDay, generateMerchantStock, getMerchantPriceFloor, TRAVELING_MERCHANT_POOL } from '@/data/travelingMerchant'
import { getMarketMultiplier } from '@/data/market'
import type { MarketCategory } from '@/data/market'
import type { TravelingMerchantStock } from '@/data/travelingMerchant'
import type { InventoryItem, Quality } from '@/types'
import { useHiddenNpcStore } from './useHiddenNpcStore'
import { normalizeAddedValue, getAddedValue, isSameStack, makeStack, getStackSpace } from '@/composables/useItemStacks'

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
      price: 170,
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
      price: getFeedPrice('premium_feed'),
      description: '提升动物心情和好感'
    },
    {
      itemId: 'nourishing_feed',
      name: '滋补饲料',
      price: getFeedPrice('nourishing_feed'),
      description: '加速动物产出'
    },
    {
      itemId: 'vitality_feed',
      name: '活力饲料',
      price: getFeedPrice('vitality_feed'),
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
      price: 1650,
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
      price: 1220,
      description: '极其柔软的羊驼绒布'
    },
    {
      itemId: 'felt',
      name: '毛毡',
      price: 790,
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
      price: 1940,
      description: '馥郁的桂花香'
    }
  ])

  // === 回收价封顶（防倒买倒卖） ===

  /**
   * 玩家能拿到的最低买入折扣：钱袋 10% × 装备满强化 46% × 狐眼 5% ≈ 0.4617。
   * 商店卖的东西，普通品质回收价不超过「标价 × 此值」，任何加成和行情都无法买进卖出套利。
   */
  const RESALE_CAP_RATE = 0.46

  /** 固定价格出售的物品 → 普通品质单件回收上限（多处有售取最低） */
  const resaleCaps = computed(() => {
    const caps = new Map<string, number>()
    /** discountable：该处购买是否吃商店折扣（瀚海、公会、畜棚直购不打折） */
    const addCap = (itemId: string, price: number, discountable: boolean = true) => {
      if (price <= 0) return
      const cap = Math.floor(price * (discountable ? RESALE_CAP_RATE : 1))
      caps.set(itemId, Math.min(caps.get(itemId) ?? cap, cap))
    }
    for (const list of [blacksmithItems.value, apothecaryItems.value, fishingShopItems.value, textileItems.value]) {
      for (const entry of list) addCap(entry.itemId, entry.price)
    }
    for (const f of shopFertilizers.value) addCap(f.id, f.price)
    for (const b of shopBaits.value) addCap(b.id, b.price)
    for (const t of shopTackles.value) addCap(t.id, t.price)
    for (const t of FRUIT_TREE_DEFS) addCap(t.saplingId, t.saplingPrice)
    for (const t of WEATHER_TOTEMS) addCap(t.id, t.price)
    addCap(HAY_ITEM_ID, HAY_PRICE)
    for (const f of FEED_DEFS) addCap(f.id, f.price, false)
    for (const h of HANHAI_SHOP_ITEMS) addCap(h.itemId, h.price, false)
    for (const g of GUILD_SHOP_ITEMS) if (!g.contributionCost) addCap(g.itemId, g.price, false)
    return caps
  })

  /** 普通品质且商店有售时，回收总价不超过封顶 */
  const applyResaleCap = (itemId: string, quantity: number, quality: Quality, price: number): number => {
    if (quality !== 'normal') return price
    const cap = resaleCaps.value.get(itemId)
    return cap === undefined ? price : Math.min(price, cap * quantity)
  }

  // === 通用购买/出售 ===

  /** 购买通用物品 */
  const buyItem = (itemId: string, price: number, quantity: number = 1): boolean => {
    if (
      !inventoryStore.isSeedItem(itemId) &&
      inventoryStore.isAllFull &&
      !inventoryStore.items.some(s => s.itemId === itemId && !getAddedValue(s) && s.quantity + quantity <= 999)
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

  /** 计算物品售价（不执行出售，用于估价）。addedValue 为每件陈酿增值，按原值叠加，不受行情影响 */
  const calculateSellPrice = (itemId: string, quantity: number, quality: Quality, addedValue: number = 0): number => {
    const itemDef = getItemById(itemId)
    if (!itemDef) return 0
    const recentVolume = getRecentShipping()[itemDef.category as MarketCategory] ?? 0
    const marketMultiplier = getMarketMultiplier(itemDef.category, gameStore.year, gameStore.seasonIndex, gameStore.day, recentVolume)
    const price = Math.floor(_basePrice(itemId, quantity, quality) * marketMultiplier)
    return applyResaleCap(itemId, quantity, quality, price) + quantity * normalizeAddedValue(addedValue)
  }

  /** 计算不含行情的基础售价（用于显示原价） */
  const calculateBaseSellPrice = (itemId: string, quantity: number, quality: Quality, addedValue: number = 0): number => {
    return applyResaleCap(itemId, quantity, quality, _basePrice(itemId, quantity, quality)) + quantity * normalizeAddedValue(addedValue)
  }

  /** 出售物品，返回实际售价（0表示失败）。addedValue 指定出售哪一种陈酿增值的栈 */
  const sellItem = (itemId: string, quantity: number = 1, quality: Quality = 'normal', addedValue: number = 0): number => {
    // 限定物品一律不收：误卖会直接卡死进度
    if (isProtectedItem(itemId)) return 0
    const added = normalizeAddedValue(addedValue)
    if (!inventoryStore.removeItem(itemId, quantity, quality, added)) return 0
    const totalPrice = calculateSellPrice(itemId, quantity, quality, added)
    playerStore.earnMoney(totalPrice)
    return totalPrice
  }

  // === 旅行商人 ===

  const travelingStock = ref<TravelingMerchantStock[]>([])
  const travelingStockKey = ref('')

  const isMerchantHere = computed(() => isTravelingMerchantDay(gameStore.day))

  /** 旅商售价下限：回收已封顶的物品按封顶反推（约等于商店原价），其余按出售价的安全倍数 */
  const merchantPriceFloor = (itemId: string, sellPrice: number): number => {
    const floor = getMerchantPriceFloor(sellPrice)
    const cap = resaleCaps.value.get(itemId)
    return cap === undefined ? floor : Math.min(floor, Math.ceil(cap / RESALE_CAP_RATE))
  }

  const refreshMerchantStock = () => {
    const key = `${gameStore.year}_${gameStore.seasonIndex}_${gameStore.day}`
    if (travelingStockKey.value === key) return
    travelingStock.value = generateMerchantStock(gameStore.year, gameStore.seasonIndex, gameStore.day, gameStore.season, merchantPriceFloor)
    // 仙缘能力：狐运（hu_xian_3）旅行商人多1件稀有品
    if (useHiddenNpcStore().isAbilityActive('hu_xian_3')) {
      const existingIds = new Set(travelingStock.value.map(s => s.itemId))
      const available = TRAVELING_MERCHANT_POOL.filter(p => !existingIds.has(p.itemId))
      if (available.length > 0) {
        const pick = available[Math.floor(Math.random() * available.length)]!
        const def = getItemById(pick.itemId)
        let price = pick.basePrice
        if (def && def.sellPrice > 0) price = Math.max(price, merchantPriceFloor(pick.itemId, def.sellPrice))
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
      !inventoryStore.items.some(s => s.itemId === itemId && !getAddedValue(s) && s.quantity < 999)
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

  /** 出货箱中的物品（addedValue：每件陈酿增值） */
  const shippingBox = ref<InventoryItem[]>([])

  /** 添加物品到出货箱 */
  const addToShippingBox = (itemId: string, quantity: number, quality: Quality, addedValue: number = 0): boolean => {
    // 出货箱等同于隔夜出售，同样要挡住限定物品
    if (isProtectedItem(itemId)) return false
    const added = normalizeAddedValue(addedValue)
    if (!inventoryStore.removeItem(itemId, quantity, quality, added)) return false
    const existing = shippingBox.value.find(s => isSameStack(s, itemId, quality, added))
    if (existing) {
      existing.quantity += quantity
    } else {
      shippingBox.value.push(makeStack(itemId, quantity, quality, added))
    }
    return true
  }

  /** 从出货箱取回物品 */
  const removeFromShippingBox = (itemId: string, quantity: number, quality: Quality, addedValue: number = 0): boolean => {
    const added = normalizeAddedValue(addedValue)
    const idx = shippingBox.value.findIndex(s => isSameStack(s, itemId, quality, added))
    if (idx === -1) return false
    const entry = shippingBox.value[idx]!
    if (entry.quantity < quantity) return false
    // 先计算背包可用空间，避免 addItem 部分添加的副作用（种子回种子袋，不受格数限制）
    const space = inventoryStore.isSeedItem(itemId)
      ? quantity
      : getStackSpace(inventoryStore.items, inventoryStore.capacity, itemId, quality, added)
    const toTransfer = Math.min(quantity, space)
    if (toTransfer <= 0) return false
    // 先从出货箱移除，再添加到背包
    entry.quantity -= toTransfer
    if (entry.quantity <= 0) {
      shippingBox.value.splice(idx, 1)
    }
    inventoryStore.addItem(itemId, toTransfer, quality, added)
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
      total += calculateSellPrice(entry.itemId, entry.quantity, entry.quality, getAddedValue(entry))
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
    travelingStockKey,
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
    shippingHistory,
    getRecentShipping,
    // 序列化
    serialize,
    deserialize
  }
})
