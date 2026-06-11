import type { ToolType, ToolTier } from '@/types'

/** 工具升级所需材料和费用 */
export interface ToolUpgradeCost {
  fromTier: ToolTier
  toTier: ToolTier
  money: number
  materials: { itemId: string; quantity: number }[]
  /** 当场升级所需锻造等级（§6.3） */
  requiredForgingLevel: number
}

/** 通用工具升级费用（水壶/锄头/镐/镰刀/斧头） */
const STANDARD_COSTS: ToolUpgradeCost[] = [
  {
    fromTier: 'basic',
    toTier: 'iron',
    money: 2000,
    materials: [{ itemId: 'copper_bar', quantity: 5 }],
    requiredForgingLevel: 1
  },
  {
    fromTier: 'iron',
    toTier: 'steel',
    money: 5000,
    materials: [{ itemId: 'iron_bar', quantity: 5 }],
    requiredForgingLevel: 6
  },
  {
    fromTier: 'steel',
    toTier: 'iridium',
    money: 10000,
    materials: [{ itemId: 'gold_bar', quantity: 5 }],
    requiredForgingLevel: 12
  }
]

/** 水壶升级费用（首次升级门槛降低） */
const WATERING_CAN_COSTS: ToolUpgradeCost[] = [
  {
    fromTier: 'basic',
    toTier: 'iron',
    money: 1200,
    materials: [{ itemId: 'copper_bar', quantity: 3 }],
    requiredForgingLevel: 1
  },
  {
    fromTier: 'iron',
    toTier: 'steel',
    money: 5000,
    materials: [{ itemId: 'iron_bar', quantity: 5 }],
    requiredForgingLevel: 6
  },
  {
    fromTier: 'steel',
    toTier: 'iridium',
    money: 10000,
    materials: [{ itemId: 'gold_bar', quantity: 5 }],
    requiredForgingLevel: 12
  }
]

/** 各工具的升级费用 */
export const TOOL_UPGRADE_COSTS: Record<ToolType, ToolUpgradeCost[]> = {
  wateringCan: WATERING_CAN_COSTS,
  hoe: STANDARD_COSTS,
  pickaxe: STANDARD_COSTS,
  scythe: STANDARD_COSTS,
  axe: STANDARD_COSTS,
  fishingRod: [
    {
      fromTier: 'basic',
      toTier: 'iron',
      money: 2000,
      materials: [
        { itemId: 'copper_bar', quantity: 5 },
        { itemId: 'wood', quantity: 5 }
      ],
      requiredForgingLevel: 1
    },
    {
      fromTier: 'iron',
      toTier: 'steel',
      money: 5000,
      materials: [
        { itemId: 'iron_bar', quantity: 5 },
        { itemId: 'bamboo', quantity: 5 }
      ],
      requiredForgingLevel: 6
    },
    {
      fromTier: 'steel',
      toTier: 'iridium',
      money: 10000,
      materials: [
        { itemId: 'gold_bar', quantity: 5 },
        { itemId: 'bamboo', quantity: 10 }
      ],
      requiredForgingLevel: 12
    }
  ],
  pan: [
    {
      fromTier: 'basic',
      toTier: 'iron',
      money: 2000,
      materials: [
        { itemId: 'copper_bar', quantity: 5 },
        { itemId: 'quartz', quantity: 2 }
      ],
      requiredForgingLevel: 1
    },
    {
      fromTier: 'iron',
      toTier: 'steel',
      money: 5000,
      materials: [
        { itemId: 'iron_bar', quantity: 5 },
        { itemId: 'quartz', quantity: 3 }
      ],
      requiredForgingLevel: 6
    },
    {
      fromTier: 'steel',
      toTier: 'iridium',
      money: 10000,
      materials: [
        { itemId: 'gold_bar', quantity: 5 },
        { itemId: 'quartz', quantity: 5 }
      ],
      requiredForgingLevel: 12
    }
  ]
}

/** 获取某工具当前可用的升级信息 */
export const getUpgradeCost = (type: ToolType, currentTier: ToolTier): ToolUpgradeCost | undefined => {
  return TOOL_UPGRADE_COSTS[type].find(c => c.fromTier === currentTier)
}

/** 工具中文名 */
export const TOOL_NAMES: Record<ToolType, string> = {
  wateringCan: '水壶',
  hoe: '锄头',
  pickaxe: '镐',
  fishingRod: '鱼竿',
  scythe: '镰刀',
  axe: '斧头',
  pan: '淘金盘'
}

/** 工具等级中文名 */
export const TIER_NAMES: Record<ToolTier, string> = {
  basic: '初始',
  iron: '铁制',
  steel: '精钢',
  iridium: '铱金'
}
