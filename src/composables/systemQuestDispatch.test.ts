import { describe, expect, it } from 'vitest'
import { sanitizeAiQuestPayload } from './systemQuestDispatch'

describe('systemQuestDispatch', () => {
  it('sanitizes valid collect quest', () => {
    const q = sanitizeAiQuestPayload(
      {
        type: 'collect',
        difficulty: 2,
        title: '木炭补给',
        description: '收集 8 个木炭',
        target: { itemId: 'charcoal', quantity: 8 }
      },
      10,
      50
    )
    expect(q).not.toBeNull()
    expect(q!.templateId).toBe('ai_dispatch')
    expect(q!.reward).toBe(5)
    expect(q!.deadline).toBeGreaterThan(10)
  })

  it('rejects invalid item id', () => {
    const q = sanitizeAiQuestPayload(
      {
        type: 'collect',
        difficulty: 1,
        title: '假任务',
        description: '收集不存在物品',
        target: { itemId: 'not_a_real_item', quantity: 1 }
      },
      1,
      0
    )
    expect(q).toBeNull()
  })
})
