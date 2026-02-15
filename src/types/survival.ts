import type { CityLocationId } from "./game";

/** Familiarity tier for a location (0 = 陌生, 1 = 熟悉, 2 = 了如指掌) */
export type FamiliarityTier = 0 | 1 | 2;

/** Display names for familiarity tiers */
export const FAMILIARITY_TIER_NAMES: Record<FamiliarityTier, string> = {
  0: "陌生",
  1: "熟悉",
  2: "了如指掌",
};

/** Node/location id; alias to CityLocationId for now, extend when adding new node types */
export type NodeId = CityLocationId | string;

/** Alert level at a node (0 = calm, higher = more zombie activity) */
export type AlertLevel = number;

/** Optional static node properties (danger, loot) for definitions */
export type DangerLevel = number;
export type LootQuality = number;

/** Background id from character creation (determines starting Familiarity bonuses) */
export type BackgroundId =
  | "student"
  | "hospital_intern"
  | "delivery_driver"
  | "community_guard"
  | "net_cafe_owner";

/** Node type or id key for familiarity bonuses (e.g. 学校, 图书馆, 网吧 or location id) */
export type NodeTypeOrId = string;

/** Background definition: id, name, and which node types get starting Familiarity */
export interface BackgroundDef {
  id: BackgroundId;
  name: string;
  /** Node type or location id -> starting Familiarity tier (1 or 2) */
  familiarityBonuses: Record<NodeTypeOrId, FamiliarityTier>;
}

/** Three-axis NPC relation: 好感, 恐惧, 道德 */
export interface SurvivalNpcRelation {
  affection: number;
  fear: number;
  moralIntegrity: number;
}

/** Survival NPC id (string); definitions live in data/survivalNpcs */
export type SurvivalNpcId = string;

/** Survival tracks: 饥饿, 疲劳, 士气 (0–100 or design scale) */
export interface SurvivalTracks {
  hunger: number;
  fatigue: number;
  morale: number;
}

/** Optional hunger stage for later mechanics */
export type HungerStage = "full" | "peckish" | "hungry" | "starving";

/** Combat noise level (design reference for future use) */
export type NoiseLevel = "low" | "medium" | "medium_high" | "high" | "very_high";

/** Per-node state for save: alert level and optional decay timestamp */
export interface NodeStateSnapshot {
  alertLevel: number;
  lastUpdatedDay?: number;
  lastUpdatedHour?: number;
}
