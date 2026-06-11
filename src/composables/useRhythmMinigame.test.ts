import { describe, expect, it } from 'vitest'
import { buildForgeRhythmOptions, gradeRhythmOffset } from '@/composables/useRhythmMinigame'

describe('useRhythmMinigame', () => {
  it('gradeRhythmOffset 阈值与斗茶一致', () => {
    expect(gradeRhythmOffset(3)).toEqual({ grade: 'perfect', score: 50 })
    expect(gradeRhythmOffset(8)).toEqual({ grade: 'good', score: 30 })
    expect(gradeRhythmOffset(20)).toEqual({ grade: 'poor', score: 10 })
  })

  it('buildForgeRhythmOptions 天气修正 §7.4', () => {
    const stormy = buildForgeRhythmOptions('stormy')
    expect(stormy.getFillSpeed!({ roundIndex: 0, stepIndex: 0, forgeStep: 'heat' })).toBeCloseTo(1.08)

    const snowy = buildForgeRhythmOptions('snowy')
    expect(snowy.getFillSpeed!({ roundIndex: 0, stepIndex: 1, forgeStep: 'hammer' })).toBeCloseTo(1.05)

    const windy = buildForgeRhythmOptions('windy')
    expect(windy.getTargetZoneHalfWidth!({ roundIndex: 0, stepIndex: 0, forgeStep: 'heat' })).toBeCloseTo(12.96)
  })
})
