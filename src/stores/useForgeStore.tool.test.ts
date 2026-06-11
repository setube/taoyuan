import { beforeEach, describe, expect, it } from 'vitest'
import { createTestPinia } from '@/test/pinia'
import { useForgeStore } from '@/stores/useForgeStore'
import { useInventoryStore } from '@/stores/useInventoryStore'
import { usePlayerStore } from '@/stores/usePlayerStore'
import { useSkillStore } from '@/stores/useSkillStore'

describe('useForgeStore.upgradeTool', () => {
  beforeEach(() => createTestPinia())

  it('当场升级锄头至铁制', () => {
    const forge = useForgeStore()
    const inv = useInventoryStore()
    const player = usePlayerStore()
    const skill = useSkillStore()

    skill.addExp('forging', 200)
    player.money = 5000
    inv.addItem('copper_bar', 10)

    const before = inv.getTool('hoe')!.tier
    const res = forge.upgradeTool('hoe')
    expect(res.ok).toBe(true)
    expect(inv.getTool('hoe')!.tier).not.toBe(before)
    expect(inv.getTool('hoe')!.tier).toBe('iron')
  })

  it('旧档 pendingUpgrade 读档迁移', () => {
    const inv = useInventoryStore()
    inv.deserialize({
      items: [],
      tools: inv.tools,
      pendingUpgrade: { toolType: 'pickaxe', targetTier: 'steel', daysRemaining: 1 }
    } as never)
    expect(inv.pendingUpgrade).toBeNull()
    expect(inv.getTool('pickaxe')!.tier).toBe('steel')
  })
})
