import type { SurvivalNpcId } from "@/types/survival";

export type NpcActionKey = "talk" | "buy" | "rob" | "scare";

export interface SurvivalNpcDef {
  id: SurvivalNpcId;
  name: string;
  /** Optional default 道德 at first meet */
  defaultMoralIntegrity?: number;
  /** Optional location/node id where this NPC can appear */
  locationId?: string;
  /** Greeting when starting conversation. If absent, default greeting is used. */
  greeting?: string;
  /** Messages per action (交谈/购买/抢劫/恐吓). If absent, default messages are used. */
  actionMessages?: Partial<Record<NpcActionKey, string>>;
}

/** Default greeting when NPC has no custom greeting. */
export const DEFAULT_NPC_GREETING = "欢迎，需要什么？";

/** Default messages per action when NPC has no custom actionMessages. */
export const DEFAULT_NPC_ACTION_MESSAGES: Record<NpcActionKey, string> = {
  talk: "你们随便聊了几句。",
  buy: "（购买功能尚未开放）",
  rob: "（抢劫会带来后果，尚未开放）",
  scare: "（恐吓会影响关系，尚未开放）",
};

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
