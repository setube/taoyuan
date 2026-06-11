import { ACTION_TIME_COSTS } from '@/data/timeConstants'
import { getForgingPerkBonuses } from '@/composables/forgingPerks'

/** 单次亲手打造 / 练习 / 工具升级基础体力 */
export const FORGE_STAMINA_BASE = 20

/** 专精减免后时间下限（游戏小时） */
export const FORGE_TIME_MIN_HOURS = 1

export function getForgeStaminaCost(forgingLevel: number): number {
  const perks = getForgingPerkBonuses()
  const levelRed = Math.min(0.5, forgingLevel * 0.01)
  const cost = FORGE_STAMINA_BASE * (1 - levelRed) * (1 - perks.forgeStaminaReduction)
  return Math.max(1, Math.floor(cost))
}

export function getForgeTimeHours(_forgingLevel?: number): number {
  void _forgingLevel
  const perks = getForgingPerkBonuses()
  const hours = ACTION_TIME_COSTS.forge - perks.forgeTimeReductionHours
  return Math.max(FORGE_TIME_MIN_HOURS, hours)
}

/** 工具升级与打造共用体力/时间（§5 v1） */
export const getForgeToolUpgradeStamina = getForgeStaminaCost
export const getForgeToolUpgradeTimeHours = getForgeTimeHours
