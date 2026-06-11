import { beforeEach, describe, expect, it } from 'vitest'
import { createTestPinia } from '@/test/pinia'
import { useSkillStore } from '@/stores/useSkillStore'

describe('forging 技能', () => {
  beforeEach(() => createTestPinia())

  it('skills 含 forging', () => {
    expect(useSkillStore().skills.some(s => s.type === 'forging')).toBe(true)
  })

  it('addExp forging 可升级', () => {
    const ss = useSkillStore()
    for (let i = 0; i < 30; i++) ss.addExp('forging', 200)
    expect(ss.getSkill('forging').level).toBeGreaterThan(0)
  })

  it('技能最高 20 级', () => {
    const ss = useSkillStore()
    ss.addExp('forging', 500000)
    expect(ss.getSkill('forging').level).toBe(20)
    expect(ss.getExpToNextLevel('forging')).toBeNull()
  })

  it('旧存档 deserialize 补全 forging 与 perk15/20', () => {
    const ss = useSkillStore()
    ss.deserialize({
      skills: [
        { type: 'farming', exp: 0, level: 0, perk5: null, perk10: null }
      ] as ReturnType<typeof ss.serialize>['skills']
    })
    const forging = ss.getSkill('forging')
    expect(forging).toBeDefined()
    expect(forging.perk15).toBeNull()
    expect(forging.perk20).toBeNull()
  })
})
