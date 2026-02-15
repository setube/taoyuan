/**
 * Survival track stage thresholds and display names for the status bar.
 * Values are 0–100: hunger/fatigue 0 = good, 100 = critical; morale 0 = low, 100 = high.
 */

export type HungerStageKey = "full" | "peckish" | "hungry" | "starving";
export type FatigueStageKey = "fresh" | "tired" | "weary" | "exhausted";
export type MoraleStageKey = "low" | "neutral" | "steady" | "high";

export interface StageDef {
  max: number;
  label: string;
  description: string;
}

/** Hunger: 0 = full, higher = worse. Bands [0, 25), [25, 50), [50, 75), [75, 100]. */
export const HUNGER_STAGES: (StageDef & { key: HungerStageKey })[] = [
  {
    max: 25,
    key: "full",
    label: "饱腹",
    description: "肚子饱饱的，行动无碍。",
  },
  {
    max: 50,
    key: "peckish",
    label: "微饿",
    description: "有点饿了，稍后记得进食。",
  },
  {
    max: 75,
    key: "hungry",
    label: "饥饿",
    description: "很饿，会轻微影响体力恢复与判断。",
  },
  {
    max: 100,
    key: "starving",
    label: "濒饿",
    description: "极度饥饿，严重削弱体力与行动能力。",
  },
];

/** Fatigue: 0 = fresh, higher = worse. */
export const FATIGUE_STAGES: (StageDef & { key: FatigueStageKey })[] = [
  { max: 25, key: "fresh", label: "精神", description: "精神饱满，效率最佳。" },
  { max: 50, key: "tired", label: "微倦", description: "略有倦意，注意休息。" },
  {
    max: 75,
    key: "weary",
    label: "疲劳",
    description: "相当疲劳，行动会变慢、容易失误。",
  },
  {
    max: 100,
    key: "exhausted",
    label: "极度疲劳",
    description: "精疲力竭，必须休息才能继续。",
  },
];

/** Morale: 0 = low, 100 = high. */
export const MORALE_STAGES: (StageDef & { key: MoraleStageKey })[] = [
  {
    max: 25,
    key: "low",
    label: "士气低落",
    description: "情绪低落，难以发挥全力。",
  },
  {
    max: 50,
    key: "neutral",
    label: "士气一般",
    description: "心态平稳，表现正常。",
  },
  {
    max: 75,
    key: "steady",
    label: "士气尚可",
    description: "心态不错，做事更有干劲。",
  },
  {
    max: 100,
    key: "high",
    label: "士气高昂",
    description: "斗志昂扬，各方面都有加成。",
  },
];

function getStageLabel<T extends { max: number; label: string }>(
  value: number,
  stages: T[],
): string {
  const clamped = Math.min(100, Math.max(0, value));
  for (const stage of stages) {
    if (clamped <= stage.max) return stage.label;
  }
  return stages[stages.length - 1]!.label;
}

function getStageDescription<T extends StageDef>(
  value: number,
  stages: T[],
): string {
  const clamped = Math.min(100, Math.max(0, value));
  for (const stage of stages) {
    if (clamped <= stage.max) return stage.description;
  }
  return stages[stages.length - 1]!.description;
}

/** Turns until value reaches next stage threshold (for hunger/fatigue: value increases). Returns null if rate <= 0 or already at worst stage. */
export function getTurnsUntilNextStage(
  value: number,
  ratePerTurn: number,
  stages: { max: number }[],
): number | null {
  if (ratePerTurn <= 0) return null;
  const clamped = Math.min(100, Math.max(0, value));
  for (const stage of stages) {
    if (stage.max > clamped) {
      const turns = Math.ceil((stage.max - clamped) / ratePerTurn);
      return Math.max(0, turns);
    }
  }
  return null;
}

/** For morale: turns until next stage (morale can go up or down; we don't have rate here so return null for now). */
export function getMoraleTurnsUntilNextStage(
  _value: number,
  _ratePerTurn: number,
): number | null {
  return null;
}

export function getHungerStageLabel(value: number): string {
  return getStageLabel(value, HUNGER_STAGES);
}

export function getFatigueStageLabel(value: number): string {
  return getStageLabel(value, FATIGUE_STAGES);
}

export function getMoraleStageLabel(value: number): string {
  return getStageLabel(value, MORALE_STAGES);
}

export function getHungerStageDescription(value: number): string {
  return getStageDescription(value, HUNGER_STAGES);
}

export function getFatigueStageDescription(value: number): string {
  return getStageDescription(value, FATIGUE_STAGES);
}

export function getMoraleStageDescription(value: number): string {
  return getStageDescription(value, MORALE_STAGES);
}

/** Returns [hungerLabel, fatigueLabel, moraleLabel] for the current survival state. */
export function getSurvivalStageLabels(
  hunger: number,
  fatigue: number,
  morale: number,
): [string, string, string] {
  return [
    getHungerStageLabel(hunger),
    getFatigueStageLabel(fatigue),
    getMoraleStageLabel(morale),
  ];
}
