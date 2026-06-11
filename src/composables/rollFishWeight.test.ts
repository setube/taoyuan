import { describe, expect, it } from 'vitest'
import { rollFishWeight, getFishWeightMultiplier } from './rollFishWeight'
import type { FishDef } from '@/types'

const sampleFish: FishDef = {
  id: 'crucian',
  name: '鲫鱼',
  season: ['spring'],
  weather: ['any'],
  difficulty: 'easy',
  sellPrice: 15,
  description: '',
  minWeight: 0.2,
  maxWeight: 1.2
}

describe('rollFishWeight', () => {
  it('0级钓鱼重量为最小值', () => {
    for (let i = 0; i < 20; i++) {
      expect(rollFishWeight(sampleFish, 'good', 0)).toBe(0.2)
    }
  })

  it('重量在区间内且为0.1步进', () => {
    for (let i = 0; i < 50; i++) {
      const w = rollFishWeight(sampleFish, 'perfect', 10)
      expect(w).toBeGreaterThanOrEqual(0.2)
      expect(w).toBeLessThanOrEqual(1.2)
      expect(Math.round(w * 10)).toBe(w * 10)
    }
  })

  it('完美收竿平均重于良好收竿', () => {
    const perfectAvg =
      Array.from({ length: 200 }, () => rollFishWeight(sampleFish, 'perfect', 10)).reduce((a, b) => a + b, 0) / 200
    const goodAvg =
      Array.from({ length: 200 }, () => rollFishWeight(sampleFish, 'good', 10)).reduce((a, b) => a + b, 0) / 200
    expect(perfectAvg).toBeGreaterThan(goodAvg)
  })
})

describe('getFishWeightMultiplier', () => {
  it('最小重量倍率为1', () => {
    expect(getFishWeightMultiplier('crucian', 0.2, 0.2)).toBe(1)
  })

  it('较重鱼倍率更高', () => {
    const light = getFishWeightMultiplier('crucian', 0.2, 0.2)
    const heavy = getFishWeightMultiplier('crucian', 1.2, 0.2)
    expect(heavy).toBeGreaterThan(light)
  })
})
