import { ref } from "vue";
import { defineStore } from "pinia";
import type { NodeId, FamiliarityTier, BackgroundId } from "@/types/survival";
import { getBackgroundById } from "@/data/backgrounds";

/** Per-node Familiarity (陌生/熟悉/了如指掌). Keyed by node/location id. */
export const useFamiliarityStore = defineStore("familiarity", () => {
  const familiarityByNode = ref<Record<string, FamiliarityTier>>({});

  function getFamiliarity(nodeId: NodeId): FamiliarityTier {
    return familiarityByNode.value[nodeId] ?? 0;
  }

  function setFamiliarity(nodeId: NodeId, tier: FamiliarityTier) {
    familiarityByNode.value[nodeId] = tier;
  }

  /** Apply starting Familiarity from a background (call on new game start). */
  function applyBackgroundBonuses(backgroundId: BackgroundId | null) {
    if (!backgroundId) return;
    const bg = getBackgroundById(backgroundId);
    if (!bg) return;
    for (const [nodeTypeOrId, tier] of Object.entries(bg.familiarityBonuses)) {
      setFamiliarity(nodeTypeOrId, tier as FamiliarityTier);
    }
  }

  function serialize(): Record<string, FamiliarityTier> {
    return { ...familiarityByNode.value };
  }

  function deserialize(data: Record<string, FamiliarityTier> | undefined) {
    familiarityByNode.value = data ? { ...data } : {};
  }

  /** Reset for new game (call before applyBackgroundBonuses). */
  function reset() {
    familiarityByNode.value = {};
  }

  return {
    getFamiliarity,
    setFamiliarity,
    applyBackgroundBonuses,
    reset,
    serialize,
    deserialize,
  };
});
