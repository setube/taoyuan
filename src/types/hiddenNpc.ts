import type { Season, Weather } from './game'
import type { HeartEventScene } from './npc'

/** 发现阶段 */
export type DiscoveryPhase = 'unknown' | 'rumor' | 'glimpse' | 'encounter' | 'revealed'

/** 缘分等级 */
export type AffinityLevel = 'wary' | 'curious' | 'trusting' | 'devoted' | 'eternal'

/** 缘分等级阈值 */
export const AFFINITY_THRESHOLDS: { level: AffinityLevel; min: number }[] = [
  { level: 'eternal', min: 2500 },
  { level: 'devoted', min: 1800 },
  { level: 'trusting', min: 1000 },
  { level: 'curious', min: 400 },
  { level: 'wary', min: 0 }
]

/** 最大缘分值 */
export const MAX_AFFINITY = 3000

/** 每心缘分值（菱形显示，12颗菱形） */
export const AFFINITY_PER_DIAMOND = 250

/** 每日未互动缘分衰减 */
export const AFFINITY_DECAY_BONDED = 15
export const AFFINITY_DECAY_COURTING = 10

/** 供奉上限 */
export const MAX_OFFERS_PER_WEEK = 3

/** 发现条件 */
export type DiscoveryCondition =
  | { type: 'season'; season: Season }
  | { type: 'weather'; weather: Weather }
  | { type: 'timeRange'; minHour: number; maxHour: number }
  | { type: 'location'; panel: string }
  | { type: 'item'; itemId: string; quantity?: number }
  | { type: 'skill'; skillType: string; minLevel: number }
  | { type: 'npcFriendship'; npcId: string; minFriendship: number }
  | { type: 'questComplete'; questId: string }
  | { type: 'mineFloor'; minFloor: number }
  | { type: 'fishCaught'; fishId: string }
  | { type: 'money'; minAmount: number }
  | { type: 'yearMin'; year: number }
  | { type: 'day'; day: number }

/** 发现步骤 */
export interface DiscoveryStep {
  id: string
  /** 此步骤将NPC推进到哪个阶段 */
  phase: DiscoveryPhase
  /** 全部满足才触发 */
  conditions: DiscoveryCondition[]
  /** 触发时播放的剧情 */
  scenes: HeartEventScene[]
  /** 发现后的日志提示 */
  logMessage?: string
}

/** 独特互动类型 */
export type InteractionType = 'meditation' | 'music' | 'ritual' | 'dreamwalk' | 'cultivation'

/** 互动类型中文名 */
export const INTERACTION_NAMES: Record<InteractionType, string> = {
  meditation: '参悟',
  music: '奏乐',
  ritual: '祭仪',
  dreamwalk: '入梦',
  cultivation: '修炼'
}

/** 缘分能力 */
export interface AffinityAbility {
  id: string
  affinityRequired: number
  name: string
  description: string
  passive?: {
    type: 'quality_boost' | 'stamina_save' | 'exp_boost' | 'sell_bonus' | 'luck' | 'max_stamina' | 'max_hp'
    value: number
  }
}

/** 结缘奖励类型 */
export type BondBonusType =
  | { type: 'weather_control'; chance: number }
  | { type: 'crop_blessing'; chance: number }
  | { type: 'animal_blessing'; chance: number }
  | { type: 'stamina_restore'; amount: number }
  | { type: 'fish_attraction'; chance: number }
  | { type: 'spirit_shield'; staminaSave: number; hpBonus: number }
  | { type: 'sell_bonus'; percent: number }

/** 隐藏NPC定义 */
export interface HiddenNpcDef {
  id: string
  name: string
  /** 真名（高缘分后揭示） */
  trueName: string
  gender: 'male' | 'female'
  /** 称号 */
  title: string
  /** 来历描述 */
  origin: string
  personality: string
  /** 发现链 */
  discoverySteps: DiscoveryStep[]
  /** 灵犀供奉：+100缘分 */
  resonantOfferings: string[]
  /** 合意供奉：+50缘分 */
  pleasedOfferings: string[]
  /** 排斥供奉：-40缘分 */
  repelledOfferings: string[]
  /** 按缘分等级的对话 */
  dialogues: Record<AffinityLevel, string[]>
  /** 独特互动类型 */
  interactionType: InteractionType
  /** 是否可结缘 */
  bondable: boolean
  /** 求缘物品ID */
  courtshipItemId: string
  /** 结缘物品ID */
  bondItemId: string
  /** 求缘缘分门槛 */
  courtshipThreshold: number
  /** 结缘缘分门槛 */
  bondThreshold: number
  /** 心事件ID列表 */
  heartEventIds: string[]
  /** 求缘阶段对话 */
  courtshipDialogues: string[]
  /** 结缘每日奖励（可多个） */
  bondBonuses: BondBonusType[]
  /** 结缘时赠予的马匹品种 */
  bondHorseBreed?: 'steppe' | 'cloud' | 'divine'
  /** 缘分能力树 */
  abilities: AffinityAbility[]
  /** 求缘物品制作材料 */
  courtshipCraftCost: { itemId: string; quantity: number }[]
  /** 结缘物品制作材料 */
  bondCraftCost: { itemId: string; quantity: number }[]
  /** 显灵日（等同生日） */
  manifestationDay: { season: Season; day: number }
}

/** 隐藏NPC运行时状态 */
export interface HiddenNpcState {
  npcId: string
  discoveryPhase: DiscoveryPhase
  /** 已完成的发现步骤ID */
  completedSteps: string[]
  /** 缘分 0-3000 */
  affinity: number
  /** 今日已互动 */
  interactedToday: boolean
  /** 今日已供奉 */
  offeredToday: boolean
  /** 本周供奉次数（上限3） */
  offersThisWeek: number
  /** 独特互动冷却天数 */
  specialInteractionCooldown: number
  /** 求缘中 */
  courting: boolean
  /** 已结缘 */
  bonded: boolean
  /** 已触发的心事件ID */
  triggeredHeartEvents: string[]
  /** 已解锁的能力ID */
  unlockedAbilities: string[]
}
