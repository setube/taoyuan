import { beforeEach, describe, expect, it } from 'vitest'
import { createTestPinia } from '@/test/pinia'
import { useSkillStore } from './useSkillStore'
import { useCookingStore } from './useCookingStore'
import { useInventoryStore } from './useInventoryStore'

describe('cooking 技能', () => {
  beforeEach(() => createTestPinia())

  it('skills 数组包含 cooking', () => {
    const skillStore = useSkillStore()
    expect(skillStore.skills.some(s => s.type === 'cooking')).toBe(true)
  })

  it('addExp cooking 可升级', () => {
    const skillStore = useSkillStore()
    for (let i = 0; i < 25; i++) skillStore.addExp('cooking', 100)
    expect(skillStore.getSkill('cooking').level).toBeGreaterThan(0)
  })

  it('migrateCookingExpFromRecipes 仅迁移一次', () => {
    const skillStore = useSkillStore()
    const before = skillStore.getSkill('cooking').exp
    expect(skillStore.migrateCookingExpFromRecipes(10, false)).toBe(true)
    expect(skillStore.getSkill('cooking').exp).toBe(before + 50)
    expect(skillStore.migrateCookingExpFromRecipes(10, true)).toBe(false)
    expect(skillStore.migrateCookingExpFromRecipes(0, false)).toBe(false)
  })

  it('deserialize 旧档无 cooking 时补全', () => {
    const skillStore = useSkillStore()
    const legacy = skillStore.skills.filter(s => s.type !== 'cooking')
    skillStore.deserialize({ skills: legacy })
    expect(skillStore.getSkill('cooking').level).toBe(0)
  })

  it('cook 成功后增加 cooking 经验', () => {
    const skillStore = useSkillStore()
    const cookingStore = useCookingStore()
    const inv = useInventoryStore()
    inv.addItem('cabbage', 10)
    const before = skillStore.getSkill('cooking').exp
    const result = cookingStore.cook('stir_fried_cabbage', 1)
    expect(result.success).toBe(true)
    expect(skillStore.getSkill('cooking').exp).toBeGreaterThan(before)
  })
})
