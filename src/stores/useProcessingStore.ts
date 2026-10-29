import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { MachineType, MachineUpgradeDef, ProcessingRecipeDef, ProcessingSlot, Quality } from '@/types'
import {
  PROCESSING_MACHINES,
  MACHINE_UPGRADES,
  MAX_MACHINE_LEVEL,
  SPRINKLERS,
  FERTILIZERS,
  BAITS,
  TACKLES,
  TAPPER,
  CRAB_POT_CRAFT,
  BOMBS,
  getRecipesForMachine,
  getProcessingRecipeById
} from '@/data/processing'
import { getItemById } from '@/data/items'
import { useInventoryStore } from './useInventoryStore'
import { usePlayerStore } from './usePlayerStore'
import { useSkillStore } from './useSkillStore'
import { useBreedingStore } from './useBreedingStore'
import { useWarehouseStore } from './useWarehouseStore'
import { useHiddenNpcStore } from './useHiddenNpcStore'
import { addLog } from '@/composables/useGameLog'
import { hasCombinedItem, removeCombinedItem, getLowestCombinedQuality } from '@/composables/useCombinedInventory'

/** 工坊升级定义 */
const WORKSHOP_UPGRADES = [
  {
    level: 1,
    cost: 10000,
    materials: [
      { itemId: 'iron_bar', quantity: 15 },
      { itemId: 'wood', quantity: 50 }
    ]
  },
  {
    level: 2,
    cost: 25000,
    materials: [
      { itemId: 'gold_bar', quantity: 10 },
      { itemId: 'wood', quantity: 80 }
    ]
  }
]

export const useProcessingStore = defineStore('processing', () => {
  const inventoryStore = useInventoryStore()
  const playerStore = usePlayerStore()
  const skillStore = useSkillStore()

  /** 已放置的加工机器（运行中的槽位） */
  const machines = ref<ProcessingSlot[]>([])

  /** 工坊等级：0/1/2，对应 15/20/25 */
  const workshopLevel = ref(0)

  /** 最大放置机器数 */
  const maxMachines = computed(() => 15 + workshopLevel.value * 5)

  /** 当前放置数量 */
  const machineCount = computed(() => machines.value.length)

  // === 制造(Craft) ===

  /** 检查是否有足够材料制造某样东西 */
  const canCraft = (craftCost: { itemId: string; quantity: number }[], craftMoney: number): boolean => {
    if (playerStore.money < craftMoney) return false
    return craftCost.every(c => hasCombinedItem(c.itemId, c.quantity))
  }

  /** 消耗材料 */
  const consumeCraftMaterials = (craftCost: { itemId: string; quantity: number }[], craftMoney: number): boolean => {
    if (!canCraft(craftCost, craftMoney)) return false
    if (!playerStore.spendMoney(craftMoney)) return false
    for (const c of craftCost) {
      if (!removeCombinedItem(c.itemId, c.quantity)) {
        // 回退（简化处理：理论上不会到这里因为canCraft已检查）
        playerStore.earnMoney(craftMoney)
        return false
      }
    }
    return true
  }

  /** 制造并放置一台加工机器 */
  const craftMachine = (machineType: MachineType): boolean => {
    if (machines.value.length >= maxMachines.value) return false
    const def = PROCESSING_MACHINES.find(m => m.id === machineType)
    if (!def) return false
    if (!consumeCraftMaterials(def.craftCost, def.craftMoney)) return false
    machines.value.push({
      machineType,
      recipeId: null,
      inputItemId: null,
      daysProcessed: 0,
      totalDays: 0,
      ready: false,
      level: 0
    })
    return true
  }

  /** 制造洒水器（返回物品ID放入背包） */
  const craftSprinkler = (sprinklerId: string): boolean => {
    const def = SPRINKLERS.find(s => s.id === sprinklerId)
    if (!def) return false
    if (!consumeCraftMaterials(def.craftCost, def.craftMoney)) return false
    inventoryStore.addItem(def.id)
    return true
  }

  /** 制造肥料 */
  const craftFertilizer = (fertilizerId: string): boolean => {
    const def = FERTILIZERS.find(f => f.id === fertilizerId)
    if (!def) return false
    if (!consumeCraftMaterials(def.craftCost, def.craftMoney)) return false
    inventoryStore.addItem(def.id)
    return true
  }

  /** 制造鱼饵 */
  const craftBait = (baitId: string): boolean => {
    const def = BAITS.find(b => b.id === baitId)
    if (!def) return false
    if (!consumeCraftMaterials(def.craftCost, def.craftMoney)) return false
    inventoryStore.addItem(def.id)
    return true
  }

  /** 制造浮漂 */
  const craftTackle = (tackleId: string): boolean => {
    const def = TACKLES.find(t => t.id === tackleId)
    if (!def) return false
    if (!consumeCraftMaterials(def.craftCost, def.craftMoney)) return false
    inventoryStore.addItem(def.id)
    return true
  }

  /** 制造采脂器 */
  const craftTapper = (): boolean => {
    if (!consumeCraftMaterials(TAPPER.craftCost, TAPPER.craftMoney)) return false
    inventoryStore.addItem(TAPPER.id)
    return true
  }

  /** 制造蟹笼 */
  const craftCrabPot = (): boolean => {
    if (!consumeCraftMaterials(CRAB_POT_CRAFT.craftCost, CRAB_POT_CRAFT.craftMoney)) return false
    inventoryStore.addItem(CRAB_POT_CRAFT.id)
    return true
  }

  /** 制造炸弹 */
  const craftBomb = (bombId: string): boolean => {
    const def = BOMBS.find(b => b.id === bombId)
    if (!def) return false
    if (!consumeCraftMaterials(def.craftCost, def.craftMoney)) return false
    inventoryStore.addItem(def.id)
    return true
  }

  // === 设备等级 ===

  /** 设备等级（缺省 0，越界按边界处理） */
  const getSlotLevel = (slot: ProcessingSlot): number => {
    const level = Math.floor(slot.level ?? 0)
    if (!Number.isFinite(level) || level < 0) return 0
    return Math.min(level, MAX_MACHINE_LEVEL)
  }

  /** 某配方在该设备上一次的产出数量：配方产量 ×（1 + 设备等级） */
  const getOutputQuantity = (recipe: ProcessingRecipeDef, slot: ProcessingSlot): number => {
    return recipe.outputQuantity * (1 + getSlotLevel(slot))
  }

  /** 槽位当前配方完成后的产出数量（空闲为 0） */
  const getSlotOutputQuantity = (slot: ProcessingSlot): number => {
    if (!slot.recipeId) return 0
    const recipe = getProcessingRecipeById(slot.recipeId)
    return recipe ? getOutputQuantity(recipe, slot) : 0
  }

  /** 升到目标等级的费用，超出等级范围返回 null */
  const getMachineUpgradeCost = (targetLevel: number): MachineUpgradeDef | null => {
    return MACHINE_UPGRADES.find(u => u.level === targetLevel) ?? null
  }

  /** 指定设备能否升级：未满级且材料、铜钱足够 */
  const canUpgradeMachine = (index: number): boolean => {
    const slot = machines.value[index]
    if (!slot) return false
    const cost = getMachineUpgradeCost(getSlotLevel(slot) + 1)
    return cost !== null && canCraft(cost.materials, cost.money)
  }

  /** 升级指定设备（index 为 machines 中的原始下标），加工中也可升级，收取时按新等级结算 */
  const upgradeMachine = (index: number): { success: boolean; message: string } => {
    const slot = machines.value[index]
    if (!slot) return { success: false, message: '设备不存在。' }
    const cost = getMachineUpgradeCost(getSlotLevel(slot) + 1)
    if (!cost) return { success: false, message: '已满级。' }
    if (!consumeCraftMaterials(cost.materials, cost.money)) return { success: false, message: '材料或铜钱不足。' }
    slot.level = cost.level
    const name = PROCESSING_MACHINES.find(m => m.id === slot.machineType)?.name ?? slot.machineType
    return { success: true, message: `${name}升至Lv.${cost.level}。` }
  }

  /**
   * 发放加工产物：优先放入虚空成品箱，放不下的部分进背包。
   * 按实际入箱数量结算剩余，避免箱子只放下一部分时整批再进背包造成重复。
   */
  const deliverOutput = (itemId: string, quantity: number, quality: Quality) => {
    if (quantity <= 0) return
    const warehouseStore = useWarehouseStore()
    const voidOutput = warehouseStore.getVoidOutputChest()
    let remaining = quantity
    if (voidOutput) {
      const before = warehouseStore.getChestItemCount(voidOutput.id, itemId, quality)
      warehouseStore.addItemToChest(voidOutput.id, itemId, quantity, quality)
      remaining -= warehouseStore.getChestItemCount(voidOutput.id, itemId, quality) - before
    }
    if (remaining > 0) inventoryStore.addItem(itemId, remaining, quality)
  }

  // === 加工操作 ===

  /** 检测背包+仓库中某物品的最低品质（removeItem 默认消耗顺序） */
  const getLowestQuality = (itemId: string): Quality => {
    return getLowestCombinedQuality(itemId)
  }

  /** 向已放置的机器投入原料开始加工。specifiedQuality 可指定消耗的品质 */
  const startProcessing = (slotIndex: number, recipeId: string, specifiedQuality?: Quality): boolean => {
    const slot = machines.value[slotIndex]
    if (!slot || slot.recipeId !== null) return false // 正在加工中
    const recipe = getProcessingRecipeById(recipeId)
    if (!recipe || recipe.machineType !== slot.machineType) return false

    // 消耗输入材料（蜂箱无需输入），记录投入品质
    let quality: Quality = 'normal'
    if (recipe.inputItemId !== null) {
      if (specifiedQuality !== undefined) {
        quality = specifiedQuality
        if (!removeCombinedItem(recipe.inputItemId, recipe.inputQuantity, specifiedQuality)) return false
      } else {
        quality = getLowestQuality(recipe.inputItemId)
        if (!removeCombinedItem(recipe.inputItemId, recipe.inputQuantity)) return false
      }
    }

    slot.recipeId = recipeId
    slot.inputItemId = recipe.inputItemId
    slot.inputQuality = quality
    slot.daysProcessed = 0
    slot.totalDays = recipe.processingDays
    // 仙缘能力：织速（gui_nv_1）织布机加工时间-30%
    if (slot.machineType === 'loom' && useHiddenNpcStore().isAbilityActive('gui_nv_1')) {
      slot.totalDays = Math.max(1, Math.ceil(slot.totalDays * 0.7))
    }
    slot.ready = false
    return true
  }

  /** 收取加工产物 */
  const collectProduct = (slotIndex: number): string | null => {
    const slot = machines.value[slotIndex]
    if (!slot || !slot.ready || !slot.recipeId) return null

    const recipe = getProcessingRecipeById(slot.recipeId)
    if (!recipe) return null

    // 优先放入虚空成品箱，箱子满则回退到背包；数量按设备等级结算
    deliverOutput(recipe.outputItemId, getOutputQuantity(recipe, slot), slot.inputQuality ?? 'normal')

    // 种子制造机额外触发育种种子生成
    if (slot.machineType === 'seed_maker' && slot.inputItemId) {
      const breedingStore = useBreedingStore()
      const farmingLevel = skillStore.farmingLevel
      if (breedingStore.trySeedMakerGeneticSeed(slot.inputItemId, farmingLevel)) {
        addLog('种子制造机额外产出了一颗育种种子！')
      }
    }

    // 重置槽位
    slot.recipeId = null
    slot.inputItemId = null
    slot.inputQuality = undefined
    slot.daysProcessed = 0
    slot.totalDays = 0
    slot.ready = false

    return recipe.outputItemId
  }

  /** 拆除机器（退回加工原料 + 已完成产物 + 机器制作材料；升级投入不退还） */
  const removeMachine = (slotIndex: number): boolean => {
    const slot = machines.value[slotIndex]
    if (!slot) return false

    // 如果已完成：先收取产物（按设备等级结算）
    if (slot.recipeId && slot.ready) {
      const recipe = getProcessingRecipeById(slot.recipeId)
      if (recipe) {
        deliverOutput(recipe.outputItemId, getOutputQuantity(recipe, slot), slot.inputQuality ?? 'normal')
      }
    }
    // 如果正在加工：退回原料
    else if (slot.recipeId && !slot.ready && slot.inputItemId) {
      const recipe = getProcessingRecipeById(slot.recipeId)
      if (recipe && recipe.inputItemId) {
        inventoryStore.addItem(recipe.inputItemId, recipe.inputQuantity, slot.inputQuality ?? 'normal')
      }
    }

    // 退还机器制作材料
    const machineDef = PROCESSING_MACHINES.find(m => m.id === slot.machineType)
    if (machineDef) {
      for (const mat of machineDef.craftCost) {
        inventoryStore.addItem(mat.itemId, mat.quantity)
      }
      playerStore.earnMoney(machineDef.craftMoney)
    }

    machines.value.splice(slotIndex, 1)
    return true
  }

  /** 取消加工（退回原料，机器回到空闲状态） */
  const cancelProcessing = (slotIndex: number): boolean => {
    const slot = machines.value[slotIndex]
    if (!slot || !slot.recipeId) return false
    // 如果正在加工且有原料投入，退回原料
    if (!slot.ready && slot.inputItemId) {
      const recipe = getProcessingRecipeById(slot.recipeId)
      if (recipe && recipe.inputItemId) {
        inventoryStore.addItem(recipe.inputItemId, recipe.inputQuantity, slot.inputQuality ?? 'normal')
      }
    }
    // 重置为空闲
    slot.recipeId = null
    slot.inputItemId = null
    slot.inputQuality = undefined
    slot.daysProcessed = 0
    slot.totalDays = 0
    slot.ready = false
    return true
  }

  /** 获取某台机器可用的加工配方列表 */
  const getAvailableRecipes = (machineType: MachineType) => {
    return getRecipesForMachine(machineType)
  }

  // === 加工站（同类设备并行槽位）===

  /** 加工站统计：把同类设备视作一个拥有 N 个并行槽位的工站 */
  interface StationStats {
    /** 槽位总数 */
    total: number
    /** 空闲槽位数 */
    idle: number
    /** 运行中槽位数 */
    running: number
    /** 可收取槽位数 */
    ready: number
  }

  /** 统计某类设备的槽位占用情况 */
  const getStationStats = (machineType: MachineType): StationStats => {
    let total = 0
    let idle = 0
    let running = 0
    let ready = 0
    for (const slot of machines.value) {
      if (slot.machineType !== machineType) continue
      total++
      if (!slot.recipeId) idle++
      else if (slot.ready) ready++
      else running++
    }
    return { total, idle, running, ready }
  }

  /** 取得某类设备的槽位在 machines 中的下标（按原始顺序） */
  const getStationSlotIndexes = (machineType: MachineType): number[] => {
    const result: number[] = []
    for (let i = 0; i < machines.value.length; i++) {
      if (machines.value[i]!.machineType === machineType) result.push(i)
    }
    return result
  }

  /**
   * 批量投料：把同一配方分配到该加工站的空闲槽位上。
   * 逐个尝试，材料不足时自动停止，返回实际开工的槽位数。
   */
  const startProcessingBatch = (machineType: MachineType, recipeId: string, count: number, specifiedQuality?: Quality): number => {
    if (count <= 0) return 0
    let started = 0
    for (const index of getStationSlotIndexes(machineType)) {
      if (started >= count) break
      if (machines.value[index]!.recipeId !== null) continue
      if (!startProcessing(index, recipeId, specifiedQuality)) break
      started++
    }
    return started
  }

  /** 收取某加工站（省略则全部工站）已完成的产物，返回收取数量 */
  const collectAllReady = (machineType?: MachineType): number => {
    let collected = 0
    for (let i = 0; i < machines.value.length; i++) {
      const slot = machines.value[i]!
      if (machineType && slot.machineType !== machineType) continue
      if (!slot.ready) continue
      if (collectProduct(i)) collected++
    }
    return collected
  }

  /** 取消某加工站全部进行中的加工，返回取消数量 */
  const cancelAllProcessing = (machineType: MachineType): number => {
    let cancelled = 0
    for (const index of getStationSlotIndexes(machineType)) {
      const slot = machines.value[index]!
      if (!slot.recipeId || slot.ready) continue
      if (cancelProcessing(index)) cancelled++
    }
    return cancelled
  }

  /**
   * 选出加工站里拆除哪一台：优先空闲槽位（避免误毁进行中的加工），其中再挑等级最低的。
   * 同等级时空闲槽位取靠前一台，全忙时取靠后一台。
   */
  const getStationRemoveIndex = (machineType: MachineType): number | null => {
    const indexes = getStationSlotIndexes(machineType)
    if (indexes.length === 0) return null
    const idle = indexes.filter(i => machines.value[i]!.recipeId === null)
    const candidates = idle.length > 0 ? idle : indexes.slice().reverse()
    let best = candidates[0]!
    for (const i of candidates) {
      if (getSlotLevel(machines.value[i]!) < getSlotLevel(machines.value[best]!)) best = i
    }
    return best
  }

  /** 拆除该加工站的一个槽位（选择规则见 getStationRemoveIndex） */
  const removeOneFromStation = (machineType: MachineType): boolean => {
    const index = getStationRemoveIndex(machineType)
    return index === null ? false : removeMachine(index)
  }

  // === 排序与命名 ===

  /**
   * 加工站自定义名称。
   * 设备多了以后「酒坊」「酒坊」「酒坊」很难区分各自在干什么，允许起个诸如「果酒专用」的名字。
   */
  const stationNames = ref<Record<string, string>>({})

  /** 加工站显示顺序（存放 machineType，未列出的按默认顺序排在后面） */
  const stationOrder = ref<MachineType[]>([])

  /** 取加工站显示名（未命名则用设备原名） */
  const getStationName = (machineType: MachineType, defaultName: string): string => {
    return stationNames.value[machineType] || defaultName
  }

  /** 重命名加工站；传空字符串恢复默认名 */
  const renameStation = (machineType: MachineType, name: string) => {
    const trimmed = name.trim()
    if (trimmed) stationNames.value[machineType] = trimmed
    else delete stationNames.value[machineType]
  }

  /** 在显示顺序中把某个加工站上移/下移 */
  const moveStation = (machineType: MachineType, direction: -1 | 1, allTypes: MachineType[]) => {
    // 以当前完整列表为基准补全顺序表，避免新造的设备无法参与排序
    const order = allTypes.slice()
    const from = order.indexOf(machineType)
    const to = from + direction
    if (from < 0 || to < 0 || to >= order.length) return
    ;[order[from], order[to]] = [order[to]!, order[from]!]
    stationOrder.value = order
  }

  /** 按自定义顺序排序加工站类型 */
  const sortStationTypes = (types: MachineType[]): MachineType[] => {
    if (stationOrder.value.length === 0) return types
    const rank = new Map(stationOrder.value.map((t, i) => [t, i]))
    return types.slice().sort((a, b) => (rank.get(a) ?? 999) - (rank.get(b) ?? 999))
  }

  // === 每日更新 ===

  const dailyUpdate = () => {
    /** 自动收取汇总：产物名 → 实际产出数量（含设备等级加成） */
    const collected = new Map<string, number>()
    const addCollected = (name: string, quantity: number) => {
      collected.set(name, (collected.get(name) ?? 0) + quantity)
    }
    /** 待手动收取汇总：产物名 → 收取时的实际产出数量（含设备等级加成） */
    const ready = new Map<string, number>()
    const addReady = (name: string, quantity: number) => {
      ready.set(name, (ready.get(name) ?? 0) + quantity)
    }
    const outputName = (recipe: ProcessingRecipeDef): string => getItemById(recipe.outputItemId)?.name ?? recipe.name
    const warehouseStore = useWarehouseStore()
    for (const slot of machines.value) {
      if (!slot.recipeId || slot.ready) continue
      slot.daysProcessed++
      if (slot.daysProcessed >= slot.totalDays) {
        const recipe = getProcessingRecipeById(slot.recipeId)
        if (recipe) {
          // 仙缘能力：梦织（gui_nv_2）织布机8%概率额外产出梦丝
          if (slot.machineType === 'loom' && useHiddenNpcStore().isAbilityActive('gui_nv_2') && Math.random() < 0.08) {
            inventoryStore.addItem('dream_silk', 1)
            addCollected('梦丝', 1)
          }
          const machineDef = PROCESSING_MACHINES.find(m => m.id === slot.machineType)
          if (recipe.inputItemId === null || machineDef?.autoCollect) {
            // 自动收取：无需原料的机器（蜂箱/蚯蚓箱）或标记了 autoCollect 的机器（熔炉）
            const outputQuantity = getOutputQuantity(recipe, slot)
            deliverOutput(recipe.outputItemId, outputQuantity, slot.inputQuality ?? 'normal')
            addCollected(outputName(recipe), outputQuantity)
            // 无需原料的机器自动重启，有原料的机器回到空闲
            if (recipe.inputItemId === null) {
              slot.daysProcessed = 0
              slot.inputQuality = undefined
              slot.ready = false
            } else {
              slot.recipeId = null
              slot.inputItemId = null
              slot.inputQuality = undefined
              slot.daysProcessed = 0
              slot.totalDays = 0
              slot.ready = false
            }
          } else {
            // 需要原料的机器：检查虚空原料箱是否可自动续产
            const voidInput = warehouseStore.getVoidInputChest()
            if (voidInput && recipe.inputItemId) {
              // 自动收取当前产物（按设备等级结算）
              const outputQuantity = getOutputQuantity(recipe, slot)
              deliverOutput(recipe.outputItemId, outputQuantity, slot.inputQuality ?? 'normal')
              addCollected(outputName(recipe), outputQuantity)

              // 种子制造机额外触发育种种子生成
              if (slot.machineType === 'seed_maker' && slot.inputItemId) {
                const breedingStore = useBreedingStore()
                const farmingLevel = skillStore.farmingLevel
                if (breedingStore.trySeedMakerGeneticSeed(slot.inputItemId, farmingLevel)) {
                  addLog('种子制造机额外产出了一颗育种种子！')
                }
              }

              // 尝试从虚空原料箱取材料开始下一轮
              const available = warehouseStore.getChestItemCount(voidInput.id, recipe.inputItemId)
              if (available >= recipe.inputQuantity) {
                // 按最低品质产出；扣料不限品质，从低品质扣够数量
                const qOrder: Quality[] = ['normal', 'fine', 'excellent', 'supreme']
                const newQuality = qOrder.find(q => warehouseStore.getChestItemCount(voidInput.id, recipe.inputItemId!, q) > 0) ?? 'normal'
                warehouseStore.removeItemFromChest(voidInput.id, recipe.inputItemId, recipe.inputQuantity)
                slot.daysProcessed = 0
                slot.inputQuality = newQuality
                slot.ready = false
              } else {
                // 虚空箱无足够原料，回到空闲
                slot.recipeId = null
                slot.inputItemId = null
                slot.inputQuality = undefined
                slot.daysProcessed = 0
                slot.totalDays = 0
                slot.ready = false
              }
            } else {
              // 无虚空原料箱，保持原行为：标记为完成等待手动收取
              slot.ready = true
              addReady(outputName(recipe), getOutputQuantity(recipe, slot))
            }
          }
        } else {
          slot.ready = true
        }
      }
    }
    /** 汇总文案：名称×实际产出数量 */
    const formatSummary = (entries: Map<string, number>): string =>
      Array.from(entries.entries())
        .map(([name, count]) => (count > 1 ? `${name}×${count}` : name))
        .join('、')
    if (collected.size > 0) addLog(`工坊自动收取了：${formatSummary(collected)}。`)
    if (ready.size > 0) addLog(`加工完成：${formatSummary(ready)}。`)
  }

  // === 工坊升级 ===

  /** 升级工坊（扩展机器上限） */
  const upgradeWorkshop = (): { success: boolean; message: string } => {
    const next = workshopLevel.value + 1
    const upgrade = WORKSHOP_UPGRADES.find(u => u.level === next)
    if (!upgrade) return { success: false, message: '工坊已达到最高等级。' }
    if (!consumeCraftMaterials(upgrade.materials, upgrade.cost)) return { success: false, message: '材料或铜钱不足。' }
    workshopLevel.value = next
    return {
      success: true,
      message: `工坊扩建完成！机器上限提升至${maxMachines.value}台。`
    }
  }

  /** 获取下一级升级信息 */
  const getNextUpgrade = () => {
    const next = workshopLevel.value + 1
    return WORKSHOP_UPGRADES.find(u => u.level === next) ?? null
  }

  /** 工坊分组折叠状态（参与存档） */
  const collapsedGroups = ref(new Set<MachineType>())

  /** 只显示有足够材料的配方（参与存档，默认 false） */
  const onlyAvailable = ref(false)

  /**
   * 加工区视图模式（参与存档）。
   * station：同类设备合并成一座加工站，统一投料；
   * individual：每台设备各自一块面板，逐台操作。
   */
  const viewMode = ref<'station' | 'individual'>('station')

  const toggleGroup = (type: MachineType) => {
    if (collapsedGroups.value.has(type)) {
      collapsedGroups.value.delete(type)
    } else {
      collapsedGroups.value.add(type)
    }
  }

  // === 序列化 ===

  const serialize = () => {
    return {
      machines: machines.value,
      workshopLevel: workshopLevel.value,
      collapsedGroups: [...collapsedGroups.value],
      viewMode: viewMode.value,
      onlyAvailable: onlyAvailable.value,
      stationNames: stationNames.value,
      stationOrder: stationOrder.value
    }
  }

  const deserialize = (data: ReturnType<typeof serialize>) => {
    // 旧存档的设备没有 level 字段，按 0 级读入
    machines.value = (data.machines ?? []).map(m => ({ ...m, level: m.level ?? 0 }))
    workshopLevel.value = (data as any).workshopLevel ?? 0
    collapsedGroups.value = new Set((data as any).collapsedGroups ?? [])
    viewMode.value = (data as any).viewMode ?? 'station'
    onlyAvailable.value = (data as any).onlyAvailable ?? false
    stationNames.value = (data as any).stationNames ?? {}
    stationOrder.value = (data as any).stationOrder ?? []
  }

  return {
    machines,
    machineCount,
    maxMachines,
    workshopLevel,
    canCraft,
    consumeCraftMaterials,
    craftMachine,
    craftSprinkler,
    craftFertilizer,
    craftBait,
    craftTackle,
    craftTapper,
    craftCrabPot,
    craftBomb,
    startProcessing,
    collectProduct,
    cancelProcessing,
    removeMachine,
    getAvailableRecipes,
    getSlotLevel,
    getSlotOutputQuantity,
    getMachineUpgradeCost,
    canUpgradeMachine,
    upgradeMachine,
    getStationStats,
    getStationSlotIndexes,
    startProcessingBatch,
    collectAllReady,
    cancelAllProcessing,
    getStationRemoveIndex,
    removeOneFromStation,
    dailyUpdate,
    upgradeWorkshop,
    getNextUpgrade,
    WORKSHOP_UPGRADES,
    collapsedGroups,
    viewMode,
    onlyAvailable,
    stationNames,
    stationOrder,
    getStationName,
    renameStation,
    moveStation,
    sortStationTypes,
    toggleGroup,
    serialize,
    deserialize
  }
})
