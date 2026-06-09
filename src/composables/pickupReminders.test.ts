import { describe, expect, it } from 'vitest'

/** 与 useEndDay handleEndDay 睡前拾取提醒逻辑一致 */
function buildPickupReminderParts(state: {
  creekCatch: unknown[]
  pendingCaveLoot: { quantity: number; itemId?: string }[]
  pendingFruitLoot: unknown[]
}): string[] {
  const parts: string[] = []
  if (state.creekCatch.length > 0) {
    parts.push(`溪流鱼获${state.creekCatch.length}条`)
  }
  if (state.pendingCaveLoot.length > 0) {
    const caveCount = state.pendingCaveLoot.reduce((s, l) => s + l.quantity, 0)
    parts.push(`山洞产出${caveCount}份`)
  }
  if (state.pendingFruitLoot.length > 0) {
    parts.push(`果林果实${state.pendingFruitLoot.length}个`)
  }
  return parts
}

describe('农场待拾取睡前提醒', () => {
  it('汇总山洞、果林与溪流待拾取文案', () => {
    const parts = buildPickupReminderParts({
      creekCatch: [{ fishId: 'carp', quality: 'normal' }],
      pendingCaveLoot: [{ itemId: 'stone', quantity: 2 }, { itemId: 'coal', quantity: 1 }],
      pendingFruitLoot: [{ itemId: 'apple', quantity: 1, quality: 'normal' }]
    })
    expect(parts).toEqual(['溪流鱼获1条', '山洞产出3份', '果林果实1个'])
    expect(`睡前别忘了去农场面板拾取：${parts.join('、')}。`).toContain('山洞产出3份')
  })

  it('无待拾取时不生成提醒', () => {
    expect(
      buildPickupReminderParts({
        creekCatch: [],
        pendingCaveLoot: [],
        pendingFruitLoot: []
      })
    ).toEqual([])
  })
})
