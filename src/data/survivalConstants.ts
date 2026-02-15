/**
 * Stub constants for survival mechanics. Replace with design values when tuning.
 * - Hunger/fatigue/morale: rate per turn or per day
 * - Alert: decay per day
 * - Familiarity: visits needed to increase tier
 * - Noise: thresholds for zombie reinforcement in combat
 */

/** Hunger increase per turn (placeholder; 0 = disabled until tuned) */
export const HUNGER_RATE_PER_TURN = 0;

/** Hunger increase per day (placeholder) */
export const HUNGER_RATE_PER_DAY = 0;

/** Fatigue increase per turn while awake (placeholder) */
export const FATIGUE_RATE_PER_TURN = 0;

/** Fatigue escalation factor after midnight (e.g. 1.5) */
export const FATIGUE_MIDNIGHT_MULTIPLIER = 1;

/** Morale min/max range (e.g. 0–100) */
export const MORALE_MIN = 0;
export const MORALE_MAX = 100;

/** Default morale at game start */
export const MORALE_DEFAULT = 50;

/** Alert level decay per in-game day (e.g. 0.5 = half per day) */
export const ALERT_DECAY_PER_DAY = 0.5;

/** Number of visits to a node to increase Familiarity by one tier (placeholder) */
export const FAMILIARITY_VISITS_PER_TIER = 3;

/** Noise threshold in combat to trigger reinforcement zombies (placeholder) */
export const NOISE_THRESHOLD_REINFORCEMENT = 10;

/** Default hunger/fatigue at game start (0 = full, 100 = critical if using 0–100 scale) */
export const HUNGER_DEFAULT = 0;
export const FATIGUE_DEFAULT = 0;
