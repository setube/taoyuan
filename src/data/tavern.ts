import type { Season } from '@/types'
import { isFruitInSeason } from './fruitSeason'

export type TavernMenuSlotType = 'wine' | 'dish' | 'snack' | 'fruit' | 'cellar'

export const DEFAULT_TAVERN_NAME = '前厅酒肆'
export const TAVERN_NAME_MAX_LEN = 12

/** 裁剪并规范化酒肆店名（1～12 字，空串表示使用扩建默认名） */
export function normalizeTavernName(raw: string): string {
  return raw.trim().slice(0, TAVERN_NAME_MAX_LEN)
}

export function isValidTavernName(raw: string): boolean {
  const n = normalizeTavernName(raw)
  return n.length >= 1
}

export const TAVERN_PRICE_MULT = {
  wine: 3.0,
  dish: 3.2,
  snack: 3.0,
  fruitInSeason: 3.0,
  fruitOffSeason: 4.8,
  cellar: 3.2
} as const

export const TAVERN_PLAYER_PRICE_RANGE = { min: 0.85, max: 1.4 }
export const TAVERN_OFF_SEASON_DEMAND_MULT = 1.45
export const TAVERN_GREENHOUSE_OFF_SEASON_DEMAND_MULT = 1.5

export interface TavernUpgradeDef {
  level: number
  name: string
  seats: number
  slots: { wine: number; dish: number; snack: number; fruit: number; cellar: number }
  staffMax: { chef: number; waiter: number }
  baseGuests: number
  cost: number
  materialCost: { itemId: string; quantity: number }[]
}

export const TAVERN_UPGRADES: TavernUpgradeDef[] = [
  {
    level: 1,
    name: '前厅酒肆',
    seats: 4,
    slots: { wine: 1, dish: 1, snack: 1, fruit: 1, cellar: 1 },
    staffMax: { chef: 0, waiter: 0 },
    baseGuests: 6,
    cost: 80000,
    materialCost: [
      { itemId: 'wood', quantity: 150 },
      { itemId: 'iron_bar', quantity: 8 }
    ]
  },
  {
    level: 2,
    name: '前厅·贰',
    seats: 6,
    slots: { wine: 1, dish: 2, snack: 1, fruit: 1, cellar: 1 },
    staffMax: { chef: 1, waiter: 1 },
    baseGuests: 9,
    cost: 35000,
    materialCost: [
      { itemId: 'wood', quantity: 120 },
      { itemId: 'iron_bar', quantity: 5 }
    ]
  },
  {
    level: 3,
    name: '前厅·叁',
    seats: 8,
    slots: { wine: 2, dish: 2, snack: 2, fruit: 2, cellar: 1 },
    staffMax: { chef: 1, waiter: 1 },
    baseGuests: 12,
    cost: 70000,
    materialCost: [
      { itemId: 'wood', quantity: 200 },
      { itemId: 'gold_bar', quantity: 8 }
    ]
  },
  {
    level: 4,
    name: '前厅·肆',
    seats: 10,
    slots: { wine: 2, dish: 3, snack: 2, fruit: 2, cellar: 2 },
    staffMax: { chef: 2, waiter: 1 },
    baseGuests: 15,
    cost: 120000,
    materialCost: [
      { itemId: 'wood', quantity: 300 },
      { itemId: 'gold_bar', quantity: 15 }
    ]
  },
  {
    level: 5,
    name: '前厅·伍',
    seats: 12,
    slots: { wine: 3, dish: 3, snack: 2, fruit: 2, cellar: 2 },
    staffMax: { chef: 2, waiter: 2 },
    baseGuests: 18,
    cost: 180000,
    materialCost: [
      { itemId: 'wood', quantity: 400 },
      { itemId: 'iridium_bar', quantity: 5 }
    ]
  }
]

export function getTavernUpgrade(level: number): TavernUpgradeDef | undefined {
  return TAVERN_UPGRADES.find(u => u.level === level)
}

export interface GuidePriceInput {
  slot: TavernMenuSlotType
  sellPrice: number
  season?: Season
  fruitItemId?: string
  addedValue?: number
  tavernMaster?: boolean
}

export function getGuidePrice(input: GuidePriceInput): number {
  let mult: number
  if (input.slot === 'fruit' && input.fruitItemId && input.season) {
    mult = isFruitInSeason(input.fruitItemId, input.season) ? TAVERN_PRICE_MULT.fruitInSeason : TAVERN_PRICE_MULT.fruitOffSeason
  } else if (input.slot === 'wine') {
    mult = TAVERN_PRICE_MULT.wine
  } else if (input.slot === 'dish') {
    mult = TAVERN_PRICE_MULT.dish
  } else if (input.slot === 'snack') {
    mult = TAVERN_PRICE_MULT.snack
  } else if (input.slot === 'cellar') {
    return Math.floor((input.sellPrice + (input.addedValue ?? 0)) * TAVERN_PRICE_MULT.cellar)
  } else {
    mult = TAVERN_PRICE_MULT.snack
  }
  let price = Math.floor(input.sellPrice * mult)
  if (input.tavernMaster && (input.slot === 'dish' || input.slot === 'snack')) {
    price = Math.floor(price * 1.1)
  }
  return price
}

export function clampPlayerPrice(guidePrice: number, playerMult: number): number {
  const m = Math.max(TAVERN_PLAYER_PRICE_RANGE.min, Math.min(TAVERN_PLAYER_PRICE_RANGE.max, playerMult))
  return Math.floor(guidePrice * m)
}

export function getPriceDemandMult(sellPrice: number, guidePrice: number): number {
  if (sellPrice > guidePrice * 1.12) return 0.94
  if (sellPrice < guidePrice * 0.92) return 1.06
  return 1
}

export function calcGuestCount(baseGuests: number, reputation: number, priceMult: number): number {
  const repFactor = 0.8 + reputation / 100
  return Math.max(1, Math.floor(baseGuests * repFactor * priceMult))
}

export const TAVERN_EMPLOYEE_NAMES = [
  '阿福', '小翠', '铁柱', '春桃', '老周', '二丫', '大牛', '桂花', '石头', '小梅'
]

export function calcEmployeeSalary(attrs: { cooking: number; eq: number; iq: number }): number {
  const score = attrs.cooking * 2 + attrs.eq * 2 + attrs.iq
  return 80 + score * 8
}

export function calcTrainingCost(targetAttr: number): number {
  return 200 + targetAttr * 30
}

export function calcTrainingGain(iq: number): number {
  return 1 + Math.floor(iq / 4)
}
