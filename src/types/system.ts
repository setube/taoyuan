import type { Season } from '@/types/game'

export type PersonaId = 'qingluan' | 'chaofeng' | 'taosu' | 'moyan'

/** mumble=碎碎念/日常问候；chat=玩家主动对话；notice=任务/连接等系统提示 */
export type SystemMessageKind = 'mumble' | 'chat' | 'notice'

export interface SystemMessage {
  id: string
  role: 'system' | 'player'
  kind: SystemMessageKind
  content: string
  /** 兼容旧存档；新消息使用 gameSeason + gameHour */
  timestamp: number
  gameDay: number
  gameYear?: number
  gameSeason?: Season
  gameHour?: number
}

export type ConnectionMode = 'offline' | 'online'

export type QuestType = 'collect' | 'mine' | 'social' | 'skill' | 'craft' | 'fish' | 'tavern'
export type QuestDifficulty = 1 | 2 | 3 | 4

export type QuestNegotiationType = 'extend_deadline' | 'reduce_target' | 'swap_type'

export interface SystemQuest {
  id: string
  type: QuestType
  difficulty: QuestDifficulty
  templateId?: string
  title?: string
  description?: string
  target: {
    itemId?: string
    quantity?: number
    floor?: number
    npcId?: string
    hearts?: number
    skillType?: string
    skillLevel?: number
    fishId?: string
    metric?: string
    threshold?: number
  }
  assignedDay?: number
  deadline: number
  reward: number
  accepted: boolean
  completed: boolean
  expired?: boolean
  negotiationRounds: number
  swappedType?: boolean
  /** 酒肆日收入 / 宴席完成次数等进度 */
  progress?: number
  /** 接受任务的游戏日 */
  acceptedDay?: number
  /** 完成或失败结算的游戏日 */
  endedDay?: number
  /** 过期失败时的功勋罚金 */
  fine?: number
  /** 系统对本次任务的事后评价（AI 或离线生成） */
  evaluation?: string
  /** 评价生成中 */
  evaluationPending?: boolean
}

export type QuestOutcomeAlertType = 'completed' | 'failed'

export interface QuestOutcomeAlert {
  type: QuestOutcomeAlertType
  questId: string
  title: string
  description: string
  reward: number
  fine: number
  meritBefore: number
  meritAfter: number
  endedDay: number
}

export type QuestHistoryFilter = 'all' | 'active' | 'completed' | 'failed'

export type KnowledgeCategory =
  | 'crop' | 'fish' | 'recipe' | 'mine' | 'npc'
  | 'skill' | 'equipment' | 'mechanic' | 'item' | 'tavern'
  | 'animal' | 'shop' | 'festival' | 'fruit_tree' | 'hidden_npc' | 'processing' | 'gem'

/** 亲和度日常计数（按游戏日重置） */
export interface SystemAffinityDaily {
  day: number
  panelOpened: boolean
  panelBonusGranted: boolean
  chatCount: number
  chatBonusGranted: boolean
  adviceCount: number
}

/** 长期记忆与陪伴状态 */
export interface SystemMemoryState {
  lastPanelOpenDay: number
  daysWithoutPanel: number
  sevenDayPenaltyFired: boolean
  taosuFiveDayPenaltyFired: boolean
  lastOnlineRealMs: number
  absenceWelcomeDay: number
  lastPeriodicSummaryDay: number
  animalNeglectStreak: number
  firstCrop: string | null
  firstFish: string | null
  firstDeathFloor: number | null
  firstMaxFriendNpc: string | null
  firstExpansionDone: boolean
  totalCropsHarvested: number
  deepestMineFloor: number
  consecutiveMiningDays: number
  lastMiningActivityDay: number
  onceFlags: Record<string, boolean>
  /** 主动搭话：类型 → 上次触发的游戏小时戳 */
  triggerLastAt: Record<string, number>
  proactiveTriggerDay: number
  proactiveTriggerCount: number
  /** 体力提醒闩锁：低于 30% 后只提醒一次，恢复至 ≥30% 后重置 */
  staminaAlertBand?: 'ok' | 'low' | 'empty'
}

export type SystemTriggerType =
  | 'season_change'
  | 'festival'
  | 'stamina_low'
  | 'stamina_empty'
  | 'skill_level_up'
  | 'processing_done'
  | 'mine_new_floor'
  | 'mine_boss_near'
  | 'safe_point'
  | 'npc_heart_up'
  | 'npc_birthday'
  | 'inventory_full'
  | 'weather_special'

export type AffinityBehaviorKey =
  | 'drink_tea'
  | 'brew_osmanthus_wine'
  | 'gift_tea_liked'
  | 'gift_rude'
  | 'late_night'
  | 'mine_floor_40'
  | 'eat_spicy'
  | 'stormy_adventure'
  | 'rare_drop'
  | 'early_retreat'
  | 'eat_sweet'
  | 'pet_or_feed_animal'
  | 'spring_harvest'
  | 'mine_injured'
  | 'animal_neglect'
  | 'museum_gem_donate'
  | 'perfect_feast'

export function createDefaultAffinityDaily(day = 0): SystemAffinityDaily {
  return {
    day,
    panelOpened: false,
    panelBonusGranted: false,
    chatCount: 0,
    chatBonusGranted: false,
    adviceCount: 0
  }
}

export function createDefaultMemoryState(): SystemMemoryState {
  return {
    lastPanelOpenDay: -1,
    daysWithoutPanel: 0,
    sevenDayPenaltyFired: false,
    taosuFiveDayPenaltyFired: false,
    lastOnlineRealMs: Date.now(),
    absenceWelcomeDay: -1,
    lastPeriodicSummaryDay: 0,
    animalNeglectStreak: 0,
    firstCrop: null,
    firstFish: null,
    firstDeathFloor: null,
    firstMaxFriendNpc: null,
    firstExpansionDone: false,
    totalCropsHarvested: 0,
    deepestMineFloor: 0,
    consecutiveMiningDays: 0,
    lastMiningActivityDay: -1,
    onceFlags: {},
    triggerLastAt: {},
    proactiveTriggerDay: 0,
    proactiveTriggerCount: 0,
    staminaAlertBand: 'ok'
  }
}

export interface KnowledgeEntry {
  id: string
  category: KnowledgeCategory
  keywords: string[]
  title: string
  content: string
  relatedIds?: string[]
}

export type MeritBuffType = 'permanent' | 'timed'

export type MeritShopCategory = 'stat' | 'buff' | 'timed' | 'item' | 'custom'

export interface MeritShopOffer {
  id: string
  name: string
  description: string
  cost: number
  category: MeritShopCategory
  source: 'catalog' | 'wish'
  buffType: MeritBuffType
  durationDays?: number
  effect: {
    type: string
    value: number
    itemId?: string
    quantity?: number
  }
  once?: boolean
  /** 最大可兑换次数；未设且 once 为 true 时视为 1 次 */
  maxPurchases?: number
  purchased?: boolean
  /** 当前已兑换次数（UI 展示） */
  purchaseCount?: number
  wishPrompt?: string
  createdDay?: number
}

export interface MeritBuff {
  id: string
  name: string
  description: string
  cost: number
  type: MeritBuffType
  durationDays?: number
  expiresOnDay?: number
  effect: {
    type: string
    value: number
    itemId?: string
    quantity?: number
  }
}

export interface MemoryTimelineEntry {
  day: number
  summary: string
  trigger: 'periodic' | 'milestone' | 'affinity'
  createdAt: number
}

export const AFFINITY_MILESTONES = {
  TONE_SHIFT: 30,
  OCCASIONAL_PRAISE: 50,
  REVEAL_SECRET: 70,
  GIFT: 100
} as const