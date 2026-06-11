import { describe, expect, it } from 'vitest'
import {
  buildTriggerEventSummary,
  buildTriggerMessage,
  canFireTrigger,
  evaluateStaminaAlert,
  getStaminaAlertBand,
  markTriggerFired,
  toGameHours,
  TRIGGER_COOLDOWN_HOURS,
  MAX_PROACTIVE_TRIGGERS_PER_DAY
} from './systemTriggerEngine'
import { createDefaultMemoryState } from '@/types/system'

describe('systemTriggerEngine', () => {
  it('toGameHours 递增', () => {
    expect(toGameHours(2, 10)).toBeGreaterThan(toGameHours(1, 20))
  })

  it('同类型冷却内不重复触发', () => {
    const memory = createDefaultMemoryState()
    expect(canFireTrigger(memory, 'stamina_low', 5, 10, 'online')).toBe(true)
    markTriggerFired(memory, 'stamina_low', 5, 10)
    expect(canFireTrigger(memory, 'stamina_low', 5, 10.1, 'online')).toBe(false)
    expect(canFireTrigger(memory, 'stamina_low', 5, 10 + TRIGGER_COOLDOWN_HOURS, 'online')).toBe(true)
  })

  it('每日上限', () => {
    const memory = createDefaultMemoryState()
    for (let i = 0; i < MAX_PROACTIVE_TRIGGERS_PER_DAY; i++) {
      markTriggerFired(memory, `t${i}` as any, 3, 8 + i)
    }
    expect(canFireTrigger(memory, 'festival', 3, 20, 'online')).toBe(false)
  })

  it('人格化文案', () => {
    const msg = buildTriggerMessage('taosu', 'skill_level_up', { skillType: 'farming', skillLevel: 3 })
    expect(msg).toContain('农耕')
    expect(msg.length).toBeGreaterThan(4)
  })

  it('事件摘要供 LLM 使用', () => {
    const summary = buildTriggerEventSummary('season_change', { oldSeason: 'spring', season: 'summer' })
    expect(summary).toContain('春')
    expect(summary).toContain('夏')
  })

  it('背包快满时提示收贮归置', () => {
    const msg = buildTriggerMessage('moyan', 'inventory_full', {})
    expect(msg).toContain('收贮归置')
  })

  it('体力警戒区只提醒一次', () => {
    const max = 100
    expect(getStaminaAlertBand(50, max)).toBe('ok')
    expect(getStaminaAlertBand(25, max)).toBe('low')
    expect(getStaminaAlertBand(4, max)).toBe('empty')

    expect(evaluateStaminaAlert('ok', 25, max)).toEqual({ band: 'low', fire: 'stamina_low' })
    expect(evaluateStaminaAlert('low', 20, max)).toEqual({ band: 'low', fire: null })
    expect(evaluateStaminaAlert('low', 4, max)).toEqual({ band: 'empty', fire: null })
    expect(evaluateStaminaAlert('empty', 3, max)).toEqual({ band: 'empty', fire: null })
    expect(evaluateStaminaAlert('low', 35, max)).toEqual({ band: 'ok', fire: null })
    expect(evaluateStaminaAlert('ok', 4, max)).toEqual({ band: 'empty', fire: 'stamina_empty' })
  })
})
