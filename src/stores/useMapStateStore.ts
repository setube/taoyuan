import { ref } from "vue";
import { defineStore } from "pinia";
import type { NodeId, NodeStateSnapshot } from "@/types/survival";

/** Per-node alert level and optional decay timestamp. */
export const useMapStateStore = defineStore("mapState", () => {
  const nodeState = ref<Record<string, NodeStateSnapshot>>({});

  function getAlertLevel(nodeId: NodeId): number {
    return nodeState.value[nodeId]?.alertLevel ?? 0;
  }

  function setAlertLevel(nodeId: NodeId, value: number, day?: number, hour?: number) {
    const current = nodeState.value[nodeId];
    nodeState.value[nodeId] = {
      alertLevel: value,
      lastUpdatedDay: day ?? current?.lastUpdatedDay,
      lastUpdatedHour: hour ?? current?.lastUpdatedHour,
    };
  }

  /** Stub: decay alert over time (no-op until mechanics implemented). */
  function decayAlert(_nodeId: NodeId, _currentDay: number) {
    // TODO: apply ALERT_DECAY_PER_DAY
  }

  function serialize(): Record<string, NodeStateSnapshot> {
    return { ...nodeState.value };
  }

  function deserialize(data: Record<string, NodeStateSnapshot> | undefined) {
    nodeState.value = data ? { ...data } : {};
  }

  function reset() {
    nodeState.value = {};
  }

  return {
    getAlertLevel,
    setAlertLevel,
    decayAlert,
    reset,
    serialize,
    deserialize,
  };
});
