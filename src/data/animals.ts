import type { AnimalBuildingDef, AnimalDef, AnimalBuildingType, AnimalType } from '@/types'

/**
 * 每级畜舍容纳的牲畜数。
 * 原先固定「等级 × 4」，满级也只有 12 只，牧场后期完全放不下。
 */
export const BUILDING_CAPACITY_PER_LEVEL = 6

/** 畜舍定义 */
export const ANIMAL_BUILDINGS: AnimalBuildingDef[] = [
  {
    type: 'coop',
    name: '鸡舍',
    description: '饲养鸡鸭等小型家禽。',
    capacity: 6,
    cost: 4000,
    materialCost: [
      { itemId: 'wood', quantity: 100 },
      { itemId: 'bamboo', quantity: 50 }
    ]
  },
  {
    type: 'barn',
    name: '牲口棚',
    description: '饲养牛羊等大型牲畜。',
    capacity: 6,
    cost: 6000,
    materialCost: [
      { itemId: 'wood', quantity: 150 },
      { itemId: 'iron_ore', quantity: 20 }
    ]
  },
  {
    type: 'stable',
    name: '马厩',
    description: '饲养马匹，骑马出行更快。',
    capacity: 1,
    cost: 10000,
    materialCost: [
      { itemId: 'wood', quantity: 200 },
      { itemId: 'iron_ore', quantity: 30 }
    ]
  }
]

/** 动物定义 */
export const ANIMAL_DEFS: AnimalDef[] = [
  // ===== 鸡舍动物 (8种) =====
  {
    type: 'chicken',
    name: '鸡',
    building: 'coop',
    cost: 800,
    productId: 'egg',
    productName: '鸡蛋',
    produceDays: 1,
    friendship: { min: 0, max: 1000 }
  },
  {
    type: 'duck',
    name: '鸭',
    building: 'coop',
    cost: 1200,
    productId: 'duck_egg',
    productName: '鸭蛋',
    produceDays: 2,
    friendship: { min: 0, max: 1000 }
  },
  {
    type: 'rabbit',
    name: '兔',
    building: 'coop',
    cost: 2000,
    productId: 'rabbit_fur',
    productName: '兔毛',
    produceDays: 3,
    friendship: { min: 0, max: 1000 }
  },
  {
    type: 'goose',
    name: '鹅',
    building: 'coop',
    cost: 1500,
    productId: 'goose_egg',
    productName: '鹅蛋',
    produceDays: 2,
    friendship: { min: 0, max: 1000 }
  },
  {
    type: 'quail',
    name: '鹌鹑',
    building: 'coop',
    cost: 500,
    productId: 'quail_egg',
    productName: '鹌鹑蛋',
    produceDays: 1,
    friendship: { min: 0, max: 1000 }
  },
  {
    type: 'pigeon',
    name: '鸽子',
    building: 'coop',
    cost: 1000,
    productId: 'pigeon_egg',
    productName: '鸽子蛋',
    produceDays: 2,
    friendship: { min: 0, max: 1000 }
  },
  {
    type: 'silkie',
    name: '乌骨鸡',
    building: 'coop',
    cost: 3000,
    productId: 'silkie_egg',
    productName: '乌鸡蛋',
    produceDays: 2,
    friendship: { min: 0, max: 1000 }
  },
  {
    type: 'peacock',
    name: '孔雀',
    building: 'coop',
    cost: 8000,
    productId: 'peacock_feather',
    productName: '孔雀羽',
    produceDays: 4,
    friendship: { min: 0, max: 1000 }
  },
  // ===== 牲口棚动物 (11种) =====
  {
    type: 'cow',
    name: '牛',
    building: 'barn',
    cost: 1500,
    productId: 'milk',
    productName: '牛奶',
    produceDays: 1,
    friendship: { min: 0, max: 1000 }
  },
  {
    type: 'sheep',
    name: '羊',
    building: 'barn',
    cost: 8000,
    productId: 'wool',
    productName: '羊毛',
    produceDays: 3,
    friendship: { min: 0, max: 1000 }
  },
  {
    type: 'goat',
    name: '山羊',
    building: 'barn',
    cost: 4000,
    productId: 'goat_milk',
    productName: '羊奶',
    produceDays: 2,
    friendship: { min: 0, max: 1000 }
  },
  {
    type: 'pig',
    name: '猪',
    building: 'barn',
    cost: 16000,
    productId: 'truffle',
    productName: '松露',
    produceDays: 2,
    friendship: { min: 0, max: 1000 }
  },
  {
    type: 'buffalo',
    name: '水牛',
    building: 'barn',
    cost: 3000,
    productId: 'buffalo_milk',
    productName: '水牛奶',
    produceDays: 2,
    friendship: { min: 0, max: 1000 }
  },
  {
    type: 'yak',
    name: '牦牛',
    building: 'barn',
    cost: 5000,
    productId: 'yak_milk',
    productName: '牦牛奶',
    produceDays: 2,
    friendship: { min: 0, max: 1000 }
  },
  {
    type: 'alpaca',
    name: '羊驼',
    building: 'barn',
    cost: 6000,
    productId: 'alpaca_wool',
    productName: '羊驼毛',
    produceDays: 3,
    friendship: { min: 0, max: 1000 }
  },
  {
    type: 'deer',
    name: '鹿',
    building: 'barn',
    cost: 12000,
    productId: 'antler_velvet',
    productName: '鹿茸',
    produceDays: 5,
    friendship: { min: 0, max: 1000 }
  },
  {
    type: 'donkey',
    name: '驴',
    building: 'barn',
    cost: 3000,
    productId: 'donkey_milk',
    productName: '驴奶',
    produceDays: 3,
    friendship: { min: 0, max: 1000 }
  },
  {
    type: 'camel',
    name: '骆驼',
    building: 'barn',
    cost: 7000,
    productId: 'camel_milk',
    productName: '驼奶',
    produceDays: 2,
    friendship: { min: 0, max: 1000 }
  },
  {
    type: 'ostrich',
    name: '鸵鸟',
    building: 'barn',
    cost: 10000,
    productId: 'ostrich_egg',
    productName: '鸵鸟蛋',
    produceDays: 3,
    friendship: { min: 0, max: 1000 }
  },
  // ===== 马厩 (1种) =====
  {
    type: 'horse',
    name: '马',
    building: 'stable',
    cost: 5000,
    productId: '',
    productName: '',
    produceDays: 0,
    friendship: { min: 0, max: 1000 }
  }
]

/** 干草物品ID */
export const HAY_ITEM_ID = 'hay'

/** 干草购买价格 */
export const HAY_PRICE = 50

export const PREMIUM_FEED_ID = 'premium_feed'
export const NOURISHING_FEED_ID = 'nourishing_feed'
export const VITALITY_FEED_ID = 'vitality_feed'

/**
 * 所有饲料定义（UI 遍历用，药铺与畜棚共用同一份标价）。
 * 标价约为回收价的 2.3 倍：满折扣买入价仍高于回收价，避免倒买倒卖。
 */
export const FEED_DEFS: {
  id: string
  name: string
  price: number
  description: string
}[] = [
  { id: 'hay', name: '干草', price: HAY_PRICE, description: '基础饲料' },
  {
    id: 'premium_feed',
    name: '精饲料',
    price: 620,
    description: '心情+60，好感度翻倍'
  },
  {
    id: 'nourishing_feed',
    name: '滋补饲料',
    price: 550,
    description: '产出天数-1'
  },
  {
    id: 'vitality_feed',
    name: '活力饲料',
    price: 460,
    description: '100%治愈疾病'
  }
]

/** 饲料标价 */
export const getFeedPrice = (id: string): number => FEED_DEFS.find(f => f.id === id)?.price ?? 0

/** 饲料用量文本，如「精饲料×3、干草×2」 */
export const formatFeedUsage = (used: Record<string, number>): string =>
  FEED_DEFS.filter(f => (used[f.id] ?? 0) > 0)
    .map(f => `${f.name}×${used[f.id]}`)
    .join('、')

export const getAnimalDef = (type: string): AnimalDef | undefined => {
  return ANIMAL_DEFS.find(d => d.type === type)
}

export const getBuildingDef = (type: string): AnimalBuildingDef | undefined => {
  return ANIMAL_BUILDINGS.find(b => b.type === type)
}

/** 畜舍升级定义：容量 = 等级 × BUILDING_CAPACITY_PER_LEVEL */
export const BUILDING_UPGRADES: {
  type: AnimalBuildingType
  level: number
  name: string
  capacity: number
  cost: number
  materialCost: { itemId: string; quantity: number }[]
}[] = [
  {
    type: 'coop',
    level: 2,
    name: '大型鸡舍',
    capacity: 12,
    cost: 10000,
    materialCost: [
      { itemId: 'wood', quantity: 200 },
      { itemId: 'iron_ore', quantity: 15 }
    ]
  },
  {
    type: 'coop',
    level: 3,
    name: '豪华鸡舍',
    capacity: 18,
    cost: 20000,
    materialCost: [
      { itemId: 'wood', quantity: 300 },
      { itemId: 'gold_ore', quantity: 10 }
    ]
  },
  {
    type: 'barn',
    level: 2,
    name: '大型牲口棚',
    capacity: 12,
    cost: 12000,
    materialCost: [
      { itemId: 'wood', quantity: 250 },
      { itemId: 'iron_ore', quantity: 25 }
    ]
  },
  {
    type: 'barn',
    level: 3,
    name: '豪华牲口棚',
    capacity: 18,
    cost: 25000,
    materialCost: [
      { itemId: 'wood', quantity: 400 },
      { itemId: 'gold_ore', quantity: 15 }
    ]
  }
]

export const getBuildingUpgrade = (type: AnimalBuildingType, toLevel: number) => {
  return BUILDING_UPGRADES.find(u => u.type === type && u.level === toLevel)
}

/** 孵化映射：蛋 → 动物类型 + 孵化天数 + 所属建筑 */
export const INCUBATION_MAP: Record<string, { animalType: AnimalType; days: number; building: AnimalBuildingType }> = {
  egg: { animalType: 'chicken', days: 5, building: 'coop' },
  duck_egg: { animalType: 'duck', days: 7, building: 'coop' },
  goose_egg: { animalType: 'goose', days: 6, building: 'coop' },
  quail_egg: { animalType: 'quail', days: 4, building: 'coop' },
  pigeon_egg: { animalType: 'pigeon', days: 5, building: 'coop' },
  silkie_egg: { animalType: 'silkie', days: 6, building: 'coop' },
  ostrich_egg: { animalType: 'ostrich', days: 10, building: 'barn' }
}
