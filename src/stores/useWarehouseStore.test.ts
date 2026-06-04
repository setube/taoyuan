import { beforeEach, describe, expect, it } from 'vitest'
import { createTestPinia } from '@/test/pinia'
import { useWarehouseStore } from './useWarehouseStore'
import { useInventoryStore } from './useInventoryStore'
import { useGameStore } from './useGameStore'
import { CHEST_DEFS } from '@/data/items'

function chestId(store: ReturnType<typeof useWarehouseStore>, index = 0): string {
  return store.chests[index]!.id
}

describe('useWarehouseStore', () => {
  beforeEach(() => {
    createTestPinia()
    useGameStore()
  })

  it('解锁费用为 500 文', () => {
    const wh = useWarehouseStore()
    expect(wh.UNLOCK_COST).toBe(500)
  })

  it('初始 5 个箱子槽位，扩建每次 +3', () => {
    const wh = useWarehouseStore()
    expect(wh.maxChests).toBe(5)
    expect(wh.CHEST_SLOTS_PER_EXPAND).toBe(3)
    expect(wh.expandMaxChests()).toBe(true)
    expect(wh.maxChests).toBe(8)
    expect(wh.expandMaxChests()).toBe(true)
    expect(wh.maxChests).toBe(11)
  })

  it('新建箱子带空分类列表', () => {
    const wh = useWarehouseStore()
    wh.unlocked = true
    wh.addChest('wood', '测试木箱')
    const chest = wh.getChest(chestId(wh))!
    expect(chest.filterCategories).toEqual([])
  })

  it('未设分类时任意物品可存', () => {
    const wh = useWarehouseStore()
    wh.unlocked = true
    wh.addChest('wood')
    const id = chestId(wh)
    expect(wh.canDepositItemToChest(id, 'seed_cabbage')).toBe(true)
    expect(wh.canDepositItemToChest(id, 'combat_tonic')).toBe(true)
  })

  it('设分类后仅允许对应物品', () => {
    const wh = useWarehouseStore()
    wh.unlocked = true
    wh.addChest('wood')
    const id = chestId(wh)
    wh.toggleChestCategory(id, 'seed')
    expect(wh.canDepositItemToChest(id, 'seed_cabbage')).toBe(true)
    expect(wh.canDepositItemToChest(id, 'combat_tonic')).toBe(false)
  })

  it('同一分类只能绑定一个箱子，改绑会移走', () => {
    const wh = useWarehouseStore()
    wh.unlocked = true
    wh.addChest('wood', '箱A')
    wh.addChest('copper', '箱B')
    const idA = chestId(wh, 0)
    const idB = chestId(wh, 1)
    wh.toggleChestCategory(idA, 'food')
    wh.toggleChestCategory(idB, 'food')
    expect(wh.getChest(idA)!.filterCategories).not.toContain('food')
    expect(wh.getChest(idB)!.filterCategories).toContain('food')
  })

  it('aggregateAllItems 按分类聚合全仓库物品', () => {
    const wh = useWarehouseStore()
    wh.unlocked = true
    wh.addChest('wood', 'A')
    wh.addChest('copper', 'B')
    wh.addItemToChest(wh.chests[0]!.id, 'seed_cabbage', 2)
    wh.addItemToChest(wh.chests[1]!.id, 'hay', 5)

    const all = wh.aggregateAllItems()
    expect(all).toHaveLength(2)
    const seed = all.find(e => e.itemId === 'seed_cabbage')!
    expect(seed.totalQuantity).toBe(2)
    expect(seed.locations[0]!.chestLabel).toBe('A')

    const seedsOnly = wh.aggregateAllItems('seed')
    expect(seedsOnly).toHaveLength(1)
    expect(seedsOnly[0]!.itemId).toBe('seed_cabbage')
  })

  it('withdrawFromAnyChest 可从多箱取出到背包', () => {
    const wh = useWarehouseStore()
    const inv = useInventoryStore()
    wh.unlocked = true
    wh.addChest('wood')
    wh.addChest('wood')
    wh.addItemToChest(wh.chests[0]!.id, 'wood', 3)
    wh.addItemToChest(wh.chests[1]!.id, 'wood', 4)

    const n = wh.withdrawFromAnyChest('wood', 5, 'normal')
    expect(n).toBe(5)
    expect(inv.getItemCount('wood')).toBe(5)
    expect(wh.getWarehouseTotalItemCount('wood')).toBe(2)
  })

  it('木箱可升级为铜箱并提升容量', () => {
    const wh = useWarehouseStore()
    wh.unlocked = true
    wh.addChest('wood')
    const id = chestId(wh)
    expect(wh.getChestCapacity(id)).toBe(18)
    expect(wh.upgradeChestTier(id)).toBe(true)
    expect(wh.getChest(id)!.tier).toBe('copper')
    expect(wh.getChestCapacity(id)).toBe(36)
  })

  it('虚空箱不可升级', () => {
    const wh = useWarehouseStore()
    wh.unlocked = true
    wh.addChest('void')
    expect(wh.upgradeChestTier(chestId(wh))).toBe(false)
  })

  it('从背包存入并遵守分类', () => {
    const wh = useWarehouseStore()
    const inv = useInventoryStore()
    wh.unlocked = true
    wh.addChest('wood', '种子箱')
    const id = chestId(wh)
    wh.toggleChestCategory(id, 'seed')
    inv.addItem('seed_cabbage', 3)
    inv.addItem('combat_tonic', 2)
    const deposited = wh.depositToChest(id, 'seed_cabbage', 3, 'normal')
    expect(deposited).toBe(3)
    expect(inv.getItemCount('seed_cabbage')).toBe(0)
    expect(wh.depositToChest(id, 'combat_tonic', 2, 'normal')).toBe(0)
    expect(inv.getItemCount('combat_tonic')).toBe(2)
  })

  it('一键放入：无分类配置时提示', () => {
    const wh = useWarehouseStore()
    wh.unlocked = true
    wh.addChest('wood')
    expect(wh.autoDepositByCategories()).toEqual(['请先在箱子上设置存放分类。'])
  })

  it('一键放入：按分类存入对应箱子', () => {
    const wh = useWarehouseStore()
    const inv = useInventoryStore()
    wh.unlocked = true
    wh.addChest('wood', '种子箱')
    wh.addChest('copper', '食物箱')
    wh.toggleChestCategory(chestId(wh, 0), 'seed')
    wh.toggleChestCategory(chestId(wh, 1), 'food')
    inv.addItem('seed_cabbage', 2)
    inv.addItem('combat_tonic', 1)
    const warnings = wh.autoDepositByCategories()
    expect(warnings).toEqual([])
    expect(wh.getChestItemCount(chestId(wh, 0), 'seed_cabbage')).toBe(2)
    expect(wh.getChestItemCount(chestId(wh, 1), 'combat_tonic')).toBe(1)
    expect(inv.getItemCount('seed_cabbage')).toBe(0)
    expect(inv.getItemCount('combat_tonic')).toBe(0)
  })

  it('一键放入：箱子已满时返回已满提示', () => {
    const wh = useWarehouseStore()
    const inv = useInventoryStore()
    wh.unlocked = true
    wh.addChest('wood', '小箱')
    const id = chestId(wh)
    wh.toggleChestCategory(id, 'material')
    const cap = CHEST_DEFS.wood.capacity
    const fillers = [
      'herb',
      'bamboo',
      'wood',
      'firewood',
      'pine_cone',
      'hay',
      'pine_resin',
      'camphor_oil',
      'silk',
      'cloth',
      'copper_bar',
      'iron_bar',
      'gold_bar',
      'charcoal',
      'rice_flour',
      'wheat_flour',
      'cornmeal',
      'battery'
    ]
    const chest = wh.getChest(id)!
    for (let i = 0; i < cap; i++) {
      chest.items.push({ itemId: fillers[i]!, quantity: 1, quality: 'normal' })
    }
    expect(wh.isChestFull(id)).toBe(true)
    inv.addItem('felt', 5)
    const warnings = wh.autoDepositByCategories()
    expect(warnings).toContain('小箱已满')
    expect(inv.getItemCount('felt')).toBe(5)
  })

  it('deserialize 为旧箱子补全 filterCategories', () => {
    const wh = useWarehouseStore()
    wh.deserialize({
      unlocked: true,
      maxChests: 5,
      chests: [
        {
          id: 'legacy_1',
          tier: 'wood',
          label: '旧箱',
          items: [],
          voidRole: 'none'
        } as never
      ]
    })
    expect(wh.chests[0]!.filterCategories).toEqual([])
  })

  it('renameChest 支持改名', () => {
    const wh = useWarehouseStore()
    wh.unlocked = true
    wh.addChest('wood', '原名')
    const id = chestId(wh)
    expect(wh.renameChest(id, '新名')).toBe(true)
    expect(wh.getChest(id)!.label).toBe('新名')
    expect(wh.renameChest(id, '')).toBe(false)
  })
})
