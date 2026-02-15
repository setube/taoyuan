import { ref } from "vue";
import { defineStore } from "pinia";
import type { SurvivalNpcId, SurvivalNpcRelation } from "@/types/survival";
import { getSurvivalNpcById } from "@/data/survivalNpcs";

/** Three-axis NPC relations: 好感, 恐惧, 道德. */
export const useSurvivalNpcStore = defineStore("survivalNpc", () => {
  const relations = ref<Record<SurvivalNpcId, SurvivalNpcRelation>>({});

  function getRelation(npcId: SurvivalNpcId): SurvivalNpcRelation {
    const r = relations.value[npcId];
    if (r) return { ...r };
    return { affection: 0, fear: 0, moralIntegrity: 0 };
  }

  function setRelation(
    npcId: SurvivalNpcId,
    partial: Partial<SurvivalNpcRelation>,
  ) {
    const current = relations.value[npcId] ?? {
      affection: 0,
      fear: 0,
      moralIntegrity: 0,
    };
    relations.value[npcId] = { ...current, ...partial };
  }

  /** Initialize an NPC (e.g. on first meet). Uses default 道德 from def if present. */
  function initNpc(npcId: SurvivalNpcId) {
    if (relations.value[npcId]) return;
    const def = getSurvivalNpcById(npcId);
    relations.value[npcId] = {
      affection: 0,
      fear: 0,
      moralIntegrity: def?.defaultMoralIntegrity ?? 0,
    };
  }

  function serialize(): Record<string, SurvivalNpcRelation> {
    return { ...relations.value };
  }

  function deserialize(data: Record<string, SurvivalNpcRelation> | undefined) {
    relations.value = data ? { ...data } : {};
  }

  function reset() {
    relations.value = {};
  }

  return {
    getRelation,
    setRelation,
    initNpc,
    reset,
    serialize,
    deserialize,
  };
});
