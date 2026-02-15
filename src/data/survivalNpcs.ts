import type { SurvivalNpcId } from "@/types/survival";

export interface SurvivalNpcDef {
  id: SurvivalNpcId;
  name: string;
  /** Optional default 道德 at first meet */
  defaultMoralIntegrity?: number;
  /** Optional location/node id where this NPC can appear */
  locationId?: string;
}

/** Survival NPC definitions; populate with content. Runtime relation (好感/恐惧/道德) is in useSurvivalNpcStore. */
export const SURVIVAL_NPCS: SurvivalNpcDef[] = [
  {
    id: "test_survivor_supermarket",
    name: "测试幸存者",
    defaultMoralIntegrity: 6,
    locationId: "supermarket",
  },
  {
    id: "test_survivor_pharmacy",
    name: "药店店员",
    defaultMoralIntegrity: 8,
    locationId: "pharmacy",
  },
];

export function getSurvivalNpcById(id: SurvivalNpcId): SurvivalNpcDef | undefined {
  return SURVIVAL_NPCS.find((n) => n.id === id);
}

export function getAllSurvivalNpcs(): SurvivalNpcDef[] {
  return [...SURVIVAL_NPCS];
}
