import { describe, expect, it } from 'vitest'
import { scoreHammerClicks } from '@/composables/useForgeHammerStep'

describe('scoreHammerClicks', () => {
  it('按点击次数分档', () => {
    expect(scoreHammerClicks(10).score).toBe(10)
    expect(scoreHammerClicks(25).score).toBe(30)
    expect(scoreHammerClicks(28).score).toBe(50)
    expect(scoreHammerClicks(40).score).toBe(50)
  })
})
