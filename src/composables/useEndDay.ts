import { useGameStore, SEASON_NAMES, WEATHER_NAMES } from '@/stores/useGameStore'
import { usePlayerStore } from '@/stores/usePlayerStore'
import { useFarmStore } from '@/stores/useFarmStore'
import { useInventoryStore } from '@/stores/useInventoryStore'
import { useSaveStore } from '@/stores/useSaveStore'
import { useSkillStore } from '@/stores/useSkillStore'
import { useNpcStore } from '@/stores/useNpcStore'
import { useCookingStore } from '@/stores/useCookingStore'
import { useProcessingStore } from '@/stores/useProcessingStore'
import { useAchievementStore } from '@/stores/useAchievementStore'
import { useAnimalStore } from '@/stores/useAnimalStore'
import { useHomeStore } from '@/stores/useHomeStore'
import { useWalletStore } from '@/stores/useWalletStore'
import { useShopStore } from '@/stores/useShopStore'
import { useQuestStore } from '@/stores/useQuestStore'
import { useFishingStore } from '@/stores/useFishingStore'
import { useBreedingStore } from '@/stores/useBreedingStore'
import { useHanhaiStore } from '@/stores/useHanhaiStore'
import { useSystemStore, getMorningGreeting } from '@/stores/useSystemStore'
import { useFishPondStore } from '@/stores/useFishPondStore'
import { useTutorialStore } from '@/stores/useTutorialStore'
import { useHiddenNpcStore } from '@/stores/useHiddenNpcStore'
import { useBankStore } from '@/stores/useBankStore'
import { useMiningStore } from '@/stores/useMiningStore'
import { getItemById, getTodayEvent, getNpcById, getCropById, getForageItems } from '@/data'
import { getFertilizerById } from '@/data/processing'
import { FISH } from '@/data/fish'
import { RECIPES } from '@/data/recipes'
import { CAVE_UNLOCK_EARNINGS } from '@/data/buildings'
import { TOOL_NAMES, TIER_NAMES } from '@/data/upgrades'
import { addLog, showFloat } from './useGameLog'
import { getDailyMarketInfo, MARKET_CATEGORY_NAMES } from '@/data/market'
import { showEvent, showFestival, triggerWeddingEvent, triggerPetAdoption, showFarmEvent, showDiscoveryScene } from './useDialogs'
import { sfxSleep, useAudio } from './useAudio'
import { MORNING_NARRATIONS, NARRATIONS_NO_LOSS, MORNING_CHOICE_EVENTS, MORNING_EASTER_EGGS } from '@/data/farmEvents'
import { MORNING_TIPS } from '@/data/tutorials'
import type { MorningEffect } from '@/data/farmEvents'
import router from '@/router'
import { runTavernEndDay } from './tavernSimulate'
import { useTavernStore } from '@/stores/useTavernStore'

const NPC_NAME_MAP: Record<string, string> = {
  chen_bo: '陈伯',
  liu_niang: '柳娘',
  a_shi: '阿石',
  qiu_yue: '秋月',
  lin_lao: '林老',
  xiao_man: '小满',
  chun_lan: '春兰',
  xue_qin: '雪芹',
  su_su: '素素',
  hong_dou: '红豆',
  dan_qing: '丹青',
  a_tie: '阿铁',
  yun_fei: '云飞',
  da_niu: '大牛',
  mo_bai: '墨白',
  wang_dashen: '王大婶',
  zhao_mujiang: '赵木匠',
  sun_tiejiang: '孙铁匠',
  zhang_popo: '张婆婆',
  li_yu: '李渔翁',
  zhou_xiucai: '周秀才',
  wu_shen: '吴婶',
  ma_liu: '马六',
  lao_song: '老宋',
  pang_shen: '胖婶',
  a_hua: '阿花',
  shi_tou: '石头',
  hui_niang: '慧娘',
  lao_lu: '老陆',
  liu_cunzhang: '柳村长',
  qian_niang: '钱娘',
  he_zhanggui: '何掌柜',
  qin_dashu: '秦大叔',
  a_fu: '阿福'
}

const getNpcName = (npcId: string): string => {
  return NPC_NAME_MAP[npcId] ?? npcId
}

/** NPC 好感度 → 食谱解锁映射（多层级） */
const NPC_RECIPE_MAP: { npcId: string; level: 'acquaintance' | 'friendly' | 'bestFriend'; recipeId: string }[] = [
  // 相识
  { npcId: 'chen_bo', level: 'acquaintance', recipeId: 'radish_soup' },
  { npcId: 'qiu_yue', level: 'acquaintance', recipeId: 'braised_carp' },
  { npcId: 'lin_lao', level: 'acquaintance', recipeId: 'herbal_porridge' },
  { npcId: 'liu_niang', level: 'acquaintance', recipeId: 'osmanthus_cake' },
  { npcId: 'a_shi', level: 'acquaintance', recipeId: 'miner_lunch' },
  { npcId: 'xiao_man', level: 'acquaintance', recipeId: 'sweet_osmanthus_tea' },
  // 相知
  { npcId: 'chen_bo', level: 'friendly', recipeId: 'aged_radish_stew' },
  { npcId: 'qiu_yue', level: 'friendly', recipeId: 'maple_grilled_fish' },
  { npcId: 'lin_lao', level: 'friendly', recipeId: 'herbal_pill' },
  { npcId: 'liu_niang', level: 'friendly', recipeId: 'embroidered_cake' },
  { npcId: 'a_shi', level: 'friendly', recipeId: 'deep_mine_stew' },
  { npcId: 'xiao_man', level: 'friendly', recipeId: 'wild_berry_jam' },
  // 挚友
  { npcId: 'chen_bo', level: 'bestFriend', recipeId: 'farmers_feast' },
  { npcId: 'qiu_yue', level: 'bestFriend', recipeId: 'autumn_moon_feast' },
  { npcId: 'lin_lao', level: 'bestFriend', recipeId: 'longevity_soup' },
  { npcId: 'liu_niang', level: 'bestFriend', recipeId: 'lovers_pastry' },
  { npcId: 'a_shi', level: 'bestFriend', recipeId: 'forgemasters_meal' },
  { npcId: 'xiao_man', level: 'bestFriend', recipeId: 'spirit_fruit_wine' },
  // 新增：动物产品相关食谱
  { npcId: 'da_niu', level: 'friendly', recipeId: 'goat_milk_soup' },
  { npcId: 'da_niu', level: 'bestFriend', recipeId: 'truffle_fried_rice' },
  { npcId: 'lin_lao', level: 'bestFriend', recipeId: 'antler_soup' },
  { npcId: 'chen_bo', level: 'bestFriend', recipeId: 'camel_milk_tea' }
]

/** 结婚食谱映射 */
const MARRIAGE_RECIPE_MAP: Record<string, string> = {
  liu_niang: 'phoenix_cake',
  a_shi: 'molten_hotpot',
  qiu_yue: 'moonlight_sashimi',
  chun_lan: 'tea_banquet',
  xue_qin: 'snow_plum_soup',
  su_su: 'silk_dumpling',
  hong_dou: 'drunken_chicken',
  dan_qing: 'scholars_porridge',
  a_tie: 'ironforge_stew',
  yun_fei: 'hunters_roast',
  da_niu: 'ranch_milk_soup',
  mo_bai: 'moonlit_tea_rice'
}

/** 节日食谱映射 */
const FESTIVAL_RECIPE_MAP: Record<string, string> = {
  spring_festival: 'spring_roll',
  summer_lantern: 'lotus_lantern_cake',
  autumn_harvest: 'harvest_feast',
  winter_new_year: 'new_year_dumpling',
  yuan_ri: 'nian_gao',
  hua_chao: 'hua_gao',
  shang_si: 'qing_tuan',
  zhong_qiu: 'yue_bing',
  la_ba: 'la_ba_zhou',
  duan_wu: 'dragon_boat_zongzi',
  qi_xi: 'qiao_guo',
  chong_yang: 'chrysanthemum_wine',
  dong_zhi: 'jiaozi',
  nian_mo: 'tangyuan',
  dou_cha: 'dou_cha_yin',
  qiu_yuan: 'zhi_yuan_gao'
}

/** 好感度等级层级顺序 */
const LEVEL_ORDER = ['stranger', 'acquaintance', 'friendly', 'bestFriend'] as const

/** 检查好感度是否达到指定等级 */
const meetsLevel = (current: string, required: 'acquaintance' | 'friendly' | 'bestFriend'): boolean => {
  return LEVEL_ORDER.indexOf(current as (typeof LEVEL_ORDER)[number]) >= LEVEL_ORDER.indexOf(required)
}

/** 传说鱼ID列表 */
const LEGENDARY_FISH_IDS = ['dragonfish', 'golden_turtle', 'river_dragon', 'abyss_leviathan', 'jade_dragon']

/** 检查 NPC 友好度、技能等级、结婚解锁食谱 */
const checkRecipeUnlocks = () => {
  const npcStore = useNpcStore()
  const cookingStore = useCookingStore()
  const skillStore = useSkillStore()

  // NPC 多层级好感食谱
  for (const entry of NPC_RECIPE_MAP) {
    const level = npcStore.getFriendshipLevel(entry.npcId)
    if (meetsLevel(level, entry.level)) {
      if (cookingStore.unlockRecipe(entry.recipeId)) {
        const levelName = entry.level === 'acquaintance' ? '相识' : entry.level === 'friendly' ? '相知' : '挚友'
        addLog(`${getNpcName(entry.npcId)}（${levelName}）寄来了新食谱！`)
      }
    }
  }

  // 结婚食谱
  const spouse = npcStore.getSpouse()
  if (spouse) {
    const marriageRecipe = MARRIAGE_RECIPE_MAP[spouse.npcId]
    if (marriageRecipe) {
      if (cookingStore.unlockRecipe(marriageRecipe)) {
        const spouseName = getNpcName(spouse.npcId)
        addLog(`${spouseName}教你了新的料理秘方！`)
      }
    }
    // 通用结婚食谱：孔雀宴
    if (cookingStore.unlockRecipe('peacock_feast')) {
      addLog(`婚后生活解锁了新食谱：孔雀宴！`)
    }
  }

  // 技能食谱
  for (const recipe of RECIPES) {
    if (recipe.requiredSkill) {
      const skill = skillStore.getSkill(recipe.requiredSkill.type)
      if (skill.level >= recipe.requiredSkill.level) {
        if (cookingStore.unlockRecipe(recipe.id)) {
          addLog(`技能提升解锁了新食谱：${recipe.name}！`)
        }
      }
    }
  }

  // 物品获取解锁食谱（瀚海）
  const inventoryStore = useInventoryStore()
  const ITEM_RECIPE_MAP: { itemId: string; recipeId: string; name: string }[] = [
    { itemId: 'hanhai_spice', recipeId: 'spiced_lamb', name: '香料烤羊' },
    { itemId: 'hanhai_silk', recipeId: 'silk_dumpling_deluxe', name: '丝路饺子' },
    { itemId: 'hanhai_cactus', recipeId: 'desert_cactus_soup', name: '仙人掌汤' },
    { itemId: 'hanhai_date', recipeId: 'date_cake', name: '枣糕' }
  ]
  for (const entry of ITEM_RECIPE_MAP) {
    if (inventoryStore.hasItem(entry.itemId)) {
      if (cookingStore.unlockRecipe(entry.recipeId)) {
        addLog(`获得了新食谱：${entry.name}！`)
      }
    }
  }
}

/** 检查成就解锁食谱 */
const checkAchievementRecipes = () => {
  const achievementStore = useAchievementStore()
  const cookingStore = useCookingStore()
  const npcStore = useNpcStore()
  const s = achievementStore.stats

  const checks: { condition: boolean; recipeId: string; message: string }[] = [
    { condition: s.totalFishCaught >= 1, recipeId: 'first_catch_soup', message: '初次钓鱼' },
    { condition: s.totalCropsHarvested >= 100, recipeId: 'bountiful_porridge', message: '收获百次作物' },
    { condition: s.highestMineFloor >= 30, recipeId: 'miners_glory', message: '矿洞探索' },
    { condition: s.totalRecipesCooked >= 20, recipeId: 'chef_special', message: '烹饪达人' },
    {
      condition:
        (['chen_bo', 'liu_niang', 'a_shi', 'qiu_yue', 'lin_lao', 'xiao_man'] as const).filter(id =>
          meetsLevel(npcStore.getFriendshipLevel(id), 'friendly')
        ).length >= 3,
      recipeId: 'social_tea',
      message: '社交达人'
    },
    { condition: s.totalFishCaught >= 20, recipeId: 'anglers_platter', message: '钓鱼好手' },
    {
      condition: LEGENDARY_FISH_IDS.some(id => achievementStore.isDiscovered(id)),
      recipeId: 'legendary_feast',
      message: '传说猎人'
    },
    { condition: s.highestMineFloor >= 50, recipeId: 'abyss_stew', message: '深渊探索' },
    { condition: achievementStore.discoveredCount >= 50, recipeId: 'collectors_banquet', message: '收藏达人' }
  ]

  for (const check of checks) {
    if (check.condition) {
      if (cookingStore.unlockRecipe(check.recipeId)) {
        addLog(`【成就食谱】${check.message}解锁了新食谱！`)
      }
    }
  }
}

/** 应用季节事件效果 */
const applyEventEffects = (event: { id: string; name: string; description: string; effects: any }) => {
  const playerStore = usePlayerStore()
  const npcStore = useNpcStore()
  const inventoryStore = useInventoryStore()
  const effects = event.effects

  if (effects.friendshipBonus) {
    for (const state of npcStore.npcStates) {
      state.friendship += effects.friendshipBonus
    }
  }
  if (effects.moneyReward) {
    playerStore.earnMoney(effects.moneyReward)
    showFloat(`+${effects.moneyReward}文`, 'accent')
  }
  if (effects.staminaBonus) {
    playerStore.restoreStamina(effects.staminaBonus)
    showFloat(`+${effects.staminaBonus}体力`, 'success')
  }
  if (effects.itemReward) {
    for (const item of effects.itemReward) {
      inventoryStore.addItem(item.itemId, item.quantity)
    }
  }
  addLog(`【${event.name}】${event.description}`)

  // 节日食谱解锁
  const cookingStore = useCookingStore()
  const festivalRecipe = FESTIVAL_RECIPE_MAP[event.id]
  if (festivalRecipe) {
    if (cookingStore.unlockRecipe(festivalRecipe)) {
      addLog(`节日活动解锁了新食谱！`)
    }
  }
}

// ==================== 晨间随机事件 ====================

/** 应用晨间效果 */
const applyMorningEffect = (effect?: MorningEffect) => {
  if (!effect) return
  const playerStore = usePlayerStore()
  const inventoryStore = useInventoryStore()
  const npcStore = useNpcStore()
  const farmStore = useFarmStore()

  switch (effect.type) {
    case 'loseCrop': {
      const growing = farmStore.plots.filter(p => p.state === 'growing' || p.state === 'harvestable')
      if (growing.length > 0) {
        const target = growing[Math.floor(Math.random() * growing.length)]!
        const cropName = getCropById(target.cropId ?? '')?.name ?? '作物'
        target.state = 'tilled'
        target.cropId = null
        target.growthDays = 0
        target.watered = false
        target.harvestCount = 0
        target.seedGenetics = null
        addLog(`一株${cropName}被糟蹋了。`)
      }
      break
    }
    case 'gainItem':
      inventoryStore.addItem(effect.itemId, effect.qty)
      break
    case 'gainMoney':
      playerStore.earnMoney(effect.amount)
      break
    case 'gainFriendship':
      for (const s of npcStore.npcStates) {
        s.friendship += effect.amount
      }
      break
  }
}

/** 掷骰：晨间随机事件 */
const rollMorningEvent = ():
  | { type: 'narration'; message: string; effect?: MorningEffect }
  | { type: 'choice'; event: (typeof MORNING_CHOICE_EVENTS)[number] }
  | { type: 'easter'; message: string; effect?: MorningEffect }
  | null => {
  const roll = Math.random()

  // 95% 什么都没发生
  if (roll >= 0.05) return null

  // 0.2% 彩蛋 (roll < 0.002)
  if (roll < 0.002) {
    const egg = MORNING_EASTER_EGGS[Math.floor(Math.random() * MORNING_EASTER_EGGS.length)]!
    return { type: 'easter', message: egg.message, effect: egg.effect }
  }

  // 0.8% 选项事件 (roll < 0.01)
  if (roll < 0.01) {
    const event = MORNING_CHOICE_EVENTS[Math.floor(Math.random() * MORNING_CHOICE_EVENTS.length)]!
    return { type: 'choice', event }
  }

  // 4% 小偷/动物旁白
  const farmStore = useFarmStore()
  const hasCrops = farmStore.plots.some(p => p.state === 'growing' || p.state === 'harvestable')
  const pool = hasCrops ? MORNING_NARRATIONS : NARRATIONS_NO_LOSS
  const narration = pool[Math.floor(Math.random() * pool.length)]!
  return { type: 'narration', message: narration.message, effect: narration.effect }
}

/** 日结算处理 */
export const handleEndDay = () => {
  sfxSleep()

  const gameStore = useGameStore()

  const playerStore = usePlayerStore()
  const farmStore = useFarmStore()
  const inventoryStore = useInventoryStore()
  const saveStore = useSaveStore()
  const npcStore = useNpcStore()
  const cookingStore = useCookingStore()
  const processingStore = useProcessingStore()
  const achievementStore = useAchievementStore()
  const animalStore = useAnimalStore()
  const homeStore = useHomeStore()
  const questStore = useQuestStore()
  const skillStore = useSkillStore()
  const tutorialStore = useTutorialStore()

  // 新手引导：记录体力低标记（在 dailyReset 之前）
  if (playerStore.stamina < 20) tutorialStore.setFlag('staminaWasLow')

  // 恢复模式
  let recoveryMode: 'normal' | 'late' | 'passout'
  if (playerStore.stamina <= 0 || gameStore.hour >= 26) {
    recoveryMode = 'passout'
  } else if (gameStore.hour >= 24) {
    recoveryMode = 'late'
  } else {
    recoveryMode = 'normal'
  }

  // 矿洞强制退出：无论玩家是否在探索中，睡觉/晕厥后都重置矿洞状态
  const miningStore = useMiningStore()
  if (miningStore.isExploring) {
    miningStore.leaveMine()
  }

  const pestResult = farmStore.dailyUpdate(gameStore.isRainy)
  processingStore.dailyUpdate()

  // 育种台进度更新
  const breedingStore = useBreedingStore()
  breedingStore.dailyUpdate()

  // 戒指效果：作物生长加速
  const ringGrowthBonus = inventoryStore.getRingEffectValue('crop_growth_bonus')
  const walletGrowthBonus = useWalletStore().getCropGrowthBonus()
  if (ringGrowthBonus > 0) {
    for (const plot of farmStore.plots) {
      if ((plot.state === 'growing' || plot.state === 'planted') && plot.watered) {
        plot.growthDays += ringGrowthBonus
        const crop = getCropById(plot.cropId!)
        if (crop) {
          const fertDef = plot.fertilizer ? getFertilizerById(plot.fertilizer) : null
          const speedup = (fertDef?.growthSpeedup ?? 0) + walletGrowthBonus
          const effectiveDays = Math.max(1, Math.floor(crop.growthDays * (1 - speedup)))
          if (plot.growthDays >= effectiveDays) {
            plot.state = 'harvestable'
          }
        }
      }
    }
  }

  // 绿雨额外效果：作物加速生长 + 野树加速
  if (gameStore.weather === 'green_rain') {
    for (const plot of farmStore.plots) {
      if ((plot.state === 'growing' || plot.state === 'planted') && plot.watered) {
        plot.growthDays += 0.5
        const crop = getCropById(plot.cropId!)
        if (crop) {
          const fertDef = plot.fertilizer ? getFertilizerById(plot.fertilizer) : null
          const speedup = (fertDef?.growthSpeedup ?? 0) + walletGrowthBonus
          const effectiveDays = Math.max(1, Math.floor(crop.growthDays * (1 - speedup)))
          if (plot.growthDays >= effectiveDays) {
            plot.state = 'harvestable'
          }
        }
      }
    }
    for (const tree of farmStore.wildTrees) {
      if (!tree.mature) {
        tree.growthDays += 1
      }
    }
    addLog('绿雨滋润了大地，作物和树木生长加速！')
  }

  // 工具升级进度
  const upgradeResult = inventoryStore.dailyUpgradeUpdate()
  if (upgradeResult?.completed) {
    addLog(`小满完成了${TOOL_NAMES[upgradeResult.toolType]}的升级！现在是${TIER_NAMES[upgradeResult.targetTier]}级。`)
  }

  // 乌鸦袭击（在其他日常处理前）
  const crowResult = farmStore.crowAttack()
  if (crowResult.attacked) {
    addLog(`乌鸦袭击了你的农场，一株${crowResult.cropName}被吃掉了！放个稻草人保护作物吧。`)
  }

  // 虫害日志
  if (pestResult.newInfestations > 0) {
    addLog(
      `虫害来袭！${pestResult.newInfestations}块地遭到了虫害侵袭。${farmStore.scarecrows > 0 ? '稻草人降低了虫害风险。' : '放置稻草人可以降低虫害概率。'}`
    )
  }
  if (pestResult.pestDeaths > 0) {
    addLog(`${pestResult.pestDeaths}株作物因虫害持续太久而枯死了！及时除虫可以拯救作物。`)
  }

  // 杂草日志
  if (pestResult.newWeeds > 0) {
    addLog(
      `杂草蔓延！${pestResult.newWeeds}块地长出了杂草。${farmStore.scarecrows > 0 ? '稻草人抑制了杂草蔓延。' : '放置稻草人可以减少杂草。'}`
    )
  }
  if (pestResult.weedDeaths > 0) {
    addLog(`${pestResult.weedDeaths}株作物被杂草覆盖窒息而死！及时除草可以拯救作物。`)
  }

  // 晨间随机事件（偷菜旁白）
  const morningEvent = rollMorningEvent()
  if (morningEvent) {
    if (morningEvent.type === 'choice') {
      showFarmEvent(morningEvent.event)
    } else {
      addLog(morningEvent.message)
      applyMorningEffect(morningEvent.effect)
    }
  }

  // 巨型作物检查
  const giantCrops = farmStore.checkGiantCrops()
  for (const gc of giantCrops) {
    addLog(`巨型${gc.cropName}出现了！3×3的作物合体成了巨型作物！`)
  }

  // 雇工喂食结算（必须在 animalStore.dailyUpdate 之前，确保喂食状态生效）
  // 每天仅消耗一次草料：此处喂食用于过夜检查，dailyUpdate 后用 markAllFed 标记新一天
  const helperFeedResult = npcStore.processDailyHelpers(['feed'])
  for (const msg of helperFeedResult.messages) addLog(msg)
  const helperFeedSuccess = helperFeedResult.allFed

  const spouse = npcStore.getSpouse()
  let spouseFedSuccess = false
  if (spouse && !helperFeedSuccess) {
    const bonusChanceEve = spouse.friendship >= 2500 ? 0.1 : 0
    if (Math.random() < 0.4 + bonusChanceEve) {
      const result = animalStore.feedAll()
      if (result.fedCount > 0) {
        const spouseDefEve = getNpcById(spouse.npcId)
        addLog(`${spouseDefEve?.name ?? '配偶'}帮你喂了所有牲畜。`)
        spouseFedSuccess = result.noFeedCount === 0
      } else if (result.noFeedCount > 0) {
        const spouseDefEve = getNpcById(spouse.npcId)
        addLog(`${spouseDefEve?.name ?? '配偶'}想帮你喂牲畜，但草料不足。`)
      }
    }
  }

  // 知己每日加成（在 dailyReset 之前）
  const zhiji = npcStore.getZhiji()
  if (zhiji) {
    const zhijiDef = getNpcById(zhiji.npcId)
    const zhijiName = zhijiDef?.name ?? '知己'
    const bonusChance2 = zhiji.friendship >= 2500 ? 0.15 : 0

    switch (zhiji.npcId) {
      case 'a_shi':
        if (Math.random() < 0.3 + bonusChance2) {
          const ores = ['copper_ore', 'iron_ore', 'gold_ore']
          const ore = ores[Math.floor(Math.random() * ores.length)]!
          const qty = 1 + Math.floor(Math.random() * 3)
          inventoryStore.addItem(ore, qty)
          addLog(`${zhijiName}送来了${qty}个${getItemById(ore)?.name ?? '矿石'}。`)
        }
        break
      case 'dan_qing':
        if (Math.random() < 0.2 + bonusChance2) {
          for (const s of npcStore.npcStates) {
            if (s.npcId !== zhiji.npcId) s.friendship += 5
          }
          addLog(`${zhijiName}在村里替你美言了几句。(全村+5好感)`)
        }
        break
      case 'a_tie':
        if (Math.random() < 0.3 + bonusChance2) {
          const mats = ['iron_ore', 'copper_ore', 'charcoal']
          const mat = mats[Math.floor(Math.random() * mats.length)]!
          inventoryStore.addItem(mat, 2)
          addLog(`${zhijiName}送来了一些打铁的材料。`)
        }
        break
      case 'yun_fei':
        if (Math.random() < 0.3 + bonusChance2) {
          const items2 = ['wild_mushroom', 'herb', 'pine_cone']
          const item2 = items2[Math.floor(Math.random() * items2.length)]!
          inventoryStore.addItem(item2)
          addLog(`${zhijiName}从山里带回了${getItemById(item2)?.name ?? '东西'}。`)
        }
        break
      case 'da_niu':
        if (Math.random() < 0.3 + bonusChance2) {
          const result2 = animalStore.feedAll()
          if (result2.fedCount > 0) addLog(`${zhijiName}帮你喂了所有牲畜。`)
        }
        break
      case 'mo_bai':
        if (Math.random() < 0.25 + bonusChance2) {
          playerStore.restoreStamina(15)
          addLog(`${zhijiName}弹了一曲舒缓的琴音，你感觉精神好了些。(+15体力)`)
        }
        break
      case 'liu_niang':
        if (Math.random() < 0.2 + bonusChance2) {
          for (const s of npcStore.npcStates) {
            if (s.npcId !== zhiji.npcId) s.friendship += 5
          }
          addLog(`${zhijiName}在村里替你说了好话。(全村+5好感)`)
        }
        break
      case 'qiu_yue':
        if (Math.random() < 0.3 + bonusChance2) {
          const fish = ['crucian', 'carp', 'grass_carp', 'bass']
          const f = fish[Math.floor(Math.random() * fish.length)]!
          inventoryStore.addItem(f)
          addLog(`${zhijiName}送来了一条${getItemById(f)?.name ?? '鱼'}。`)
        }
        break
      case 'chun_lan':
        if (Math.random() < 0.25 + bonusChance2) {
          inventoryStore.addItem('green_tea_drink')
          addLog(`${zhijiName}送来了一壶好茶。`)
        }
        break
      case 'xue_qin':
        if (Math.random() < 0.15 + bonusChance2) {
          inventoryStore.addItem('bamboo')
          addLog(`${zhijiName}送来了一捆竹子。`)
        }
        break
      case 'su_su':
        if (Math.random() < 0.25 + bonusChance2) {
          const cloths = ['cloth', 'silk_cloth', 'felt']
          const c = cloths[Math.floor(Math.random() * cloths.length)]!
          inventoryStore.addItem(c)
          addLog(`${zhijiName}送来了一匹${getItemById(c)?.name ?? '布料'}。`)
        }
        break
      case 'hong_dou':
        if (Math.random() < 0.3 + bonusChance2) {
          const wines = ['peach_wine', 'jujube_wine', 'corn_wine']
          const w = wines[Math.floor(Math.random() * wines.length)]!
          inventoryStore.addItem(w)
          addLog(`${zhijiName}送来了一壶${getItemById(w)?.name ?? '酒'}。`)
        }
        break
    }
  }

  npcStore.dailyReset()
  cookingStore.dailyReset()
  const hanhaiStore = useHanhaiStore()
  hanhaiStore.resetDailyBets()
  // 通商售货结算
  if (hanhaiStore.unlocked) {
    hanhaiStore.dailyTradeUpdate()
  }

  // 仙灵每日处理
  const hiddenNpcStore = useHiddenNpcStore()
  const discoveryTriggered = hiddenNpcStore.checkDiscoveryConditions()
  for (const { npcId, step } of discoveryTriggered) {
    if (step.logMessage) addLog(step.logMessage)
    if (step.scenes.length > 0) showDiscoveryScene(npcId, step)
  }
  hiddenNpcStore.dailyReset()
  const newAbilities = hiddenNpcStore.checkAbilityUnlocks()
  for (const a of newAbilities) {
    addLog(`【仙缘】${a.name}：${a.description}`)
    // 永久效果：最大体力+20
    if (a.id === 'shan_weng_3') {
      playerStore.addBonusMaxStamina(20)
    }
  }
  // 修复旧存档：确保已激活的 shan_weng_3 体力加成正确应用
  if (hiddenNpcStore.isAbilityActive('shan_weng_3')) {
    const expected = 20
    if (playerStore.bonusMaxStamina < expected) {
      playerStore.addBonusMaxStamina(expected - playerStore.bonusMaxStamina)
    }
  }

  // === 晚间结算（旧日期） ===

  // 酒肆日结自动营业
  const tavernNight = runTavernEndDay()
  if (tavernNight && tavernNight.revenue > 0) {
    useSystemStore().onTavernRevenue(tavernNight.revenue)
  }

  // 出货箱结算
  const shopStore = useShopStore()
  const shippingIncome = shopStore.processShippingBox()
  if (shippingIncome > 0) {
    playerStore.earnMoney(shippingIncome)
    addLog(`出货箱结算：收入${shippingIncome}文。`)
  }

  // 委托每日更新（当天结算：倒计时递减、过期处理）
  const expiredQuests = questStore.dailyUpdate()
  for (const eq of expiredQuests) {
    addLog(`委托「${eq.description}」已过期。`)
  }

  // 主线任务进度检查
  questStore.updateMainQuestProgress()

  // 钱庄日息（在日期推进前，按当日结算）
  useBankStore().processEndOfDay()

  // === 系统晚安（日期推进前，对应当日） ===
  const systemStore = useSystemStore()
  if (systemStore.awakened && systemStore.personaId) {
    systemStore.processGoodnight(gameStore.day, recoveryMode)
  }

  // === 日期推进 ===
  const { seasonChanged, oldSeason } = gameStore.nextDay()

  // === 系统觉醒检测（首次过夜后触发，不限季节/天数） ===
  if (!systemStore.awakened) {
    systemStore.pendingAwakening = true
  }

  // === 系统任务：过期 → 派发 → 验收 ===
  if (systemStore.awakened) {
    systemStore.processQuestExpiry(gameStore.day)
    systemStore.validateQuests()
    systemStore.processMeritBuffExpiry(gameStore.day)
    systemStore.processCompanionNewDay(gameStore.day)
    systemStore.touchOnlineTime()
  }

  // === 每日早安 ===
  if (systemStore.awakened && systemStore.personaId) {
    systemStore.addMumbleMessage(getMorningGreeting(systemStore.personaId, gameStore.season), gameStore.day)
  }

  useTavernStore().onNewDay()

  // === 晨间结算（新日期） ===

  // 瀚海轮换商品刷新（使用新日期，每周首日或首次加载时刷新）
  if (hanhaiStore.unlocked && (gameStore.day % 7 === 1 || hanhaiStore.weeklyRotatingStock.length === 0)) {
    hanhaiStore.refreshRotatingStock()
  }

  // 动物产出
  const unfedYesterday = animalStore.animals.filter(a => !a.wasFed).length
  const animalResult = animalStore.dailyUpdate()
  if (systemStore.awakened) {
    if (unfedYesterday > 0) systemStore.onAnimalNeglectDay(unfedYesterday)
    else systemStore.onAnimalCareDay()
  }
  if (animalResult.products.length > 0) {
    addLog(`动物们产出了${animalResult.products.length}件产品，快去拾取吧。`)
  }
  if (animalResult.died.length > 0) {
    addLog(`${animalResult.died.join('、')}因长期饥饿或病重不治而死亡了……`)
  }
  if (animalResult.gotSick.length > 0) {
    addLog(`${animalResult.gotSick.join('、')}因饥饿而生病了！请尽快喂食。`)
  }
  if (animalResult.healed.length > 0) {
    addLog(`${animalResult.healed.join('、')}吃饱后恢复了健康。`)
  }

  // 晨间标记：dailyUpdate 已重置 wasFed，若有喂食雇工或配偶喂食成功则标记新一天已喂食（不再消耗草料）
  const hasFeedHelper = npcStore.hiredHelpers.some(h => h.task === 'feed')
  if (hasFeedHelper || spouseFedSuccess) {
    animalStore.markAllFed()
  }

  // 晨间工作：雇工浇水/收获/除草
  const helperMorningResult = npcStore.processDailyHelpers(['water', 'harvest', 'weed'])
  for (const msg of helperMorningResult.messages) addLog(msg)

  // 晨间工作：配偶浇水/做饭/收获
  if (spouse) {
    const spouseDef = getNpcById(spouse.npcId)
    const spouseName = spouseDef?.name ?? '配偶'
    const bonusChance = spouse.friendship >= 2500 ? 0.1 : 0
    const highBond = spouse.friendship >= 3000 ? 0.15 : 0

    // 浇水：50% + bonus + highBond，3-6块
    if (Math.random() < 0.5 + bonusChance + highBond) {
      const unwatered = farmStore.plots.filter(p => (p.state === 'planted' || p.state === 'growing') && !p.watered)
      const count = Math.min(unwatered.length, 3 + Math.floor(Math.random() * 4))
      for (let i = 0; i < count; i++) farmStore.waterPlot(unwatered[i]!.id)
      if (count > 0) addLog(`${spouseName}一早帮你浇了${count}块地。`)
    }

    // 做饭：30% + bonus（好感>=2000）
    if (spouse.friendship >= 2000 && Math.random() < 0.3 + bonusChance) {
      const foods = ['food_rice_ball', 'food_congee', 'food_steamed_bun', 'food_honey_tea', 'food_stir_fry', 'food_dumpling']
      const food = foods[Math.floor(Math.random() * foods.length)]!
      inventoryStore.addItem(food)
      addLog(`${spouseName}一早做了一份${getItemById(food)?.name ?? '食物'}。`)
    }

    // 收获：30%（好感>=3000），最多3块，背包满时不收
    if (spouse.friendship >= 3000 && !inventoryStore.isFull && Math.random() < 0.3 + bonusChance) {
      const harvestable = farmStore.plots.filter(p => p.state === 'harvestable')
      const harvestCount = Math.min(harvestable.length, 3)
      let harvested = 0
      for (let i = 0; i < harvestCount; i++) {
        if (inventoryStore.isFull) break
        const hResult = farmStore.harvestPlot(harvestable[i]!.id)
        if (hResult.cropId) {
          inventoryStore.addItem(hResult.cropId, 1, 'normal')
          harvested++
        }
      }
      if (harvested > 0) addLog(`${spouseName}一早帮你收了${harvested}块地的庄稼。`)
    }
  }

  // 孵化器更新
  const incubatorResult = animalStore.dailyIncubatorUpdate()
  if (incubatorResult.hatched) {
    addLog(`鸡舍孵化器中的蛋孵出了一只${incubatorResult.hatched.name}！`)
  }

  // 牲口棚孵化器更新
  const barnIncubatorResult = animalStore.dailyBarnIncubatorUpdate()
  if (barnIncubatorResult.hatched) {
    addLog(`牲口棚孵化器中的蛋孵出了一只${barnIncubatorResult.hatched.name}！`)
  }

  // 宠物每日更新
  const petResult = animalStore.dailyPetUpdate()
  if (petResult.item) {
    const petName = animalStore.pet?.name ?? '宠物'
    const itemDef2 = getItemById(petResult.item)
    addLog(`${petName}叼回来一个${itemDef2?.name ?? petResult.item}。`)
  }

  // 鱼塘每日更新
  const fishPondStore = useFishPondStore()
  if (fishPondStore.pond.built) {
    const pondResult = fishPondStore.dailyUpdate()
    if (pondResult.products.length > 0) {
      addLog(`鱼塘产出了${pondResult.products.length}件水产品，快去拾取吧。`)
    }
    if (pondResult.died.length > 0) {
      addLog(`${pondResult.died.join('、')}因病重不治而死亡了……`)
    }
    if (pondResult.gotSick.length > 0) {
      addLog(`${pondResult.gotSick.join('、')}生病了！请及时治疗。`)
    }
    if (pondResult.bred) {
      addLog(`鱼塘繁殖成功，新的${pondResult.bred}出生了！`)
    }
    if (pondResult.breedingFailed) {
      addLog(`${pondResult.breedingFailed}。`)
    }
  }

  // 睡前提醒：待拾取产出
  const pickupReminders: string[] = []
  if (gameStore.creekCatch.length > 0) {
    pickupReminders.push(`溪流鱼获${gameStore.creekCatch.length}条`)
  }
  if (gameStore.pendingCaveLoot.length > 0) {
    const caveCount = gameStore.pendingCaveLoot.reduce((s, l) => s + l.quantity, 0)
    pickupReminders.push(`山洞产出${caveCount}份`)
  }
  if (gameStore.pendingFruitLoot.length > 0) {
    pickupReminders.push(`果林果实${gameStore.pendingFruitLoot.length}个`)
  }
  if (fishPondStore.pond.built && fishPondStore.pendingProducts.length > 0) {
    pickupReminders.push(`鱼塘产出${fishPondStore.pendingProducts.length}份`)
  }
  if (animalStore.pendingProducts.length > 0) {
    pickupReminders.push(`牧场产出${animalStore.pendingProducts.length}份`)
  }
  if (pickupReminders.length > 0) {
    addLog(`睡前别忘了去农场面板拾取：${pickupReminders.join('、')}。`)
  }

  // 蟹笼装饵雇工结算（在收获之前）
  const helperBaitResult = npcStore.processDailyHelpers(['bait'])
  for (const msg of helperBaitResult.messages) addLog(msg)

  // 蟹笼收获
  const fishingStore = useFishingStore()
  const crabPotHarvest = fishingStore.collectCrabPots()
  if (crabPotHarvest.length > 0) {
    const names = crabPotHarvest.map(c => c.name).join('、')
    addLog(`蟹笼捕获了${names}。`)
  }

  // 洞穴产出
  if (homeStore.caveChoice !== 'none') {
    homeStore.caveDaysActive++
  }
  const caveProducts = homeStore.dailyCaveUpdate()
  if (caveProducts.length > 0) {
    gameStore.pendingCaveLoot = [...gameStore.pendingCaveLoot, ...caveProducts]
    addLog('山洞中有新产出，去农场面板拾取吧。')
  }

  // 果树更新
  const fruitResult = farmStore.dailyFruitTreeUpdate(gameStore.season)
  if (fruitResult.fruits.length > 0) {
    const loot = fruitResult.fruits.map(f => ({ itemId: f.fruitId, quantity: 1, quality: f.quality }))
    gameStore.pendingFruitLoot = [...gameStore.pendingFruitLoot, ...loot]
    addLog('果林结出了果实，去农场面板拾取吧。')
  }

  // 野生树木更新
  const wildTreeResult = farmStore.dailyWildTreeUpdate()
  for (const p of wildTreeResult.products) {
    inventoryStore.addItem(p.productId)
  }
  if (wildTreeResult.products.length > 0) {
    addLog(`采脂器收获了${wildTreeResult.products.map(p => p.productName).join('、')}。`)
  }

  // 温室更新
  if (homeStore.greenhouseUnlocked) {
    farmStore.greenhouseDailyUpdate()
  }

  // 酒窖更新
  if (homeStore.farmhouseLevel >= 3) {
    const cellarResult = homeStore.dailyCellarUpdate()
    for (const r of cellarResult.upgraded) {
      const name = getItemById(r.itemId)?.name ?? r.itemId
      addLog(`酒窖中的${name}价值提升了+${homeStore.cellarValuePerCycle}文（共+${r.addedValue}文）`)
      if (r.upgradeCount >= 16 && r.upgradeCount % 16 === 0) {
        addLog(`${name}已成为陈酿${r.upgradeCount / 16}年！`)
      }
    }
  }

  // 钱包解锁检查
  const walletStore = useWalletStore()
  const newWalletItems = walletStore.checkAndUnlock()
  for (const name of newWalletItems) {
    addLog(`解锁了钱袋物品：${name}！`)
  }

  // 婚礼倒计时
  const weddingResult = npcStore.dailyWeddingUpdate()
  if (weddingResult.weddingToday && weddingResult.npcId) {
    const weddingNpcDef = getNpcById(weddingResult.npcId)
    addLog(`今天是你和${weddingNpcDef?.name ?? '心上人'}的大喜之日！`)
    triggerWeddingEvent(weddingResult.npcId)
  }

  // 孕期每日更新
  const pregResult = npcStore.dailyPregnancyUpdate()
  if (pregResult.born) {
    const qMsg =
      pregResult.born.quality === 'healthy' ? '健健康康的！' : pregResult.born.quality === 'premature' ? '虽然早产了一些，但平安无事。' : ''
    addLog(`${pregResult.born.name}出生了！恭喜！${qMsg}`)
  }
  if (pregResult.stageChanged) {
    const stageLabels: Record<string, string> = { early: '初期', mid: '中期', late: '后期', ready: '待产期' }
    addLog(`孕期进入${stageLabels[pregResult.stageChanged.to]}。记得多多照顾配偶。`)
  }
  if (pregResult.miscarriage) {
    addLog('很遗憾……这次没能迎来新生命。双方都需要一段时间来恢复。')
  }

  // 子女成长（已出生的子女）
  npcStore.dailyChildUpdate()

  // NPC 提议要孩子（不自动确认，玩家回家后回应）
  if (npcStore.checkChildProposal()) {
    npcStore.triggerChildProposal()
    const spouseDef2 = getNpcById(npcStore.getSpouse()?.npcId ?? '')
    addLog(`${spouseDef2?.name ?? '配偶'}似乎有话想和你说……`)
  }

  // 为新的一天生成委托（在 nextDay 之后，使用新季节和新日期）
  questStore.generateDailyQuests(gameStore.season, gameStore.day)

  // 每7天生成一个特殊订单 (第7/14/21/28天, 梯度递增)
  const specialOrderDays: Record<number, number> = { 7: 1, 14: 2, 21: 3, 28: 4 }
  const tier = specialOrderDays[gameStore.day]
  if (tier && !questStore.specialOrder) {
    questStore.generateSpecialOrder(gameStore.season, tier)
  }

  // 新一天如果下雨，立即浇水所有作物（让玩家看到已浇水状态）
  if (gameStore.isRainy) {
    for (const plot of farmStore.plots) {
      if (plot.state === 'planted' || plot.state === 'growing') {
        plot.watered = true
        plot.unwateredDays = 0
      }
    }
  }

  const bedHour = gameStore.hour
  const { moneyLost, recoveryPct } = playerStore.dailyReset(recoveryMode, bedHour)

  const bankStore = useBankStore()
  if (bankStore.hasActiveLoan && bankStore.isOverdue()) {
    playerStore.stamina = Math.floor(playerStore.maxStamina * 0.5)
  }

  // 仙灵结缘每日奖励（必须在 dailyReset 之后，否则 stamina_restore 会被覆盖）
  const bondMessages = hiddenNpcStore.dailyBondBonus()
  for (const msg of bondMessages.messages) addLog(msg)

  let summary: string
  if (recoveryMode === 'passout') {
    summary =
      moneyLost > 0
        ? `你体力耗尽倒下了……有人把你送回家。丢失了${moneyLost}文。次日仅恢复50%体力。`
        : `你体力耗尽倒下了……次日仅恢复50%体力。`
  } else if (recoveryMode === 'late') {
    const pct = Math.round(recoveryPct * 100)
    summary = `你熬夜到很晚才睡……次日仅恢复${pct}%体力。`
  } else if (bankStore.hasActiveLoan && bankStore.isOverdue()) {
    summary = '由于钱庄催债压力，睡眠体力只能恢复50%，请尽早去钱庄还清欠款！'
  } else {
    summary = '美好的一天结束了。'
  }

  addLog(summary)

  // 换季处理
  if (seasonChanged) {
    if (systemStore.awakened) {
      systemStore.onSeasonChange(oldSeason, gameStore.season)
    }
    const { witheredCount, reclaimedCount } = farmStore.onSeasonChange(gameStore.season)
    addLog(`—— 季节更替：${SEASON_NAMES[oldSeason]}→${SEASON_NAMES[gameStore.season]} ——`)
    if (witheredCount > 0) {
      addLog(`${witheredCount}株不适应新季节的作物枯萎了……`)
    }
    if (reclaimedCount > 0) {
      addLog(`${reclaimedCount}块荒废的耕地被杂草覆盖了。`)
    }
    if (oldSeason === 'winter' && gameStore.season === 'spring') {
      addLog('新的一年开始了！农场经过一冬有些荒废，需要重新开垦。')
    }
    farmStore.fruitTreeSeasonUpdate(oldSeason === 'winter')

    // 桃源田庄：换季自动施肥（按种植等级升级）
    if (gameStore.farmMapType === 'standard') {
      const { count: fertCount, fertilizerName } = farmStore.applyFertileSoil(skillStore.getSkill('farming').level)
      if (fertCount > 0) {
        addLog(`桃源沃土滋养大地，${fertCount}块耕地获得了${fertilizerName}。`)
      }
    }

    // 新手引导：记录换季标记
    tutorialStore.setFlag('justChangedSeason')
  }

  // 闪电
  if (gameStore.weather === 'stormy') {
    const strike = farmStore.lightningStrike()
    if (strike.absorbed) {
      inventoryStore.addItem('battery')
      addLog('避雷针吸收了一道闪电！获得了电池组。')
    } else if (strike.hit) {
      addLog(`雷暴中一道闪电击中了你的农场，一株${strike.cropName}被毁了！建造避雷针可以防护。`)
    }
  }

  if (gameStore.isRainy) {
    addLog('今天下雨，作物自动浇水。')
  }

  // 天气预报
  addLog(`明日天气预报：${WEATHER_NAMES[gameStore.tomorrowWeather]}`)

  // 换季倒计时提醒（第25-27天早晨）
  if (!seasonChanged && gameStore.day >= 25 && gameStore.day <= 27) {
    const daysLeft = 28 - gameStore.day
    const SEASON_ORDER = ['spring', 'summer', 'autumn', 'winter'] as const
    const nextSeason = SEASON_ORDER[(SEASON_ORDER.indexOf(gameStore.season) + 1) % 4]!
    let cropAtRisk = 0
    for (const plot of farmStore.plots) {
      if ((plot.state === 'planted' || plot.state === 'growing' || plot.state === 'harvestable') && plot.cropId) {
        const crop = getCropById(plot.cropId)
        if (crop && !crop.season.includes(nextSeason)) cropAtRisk++
      }
    }
    if (cropAtRisk > 0) {
      addLog(`距离换季还有${daysLeft}天，${cropAtRisk}株作物不适应${SEASON_NAMES[nextSeason]}季，届时将会枯萎。`)
      showFloat(`换季倒计时${daysLeft}天！${cropAtRisk}株作物将枯萎`, 'danger')
    } else {
      addLog(`距离换季还有${daysLeft}天。`)
    }
  }

  // 今日行情
  const marketInfo = getDailyMarketInfo(gameStore.year, gameStore.seasonIndex, gameStore.day, shopStore.getRecentShipping())
  const booms = marketInfo.filter(m => m.trend === 'boom')
  const crashes = marketInfo.filter(m => m.trend === 'crash')
  if (booms.length > 0) {
    addLog(`今日行情：${booms.map(b => MARKET_CATEGORY_NAMES[b.category]).join('、')}价格大涨！`)
  }
  if (crashes.length > 0) {
    addLog(`今日行情：${crashes.map(c => MARKET_CATEGORY_NAMES[c.category]).join('、')}价格暴跌。`)
  }

  // 新手引导：晨间提示（仅第1年）
  // 注意：此时 nextDay() 已执行，gameStore.day 是新一天的日期
  // 例如玩家结束第1天后，gameStore.day === 2（第2天早晨）
  if (tutorialStore.enabled && gameStore.year === 1) {
    const conditions: Record<string, () => boolean> = {
      earlyFirstDay: () => gameStore.day === 2 && gameStore.season === 'spring',
      allWasteland: () => farmStore.plots.every(p => p.state === 'wasteland') && gameStore.day > 2,
      tilledNoPlanted: () =>
        farmStore.plots.some(p => p.state === 'tilled') &&
        !farmStore.plots.some(p => p.state === 'planted' || p.state === 'growing' || p.state === 'harvestable'),
      plantedUnwatered: () =>
        farmStore.plots.some(p => (p.state === 'planted' || p.state === 'growing') && !p.watered) && !gameStore.isRainy,
      hasHarvestable: () => farmStore.plots.some(p => p.state === 'harvestable'),
      harvestedNeverSold: () => achievementStore.stats.totalCropsHarvested > 0 && achievementStore.stats.totalMoneyEarned === 0,
      earlyGame: () => gameStore.day <= 4 && gameStore.season === 'spring',
      staminaWasLow: () => tutorialStore.getFlag('staminaWasLow'),
      neverVisitedShop: () => !tutorialStore.hasPanelVisited('shop'),
      neverFished: () => achievementStore.stats.totalFishCaught === 0 && gameStore.day >= 4,
      neverMined: () => achievementStore.stats.highestMineFloor === 0 && gameStore.day >= 6,
      neverTalkedNpc: () => npcStore.npcStates.every(n => n.friendship === 0) && gameStore.day >= 3,
      neverCheckedQuests: () => !tutorialStore.hasPanelVisited('quest') && gameStore.day >= 5,
      neverCooked: () => achievementStore.stats.totalRecipesCooked === 0 && gameStore.day >= 8,
      firstRainyDay: () => gameStore.isRainy && !tutorialStore.getFlag('seenRain'),
      justChangedSeason: () => tutorialStore.getFlag('justChangedSeason'),
      hasCropNoSprinkler: () =>
        farmStore.plots.some(p => p.state === 'growing') && farmStore.sprinklers.length === 0 && gameStore.day >= 11,
      neverHadAnimal: () => animalStore.animals.length === 0 && gameStore.day >= 15
    }
    for (const tip of MORNING_TIPS) {
      if (tutorialStore.isTipShown(tip.id)) continue
      const check = conditions[tip.conditionKey]
      if (check && check()) {
        addLog(tip.message)
        tutorialStore.markTipShown(tip.id)
        if (tip.conditionKey === 'firstRainyDay') tutorialStore.setFlag('seenRain')
        if (tip.conditionKey === 'justChangedSeason') tutorialStore.setFlag('seenSeasonChange')
        break // 每天只显示一条
      }
    }
    // 清除临时标记
    tutorialStore.setFlag('justChangedSeason', false)
    tutorialStore.setFlag('staminaWasLow', false)
  }

  // 食谱解锁
  checkRecipeUnlocks()

  // 季节事件
  const event = getTodayEvent(gameStore.season, gameStore.day)
  if (event) {
    if (systemStore.awakened) {
      systemStore.onFestivalDay(event.name)
    }
    applyEventEffects(event)
    if (event.interactive && event.festivalType) {
      showFestival(event.festivalType)
    } else {
      const { startFestivalBgm } = useAudio()
      startFestivalBgm(gameStore.season)
    }
    // 替换 narrative 中的动态占位符
    const ORDINALS = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
    const yearStr = gameStore.year <= 10 ? ORDINALS[gameStore.year - 1]! : String(gameStore.year)
    const resolved = {
      ...event,
      narrative: event.narrative.map(line => line.replace('{year}', yearStr))
    }
    showEvent(resolved)
  }

  // 成就检查
  const newAchievements = achievementStore.checkAchievements()
  for (const a of newAchievements) {
    addLog(`【成就达成】${a.name}！${a.reward.money ? `获得${a.reward.money}文` : ''}`)
    showFloat(`成就: ${a.name}`, 'accent')
  }

  // 成就食谱解锁
  checkAchievementRecipes()

  // 洞穴解锁检查
  if (!homeStore.caveUnlocked && achievementStore.stats.totalMoneyEarned >= CAVE_UNLOCK_EARNINGS) {
    homeStore.unlockCave()
    addLog('你的累计收入引起了注意……村后的山洞已为你开放！去设施面板选择山洞用途吧。')
  }

  // ===== 田庄特殊效果 =====

  // 荒野田庄：被动矿石（增强）+ 夜间野兽遭遇
  if (gameStore.farmMapType === 'wilderness') {
    const orePool = ['copper_ore', 'iron_ore', 'gold_ore']
    const randomOre = orePool[Math.floor(Math.random() * orePool.length)]!
    const qty = 2 + Math.floor(Math.random() * 2) // 2-3
    inventoryStore.addItem(randomOre, qty)
    const oreDef = getItemById(randomOre)
    addLog(`荒野中发现了${qty}个${oreDef?.name ?? randomOre}。`)

    // 夜间野兽遭遇（25%概率）
    if (Math.random() < 0.25) {
      const combatLevel = skillStore.getSkill('combat').level
      const winRate = Math.min(0.95, 0.5 + combatLevel * 0.05)
      if (Math.random() < winRate) {
        const lootPool = ['copper_ore', 'iron_ore', 'quartz', 'jade', 'gold_ore']
        const loot = lootPool[Math.floor(Math.random() * lootPool.length)]!
        const lootQty = 1 + Math.floor(Math.random() * 2)
        inventoryStore.addItem(loot, lootQty)
        skillStore.addExp('combat', 15)
        const lootName = getItemById(loot)?.name ?? loot
        addLog(`夜间有野兽入侵！你奋力击退了它，缴获了${lootQty}个${lootName}。`)
      } else {
        const damage = 5 + Math.floor(Math.random() * 11) // 5-15
        playerStore.takeDamage(damage)
        const crops = farmStore.plots.filter(p => p.state === 'growing' || p.state === 'harvestable')
        if (crops.length > 0) {
          const target = crops[Math.floor(Math.random() * crops.length)]!
          const cropName = getCropById(target.cropId ?? '')?.name ?? '作物'
          farmStore.removeCrop(target.id)
          addLog(`夜间有野兽入侵！你没能挡住它，受了${damage}点伤，一株${cropName}被破坏了。`)
        } else {
          addLog(`夜间有野兽入侵！你没能挡住它，受了${damage}点伤。`)
        }
      }
    }
  }

  // 竹林田庄：每日林中拾遗
  if (gameStore.farmMapType === 'forest') {
    const foragePool = getForageItems(gameStore.season)
    const commonForage = foragePool.filter(f => f.chance >= 0.1)
    if (commonForage.length > 0) {
      const count = 1 + (Math.random() < 0.4 ? 1 : 0) // 1-2个
      const gathered: string[] = []
      for (let i = 0; i < count; i++) {
        const item = commonForage[Math.floor(Math.random() * commonForage.length)]!
        const quality = skillStore.rollForageQuality()
        inventoryStore.addItem(item.itemId, 1, quality)
        skillStore.addExp('foraging', item.expReward)
        gathered.push(getItemById(item.itemId)?.name ?? item.itemId)
      }
      addLog(`竹林间发现了${gathered.join('和')}。`)
    }
  }

  // 山丘田庄：地表矿脉生成
  if (gameStore.farmMapType === 'hilltop') {
    if (!gameStore.surfaceOrePatch && Math.random() < 0.35) {
      const year = gameStore.year
      const orePool = year >= 2 ? ['copper_ore', 'iron_ore', 'gold_ore'] : ['copper_ore', 'iron_ore']
      const oreId = orePool[Math.floor(Math.random() * orePool.length)]!
      const qty = 3 + Math.floor(Math.random() * 3) // 3-5
      gameStore.surfaceOrePatch = { oreId, quantity: qty }
      const oreName = getItemById(oreId)?.name ?? '矿石'
      addLog(`山丘上发现了一处${oreName}脉！`)
    }
  }

  // 溪流田庄：溪流鱼获生成
  if (gameStore.farmMapType === 'riverland') {
    const seasonFish = FISH.filter(f => (f.location ?? 'creek') === 'creek' && f.season.includes(gameStore.season as any))
    if (seasonFish.length > 0) {
      const isRainy = gameStore.isRainy
      const catchCount = isRainy ? 2 + Math.floor(Math.random() * 2) : 1 + Math.floor(Math.random() * 2)
      const catches: { fishId: string; quality: 'normal' | 'fine' | 'excellent' | 'supreme' }[] = []
      for (let i = 0; i < catchCount; i++) {
        const fish = seasonFish[Math.floor(Math.random() * seasonFish.length)]!
        const quality: 'normal' | 'fine' = Math.random() < 0.15 ? 'fine' : 'normal'
        catches.push({ fishId: fish.id, quality })
      }
      const MAX_CREEK_CATCH = 10
      const merged = [...gameStore.creekCatch, ...catches].slice(0, MAX_CREEK_CATCH)
      gameStore.creekCatch = merged
      addLog(`溪流中有鱼儿在跳跃，去农场面板收取鱼获吧。`)
    }
  }

  // 宠物领养触发（春季第一年第7天起，每天检查直到领养）
  if (gameStore.day >= 7 && gameStore.year === 1 && gameStore.season === 'spring' && !animalStore.pet) {
    triggerPetAdoption()
  }

  // 回到农场页面（防止留在商铺等页面继续操作）
  void router.push({ name: 'farm' })

  // 自动存档
  saveStore.autoSave()
}

export const useEndDay = () => {
  return { handleEndDay }
}
