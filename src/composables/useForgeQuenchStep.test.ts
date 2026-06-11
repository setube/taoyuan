import { describe, expect, it } from 'vitest'
import { useForgeQuenchStep } from '@/composables/useForgeQuenchStep'

describe('useForgeQuenchStep', () => {
  it('松手时按与目标区偏差计分', () => {
    const step = useForgeQuenchStep({ coolSpeed: 5, zoneHalfWidth: 12 })
    step.start()
    step.targetPosition.value = 40

    step.tempPct.value = 42
    const result = step.release()
    expect(result?.grade).toBe('perfect')
    expect(result?.score).toBe(50)
  })

  it('过短松手不计入结算', () => {
    const step = useForgeQuenchStep({ coolSpeed: 5 })
    step.start()
    step.targetPosition.value = 40
    expect(step.beginHold()).toBe(true)
    expect(step.release()).toBeNull()
    expect(step.isActive.value).toBe(true)
  })
})
