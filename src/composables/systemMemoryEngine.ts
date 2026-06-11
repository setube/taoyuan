import type { MemoryTimelineEntry, PersonaId, SystemMemoryState } from '@/types/system'
import { getCropById } from '@/data/crops'
import { getFishById } from '@/data/fish'
import { getNpcById } from '@/data/npcs'

const MAX_TIMELINE = 48

export interface PeriodicSummaryContext {
  day: number
  season: string
  year: number
  totalCropsHarvested: number
  money: number
  deepestMineFloor: number
  maxNpcFriendship: number
  maxNpcId: string | null
  affinity: number
}

export function appendTimeline(
  timeline: MemoryTimelineEntry[],
  entry: Omit<MemoryTimelineEntry, 'createdAt'>
): MemoryTimelineEntry[] {
  const next = [...timeline, { ...entry, createdAt: Date.now() }]
  if (next.length > MAX_TIMELINE) return next.slice(-MAX_TIMELINE)
  return next
}

export function recordFirstCrop(
  memory: SystemMemoryState,
  cropId: string,
  day: number
): MemoryTimelineEntry | null {
  if (memory.firstCrop) return null
  memory.firstCrop = cropId
  const name = getCropById(cropId)?.name ?? cropId
  return {
    day,
    summary: `首次收获作物：${name}`,
    trigger: 'milestone',
    createdAt: Date.now()
  }
}

export function recordCropHarvest(memory: SystemMemoryState): void {
  memory.totalCropsHarvested++
}

export function recordFirstFish(
  memory: SystemMemoryState,
  fishId: string,
  day: number
): MemoryTimelineEntry | null {
  if (memory.firstFish) return null
  memory.firstFish = fishId
  const name = getFishById(fishId)?.name ?? fishId
  return {
    day,
    summary: `首次钓到：${name}`,
    trigger: 'milestone',
    createdAt: Date.now()
  }
}

export function recordFirstDeathFloor(
  memory: SystemMemoryState,
  floor: number,
  day: number
): MemoryTimelineEntry | null {
  if (memory.firstDeathFloor !== null) return null
  memory.firstDeathFloor = floor
  return {
    day,
    summary: `第一次在矿洞第 ${floor} 层倒下`,
    trigger: 'milestone',
    createdAt: Date.now()
  }
}

export function recordFirstMaxFriendNpc(
  memory: SystemMemoryState,
  npcId: string,
  day: number
): MemoryTimelineEntry | null {
  if (memory.firstMaxFriendNpc) return null
  memory.firstMaxFriendNpc = npcId
  const name = getNpcById(npcId)?.name ?? npcId
  return {
    day,
    summary: `第一位满好感 NPC：${name}`,
    trigger: 'milestone',
    createdAt: Date.now()
  }
}

export function recordFirstExpansion(
  memory: SystemMemoryState,
  level: number,
  day: number
): MemoryTimelineEntry | null {
  if (memory.firstExpansionDone || level < 1) return null
  memory.firstExpansionDone = true
  return {
    day,
    summary: `首次扩建农舍至 Lv${level}`,
    trigger: 'milestone',
    createdAt: Date.now()
  }
}

export function updateDeepestMine(memory: SystemMemoryState, floor: number): void {
  if (floor > memory.deepestMineFloor) memory.deepestMineFloor = floor
}

export function trackMiningActivity(memory: SystemMemoryState, day: number): void {
  if (memory.lastMiningActivityDay === day - 1) {
    memory.consecutiveMiningDays++
  } else if (memory.lastMiningActivityDay !== day) {
    memory.consecutiveMiningDays = 1
  }
  memory.lastMiningActivityDay = day
}

export function shouldWritePeriodicSummary(memory: SystemMemoryState, day: number): boolean {
  if (day < 7) return false
  if (memory.lastPeriodicSummaryDay <= 0) return day % 7 === 0
  return day - memory.lastPeriodicSummaryDay >= 7
}

export function buildPeriodicSummary(ctx: PeriodicSummaryContext): string {
  const npcName = ctx.maxNpcId ? (getNpcById(ctx.maxNpcId)?.name ?? ctx.maxNpcId) : '暂无'
  return `第 ${ctx.day} 日小结：累计收获 ${ctx.totalCropsHarvested} 次作物，铜钱 ${ctx.money}，最深矿层 ${ctx.deepestMineFloor}，最佳关系 ${npcName}（${ctx.maxNpcFriendship} 好感），亲和 ${ctx.affinity}`
}

export function detectOfflineDays(lastOnlineMs: number, nowMs = Date.now()): number {
  if (!lastOnlineMs) return 0
  const diff = nowMs - lastOnlineMs
  return Math.floor(diff / (24 * 60 * 60 * 1000))
}

export function pickMilestoneRecall(
  memory: SystemMemoryState,
  personaId: PersonaId | null
): string | null {
  if (!personaId) return null
  const pool: string[] = []
  if (memory.firstCrop) {
    const name = getCropById(memory.firstCrop)?.name ?? memory.firstCrop
    pool.push(`还记得你第一次种的是${name}吗？`)
  }
  if (memory.firstFish) {
    const name = getFishById(memory.firstFish)?.name ?? memory.firstFish
    pool.push(`你钓到的第一条鱼是${name}，我还记得。`)
  }
  if (memory.firstDeathFloor !== null) {
    pool.push(`矿洞第 ${memory.firstDeathFloor} 层那次跌倒，后来你变强了不少。`)
  }
  if (memory.firstMaxFriendNpc) {
    const name = getNpcById(memory.firstMaxFriendNpc)?.name ?? memory.firstMaxFriendNpc
    pool.push(`${name}和你关系最好，这一点我记下了。`)
  }
  if (pool.length === 0) return null
  return pool[Math.floor(Math.random() * pool.length)]!
}
