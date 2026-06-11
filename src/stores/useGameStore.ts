import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Season, Weather, Location, LocationGroup, FarmMapType, Quality } from '@/types'
import {
  DAY_START_HOUR,
  PASSOUT_HOUR,
  MIDNIGHT_HOUR,
  WEEKDAY_NAMES,
  getWeekday,
  formatTime,
  getTimePeriod,
  TAB_TO_LOCATION_GROUP,
  TRAVEL_TIME,
  TRAVEL_STAMINA,
  getLocationGroupName,
  resolveEffectiveLocationGroup
} from '@/data/timeConstants'
import router from '@/router'
import { useCookingStore } from './useCookingStore'
import { useAnimalStore } from './useAnimalStore'
import { useInventoryStore } from './useInventoryStore'
import { usePlayerStore } from './usePlayerStore'
import { useHiddenNpcStore } from './useHiddenNpcStore'

/** 季节顺序 */
const SEASON_ORDER: Season[] = ['spring', 'summer', 'autumn', 'winter']

/** 季节中文名 */
export const SEASON_NAMES: Record<Season, string> = {
  spring: '春',
  summer: '夏',
  autumn: '秋',
  winter: '冬'
}

/** 天气中文名 */
export const WEATHER_NAMES: Record<Weather, string> = {
  sunny: '晴',
  rainy: '雨',
  stormy: '雷雨',
  snowy: '雪',
  windy: '大风',
  green_rain: '绿雨'
}

/** 固定天气日 */
const FIXED_WEATHER: Partial<Record<Season, Record<number, Weather>>> = {
  spring: { 1: 'sunny' },
  summer: { 13: 'stormy', 26: 'stormy' }
}

/** 节日日期（永远晴天） */
const FESTIVAL_DAYS: Record<Season, number[]> = {
  spring: [1, 8, 15, 24],
  summer: [5, 15, 22],
  autumn: [8, 15, 22],
  winter: [8, 15, 22, 28]
}

export const useGameStore = defineStore('game', () => {
  const year = ref(1)
  const season = ref<Season>('spring')
  const day = ref(1)
  const hour = ref(DAY_START_HOUR)
  const weather = ref<Weather>('sunny')
  const tomorrowWeather = ref<Weather>('sunny')
  const currentLocation = ref<Location>('farm')
  const currentLocationGroup = ref<LocationGroup>('farm')
  const isGameStarted = ref(false)
  const farmMapType = ref<FarmMapType>('standard')
  const midnightWarned = ref(false)
  const dailyLuck = ref(0)

  /** 山丘田庄：地表矿脉（日结生成，在农场面板开采后清除） */
  const surfaceOrePatch = ref<{ oreId: string; quantity: number } | null>(null)

  /** 溪流田庄：溪流鱼获（日结生成，在农场面板收取后清除） */
  const creekCatch = ref<{ fishId: string; quality: Quality }[]>([])

  /** 山洞产出（日结生成，在农场面板拾取后清除） */
  const pendingCaveLoot = ref<{ itemId: string; quantity: number; quality: Quality }[]>([])

  /** 果林产出（日结生成，在农场面板拾取后清除） */
  const pendingFruitLoot = ref<{ itemId: string; quantity: number; quality: Quality }[]>([])

  const seasonIndex = computed(() => SEASON_ORDER.indexOf(season.value))
  const seasonName = computed(() => SEASON_NAMES[season.value])
  const weatherName = computed(() => WEATHER_NAMES[weather.value])
  const isRainy = computed(() => weather.value === 'rainy' || weather.value === 'stormy' || weather.value === 'green_rain')

  // 时间相关 computed
  const weekday = computed(() => getWeekday(day.value))
  const weekdayName = computed(() => WEEKDAY_NAMES[weekday.value])
  const timeDisplay = computed(() => formatTime(hour.value))
  const timePeriod = computed(() => getTimePeriod(hour.value))
  const isLateNight = computed(() => hour.value >= MIDNIGHT_HOUR)
  const isPastBedtime = computed(() => hour.value >= PASSOUT_HOUR)

  /** 随机生成天气（按季节概率 + 固定天气日 + 节日晴天） */
  const rollWeather = (s?: Season, d?: number): Weather => {
    const targetSeason = s ?? season.value
    const targetDay = d ?? day.value

    // 节日日永远晴天
    if (FESTIVAL_DAYS[targetSeason]?.includes(targetDay)) return 'sunny'

    // 固定天气日
    const fixed = FIXED_WEATHER[targetSeason]?.[targetDay]
    if (fixed) return fixed

    // 第1年夏季第5天固定绿雨
    if (year.value === 1 && targetSeason === 'summer' && targetDay === 4) return 'green_rain'

    // 按季节概率随机
    const roll = Math.random()
    // 仙缘能力：唤雨（long_ling_2）下雨概率+15%，通过压缩晴天概率实现
    const rainBoost = useHiddenNpcStore().getAbilityValue('long_ling_2') / 100
    switch (targetSeason) {
      case 'spring':
        return roll < 0.5 - rainBoost ? 'sunny' : roll < 0.75 ? 'rainy' : roll < 0.85 ? 'stormy' : 'windy'
      case 'summer':
        // 绿雨: 8% 概率 (仅夏季)
        return roll < 0.08 ? 'green_rain' : roll < 0.42 - rainBoost ? 'sunny' : roll < 0.68 ? 'rainy' : roll < 0.83 ? 'stormy' : 'windy'
      case 'autumn':
        return roll < 0.45 - rainBoost ? 'sunny' : roll < 0.7 ? 'rainy' : roll < 0.8 ? 'stormy' : 'windy'
      case 'winter':
        return roll < 0.5 - rainBoost ? 'sunny' : roll < 0.8 ? 'snowy' : 'windy'
    }
  }

  /** 推进时间（小时），返回结果 */
  const advanceTime = (hours: number): { ok: boolean; passedOut: boolean; message: string } => {
    if (hours <= 0) return { ok: true, passedOut: false, message: '' }

    // 速度增益减少时间消耗
    const cookingStore = useCookingStore()
    const speedBuff = cookingStore.activeBuff?.type === 'speed' ? cookingStore.activeBuff.value / 100 : 0
    const effectiveHours = hours * (1 - speedBuff)

    const prevHour = hour.value
    const newHour = hour.value + effectiveHours

    if (newHour >= PASSOUT_HOUR) {
      hour.value = PASSOUT_HOUR
      return { ok: true, passedOut: true, message: '已经凌晨2点了，你撑不住倒下了……' }
    }

    hour.value = newHour

    // 跨午夜提示（仅一次）
    if (!midnightWarned.value && prevHour < MIDNIGHT_HOUR && hour.value >= MIDNIGHT_HOUR) {
      midnightWarned.value = true
      return { ok: true, passedOut: false, message: '已经过了午夜，你开始感到困倦……' }
    }

    return { ok: true, passedOut: false, message: '' }
  }

  const getEffectiveLocationGroup = (): LocationGroup => {
    return resolveEffectiveLocationGroup(currentLocationGroup.value, router.currentRoute.value.name as string | undefined)
  }

  /** 查询切换到目标 tab 的移动耗时 */
  const getTravelCost = (targetTab: string): number => {
    const targetGroup = TAB_TO_LOCATION_GROUP[targetTab]
    if (!targetGroup) return 0
    const fromGroup = getEffectiveLocationGroup()
    if (targetGroup === fromGroup) return 0
    const key = `${fromGroup}->${targetGroup}`
    const baseCost = TRAVEL_TIME[key] ?? 0.5
    // 拥有马减少30%旅行时间
    const animalStore = useAnimalStore()
    let multiplier = animalStore.hasHorse ? 0.7 : 1
    // 装备旅行速度加成（与马叠乘）
    const inventoryStore = useInventoryStore()
    const travelSpeedBonus = inventoryStore.getRingEffectValue('travel_speed')
    if (travelSpeedBonus > 0) {
      multiplier *= 1 - travelSpeedBonus
    }
    return baseCost * multiplier
  }

  /** 移动到目标 tab 对应的地点组 */
  const travelTo = (targetTab: string): { ok: boolean; timeCost: number; passedOut: boolean; message: string } => {
    const targetGroup = TAB_TO_LOCATION_GROUP[targetTab]
    if (!targetGroup) return { ok: true, timeCost: 0, passedOut: false, message: '' }

    const fromGroup = getEffectiveLocationGroup()
    if (targetGroup === fromGroup) {
      currentLocationGroup.value = targetGroup
      return { ok: true, timeCost: 0, passedOut: false, message: '' }
    }

    const cost = getTravelCost(targetTab)

    // 体力消耗：有马减半（向下取整）
    const key = `${fromGroup}->${targetGroup}`
    const baseStamina = TRAVEL_STAMINA[key] ?? 1
    const animalStore = useAnimalStore()
    const staminaCost = animalStore.hasHorse ? Math.max(1, Math.floor(baseStamina / 2)) : baseStamina
    const playerStore = usePlayerStore()
    playerStore.consumeStamina(staminaCost)

    const result = advanceTime(cost)
    const targetName = getLocationGroupName(targetGroup)
    currentLocationGroup.value = targetGroup

    const travelMsg = cost > 0 ? `前往${targetName}，路上花了${Math.round(cost * 60)}分钟，消耗${staminaCost}点体力。` : ''
    return {
      ok: true,
      timeCost: cost,
      passedOut: result.passedOut,
      message: travelMsg + (result.message ? ' ' + result.message : '')
    }
  }

  /** 推进到下一天，返回换季信息 */
  const nextDay = (): { seasonChanged: boolean; oldSeason: Season } => {
    const oldSeason = season.value
    day.value++
    if (day.value > 28) {
      day.value = 1
      const nextIndex = seasonIndex.value + 1
      if (nextIndex >= 4) {
        season.value = 'spring'
        year.value++
      } else {
        season.value = SEASON_ORDER[nextIndex]!
      }
    }
    // 天气预报链式推进
    weather.value = tomorrowWeather.value
    const nextDay = day.value + 1 > 28 ? 1 : day.value + 1
    const nextSeason = day.value + 1 > 28 ? SEASON_ORDER[(SEASON_ORDER.indexOf(season.value) + 1) % 4]! : season.value
    tomorrowWeather.value = rollWeather(nextSeason, nextDay)
    // 每日运势: -0.1 ~ +0.1
    dailyLuck.value = Math.random() * 0.2 - 0.1
    hour.value = DAY_START_HOUR
    midnightWarned.value = false
    currentLocationGroup.value = 'farm'
    return { seasonChanged: oldSeason !== season.value, oldSeason }
  }

  /** 移动到指定地点 */
  const goTo = (location: Location) => {
    currentLocation.value = location
  }

  /** 强制设置明日天气（雨图腾等） */
  const setTomorrowWeather = (w: Weather) => {
    tomorrowWeather.value = w
  }

  /** 开始新游戏 */
  const startNewGame = (mapType: FarmMapType = 'standard') => {
    year.value = 1
    season.value = 'spring'
    day.value = 1
    hour.value = DAY_START_HOUR
    midnightWarned.value = false
    weather.value = 'sunny'
    tomorrowWeather.value = rollWeather('spring', 2)
    currentLocation.value = 'farm'
    currentLocationGroup.value = 'farm'
    farmMapType.value = mapType
    isGameStarted.value = true
  }

  /** 导出存档数据 */
  const serialize = () => {
    return {
      year: year.value,
      season: season.value,
      day: day.value,
      hour: hour.value,
      weather: weather.value,
      tomorrowWeather: tomorrowWeather.value,
      currentLocation: currentLocation.value,
      currentLocationGroup: currentLocationGroup.value,
      farmMapType: farmMapType.value,
      dailyLuck: dailyLuck.value,
      surfaceOrePatch: surfaceOrePatch.value,
      creekCatch: creekCatch.value,
      pendingCaveLoot: pendingCaveLoot.value,
      pendingFruitLoot: pendingFruitLoot.value
    }
  }

  /** 加载存档数据 */
  const deserialize = (data: any) => {
    year.value = data.year ?? 1
    season.value = data.season ?? 'spring'
    day.value = data.day ?? 1
    hour.value = data.hour ?? DAY_START_HOUR
    midnightWarned.value = (data.hour ?? DAY_START_HOUR) >= MIDNIGHT_HOUR
    weather.value = data.weather ?? 'sunny'
    tomorrowWeather.value = data.tomorrowWeather ?? rollWeather(data.season ?? 'spring', ((data.day ?? 1) % 28) + 1)
    currentLocation.value = data.currentLocation ?? 'farm'
    currentLocationGroup.value = data.currentLocationGroup ?? 'farm'
    farmMapType.value = data.farmMapType ?? 'standard'
    dailyLuck.value = data.dailyLuck ?? 0
    surfaceOrePatch.value = data.surfaceOrePatch ?? null
    creekCatch.value = data.creekCatch ?? []
    pendingCaveLoot.value = data.pendingCaveLoot ?? []
    pendingFruitLoot.value = data.pendingFruitLoot ?? []
    isGameStarted.value = true
  }

  return {
    year,
    season,
    day,
    hour,
    weather,
    tomorrowWeather,
    currentLocation,
    currentLocationGroup,
    isGameStarted,
    farmMapType,
    midnightWarned,
    dailyLuck,
    surfaceOrePatch,
    creekCatch,
    pendingCaveLoot,
    pendingFruitLoot,
    seasonIndex,
    seasonName,
    weatherName,
    isRainy,
    weekday,
    weekdayName,
    timeDisplay,
    timePeriod,
    isLateNight,
    isPastBedtime,
    nextDay,
    goTo,
    startNewGame,
    advanceTime,
    getTravelCost,
    travelTo,
    setTomorrowWeather,
    serialize,
    deserialize
  }
})
