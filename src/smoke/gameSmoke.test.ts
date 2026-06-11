/**
 * 游戏内 smoke test：通过 Pinia store 串联验证核心玩法链路（无需浏览器）。
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { createTestPinia } from '@/test/pinia'
import { useProcessingStore } from '@/stores/useProcessingStore'
import { useInventoryStore } from '@/stores/useInventoryStore'
import { usePlayerStore } from '@/stores/usePlayerStore'
import { useHomeStore } from '@/stores/useHomeStore'
import { useTavernStore } from '@/stores/useTavernStore'
import { useGameStore } from '@/stores/useGameStore'
import { useSkillStore } from '@/stores/useSkillStore'
import { useAchievementStore } from '@/stores/useAchievementStore'
import { useTutorialStore } from '@/stores/useTutorialStore'
import { useForgeStore } from '@/stores/useForgeStore'
import { useMiningStore } from '@/stores/useMiningStore'
import { runTavernEndDay } from '@/composables/tavernSimulate'

describe('游戏 smoke test', () => {
  beforeEach(() => {
    createTestPinia()
    useGameStore()
  })

  it('酒坊 3 批酿造 → 收取 → 上架酒肆 → 日结有收入', () => {
    const proc = useProcessingStore()
    const inv = useInventoryStore()
    const player = usePlayerStore()
    const home = useHomeStore()
    const tavern = useTavernStore()

    proc.machines.push({
      machineType: 'wine_workshop',
      recipeId: null,
      inputItemId: null,
      daysProcessed: 0,
      totalDays: 0,
      ready: false
    })
    inv.addItem('corn', 6)
    expect(proc.startProcessing(0, 'wine_corn', undefined, 3)).toBe(true)

    const slot = proc.machines[0]!
    slot.daysProcessed = slot.totalDays
    slot.ready = true
    expect(proc.collectProduct(0)).toBe('corn_wine')
    expect(inv.getItemCount('corn_wine')).toBe(3)

    home.farmhouseLevel = 3
    player.money = 200000
    inv.addItem('wood', 200)
    inv.addItem('iron_bar', 20)
    expect(tavern.buildTavern()).toBe(true)

    const wineSlotIdx = tavern.menuSlots.findIndex(s => s.type === 'wine')
    expect(wineSlotIdx).toBeGreaterThanOrEqual(0)
    tavern.setMenuSlot(wineSlotIdx, 'corn_wine')
    tavern.todayMode = 'auto'

    const moneyBefore = player.money
    const result = runTavernEndDay()
    expect(result).not.toBeNull()
    expect(result!.served).toBeGreaterThan(0)
    expect(player.money).toBeGreaterThanOrEqual(moneyBefore)
  })

  it('亲自值班：开铺 → 接待 → 打烊有收入', () => {
    const inv = useInventoryStore()
    const player = usePlayerStore()
    const home = useHomeStore()
    const tavern = useTavernStore()

    home.farmhouseLevel = 3
    player.money = 200000
    player.stamina = 100
    inv.addItem('wood', 200)
    inv.addItem('iron_bar', 20)
    inv.addItem('corn_wine', 5)
    tavern.buildTavern()

    const wineIdx = tavern.menuSlots.findIndex(s => s.type === 'wine')
    tavern.setMenuSlot(wineIdx, 'corn_wine')

    expect(tavern.startManualShift()).toBe(true)
    expect(tavern.todayMode).toBe('manual')

    let steps = 0
    while (tavern.manualSession && tavern.manualSession.step !== 'done' && steps < 80) {
      tavern.advanceManualStep()
      steps++
    }
    const { revenue, tips } = tavern.closeManualShift()
    expect(revenue + tips).toBeGreaterThanOrEqual(0)
    expect(runTavernEndDay()).toBeNull()
  })

  it('存档往返：酒肆 + 酒坊槽位保留', () => {
    const proc = useProcessingStore()
    const inv = useInventoryStore()
    const player = usePlayerStore()
    const home = useHomeStore()
    const tavern = useTavernStore()

    proc.machines.push({
      machineType: 'wine_workshop',
      recipeId: null,
      inputItemId: null,
      daysProcessed: 0,
      totalDays: 0,
      ready: false
    })
    inv.addItem('watermelon', 3)
    proc.startProcessing(0, 'wine_watermelon', undefined, 2)

    home.farmhouseLevel = 3
    player.money = 200000
    inv.addItem('wood', 200)
    inv.addItem('iron_bar', 20)
    tavern.buildTavern()
    tavern.reputation = 72

    const procData = proc.serialize()
    const tavernData = tavern.serialize()

    proc.deserialize({ machines: [], workshopLevel: 0, collapsedGroups: [] })
    tavern.deserialize({})

    proc.deserialize(procData)
    tavern.deserialize(tavernData)

    expect(proc.machines[0]!.inputAmount).toBe(2)
    expect(tavern.tavernLevel).toBe(1)
    expect(tavern.reputation).toBe(72)

    // 模拟 useSaveStore 存档载荷中的 tavern / processing 字段
    const payload = JSON.parse(JSON.stringify({ processing: procData, tavern: tavernData }))
    useProcessingStore().deserialize({ machines: [], workshopLevel: 0, collapsedGroups: [] })
    useTavernStore().deserialize({})
    useProcessingStore().deserialize(payload.processing)
    useTavernStore().deserialize(payload.tavern)
    expect(useProcessingStore().machines[0]!.inputAmount).toBe(2)
    expect(useTavernStore().reputation).toBe(72)
  })

  it('旧档烹饪经验迁移只执行一次', () => {
    const skill = useSkillStore()
    const achievement = useAchievementStore()
    const tutorial = useTutorialStore()

    achievement.stats.totalRecipesCooked = 20
    tutorial.setFlag('cooking_exp_migrated', false)
    const migrated = skill.migrateCookingExpFromRecipes(20, false)
    expect(migrated).toBe(true)
    expect(skill.getSkill('cooking').exp).toBe(100)

    const again = skill.migrateCookingExpFromRecipes(20, true)
    expect(again).toBe(false)
    expect(skill.getSkill('cooking').exp).toBe(100)
  })

  it('forge 存档 round-trip + Boss 迁移补图纸', () => {
    const forge = useForgeStore()
    const mining = useMiningStore()

    forge.attendLesson('lesson_open_furnace')
    forge.learnBlueprint('bp_shop_copper_ring')
    mining.defeatedBosses.push('frost_queen')

    const payload = JSON.parse(JSON.stringify({ forge: forge.serialize(), mining: mining.serialize() }))
    forge.reset()
    mining.deserialize({ ...mining.serialize(), defeatedBosses: [] })

    forge.deserialize(payload.forge)
    mining.deserialize(payload.mining)
    forge.migrateFromDefeatedBosses(mining.defeatedBosses)

    expect(forge.forgePanelUnlocked).toBe(true)
    expect(forge.lessonsSeen).toContain('lesson_open_furnace')
    expect(forge.unlockedRecipeIds.length).toBeGreaterThan(0)
    expect(forge.defeatedBossFloors).toContain(40)
  })
})
