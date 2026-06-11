import { describe, expect, it } from 'vitest'
import { resolveEffectiveLocationGroup } from './timeConstants'

describe('resolveEffectiveLocationGroup', () => {
  it('有地点绑定的路由优先于存档地点组', () => {
    expect(resolveEffectiveLocationGroup('farm', 'cooking')).toBe('village_area')
  })

  it('随身面板路由不改变实际地点', () => {
    expect(resolveEffectiveLocationGroup('mine', 'inventory')).toBe('mine')
  })

  it('无路由时回退到存档地点组', () => {
    expect(resolveEffectiveLocationGroup('hanhai', undefined)).toBe('hanhai')
  })
})
