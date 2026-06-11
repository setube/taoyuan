import type { FishDef, MiniGameRating } from '@/types'

const RATING_BIAS: Record<Exclude<MiniGameRating, 'poor'>, number> = {
  perfect: 0.85,
  excellent: 0.65,
  good: 0.4
}

/** 掷出鱼竿钓获鱼的重量（斤，1 位小数） */
export function rollFishWeight(
  fish: FishDef,
  rating: Exclude<MiniGameRating, 'poor'>,
  fishingLevel: number
): number {
  const skillFactor = Math.min(1, fishingLevel / 10)
  const effectiveMax = fish.minWeight + (fish.maxWeight - fish.minWeight) * skillFactor
  const bias = RATING_BIAS[rating]
  const roll = Math.min(1, bias + Math.random() * 0.15)
  let weight = fish.minWeight + (effectiveMax - fish.minWeight) * roll
  weight = Math.min(fish.maxWeight, Math.max(fish.minWeight, weight))
  return Math.round(weight * 10) / 10
}

/** 鱼类重量售价倍率：√(重量/最小重量) */
export function getFishWeightMultiplier(_itemId: string, weight: number, minWeight: number): number {
  if (weight <= 0 || minWeight <= 0) return 1
  return Math.sqrt(weight / minWeight)
}
