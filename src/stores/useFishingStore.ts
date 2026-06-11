import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type {
  FishDef,
  BaitType,
  TackleType,
  BaitDef,
  TackleDef,
  ToolTier,
  Quality,
  FishingLocation,
  CrabPotState,
  MiniGameParams,
  MiniGameRating
} from '@/types'
import { getAvailableFish, getBaitById, getTackleById, getItemById } from '@/data'
import { FISH } from '@/data/fish'
import { useGameStore } from './useGameStore'
import { usePlayerStore } from './usePlayerStore'
import { useInventoryStore } from './useInventoryStore'
import { useSkillStore } from './useSkillStore'
import { useAchievementStore } from './useAchievementStore'
import { useQuestStore } from './useQuestStore'
import { useCookingStore } from './useCookingStore'
import { useWalletStore } from './useWalletStore'
import { useSecretNoteStore } from './useSecretNoteStore'
import { useHiddenNpcStore } from './useHiddenNpcStore'
import { useSystemStore } from './useSystemStore'
import { getMeritBonus } from '@/composables/useMeritEffects'
import { rollFishWeight } from '@/composables/rollFishWeight'
import { useShopStore } from './useShopStore'

const STAMINA_COST = 4
const MAX_CRAB_POTS = 12
const MAX_CRAB_POTS_PER_LOCATION = 3

/** 蟹笼产物池 */
const CRAB_POT_LOOT: { itemId: string; weight: number; locationOverride?: FishingLocation; replaces?: string }[] = [
  { itemId: 'snail', weight: 20 },
  { itemId: 'freshwater_shrimp', weight: 25 },
  { itemId: 'crab', weight: 20 },
  { itemId: 'lobster', weight: 10 },
  { itemId: 'trash', weight: 10 },
  { itemId: 'driftwood', weight: 10 },
  { itemId: 'broken_cd', weight: 5 },
  { itemId: 'soggy_newspaper', weight: 8 },
  { itemId: 'cave_shrimp', weight: 25, locationOverride: 'mine', replaces: 'freshwater_shrimp' },
  { itemId: 'swamp_crab', weight: 20, locationOverride: 'swamp', replaces: 'crab' }
]

/** 钓鱼垃圾池 */
const FISHING_JUNK = ['trash', 'driftwood', 'broken_cd', 'soggy_newspaper']

/** 宝箱奖品池 */
const TREASURE_POOL: { itemId: string | null; weight: number; minQty: number; maxQty: number; money?: number }[] = [
  { itemId: 'copper_ore', weight: 30, minQty: 1, maxQty: 3 },
  { itemId: 'iron_ore', weight: 20, minQty: 1, maxQty: 3 },
  { itemId: 'gold_ore', weight: 10, minQty: 1, maxQty: 2 },
  { itemId: 'crystal_ore', weight: 5, minQty: 1, maxQty: 1 },
  { itemId: 'jade', weight: 3, minQty: 1, maxQty: 1 },
  { itemId: 'quartz', weight: 5, minQty: 1, maxQty: 1 },
  { itemId: 'wood', weight: 15, minQty: 3, maxQty: 5 },
  { itemId: 'firewood', weight: 10, minQty: 2, maxQty: 4 },
  { itemId: 'standard_bait', weight: 10, minQty: 2, maxQty: 3 },
  { itemId: 'wild_berry', weight: 8, minQty: 1, maxQty: 2 },
  { itemId: 'herb', weight: 8, minQty: 1, maxQty: 2 },
  { itemId: 'ginseng', weight: 3, minQty: 1, maxQty: 1 },
  { itemId: null, weight: 10, minQty: 50, maxQty: 200 }
]

export const useFishingStore = defineStore('fishing', () => {
  const gameStore = useGameStore()
  const playerStore = usePlayerStore()
  const inventoryStore = useInventoryStore()
  const skillStore = useSkillStore()

  /** 当前钓鱼地点 */
  const fishingLocation = ref<FishingLocation>('creek')

  /** 切换钓鱼地点 */
  const setLocation = (loc: FishingLocation) => {
    fishingLocation.value = loc
  }

  /** 当前可钓的鱼 */
  const availableFish = computed(() => getAvailableFish(gameStore.season, gameStore.weather, fishingLocation.value))

  /** 当前钓鱼会话状态 */
  const currentFish = ref<FishDef | null>(null)

  /** 上次钓鱼的宝箱结果 */
  const lastTreasure = ref<{ items: { itemId: string; name: string; quantity: number }[]; money: number } | null>(null)

  /** 上次是否完美 */
  const lastPerfect = ref(false)

  /** 鱼饵/浮漂装备 */
  const equippedBait = ref<BaitType | null>(null)
  const equippedTackle = ref<TackleType | null>(null)
  const tackleDurability = ref(0)

  /** 当次钓鱼会话的鱼饵/浮漂 */
  const activeBaitDef = ref<BaitDef | null>(null)
  const activeTackleDef = ref<TackleDef | null>(null)

  /** 当次上钩鱼的预掷品质（影响小游戏进度，完成时作为基础品质） */
  const sessionFishQuality = ref<Quality | null>(null)

  /** 蟹笼 */
  const crabPots = ref<CrabPotState[]>([])

  /** 装备鱼饵（仅标记类型，不从背包取出） */
  const equipBait = (type: BaitType): { success: boolean; message: string } => {
    const def = getBaitById(type)
    if (!def) return { success: false, message: '无效的鱼饵。' }
    if (inventoryStore.getItemCount(type) <= 0) return { success: false, message: '背包中没有该鱼饵。' }
    equippedBait.value = type
    return { success: true, message: `装备了${def.name}。` }
  }

  /** 卸下鱼饵 */
  const unequipBait = (): string => {
    if (!equippedBait.value) return '没有装备鱼饵。'
    const def = getBaitById(equippedBait.value)
    equippedBait.value = null
    return `卸下了${def?.name ?? '鱼饵'}。`
  }

  /** 装备浮漂 */
  const equipTackle = (type: TackleType): { success: boolean; message: string } => {
    const def = getTackleById(type)
    if (!def) return { success: false, message: '无效的浮漂。' }
    const rodTier = inventoryStore.getTool('fishingRod')?.tier ?? 'basic'
    if (rodTier === 'basic') return { success: false, message: '需要铁制或更好的鱼竿才能装备浮漂。' }
    if (!inventoryStore.removeItem(type, 1)) return { success: false, message: '背包中没有该浮漂。' }
    if (equippedTackle.value) unequipTackle()
    equippedTackle.value = type
    tackleDurability.value = def.maxDurability
    return { success: true, message: `装备了${def.name}。(耐久: ${def.maxDurability})` }
  }

  /** 卸下浮漂 */
  const unequipTackle = (): string => {
    if (!equippedTackle.value) return '没有装备浮漂。'
    const def = getTackleById(equippedTackle.value)
    if (tackleDurability.value > 0) {
      inventoryStore.addItem(equippedTackle.value, 1)
    }
    equippedTackle.value = null
    tackleDurability.value = 0
    return `卸下了${def?.name ?? '浮漂'}。`
  }

  /** 开始钓鱼 */
  const startFishing = (): { success: boolean; message: string; junk?: boolean } => {
    const rodMultiplier = inventoryStore.getToolStaminaMultiplier('fishingRod')
    // 旋转亮片减免体力
    const tackleDef = equippedTackle.value ? getTackleById(equippedTackle.value) : null
    const tackleStaminaReduction = tackleDef?.staminaReduction ?? 0
    const ringFishingReduction = inventoryStore.getRingEffectValue('fishing_stamina')
    const ringGlobalReduction = inventoryStore.getRingEffectValue('stamina_reduction')
    const staminaCost = Math.max(
      1,
      Math.floor(
        STAMINA_COST *
          rodMultiplier *
          (1 - skillStore.getStaminaReduction('fishing')) *
          (1 - tackleStaminaReduction) *
          (1 - ringFishingReduction) *
          (1 - ringGlobalReduction)
      )
    )
    if (!playerStore.consumeStamina(staminaCost)) {
      return { success: false, message: '体力不足，无法钓鱼。' }
    }

    // 确定鱼池：magic_bait 忽略季节但仍限地点
    const baitDef = equippedBait.value ? getBaitById(equippedBait.value) : null
    const loc = fishingLocation.value
    const fishPool = baitDef?.ignoresSeason
      ? FISH.filter(f => (f.location ?? 'creek') === loc && (f.weather.includes('any') || f.weather.includes(gameStore.weather as any)))
      : availableFish.value

    if (fishPool.length === 0) {
      playerStore.restoreStamina(staminaCost)
      return { success: false, message: '当前季节和天气没有可钓的鱼。' }
    }

    // 消耗鱼饵（从背包扣除1个，用完才取消装备）
    activeBaitDef.value = baitDef ?? null
    if (equippedBait.value) {
      inventoryStore.removeItem(equippedBait.value, 1)
      if (inventoryStore.getItemCount(equippedBait.value) <= 0) {
        equippedBait.value = null
      }
    }

    // 浮漂耐久-1
    activeTackleDef.value = tackleDef ?? null
    if (equippedTackle.value && tackleDef) {
      tackleDurability.value--
      if (tackleDurability.value <= 0) {
        equippedTackle.value = null
      }
    }

    // 垃圾判定：基础12%概率钓到垃圾，钓鱼等级每级-1%，使用鱼饵减半
    const junkBase = 0.12 - skillStore.fishingLevel * 0.01
    const junkChance = Math.max(0, baitDef ? junkBase * 0.5 : junkBase)
    if (Math.random() < junkChance) {
      const junkId = FISHING_JUNK[Math.floor(Math.random() * FISHING_JUNK.length)]!
      const junkName = getItemById(junkId)?.name ?? junkId
      inventoryStore.addItem(junkId)
      currentFish.value = null
      skillStore.addExp('fishing', 3)
      return { success: true, junk: true, message: `钓上了${junkName}……(-${staminaCost}体力)` }
    }

    // 随机选一条鱼，并预掷品质（影响收线进度与最终基础品质）
    const fish = pickRandomFish(fishPool)
    currentFish.value = fish
    sessionFishQuality.value = skillStore.rollCropQuality()
    lastTreasure.value = null
    lastPerfect.value = false

    let msg = `抛竿入水……感觉有${fish.name}在附近！(-${staminaCost}体力)`
    if (activeBaitDef.value) msg += ` [${activeBaitDef.value.name}]`
    if (activeTackleDef.value) msg += ` [${activeTackleDef.value.name}]`
    return { success: true, message: msg }
  }

  /** 计算小游戏参数（在 startFishing 之后调用） */
  const calculateMiniGameParams = (): MiniGameParams => {
    const fish = currentFish.value!
    const rodTier = inventoryStore.getTool('fishingRod')?.tier ?? 'basic'
    const level = skillStore.fishingLevel

    // 基础钩子高度（鱼竿等级）
    const rodHookMap: Record<ToolTier, number> = { basic: 40, iron: 45, steel: 50, iridium: 60 }
    let hookHeight = rodHookMap[rodTier] + level * 2
    hookHeight += Math.floor(hookHeight * getMeritBonus('fishing_rate'))

    // 基础时限（鱼竿等级）
    const rodTimeMap: Record<ToolTier, number> = { basic: 30, iron: 33, steel: 36, iridium: 40 }
    const timeLimit = rodTimeMap[rodTier]

    // 鱼速度（难度为默认，鱼种可覆盖；略降整体难度便于跟住鱼）
    const difficultySpeedMap: Record<string, number> = { easy: 0.9, normal: 1.7, hard: 2.5, legendary: 3.4 }
    const difficultyDirMap: Record<string, number> = { easy: 0.018, normal: 0.035, hard: 0.052, legendary: 0.07 }
    let fishSpeed = fish.miniGameSpeed ?? difficultySpeedMap[fish.difficulty] ?? 2.0
    let fishChangeDir = fish.miniGameDirChange ?? difficultyDirMap[fish.difficulty] ?? 0.04

    // 物理参数（scoreGain/scoreLoss 为每帧进度变化，约 60fps）
    let gravity = 1.5
    const quality = sessionFishQuality.value ?? 'normal'
    const difficultyProgress: Record<string, { gain: number; loss: number }> = {
      easy: { gain: 1.12, loss: 0.88 },
      normal: { gain: 1.0, loss: 1.0 },
      hard: { gain: 0.86, loss: 1.18 },
      legendary: { gain: 0.72, loss: 1.42 }
    }
    const rodProgress: Record<ToolTier, { gain: number; loss: number }> = {
      basic: { gain: 1.0, loss: 1.0 },
      iron: { gain: 1.06, loss: 0.96 },
      steel: { gain: 1.12, loss: 0.92 },
      iridium: { gain: 1.2, loss: 0.88 }
    }
    const qualityProgress: Record<Quality, { gain: number; loss: number }> = {
      normal: { gain: 1.0, loss: 1.0 },
      fine: { gain: 0.92, loss: 1.08 },
      excellent: { gain: 0.84, loss: 1.16 },
      supreme: { gain: 0.75, loss: 1.28 }
    }
    const diffMod = difficultyProgress[fish.difficulty] ?? { gain: 1, loss: 1 }
    const rodMod = rodProgress[rodTier]
    const qualMod = qualityProgress[quality]
    const levelGainMult = 1 + level * 0.035
    const levelLossMult = Math.max(0.65, 1 - level * 0.03)
    let scoreGain = 0.28 * levelGainMult * rodMod.gain * diffMod.gain * qualMod.gain
    let scoreLoss = 0.08 * levelLossMult * rodMod.loss * diffMod.loss * qualMod.loss
    scoreGain = Math.max(0.08, Math.min(0.45, scoreGain))
    scoreLoss = Math.max(0.03, Math.min(0.2, scoreLoss))

    // 鱼饵效果
    if (activeBaitDef.value?.behaviorModifier) {
      fishSpeed *= 1 - activeBaitDef.value.behaviorModifier.calm * 0.3
    }
    if (activeBaitDef.value?.struggleBonus) {
      fishSpeed *= 0.9
    }

    // 浮漂效果
    if (activeTackleDef.value) {
      // 旋转浮漂：重力减免（下落更慢）
      if (activeTackleDef.value.staminaReduction) gravity *= 1 - activeTackleDef.value.staminaReduction
      // 陷阱浮漂：进度流失减半
      if (activeTackleDef.value.extraBreakChance) scoreLoss *= 0.5
      // 软木浮漂：钩子高度+15
      if (activeTackleDef.value.struggleBonus) hookHeight += 15
      // 铅坠浮漂：鱼改变方向概率减半
      if (activeTackleDef.value.dangerReduction) fishChangeDir *= 0.5
    }

    // 钓翁令牌效果：鱼速度 -10%
    const walletStore = useWalletStore()
    const calmBonus = walletStore.getFishingCalmBonus()
    if (calmBonus > 0) {
      fishSpeed *= 1 - calmBonus
    }

    // 戒指效果：鱼速度降低
    const ringCalmBonus = inventoryStore.getRingEffectValue('fishing_calm')
    if (ringCalmBonus > 0) {
      fishSpeed *= 1 - ringCalmBonus
    }

    return {
      fishName: fish.name,
      difficulty: fish.difficulty,
      hookHeight,
      fishSpeed,
      fishChangeDir,
      gravity,
      liftSpeed: 3.0,
      scoreGain,
      scoreLoss,
      timeLimit
    }
  }

  /** 根据难度、钓鱼等级和鱼竿等级加权随机选鱼 */
  const pickRandomFish = (pool?: FishDef[]): FishDef => {
    const fishPool = pool ?? availableFish.value
    const cookingStore = useCookingStore()
    const fishingBuff =
      cookingStore.activeBuff?.type === 'fishing' || cookingStore.activeBuff?.type === 'all_skills' ? cookingStore.activeBuff.value : 0
    const luckBuff = cookingStore.activeBuff?.type === 'luck' ? cookingStore.activeBuff.value / 100 : 0
    const effectiveLevel = skillStore.fishingLevel + fishingBuff
    const rodTier = inventoryStore.getTool('fishingRod')?.tier ?? 'basic'
    const hasAngler = skillStore.getSkill('fishing').perk10 === 'angler'
    // 定向鱼饵权重倍率
    const hardMult = activeBaitDef.value?.hardWeightMult ?? 1
    const legendaryMult = activeBaitDef.value?.legendaryWeightMult ?? 1
    // 仙缘：龙瞳（long_ling_3）传说鱼捕获率+20%，鱼引结缘提升稀有鱼概率
    const hiddenNpcStore = useHiddenNpcStore()
    const legendaryBoost = 1 + hiddenNpcStore.getAbilityValue('long_ling_3') / 100
    const bondBonus = hiddenNpcStore.getBondBonusByType('fish_attraction')
    const fishAttractionMult = bondBonus?.type === 'fish_attraction' ? 1.5 : 1
    const meritRare = 1 + getMeritBonus('fish_rare')
    const weights: number[] = fishPool.map(f => {
      if (f.difficulty === 'legendary') {
        const minLevel = hasAngler ? 6 : 8
        if (rodTier === 'basic' || effectiveLevel < minLevel) return 0
        return (hasAngler ? 1.5 : 0.5) * (1 + luckBuff) * legendaryMult * legendaryBoost * meritRare
      }
      if (f.difficulty === 'hard') {
        if (rodTier === 'basic' && effectiveLevel < 4) return 0
        return (rodTier === 'basic' ? 0.5 : 1) * (1 + luckBuff) * hardMult * fishAttractionMult * meritRare
      }
      if (f.difficulty === 'easy') return 3
      if (f.difficulty === 'normal') return 2
      return 0.5
    })
    const total = weights.reduce((a, b) => a + b, 0)
    let roll = Math.random() * total
    for (let i = 0; i < fishPool.length; i++) {
      roll -= weights[i]!
      if (roll <= 0) return fishPool[i]!
    }
    return fishPool[0]!
  }

  /** 完成钓鱼（小游戏结束后调用） */
  const completeFishing = (
    rating: MiniGameRating
  ): {
    message: string
    fishName?: string
    fishId?: string
    difficulty?: string
    sellPrice?: number
    description?: string
    quality?: Quality
    quantity?: number
    weight?: number
    isNewRecord?: boolean
    success: boolean
  } | null => {
    if (!currentFish.value) return null

    // poor = 鱼跑了
    if (rating === 'poor') {
      const fish = currentFish.value
      endFishing()
      return {
        message: `鱼跑掉了……${fish.name}逃脱了！`,
        fishName: fish.name,
        fishId: fish.id,
        difficulty: fish.difficulty,
        sellPrice: fish.sellPrice,
        description: fish.description,
        success: false
      }
    }

    // 品质计算（基础上使用上钩时预掷的品质）
    const qualityOrder: Quality[] = ['normal', 'fine', 'excellent', 'supreme']
    let quality: Quality = sessionFishQuality.value ?? skillStore.rollCropQuality()
    // 水手专精：鱼品质至少为优良
    if (skillStore.getSkill('fishing').perk10 === 'mariner' && quality === 'normal') {
      quality = 'fine'
    }
    // 戒指效果：鱼品质提升
    const ringFishQualityBonus = inventoryStore.getRingEffectValue('fish_quality_bonus')
    if (ringFishQualityBonus > 0 && Math.random() < ringFishQualityBonus) {
      const idx = qualityOrder.indexOf(quality)
      const newIdx = Math.min(idx + 1, qualityOrder.length - 1)
      quality = qualityOrder[newIdx]!
    }
    // 品质浮标：品质+1档
    if (activeTackleDef.value?.qualityBoost) {
      const idx = qualityOrder.indexOf(quality)
      const newIdx = Math.min(idx + activeTackleDef.value.qualityBoost, qualityOrder.length - 1)
      quality = qualityOrder[newIdx]!
    }
    // 小游戏评级品质加成
    if (rating === 'perfect') {
      const idx = qualityOrder.indexOf(quality)
      const newIdx = Math.min(idx + 2, qualityOrder.length - 1)
      quality = qualityOrder[newIdx]!
    } else if (rating === 'excellent') {
      const idx = qualityOrder.indexOf(quality)
      const newIdx = Math.min(idx + 1, qualityOrder.length - 1)
      quality = qualityOrder[newIdx]!
    }

    // 溪流田庄雨天品质+1档
    if (gameStore.farmMapType === 'riverland' && gameStore.isRainy) {
      const idx = qualityOrder.indexOf(quality)
      if (idx < qualityOrder.length - 1) {
        quality = qualityOrder[idx + 1]!
      }
    }

    // 仙缘能力：龙泽（long_ling_1）瀑布钓鱼品质+1
    if (fishingLocation.value === 'waterfall' && useHiddenNpcStore().isAbilityActive('long_ling_1')) {
      const idx = qualityOrder.indexOf(quality)
      if (idx < qualityOrder.length - 1) {
        quality = qualityOrder[idx + 1]!
      }
    }

    // 野生鱼饵：概率双倍（诱饵师专精翻倍）
    const luremasterCatchMult = skillStore.getSkill('fishing').perk10 === 'luremaster' ? 2 : 1
    const doubleCatchChance = (activeBaitDef.value?.doubleCatchChance ?? 0) * luremasterCatchMult
    const catchQty = doubleCatchChance > 0 && Math.random() < doubleCatchChance ? 2 : 1
    const fishWeight = rollFishWeight(currentFish.value, rating, skillStore.getSkill('fishing').level)
    const unitSellPrice = useShopStore().calculateBaseSellPrice(currentFish.value.id, 1, quality, fishWeight)
    const caughtFish = {
      name: currentFish.value.name,
      id: currentFish.value.id,
      difficulty: currentFish.value.difficulty,
      sellPrice: unitSellPrice,
      description: currentFish.value.description
    }

    const added = inventoryStore.addItem(currentFish.value.id, catchQty, quality, { weight: fishWeight })
    const achievementStore = useAchievementStore()
    achievementStore.discoverItem(currentFish.value.id)
    achievementStore.recordFishCaught()
    const isNewRecord = achievementStore.recordFishWeight(currentFish.value.id, fishWeight)
    useQuestStore().onItemObtained(currentFish.value.id, catchQty)

    // 4% 概率获得秘密笔记
    if (Math.random() < 0.04) {
      useSecretNoteStore().tryCollectNote()
    }

    // 经验
    const difficultyExpMult: Record<string, number> = { easy: 1, normal: 1.5, hard: 2, legendary: 3 }
    const expGain = currentFish.value.sellPrice * (difficultyExpMult[currentFish.value.difficulty] ?? 1)
    const riverlandBonus = gameStore.farmMapType === 'riverland' ? 1.25 : 1.0
    const perfectMult = rating === 'perfect' ? 2 : 1
    skillStore.addExp('fishing', Math.floor(expGain * riverlandBonus * perfectMult))

    const ratingTag = rating === 'perfect' ? ' [完美!]' : ''
    let message = ''
    if (!added) {
      message = `钓上了${currentFish.value.name}，但背包已满，鱼丢失了！`
    } else {
      message =
        catchQty > 1
          ? `成功钓上了${catchQty}条${currentFish.value.name}！${ratingTag}`
          : `成功钓上了${currentFish.value.name}！${ratingTag}`
    }

    // 宝箱
    const treasure = rollTreasureChest()
    if (treasure) {
      lastTreasure.value = treasure
      const treasureNames = treasure.items.map(t => `${t.name}×${t.quantity}`).join('、')
      if (treasure.money > 0) {
        message += ` 宝箱：${treasureNames}${treasureNames ? '、' : ''}${treasure.money}文！`
      } else {
        message += ` 宝箱：${treasureNames}！`
      }
    }

    lastPerfect.value = rating === 'perfect'
    try {
      useSystemStore().onFishCaught(caughtFish.id, caughtFish.difficulty)
    } catch {
      /* pinia 未就绪 */
    }
    endFishing()
    return {
      message,
      fishName: caughtFish.name,
      fishId: caughtFish.id,
      difficulty: caughtFish.difficulty,
      sellPrice: caughtFish.sellPrice,
      description: caughtFish.description,
      quality,
      quantity: catchQty,
      weight: fishWeight,
      isNewRecord,
      success: true
    }
  }

  /** 钓鱼宝箱 */
  const rollTreasureChest = (): { items: { itemId: string; name: string; quantity: number }[]; money: number } | null => {
    const cookingStore = useCookingStore()
    const luckBuff = cookingStore.activeBuff?.type === 'luck' ? 0.05 : 0
    const ringTreasureFind = inventoryStore.getRingEffectValue('treasure_find')
    const ringLuck = inventoryStore.getRingEffectValue('luck')
    const chance = 0.15 + skillStore.fishingLevel * 0.01 + luckBuff + ringTreasureFind + ringLuck * 0.3
    if (Math.random() >= chance) return null

    // 随机1-2个奖品
    const numPrizes = Math.random() < 0.3 ? 2 : 1
    const items: { itemId: string; name: string; quantity: number }[] = []
    let money = 0

    for (let i = 0; i < numPrizes; i++) {
      const totalWeight = TREASURE_POOL.reduce((a, b) => a + b.weight, 0)
      let roll = Math.random() * totalWeight
      for (const prize of TREASURE_POOL) {
        roll -= prize.weight
        if (roll <= 0) {
          const qty = prize.minQty + Math.floor(Math.random() * (prize.maxQty - prize.minQty + 1))
          if (prize.itemId) {
            inventoryStore.addItem(prize.itemId, qty)
            const itemDef = getItemById(prize.itemId)
            items.push({ itemId: prize.itemId, name: itemDef?.name ?? prize.itemId, quantity: qty })
          } else {
            money += qty
            playerStore.earnMoney(qty)
          }
          break
        }
      }
    }

    return items.length > 0 || money > 0 ? { items, money } : null
  }

  const endFishing = () => {
    currentFish.value = null
    activeBaitDef.value = null
    activeTackleDef.value = null
    sessionFishQuality.value = null
  }

  // =========== 蟹笼系统 ===========

  /** 放置蟹笼 */
  const placeCrabPot = (location: FishingLocation): { success: boolean; message: string } => {
    if (crabPots.value.length >= MAX_CRAB_POTS) {
      return { success: false, message: `蟹笼已达上限 (${MAX_CRAB_POTS})。` }
    }
    const atLocation = crabPots.value.filter(p => p.location === location).length
    if (atLocation >= MAX_CRAB_POTS_PER_LOCATION) {
      return { success: false, message: `该地点蟹笼已达上限 (${MAX_CRAB_POTS_PER_LOCATION})。` }
    }
    if (!inventoryStore.removeItem('crab_pot', 1)) {
      return { success: false, message: '背包中没有蟹笼。' }
    }
    crabPots.value.push({ location, hasBait: false })
    return { success: true, message: '蟹笼已放置。' }
  }

  /** 回收蟹笼 */
  const removeCrabPot = (location: FishingLocation): { success: boolean; message: string } => {
    const idx = crabPots.value.findIndex(p => p.location === location)
    if (idx === -1) return { success: false, message: '该地点没有蟹笼。' }
    crabPots.value.splice(idx, 1)
    inventoryStore.addItem('crab_pot', 1)
    return { success: true, message: '蟹笼已回收。' }
  }

  /** 给蟹笼装饵 (指定地点的所有蟹笼) */
  const baitCrabPots = (location: FishingLocation): { success: boolean; message: string } => {
    const pots = crabPots.value.filter(p => p.location === location && !p.hasBait)
    if (pots.length === 0) return { success: false, message: '该地点蟹笼都已有饵料。' }
    let baited = 0
    for (const pot of pots) {
      if (inventoryStore.removeItem('standard_bait', 1)) {
        pot.hasBait = true
        baited++
      } else {
        break
      }
    }
    if (baited === 0) return { success: false, message: '没有鱼饵了。' }
    return { success: true, message: `装饵${baited}个蟹笼。` }
  }

  /** 全局装饵（雇工自动调用，不限地点） */
  const baitAllCrabPots = (): number => {
    const pots = crabPots.value.filter(p => !p.hasBait)
    let baited = 0
    for (const pot of pots) {
      if (inventoryStore.removeItem('standard_bait', 1)) {
        pot.hasBait = true
        baited++
      } else {
        break
      }
    }
    return baited
  }

  /** 各地点蟹笼统计 */
  const crabPotsByLocation = computed(() => {
    const map: Partial<Record<FishingLocation, { total: number; baited: number }>> = {}
    for (const pot of crabPots.value) {
      if (!map[pot.location]) map[pot.location] = { total: 0, baited: 0 }
      map[pot.location]!.total++
      if (pot.hasBait) map[pot.location]!.baited++
    }
    return map
  })

  /** 每日收获蟹笼 (由 useEndDay 调用) */
  const collectCrabPots = (): { itemId: string; name: string }[] => {
    const isLuremaster = skillStore.getSkill('fishing').perk10 === 'luremaster'
    const isMariner = skillStore.getSkill('fishing').perk10 === 'mariner'
    const collected: { itemId: string; name: string }[] = []

    for (const pot of crabPots.value) {
      if (!pot.hasBait && !isLuremaster) continue

      // 构建该地点的产物池
      let pool = CRAB_POT_LOOT.filter(l => !l.locationOverride || l.locationOverride === pot.location)
      // 地点替换
      const overrides = pool.filter(l => l.locationOverride === pot.location)
      if (overrides.length > 0) {
        const replaceIds = new Set(overrides.map(o => o.replaces).filter(Boolean))
        pool = pool.filter(l => !replaceIds.has(l.itemId) || l.locationOverride === pot.location)
      }
      // 水手专精：排除垃圾
      if (isMariner) {
        const junkSet = new Set(FISHING_JUNK)
        pool = pool.filter(l => !junkSet.has(l.itemId))
      }

      const totalWeight = pool.reduce((a, b) => a + b.weight, 0)
      let roll = Math.random() * totalWeight
      for (const loot of pool) {
        roll -= loot.weight
        if (roll <= 0) {
          inventoryStore.addItem(loot.itemId, 1)
          const itemDef = getItemById(loot.itemId)
          collected.push({ itemId: loot.itemId, name: itemDef?.name ?? loot.itemId })
          // 水产也算钓鱼经验
          if (itemDef) {
            skillStore.addExp('fishing', Math.floor(itemDef.sellPrice * 0.5))
          }
          const achievementStore = useAchievementStore()
          achievementStore.discoverItem(loot.itemId)
          break
        }
      }

      // 消耗饵料
      pot.hasBait = false
    }

    return collected
  }

  const serialize = () => {
    return {
      equippedBait: equippedBait.value,
      equippedTackle: equippedTackle.value,
      tackleDurability: tackleDurability.value,
      fishingLocation: fishingLocation.value,
      crabPots: crabPots.value
    }
  }

  const deserialize = (data: ReturnType<typeof serialize>) => {
    equippedBait.value = data.equippedBait ?? null
    equippedTackle.value = data.equippedTackle ?? null
    tackleDurability.value = data.tackleDurability ?? 0
    fishingLocation.value = data.fishingLocation ?? 'creek'
    crabPots.value = (data as any).crabPots ?? []
  }

  return {
    availableFish,
    fishingLocation,
    currentFish,
    lastTreasure,
    lastPerfect,
    equippedBait,
    equippedTackle,
    tackleDurability,
    crabPots,
    crabPotsByLocation,
    setLocation,
    equipBait,
    unequipBait,
    equipTackle,
    unequipTackle,
    startFishing,
    calculateMiniGameParams,
    completeFishing,
    endFishing,
    placeCrabPot,
    removeCrabPot,
    baitCrabPots,
    baitAllCrabPots,
    collectCrabPots,
    serialize,
    deserialize
  }
})
