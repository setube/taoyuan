import type { PersonaId } from '@/types/system'
import type { SystemMemoryState } from '@/types/system'

export function getGoodnightMessage(
  persona: PersonaId,
  recoveryMode: 'normal' | 'late' | 'passout'
): string {
  const late = recoveryMode !== 'normal'
  const templates: Record<PersonaId, string[]> = {
    qingluan: late
      ? ['夜深了，小友早些歇息。明日田垄仍待耕耘。', '子时已过，灵识亦需安眠。']
      : ['今日辛苦了。愿小友一夜好眠。', '月色正好，明日再见。'],
    chaofeng: late
      ? ['都这个点了还不睡？明天别又起不来。', '啧，又熬夜。赶紧睡。']
      : ['行了，今天到此为止。别给我丢人。', '睡吧，明天继续下矿。'],
    taosu: late
      ? ['主人好晚呀……桃酥会守着主人的~(◕ᴗ◕✿)', '主人要早点睡哦，桃酥会担心的！']
      : ['主人晚安！明天桃酥也要陪主人玩~', '晚安主人！做个甜甜的梦~'],
    moyan: late
      ? ['记录：就寝时间偏晚。建议调整作息。', '数据提示：睡眠不足将影响明日效率。']
      : ['今日记录已归档。晚安。', '建议：就寝。明日继续。']
  }
  const pool = templates[persona] ?? templates.qingluan
  return pool[Math.floor(Math.random() * pool.length)]!
}

export function getAbsenceWelcomeMessage(persona: PersonaId, offlineDays: number): string {
  const strong = offlineDays >= 7
  const messages: Record<PersonaId, { normal: string; strong: string }> = {
    qingluan: {
      normal: '小友许久未见……近来可好？',
      strong: '吾候小友多日。桃源乡一切如常，只盼君归。'
    },
    chaofeng: {
      normal: '哟，你还知道回来？这几天干嘛去了。',
      strong: '失踪这么久？我还以为你死在哪个矿层了——咳，回来就好。'
    },
    taosu: {
      normal: '主人！！桃酥好想你！(≧▽≦)',
      strong: '主人主人主人！！桃酥以为你不要桃酥了……呜呜，你终于回来了！'
    },
    moyan: {
      normal: `记录：离线 ${offlineDays} 天。数据已同步。`,
      strong: `记录：离线 ${offlineDays} 天。异常间隔。建议说明原因。`
    }
  }
  const m = messages[persona] ?? messages.qingluan
  return strong ? m.strong : m.normal
}

export interface ProactiveCareContext {
  stamina: number
  maxStamina: number
  hp: number
  maxHp: number
  animalNeglectStreak: number
  consecutiveMiningDays: number
  season: string
}

export function getProactiveCareMessage(
  persona: PersonaId,
  ctx: ProactiveCareContext
): string | null {
  if (ctx.hp < ctx.maxHp * 0.5) {
    const hurt: Record<PersonaId, string> = {
      qingluan: '伤势未愈，矿洞之行须谨慎。',
      chaofeng: '血条一半都没了，你还敢下矿？',
      taosu: '主人受伤了吗？桃酥好担心……',
      moyan: '生命值偏低。记录：风险上升。'
    }
    return hurt[persona]
  }
  if (ctx.animalNeglectStreak >= 2) {
    const animal: Record<PersonaId, string> = {
      qingluan: '畜舍许久未顾，动物亦需照料。',
      chaofeng: '你家动物快饿扁了，别光顾着下矿。',
      taosu: '小动物们好可怜……主人快去喂它们嘛！',
      moyan: '动物喂食中断。建议今日优先处理畜舍。'
    }
    return animal[persona]
  }
  if (ctx.consecutiveMiningDays >= 3) {
    const mine: Record<PersonaId, string> = {
      qingluan: '连日入矿，亦当回田垄看看。',
      chaofeng: '连挖三天矿……行，够拼。别把自己挖废了。',
      taosu: '主人天天下矿，农场里的作物也想主人呢~',
      moyan: '行为模式：连续采矿。建议轮换农耕任务。'
    }
    return mine[persona]
  }
  return null
}

export function shouldShowMilestoneRecall(memory: SystemMemoryState, day: number): boolean {
  return day > 14 && (memory.firstCrop || memory.firstFish) && Math.random() < 0.12
}
