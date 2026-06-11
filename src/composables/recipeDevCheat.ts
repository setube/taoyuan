import { RECIPES } from '@/data/recipes'
import recipeIds from '../../scripts/recipe-ids.json'
import { useCookingStore } from '@/stores/useCookingStore'
import { useForgeStore } from '@/stores/useForgeStore'

const FORGE_RECIPE_IDS: string[] = recipeIds.forge

/** 开发口令：朵朵大王，配方全开 */
export function tryRecipeDevCheat(input: string): boolean {
  if (!/朵朵大王/.test(input)) return false
  if (!/配方/.test(input)) return false
  return /全|开|解锁/.test(input)
}

export function applyRecipeDevCheat(): string {
  const cooking = useCookingStore()
  const forge = useForgeStore()
  let addedCook = 0
  let addedForge = 0
  for (const r of RECIPES) {
    if (cooking.unlockRecipe(r.id)) addedCook++
  }
  for (const id of FORGE_RECIPE_IDS) {
    if (forge.unlockRecipe(id)) addedForge++
  }
  return (
    `朵朵大王收到！新解锁烹饪 ${addedCook} 条、锻造 ${addedForge} 条` +
    `（共 ${RECIPES.length} 烹饪 / ${FORGE_RECIPE_IDS.length} 锻造，已有跳过）。请手动存档一次。`
  )
}
