import { useSystemStore } from '@/stores/useSystemStore'
import { getMeritEffectBonus } from '@/composables/meritShopEngine'

export type MeritStaminaActivity = 'farming' | 'foraging' | 'mining' | 'fishing' | 'general'

/** 读取当前存档功勋 buff 加成（各 gameplay store 调用） */
export function getMeritBonus(effectType: string): number {
  const buffs = useSystemStore().activeBuffs
  return getMeritEffectBonus(effectType, buffs)
}

/** 农耕/采集体力消耗功勋减免 */
export function adjustStaminaCostForMerit(amount: number, activity?: MeritStaminaActivity): number {
  if (activity !== 'farming' && activity !== 'foraging') return amount
  const reduction = getMeritBonus('stamina_cost_reduction')
  if (reduction <= 0) return amount
  return Math.max(1, Math.floor(amount * (1 - reduction)))
}

/** 矿洞受伤功勋减免 */
export function adjustMineDamageForMerit(amount: number): number {
  const reduction = getMeritBonus('mine_damage_reduction')
  if (reduction <= 0) return amount
  return Math.max(1, Math.floor(amount * (1 - reduction)))
}

/** 作物收获量 +N%（概率额外 +1） */
export function applyMeritCropYieldBonus(quantity: number): number {
  const bonus = getMeritBonus('crop_yield')
  if (bonus > 0 && Math.random() < bonus) {
    return quantity + Math.max(1, Math.round(quantity * bonus))
  }
  return quantity
}

/** 矿石掉落功勋加成 */
export function applyMeritOreDropBonus(quantity: number): number {
  const bonus = getMeritBonus('ore_drop')
  if (bonus > 0 && Math.random() < bonus) {
    return quantity + Math.max(1, Math.ceil(quantity * bonus))
  }
  return quantity
}

/** 酒肆额外来客（平加） */
export function getMeritTavernGuestBonus(): number {
  return Math.floor(getMeritBonus('tavern_guests'))
}

/** 动物产出频率（缩短产出间隔比例） */
export function adjustAnimalProduceDays(days: number): number {
  const freq = getMeritBonus('livestock_freq')
  if (freq <= 0) return days
  return Math.max(1, Math.floor(days * (1 - freq)))
}
