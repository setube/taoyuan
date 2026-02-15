/** 季节 */
export type Season = "spring" | "summer" | "autumn" | "winter";

/** 天气 */
export type Weather =
  | "sunny"
  | "rainy"
  | "stormy"
  | "snowy"
  | "windy"
  | "green_rain";

/** 星期 */
export type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

/** 时段 */
export type TimePeriod =
  | "morning"
  | "afternoon"
  | "evening"
  | "night"
  | "late_night";

/** 地点分组 */
export type LocationGroup =
  | "farm"
  | "village_area"
  | "nature"
  | "mine"
  | "hanhai";

/** 游戏时间状态 */
export interface GameTime {
  year: number;
  season: Season;
  day: number; // 1-28
  hour: number; // 6-26 (6=6AM, 24=midnight, 26=2AM)
  weather: Weather;
}

/** 场景/地点 */
export type Location =
  | "farm"
  | "village"
  | "shop"
  | "bamboo_forest"
  | "creek"
  | "mine"
  | "home";

/** 末日生存：地图网格坐标 */
export interface GridPosition {
  row: number;
  col: number;
}

/** 末日生存：城市地点 ID */
export type CityLocationId =
  | "apartment"
  | "supermarket"
  | "pharmacy"
  | "hardware"
  | "street";

/** 末日生存：地点分组（基地 / 城市） */
export type SurvivalLocationGroup = "base" | "city";

/** 农场地图类型 */
export type FarmMapType =
  | "standard"
  | "riverland"
  | "forest"
  | "hilltop"
  | "wilderness"
  | "meadowlands";

/** 性别 */
export type Gender = "male" | "female";
