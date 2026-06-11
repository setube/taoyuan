import { describe, expect, it } from 'vitest'
import {
  appendTimeline,
  buildPeriodicSummary,
  detectOfflineDays,
  recordFirstCrop,
  recordFirstFish,
  shouldWritePeriodicSummary
} from './systemMemoryEngine'
import { createDefaultMemoryState } from '@/types/system'

describe('systemMemoryEngine', () => {
  it('记录首次收获', () => {
    const memory = createDefaultMemoryState()
    const entry = recordFirstCrop(memory, 'cabbage', 5)
    expect(entry?.summary).toContain('青菜')
    expect(memory.firstCrop).toBe('cabbage')
    expect(recordFirstCrop(memory, 'potato', 6)).toBeNull()
  })

  it('记录首次钓鱼', () => {
    const memory = createDefaultMemoryState()
    const entry = recordFirstFish(memory, 'carp', 8)
    expect(entry?.summary).toContain('鲤鱼')
    expect(memory.firstFish).toBe('carp')
  })

  it('timeline 上限 48', () => {
    const base = { day: 1, summary: 'a', trigger: 'periodic' as const, createdAt: 1 }
    let timeline = [base]
    for (let i = 0; i < 50; i++) {
      timeline = appendTimeline(timeline, { day: i, summary: `s${i}`, trigger: 'periodic' })
    }
    expect(timeline.length).toBe(48)
  })

  it('每 7 日摘要', () => {
    const memory = createDefaultMemoryState()
    expect(shouldWritePeriodicSummary(memory, 7)).toBe(true)
    memory.lastPeriodicSummaryDay = 7
    expect(shouldWritePeriodicSummary(memory, 13)).toBe(false)
    expect(shouldWritePeriodicSummary(memory, 14)).toBe(true)
  })

  it('离线天数检测', () => {
    const threeDays = 3 * 24 * 60 * 60 * 1000
    expect(detectOfflineDays(Date.now() - threeDays - 1000)).toBe(3)
  })

  it('周期摘要包含关键字段', () => {
    const text = buildPeriodicSummary({
      day: 14,
      season: 'spring',
      year: 1,
      totalCropsHarvested: 12,
      money: 5000,
      deepestMineFloor: 25,
      maxNpcFriendship: 800,
      maxNpcId: 'chun_lan',
      affinity: 35
    })
    expect(text).toContain('14')
    expect(text).toContain('5000')
    expect(text).toContain('亲和 35')
  })
})
