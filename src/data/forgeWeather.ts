import type { Weather } from '@/types'

/** 锻造小游戏步骤（起炉 / 锻打 / 淬火） */
export type ForgeMinigameStep = 'heat' | 'hammer' | 'quench'

export interface ForgeMinigameMod {
  /** 全流程条速倍率（如暴风雨 +8%） */
  allStepsSpeedMult?: number
  /** 单步条速倍率 */
  stepSpeedMult?: Partial<Record<ForgeMinigameStep, number>>
  /** 单步目标区宽度倍率 */
  stepZoneWidthMult?: Partial<Record<ForgeMinigameStep, number>>
  /** 锻打连点阶段时长（秒） */
  hammerDurationSec?: number
}

/** 品质升档权重修正（§7.4） */
export const FORGE_WEATHER_QUALITY_DELTA: Partial<Record<Weather, number>> = {
  sunny: 0.02,
  snowy: -0.02
}

/** 小游戏天气修正（§7.4） */
export const FORGE_WEATHER_MINIGAME: Partial<Record<Weather, ForgeMinigameMod>> = {
  stormy: { allStepsSpeedMult: 1.08 },
  rainy: { stepSpeedMult: { quench: 1.06 } },
  snowy: { stepSpeedMult: { hammer: 1.05 }, hammerDurationSec: 6 },
  windy: { stepZoneWidthMult: { heat: 1.08 } }
}

const WEATHER_HINTS: Partial<Record<Weather, string>> = {
  sunny: '晴日干燥，炉温与发色更易辨认',
  rainy: '雨声淅沥，淬火节奏略不同',
  stormy: '雷暴扰神，节奏更难稳住',
  snowy: '工坊偏冷，锻打窗口更短',
  windy: '大风助火，起炉更顺手',
  green_rain: '绿雨浸润，桃源灵气可铸'
}

export const getForgeWeatherHint = (weather: Weather): string | null =>
  WEATHER_HINTS[weather] ?? null

/** 当日是否可能出现天气稀有词条 */
export const hasWeatherAffixChance = (weather: Weather): boolean =>
  weather === 'sunny' ||
  weather === 'rainy' ||
  weather === 'snowy' ||
  weather === 'windy' ||
  weather === 'stormy' ||
  weather === 'green_rain'
