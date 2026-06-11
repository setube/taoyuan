import type { QuestHistoryFilter, SystemQuest } from '@/types/system'

export const QUEST_HISTORY_FILTER_OPTIONS: { key: QuestHistoryFilter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'active', label: '进行中' },
  { key: 'completed', label: '已完成' },
  { key: 'failed', label: '已失败' }
]

export function questEndSortKey(q: SystemQuest): number {
  return q.endedDay ?? q.deadline ?? q.assignedDay ?? 0
}

export function getActiveQuests(quests: SystemQuest[]): SystemQuest[] {
  return quests.filter(q => !q.completed && !q.expired)
}

export function getRecentCompletedQuests(quests: SystemQuest[], limit = 10): SystemQuest[] {
  return quests
    .filter(q => q.completed)
    .sort((a, b) => questEndSortKey(b) - questEndSortKey(a))
    .slice(0, limit)
}

export function getRecentFailedQuests(quests: SystemQuest[], limit = 10): SystemQuest[] {
  return quests
    .filter(q => q.expired && !q.completed)
    .sort((a, b) => questEndSortKey(b) - questEndSortKey(a))
    .slice(0, limit)
}

export function formatQuestDayRange(q: SystemQuest): string {
  const start = q.acceptedDay ?? q.assignedDay
  const end = q.endedDay
  if (start != null && end != null) return `第 ${start} 日 → 第 ${end} 日`
  if (start != null) return `派发第 ${q.assignedDay ?? start} 日 · 期限第 ${q.deadline} 日`
  if (q.assignedDay != null) return `派发第 ${q.assignedDay} 日 · 期限第 ${q.deadline} 日`
  return `期限第 ${q.deadline} 日`
}

export function filterQuestsByHistory(
  quests: SystemQuest[],
  filter: QuestHistoryFilter
): { active: SystemQuest[]; completed: SystemQuest[]; failed: SystemQuest[] } {
  const active = getActiveQuests(quests)
  const completed = getRecentCompletedQuests(quests)
  const failed = getRecentFailedQuests(quests)
  if (filter === 'active') return { active, completed: [], failed: [] }
  if (filter === 'completed') return { active: [], completed, failed: [] }
  if (filter === 'failed') return { active: [], completed: [], failed }
  return { active, completed, failed }
}
