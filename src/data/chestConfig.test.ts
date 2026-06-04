import { describe, expect, it } from 'vitest'
import { CHEST_DEFS } from './items'
import { WAREHOUSE_UNLOCK_MATERIALS } from './buildings'

describe('仓库配置常量', () => {
  it('解锁仓库无需材料', () => {
    expect(WAREHOUSE_UNLOCK_MATERIALS).toEqual([])
  })

  it('箱子格数符合新版容量', () => {
    expect(CHEST_DEFS.wood.capacity).toBe(18)
    expect(CHEST_DEFS.copper.capacity).toBe(36)
    expect(CHEST_DEFS.iron.capacity).toBe(64)
    expect(CHEST_DEFS.gold.capacity).toBe(128)
    expect(CHEST_DEFS.void.capacity).toBe(64)
  })
})
