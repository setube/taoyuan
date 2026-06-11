import {
  calcGuestCount,
  getPriceDemandMult,
  TAVERN_OFF_SEASON_DEMAND_MULT,
  TAVERN_GREENHOUSE_OFF_SEASON_DEMAND_MULT,
  getTavernUpgrade
} from '@/data/tavern'
import { isFruitInSeason } from '@/data/fruitSeason'
import { getNpcTavernPref, NPC_TAVERN_PREFS } from '@/data/npcTavernPrefs'
import { useTavernStore } from '@/stores/useTavernStore'
import { getMeritTavernGuestBonus } from '@/composables/useMeritEffects'
import { useGameStore } from '@/stores/useGameStore'
import { usePlayerStore } from '@/stores/usePlayerStore'
import { useSkillStore } from '@/stores/useSkillStore'
import { useNpcStore } from '@/stores/useNpcStore'
import { addLog } from './useGameLog'
import { hasGreenhouseFruit } from './useCombinedInventory'

export interface TavernNightResult {
  guests: number
  served: number
  revenue: number
  wages: number
  reputationDelta: number
}

export function runTavernEndDay(): TavernNightResult | null {
  const tavern = useTavernStore()
  if (tavern.tavernLevel < 1) return null
  if (tavern.todayMode !== 'auto') return null

  const def = getTavernUpgrade(tavern.tavernLevel)
  if (!def) return null

  const active = tavern.getActiveMenuSlots()
  if (active.length === 0) {
    addLog('酒肆今晚无货可售，早早打烊了。')
    return { guests: 0, served: 0, revenue: 0, wages: 0, reputationDelta: 0 }
  }

  const game = useGameStore()
  let avgDemand = 1
  for (const slot of active) {
    const guide = tavern.getSlotGuidePrice(slot, game.season)
    const sell = tavern.getSlotSellPrice(slot, game.season)
    avgDemand *= getPriceDemandMult(sell, guide)
    if (slot.type === 'fruit' && slot.itemId && !isFruitInSeason(slot.itemId, game.season)) {
      avgDemand *= hasGreenhouseFruit(slot.itemId)
        ? TAVERN_GREENHOUSE_OFF_SEASON_DEMAND_MULT
        : TAVERN_OFF_SEASON_DEMAND_MULT
    }
  }
  avgDemand = Math.pow(avgDemand, 1 / active.length)

  const guests = calcGuestCount(def.baseGuests, tavern.reputation, avgDemand) + getMeritTavernGuestBonus()
  const chefs = tavern.employees.filter(e => e.role === 'chef' && e.onDuty)
  const waiters = tavern.employees.filter(e => e.role === 'waiter' && e.onDuty)
  const skill = useSkillStore().getSkill('cooking')
  let chefPower = skill.level
  if (chefs.length > 0) {
    chefPower = chefs.reduce((s, e) => s + e.cooking, 0) / chefs.length
    chefPower += skill.level * 0.1
  }
  if (skill.perk10 === 'tavern_master') chefPower *= 1.15

  const waiterBonus = waiters.length > 0 ? 1 + waiters.reduce((s, e) => s + e.eq, 0) / waiters.length / 20 : 1
  const autoMult = 0.85 * waiterBonus * (1 + chefPower / 30)

  let served = 0
  let revenue = 0
  const npcStore = useNpcStore()

  for (let i = 0; i < guests; i++) {
    const slot = active[Math.floor(Math.random() * active.length)]!
    if (tavern.getSlotStock(slot) <= 0) continue
    if (!tavern.consumeSlotStock(slot)) continue
    const price = Math.floor(tavern.getSlotSellPrice(slot, game.season) * autoMult)
    revenue += price
    served++

    if (Math.random() < 0.12) {
      const npcIds = NPC_TAVERN_PREFS.map(p => p.npcId)
      const npcId = npcIds[Math.floor(Math.random() * npcIds.length)]!
      const pref = getNpcTavernPref(npcId)
      if (pref) {
        const favIds = [pref.favoriteDrink, pref.favoriteDish, pref.favoriteFruit].filter(Boolean) as string[]
        if (favIds.includes(slot.itemId!)) {
          npcStore.adjustFriendship(npcId, 2)
        } else {
          npcStore.adjustFriendship(npcId, 1)
        }
      }
    }
  }

  let wages = 0
  for (const emp of tavern.employees) {
    if (emp.onDuty) {
      wages += emp.salary
      emp.stamina = Math.max(0, emp.stamina - 10)
    }
  }
  if (revenue > 0) usePlayerStore().earnMoney(revenue)
  if (wages > 0) usePlayerStore().spendMoney(wages)
  const net = revenue - wages

  const repDelta = served > guests * 0.6 ? 1 : served === 0 ? -1 : 0
  tavern.reputation = Math.max(0, Math.min(100, tavern.reputation + repDelta))

  if (served > 0) {
    addLog(`酒肆今晚接待 ${served} 位客人，净收入 ${net} 文${wages > 0 ? `（工资 ${wages} 文）` : ''}。`)
  } else {
    addLog('酒肆今晚客人不多，生意清淡。')
  }

  return { guests, served, revenue, wages, reputationDelta: repDelta }
}
