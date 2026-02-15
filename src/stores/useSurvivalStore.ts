import { ref } from "vue";
import { defineStore } from "pinia";
import {
  HUNGER_DEFAULT,
  FATIGUE_DEFAULT,
  MORALE_DEFAULT,
  MORALE_MIN,
  MORALE_MAX,
} from "@/data/survivalConstants";

/** Survival tracks: 饥饿, 疲劳, 士气. No advancement logic yet—state and persistence only. */
export const useSurvivalStore = defineStore("survival", () => {
  const hunger = ref(HUNGER_DEFAULT);
  const fatigue = ref(FATIGUE_DEFAULT);
  const morale = ref(MORALE_DEFAULT);

  function serialize() {
    return {
      hunger: hunger.value,
      fatigue: fatigue.value,
      morale: morale.value,
    };
  }

  function deserialize(data: ReturnType<typeof serialize> | undefined) {
    hunger.value = data?.hunger ?? HUNGER_DEFAULT;
    fatigue.value = data?.fatigue ?? FATIGUE_DEFAULT;
    morale.value = Math.min(
      MORALE_MAX,
      Math.max(MORALE_MIN, data?.morale ?? MORALE_DEFAULT),
    );
  }

  function reset() {
    hunger.value = HUNGER_DEFAULT;
    fatigue.value = FATIGUE_DEFAULT;
    morale.value = MORALE_DEFAULT;
  }

  return {
    hunger,
    fatigue,
    morale,
    reset,
    serialize,
    deserialize,
  };
});
