import { describe, expect, it } from 'vitest'
import { TAB_TO_LOCATION_GROUP } from './timeConstants'

describe('酒肆导航地点', () => {
  it('前厅酒肆属于农舍/农场地点', () => {
    expect(TAB_TO_LOCATION_GROUP.tavern).toBe('farm')
  })
})