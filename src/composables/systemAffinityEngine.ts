import type {
  AffinityBehaviorKey,
  PersonaId,
  SystemAffinityDaily,
  SystemMemoryState
} from '@/types/system'
import { createDefaultAffinityDaily } from '@/types/system'

export interface AffinityGainResult {
  delta: number
  reason?: string
  onceKey?: string
}

const BEHAVIOR_DELTAS: Partial<Record<AffinityBehaviorKey, Partial<Record<PersonaId, number>>>> = {
  drink_tea: { qingluan: 2 },
  brew_osmanthus_wine: { qingluan: 3 },
  gift_tea_liked: { qingluan: 2 },
  gift_rude: { qingluan: -3 },
  late_night: { qingluan: -1 },
  mine_floor_40: { chaofeng: 2 },
  eat_spicy: { chaofeng: 2 },
  stormy_adventure: { chaofeng: 3 },
  rare_drop: { chaofeng: 4 },
  early_retreat: { chaofeng: -2 },
  eat_sweet: { taosu: 2 },
  pet_or_feed_animal: { taosu: 2 },
  spring_harvest: { taosu: 1 },
  mine_injured: { taosu: -2 },
  animal_neglect: { taosu: -3 },
  museum_gem_donate: { moyan: 2 },
  perfect_feast: { moyan: 2 }
}

const ONCE_BEHAVIORS = new Set<AffinityBehaviorKey>(['animal_neglect'])

export function ensureAffinityDaily(state: SystemAffinityDaily, day: number): SystemAffinityDaily {
  if (state.day === day) return state
  return createDefaultAffinityDaily(day)
}

export function onPanelOpenDaily(
  daily: SystemAffinityDaily,
  day: number
): AffinityGainResult | null {
  const d = ensureAffinityDaily(daily, day)
  d.panelOpened = true
  if (d.panelBonusGranted) return null
  d.panelBonusGranted = true
  return { delta: 1, reason: '今日打开了系统面板' }
}

export function onPlayerChatDaily(
  daily: SystemAffinityDaily,
  day: number
): AffinityGainResult | null {
  const d = ensureAffinityDaily(daily, day)
  d.chatCount++
  if (d.chatBonusGranted || d.chatCount < 3) return null
  d.chatBonusGranted = true
  return { delta: 1, reason: '今日与系统对话满 3 句' }
}

export function onAdviceAdoptedDaily(
  daily: SystemAffinityDaily,
  day: number
): AffinityGainResult | null {
  const d = ensureAffinityDaily(daily, day)
  if (d.adviceCount >= 2) return null
  d.adviceCount++
  return { delta: 2, reason: '采纳了系统任务建议' }
}

/** 日结：检查连续未开面板惩罚 */
export function checkPanelAbsencePenalties(
  memory: SystemMemoryState,
  endingDay: number,
  personaId: PersonaId | null
): AffinityGainResult[] {
  const results: AffinityGainResult[] = []
  const openedToday = memory.lastPanelOpenDay >= endingDay

  if (openedToday) {
    memory.daysWithoutPanel = 0
    memory.sevenDayPenaltyFired = false
    return results
  }

  memory.daysWithoutPanel++

  if (memory.daysWithoutPanel === 3) {
    results.push({ delta: -2, reason: '连续 3 天未打开系统面板' })
  }
  if (memory.daysWithoutPanel === 7 && !memory.sevenDayPenaltyFired) {
    memory.sevenDayPenaltyFired = true
    results.push({ delta: -5, reason: '连续 7 天未打开系统面板' })
  }
  if (personaId === 'taosu' && memory.daysWithoutPanel === 5 && !memory.taosuFiveDayPenaltyFired) {
    memory.taosuFiveDayPenaltyFired = true
    results.push({ delta: -5, reason: '桃酥：主人好久都没来看桃酥了……', onceKey: 'taosu_5day_no_panel' })
  }

  return results
}

export function evaluatePersonaBehavior(
  personaId: PersonaId | null,
  behavior: AffinityBehaviorKey,
  memory: SystemMemoryState
): AffinityGainResult | null {
  if (!personaId) return null
  const delta = BEHAVIOR_DELTAS[behavior]?.[personaId]
  if (delta === undefined) return null

  if (ONCE_BEHAVIORS.has(behavior)) {
    const key = `behavior_${behavior}`
    if (memory.onceFlags[key]) return null
    memory.onceFlags[key] = true
  }

  return { delta, reason: behavior }
}

export const TEA_DRINK_IDS = new Set([
  'green_tea_drink',
  'osmanthus_tea',
  'chrysanthemum_tea',
  'ginseng_tea'
])

export const SWEET_RECIPE_IDS = new Set([
  'osmanthus_cake',
  'peach_pancake',
  'jujube_cake',
  'honey_tea',
  'sweet_osmanthus_tea',
  'phoenix_cake',
  'red_date_cake'
])

export const SPICY_RECIPE_IDS = new Set(['spicy_hotpot', 'pickled_chili_fish', 'molten_hotpot'])

export const RUDE_GIFT_IDS = new Set(['stone', 'weed', 'fiber', 'sap', 'clay'])

export const GEM_ITEM_IDS = new Set([
  'jade',
  'prismatic_shard',
  'ruby',
  'emerald',
  'diamond',
  'amethyst',
  'topaz',
  'aquamarine',
  'moonstone'
])

export const RARE_DROP_IDS = new Set(['jade', 'prismatic_shard', 'dragon_scale'])

export function isTeaOrIncenseGift(itemId: string): boolean {
  return (
    TEA_DRINK_IDS.has(itemId) ||
    itemId.includes('tea') ||
    itemId.includes('incense') ||
    itemId === 'osmanthus_wine'
  )
}
