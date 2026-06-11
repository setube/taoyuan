import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { FarmhouseLevel, CaveChoice, Quality } from '@/types'
import {
  FARMHOUSE_UPGRADES,
  GREENHOUSE_UNLOCK_COST,
  GREENHOUSE_MATERIAL_COST,
  FORGE_WORKSHOP_UNLOCK_COST,
  FORGE_WORKSHOP_MATERIAL_COST,
  FORGE_WORKSHOP_MIN_LEVEL,
  CELLAR_VALUE_CYCLE_DAYS,
  CELLAR_UPGRADES,
  CAVE_UPGRADES,
  getCaveUpgrade,
  getCaveQuality
} from '@/data/buildings'
import { usePlayerStore } from './usePlayerStore'
import { useSkillStore } from './useSkillStore'
import { useInventoryStore } from './useInventoryStore'
import { useFarmStore } from './useFarmStore'
import { getCombinedItemCount, removeCombinedItem } from '@/composables/useCombinedInventory'
import { useSystemStore } from './useSystemStore'

/** 酒窖陈酿槽 */
interface CellarSlot {
  itemId: string
  originalQuality: Quality // 放入时的品质
  daysAging: number // 当前周期内已陈酿天数
  addedValue: number // 累计增加的价值（文）
  upgradeCount: number // 已提升次数
}

/** 可陈酿的物品ID（酒类） */
const AGEABLE_ITEMS = [
  'watermelon_wine',
  'osmanthus_wine',
  'peach_wine',
  'jujube_wine',
  'corn_wine',
  'rice_vinegar',
  'cactus_wine',
  'date_wine'
]

export const useHomeStore = defineStore('home', () => {
  const farmhouseLevel = ref<FarmhouseLevel>(0)
  const caveChoice = ref<CaveChoice>('none')
  const caveUnlocked = ref(false)
  const greenhouseUnlocked = ref(false)
  const forgeWorkshopBuilt = ref(false)
  const cellarSlots = ref<CellarSlot[]>([])
  const cellarLevel = ref(1)
  const caveLevel = ref(1)
  const caveDaysActive = ref(0)

  const farmhouseName = computed(() => {
    const names: Record<FarmhouseLevel, string> = { 0: '茅屋', 1: '砖房', 2: '宅院', 3: '酒窖宅院' }
    return names[farmhouseLevel.value]
  })

  const nextUpgrade = computed(() => {
    const nextLevel = (farmhouseLevel.value + 1) as FarmhouseLevel
    return FARMHOUSE_UPGRADES.find(u => u.level === nextLevel) ?? null
  })

  const hasCellar = computed(() => farmhouseLevel.value >= 3)

  const cellarMaxSlots = computed(() => {
    const def = CELLAR_UPGRADES.find(u => u.level === cellarLevel.value)
    return def?.maxSlots ?? 6
  })

  const cellarValuePerCycle = computed(() => {
    const def = CELLAR_UPGRADES.find(u => u.level === cellarLevel.value)
    return def?.valuePerCycle ?? 100
  })

  const nextCellarUpgrade = computed(() => {
    return CELLAR_UPGRADES.find(u => u.level === cellarLevel.value + 1) ?? null
  })

  const caveName = computed(() => {
    const def = getCaveUpgrade(caveLevel.value)
    return def?.name ?? '山洞'
  })

  const caveQuality = computed(() => getCaveQuality(caveDaysActive.value))

  const nextCaveUpgrade = computed(() => {
    return CAVE_UPGRADES.find(u => u.level === caveLevel.value + 1) ?? null
  })

  /** 升级农舍 */
  const upgradeFarmhouse = (): boolean => {
    const playerStore = usePlayerStore()

    const upgrade = nextUpgrade.value
    if (!upgrade) return false

    // 检查材料
    for (const mat of upgrade.materialCost) {
      if (getCombinedItemCount(mat.itemId) < mat.quantity) return false
    }
    if (!playerStore.spendMoney(upgrade.cost)) return false

    // 扣除材料
    for (const mat of upgrade.materialCost) {
      removeCombinedItem(mat.itemId, mat.quantity)
    }

    farmhouseLevel.value = upgrade.level
    try {
      useSystemStore().onHomeUpgraded(upgrade.level)
    } catch {
      /* pinia 未就绪 */
    }
    return true
  }

  /** 解锁山洞 */
  const unlockCave = (): boolean => {
    if (caveUnlocked.value) return false
    caveUnlocked.value = true
    return true
  }

  /** 选择山洞类型 */
  const chooseCave = (choice: 'mushroom' | 'fruit_bat'): boolean => {
    if (!caveUnlocked.value) return false
    if (caveChoice.value !== 'none') return false
    caveChoice.value = choice
    return true
  }

  /** 山洞每日产出 */
  const dailyCaveUpdate = (): { itemId: string; quantity: number; quality: Quality }[] => {
    if (caveChoice.value === 'none') return []
    const results: { itemId: string; quantity: number; quality: Quality }[] = []
    const def = getCaveUpgrade(caveLevel.value)
    if (!def) return []
    const quality = getCaveQuality(caveDaysActive.value)

    if (caveChoice.value === 'mushroom') {
      if (Math.random() < def.mushroomChance) {
        // 按权重随机选择蘑菇产物
        const totalWeight = def.mushroomPool.reduce((sum, p) => sum + p.weight, 0)
        let roll = Math.random() * totalWeight
        let picked = def.mushroomPool[0]!.itemId
        for (const p of def.mushroomPool) {
          roll -= p.weight
          if (roll <= 0) {
            picked = p.itemId
            break
          }
        }
        const qty = def.doubleChance > 0 && Math.random() < def.doubleChance ? 2 : 1
        results.push({ itemId: picked, quantity: qty, quality })
      }
    } else if (caveChoice.value === 'fruit_bat') {
      if (Math.random() < def.fruitBatChance) {
        const pick = def.fruitPool[Math.floor(Math.random() * def.fruitPool.length)]!
        const qty = def.doubleChance > 0 && Math.random() < def.doubleChance ? 2 : 1
        results.push({ itemId: pick, quantity: qty, quality })
      }
    }

    return results
  }

  /** 解锁温室 */
  const unlockGreenhouse = (): boolean => {
    const playerStore = usePlayerStore()

    if (greenhouseUnlocked.value) return false

    for (const mat of GREENHOUSE_MATERIAL_COST) {
      if (getCombinedItemCount(mat.itemId) < mat.quantity) return false
    }
    if (!playerStore.spendMoney(GREENHOUSE_UNLOCK_COST)) return false

    for (const mat of GREENHOUSE_MATERIAL_COST) {
      removeCombinedItem(mat.itemId, mat.quantity)
    }

    greenhouseUnlocked.value = true
    // 初始化温室地块
    const farmStore = useFarmStore()
    farmStore.initGreenhouse()
    return true
  }

  /** 建造家造锻造工坊（§2.1） */
  const buildForgeWorkshop = (): boolean => {
    const playerStore = usePlayerStore()
    const skillStore = useSkillStore()
    if (forgeWorkshopBuilt.value) return false
    if (skillStore.getSkill('forging').level < FORGE_WORKSHOP_MIN_LEVEL) return false
    for (const mat of FORGE_WORKSHOP_MATERIAL_COST) {
      if (getCombinedItemCount(mat.itemId) < mat.quantity) return false
    }
    if (!playerStore.spendMoney(FORGE_WORKSHOP_UNLOCK_COST)) return false
    for (const mat of FORGE_WORKSHOP_MATERIAL_COST) {
      removeCombinedItem(mat.itemId, mat.quantity)
    }
    forgeWorkshopBuilt.value = true
    return true
  }

  /** 酒窖放入陈酿 */
  const startAging = (itemId: string, quality: Quality): boolean => {
    if (!hasCellar.value) return false
    if (cellarSlots.value.length >= cellarMaxSlots.value) return false
    if (!AGEABLE_ITEMS.includes(itemId)) return false

    const inventoryStore = useInventoryStore()
    if (!inventoryStore.removeItem(itemId, 1, quality)) return false

    cellarSlots.value.push({ itemId, originalQuality: quality, daysAging: 0, addedValue: 0, upgradeCount: 0 })
    return true
  }

  /** 酒窖取出陈酿 */
  const removeAging = (index: number): { itemId: string; quality: Quality; addedValue: number; upgradeCount: number } | null => {
    if (index < 0 || index >= cellarSlots.value.length) return null
    const slot = cellarSlots.value[index]!
    cellarSlots.value.splice(index, 1)
    // 增值铜钱直接入账
    if (slot.addedValue > 0) {
      const playerStore = usePlayerStore()
      playerStore.earnMoney(slot.addedValue)
    }
    return { itemId: slot.itemId, quality: slot.originalQuality, addedValue: slot.addedValue, upgradeCount: slot.upgradeCount }
  }

  /** 酒窖每日更新 */
  const dailyCellarUpdate = (): { upgraded: { itemId: string; addedValue: number; upgradeCount: number }[] } => {
    const upgraded: { itemId: string; addedValue: number; upgradeCount: number }[] = []

    for (const slot of cellarSlots.value) {
      slot.daysAging++
      if (slot.daysAging >= CELLAR_VALUE_CYCLE_DAYS) {
        slot.addedValue += cellarValuePerCycle.value
        slot.upgradeCount++
        slot.daysAging = 0
        upgraded.push({ itemId: slot.itemId, addedValue: slot.addedValue, upgradeCount: slot.upgradeCount })
      }
    }

    return { upgraded }
  }

  /** 升级酒窖 */
  const upgradeCellar = (): boolean => {
    const upgrade = nextCellarUpgrade.value
    if (!upgrade) return false

    const playerStore = usePlayerStore()
    for (const mat of upgrade.materialCost) {
      if (getCombinedItemCount(mat.itemId) < mat.quantity) return false
    }
    if (!playerStore.spendMoney(upgrade.cost)) return false

    for (const mat of upgrade.materialCost) {
      removeCombinedItem(mat.itemId, mat.quantity)
    }

    cellarLevel.value = upgrade.level
    return true
  }

  /** 升级山洞 */
  const upgradeCave = (): boolean => {
    const upgrade = nextCaveUpgrade.value
    if (!upgrade) return false
    if (!caveUnlocked.value) return false

    const playerStore = usePlayerStore()
    for (const mat of upgrade.materialCost) {
      if (getCombinedItemCount(mat.itemId) < mat.quantity) return false
    }
    if (!playerStore.spendMoney(upgrade.cost)) return false

    for (const mat of upgrade.materialCost) {
      removeCombinedItem(mat.itemId, mat.quantity)
    }

    caveLevel.value = upgrade.level
    return true
  }

  /** 获取厨房加成（Level 1+） */
  const getKitchenBonus = (): number => {
    return farmhouseLevel.value >= 1 ? 1.2 : 1.0
  }

  /** 获取睡眠恢复加成（Level 2+） */
  const getStaminaRecoveryBonus = (): number => {
    return farmhouseLevel.value >= 2 ? 0.1 : 0
  }

  const serialize = () => {
    return {
      farmhouseLevel: farmhouseLevel.value,
      caveChoice: caveChoice.value,
      caveUnlocked: caveUnlocked.value,
      greenhouseUnlocked: greenhouseUnlocked.value,
      forgeWorkshopBuilt: forgeWorkshopBuilt.value,
      cellarSlots: cellarSlots.value,
      cellarLevel: cellarLevel.value,
      caveLevel: caveLevel.value,
      caveDaysActive: caveDaysActive.value
    }
  }

  const deserialize = (data: any) => {
    farmhouseLevel.value = data.farmhouseLevel ?? 0
    caveChoice.value = data.caveChoice ?? 'none'
    caveUnlocked.value = data.caveUnlocked ?? false
    greenhouseUnlocked.value = data.greenhouseUnlocked ?? false
    forgeWorkshopBuilt.value = data.forgeWorkshopBuilt ?? false
    cellarLevel.value = data.cellarLevel ?? 1
    caveLevel.value = data.caveLevel ?? 1
    caveDaysActive.value = data.caveDaysActive ?? 0
    // 兼容旧存档：旧 slot 有 quality 无 originalQuality/addedValue/upgradeCount
    cellarSlots.value = (data.cellarSlots ?? []).map((s: any) => ({
      itemId: s.itemId,
      originalQuality: s.originalQuality ?? s.quality ?? 'normal',
      daysAging: s.daysAging ?? 0,
      addedValue: s.addedValue ?? 0,
      upgradeCount: s.upgradeCount ?? 0
    }))
    // 加载后如果温室已解锁，确保温室地块初始化
    if (greenhouseUnlocked.value) {
      const farmStore = useFarmStore()
      farmStore.initGreenhouse()
    }
  }

  return {
    farmhouseLevel,
    caveChoice,
    caveUnlocked,
    greenhouseUnlocked,
    forgeWorkshopBuilt,
    cellarSlots,
    cellarLevel,
    caveLevel,
    caveDaysActive,
    farmhouseName,
    nextUpgrade,
    hasCellar,
    cellarMaxSlots,
    cellarValuePerCycle,
    nextCellarUpgrade,
    caveName,
    caveQuality,
    nextCaveUpgrade,
    upgradeFarmhouse,
    unlockCave,
    chooseCave,
    dailyCaveUpdate,
    unlockGreenhouse,
    buildForgeWorkshop,
    startAging,
    removeAging,
    dailyCellarUpdate,
    upgradeCellar,
    upgradeCave,
    getKitchenBonus,
    getStaminaRecoveryBonus,
    serialize,
    deserialize
  }
})
