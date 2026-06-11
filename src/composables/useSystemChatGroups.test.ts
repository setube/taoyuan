import { describe, it, expect } from 'vitest'
import {
  groupSystemMessages,
  formatGameDayLabel,
  truncateBubbleText,
  shouldCollapseDayGroup,
  formatMessageTime,
  getMixedMessagesForDay,
  getMessageRenderType,
  filterDayGroup,
  filterDayGroups,
  matchesKindFilter,
  getAbsoluteGameDay,
  getCurrentGameSortKey,
  getInitiallyLoadedGroupKeys,
  exportSystemChatToText
} from './useSystemChatGroups'
import type { SystemMessage } from '@/types/system'

function msg(
  partial: Partial<SystemMessage> & Pick<SystemMessage, 'role' | 'content'>
): SystemMessage {
  return {
    id: '1',
    kind: partial.kind ?? 'notice',
    timestamp: 0,
    gameDay: partial.gameDay ?? 1,
    ...partial
  }
}

describe('groupSystemMessages', () => {
  it('按天分组并区分碎碎念与对话', () => {
    const groups = groupSystemMessages([
      msg({ role: 'system', kind: 'mumble', content: '早安', gameDay: 2, gameSeason: 'spring' }),
      msg({ role: 'player', kind: 'chat', content: '你好', gameDay: 2, gameSeason: 'spring' }),
      msg({ role: 'system', kind: 'chat', content: '嗯', gameDay: 2, gameSeason: 'spring' }),
      msg({ role: 'system', kind: 'notice', content: '任务完成', gameDay: 2, gameSeason: 'spring' })
    ])
    expect(groups).toHaveLength(1)
    expect(groups[0].day).toBe(2)
    expect(groups[0].season).toBe('spring')
    expect(groups[0].mumbles).toHaveLength(1)
    expect(groups[0].chats).toHaveLength(2)
    expect(groups[0].notices).toHaveLength(1)
  })

  it('多天按升序排列', () => {
    const groups = groupSystemMessages([
      msg({ role: 'system', kind: 'mumble', content: 'b', gameDay: 3, gameSeason: 'spring' }),
      msg({ role: 'system', kind: 'mumble', content: 'a', gameDay: 1, gameSeason: 'spring' })
    ])
    expect(groups.map(g => g.day)).toEqual([1, 3])
  })

  it('不同季节的同号日期应分开分组', () => {
    const groups = groupSystemMessages([
      msg({ id: 's28', role: 'system', kind: 'mumble', content: '春末', gameDay: 28, gameSeason: 'spring' }),
      msg({ id: 's8', role: 'system', kind: 'mumble', content: '夏初', gameDay: 8, gameSeason: 'summer' })
    ])
    expect(groups).toHaveLength(2)
    expect(groups[0].season).toBe('spring')
    expect(groups[0].day).toBe(28)
    expect(groups[1].season).toBe('summer')
    expect(groups[1].day).toBe(8)
    expect(groups[1].sortKey).toBeGreaterThan(groups[0].sortKey)
  })
})

describe('formatGameDayLabel', () => {
  it('第 0 天显示觉醒之初', () => {
    expect(formatGameDayLabel(0)).toBe('觉醒之初')
  })

  it('带季节显示季节名', () => {
    expect(formatGameDayLabel(8, 'summer')).toBe('夏 第8天')
  })
})

describe('truncateBubbleText', () => {
  it('超长文本截断', () => {
    const long = 'a'.repeat(60)
    expect(truncateBubbleText(long, 48)).toMatch(/…$/)
  })
})

describe('shouldCollapseDayGroup', () => {
  it('超过3天的记录应折叠', () => {
    const spring28 = getAbsoluteGameDay(1, 'spring', 28)
    const summer8 = getCurrentGameSortKey(1, 'summer', 8)
    expect(shouldCollapseDayGroup(spring28, summer8, 28)).toBe(true)
    expect(shouldCollapseDayGroup(summer8 - 2, summer8, 6)).toBe(false)
    expect(shouldCollapseDayGroup(summer8 - 3, summer8, 5)).toBe(false)
  })
})

describe('getMixedMessagesForDay', () => {
  it('同一天内按游戏时间混合排序', () => {
    const groups = groupSystemMessages([
      msg({ id: 'a', role: 'system', kind: 'mumble', content: '晚', gameDay: 2, gameHour: 20, gameSeason: 'spring', timestamp: 3 }),
      msg({ id: 'b', role: 'player', kind: 'chat', content: '早', gameDay: 2, gameHour: 8, gameSeason: 'spring', timestamp: 1 }),
      msg({ id: 'c', role: 'system', kind: 'notice', content: '中', gameDay: 2, gameHour: 12, gameSeason: 'spring', timestamp: 2 })
    ])
    const mixed = getMixedMessagesForDay(groups[0])
    expect(mixed.map(m => m.id)).toEqual(['b', 'c', 'a'])
  })

  it('同小时按 timestamp 先后', () => {
    const groups = groupSystemMessages([
      msg({ id: 'a', role: 'system', kind: 'mumble', content: '后', gameDay: 1, gameHour: 10, gameSeason: 'spring', timestamp: 2 }),
      msg({ id: 'b', role: 'player', kind: 'chat', content: '先', gameDay: 1, gameHour: 10, gameSeason: 'spring', timestamp: 1 })
    ])
    const mixed = getMixedMessagesForDay(groups[0])
    expect(mixed.map(m => m.id)).toEqual(['b', 'a'])
  })
})

describe('matchesKindFilter', () => {
  it('对话筛选包含玩家与系统回复', () => {
    expect(matchesKindFilter(msg({ role: 'player', kind: 'chat', content: 'x' }), 'chat')).toBe(true)
    expect(matchesKindFilter(msg({ role: 'system', kind: 'chat', content: 'x' }), 'chat')).toBe(true)
    expect(matchesKindFilter(msg({ role: 'system', kind: 'mumble', content: 'x' }), 'chat')).toBe(false)
  })
})

describe('filterDayGroups', () => {
  it('仅保留含目标类型的天', () => {
    const groups = groupSystemMessages([
      msg({ id: 'a', role: 'system', kind: 'mumble', content: 'm', gameDay: 1, gameSeason: 'spring' }),
      msg({ id: 'b', role: 'player', kind: 'chat', content: 'c', gameDay: 2, gameSeason: 'spring' })
    ])
    const mumbleOnly = filterDayGroups(groups, 'mumble')
    expect(mumbleOnly).toHaveLength(1)
    expect(mumbleOnly[0].day).toBe(1)
    expect(filterDayGroup(mumbleOnly[0], 'mumble').mumbles).toHaveLength(1)
  })
})

describe('getMessageRenderType', () => {
  it('区分四种渲染类型', () => {
    expect(getMessageRenderType(msg({ role: 'player', kind: 'chat', content: 'x' }))).toBe('chat-player')
    expect(getMessageRenderType(msg({ role: 'system', kind: 'mumble', content: 'x' }))).toBe('mumble')
    expect(getMessageRenderType(msg({ role: 'system', kind: 'chat', content: 'x' }))).toBe('chat-system')
    expect(getMessageRenderType(msg({ role: 'system', kind: 'notice', content: 'x' }))).toBe('notice')
  })
})

describe('getInitiallyLoadedGroupKeys', () => {
  it('仅加载最近三天内的分组', () => {
    const groups = groupSystemMessages([
      msg({ id: 'old', role: 'system', kind: 'mumble', content: '旧', gameDay: 1, gameSeason: 'spring' }),
      msg({ id: 'new', role: 'system', kind: 'mumble', content: '新', gameDay: 8, gameSeason: 'summer' })
    ])
    const current = getCurrentGameSortKey(1, 'summer', 8)
    const loaded = getInitiallyLoadedGroupKeys(groups, current)
    expect(loaded.has('1:summer:8')).toBe(true)
    expect(loaded.has('1:spring:1')).toBe(false)
  })
})

describe('exportSystemChatToText', () => {
  it('导出包含日期与消息正文', () => {
    const text = exportSystemChatToText(
      [
        msg({ id: 'a', role: 'system', kind: 'mumble', content: '早安', gameDay: 2, gameSeason: 'spring', gameHour: 8 })
      ],
      '青鸾'
    )
    expect(text).toContain('桃源乡 · 系统聊天记录')
    expect(text).toContain('春 第2天')
    expect(text).toContain('[碎碎念] 青鸾: 早安')
  })
})

describe('formatMessageTime', () => {
  it('格式化为游戏内时间 春-3-11:10', () => {
    expect(formatMessageTime({ gameSeason: 'spring', gameDay: 3, gameHour: 11 + 10 / 60 })).toBe('春-3-11:10')
  })

  it('无游戏时间字段时返回空', () => {
    expect(formatMessageTime({ gameDay: 1 })).toBe('')
  })
})
