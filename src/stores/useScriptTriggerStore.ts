import { ref, computed } from "vue";
import { defineStore } from "pinia";
import type { ScriptTriggerKey } from "@/data/scriptTriggers";

export const useScriptTriggerStore = defineStore("scriptTriggers", () => {
  const fired = ref<Set<string>>(new Set());

  const hasFired = (key: ScriptTriggerKey): boolean => fired.value.has(key);

  const markFired = (key: ScriptTriggerKey): void => {
    fired.value = new Set([...fired.value, key]);
  };

  const reset = (): void => {
    fired.value = new Set();
  };

  const serialize = (): string[] => Array.from(fired.value);

  const deserialize = (data: string[] | undefined): void => {
    fired.value = new Set(Array.isArray(data) ? data : []);
  };

  return {
    fired: computed(() => fired.value),
    hasFired,
    markFired,
    reset,
    serialize,
    deserialize,
  };
});
