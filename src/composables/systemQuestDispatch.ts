import type { PersonaId, QuestDifficulty, QuestType, SystemQuest } from '@/types/system'
import { getQuestAnnouncement } from './systemQuestEngine'
import { getQuestBaseReward, getQuestDeadlineDays } from '@/data/systemQuestTemplates'
import { getItemById } from '@/data/items'
import { FISH } from '@/data/fish'
import { getNpcById } from '@/data/npcs'
import { buildGameContext } from './buildGameContext'
import { getBackendUrl } from '@/utils/backendUrl'

const ALLOWED_TYPES: QuestType[] = [
  'collect',
  'craft',
  'mine',
  'social',
  'skill',
  'fish',
  'tavern'
]

export interface AiQuestDispatchPayload {
  type: QuestType
  difficulty: QuestDifficulty
  title: string
  description: string
  target: SystemQuest['target']
  announcement?: string
}

export interface AiQuestDispatchResponse {
  feasible: boolean
  reply?: string
  quest?: AiQuestDispatchPayload
}

export function sanitizeAiQuestPayload(
  raw: AiQuestDispatchPayload | undefined,
  currentDay: number,
  affinity: number
): SystemQuest | null {
  if (!raw?.type || !ALLOWED_TYPES.includes(raw.type)) return null
  const difficulty = clampInt(raw.difficulty, 1, 4) as QuestDifficulty
  const title = (raw.title ?? '').trim().slice(0, 40)
  const description = (raw.description ?? '').trim().slice(0, 120)
  if (!title || !description) return null

  const target = { ...raw.target }
  if (!sanitizeTarget(raw.type, target)) return null

  const assignedDay = currentDay
  let deadline = assignedDay + getQuestDeadlineDays(difficulty)
  if (affinity >= 70) deadline += 2
  else if (affinity >= 50) deadline += 1

  return {
    id: '',
    type: raw.type,
    difficulty,
    templateId: 'ai_dispatch',
    title,
    description,
    target,
    assignedDay,
    deadline,
    reward: getQuestBaseReward(difficulty),
    accepted: false,
    completed: false,
    negotiationRounds: 0,
    progress: 0
  }
}

function sanitizeTarget(type: QuestType, target: SystemQuest['target']): boolean {
  switch (type) {
    case 'collect':
    case 'craft': {
      const itemId = target.itemId
      if (!itemId || !getItemById(itemId)) return false
      target.quantity = clampInt(target.quantity, 1, 99)
      return true
    }
    case 'fish': {
      const fishId = target.fishId
      if (!fishId || !FISH.some(f => f.id === fishId)) return false
      target.quantity = clampInt(target.quantity, 1, 20)
      return true
    }
    case 'mine': {
      target.floor = clampInt(target.floor, 5, 120)
      return true
    }
    case 'social': {
      if (target.npcId && !getNpcById(target.npcId)) return false
      target.hearts = clampInt(target.hearts, 1, 4)
      return true
    }
    case 'skill': {
      const types = ['farming', 'fishing', 'mining', 'cooking', 'combat', 'foraging', 'any']
      if (!target.skillType || !types.includes(target.skillType)) return false
      target.skillLevel = clampInt(target.skillLevel, 1, 10)
      return true
    }
    case 'tavern': {
      const metrics = ['revenue', 'reputation', 'feast']
      if (!target.metric || !metrics.includes(target.metric)) return false
      target.threshold = clampInt(target.threshold, 1, 50000)
      return true
    }
    default:
      return false
  }
}

function clampInt(value: unknown, min: number, max: number): number {
  const n = typeof value === 'number' ? value : parseInt(String(value ?? min), 10)
  if (Number.isNaN(n)) return min
  return Math.min(max, Math.max(min, n))
}

export async function requestAiQuestDispatch(options: {
  personaId: PersonaId
  affinity: number
  merit: number
  currentDay: number
  sessionToken: string | null
}): Promise<{ quest: SystemQuest; announcement: string } | null> {
  try {
    const res = await fetch(`${getBackendUrl()}/api/v1/quest/dispatch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(options.sessionToken ? { Authorization: `Bearer ${options.sessionToken}` } : {})
      },
      body: JSON.stringify({
        personaId: options.personaId,
        affinity: options.affinity,
        merit: options.merit,
        currentDay: options.currentDay,
        context: buildGameContext()
      })
    })
    if (!res.ok) return null
    const data = (await res.json()) as AiQuestDispatchResponse
    if (!data.feasible || !data.quest) return null

    const quest = sanitizeAiQuestPayload(data.quest, options.currentDay, options.affinity)
    if (!quest) return null

    const announcement =
      (data.reply ?? data.quest.announcement ?? '').trim() ||
      getQuestAnnouncement(quest, options.personaId)

    return { quest, announcement }
  } catch {
    return null
  }
}
