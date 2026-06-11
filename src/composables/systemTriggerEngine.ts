import type { PersonaId, SystemMemoryState, SystemTriggerType } from '@/types/system'
import { SEASON_NAMES } from '@/stores/useGameStore'
import type { Season } from '@/types'
import { getNpcById } from '@/data/npcs'
const SKILL_NAMES: Record<string, string> = {
  farming: '农耕',
  mining: '挖矿',
  fishing: '钓鱼',
  foraging: '采集',
  combat: '战斗',
  cooking: '烹饪'
}

/** 15 分钟游戏时间 ≈ 0.25 小时 */
export const TRIGGER_COOLDOWN_HOURS = 0.25
export const MAX_PROACTIVE_TRIGGERS_PER_DAY = 10

export interface TriggerPayload {
  season?: Season
  oldSeason?: Season
  festivalName?: string
  skillType?: string
  skillLevel?: number
  floor?: number
  npcId?: string
  npcName?: string
  hearts?: number
  itemName?: string
  weather?: string
  weatherName?: string
}

export function toGameHours(day: number, hour: number): number {
  return (day - 1) * 24 + hour
}

export function canFireTrigger(
  memory: SystemMemoryState,
  type: SystemTriggerType,
  day: number,
  hour: number,
  mode: 'offline' | 'online'
): boolean {
  if (memory.proactiveTriggerDay !== day) {
    memory.proactiveTriggerDay = day
    memory.proactiveTriggerCount = 0
  }
  if (memory.proactiveTriggerCount >= MAX_PROACTIVE_TRIGGERS_PER_DAY) return false

  const now = toGameHours(day, hour)
  const last = memory.triggerLastAt[type]
  if (last !== undefined && now - last < TRIGGER_COOLDOWN_HOURS) return false

  if (mode === 'offline' && Math.random() > 0.5) return false

  return true
}

/** 供 LLM 理解的事件摘要（中英键名无关） */
export function buildTriggerEventSummary(type: SystemTriggerType, payload: TriggerPayload): string {
  const season = payload.season ? SEASON_NAMES[payload.season] : ''
  const oldSeason = payload.oldSeason ? SEASON_NAMES[payload.oldSeason] : ''
  const npcName = payload.npcName ?? (payload.npcId ? getNpcById(payload.npcId)?.name : '') ?? 'NPC'
  const skillLabel = payload.skillType ? (SKILL_NAMES[payload.skillType] ?? payload.skillType) : '技能'
  switch (type) {
    case 'season_change':
      return `季节更替：${oldSeason} → ${season}`
    case 'festival':
      return `节日：${payload.festivalName ?? '今日节庆'}`
    case 'stamina_low':
      return '玩家体力低于 30%'
    case 'stamina_empty':
      return '玩家体力即将耗尽（≤5）'
    case 'skill_level_up':
      return `${skillLabel}升至 Lv${payload.skillLevel ?? 0}`
    case 'processing_done':
      return `加工完成：${payload.itemName ?? '产物'}`
    case 'mine_new_floor':
      return `进入矿洞第 ${payload.floor ?? 0} 层`
    case 'mine_boss_near':
      return `矿洞第 ${payload.floor ?? 0} 层为 BOSS 层`
    case 'safe_point':
      return `矿洞第 ${payload.floor ?? 0} 层解锁安全点`
    case 'npc_heart_up':
      return `与 ${npcName} 好感升至 ${payload.hearts ?? 0} 心`
    case 'npc_birthday':
      return `${npcName} 今天是生日`
    case 'inventory_full':
      return '背包使用率 ≥80%'
    case 'weather_special':
      return `特殊天气：${payload.weatherName ?? payload.weather ?? '异常天象'}`
    default:
      return type
  }
}

export function markTriggerFired(memory: SystemMemoryState, type: SystemTriggerType, day: number, hour: number): void {
  memory.triggerLastAt[type] = toGameHours(day, hour)
  if (memory.proactiveTriggerDay !== day) {
    memory.proactiveTriggerDay = day
    memory.proactiveTriggerCount = 0
  }
  memory.proactiveTriggerCount++
}

export function buildTriggerMessage(
  persona: PersonaId,
  type: SystemTriggerType,
  payload: TriggerPayload
): string {
  const season = payload.season ? SEASON_NAMES[payload.season] : ''
  const oldSeason = payload.oldSeason ? SEASON_NAMES[payload.oldSeason] : ''
  const npcName = payload.npcName ?? (payload.npcId ? getNpcById(payload.npcId)?.name : '') ?? '某人'
  const skillLabel = payload.skillType ? (SKILL_NAMES[payload.skillType] ?? payload.skillType) : '技能'
  const floor = payload.floor ?? 0
  const hearts = payload.hearts ?? 0
  const weatherName = payload.weatherName ?? payload.weather ?? '特殊天气'

  const templates: Record<SystemTriggerType, Record<PersonaId, string>> = {
    season_change: {
      qingluan: `${oldSeason}已尽，${season}将至。田垄间物候已变，小友宜早作打算。`,
      chaofeng: `换季了，${oldSeason}→${season}。别种错作物，丢人。`,
      taosu: `${season}来啦！主人要和桃酥一起种新作物吗~(◕ᴗ◕✿)`,
      moyan: `记录：季节 ${oldSeason}→${season}。建议更新种植计划。`
    },
    festival: {
      qingluan: `今日${payload.festivalName ?? '佳节'}，桃源乡亦有喜气。小友可去集市看看。`,
      chaofeng: `${payload.festivalName ?? '节日'}？有空逛逛，别整天窝在矿洞里。`,
      taosu: `今天是${payload.festivalName ?? '节日'}！主人我们去玩吧~`,
      moyan: `日历：${payload.festivalName ?? '节日'}。活动数据已标记。`
    },
    stamina_low: {
      qingluan: '体力将尽，小友宜进食或歇息片刻。',
      chaofeng: '体力见底了？吃点东西再继续，别硬撑。',
      taosu: '主人好累……桃酥心疼主人，休息一下吧~',
      moyan: '体力低于 30%。建议立即补充。'
    },
    stamina_empty: {
      qingluan: '灵息将竭，再勉强恐伤身。',
      chaofeng: '喂，你快没体力了！再动就要晕倒了。',
      taosu: '主人快没力气了！桃酥好担心……',
      moyan: '警告：体力 ≤5。昏倒风险极高。'
    },
    skill_level_up: {
      qingluan: `${skillLabel}精进至 Lv${payload.skillLevel ?? 0}，可喜可贺。`,
      chaofeng: `${skillLabel}升到 ${payload.skillLevel ?? 0} 了？还行，继续练。`,
      taosu: `主人好厉害！${skillLabel}升级啦 (≧▽≦)`,
      moyan: `记录：${skillLabel} Lv${payload.skillLevel ?? 0}。效率曲线上升。`
    },
    processing_done: {
      qingluan: `加工完成${payload.itemName ? `：${payload.itemName}` : ''}，可取用了。`,
      chaofeng: `机器好了，${payload.itemName ?? '产物'}收一下。`,
      taosu: `做好啦做好啦！${payload.itemName ?? '加工品'}完成咯~`,
      moyan: `加工队列完成。${payload.itemName ? `产出：${payload.itemName}` : ''}`
    },
    mine_new_floor: {
      qingluan: `矿洞第 ${floor} 层，灵气愈深，须谨慎前行。`,
      chaofeng: `第 ${floor} 层了？不错，继续往下挖。`,
      taosu: `主人下到第 ${floor} 层了……桃酥会担心主人的。`,
      moyan: `矿洞深度：${floor} 层。记录更新。`
    },
    mine_boss_near: {
      qingluan: '前方魔气凝聚，恐有强敌。小友可备药备粮。',
      chaofeng: 'BOSS 层到了。别怂，打赢它。',
      taosu: '前面好可怕……主人一定要小心呀！',
      moyan: '检测到 BOSS 层。建议：满状态进入。'
    },
    safe_point: {
      qingluan: `第 ${floor} 层已成安全点，日后可从此处再入。`,
      chaofeng: `安全点解锁，${floor} 层。以后省点力气。`,
      taosu: `主人找到安全点啦！以后就不用从第一层爬了~`,
      moyan: `安全点：第 ${floor} 层。撤退路径已记录。`
    },
    npc_heart_up: {
      qingluan: `与${npcName}情谊更深，已达 ${hearts} 心。`,
      chaofeng: `${npcName}对你 ${hearts} 心了？社交还行嘛。`,
      taosu: `${npcName}更喜欢主人了！${hearts} 心啦~`,
      moyan: `NPC 关系：${npcName}，${hearts} 心。`
    },
    npc_birthday: {
      qingluan: `今日是${npcName}生辰，备礼前往或可增进情谊。`,
      chaofeng: `${npcName}过生日，送个礼呗，别空手去。`,
      taosu: `今天是${npcName}的生日！主人快去祝福吧~`,
      moyan: `提醒：${npcName} 生日。礼物加成 ×4。`
    },
    inventory_full: {
      qingluan: '行囊将满，小友可设「收贮归置」，令收成直入出货箱或仓房，亦或整理行囊。',
      chaofeng: '包快满了。去设「收贮归置」，该卖的进出货箱，该囤的进仓库，别傻扛着。',
      taosu: '主人背包要装不下啦~可以在「收贮归置」里设置，收获直接进出货箱或仓库哦~',
      moyan: '背包使用率 ≥80%。建议：开启「收贮归置」自动分流，或整理/扩容。'
    },
    weather_special: {
      qingluan: `今日${weatherName}，出行与农事须留意天象。`,
      chaofeng: `${weatherName}？该下矿下矿，该钓鱼钓鱼，别磨蹭。`,
      taosu: `今天${weatherName}呢，主人要注意安全哦~`,
      moyan: `天气：${weatherName}。活动建议已更新。`
    }
  }

  return templates[type]?.[persona] ?? templates[type]?.qingluan ?? '（系统注意到了什么……）'
}

export type StaminaAlertBand = 'ok' | 'low' | 'empty'

export function getStaminaAlertBand(stamina: number, maxStamina: number): StaminaAlertBand {
  if (maxStamina <= 0) return 'ok'
  if (stamina <= 5) return 'empty'
  if (stamina < maxStamina * 0.3) return 'low'
  return 'ok'
}

/** 体力跌入警戒区时只触发一次提醒，恢复至 ≥30% 后闩锁重置 */
export function evaluateStaminaAlert(
  prevBand: StaminaAlertBand | undefined,
  stamina: number,
  maxStamina: number
): { band: StaminaAlertBand; fire: 'stamina_low' | 'stamina_empty' | null } {
  const band = getStaminaAlertBand(stamina, maxStamina)
  const prev = prevBand ?? 'ok'
  if (band === 'ok') return { band: 'ok', fire: null }
  if (prev !== 'ok') {
    const latched = band === 'empty' || prev === 'empty' ? 'empty' : 'low'
    return { band: latched, fire: null }
  }
  return { band, fire: band === 'empty' ? 'stamina_empty' : 'stamina_low' }
}
