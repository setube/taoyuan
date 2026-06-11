import { describe, expect, it } from 'vitest'
import {
  checkPanelAbsencePenalties,
  evaluatePersonaBehavior,
  onPanelOpenDaily,
  onPlayerChatDaily
} from './systemAffinityEngine'
import { createDefaultMemoryState } from '@/types/system'

describe('systemAffinityEngine', () => {
  it('每日开面板 +1 仅一次', () => {
    const daily = { day: 1, panelOpened: false, panelBonusGranted: false, chatCount: 0, chatBonusGranted: false, adviceCount: 0 }
    expect(onPanelOpenDaily(daily, 1)?.delta).toBe(1)
    expect(onPanelOpenDaily(daily, 1)).toBeNull()
  })

  it('对话满 3 句 +1', () => {
    const daily = { day: 2, panelOpened: false, panelBonusGranted: false, chatCount: 0, chatBonusGranted: false, adviceCount: 0 }
    expect(onPlayerChatDaily(daily, 2)).toBeNull()
    onPlayerChatDaily(daily, 2)
    const gain = onPlayerChatDaily(daily, 2)
    expect(gain?.delta).toBe(1)
  })

  it('连续 3 天未开面板 -2', () => {
    const memory = createDefaultMemoryState()
    memory.lastPanelOpenDay = 0
    memory.daysWithoutPanel = 2
    const penalties = checkPanelAbsencePenalties(memory, 3, 'qingluan')
    expect(penalties.some(p => p.delta === -2)).toBe(true)
    expect(memory.daysWithoutPanel).toBe(3)
  })

  it('青鸾喝茶 +2', () => {
    const memory = createDefaultMemoryState()
    const gain = evaluatePersonaBehavior('qingluan', 'drink_tea', memory)
    expect(gain?.delta).toBe(2)
  })

  it('嘲风下 40 层 +2', () => {
    const memory = createDefaultMemoryState()
    const gain = evaluatePersonaBehavior('chaofeng', 'mine_floor_40', memory)
    expect(gain?.delta).toBe(2)
  })
})
