import type { CityLocationId } from "@/types/game";
import type { SurvivalNpcId } from "@/types/survival";

/** Trigger key format: location_first_visit:${locationId} | npc_first_talk:${npcId} */
export type ScriptTriggerKey = string;

export function locationFirstVisitKey(locationId: CityLocationId): ScriptTriggerKey {
  return `location_first_visit:${locationId}`;
}

export function npcFirstTalkKey(npcId: SurvivalNpcId): ScriptTriggerKey {
  return `npc_first_talk:${npcId}`;
}

/**
 * Registry: trigger key → script id.
 * When a trigger fires, run the script with this id (from scripts.ts) if not already fired.
 */
export const SCRIPT_TRIGGERS: Record<ScriptTriggerKey, string> = {
  // Example: first visit to pharmacy could run a script:
  // [locationFirstVisitKey("pharmacy")]: "location_pharmacy_intro",
  // [npcFirstTalkKey("test_survivor_pharmacy")]: "npc_pharmacy_greeting",
};

export function getScriptIdForTrigger(triggerKey: ScriptTriggerKey): string | undefined {
  return SCRIPT_TRIGGERS[triggerKey];
}
