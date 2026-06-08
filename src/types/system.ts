export type PersonaId = 'qingluan' | 'chaofeng' | 'taosu' | 'moyan'

export interface SystemMessage {
  id: string
  role: 'system' | 'player'
  content: string
  timestamp: number
  gameDay: number
}

export type ConnectionMode = 'offline' | 'online'

export type QuestType = 'collect' | 'mine' | 'social' | 'skill' | 'craft' | 'fish' | 'tavern'
export type QuestDifficulty = 1 | 2 | 3 | 4

export interface SystemQuest {
  id: string
  type: QuestType
  difficulty: QuestDifficulty
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
  deadline: number
  reward: number
  accepted: boolean
  completed: boolean
  negotiationRounds: number
}

export type KnowledgeCategory =
  | 'crop' | 'fish' | 'recipe' | 'mine' | 'npc'
  | 'skill' | 'equipment' | 'mechanic' | 'item' | 'tavern'

export interface KnowledgeEntry {
  id: string
  category: KnowledgeCategory
  keywords: string[]
  title: string
  content: string
  relatedIds?: string[]
}

export type MeritBuffType = 'permanent' | 'timed'

export interface MeritBuff {
  id: string
  name: string
  description: string
  cost: number
  type: MeritBuffType
  durationDays?: number
  effect: {
    type: string
    value: number
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