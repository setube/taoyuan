import { ref, computed } from "vue";
import { defineStore } from "pinia";
import type {
  Season,
  Weather,
  Location,
  LocationGroup,
  FarmMapType,
  CityLocationId,
  GridPosition,
} from "@/types";
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
  getLocationGroupName,
  MINUTES_PER_TURN,
} from "@/data/timeConstants";
import { getCellAt, getTravelTurnsBetween, getCenter } from "@/data/mapGrid";
import { getLocationName } from "@/data/locations";
import { useAnimalStore } from "./useAnimalStore";
import { useInventoryStore } from "./useInventoryStore";

/** 季节顺序 */
const SEASON_ORDER: Season[] = ["spring", "summer", "autumn", "winter"];

/** 季节中文名 */
export const SEASON_NAMES: Record<Season, string> = {
  spring: "春",
  summer: "夏",
  autumn: "秋",
  winter: "冬",
};

/** 天气中文名 */
export const WEATHER_NAMES: Record<Weather, string> = {
  sunny: "晴",
  rainy: "雨",
  stormy: "雷雨",
  snowy: "雪",
  windy: "大风",
  green_rain: "绿雨",
};

/** 固定天气日 */
const FIXED_WEATHER: Partial<Record<Season, Record<number, Weather>>> = {
  spring: { 1: "sunny" },
  summer: { 13: "stormy", 26: "stormy" },
};

/** 节日日期（永远晴天） */
const FESTIVAL_DAYS: Record<Season, number[]> = {
  spring: [1, 8, 15, 24],
  summer: [5, 15, 22],
  autumn: [8, 15, 22],
  winter: [8, 15, 22, 28],
};

export const useGameStore = defineStore("game", () => {
  const year = ref(1);
  const season = ref<Season>("spring");
  const day = ref(1);
  const hour = ref(DAY_START_HOUR);
  const weather = ref<Weather>("sunny");
  const tomorrowWeather = ref<Weather>("sunny");
  const currentLocation = ref<Location>("farm");
  const currentLocationGroup = ref<LocationGroup>("farm");
  const isGameStarted = ref(false);
  const farmMapType = ref<FarmMapType>("standard");
  const midnightWarned = ref(false);
  const dailyLuck = ref(0);
  /** 末日生存：阶段（疫情前/后） */
  const phase = ref<"pre" | "post">("pre");
  /** 末日生存：阶段一可用回合总数（5 小时 = 20 回合） */
  const preOutbreakTurnsTotal = 20;
  /** 末日生存：阶段一已消耗回合数 */
  const turnsUsedInPre = ref(0);
  /** 末日生存：今日已消耗回合数（每日重置，用于顶部栏显示） */
  const turnsUsedToday = ref(0);
  /** 末日生存：地图上的网格位置（玩家所在格） */
  const mapPosition = ref<GridPosition>(getCenter());
  /** 末日生存：当前城市地点（由 mapPosition 所在格推导） */
  const currentCityLocation = computed<CityLocationId>(() =>
    getCellAt(mapPosition.value.row, mapPosition.value.col),
  );

  const seasonIndex = computed(() => SEASON_ORDER.indexOf(season.value));
  const seasonName = computed(() => SEASON_NAMES[season.value]);
  const weatherName = computed(() => WEATHER_NAMES[weather.value]);
  const isRainy = computed(
    () =>
      weather.value === "rainy" ||
      weather.value === "stormy" ||
      weather.value === "green_rain",
  );

  // 时间相关 computed
  const weekday = computed(() => getWeekday(day.value));
  const weekdayName = computed(() => WEEKDAY_NAMES[weekday.value]);
  const timeDisplay = computed(() => formatTime(hour.value));
  const timePeriod = computed(() => getTimePeriod(hour.value));
  const isLateNight = computed(() => hour.value >= MIDNIGHT_HOUR);
  const isPastBedtime = computed(() => hour.value >= PASSOUT_HOUR);

  /** 随机生成天气（按季节概率 + 固定天气日 + 节日晴天） */
  const rollWeather = (s?: Season, d?: number): Weather => {
    const targetSeason = s ?? season.value;
    const targetDay = d ?? day.value;

    // 节日日永远晴天
    if (FESTIVAL_DAYS[targetSeason]?.includes(targetDay)) return "sunny";

    // 固定天气日
    const fixed = FIXED_WEATHER[targetSeason]?.[targetDay];
    if (fixed) return fixed;

    // 第1年夏季第5天固定绿雨
    if (year.value === 1 && targetSeason === "summer" && targetDay === 4)
      return "green_rain";

    // 按季节概率随机
    const roll = Math.random();
    switch (targetSeason) {
      case "spring":
        return roll < 0.5
          ? "sunny"
          : roll < 0.75
            ? "rainy"
            : roll < 0.85
              ? "stormy"
              : "windy";
      case "summer":
        // 绿雨: 8% 概率 (仅夏季)
        return roll < 0.08
          ? "green_rain"
          : roll < 0.42
            ? "sunny"
            : roll < 0.68
              ? "rainy"
              : roll < 0.83
                ? "stormy"
                : "windy";
      case "autumn":
        return roll < 0.45
          ? "sunny"
          : roll < 0.7
            ? "rainy"
            : roll < 0.8
              ? "stormy"
              : "windy";
      case "winter":
        return roll < 0.5 ? "sunny" : roll < 0.8 ? "snowy" : "windy";
    }
  };

  /** 末日生存：推进回合（1 回合 = 15 分钟），返回结果 */
  const advanceTurns = (
    n: number,
  ): { ok: boolean; passedOut: boolean; newDay: boolean; message: string } => {
    if (n <= 0)
      return { ok: true, passedOut: false, newDay: false, message: "" };

    // 阶段一计数
    if (phase.value === "pre") {
      turnsUsedInPre.value += n;
      if (turnsUsedInPre.value >= preOutbreakTurnsTotal) {
        phase.value = "post";
      }
    }
    turnsUsedToday.value += n;

    const minsPerTurn = MINUTES_PER_TURN;
    const addedMinutes = n * minsPerTurn;
    const prevHour = hour.value;
    const hourDelta = addedMinutes / 60;
    const newHour = hour.value + hourDelta;

    if (newHour >= PASSOUT_HOUR) {
      hour.value = PASSOUT_HOUR;
      return {
        ok: true,
        passedOut: true,
        newDay: false,
        message: "已经凌晨2点了，你撑不住倒下了……",
      };
    }

    hour.value = newHour;

    // 跨午夜提示（仅一次）
    if (
      !midnightWarned.value &&
      prevHour < MIDNIGHT_HOUR &&
      hour.value >= MIDNIGHT_HOUR
    ) {
      midnightWarned.value = true;
      return {
        ok: true,
        passedOut: false,
        newDay: false,
        message: "已经过了午夜，你开始感到困倦……",
      };
    }

    return { ok: true, passedOut: false, newDay: false, message: "" };
  };

  /** 推进时间（小时）；末日生存下转为回合并调用 advanceTurns，兼容旧调用 */
  const advanceTime = (
    hours: number,
  ): { ok: boolean; passedOut: boolean; message: string } => {
    if (hours <= 0) return { ok: true, passedOut: false, message: "" };
    const turns = Math.max(1, Math.ceil((hours * 60) / MINUTES_PER_TURN));
    const result = advanceTurns(turns);
    return {
      ok: result.ok,
      passedOut: result.passedOut,
      message: result.message,
    };
  };

  /** 查询切换到目标 tab 的移动耗时 */
  const getTravelCost = (targetTab: string): number => {
    const targetGroup = TAB_TO_LOCATION_GROUP[targetTab];
    if (!targetGroup) return 0;
    if (targetGroup === currentLocationGroup.value) return 0;
    const key = `${currentLocationGroup.value}->${targetGroup}`;
    const baseCost = TRAVEL_TIME[key] ?? 0.5;
    // 拥有马减少30%旅行时间
    const animalStore = useAnimalStore();
    let multiplier = animalStore.hasHorse ? 0.7 : 1;
    // 装备旅行速度加成（与马叠乘）
    const inventoryStore = useInventoryStore();
    const travelSpeedBonus = inventoryStore.getRingEffectValue("travel_speed");
    if (travelSpeedBonus > 0) {
      multiplier *= 1 - travelSpeedBonus;
    }
    return baseCost * multiplier;
  };

  /** 移动到目标 tab 对应的地点组 */
  const travelTo = (
    targetTab: string,
  ): { ok: boolean; timeCost: number; passedOut: boolean; message: string } => {
    const targetGroup = TAB_TO_LOCATION_GROUP[targetTab];
    if (!targetGroup)
      return { ok: true, timeCost: 0, passedOut: false, message: "" };
    if (targetGroup === currentLocationGroup.value)
      return { ok: true, timeCost: 0, passedOut: false, message: "" };

    const cost = getTravelCost(targetTab);
    const result = advanceTime(cost);
    const targetName = getLocationGroupName(targetGroup);
    currentLocationGroup.value = targetGroup;

    const travelMsg =
      cost > 0
        ? `前往${targetName}，路上花了${Math.round(cost * 60)}分钟。`
        : "";
    return {
      ok: true,
      timeCost: cost,
      passedOut: result.passedOut,
      message: travelMsg + (result.message ? " " + result.message : ""),
    };
  };

  /** 推进到下一天，返回换季信息 */
  const nextDay = (): { seasonChanged: boolean; oldSeason: Season } => {
    const oldSeason = season.value;
    day.value++;
    if (day.value > 28) {
      day.value = 1;
      const nextIndex = seasonIndex.value + 1;
      if (nextIndex >= 4) {
        season.value = "spring";
        year.value++;
      } else {
        season.value = SEASON_ORDER[nextIndex]!;
      }
    }
    // 天气预报链式推进
    weather.value = tomorrowWeather.value;
    const nextDayNum = day.value + 1 > 28 ? 1 : day.value + 1;
    const nextSeason =
      day.value + 1 > 28
        ? SEASON_ORDER[(SEASON_ORDER.indexOf(season.value) + 1) % 4]!
        : season.value;
    tomorrowWeather.value = rollWeather(nextSeason, nextDayNum);
    // 每日运势: -0.1 ~ +0.1
    dailyLuck.value = Math.random() * 0.2 - 0.1;
    hour.value = DAY_START_HOUR;
    midnightWarned.value = false;
    turnsUsedToday.value = 0;
    currentLocationGroup.value = "farm";
    return { seasonChanged: oldSeason !== season.value, oldSeason };
  };

  /** 移动到指定地点 */
  const goTo = (location: Location) => {
    currentLocation.value = location;
  };

  /** 末日生存：前往网格格位，消耗回合并更新位置 */
  const travelToGridCell = (
    row: number,
    col: number,
  ): {
    ok: boolean;
    turns: number;
    passedOut: boolean;
    newDay: boolean;
    message: string;
  } => {
    const from = mapPosition.value;
    if (from.row === row && from.col === col) {
      return {
        ok: true,
        turns: 0,
        passedOut: false,
        newDay: false,
        message: "",
      };
    }
    const toPos: GridPosition = { row, col };
    const turns = getTravelTurnsBetween(from, toPos);
    const result = advanceTurns(turns);
    mapPosition.value = toPos;
    const locName = getLocationName(getCellAt(row, col));
    const msg = turns > 0 ? `前往${locName}，消耗 ${turns} 回合。` : "";
    return {
      ok: result.ok,
      turns,
      passedOut: result.passedOut,
      newDay: result.newDay,
      message: msg + (result.message ? " " + result.message : ""),
    };
  };

  /** 强制设置明日天气（雨图腾等） */
  const setTomorrowWeather = (w: Weather) => {
    tomorrowWeather.value = w;
  };

  /** 开始新游戏 */
  const startNewGame = (mapType: FarmMapType = "standard") => {
    year.value = 1;
    season.value = "spring";
    day.value = 1;
    hour.value = DAY_START_HOUR;
    midnightWarned.value = false;
    weather.value = "sunny";
    tomorrowWeather.value = rollWeather("spring", 2);
    currentLocation.value = "farm";
    currentLocationGroup.value = "farm";
    farmMapType.value = mapType;
    isGameStarted.value = true;
    phase.value = "pre";
    turnsUsedInPre.value = 0;
    turnsUsedToday.value = 0;
    mapPosition.value = getCenter();
  };

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
      phase: phase.value,
      turnsUsedInPre: turnsUsedInPre.value,
      turnsUsedToday: turnsUsedToday.value,
      mapPosition: { row: mapPosition.value.row, col: mapPosition.value.col },
    };
  };

  /** 加载存档数据 */
  const deserialize = (data: any) => {
    year.value = data.year ?? 1;
    season.value = data.season ?? "spring";
    day.value = data.day ?? 1;
    hour.value = data.hour ?? DAY_START_HOUR;
    midnightWarned.value = (data.hour ?? DAY_START_HOUR) >= MIDNIGHT_HOUR;
    weather.value = data.weather ?? "sunny";
    tomorrowWeather.value =
      data.tomorrowWeather ??
      rollWeather(data.season ?? "spring", ((data.day ?? 1) % 28) + 1);
    currentLocation.value = data.currentLocation ?? "farm";
    currentLocationGroup.value = data.currentLocationGroup ?? "farm";
    farmMapType.value = data.farmMapType ?? "standard";
    dailyLuck.value = data.dailyLuck ?? 0;
    phase.value = data.phase ?? "pre";
    turnsUsedInPre.value = data.turnsUsedInPre ?? 0;
    turnsUsedToday.value = data.turnsUsedToday ?? 0;
    mapPosition.value =
      data.mapPosition != null
        ? { row: data.mapPosition.row, col: data.mapPosition.col }
        : getCenter();
    isGameStarted.value = true;
  };

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
    phase,
    preOutbreakTurnsTotal,
    turnsUsedInPre,
    turnsUsedToday,
    mapPosition,
    currentCityLocation,
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
    advanceTurns,
    travelToGridCell,
    getTravelCost,
    travelTo,
    setTomorrowWeather,
    serialize,
    deserialize,
  };
});
