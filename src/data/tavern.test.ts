import { describe, expect, it } from 'vitest'
import { clampPlayerPrice, getGuidePrice, getPriceDemandMult, isValidTavernName, normalizeTavernName } from './tavern'

describe('tavern pricing', () => {
  it('热菜指导价 sellPrice×3.2', () => {
    expect(getGuidePrice({ slot: 'dish', sellPrice: 100 })).toBe(320)
  })

  it('反季鲜果×4.8', () => {
    expect(
      getGuidePrice({ slot: 'fruit', sellPrice: 50, season: 'winter', fruitItemId: 'lychee' })
    ).toBe(240)
  })

  it('当季鲜果×3.0', () => {
    expect(
      getGuidePrice({ slot: 'fruit', sellPrice: 50, season: 'summer', fruitItemId: 'lychee' })
    ).toBe(150)
  })

  it('肆尊食物指导价+10%', () => {
    expect(getGuidePrice({ slot: 'dish', sellPrice: 100, tavernMaster: true })).toBe(352)
  })

  it('clampPlayerPrice', () => {
    expect(clampPlayerPrice(100, 1)).toBe(100)
    expect(clampPlayerPrice(100, 0.5)).toBe(85)
  })

  it('高价来客减少', () => {
    expect(getPriceDemandMult(120, 100)).toBe(0.94)
  })

  it('normalizeTavernName 裁剪空白与长度', () => {
    expect(normalizeTavernName('  桃源小馆  ')).toBe('桃源小馆')
    expect(normalizeTavernName('一二三四五六七八九十一二三')).toBe('一二三四五六七八九十一二')
    expect(isValidTavernName('   ')).toBe(false)
  })
})
