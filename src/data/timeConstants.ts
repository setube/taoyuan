import type { Weekday, TimePeriod, LocationGroup } from "@/types";

// === 时间常量 ===
export const DAY_START_HOUR = 6;
export const DAY_END_HOUR = 26; // 凌晨2点
export const MIDNIGHT_HOUR = 24;
export const PASSOUT_HOUR = 26;

/** 末日生存：1 回合 = 15 分钟 */
export const MINUTES_PER_TURN = 15;

/** 末日生存：回合消耗（每项行动消耗的回合数） */
export const TURN_COSTS = {
  travel_apartment_supermarket: 2,
  travel_apartment_pharmacy: 2,
  travel_apartment_hardware: 3,
  travel_supermarket_pharmacy: 1,
  travel_supermarket_hardware: 2,
  scavenge: 1,
  rest: 2,
  sleep: 4,
  combat: 1,
  craft_simple: 1,
  craft_complex: 2,
  shop: 1,
} as const;

// === 星期系统 ===
export const WEEKDAYS: Weekday[] = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
];

export const WEEKDAY_NAMES: Record<Weekday, string> = {
  mon: "周一",
  tue: "周二",
  wed: "周三",
  thu: "周四",
  fri: "周五",
  sat: "周六",
  sun: "周日",
};

/** 第1天=周一, 第7天=周日, 第8天=周一 ... */
export const getWeekday = (day: number): Weekday => {
  return WEEKDAYS[(day - 1) % 7]!;
};

// === 时段判断 ===
export const getTimePeriod = (hour: number): TimePeriod => {
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 20) return "evening";
  if (hour >= 20 && hour < 24) return "night";
  return "late_night";
};

// === 时间显示 ===
export const formatHour = (hour: number): string => {
  const realHour = hour >= 24 ? hour - 24 : hour;
  if (hour >= 6 && hour < 12) return `上午 ${realHour}:00`;
  if (hour === 12) return `中午 12:00`;
  if (hour > 12 && hour < 18) return `下午 ${realHour}:00`;
  if (hour >= 18 && hour < 24) return `晚上 ${realHour}:00`;
  return `凌晨 ${realHour}:00`;
};

/** 更精细的时间显示（支持小数小时） */
export const formatTime = (hour: number): string => {
  const totalMinutes = Math.round(hour * 60);
  let h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const realH = h >= 24 ? h - 24 : h;
  const mm = m.toString().padStart(2, "0");

  if (h >= 6 && h < 12) return `上午 ${realH}:${mm}`;
  if (h === 12 && m === 0) return `中午 12:00`;
  if (h >= 12 && h < 18) return `下午 ${realH}:${mm}`;
  if (h >= 18 && h < 24) return `晚上 ${realH}:${mm}`;
  return `凌晨 ${realH}:${mm}`;
};

// === 行动时间开销 (单位：小时) ===
export const ACTION_TIME_COSTS = {
  // 农场
  till: 0.17,
  plant: 0.17,
  water: 0.08,
  harvest: 0.17,
  // 钓鱼
  fishStart: 1,
  // 挖矿
  mineOre: 0.5,
  combat: 0.5,
  nextFloor: 0.33,
  revealTile: 0.1,
  // 采集
  forage: 1,
  chopTree: 1,
  // 烹饪
  cook: 0.5,
  eat: 0,
  // 社交
  talk: 0.17,
  gift: 0,
  // 加工坊
  craftMachine: 0.17,
  startProcessing: 0,
  collectProduct: 0,
  craftSprinkler: 0.17,
  craftFertilizer: 0.17,
  craftJadeRing: 0.17,
  // 畜棚
  feedAnimals: 0.5,
  petAnimal: 0.17,
  graze: 1,
  // 农舍
  collectCave: 0.17,
  aging: 0.17,
  plantTree: 0.5,
  // 工具升级
  toolUpgrade: 1,
  // 批量农场操作
  batchWater: 0.17,
  batchTill: 0.25,
  batchHarvest: 0.5,
  // 淘金
  pan: 1,
  // UI
  checkInventory: 0,
  checkSkills: 0,
  checkAchievement: 0,
  // 育种
  breeding: 0.17,
} as const;

// === 地点分组映射 ===
export const TAB_TO_LOCATION_GROUP: Record<string, LocationGroup | null> = {
  farm: "farm",
  animal: "farm",
  home: "farm",
  village: "village_area",
  shop: "village_area",
  cooking: "village_area",
  workshop: "farm",
  breeding: "farm",
  upgrade: "village_area",
  forage: "nature",
  fishing: "nature",
  mining: "mine",
  inventory: null,
  skills: null,
  achievement: null,
  charinfo: null,
  museum: "village_area",
  guild: "village_area",
  hanhai: "hanhai",
};

// === 移动时间 ===
export const TRAVEL_TIME: Record<string, number> = {
  "farm->village_area": 0.5,
  "farm->nature": 0.5,
  "farm->mine": 1,
  "village_area->farm": 0.5,
  "village_area->nature": 0.5,
  "village_area->mine": 1,
  "nature->farm": 0.5,
  "nature->village_area": 0.5,
  "nature->mine": 1,
  "mine->farm": 1,
  "mine->village_area": 1,
  "mine->nature": 1,
  "farm->hanhai": 2,
  "hanhai->farm": 2,
  "village_area->hanhai": 2,
  "hanhai->village_area": 2,
  "nature->hanhai": 2,
  "hanhai->nature": 2,
  "mine->hanhai": 1.5,
  "hanhai->mine": 1.5,
};

const LOCATION_GROUP_NAMES: Record<LocationGroup, string> = {
  farm: "农场",
  village_area: "桃源村",
  nature: "野外",
  mine: "矿洞",
  hanhai: "瀚海",
};

export const getLocationGroupName = (group: LocationGroup): string => {
  return LOCATION_GROUP_NAMES[group];
};

// === 商店营业 ===
export interface ShopSchedule {
  tabKey: string;
  name: string;
  closedDays: Weekday[];
  openHour: number;
  closeHour: number;
}

export const SHOP_SCHEDULES: ShopSchedule[] = [
  {
    tabKey: "shop",
    name: "桃源商圈",
    closedDays: [],
    openHour: 6,
    closeHour: 24,
  },
  {
    tabKey: "upgrade",
    name: "工坊",
    closedDays: ["sun"],
    openHour: 8,
    closeHour: 20,
  },
];

export const isShopOpen = (
  tabKey: string,
  day: number,
  hour: number,
): { open: boolean; reason?: string } => {
  const schedule = SHOP_SCHEDULES.find((s) => s.tabKey === tabKey);
  if (!schedule) return { open: true };
  const weekday = getWeekday(day);
  if (schedule.closedDays.includes(weekday)) {
    return {
      open: false,
      reason: `${schedule.name}今天（${WEEKDAY_NAMES[weekday]}）休息。`,
    };
  }
  if (hour < schedule.openHour) {
    return {
      open: false,
      reason: `${schedule.name}还没开门（${formatHour(schedule.openHour)}开门）。`,
    };
  }
  if (hour >= schedule.closeHour) {
    return {
      open: false,
      reason: `${schedule.name}已经打烊了（${formatHour(schedule.closeHour)}关门）。`,
    };
  }
  return { open: true };
};

// === NPC 出没时间 ===
export interface NpcScheduleEntry {
  npcId: string;
  availableDays: Weekday[] | "all";
  availableHours: { from: number; to: number };
}

export const NPC_SCHEDULES: NpcScheduleEntry[] = [
  // 原有 NPC
  {
    npcId: "chen_bo",
    availableDays: "all",
    availableHours: { from: 8, to: 20 },
  },
  {
    npcId: "liu_niang",
    availableDays: "all",
    availableHours: { from: 9, to: 21 },
  },
  {
    npcId: "a_shi",
    availableDays: ["mon", "tue", "wed", "thu", "fri"],
    availableHours: { from: 7, to: 18 },
  },
  {
    npcId: "qiu_yue",
    availableDays: "all",
    availableHours: { from: 6, to: 22 },
  },
  {
    npcId: "lin_lao",
    availableDays: "all",
    availableHours: { from: 8, to: 19 },
  },
  {
    npcId: "xiao_man",
    availableDays: ["mon", "tue", "wed", "thu", "fri", "sat"],
    availableHours: { from: 9, to: 17 },
  },
  // 新增可婚 NPC
  {
    npcId: "chun_lan",
    availableDays: "all",
    availableHours: { from: 7, to: 20 },
  },
  {
    npcId: "xue_qin",
    availableDays: ["mon", "tue", "wed", "thu", "fri"],
    availableHours: { from: 10, to: 19 },
  },
  { npcId: "su_su", availableDays: "all", availableHours: { from: 8, to: 20 } },
  {
    npcId: "hong_dou",
    availableDays: "all",
    availableHours: { from: 10, to: 23 },
  },
  {
    npcId: "dan_qing",
    availableDays: "all",
    availableHours: { from: 8, to: 21 },
  },
  {
    npcId: "a_tie",
    availableDays: ["mon", "tue", "wed", "thu", "fri", "sat"],
    availableHours: { from: 7, to: 18 },
  },
  {
    npcId: "yun_fei",
    availableDays: ["tue", "thu", "sat", "sun"],
    availableHours: { from: 6, to: 16 },
  },
  {
    npcId: "da_niu",
    availableDays: "all",
    availableHours: { from: 6, to: 19 },
  },
  {
    npcId: "mo_bai",
    availableDays: "all",
    availableHours: { from: 12, to: 23 },
  },
  // 新增不可婚 NPC
  {
    npcId: "wang_dashen",
    availableDays: "all",
    availableHours: { from: 6, to: 19 },
  },
  {
    npcId: "zhao_mujiang",
    availableDays: ["mon", "tue", "wed", "thu", "fri", "sat"],
    availableHours: { from: 7, to: 18 },
  },
  {
    npcId: "sun_tiejiang",
    availableDays: ["mon", "tue", "wed", "thu", "fri", "sat"],
    availableHours: { from: 7, to: 18 },
  },
  {
    npcId: "zhang_popo",
    availableDays: "all",
    availableHours: { from: 8, to: 17 },
  },
  { npcId: "li_yu", availableDays: "all", availableHours: { from: 6, to: 20 } },
  {
    npcId: "zhou_xiucai",
    availableDays: ["mon", "tue", "wed", "thu", "fri"],
    availableHours: { from: 8, to: 17 },
  },
  {
    npcId: "wu_shen",
    availableDays: "all",
    availableHours: { from: 8, to: 20 },
  },
  {
    npcId: "ma_liu",
    availableDays: ["wed", "sat", "sun"],
    availableHours: { from: 9, to: 18 },
  },
  {
    npcId: "lao_song",
    availableDays: "all",
    availableHours: { from: 18, to: 26 },
  },
  {
    npcId: "pang_shen",
    availableDays: "all",
    availableHours: { from: 5, to: 16 },
  },
  { npcId: "a_hua", availableDays: "all", availableHours: { from: 9, to: 18 } },
  {
    npcId: "shi_tou",
    availableDays: "all",
    availableHours: { from: 8, to: 20 },
  },
  {
    npcId: "hui_niang",
    availableDays: "all",
    availableHours: { from: 8, to: 19 },
  },
  {
    npcId: "lao_lu",
    availableDays: "all",
    availableHours: { from: 10, to: 22 },
  },
  {
    npcId: "liu_cunzhang",
    availableDays: ["mon", "tue", "wed", "thu", "fri"],
    availableHours: { from: 8, to: 18 },
  },
  {
    npcId: "qian_niang",
    availableDays: "all",
    availableHours: { from: 8, to: 18 },
  },
  {
    npcId: "he_zhanggui",
    availableDays: "all",
    availableHours: { from: 9, to: 22 },
  },
  {
    npcId: "qin_dashu",
    availableDays: "all",
    availableHours: { from: 6, to: 18 },
  },
  { npcId: "a_fu", availableDays: "all", availableHours: { from: 7, to: 18 } },
];

export const isNpcAvailable = (
  npcId: string,
  day: number,
  hour: number,
): boolean => {
  const schedule = NPC_SCHEDULES.find((s) => s.npcId === npcId);
  if (!schedule) return true;
  const weekday = getWeekday(day);
  if (
    schedule.availableDays !== "all" &&
    !schedule.availableDays.includes(weekday)
  )
    return false;
  return (
    hour >= schedule.availableHours.from && hour < schedule.availableHours.to
  );
};

export const getNpcUnavailableReason = (
  npcId: string,
  day: number,
  hour: number,
): string | null => {
  const schedule = NPC_SCHEDULES.find((s) => s.npcId === npcId);
  if (!schedule) return null;
  const weekday = getWeekday(day);
  if (
    schedule.availableDays !== "all" &&
    !schedule.availableDays.includes(weekday)
  ) {
    return "今天不在村里";
  }
  if (hour < schedule.availableHours.from) return "还没出门";
  if (hour >= schedule.availableHours.to) return "已经回家了";
  return null;
};

// === 深夜惩罚 ===
/** 渐进式晚睡恢复：根据就寝时间线性递减 */
export const LATE_NIGHT_RECOVERY_MAX = 0.9; // 24时就寝恢复90%
export const LATE_NIGHT_RECOVERY_MIN = 0.6; // 25时就寝恢复60%
export const PASSOUT_STAMINA_RECOVERY = 0.5;
export const PASSOUT_MONEY_PENALTY_RATE = 0.1;
export const PASSOUT_MONEY_PENALTY_CAP = 1000;
