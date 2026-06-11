import type { PersonaId, SystemQuest } from '@/types/system'
import { formatQuestDescription } from './systemQuestEngine'

export type QuestEvaluationOutcome = 'completed' | 'failed'

export interface QuestEvaluationContext {
  currentDay: number
  merit: number
  affinity: number
}

function questSummary(quest: SystemQuest): string {
  return quest.title ?? formatQuestDescription(quest)
}

/** 离线任务评价（在线失败时兜底） */
export function buildOfflineQuestEvaluation(
  quest: SystemQuest,
  outcome: QuestEvaluationOutcome,
  persona: PersonaId,
  ctx: QuestEvaluationContext
): string {
  const title = questSummary(quest)
  const daysUsed =
    quest.acceptedDay != null && quest.endedDay != null
      ? Math.max(1, quest.endedDay - quest.acceptedDay)
      : null
  const limit = quest.deadline - (quest.assignedDay ?? quest.acceptedDay ?? ctx.currentDay)

  if (outcome === 'completed') {
    const lines: Record<PersonaId, string> = {
      qingluan: `「${title}」已圆满达成。宿主在期限内完成目标，功勋 +${quest.reward}，值得肯定。`,
      chaofeng: `行啊，「${title}」搞定了。+${quest.reward} 功勋，别翘尾巴。`,
      taosu: `主人好棒！「${title}」完成啦~ 得到 ${quest.reward} 点功勋！(≧▽≦)`,
      moyan: `任务「${title}」验收通过。功勋 +${quest.reward}。效率记录：合格。`
    }
    let text = lines[persona] ?? lines.qingluan
    if (daysUsed != null && daysUsed <= Math.max(1, Math.floor(limit * 0.5))) {
      text += ' 完成速度较快，可尝试承接更高难度任务。'
    } else if (quest.negotiationRounds >= 2) {
      text += ' 本次议价较多，下次可提前规划资源以保留功勋奖励。'
    }
    return text
  }

  const fine = quest.fine ?? Math.ceil(quest.reward * 0.5)
  const reasonHints: string[] = []
  if (quest.type === 'collect' || quest.type === 'craft' || quest.type === 'fish') {
    reasonHints.push('可能是物品尚未集齐或已出售导致库存不足')
  } else if (quest.type === 'mine') {
    reasonHints.push('可能是矿洞层数未达目标，建议携带补给并规划安全点')
  } else if (quest.type === 'social') {
    reasonHints.push('可能是 NPC 好感未达心数，可每日对话送礼')
  } else if (quest.type === 'skill') {
    reasonHints.push('可能是技能等级不足，多做对应活动积累经验')
  } else if (quest.type === 'tavern') {
    reasonHints.push('可能是酒肆收入/口碑/宴席未达标，检查菜单定价与员工配置')
  }

  const hint = reasonHints[0] ?? '建议复盘目标与当前进度差距'
  const fair =
    quest.difficulty >= 3 && ctx.affinity < 50
      ? '以当前进程，此任务难度偏高，下次可先议价降低目标。'
      : quest.deadline - (quest.assignedDay ?? 0) <= 2
        ? '任务期限偏紧，可考虑首轮议价延长期限。'
        : '任务目标与期限总体合理，主要是执行节奏需加快。'

  const lines: Record<PersonaId, string> = {
    qingluan: `「${title}」未能如期完成，罚金 ${fine} 功勋。${hint}。${fair}`,
    chaofeng: `「${title}」过期了，扣 ${fine} 功勋。${hint}，下次别拖。${fair}`,
    taosu: `呜…「${title}」没来得及做完，扣了 ${fine} 功勋。(｡•́︿•̀｡) ${hint}。${fair}`,
    moyan: `任务「${title}」失败。罚金 ${fine} 功勋。原因分析：${hint}。评估：${fair}`
  }
  return lines[persona] ?? lines.qingluan
}
