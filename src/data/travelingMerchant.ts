import { getWeekday } from './timeConstants'
import { CROPS } from './crops'
import { getItemById } from './items'
import type { Season } from '@/types'

/** 旅行商人商品定义 */
export interface TravelingMerchantItem {
  itemId: string
  name: string
  basePrice: number // 商人售价（约为 sellPrice 的 2-3 倍溢价）
}

/** 旅行商人当日库存 */
export interface TravelingMerchantStock {
  itemId: string
  name: string
  price: number // 含随机浮动后的售价
  quantity: number // 剩余可购数量
}

/** 旅行商人商品池 */
export const TRAVELING_MERCHANT_POOL: TravelingMerchantItem[] = [
  // 稀有宝石
  { itemId: 'dragon_jade', name: '龙玉', basePrice: 800 },
  { itemId: 'prismatic_shard', name: '五彩碎片', basePrice: 1200 },
  { itemId: 'moonstone', name: '月光石', basePrice: 400 },
  // 稀有采集物
  { itemId: 'ginseng', name: '人参', basePrice: 500 },
  { itemId: 'wintersweet', name: '腊梅', basePrice: 150 },
  // 特殊材料
  { itemId: 'iridium_ore', name: '铱矿', basePrice: 700 },
  { itemId: 'cloth', name: '布匹', basePrice: 1000 },
  // 稀有动物产品
  { itemId: 'rabbit_foot', name: '幸运兔脚', basePrice: 1200 },
  { itemId: 'truffle', name: '松露', basePrice: 1400 },
  // 特殊物品
  { itemId: 'rain_totem', name: '雨图腾', basePrice: 500 },
  { itemId: 'silk_ribbon', name: '丝帕', basePrice: 500 }
]

/**
 * 商人售价相对出售价的最低倍数。
 * 满加成卖出约为出售价 ×1.74（装备 +51% × 狐仙 15%），满折扣买入约为标价 ×0.46，
 * 3.8 倍可保证非行情类物品买进卖出不赚钱。
 */
const MERCHANT_MIN_MARKUP = 3.8

/** 商人售价下限 */
export const getMerchantPriceFloor = (sellPrice: number): number => Math.ceil(sellPrice * MERCHANT_MIN_MARKUP)

/** 判断某天是否为旅行商人出摊日（周五/周日） */
export const isTravelingMerchantDay = (day: number): boolean => {
  const weekday = getWeekday(day)
  return weekday === 'fri' || weekday === 'sun'
}

/** 简单确定性伪随机数生成器 */
const seededRandom = (seed: number): (() => number) => {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

/** 根据游戏日期生成旅行商人当日库存。priceFloor：按物品与出售价给出售价下限 */
export const generateMerchantStock = (
  year: number,
  seasonIndex: number,
  day: number,
  currentSeason: Season,
  priceFloor: (itemId: string, sellPrice: number) => number
): TravelingMerchantStock[] => {
  const seed = year * 10000 + seasonIndex * 1000 + day * 37
  const rng = seededRandom(seed)

  const stock: TravelingMerchantStock[] = []

  // 从通用池随机选取 3-4 件
  const shuffled = [...TRAVELING_MERCHANT_POOL].sort(() => rng() - 0.5)
  const generalCount = 3 + Math.floor(rng() * 2) // 3 或 4
  for (let i = 0; i < Math.min(generalCount, shuffled.length); i++) {
    const item = shuffled[i]!
    const priceVariation = 0.85 + rng() * 0.3 // ±15% 价格浮动
    let price = Math.floor(item.basePrice * priceVariation)
    // 防套利：商人售价不低于下限
    const def = getItemById(item.itemId)
    if (def && def.sellPrice > 0) price = Math.max(price, priceFloor(item.itemId, def.sellPrice))
    stock.push({
      itemId: item.itemId,
      name: item.name,
      price,
      quantity: 1 + Math.floor(rng() * 2) // 1-2 个
    })
  }

  // 从反季作物中选 1-2 种子
  const otherSeasonCrops = CROPS.filter(c => !c.season.includes(currentSeason) && c.seedPrice > 0)
  if (otherSeasonCrops.length > 0) {
    const shuffledCrops = [...otherSeasonCrops].sort(() => rng() - 0.5)
    const seedCount = 1 + Math.floor(rng() * 2) // 1 或 2
    for (let i = 0; i < Math.min(seedCount, shuffledCrops.length); i++) {
      const crop = shuffledCrops[i]!
      stock.push({
        itemId: crop.seedId,
        name: `${crop.name}种子`,
        price: Math.max(Math.floor(crop.seedPrice * 4), crop.sellPrice * 2), // 4 倍反季溢价，且不低于作物售价×2
        quantity: 3 + Math.floor(rng() * 3) // 3-5 个
      })
    }
  }

  return stock
}
