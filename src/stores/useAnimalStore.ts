import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { AnimalBuildingType, AnimalType, Animal, Quality, PetState, PetType, PetAbilityId, IncubationState } from '@/types'
import {
  ANIMAL_BUILDINGS,
  ANIMAL_DEFS,
  BUILDING_CAPACITY_PER_LEVEL,
  HAY_ITEM_ID,
  getBuildingUpgrade,
  INCUBATION_MAP,
  PREMIUM_FEED_ID,
  NOURISHING_FEED_ID,
  VITALITY_FEED_ID,
  FEED_DEFS
} from '@/data'
import {
  HORSE_BREEDS,
  getHorseBreed,
  getHorseBondFactor,
  HORSE_BOND_TIME_BONUS,
  HORSE_BOND_STAMINA_BONUS,
  HORSE_BOND_GRAZE_BONUS,
  type HorseBreed
} from '@/data/horses'
import {
  PET_MAX_FRIENDSHIP,
  PET_PETTING_FRIENDSHIP,
  PET_PETTING_STAMINA,
  PET_NEGLECT_FRIENDSHIP_LOSS,
  PET_FETCH_ITEMS,
  CROW_VISIT_CHANCE,
  isPetAbilityUnlocked,
  getPetFetchChance,
  getCatPestLimit
} from '@/data/pets'
import { usePlayerStore } from './usePlayerStore'
import { useInventoryStore } from './useInventoryStore'
import { useGameStore } from './useGameStore'
import { useSkillStore } from './useSkillStore'
import { useHiddenNpcStore } from './useHiddenNpcStore'
import { useFarmStore } from './useFarmStore'
import { getCombinedItemCount, removeCombinedItem } from '@/composables/useCombinedInventory'

export const useAnimalStore = defineStore('animal', () => {
  const buildings = ref<{ type: AnimalBuildingType; built: boolean; level: number }[]>([
    { type: 'coop', built: false, level: 0 },
    { type: 'barn', built: false, level: 0 },
    { type: 'stable', built: false, level: 0 }
  ])
  const animals = ref<Animal[]>([])

  /** 鸡舍孵化器状态 (同时最多1个) */
  const incubating = ref<IncubationState | null>(null)

  /** 牲口棚孵化器状态 (同时最多1个, barn level ≥ 2) */
  const barnIncubating = ref<IncubationState | null>(null)

  /** 宠物状态 */
  const pet = ref<PetState | null>(null)

  /** 今天是否已放牧 */
  const grazedToday = ref(false)

  /** 已安装自动抚摸机的建筑类型 */
  const autoPetterBuildings = ref<AnimalBuildingType[]>([])

  const coopBuilt = computed(() => buildings.value.find(b => b.type === 'coop')?.built ?? false)
  const barnBuilt = computed(() => buildings.value.find(b => b.type === 'barn')?.built ?? false)
  const stableBuilt = computed(() => buildings.value.find(b => b.type === 'stable')?.built ?? false)

  const coopAnimals = computed(() =>
    animals.value.filter(a => {
      const def = ANIMAL_DEFS.find(d => d.type === a.type)
      return def?.building === 'coop'
    })
  )

  const barnAnimals = computed(() =>
    animals.value.filter(a => {
      const def = ANIMAL_DEFS.find(d => d.type === a.type)
      return def?.building === 'barn'
    })
  )

  /** 获取马 */
  const getHorse = computed(() => animals.value.find(a => a.type === 'horse') ?? null)

  /** 是否拥有马 */
  const hasHorse = computed(() => getHorse.value !== null)

  /** 当前马匹品种定义（无马时按普通马，调用方需先判断 hasHorse） */
  const horseBreedDef = computed(() => getHorseBreed(getHorse.value?.horseBreed))

  /** 旅行耗时倍率：品种基础值 + 好感加成 */
  const getHorseTravelTimeMultiplier = (): number => {
    if (!getHorse.value) return 1
    const bond = getHorseBondFactor(getHorse.value.friendship)
    return Math.max(0.15, horseBreedDef.value.travelTimeMultiplier - bond * HORSE_BOND_TIME_BONUS)
  }

  /** 旅行体力倍率：品种基础值 + 好感加成 */
  const getHorseTravelStaminaMultiplier = (): number => {
    if (!getHorse.value) return 1
    const bond = getHorseBondFactor(getHorse.value.friendship)
    return Math.max(0.1, horseBreedDef.value.travelStaminaMultiplier - bond * HORSE_BOND_STAMINA_BONUS)
  }

  /** 放牧时马匹帮忙拢住牲口、额外带回产物的概率 */
  const getHorseGrazeBonusChance = (): number => {
    if (!getHorse.value) return 0
    const bond = getHorseBondFactor(getHorse.value.friendship)
    return horseBreedDef.value.grazeBonusChance + bond * HORSE_BOND_GRAZE_BONUS
  }

  /** 已获得的马匹品种（卖马、兑换新品种都不会丢，可随时切换） */
  const unlockedHorseBreeds = ref<HorseBreed[]>(['common'])

  /** 品种档次（HORSE_BREEDS 按档次从低到高排列） */
  const getBreedRank = (breed: HorseBreed | undefined): number => HORSE_BREEDS.findIndex(b => b.id === (breed ?? 'common'))

  /** 已获得品种中档次最高的（新买的马默认用它） */
  const bestUnlockedBreed = computed<HorseBreed>(() => {
    const owned = HORSE_BREEDS.filter(b => unlockedHorseBreeds.value.includes(b.id))
    return owned[owned.length - 1]?.id ?? 'common'
  })

  /** 记入已获得品种（去重、按档次排序，普通马始终在列） */
  const addUnlockedBreeds = (breeds: (HorseBreed | undefined)[]) => {
    const owned = new Set<HorseBreed>(['common', ...unlockedHorseBreeds.value])
    for (const breed of breeds) {
      if (breed && HORSE_BREEDS.some(b => b.id === breed)) owned.add(breed)
    }
    unlockedHorseBreeds.value = HORSE_BREEDS.filter(b => owned.has(b.id)).map(b => b.id)
  }

  /** 获得新品种（公会/瀚海兑换）：记入已获得品种，比现在的马好就直接换上 */
  const unlockHorseBreed = (breed: HorseBreed): { success: boolean; message: string } => {
    const def = getHorseBreed(breed)
    if (unlockedHorseBreeds.value.includes(breed)) return { success: false, message: `已拥有${def.name}。` }
    addUnlockedBreeds([breed])
    const horse = getHorse.value
    if (horse && getBreedRank(breed) > getBreedRank(horse.horseBreed)) {
      horse.horseBreed = breed
      return { success: true, message: `${horse.name}成为了${def.name}！` }
    }
    return { success: true, message: `获得${def.name}。` }
  }

  /** 切换马匹品种（只能在已获得的品种间切换） */
  const switchHorseBreed = (breed: HorseBreed): { success: boolean; message: string } => {
    const horse = getHorse.value
    if (!horse) return { success: false, message: '没有马。' }
    if (!unlockedHorseBreeds.value.includes(breed)) return { success: false, message: '未获得该品种。' }
    if ((horse.horseBreed ?? 'common') === breed) return { success: false, message: `已是${getHorseBreed(breed).name}。` }
    horse.horseBreed = breed
    return { success: true, message: `${horse.name}换成了${getHorseBreed(breed).name}。` }
  }

  /**
   * 读档补记：旧存档没有品种记录，按当前马匹与兑换记录还原。
   * 补回的品种比现在的马好就换上，返回提示；存档里已有的品种不动，不改玩家自己选的。
   */
  const restoreHorseUnlocks = (exchangedBreeds: HorseBreed[]): string | null => {
    const before = new Set(unlockedHorseBreeds.value)
    addUnlockedBreeds([getHorse.value?.horseBreed, ...exchangedBreeds])
    const best = [...unlockedHorseBreeds.value].reverse().find(b => !before.has(b))
    const horse = getHorse.value
    if (!horse || !best || getBreedRank(best) <= getBreedRank(horse.horseBreed)) return null
    horse.horseBreed = best
    return `${horse.name}成为了${getHorseBreed(best).name}！`
  }

  /** 建造畜舍 */
  const buildBuilding = (type: AnimalBuildingType): boolean => {
    const playerStore = usePlayerStore()

    const b = buildings.value.find(b => b.type === type)
    if (!b || b.built) return false

    const def = ANIMAL_BUILDINGS.find(d => d.type === type)
    if (!def) return false

    // 检查材料
    for (const mat of def.materialCost) {
      if (getCombinedItemCount(mat.itemId) < mat.quantity) return false
    }
    // 检查铜钱
    if (!playerStore.spendMoney(def.cost)) return false

    // 扣除材料
    for (const mat of def.materialCost) {
      removeCombinedItem(mat.itemId, mat.quantity)
    }

    b.built = true
    b.level = 1
    return true
  }

  /** 升级畜舍 */
  const upgradeBuilding = (type: AnimalBuildingType): boolean => {
    const playerStore = usePlayerStore()

    const b = buildings.value.find(b => b.type === type)
    if (!b || !b.built || b.level >= 3) return false

    const upgrade = getBuildingUpgrade(type, b.level + 1)
    if (!upgrade) return false

    for (const mat of upgrade.materialCost) {
      if (getCombinedItemCount(mat.itemId) < mat.quantity) return false
    }
    if (!playerStore.spendMoney(upgrade.cost)) return false

    for (const mat of upgrade.materialCost) {
      removeCombinedItem(mat.itemId, mat.quantity)
    }

    b.level++
    return true
  }

  /** 购买动物 */
  const buyAnimal = (animalType: AnimalType, customName: string): boolean => {
    const playerStore = usePlayerStore()

    const def = ANIMAL_DEFS.find(d => d.type === animalType)
    if (!def) return false

    // 检查容量 (level × BUILDING_CAPACITY_PER_LEVEL, 马厩固定1)
    const building = buildings.value.find(b => b.type === def.building)
    if (!building?.built) return false
    const maxCapacity = def.building === 'stable' ? 1 : building.level * BUILDING_CAPACITY_PER_LEVEL
    const currentCount = animals.value.filter(a => {
      const aDef = ANIMAL_DEFS.find(d => d.type === a.type)
      return aDef?.building === def.building
    }).length
    if (currentCount >= maxCapacity) return false

    // 检查铜钱
    if (!playerStore.spendMoney(def.cost)) return false

    animals.value.push({
      id: `${animalType}_${Date.now()}`,
      type: animalType,
      name: customName || def.name,
      friendship: 0,
      mood: 128,
      daysOwned: 0,
      daysSinceProduct: 0,
      wasFed: false,
      fedWith: null,
      wasPetted: false,
      hunger: 0,
      sick: false,
      sickDays: 0,
      // 新买的马用已获得的最好品种
      ...(animalType === 'horse' ? { horseBreed: bestUnlockedBreed.value } : {})
    })
    return true
  }

  /** 默认饲料：一键喂食、雇工、配偶、知己都按它喂 */
  const preferredFeed = ref<string>(HAY_ITEM_ID)

  /** 设定默认饲料 */
  const setPreferredFeed = (feedId: string) => {
    if (FEED_DEFS.some(f => f.id === feedId)) preferredFeed.value = feedId
  }

  /**
   * 喂食所有未喂的动物（马也需要喂食；从背包+仓库箱子取饲料）。
   * 默认用设定的饲料，不足时补干草；used 为各饲料实际用量。
   */
  const feedAll = (feedId: string = preferredFeed.value): { fedCount: number; noFeedCount: number; used: Record<string, number> } => {
    let fedCount = 0
    let noFeedCount = 0
    const used: Record<string, number> = {}
    const feedOrder = feedId === HAY_ITEM_ID ? [HAY_ITEM_ID] : [feedId, HAY_ITEM_ID]
    const unfed = animals.value.filter(a => !a.wasFed)

    for (const animal of unfed) {
      let fedWith: string | null = null
      for (const id of feedOrder) {
        if (removeCombinedItem(id, 1)) {
          fedWith = id
          break
        }
      }
      if (!fedWith) {
        noFeedCount++
        continue
      }
      animal.wasFed = true
      animal.fedWith = fedWith
      animal.hunger = 0
      used[fedWith] = (used[fedWith] ?? 0) + 1
      fedCount++
    }
    return { fedCount, noFeedCount, used }
  }

  /** 喂食单只动物 */
  const feedAnimal = (animalId: string, feedId: string = HAY_ITEM_ID): boolean => {
    const animal = animals.value.find(a => a.id === animalId)
    if (!animal || animal.wasFed) return false
    if (!removeCombinedItem(feedId, 1)) return false
    animal.wasFed = true
    animal.fedWith = feedId
    animal.hunger = 0
    return true
  }

  /** 抚摸动物 */
  const petAnimal = (animalId: string): boolean => {
    const animal = animals.value.find(a => a.id === animalId)
    if (!animal || animal.wasPetted) return false
    animal.wasPetted = true
    const coopmasterBonus = useSkillStore().getSkill('farming').perk10 === 'coopmaster' ? 1.5 : 1.0
    animal.friendship = Math.min(1000, animal.friendship + Math.floor(5 * coopmasterBonus))
    return true
  }

  /** 一键抚摸所有动物+宠物，返回抚摸数量与摸宠物恢复的体力 */
  const petAllAnimals = (): { count: number; staminaGained: number } => {
    const coopmasterBonus = useSkillStore().getSkill('farming').perk10 === 'coopmaster' ? 1.5 : 1.0
    let count = 0
    for (const animal of animals.value) {
      if (animal.wasPetted) continue
      animal.wasPetted = true
      animal.friendship = Math.min(1000, animal.friendship + Math.floor(5 * coopmasterBonus))
      count++
    }
    let staminaGained = 0
    if (pet.value && !pet.value.wasPetted) {
      staminaGained = strokePet(pet.value)
      count++
    }
    return { count, staminaGained }
  }

  // ============================================================
  // 孵化器
  // ============================================================

  /** 开始鸡舍孵化 (需鸡舍 ≥ 2 级, 仅限 coop 类蛋) */
  const startIncubation = (itemId: string): { success: boolean; message: string } => {
    const coopBuilding = buildings.value.find(b => b.type === 'coop')
    if (!coopBuilding?.built || coopBuilding.level < 2) {
      return { success: false, message: '需要大型鸡舍（2级）才能使用孵化器。' }
    }
    if (incubating.value) {
      return { success: false, message: '孵化器中已有蛋在孵化。' }
    }
    const mapping = INCUBATION_MAP[itemId]
    if (!mapping || mapping.building !== 'coop') {
      return { success: false, message: '这个物品不能在鸡舍孵化。' }
    }

    const inventoryStore = useInventoryStore()
    if (!inventoryStore.removeItem(itemId, 1)) {
      return { success: false, message: '背包中没有这个物品。' }
    }

    // coopmaster 专精减半孵化时间
    const skillStore = useSkillStore()
    const hasCoopmaster = skillStore.getSkill('farming').perk10 === 'coopmaster'
    const days = hasCoopmaster ? Math.ceil(mapping.days / 2) : mapping.days

    incubating.value = {
      itemId,
      animalType: mapping.animalType,
      daysLeft: days
    }
    const animalDef = ANIMAL_DEFS.find(d => d.type === mapping.animalType)
    return {
      success: true,
      message: `开始孵化${animalDef?.name ?? '动物'}，预计${days}天后孵出。`
    }
  }

  /** 每日孵化器更新 */
  const dailyIncubatorUpdate = (): {
    hatched?: { type: AnimalType; name: string }
  } => {
    if (!incubating.value) return {}

    incubating.value.daysLeft--
    if (incubating.value.daysLeft <= 0) {
      const { animalType, itemId } = incubating.value
      const def = ANIMAL_DEFS.find(d => d.type === animalType)

      // 检查容量
      const building = buildings.value.find(b => b.type === 'coop')
      const maxCapacity = (building?.level ?? 0) * 4
      const currentCount = coopAnimals.value.length

      if (currentCount >= maxCapacity) {
        // 容量满，退回蛋
        const inventoryStore = useInventoryStore()
        inventoryStore.addItem(itemId, 1)
        incubating.value = null
        return {}
      }

      const count = animals.value.filter(a => a.type === animalType).length
      const name = `${def?.name ?? '动物'}${count + 1}`
      animals.value.push({
        id: `${animalType}_${Date.now()}`,
        type: animalType,
        name,
        friendship: 0,
        mood: 200,
        daysOwned: 0,
        daysSinceProduct: 0,
        wasFed: false,
        fedWith: null,
        wasPetted: false,
        hunger: 0,
        sick: false,
        sickDays: 0
      })
      incubating.value = null
      return { hatched: { type: animalType, name } }
    }

    return {}
  }

  /** 开始牲口棚孵化 (需牲口棚 ≥ 2 级, 仅限 barn 类蛋) */
  const startBarnIncubation = (itemId: string): { success: boolean; message: string } => {
    const barnBuilding = buildings.value.find(b => b.type === 'barn')
    if (!barnBuilding?.built || barnBuilding.level < 2) {
      return {
        success: false,
        message: '需要大型牲口棚（2级）才能使用孵化器。'
      }
    }
    if (barnIncubating.value) {
      return { success: false, message: '牲口棚孵化器中已有蛋在孵化。' }
    }
    const mapping = INCUBATION_MAP[itemId]
    if (!mapping || mapping.building !== 'barn') {
      return { success: false, message: '这个物品不能在牲口棚孵化。' }
    }

    const inventoryStore = useInventoryStore()
    if (!inventoryStore.removeItem(itemId, 1)) {
      return { success: false, message: '背包中没有这个物品。' }
    }

    const skillStore = useSkillStore()
    const hasCoopmaster = skillStore.getSkill('farming').perk10 === 'coopmaster'
    const days = hasCoopmaster ? Math.ceil(mapping.days / 2) : mapping.days

    barnIncubating.value = {
      itemId,
      animalType: mapping.animalType,
      daysLeft: days
    }
    const animalDef = ANIMAL_DEFS.find(d => d.type === mapping.animalType)
    return {
      success: true,
      message: `开始在牲口棚孵化${animalDef?.name ?? '动物'}，预计${days}天后孵出。`
    }
  }

  /** 每日牲口棚孵化器更新 */
  const dailyBarnIncubatorUpdate = (): {
    hatched?: { type: AnimalType; name: string }
  } => {
    if (!barnIncubating.value) return {}

    barnIncubating.value.daysLeft--
    if (barnIncubating.value.daysLeft <= 0) {
      const { animalType, itemId } = barnIncubating.value
      const def = ANIMAL_DEFS.find(d => d.type === animalType)

      const building = buildings.value.find(b => b.type === 'barn')
      const maxCapacity = (building?.level ?? 0) * 4
      const currentCount = barnAnimals.value.length

      if (currentCount >= maxCapacity) {
        const inventoryStore = useInventoryStore()
        inventoryStore.addItem(itemId, 1)
        barnIncubating.value = null
        return {}
      }

      const count = animals.value.filter(a => a.type === animalType).length
      const name = `${def?.name ?? '动物'}${count + 1}`
      animals.value.push({
        id: `${animalType}_${Date.now()}`,
        type: animalType,
        name,
        friendship: 0,
        mood: 200,
        daysOwned: 0,
        daysSinceProduct: 0,
        wasFed: false,
        fedWith: null,
        wasPetted: false,
        hunger: 0,
        sick: false,
        sickDays: 0
      })
      barnIncubating.value = null
      return { hatched: { type: animalType, name } }
    }

    return {}
  }

  // ============================================================
  // 宠物
  // ============================================================

  /** 领养宠物 */
  const adoptPet = (type: PetType, name: string) => {
    pet.value = { type, name, friendship: 0, wasPetted: false }
  }

  /** 宠物当前是否已解锁某项能力 */
  const hasPetAbility = (id: PetAbilityId): boolean => {
    if (!pet.value) return false
    return isPetAbilityUnlocked(pet.value.type, id, pet.value.friendship)
  }

  /** 摸一下宠物：加好感、恢复体力（不超上限），返回实际恢复的体力 */
  const strokePet = (target: PetState): number => {
    target.wasPetted = true
    target.friendship = Math.min(PET_MAX_FRIENDSHIP, target.friendship + PET_PETTING_FRIENDSHIP)
    const playerStore = usePlayerStore()
    const before = playerStore.stamina
    playerStore.restoreStamina(PET_PETTING_STAMINA)
    return playerStore.stamina - before
  }

  /** 抚摸宠物 */
  const petThePet = (): { success: boolean; staminaGained: number } => {
    if (!pet.value || pet.value.wasPetted) return { success: false, staminaGained: 0 }
    return { success: true, staminaGained: strokePet(pet.value) }
  }

  /**
   * 狗看家：代替当晚的乌鸦袭击判定。乌鸦按原概率来（有稻草人或田里没作物时不来），
   * 来了就被赶走，作物无损。返回是否赶走了乌鸦。
   */
  const dogScaresOffCrow = (): boolean => {
    if (!hasPetAbility('guard')) return false
    const farmStore = useFarmStore()
    if (farmStore.scarecrows > 0) return false
    if (Math.random() > CROW_VISIT_CHANCE) return false
    return farmStore.plots.some(p => !!p.cropId && (p.state === 'planted' || p.state === 'growing' || p.state === 'harvestable'))
  }

  /** 猫捕虫：清除普通农田的虫害，先清感染最久的，返回清除处数 */
  const catchFarmPests = (limit: number): number => {
    const farmStore = useFarmStore()
    const targets = farmStore.plots
      .filter(p => p.infested)
      .sort((a, b) => b.infestedDays - a.infestedDays)
      .slice(0, limit)
    let cleared = 0
    for (const plot of targets) {
      if (farmStore.curePest(plot.id)) cleared++
    }
    return cleared
  }

  /** 叼物：按好感档位掷骰，命中则放入背包，返回物品 id */
  const rollPetFetch = (current: PetState): string | undefined => {
    if (Math.random() >= getPetFetchChance(current.friendship)) return undefined
    const pool = PET_FETCH_ITEMS[current.type]
    const item = pool[Math.floor(Math.random() * pool.length)]
    if (!item || !useInventoryStore().addItem(item, 1)) return undefined
    return item
  }

  /** 每日宠物更新：好感结算、猫捕虫、叼物 */
  const dailyPetUpdate = (): { item?: string; pestsCleared: number } => {
    const current = pet.value
    if (!current) return { pestsCleared: 0 }

    // 未抚摸扣好感
    if (!current.wasPetted) {
      current.friendship = Math.max(0, current.friendship - PET_NEGLECT_FRIENDSHIP_LOSS)
    }
    current.wasPetted = false

    const pestsCleared = hasPetAbility('pest') ? catchFarmPests(getCatPestLimit(current.friendship)) : 0
    return { item: rollPetFetch(current), pestsCleared }
  }

  // ============================================================
  // 放牧
  // ============================================================

  /** 放牧（春/夏/秋非雨天；冬季仅牦牛可放牧） */
  const grazeAnimals = (): {
    success: boolean
    count: number
    message: string
    bonusProducts?: { itemId: string; quality: Quality }[]
  } => {
    if (grazedToday.value) {
      return { success: false, count: 0, message: '今天已经放牧过了。' }
    }

    const gameStore = useGameStore()
    if (gameStore.isRainy) {
      return { success: false, count: 0, message: '雨天不能放牧。' }
    }

    // 只有喂食过的动物可放牧（排除马）
    let grazeable: Animal[]
    if (gameStore.season === 'winter') {
      // 冬季仅牦牛可放牧
      grazeable = animals.value.filter(a => a.wasFed && a.type === 'yak')
      if (grazeable.length === 0) {
        return {
          success: false,
          count: 0,
          message: '冬天只有牦牛可以放牧，且需先喂食。'
        }
      }
    } else {
      grazeable = animals.value.filter(a => a.wasFed && a.type !== 'horse')
      if (grazeable.length === 0) {
        return {
          success: false,
          count: 0,
          message: '没有已喂食的动物可放牧。'
        }
      }
    }

    grazedToday.value = true
    const bonusProducts: { itemId: string; quality: Quality }[] = []

    for (const animal of grazeable) {
      animal.mood = 255
      animal.friendship = Math.min(1000, animal.friendship + 10)

      // 猪放牧时额外找到松露
      if (animal.type === 'pig') {
        bonusProducts.push({
          itemId: 'truffle',
          quality: getAnimalProductQuality(animal.friendship)
        })
      }
    }

    // 马会跟着出去把牲口拢住，顺手带回些产物——好马和熟马带回得更多
    const horseChance = getHorseGrazeBonusChance()
    let horseHelped = 0
    if (horseChance > 0) {
      for (const animal of grazeable) {
        const def = ANIMAL_DEFS.find(d => d.type === animal.type)
        if (!def?.productId) continue
        if (Math.random() >= horseChance) continue
        bonusProducts.push({
          itemId: def.productId,
          quality: getAnimalProductQuality(animal.friendship)
        })
        horseHelped++
      }
    }

    // 将猪找到的松露直接加入背包
    if (bonusProducts.length > 0) {
      const inventoryStore = useInventoryStore()
      for (const bp of bonusProducts) {
        inventoryStore.addItem(bp.itemId, 1, bp.quality)
      }
    }

    const pigCount = bonusProducts.length - horseHelped
    let message = `${grazeable.length}只动物在草地上愉快地觅食。`
    if (pigCount > 0) {
      message += `猪找到了${pigCount}个松露！`
    }
    if (horseHelped > 0) {
      message += `${getHorse.value?.name ?? '马'}帮着照看畜群，多收了${horseHelped}份产物。`
    }

    return {
      success: true,
      count: grazeable.length,
      message,
      bonusProducts: bonusProducts.length > 0 ? bonusProducts : undefined
    }
  }

  /** 饥饿致死天数上限 */
  const HUNGER_DEATH_DAYS = 7
  /** 连续饥饿≥此天数时有概率生病 */
  const HUNGER_SICK_THRESHOLD = 3
  /** 每天生病概率（饥饿≥阈值时） */
  const SICK_CHANCE = 0.3
  /** 连续生病致死天数上限 */
  const SICK_DEATH_DAYS = 5

  /** 每日更新：产品收集、心情/友好度变化、饥饿/生病/死亡 */
  const dailyUpdate = (): {
    products: { itemId: string; quality: Quality }[]
    died: string[]
    gotSick: string[]
    healed: string[]
  } => {
    const products: { itemId: string; quality: Quality }[] = []
    const died: string[] = []
    const gotSick: string[] = []
    const healed: string[] = []
    const skillStore = useSkillStore()
    const gameStore = useGameStore()
    const coopmasterBonus = skillStore.getSkill('farming').perk10 === 'coopmaster' ? 1.5 : 1.0
    const hasShepherd = skillStore.getSkill('farming').perk10 === 'shepherd'
    for (const animal of animals.value) {
      animal.daysOwned++
      animal.daysSinceProduct++

      // === 饥饿系统 ===
      if (!animal.wasFed) {
        animal.hunger++
        // 骆驼夏季耐饿：饥饿增长减半（向下取整，至少+1已在上面）
        if (animal.type === 'camel' && gameStore.season === 'summer' && animal.hunger > 1) {
          animal.hunger = Math.max(1, animal.hunger - 1)
        }
      } else {
        // 喂食后饥饿归零
        animal.hunger = 0
        // 喂食后治愈疾病：活力饲料100%，其他50%
        if (animal.sick) {
          const cureChance = animal.fedWith === VITALITY_FEED_ID ? 1.0 : 0.5
          if (Math.random() < cureChance) {
            animal.sick = false
            animal.sickDays = 0
            healed.push(animal.name)
          }
        }
      }

      // 饥饿达到阈值时有概率生病
      if (animal.hunger >= HUNGER_SICK_THRESHOLD && !animal.sick && Math.random() < SICK_CHANCE) {
        // 草甸田庄：动物不会因饥饿生病
        if (gameStore.farmMapType !== 'meadowlands') {
          animal.sick = true
          animal.sickDays = 0
          gotSick.push(animal.name)
        }
      }

      // 生病天数累计
      if (animal.sick) {
        animal.sickDays++
      }

      // 饥饿致死 或 久病致死
      if (animal.hunger >= HUNGER_DEATH_DAYS || animal.sickDays >= SICK_DEATH_DAYS) {
        died.push(animal.name)
        continue // 跳过后续处理，后面统一移除
      }

      // 友好度变化
      const friendshipMultiplier = gameStore.farmMapType === 'meadowlands' ? 1.5 : 1.0
      // 仙缘能力：灵抚（gui_nv_3）动物好感获取+25%
      const spiritFriendshipBonus = 1 + useHiddenNpcStore().getAbilityValue('gui_nv_3') / 100

      // 自动抚摸机：若所在建筑已安装，自动标记已抚摸
      if (!animal.wasPetted) {
        const animalDef = ANIMAL_DEFS.find(d => d.type === animal.type)
        if (animalDef && autoPetterBuildings.value.includes(animalDef.building)) {
          animal.wasPetted = true
        }
      }

      if (!animal.wasFed) {
        animal.friendship = Math.max(0, animal.friendship - 10)
      }
      // 牦牛: 未抚摸不扣友好度
      if (!animal.wasPetted && animal.type !== 'yak') {
        animal.friendship = Math.max(0, animal.friendship - 5)
      }
      // 生病时友好度额外下降
      if (animal.sick) {
        animal.friendship = Math.max(0, animal.friendship - 10)
      }
      if (animal.wasFed && animal.wasPetted) {
        const base = animal.fedWith === PREMIUM_FEED_ID ? 25 : 15
        animal.friendship = Math.min(
          1000,
          animal.friendship + Math.floor(base * friendshipMultiplier * coopmasterBonus * spiritFriendshipBonus)
        )
      } else if (animal.wasFed) {
        const base = animal.fedWith === PREMIUM_FEED_ID ? 10 : 5
        animal.friendship = Math.min(
          1000,
          animal.friendship + Math.floor(base * friendshipMultiplier * coopmasterBonus * spiritFriendshipBonus)
        )
      }

      // 心情根据喂食调整
      // 骆驼: 夏季未喂食不扣心情(耐热)
      if (animal.wasFed) {
        const moodGain = animal.fedWith === PREMIUM_FEED_ID ? 60 : 30
        animal.mood = Math.min(255, animal.mood + moodGain)
      } else if (animal.type === 'camel' && gameStore.season === 'summer') {
        // 骆驼夏季耐热，未喂食不扣心情
      } else {
        animal.mood = Math.max(0, animal.mood - 50)
      }
      // 生病时心情额外下降
      if (animal.sick) {
        animal.mood = Math.max(0, animal.mood - 30)
      }

      // 产品检查（跳过马，马无产出；生病时不产出）
      const def = ANIMAL_DEFS.find(d => d.type === animal.type)
      if (def && def.produceDays > 0 && animal.wasFed && !animal.sick) {
        const effectiveDays = animal.fedWith === NOURISHING_FEED_ID ? Math.max(1, def.produceDays - 1) : def.produceDays
        if (animal.daysSinceProduct >= effectiveDays) {
          let quality = getAnimalProductQuality(animal.friendship)
          // 牧羊人专精：品质提升一档
          if (hasShepherd) {
            const qualityOrder: Quality[] = ['normal', 'fine', 'excellent', 'supreme']
            const idx = qualityOrder.indexOf(quality)
            quality = qualityOrder[Math.min(idx + 1, qualityOrder.length - 1)]!
          }
          // 仙缘结缘：灵织（animal_blessing）动物产品品质+1
          const animalBondBonus = useHiddenNpcStore().getBondBonusByType('animal_blessing')
          if (animalBondBonus?.type === 'animal_blessing' && Math.random() < animalBondBonus.chance) {
            const qualityOrder2: Quality[] = ['normal', 'fine', 'excellent', 'supreme']
            const idx2 = qualityOrder2.indexOf(quality)
            if (idx2 < qualityOrder2.length - 1) quality = qualityOrder2[idx2 + 1]!
          }
          products.push({ itemId: def.productId, quality })
          animal.daysSinceProduct = 0

          // 草甸田庄：40%概率额外产出1件
          if (gameStore.farmMapType === 'meadowlands' && Math.random() < 0.4) {
            products.push({ itemId: def.productId, quality })
          }
        }
      }

      // 兔子: 好感≥600时4%概率额外产出幸运兔脚
      if (animal.type === 'rabbit' && animal.friendship >= 600 && !animal.sick && Math.random() < 0.04) {
        products.push({
          itemId: 'rabbit_foot',
          quality: getAnimalProductQuality(animal.friendship)
        })
      }

      // 重置每日状态
      animal.wasFed = false
      animal.fedWith = null
      animal.wasPetted = false
    }

    // 移除死亡的动物（饿死或病死）
    if (died.length > 0) {
      animals.value = animals.value.filter(a => a.hunger < HUNGER_DEATH_DAYS && a.sickDays < SICK_DEATH_DAYS)
    }

    // 重置放牧状态
    grazedToday.value = false

    // 自动抚摸机：为新一天预设抚摸状态，使 UI 正确显示「已摸」
    for (const animal of animals.value) {
      const animalDef = ANIMAL_DEFS.find(d => d.type === animal.type)
      if (animalDef && autoPetterBuildings.value.includes(animalDef.building)) {
        animal.wasPetted = true
      }
    }

    return { products, died, gotSick, healed }
  }

  /** 出售动物，返还购买价的一半 */
  const sellAnimal = (animalId: string): { success: boolean; refund: number; name: string } => {
    const idx = animals.value.findIndex(a => a.id === animalId)
    if (idx === -1) return { success: false, refund: 0, name: '' }
    const animal = animals.value[idx]!
    const def = ANIMAL_DEFS.find(d => d.type === animal.type)
    const refund = Math.floor((def?.cost ?? 0) / 2)
    const name = animal.name
    animals.value.splice(idx, 1)
    if (refund > 0) {
      const playerStore = usePlayerStore()
      playerStore.earnMoney(refund)
    }
    return { success: true, refund, name }
  }

  /** 治疗单只生病的动物（消耗1个兽药） */
  const healAnimal = (animalId: string): boolean => {
    const animal = animals.value.find(a => a.id === animalId)
    if (!animal || !animal.sick) return false
    const inventoryStore = useInventoryStore()
    if (!inventoryStore.removeItem('animal_medicine', 1)) return false
    animal.sick = false
    animal.sickDays = 0
    return true
  }

  /** 治疗所有生病的动物（批量消耗兽药） */
  const healAllSick = (): { healedCount: number; noMedicineCount: number } => {
    const inventoryStore = useInventoryStore()
    let healedCount = 0
    let noMedicineCount = 0
    for (const animal of animals.value.filter(a => a.sick)) {
      if (inventoryStore.removeItem('animal_medicine', 1)) {
        animal.sick = false
        animal.sickDays = 0
        healedCount++
      } else {
        noMedicineCount++
      }
    }
    return { healedCount, noMedicineCount }
  }

  /** 根据友好度决定产品品质 */
  const getAnimalProductQuality = (friendship: number): Quality => {
    if (friendship >= 800) return 'supreme'
    if (friendship >= 500) return 'excellent'
    if (friendship >= 200) return 'fine'
    return 'normal'
  }

  /** 修改动物名称（id='pet' 表示宠物） */
  const renameAnimal = (id: string, newName: string): boolean => {
    const trimmed = newName.trim()
    if (!trimmed || trimmed.length > 8) return false
    if (id === 'pet' && pet.value) {
      pet.value.name = trimmed
      return true
    }
    const animal = animals.value.find(a => a.id === id)
    if (animal) {
      animal.name = trimmed
      return true
    }
    return false
  }

  /** 检查指定建筑是否已安装自动抚摸机 */
  const hasAutoPetter = (buildingType: AnimalBuildingType): boolean => {
    return autoPetterBuildings.value.includes(buildingType)
  }

  /** 安装自动抚摸机到指定建筑 */
  const installAutoPetter = (buildingType: AnimalBuildingType): { success: boolean; message: string } => {
    if (buildingType === 'stable') return { success: false, message: '马厩不能安装自动抚摸机。' }
    const building = buildings.value.find(b => b.type === buildingType)
    if (!building || !building.built) return { success: false, message: '需要先建造畜舍。' }
    if (building.level < 2) return { success: false, message: '需要大型畜舍（2级）才能安装。' }
    if (autoPetterBuildings.value.includes(buildingType)) return { success: false, message: '该畜舍已安装自动抚摸机。' }
    autoPetterBuildings.value.push(buildingType)
    return {
      success: true,
      message: `自动抚摸机已安装到${buildingType === 'coop' ? '鸡舍' : '牧场'}。`
    }
  }

  const serialize = () => {
    return {
      buildings: buildings.value,
      animals: animals.value,
      incubating: incubating.value,
      barnIncubating: barnIncubating.value,
      pet: pet.value,
      grazedToday: grazedToday.value,
      autoPetterBuildings: autoPetterBuildings.value,
      preferredFeed: preferredFeed.value,
      unlockedHorseBreeds: unlockedHorseBreeds.value
    }
  }

  const deserialize = (data: any) => {
    if (data.buildings) {
      const savedBuildings = data.buildings.map((b: any) => ({
        ...b,
        level: b.level && b.level > 0 ? b.level : b.built ? 1 : 0
      }))
      // 兼容旧存档：补充缺少的 stable 建筑
      const savedTypes = new Set(savedBuildings.map((b: any) => b.type))
      if (!savedTypes.has('stable')) {
        savedBuildings.push({ type: 'stable', built: false, level: 0 })
      }
      buildings.value = savedBuildings
    }
    if (data.animals) {
      animals.value = data.animals.map((a: any) => ({
        ...a,
        hunger: a.hunger ?? 0,
        sick: a.sick ?? false,
        sickDays: a.sickDays ?? 0,
        fedWith: a.fedWith ?? null
      }))
    }
    incubating.value = data.incubating ?? null
    barnIncubating.value = data.barnIncubating ?? null
    pet.value = data.pet ?? null
    grazedToday.value = data.grazedToday ?? false
    autoPetterBuildings.value = data.autoPetterBuildings ?? []
    preferredFeed.value = FEED_DEFS.some(f => f.id === data.preferredFeed) ? data.preferredFeed : HAY_ITEM_ID
    unlockedHorseBreeds.value = ['common']
    addUnlockedBreeds([...(Array.isArray(data.unlockedHorseBreeds) ? data.unlockedHorseBreeds : []), getHorse.value?.horseBreed])
  }

  return {
    buildings,
    animals,
    incubating,
    barnIncubating,
    pet,
    grazedToday,
    coopBuilt,
    barnBuilt,
    stableBuilt,
    coopAnimals,
    barnAnimals,
    getHorse,
    hasHorse,
    horseBreedDef,
    getHorseTravelTimeMultiplier,
    getHorseTravelStaminaMultiplier,
    getHorseGrazeBonusChance,
    unlockedHorseBreeds,
    bestUnlockedBreed,
    unlockHorseBreed,
    switchHorseBreed,
    restoreHorseUnlocks,
    preferredFeed,
    setPreferredFeed,
    buildBuilding,
    upgradeBuilding,
    buyAnimal,
    sellAnimal,
    healAnimal,
    healAllSick,
    feedAll,
    feedAnimal,
    petAnimal,
    petAllAnimals,
    startIncubation,
    dailyIncubatorUpdate,
    startBarnIncubation,
    dailyBarnIncubatorUpdate,
    adoptPet,
    hasPetAbility,
    petThePet,
    dogScaresOffCrow,
    dailyPetUpdate,
    grazeAnimals,
    dailyUpdate,
    getAnimalProductQuality,
    renameAnimal,
    autoPetterBuildings,
    hasAutoPetter,
    installAutoPetter,
    serialize,
    deserialize
  }
})
