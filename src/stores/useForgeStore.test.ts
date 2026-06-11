import { beforeEach, describe, expect, it } from 'vitest'
import { createTestPinia } from '@/test/pinia'
import { useForgeStore } from '@/stores/useForgeStore'
import { usePlayerStore } from '@/stores/usePlayerStore'
import { useSkillStore } from '@/stores/useSkillStore'
import { useInventoryStore } from '@/stores/useInventoryStore'
import { useGameStore } from '@/stores/useGameStore'
import { getBlueprintById } from '@/data/forgeBlueprints'

describe('useForgeStore', () => {
  beforeEach(() => createTestPinia())

  it('learnBlueprint 合并配方并去重', () => {
    const forge = useForgeStore()
    const bp = getBlueprintById('bp_boss_frost_queen_set')!
    expect(bp.unlocksRecipeIds).toHaveLength(4)

    const first = forge.learnBlueprint('bp_boss_frost_queen_set')
    expect(first.newRecipeIds).toHaveLength(4)
    expect(forge.unlockedRecipeIds).toHaveLength(4)

    const second = forge.learnBlueprint('bp_boss_frost_queen_set')
    expect(second.newRecipeIds).toHaveLength(0)
    expect(forge.unlockedRecipeIds).toHaveLength(4)
  })

  it('purchaseSunBlueprint 扣钱并解锁', () => {
    const forge = useForgeStore()
    const player = usePlayerStore()
    player.money = 500

    const fail = forge.purchaseSunBlueprint('bp_shop_copper_ring')
    expect(fail.ok).toBe(true)
    expect(player.money).toBe(300)
    expect(forge.sunBlueprintShopPurchased).toContain('bp_shop_copper_ring')
    expect(forge.isRecipeUnlocked('forge_ring_quartz_ring')).toBe(true)

    const again = forge.purchaseSunBlueprint('bp_shop_copper_ring')
    expect(again.ok).toBe(false)
    expect(again.reason).toBe('already_purchased')
  })

  it('markBossDefeated 首杀解锁整套', () => {
    const forge = useForgeStore()
    const ids = forge.markBossDefeated(40)
    expect(ids).toHaveLength(4)
    expect(forge.defeatedBossFloors).toContain(40)
    expect(forge.markBossDefeated(40)).toHaveLength(0)
  })

  it('completeForge 扣料产出打造武器并加经验', () => {
    const forge = useForgeStore()
    const player = usePlayerStore()
    const skill = useSkillStore()
    const inventory = useInventoryStore()

    const recipeId = 'forge_weapon_copper_sword'
    forge.unlockRecipe(recipeId)
    skill.addExp('forging', 100)
    player.money = 1000
    inventory.addItem('copper_bar', 10)
    inventory.addItem('copper_ore', 10)

    expect(forge.startForge(recipeId).ok).toBe(true)
    expect(player.money).toBe(700)

    const beforeWeapons = inventory.ownedWeapons.length
    const beforeExp = skill.getSkill('forging').exp
    expect(forge.completeForge(100).ok).toBe(true)

    expect(inventory.ownedWeapons.length).toBe(beforeWeapons + 1)
    const crafted = inventory.ownedWeapons[inventory.ownedWeapons.length - 1]!
    expect(crafted.recipeId).toBe(recipeId)
    expect(crafted.quality).toBeDefined()
    expect(crafted.rolledAttack).toBeGreaterThan(0)
    expect(skill.getSkill('forging').exp).toBeGreaterThan(beforeExp)
    expect(forge.forgeStats.totalForges).toBe(1)
  })

  it('serialize / deserialize 往返', () => {
    const forge = useForgeStore()
    forge.learnBlueprint('bp_shop_copper_sword')
    forge.markBossDefeated(20)
    const snap = forge.serialize()

    forge.reset()
    expect(forge.unlockedRecipeIds).toHaveLength(0)

    forge.deserialize(snap)
    expect(forge.isRecipeUnlocked('forge_weapon_copper_sword')).toBe(true)
    expect(forge.defeatedBossFloors).toContain(20)
  })

  it('acceptForgeQuest 接取后移入进行中并从任务板移除', () => {
    const forge = useForgeStore()
    const game = useGameStore()
    game.day = 8
    forge.refreshForgeBoard(true)
    expect(forge.forgeBoardQuests.length).toBeGreaterThan(0)
    const tid = forge.forgeBoardQuests[0]!.templateId

    const res = forge.acceptForgeQuest(tid)
    expect(res.ok).toBe(true)
    expect(forge.activeForgeQuests.some(q => q.templateId === tid)).toBe(true)
    expect(forge.forgeBoardQuests.some(q => q.templateId === tid)).toBe(false)
  })

  it('canSubmitForgeQuest 只读检查，不因未过期任务反复改写进行中列表', () => {
    const forge = useForgeStore()
    const game = useGameStore()
    game.day = 8
    forge.refreshForgeBoard(true)
    const tid = forge.forgeBoardQuests[0]!.templateId
    forge.acceptForgeQuest(tid)
    const activeRef = forge.activeForgeQuests
    const instanceId = forge.activeForgeQuests[0]!.instanceId

    for (let i = 0; i < 20; i++) {
      forge.canSubmitForgeQuest(instanceId)
    }

    expect(forge.activeForgeQuests).toBe(activeRef)
  })

  it('deserialize 清理任务板与进行中重复项', () => {
    const forge = useForgeStore()
    forge.refreshForgeBoard(true)
    const tid = forge.forgeBoardQuests[0]!.templateId
    forge.acceptForgeQuest(tid)
    const snap = forge.serialize()
    snap.forgeBoardQuests = [{ templateId: tid, postedDay: 1 }, ...snap.forgeBoardQuests]

    forge.reset()
    forge.deserialize(snap)
    expect(forge.forgeBoardQuests.some(q => q.templateId === tid)).toBe(false)
    expect(forge.activeForgeQuests.some(q => q.templateId === tid)).toBe(true)
  })
})
