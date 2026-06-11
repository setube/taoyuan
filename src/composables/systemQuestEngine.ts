import type { PersonaId, QuestNegotiationType, SystemQuest } from '@/types/system'
import {
  QUEST_TEMPLATES,
  type QuestTemplate,
  getQuestBaseReward,
  getQuestDeadlineDays,
  getTemplateById
} from '@/data/systemQuestTemplates'

/** 玩家进程上下文，用于过滤暂不可做的任务模板 */
export interface QuestProgressContext {
  tavernLevel: number
  farmhouseLevel: number
  highestMineFloor: number
  greenhouseUnlocked: boolean
  caveUnlocked: boolean
  warehouseUnlocked: boolean
  animalCount: number
  fishPondBuilt: boolean
  breedingStationCount: number
  getSkillLevel: (skillType: string) => number
}
import { getItemById } from '@/data/items'
import { getNpcById } from '@/data/npcs'
import { FISH } from '@/data/fish'
import { removeCombinedItem } from '@/composables/useCombinedInventory'

const HEART_POINTS = 250
const MAX_SKILL_LEVEL = 10
const MAX_ACTIVE_QUESTS = 2

export interface QuestValidationContext {
  getItemCount: (itemId: string) => number
  highestMineFloor: number
  getNpcFriendship: (npcId: string) => number
  maxNpcFriendship: () => number
  getSkillLevel: (skillType: string) => number
  tavernReputation: number
}

function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function isTemplateAvailable(template: QuestTemplate, progress: QuestProgressContext): boolean {
  if (template.type === 'tavern' && progress.tavernLevel < 1) return false
  const req = template.requires
  if (!req) return true
  if (req.minTavernLevel != null && progress.tavernLevel < req.minTavernLevel) return false
  if (req.minFarmhouseLevel != null && progress.farmhouseLevel < req.minFarmhouseLevel) return false
  if (req.minMineFloor != null && progress.highestMineFloor < req.minMineFloor) return false
  if (req.warehouseUnlocked && !progress.warehouseUnlocked) return false
  if (req.minAnimalCount != null && progress.animalCount < req.minAnimalCount) return false
  if (req.fishPondBuilt && !progress.fishPondBuilt) return false
  if (req.minBreedingStations != null && progress.breedingStationCount < req.minBreedingStations) return false
  if (req.minSkillLevel) {
    const lv = progress.getSkillLevel(req.minSkillLevel.skillType)
    if (lv < req.minSkillLevel.level) return false
  }
  return true
}

function isQuestAvailableForProgress(quest: SystemQuest, progress: QuestProgressContext): boolean {
  if (!quest.templateId) return true
  const tpl = getTemplateById(quest.templateId)
  if (!tpl) return true
  return isTemplateAvailable(tpl, progress)
}

/** 当季可用模板（主池约 2/3 + 备用池轮换补充） */
export function getActiveTemplates(currentDay: number, progress?: QuestProgressContext): QuestTemplate[] {
  const seasonIndex = Math.floor((currentDay - 1) / 28)
  const main = QUEST_TEMPLATES.filter(t => !t.reserve)
  const reserve = QUEST_TEMPLATES.filter(t => t.reserve)

  const activeMain = main.filter(t => hashStr(`${t.id}:${seasonIndex}`) % 3 !== 0)
  const reserveCount = Math.max(0, main.length - activeMain.length)
  const activeReserve = reserve
    .filter(t => hashStr(`${t.id}:${seasonIndex}`) % 2 === 0)
    .slice(0, reserveCount)

  const pool = [...activeMain, ...activeReserve]
  if (!progress) return pool
  return pool.filter(t => isTemplateAvailable(t, progress))
}

export function countActiveQuests(quests: SystemQuest[]): number {
  return quests.filter(q => !q.completed && !q.expired).length
}

export function formatQuestDescription(quest: SystemQuest): string {
  const t = quest.target
  return (quest.description ?? quest.title ?? quest.type)
    .replace('{qty}', String(t.quantity ?? t.threshold ?? 1))
    .replace('{floor}', String(t.floor ?? 0))
    .replace('{hearts}', String(t.hearts ?? 0))
    .replace('{level}', String(t.skillLevel ?? 0))
    .replace('{threshold}', String(t.threshold ?? 0))
}

export function describeQuestFromTemplate(template: QuestTemplate): string {
  const t = template.target
  return template.description
    .replace('{qty}', String(t.quantity ?? t.threshold ?? 1))
    .replace('{floor}', String(t.floor ?? 0))
    .replace('{hearts}', String(t.hearts ?? 0))
    .replace('{level}', String(t.skillLevel ?? 0))
    .replace('{threshold}', String(t.threshold ?? 0))
}

function cloneTarget(target: QuestTemplate['target']): SystemQuest['target'] {
  return { ...target }
}

function applyAffinityBonus(
  quest: Pick<SystemQuest, 'target' | 'deadline'>,
  affinity: number,
  assignedDay: number
): void {
  if (affinity >= 70) {
    quest.deadline += 2
  } else if (affinity >= 50) {
    quest.deadline += 1
  }
  if (affinity >= 50) {
    const t = quest.target
    if (t.quantity != null) t.quantity = Math.max(1, Math.ceil(t.quantity * 0.9))
    if (t.floor != null) t.floor = Math.max(1, Math.ceil(t.floor * 0.95))
    if (t.threshold != null && t.metric !== 'reputation') {
      t.threshold = Math.max(1, Math.ceil(t.threshold * 0.9))
    }
    if (t.skillLevel != null) t.skillLevel = Math.max(1, t.skillLevel - 1)
  }
  // 确保 deadline 不早于分配日
  if (quest.deadline < assignedDay + 1) {
    quest.deadline = assignedDay + 1
  }
}

export function createQuestFromTemplate(
  template: QuestTemplate,
  currentDay: number,
  affinity: number,
  idFactory: () => string
): SystemQuest {
  const assignedDay = currentDay
  const deadline = assignedDay + getQuestDeadlineDays(template.difficulty)
  const target = cloneTarget(template.target)
  const quest: SystemQuest = {
    id: idFactory(),
    type: template.type,
    difficulty: template.difficulty,
    templateId: template.id,
    title: template.title,
    description: describeQuestFromTemplate(template),
    target,
    assignedDay,
    deadline,
    reward: getQuestBaseReward(template.difficulty),
    accepted: false,
    completed: false,
    negotiationRounds: 0,
    progress: 0
  }
  applyAffinityBonus(quest, affinity, assignedDay)
  return quest
}

export function pickQuestTemplate(
  currentDay: number,
  existingQuests: SystemQuest[],
  progress?: QuestProgressContext
): QuestTemplate | null {
  const activeIds = new Set(
    existingQuests.filter(q => !q.completed && !q.expired).map(q => q.templateId).filter(Boolean)
  )
  const pool = getActiveTemplates(currentDay, progress).filter(t => !activeIds.has(t.id))
  if (pool.length === 0) return null
  return pool[Math.floor(Math.random() * pool.length)] ?? null
}

export function getQuestCooldownDays(affinity: number): number {
  return affinity >= 70 ? 2 : 3
}

export function isQuestComplete(quest: SystemQuest, ctx: QuestValidationContext): boolean {
  if (quest.completed || quest.expired || !quest.accepted) return false
  const t = quest.target

  switch (quest.type) {
    case 'collect':
    case 'craft':
      return t.itemId != null && t.quantity != null && ctx.getItemCount(t.itemId) >= t.quantity
    case 'fish':
      return t.fishId != null && t.quantity != null && ctx.getItemCount(t.fishId) >= t.quantity
    case 'mine':
      return t.floor != null && ctx.highestMineFloor >= t.floor
    case 'social': {
      const need = (t.hearts ?? 0) * HEART_POINTS
      if (t.npcId) return ctx.getNpcFriendship(t.npcId) >= need
      return ctx.maxNpcFriendship() >= need
    }
    case 'skill': {
      const need = Math.min(t.skillLevel ?? 0, MAX_SKILL_LEVEL)
      if (t.skillType === 'any') {
        const types = ['farming', 'fishing', 'mining', 'cooking', 'combat', 'foraging']
        return types.some(st => ctx.getSkillLevel(st) >= need)
      }
      return ctx.getSkillLevel(t.skillType ?? 'farming') >= need
    }
    case 'tavern': {
      if (t.metric === 'revenue') {
        return (quest.progress ?? 0) >= (t.threshold ?? 0)
      }
      if (t.metric === 'reputation') {
        return ctx.tavernReputation >= (t.threshold ?? 0)
      }
      if (t.metric === 'feast') {
        return (quest.progress ?? 0) >= (t.threshold ?? 1)
      }
      return false
    }
    default:
      return false
  }
}

export function applyNegotiation(
  quest: SystemQuest,
  kind: QuestNegotiationType,
  currentDay: number,
  affinity: number,
  progress?: QuestProgressContext
): { ok: boolean; message: string; newQuest?: SystemQuest } {
  if (quest.completed || quest.expired || quest.accepted) {
    return { ok: false, message: '该任务已无法议价。' }
  }
  if (quest.negotiationRounds >= 3) {
    return { ok: false, message: '议价次数已用尽，请接受当前方案。' }
  }

  if (kind === 'swap_type') {
    if (quest.swappedType || quest.negotiationRounds > 0) {
      return { ok: false, message: '更换类型仅限首轮议价。' }
    }
    const pool = getActiveTemplates(currentDay, progress).filter(
      t => t.difficulty === quest.difficulty && t.type !== quest.type
    )
    if (pool.length === 0) {
      return { ok: false, message: '暂无同难度可替换任务。' }
    }
    const picked = pool[Math.floor(Math.random() * pool.length)]!
    const replacement = createQuestFromTemplate(picked, quest.assignedDay ?? currentDay, affinity, () => quest.id)
    replacement.negotiationRounds = quest.negotiationRounds + 1
    replacement.swappedType = true
    replacement.reward = Math.max(1, quest.reward - 1)
    return { ok: true, message: getNegotiationReply(kind), newQuest: replacement }
  }

  if (kind === 'extend_deadline') {
    quest.deadline += 2
    quest.reward = Math.max(1, quest.reward - 1)
  } else if (kind === 'reduce_target') {
    const t = quest.target
    if (t.quantity != null) t.quantity = Math.max(1, Math.ceil(t.quantity * 0.8))
    if (t.floor != null) t.floor = Math.max(1, Math.ceil(t.floor * 0.8))
    if (t.threshold != null) t.threshold = Math.max(1, Math.ceil(t.threshold * 0.8))
    if (t.hearts != null) t.hearts = Math.max(1, Math.ceil(t.hearts * 0.8))
    if (t.skillLevel != null) t.skillLevel = Math.max(1, Math.ceil(t.skillLevel * 0.8))
    quest.reward = Math.max(1, quest.reward - 2)
    quest.description = formatQuestDescription(quest)
  }

  quest.negotiationRounds++
  const forced = quest.negotiationRounds >= 3
  return {
    ok: true,
    message: forced ? '最终方案已确定，请接受任务。' : getNegotiationReply(kind)
  }
}

function getNegotiationReply(kind: QuestNegotiationType): string {
  const map: Record<QuestNegotiationType, string> = {
    extend_deadline: '期限已延长 2 天，功勋略减。',
    reduce_target: '目标已下调，功勋相应减少。',
    swap_type: '已更换为同难度新任务。'
  }
  return map[kind]
}

export function getNegotiationPersonaLine(persona: PersonaId, rounds: number): string {
  if (rounds >= 3) {
    const final: Record<PersonaId, string> = {
      qingluan: '此事不宜再议。宿主请接受最终方案。',
      chaofeng: '啧，都让了两步了还讨？行行行——最后方案，成交不？',
      taosu: '呜……桃酥已经偷偷多给主人一天了，不能再多了……(｡•́︿•̀｡)',
      moyan: '第三轮协商结束。让步上限已达。建议接受当前方案。'
    }
    return final[persona]
  }
  const lines: Record<PersonaId, string[]> = {
    qingluan: ['可宽限数日，然功勋不可全保。', '目标略减，望宿主体谅。'],
    chaofeng: ['行吧行吧，再让一步，别得寸进尺。', '啧，换就换，功勋扣一点。'],
    taosu: ['桃酥帮主人求情啦~ 但功勋会少一点点哦 (◕ᴗ◕✿)'],
    moyan: ['协商记录已更新。参数已调整。', '更换任务类型。功勋 −1。']
  }
  const pool = lines[persona] ?? lines.qingluan
  return pool[Math.min(rounds, pool.length - 1)]!
}

export function getQuestAnnouncement(quest: SystemQuest, persona: PersonaId): string {
  const desc = formatQuestDescription(quest)
  const daysLeft = quest.deadline - (quest.assignedDay ?? 0)
  const lines: Record<PersonaId, string> = {
    qingluan: `新任务：${quest.title ?? desc}。期限约 ${daysLeft} 日，功勋 ${quest.reward} 点。宿主可议价后接受。`,
    chaofeng: `喂，新任务——${quest.title ?? desc}。${daysLeft} 天内搞定，功勋 ${quest.reward}。别跟我说做不到。`,
    taosu: `主人主人！新任务来啦~「${quest.title ?? desc}」，做完给 ${quest.reward} 点功勋哦 (◕ᴗ◕✿)`,
    moyan: `任务：${quest.title ?? desc}。期限：第 ${quest.deadline} 日。功勋：${quest.reward}。状态：待接受。`
  }
  return lines[persona]
}

export function getExpireMessage(quest: SystemQuest, fine: number): string {
  return `任务「${quest.title ?? quest.type}」已过期，扣除 ${fine} 功勋罚金。`
}

export function processExpiredQuests(
  quests: SystemQuest[],
  currentDay: number
): { fines: number; messages: string[]; expiredIds: string[] } {
  let fines = 0
  const messages: string[] = []
  const expiredIds: string[] = []
  for (const q of quests) {
    if (q.completed || q.expired || !q.accepted) continue
    if (currentDay > q.deadline) {
      const fine = Math.ceil(q.reward * 0.5)
      fines += fine
      expiredIds.push(q.id)
      messages.push(getExpireMessage(q, fine))
    }
  }
  return { fines, messages, expiredIds }
}

function questSignature(q: SystemQuest): string {
  const t = q.target
  return `${q.type}:${q.templateId ?? ''}:${t.itemId ?? ''}:${t.floor ?? ''}:${t.npcId ?? ''}:${t.hearts ?? ''}:${t.skillType ?? ''}:${t.fishId ?? ''}:${t.metric ?? ''}`
}

function isQuestTargetValid(q: SystemQuest): boolean {
  const t = q.target
  if (q.type === 'collect' || q.type === 'craft') {
    return t.itemId != null && !!getItemById(t.itemId)
  }
  if (q.type === 'fish') {
    return t.fishId != null && FISH.some(f => f.id === t.fishId)
  }
  if (q.type === 'social' && t.npcId) {
    return !!getNpcById(t.npcId)
  }
  if (q.type === 'skill' && t.skillLevel != null) {
    if (t.skillLevel > MAX_SKILL_LEVEL) {
      t.skillLevel = MAX_SKILL_LEVEL
    }
  }
  return true
}

export function reconcileQuestsOnLoad(
  quests: SystemQuest[],
  currentDay: number,
  progress?: QuestProgressContext
): { removed: number; merged: number; capped: number; expired: { fines: number; messages: string[] } } {
  let removed = 0
  let merged = 0
  let capped = 0

  // 移除无效目标或进程不再满足的任务
  for (let i = quests.length - 1; i >= 0; i--) {
    const q = quests[i]!
    if (q.completed || q.expired) continue
    if (!isQuestTargetValid(q)) {
      quests.splice(i, 1)
      removed++
      continue
    }
    if (progress && !q.accepted && !isQuestAvailableForProgress(q, progress)) {
      quests.splice(i, 1)
      removed++
    }
  }

  // 去重
  const seen = new Set<string>()
  for (let i = quests.length - 1; i >= 0; i--) {
    const q = quests[i]!
    if (q.completed || q.expired) continue
    const sig = questSignature(q)
    if (seen.has(sig)) {
      quests.splice(i, 1)
      merged++
    } else {
      seen.add(sig)
    }
  }

  // 超 3 条活跃任务
  const active = quests.filter(q => !q.completed && !q.expired)
  if (active.length > MAX_ACTIVE_QUESTS) {
    const sorted = [...active].sort((a, b) => (b.assignedDay ?? 0) - (a.assignedDay ?? 0))
    const keep = new Set(sorted.slice(0, MAX_ACTIVE_QUESTS).map(q => q.id))
    for (const q of quests) {
      if (!q.completed && !q.expired && !keep.has(q.id)) {
        q.expired = true
        capped++
      }
    }
  }

  const expired = processExpiredQuests(quests, currentDay)
  return { removed, merged, capped, expired }
}

export function validateQuestCompletions(
  quests: SystemQuest[],
  ctx: QuestValidationContext
): string[] {
  const completedIds: string[] = []
  for (const q of quests) {
    if (isQuestComplete(q, ctx)) {
      completedIds.push(q.id)
    }
  }
  return completedIds
}

export function recordTavernDailyRevenue(quests: SystemQuest[], revenue: number): void {
  if (revenue <= 0) return
  for (const q of quests) {
    if (q.completed || q.expired || !q.accepted) continue
    if (q.type === 'tavern' && q.target.metric === 'revenue') {
      q.progress = Math.max(q.progress ?? 0, revenue)
    }
  }
}

export function recordFeastCompleted(quests: SystemQuest[]): void {
  for (const q of quests) {
    if (q.completed || q.expired || !q.accepted) continue
    if (q.type === 'tavern' && q.target.metric === 'feast') {
      q.progress = (q.progress ?? 0) + 1
    }
  }
}

/** 是否已达提交条件（不自动结算，需玩家主动提交） */
export function canSubmitSystemQuest(quest: SystemQuest, ctx: QuestValidationContext): boolean {
  if (!quest.accepted || quest.completed || quest.expired) return false
  return isQuestComplete(quest, ctx)
}

export function getQuestProgressHint(quest: SystemQuest, ctx: QuestValidationContext): string {
  if (!quest.accepted || quest.completed || quest.expired) return ''
  const t = quest.target
  switch (quest.type) {
    case 'collect':
    case 'craft': {
      const need = t.quantity ?? 0
      const have = ctx.getItemCount(t.itemId ?? '')
      return `材料 ${have}/${need}`
    }
    case 'fish': {
      const need = t.quantity ?? 0
      const have = ctx.getItemCount(t.fishId ?? '')
      return `鱼获 ${have}/${need}`
    }
    case 'mine':
      return `矿层 ${ctx.highestMineFloor}/${t.floor ?? 0}`
    case 'social': {
      const need = (t.hearts ?? 0) * HEART_POINTS
      const have = t.npcId ? ctx.getNpcFriendship(t.npcId) : ctx.maxNpcFriendship()
      return `好感 ${have}/${need}`
    }
    case 'skill': {
      const need = t.skillLevel ?? 0
      if (t.skillType === 'any') {
        const types = ['farming', 'fishing', 'mining', 'cooking', 'combat', 'foraging']
        const maxLv = Math.max(...types.map(st => ctx.getSkillLevel(st)))
        return `技能 ${maxLv}/${need}`
      }
      return `${t.skillType} Lv${ctx.getSkillLevel(t.skillType ?? 'farming')}/${need}`
    }
    case 'tavern': {
      if (t.metric === 'revenue') return `日收入 ${quest.progress ?? 0}/${t.threshold ?? 0}`
      if (t.metric === 'feast') return `宴席 ${quest.progress ?? 0}/${t.threshold ?? 1}`
      return `声望 ${ctx.tavernReputation}/${t.threshold ?? 0}`
    }
    default:
      return ''
  }
}

/** 提交时扣除 collect/craft/fish 类任务材料 */
export function consumeQuestSubmissionMaterials(
  quest: SystemQuest
): { ok: boolean; reason?: 'materials' | 'invalid' } {
  const t = quest.target
  switch (quest.type) {
    case 'collect':
    case 'craft':
      if (!t.itemId || !t.quantity) return { ok: false, reason: 'invalid' }
      if (!removeCombinedItem(t.itemId, t.quantity)) return { ok: false, reason: 'materials' }
      return { ok: true }
    case 'fish':
      if (!t.fishId || !t.quantity) return { ok: false, reason: 'invalid' }
      if (!removeCombinedItem(t.fishId, t.quantity)) return { ok: false, reason: 'materials' }
      return { ok: true }
    default:
      return { ok: true }
  }
}

const QUEST_REQUEST_RE = /要.{0,8}任务|给.{0,8}任务|派.{0,8}任务|接.{0,8}任务|来个任务|有没有任务|分配任务|系统任务|请求任务|领取任务|做任务|执行任务/

/** 玩家在对话中索要系统任务（应引导至任务页按钮） */
export function isQuestRequestIntent(input: string): boolean {
  const t = input.trim()
  if (t.length < 3) return false
  return QUEST_REQUEST_RE.test(t)
}

export function getQuestRequestRedirectReply(personaId: PersonaId | null): string {
  const lines: Record<PersonaId, string> = {
    qingluan: '青鸾：任务须在本面板「任务」页点击「请求新任务」领取，对话中无法派发哦。',
    chaofeng: '嘲风：啧，想接活自己去「任务」页点「请求新任务」，别在聊天里使唤我。',
    taosu: '桃酥：呜……任务要去上面「任务」标签点「请求新任务」才行啦 (｡•́︿•̀｡)',
    moyan: '墨言：记录——系统任务仅可通过「任务」页「请求新任务」按钮获取，对话渠道不受理。'
  }
  return personaId ? lines[personaId] : '系统任务请打开「任务」页，点击「请求新任务」按钮领取。'
}

export { MAX_ACTIVE_QUESTS, getTemplateById }
