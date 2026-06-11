import type { MeritBuff, MeritShopOffer } from '@/types/system'
import { getMeritBagExpandCost, getMeritCatalogItem, resolveMaxPurchases, type MeritCatalogItem } from '@/data/meritShop'
import { createId } from '@/utils/id'
import { usePlayerStore } from '@/stores/usePlayerStore'
import { useInventoryStore } from '@/stores/useInventoryStore'
import { useGameStore } from '@/stores/useGameStore'

export function catalogToOffer(item: MeritCatalogItem): MeritShopOffer {
  const maxPurchases = resolveMaxPurchases(item)
  let cost = item.cost
  if (item.id === 'bag_expand') {
    cost = getMeritBagExpandCost(useInventoryStore().capacity)
  }
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    cost,
    category: item.category,
    source: 'catalog',
    buffType: item.buffType,
    durationDays: item.durationDays,
    effect: { ...item.effect },
    once: item.once,
    maxPurchases,
    purchased: false
  }
}

export function getMeritEffectBonus(effectType: string, activeBuffs: MeritBuff[]): number {
  const now = useGameStore().day
  let total = 0
  for (const b of activeBuffs) {
    if (b.effect.type !== effectType) continue
    if (b.type === 'timed' && b.expiresOnDay != null && now > b.expiresOnDay) continue
    total += b.effect.value
  }
  return total
}

export function expireTimedBuffs(activeBuffs: MeritBuff[], currentDay: number): MeritBuff[] {
  return activeBuffs.filter(b => {
    if (b.type !== 'timed') return true
    if (b.expiresOnDay == null) return true
    return currentDay <= b.expiresOnDay
  })
}

export function getOfferMaxPurchases(offer: MeritShopOffer): number | undefined {
  if (offer.maxPurchases != null) return offer.maxPurchases
  if (offer.once) return 1
  return undefined
}

export function getPurchaseCount(offerId: string, counts: Record<string, number>): number {
  return counts[offerId] ?? 0
}

export function isOfferSoldOut(offer: MeritShopOffer, counts: Record<string, number>): boolean {
  const max = getOfferMaxPurchases(offer)
  if (max == null) return false
  return getPurchaseCount(offer.id, counts) >= max
}

export function applyMeritEffect(
  effect: MeritShopOffer['effect'],
  buffMeta: Pick<MeritShopOffer, 'name' | 'description' | 'buffType' | 'durationDays' | 'id'>
): { ok: boolean; message: string; buff?: MeritBuff } {
  const player = usePlayerStore()
  const inv = useInventoryStore()
  const day = useGameStore().day

  switch (effect.type) {
    case 'grant_money':
      player.earnMoney(effect.value)
      return { ok: true, message: `获得 ${effect.value.toLocaleString()} 文铜钱。` }
    case 'grant_item':
      if (!effect.itemId) return { ok: false, message: '物品配置错误。' }
      inv.addItem(effect.itemId, effect.quantity ?? 1)
      return { ok: true, message: `获得物品。` }
    case 'max_stamina':
      player.addBonusMaxStamina(effect.value)
      return {
        ok: true,
        message: `体力上限永久 +${effect.value}（当前 ${player.maxStamina}）。`,
        buff: makeBuff(buffMeta, effect, day)
      }
    case 'max_hp':
      player.addBonusMaxHp(effect.value)
      return {
        ok: true,
        message: `生命上限永久 +${effect.value}（当前 ${player.getMaxHp()}）。`,
        buff: makeBuff(buffMeta, effect, day)
      }
    case 'expand_bag':
      if (inv.capacity >= inv.MAX_CAPACITY) {
        return { ok: false, message: '背包已达满级，无法继续扩容。' }
      }
      inv.expandCapacity()
      return { ok: true, message: `背包扩容至 ${inv.capacity} 格。` }
    default:
      return {
        ok: true,
        message: `效果「${buffMeta.name}」已生效。`,
        buff: makeBuff(buffMeta, effect, day)
      }
  }
}

function makeBuff(
  meta: Pick<MeritShopOffer, 'name' | 'description' | 'buffType' | 'durationDays' | 'id'>,
  effect: MeritShopOffer['effect'],
  currentDay: number
): MeritBuff {
  return {
    id: meta.id || createId(),
    name: meta.name,
    description: meta.description,
    cost: 0,
    type: meta.buffType,
    durationDays: meta.durationDays,
    expiresOnDay: meta.buffType === 'timed' && meta.durationDays
      ? currentDay + meta.durationDays
      : undefined,
    effect: { type: effect.type, value: effect.value, itemId: effect.itemId, quantity: effect.quantity }
  }
}

export function canPurchaseOffer(
  offer: MeritShopOffer,
  merit: number,
  purchasedCounts: Record<string, number>
): { ok: boolean; reason?: string } {
  if (offer.purchased || isOfferSoldOut(offer, purchasedCounts)) {
    return { ok: false, reason: '已达兑换上限' }
  }
  if (merit < offer.cost) return { ok: false, reason: `功勋不足（需要 ${offer.cost}，当前 ${merit}）` }
  if (offer.effect.type === 'expand_bag') {
    const inv = useInventoryStore()
    if (inv.capacity >= inv.MAX_CAPACITY) {
      return { ok: false, reason: '背包已满级' }
    }
  }
  return { ok: true }
}

export function recordMeritPurchase(offer: MeritShopOffer, purchasedCounts: Record<string, number>): void {
  const max = getOfferMaxPurchases(offer)
  if (max == null) {
    if (offer.source === 'wish') offer.purchased = true
    return
  }
  purchasedCounts[offer.id] = getPurchaseCount(offer.id, purchasedCounts) + 1
  if (isOfferSoldOut(offer, purchasedCounts)) {
    offer.purchased = true
  }
}

/** 旧存档 purchasedCatalogIds 迁移为计数 */
export function migratePurchasedCatalogIds(ids: string[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const id of ids) {
    counts[id] = (counts[id] ?? 0) + 1
  }
  return counts
}

export { getMeritCatalogItem }
