import type { FarmhouseLevel } from '@/types'

/** 农舍升级定义 */
export interface FarmhouseUpgradeDef {
  level: FarmhouseLevel
  name: string
  description: string
  cost: number
  materialCost: { itemId: string; quantity: number }[]
  benefit: string
}

export const FARMHOUSE_UPGRADES: FarmhouseUpgradeDef[] = [
  {
    level: 1,
    name: '砖房',
    description: '升级厨房，烹饪体力恢复+20%。',
    cost: 10000,
    materialCost: [{ itemId: 'wood', quantity: 200 }],
    benefit: 'kitchen_bonus'
  },
  {
    level: 2,
    name: '宅院',
    description: '宽敞的院落，每晚额外恢复10%体力。',
    cost: 65000,
    materialCost: [
      { itemId: 'wood', quantity: 100 },
      { itemId: 'iron_ore', quantity: 50 }
    ],
    benefit: 'stamina_bonus'
  },
  {
    level: 3,
    name: '酒窖',
    description: '地下酒窖，可陈酿美酒提升品质。',
    cost: 100000,
    materialCost: [
      { itemId: 'wood', quantity: 100 },
      { itemId: 'gold_ore', quantity: 30 }
    ],
    benefit: 'cellar'
  }
]

/** 山洞解锁条件 — 累计收入达到此值 */
export const CAVE_UNLOCK_EARNINGS = 25000

/** 蘑菇洞每天产出概率 */
export const CAVE_MUSHROOM_DAILY_CHANCE = 0.6

/** 蝙蝠洞每天产出概率 */
export const CAVE_FRUIT_BAT_DAILY_CHANCE = 0.5

/** 山洞品质随时间提升阈值（天数） */
export const CAVE_QUALITY_THRESHOLDS = [
  { days: 0, quality: 'normal' as const },
  { days: 56, quality: 'fine' as const },
  { days: 112, quality: 'excellent' as const },
  { days: 224, quality: 'supreme' as const }
]

/** 山洞升级定义 */
export interface CaveUpgradeDef {
  level: number
  name: string
  mushroomChance: number
  fruitBatChance: number
  doubleChance: number
  cost: number
  materialCost: { itemId: string; quantity: number }[]
  mushroomPool: { itemId: string; weight: number }[]
  fruitPool: string[]
}

export const CAVE_UPGRADES: CaveUpgradeDef[] = [
  {
    level: 1,
    name: '山洞',
    mushroomChance: 0.6,
    fruitBatChance: 0.5,
    doubleChance: 0,
    cost: 0,
    materialCost: [],
    mushroomPool: [{ itemId: 'wild_mushroom', weight: 1 }],
    fruitPool: ['tree_peach', 'lychee', 'mandarin', 'plum_blossom']
  },
  {
    level: 2,
    name: '山洞·贰',
    mushroomChance: 0.7,
    fruitBatChance: 0.6,
    doubleChance: 0,
    cost: 15000,
    materialCost: [
      { itemId: 'wood', quantity: 100 },
      { itemId: 'iron_bar', quantity: 5 }
    ],
    mushroomPool: [
      { itemId: 'wild_mushroom', weight: 70 },
      { itemId: 'herb', weight: 30 }
    ],
    fruitPool: ['tree_peach', 'lychee', 'mandarin', 'plum_blossom', 'apricot', 'pomegranate']
  },
  {
    level: 3,
    name: '山洞·叁',
    mushroomChance: 0.8,
    fruitBatChance: 0.7,
    doubleChance: 0.25,
    cost: 40000,
    materialCost: [
      { itemId: 'wood', quantity: 200 },
      { itemId: 'gold_bar', quantity: 10 }
    ],
    mushroomPool: [
      { itemId: 'wild_mushroom', weight: 50 },
      { itemId: 'herb', weight: 35 },
      { itemId: 'ginseng', weight: 15 }
    ],
    fruitPool: ['tree_peach', 'lychee', 'mandarin', 'plum_blossom', 'apricot', 'pomegranate', 'persimmon', 'hawthorn']
  }
]

/** 根据等级获取山洞升级定义 */
export const getCaveUpgrade = (level: number): CaveUpgradeDef | undefined => {
  return CAVE_UPGRADES.find(u => u.level === level)
}

/** 根据天数获取山洞品质 */
export const getCaveQuality = (daysActive: number): 'normal' | 'fine' | 'excellent' | 'supreme' => {
  let result: 'normal' | 'fine' | 'excellent' | 'supreme' = 'normal'
  for (const t of CAVE_QUALITY_THRESHOLDS) {
    if (daysActive >= t.days) result = t.quality
  }
  return result
}

/** 仓库解锁材料需求（空数组表示仅需铜钱） */
export const WAREHOUSE_UNLOCK_MATERIALS: { itemId: string; quantity: number }[] = []

/** 温室解锁价格 */
export const GREENHOUSE_UNLOCK_COST = 35000

/** 温室材料需求 */
export const GREENHOUSE_MATERIAL_COST = [
  { itemId: 'wood', quantity: 200 },
  { itemId: 'iron_ore', quantity: 30 },
  { itemId: 'gold_ore', quantity: 10 }
]

/** 温室地块数 */
export const GREENHOUSE_PLOT_COUNT = 12

/** 家造锻造工坊（§2.1） */
export const FORGE_WORKSHOP_UNLOCK_COST = 8000
export const FORGE_WORKSHOP_MATERIAL_COST = [
  { itemId: 'wood', quantity: 30 },
  { itemId: 'copper_bar', quantity: 10 },
  { itemId: 'stone', quantity: 50 }
]
export const FORGE_WORKSHOP_MIN_LEVEL = 3

/** 温室升级定义 */
export interface GreenhouseUpgradeDef {
  level: number
  name: string
  plotCount: number
  gridCols: number
  cost: number
  materialCost: { itemId: string; quantity: number }[]
  description: string
}

export const GREENHOUSE_UPGRADES: GreenhouseUpgradeDef[] = [
  {
    level: 1,
    name: '温室扩建·壹',
    plotCount: 20,
    gridCols: 5,
    cost: 50000,
    materialCost: [
      { itemId: 'wood', quantity: 300 },
      { itemId: 'iron_bar', quantity: 20 }
    ],
    description: '扩建至20个地块（5×4）'
  },
  {
    level: 2,
    name: '温室扩建·贰',
    plotCount: 30,
    gridCols: 6,
    cost: 100000,
    materialCost: [
      { itemId: 'wood', quantity: 500 },
      { itemId: 'gold_bar', quantity: 15 }
    ],
    description: '扩建至30个地块（6×5）'
  }
]

/** 酒窖增值周期天数 */
export const CELLAR_VALUE_CYCLE_DAYS = 7

/** 酒窖升级定义 */
export interface CellarUpgradeDef {
  level: number
  name: string
  valuePerCycle: number
  maxSlots: number
  cost: number
  materialCost: { itemId: string; quantity: number }[]
}

export const CELLAR_UPGRADES: CellarUpgradeDef[] = [
  { level: 1, name: '酒窖', valuePerCycle: 100, maxSlots: 6, cost: 0, materialCost: [] },
  {
    level: 2,
    name: '酒窖·贰',
    valuePerCycle: 125,
    maxSlots: 9,
    cost: 30000,
    materialCost: [
      { itemId: 'wood', quantity: 200 },
      { itemId: 'iron_bar', quantity: 10 }
    ]
  },
  {
    level: 3,
    name: '酒窖·叁',
    valuePerCycle: 150,
    maxSlots: 12,
    cost: 60000,
    materialCost: [
      { itemId: 'wood', quantity: 300 },
      { itemId: 'gold_bar', quantity: 10 }
    ]
  },
  {
    level: 4,
    name: '酒窖·肆',
    valuePerCycle: 175,
    maxSlots: 15,
    cost: 100000,
    materialCost: [
      { itemId: 'wood', quantity: 400 },
      { itemId: 'gold_bar', quantity: 20 }
    ]
  },
  {
    level: 5,
    name: '酒窖·伍',
    valuePerCycle: 200,
    maxSlots: 18,
    cost: 150000,
    materialCost: [
      { itemId: 'wood', quantity: 500 },
      { itemId: 'iridium_bar', quantity: 5 }
    ]
  }
]

export const getCellarUpgrade = (level: number): CellarUpgradeDef | undefined => CELLAR_UPGRADES.find(u => u.level === level)

export const getFarmhouseUpgrade = (level: number): FarmhouseUpgradeDef | undefined => {
  return FARMHOUSE_UPGRADES.find(u => u.level === level)
}
