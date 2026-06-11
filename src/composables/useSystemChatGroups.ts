import type { SystemMessage, SystemMessageKind } from '@/types/system'
import type { Season } from '@/types/game'
import { SEASON_NAMES } from '@/stores/useGameStore'

export type SystemChatDisplayMode = 'sectioned' | 'mixed'

/** 消息类型筛选：all=全部，其余仅显示对应类型 */
export type SystemChatKindFilter = 'all' | 'mumble' | 'notice' | 'chat'

export type SystemMessageRenderType = 'mumble' | 'notice' | 'chat-player' | 'chat-system'

export const SYSTEM_CHAT_KIND_FILTER_OPTIONS: { key: SystemChatKindFilter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'mumble', label: '碎碎念' },
  { key: 'notice', label: '提示' },
  { key: 'chat', label: '对话' }
]

const SEASON_ORDER: Season[] = ['spring', 'summer', 'autumn', 'winter']

export interface SystemDayGroup {
  /** 唯一分组键（含年/季/日，避免夏8天与春28天混排） */
  groupKey: string
  day: number
  season?: Season
  year?: number
  sortKey: number
  mumbles: SystemMessage[]
  chats: SystemMessage[]
  notices: SystemMessage[]
}

/** 超过当前游戏日多少天的记录默认折叠 */
export const CHAT_FOLD_DAYS = 3

export function getAbsoluteGameDay(year: number, season: Season, day: number): number {
  const seasonIndex = SEASON_ORDER.indexOf(season)
  return (year - 1) * 112 + seasonIndex * 28 + day
}

export function getDayGroupKey(msg: SystemMessage): string {
  const day = msg.gameDay ?? 0
  if (msg.gameSeason) {
    const year = msg.gameYear ?? 1
    return `${year}:${msg.gameSeason}:${day}`
  }
  return `legacy:${day}`
}

export function getGroupSortKey(season: Season | undefined, year: number | undefined, day: number): number {
  if (season && day > 0) {
    return getAbsoluteGameDay(year ?? 1, season, day)
  }
  if (day > 0) return day
  return 0
}

export function getCurrentGameSortKey(year: number, season: Season, day: number): number {
  return getAbsoluteGameDay(year, season, day)
}

export function resolveMessageKind(msg: SystemMessage): SystemMessageKind {
  if (msg.kind) return msg.kind
  if (msg.role === 'player') return 'chat'
  if (msg.content.startsWith('【记忆摘要】') || msg.content.startsWith('（亲和')) return 'notice'
  return 'notice'
}

export function groupSystemMessages(messages: SystemMessage[]): SystemDayGroup[] {
  const map = new Map<string, SystemDayGroup>()
  for (const msg of messages) {
    const groupKey = getDayGroupKey(msg)
    const day = msg.gameDay ?? 0
    let group = map.get(groupKey)
    if (!group) {
      const season = msg.gameSeason
      const year = msg.gameYear ?? 1
      group = {
        groupKey,
        day,
        season,
        year: season ? year : undefined,
        sortKey: getGroupSortKey(season, year, day),
        mumbles: [],
        chats: [],
        notices: []
      }
      map.set(groupKey, group)
    }
    const kind = resolveMessageKind(msg)
    if (msg.role === 'player' || kind === 'chat') {
      group.chats.push(msg)
    } else if (kind === 'mumble') {
      group.mumbles.push(msg)
    } else {
      group.notices.push(msg)
    }
  }
  return [...map.values()].sort((a, b) => a.sortKey - b.sortKey || a.groupKey.localeCompare(b.groupKey))
}

export function formatGameDayLabel(day: number, season?: Season, year?: number): string {
  if (day <= 0) return '觉醒之初'
  if (season && year && year > 1) return `${year}年${SEASON_NAMES[season]} 第${day}天`
  if (season) return `${SEASON_NAMES[season]} 第${day}天`
  return `第 ${day} 天`
}

export function shouldCollapseDayGroup(groupSortKey: number, currentSortKey: number, day: number): boolean {
  if (day <= 0 || currentSortKey <= 0) return false
  return currentSortKey - groupSortKey > CHAT_FOLD_DAYS
}

/** 是否为超过 CHAT_FOLD_DAYS 的较早记录（需懒加载） */
export function isStaleDayGroup(groupSortKey: number, currentSortKey: number, day: number): boolean {
  return shouldCollapseDayGroup(groupSortKey, currentSortKey, day)
}

/** 初始应加载的近期分组键（当前日起最近 CHAT_FOLD_DAYS 天内） */
export function getInitiallyLoadedGroupKeys(
  groups: SystemDayGroup[],
  currentSortKey: number
): Set<string> {
  const loaded = new Set<string>()
  for (const g of groups) {
    if (!isStaleDayGroup(g.sortKey, currentSortKey, g.day)) {
      loaded.add(g.groupKey)
    }
  }
  return loaded
}

const RENDER_TYPE_LABEL: Record<SystemMessageRenderType, string> = {
  mumble: '碎碎念',
  notice: '提示',
  'chat-player': '对话',
  'chat-system': '对话'
}

/** 导出全部聊天记录为纯文本 */
export function exportSystemChatToText(messages: SystemMessage[], displayName: string): string {
  const groups = groupSystemMessages(messages)
  const lines: string[] = [
    '桃源乡 · 系统聊天记录',
    `导出时间：${new Date().toLocaleString('zh-CN')}`,
    `共 ${messages.length} 条消息`,
    ''
  ]
  for (const group of groups) {
    lines.push(`════ ${formatGameDayLabel(group.day, group.season, group.year)} ════`)
    for (const msg of getMixedMessagesForDay(group)) {
      const time = hasMessageTime(msg) ? `${formatMessageTime(msg)} ` : ''
      const role = msg.role === 'player' ? '玩家' : displayName
      const typeLabel = RENDER_TYPE_LABEL[getMessageRenderType(msg)]
      const content = msg.content.replace(/\r\n/g, '\n')
      lines.push(`${time}[${typeLabel}] ${role}: ${content}`)
    }
    lines.push('')
  }
  return lines.join('\n')
}

export function countGroupMessages(group: SystemDayGroup): number {
  return group.mumbles.length + group.chats.length + group.notices.length
}

export function getMessageRenderType(msg: SystemMessage): SystemMessageRenderType {
  if (msg.role === 'player') return 'chat-player'
  const kind = resolveMessageKind(msg)
  if (kind === 'mumble') return 'mumble'
  if (kind === 'chat') return 'chat-system'
  return 'notice'
}

/** 按游戏内时间排序；同小时按发送先后（timestamp） */
export function compareMessagesChronologically(a: SystemMessage, b: SystemMessage): number {
  const hourA = a.gameHour ?? -1
  const hourB = b.gameHour ?? -1
  if (hourA !== hourB) return hourA - hourB
  return (a.timestamp ?? 0) - (b.timestamp ?? 0)
}

export function sortMessagesChronologically(messages: SystemMessage[]): SystemMessage[] {
  return [...messages].sort(compareMessagesChronologically)
}

/** 混合模式：同一天内碎碎念、提示、对话按时间交织 */
export function getMixedMessagesForDay(group: SystemDayGroup): SystemMessage[] {
  return sortMessagesChronologically([
    ...group.mumbles,
    ...group.notices,
    ...group.chats
  ])
}

export function matchesKindFilter(msg: SystemMessage, filter: SystemChatKindFilter): boolean {
  if (filter === 'all') return true
  const type = getMessageRenderType(msg)
  if (filter === 'mumble') return type === 'mumble'
  if (filter === 'notice') return type === 'notice'
  return type === 'chat-player' || type === 'chat-system'
}

export function filterDayGroup(group: SystemDayGroup, filter: SystemChatKindFilter): SystemDayGroup {
  if (filter === 'all') return group
  return {
    ...group,
    mumbles: filter === 'mumble' ? group.mumbles : [],
    notices: filter === 'notice' ? group.notices : [],
    chats: filter === 'chat' ? group.chats : []
  }
}

export function filterDayGroups(
  groups: SystemDayGroup[],
  filter: SystemChatKindFilter
): SystemDayGroup[] {
  return groups
    .map(g => filterDayGroup(g, filter))
    .filter(g => countGroupMessages(g) > 0)
}

export interface GameMessageTimeInput {
  gameDay?: number
  gameSeason?: Season
  gameHour?: number
}

/** 游戏内时间：春-3-11:10 */
export function formatMessageTime(msg: GameMessageTimeInput): string {
  if (msg.gameSeason == null || msg.gameHour == null) return ''
  const seasonName = SEASON_NAMES[msg.gameSeason]
  const day = msg.gameDay ?? 0
  const totalMinutes = Math.round(msg.gameHour * 60)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  const realH = h >= 24 ? h - 24 : h
  const mm = m.toString().padStart(2, '0')
  return `${seasonName}-${day}-${realH}:${mm}`
}

export function hasMessageTime(msg: GameMessageTimeInput): boolean {
  return msg.gameSeason != null && msg.gameHour != null
}

export function truncateBubbleText(text: string, maxLen = 48): string {
  const oneLine = text.replace(/\s+/g, ' ').trim()
  if (oneLine.length <= maxLen) return oneLine
  return `${oneLine.slice(0, maxLen)}…`
}
