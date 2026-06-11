import { describe, it, expect } from 'vitest'
import {
  applyNegotiation,
  createQuestFromTemplate,
  isQuestComplete,
  isTemplateAvailable,
  pickQuestTemplate,
  processExpiredQuests,
  reconcileQuestsOnLoad,
  recordTavernDailyRevenue,
  getQuestCooldownDays,
  validateQuestCompletions,
  canSubmitSystemQuest,
  consumeQuestSubmissionMaterials,
  isQuestRequestIntent,
  MAX_ACTIVE_QUESTS,
  type QuestProgressContext
} from './systemQuestEngine'
import { createTestPinia } from '@/test/pinia'
import { useInventoryStore } from '@/stores/useInventoryStore'
import { getTemplateById } from '@/data/systemQuestTemplates'
import type { SystemQuest } from '@/types/system'

const mockProgress = (overrides: Partial<QuestProgressContext> = {}): QuestProgressContext => ({
  tavernLevel: 0,
  farmhouseLevel: 0,
  highestMineFloor: 0,
  greenhouseUnlocked: false,
  caveUnlocked: false,
  warehouseUnlocked: false,
  animalCount: 0,
  fishPondBuilt: false,
  breedingStationCount: 0,
  getSkillLevel: () => 0,
  ...overrides
})

const mockCtx = (overrides: Partial<Parameters<typeof isQuestComplete>[1]> = {}) => ({
  getItemCount: () => 0,
  highestMineFloor: 0,
  getNpcFriendship: () => 0,
  maxNpcFriendship: () => 0,
  getSkillLevel: () => 0,
  tavernReputation: 50,
  ...overrides
})

describe('systemQuestEngine', () => {
  it('creates quest from template with affinity bonus', () => {
    const tpl = getTemplateById('collect_copper_1')!
    const q = createQuestFromTemplate(tpl, 10, 70, () => 'q1')
    expect(q.reward).toBe(2)
    expect(q.deadline).toBeGreaterThan(10 + 3)
    expect(q.accepted).toBe(false)
  })

  it('validates collect quest by inventory count', () => {
    const tpl = getTemplateById('collect_copper_1')!
    const q = createQuestFromTemplate(tpl, 1, 0, () => 'q1')
    q.accepted = true
    expect(isQuestComplete(q, mockCtx({ getItemCount: id => (id === 'copper_ore' ? 5 : 0) }))).toBe(true)
    expect(isQuestComplete(q, mockCtx({ getItemCount: () => 2 }))).toBe(false)
  })

  it('validates mine floor quest', () => {
    const tpl = getTemplateById('mine_floor_20')!
    const q = createQuestFromTemplate(tpl, 1, 0, () => 'q2')
    q.accepted = true
    expect(isQuestComplete(q, mockCtx({ highestMineFloor: 25 }))).toBe(true)
    expect(isQuestComplete(q, mockCtx({ highestMineFloor: 15 }))).toBe(false)
  })

  it('applies negotiation extend deadline', () => {
    const tpl = getTemplateById('collect_copper_1')!
    const q = createQuestFromTemplate(tpl, 5, 0, () => 'q3')
    const before = q.deadline
    const result = applyNegotiation(q, 'extend_deadline', 5, 0)
    expect(result.ok).toBe(true)
    expect(q.deadline).toBe(before + 2)
    expect(q.reward).toBe(1)
  })

  it('processes expired quests with fine', () => {
    const quests: SystemQuest[] = [{
      id: 'x',
      type: 'collect',
      difficulty: 1,
      target: { itemId: 'copper_ore', quantity: 5 },
      deadline: 5,
      reward: 10,
      accepted: true,
      completed: false,
      negotiationRounds: 0,
      title: '测试'
    }]
    const { fines, messages, expiredIds } = processExpiredQuests(quests, 6)
    expect(quests[0]!.expired).toBeFalsy()
    expect(expiredIds).toEqual(['x'])
    expect(fines).toBe(5)
    expect(messages.length).toBe(1)
  })

  it('validateQuestCompletions does not mark completed before store settles merit', () => {
    const tpl = getTemplateById('collect_copper_1')!
    const q = createQuestFromTemplate(tpl, 1, 0, () => 'q-merit')
    q.accepted = true
    const ids = validateQuestCompletions(
      [q],
      mockCtx({ getItemCount: id => (id === 'copper_ore' ? 5 : 0) })
    )
    expect(ids).toEqual(['q-merit'])
    expect(q.completed).toBe(false)
  })

  it('excludes tavern templates when tavern not built', () => {
    const tpl = getTemplateById('tavern_revenue_1')!
    expect(isTemplateAvailable(tpl, mockProgress({ tavernLevel: 0 }))).toBe(false)
    expect(isTemplateAvailable(tpl, mockProgress({ tavernLevel: 1 }))).toBe(true)
    const picked = pickQuestTemplate(10, [], mockProgress({ tavernLevel: 0 }))
    if (picked) {
      expect(picked.type).not.toBe('tavern')
    }
  })

  it('records tavern revenue progress', () => {
    const tpl = getTemplateById('tavern_revenue_1')!
    const q = createQuestFromTemplate(tpl, 1, 0, () => 'q4')
    q.accepted = true
    recordTavernDailyRevenue([q], 600)
    expect(isQuestComplete(q, mockCtx())).toBe(true)
  })

  it('reconciles duplicate active quests on load', () => {
    const tpl = getTemplateById('collect_copper_1')!
    const base = createQuestFromTemplate(tpl, 1, 0, () => 'a')
    const dup = createQuestFromTemplate(tpl, 1, 0, () => 'b')
    const quests = [base, dup]
    const result = reconcileQuestsOnLoad(quests, 2)
    expect(quests.length).toBe(1)
    expect(result.merged).toBe(1)
  })

  it('shorter cooldown for high affinity', () => {
    expect(getQuestCooldownDays(80)).toBe(2)
    expect(getQuestCooldownDays(30)).toBe(3)
  })

  it('max active system quests is 2', () => {
    expect(MAX_ACTIVE_QUESTS).toBe(2)
  })

  it('detects quest request in chat', () => {
    expect(isQuestRequestIntent('给我派个任务')).toBe(true)
    expect(isQuestRequestIntent('青菜怎么种')).toBe(false)
  })

  it('manual submit consumes collect materials', () => {
    createTestPinia()
    const inv = useInventoryStore()
    inv.addItem('copper_ore', 10)
    const tpl = getTemplateById('collect_copper_1')!
    const q = createQuestFromTemplate(tpl, 1, 0, () => 'q-submit')
    q.accepted = true
    const ctx = mockCtx({ getItemCount: id => (id === 'copper_ore' ? 10 : 0) })
    expect(canSubmitSystemQuest(q, ctx)).toBe(true)
    const consumed = consumeQuestSubmissionMaterials(q)
    expect(consumed.ok).toBe(true)
    expect(inv.getItemCount('copper_ore')).toBe(5)
  })
})
