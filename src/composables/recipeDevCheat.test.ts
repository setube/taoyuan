import { describe, it, expect } from 'vitest'
import { tryRecipeDevCheat } from './recipeDevCheat'

describe('recipeDevCheat', () => {
  it('matches cheat phrase', () => {
    expect(tryRecipeDevCheat('朵朵大王，配方全开')).toBe(true)
    expect(tryRecipeDevCheat('青菜怎么种')).toBe(false)
  })
})
