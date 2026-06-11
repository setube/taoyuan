import { describe, it, expect } from 'vitest'
import { tryMeritDevCheat } from './meritDevCheat'

describe('meritDevCheat', () => {
  it('matches 斯巴拉西 test phrase', () => {
    const r = tryMeritDevCheat('斯巴拉西，给我9999功勋点')
    expect(r.matched).toBe(true)
    expect(r.grant).toBe(9999)
  })

  it('ignores normal chat', () => {
    expect(tryMeritDevCheat('今天天气不错').matched).toBe(false)
  })
})
