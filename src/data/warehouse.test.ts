import { describe, expect, it } from 'vitest'
import { CHEST_FILTER_CATEGORIES, CHEST_CATEGORY_LABELS, getNextChestUpgradeTier } from './warehouse'

describe('warehouse data', () => {
  it('可绑定分类包含种子与食物', () => {
    expect(CHEST_FILTER_CATEGORIES).toContain('seed')
    expect(CHEST_FILTER_CATEGORIES).toContain('food')
  })

  it('分类均有中文标签', () => {
    for (const cat of CHEST_FILTER_CATEGORIES) {
      expect(CHEST_CATEGORY_LABELS[cat].length).toBeGreaterThan(0)
    }
  })

  describe('getNextChestUpgradeTier', () => {
    it('木箱可升为铜箱', () => {
      expect(getNextChestUpgradeTier('wood')).toBe('copper')
    })

    it('金箱不可再升', () => {
      expect(getNextChestUpgradeTier('gold')).toBeNull()
    })

    it('虚空箱不可升', () => {
      expect(getNextChestUpgradeTier('void')).toBeNull()
    })
  })
})
