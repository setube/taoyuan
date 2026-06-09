import { FRUIT_TREE_DEFS } from './fruitTrees'
import type { Season } from '@/types'

const fruitSeasonMap = new Map<string, Season>()
for (const def of FRUIT_TREE_DEFS) {
  fruitSeasonMap.set(def.fruitId, def.fruitSeason)
}

export function getFruitSeason(itemId: string): Season | null {
  return fruitSeasonMap.get(itemId) ?? null
}

export function isFruitInSeason(itemId: string, season: Season): boolean {
  const natural = getFruitSeason(itemId)
  if (!natural) return true
  return natural === season
}
