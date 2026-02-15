import { ref } from "vue";
import { defineStore } from "pinia";

/** 末日生存：基地（公寓）状态，替代 FarmStore */
export const useBaseStore = defineStore("base", () => {
  /** 加固等级 0–3 */
  const barricadeLevel = ref(0);

  const serialize = () => ({
    barricadeLevel: barricadeLevel.value,
  });

  const deserialize = (data: ReturnType<typeof serialize>) => {
    barricadeLevel.value = data?.barricadeLevel ?? 0;
  };

  const upgradeBarricade = (): boolean => {
    if (barricadeLevel.value >= 3) return false;
    barricadeLevel.value++;
    return true;
  };

  return {
    barricadeLevel,
    upgradeBarricade,
    serialize,
    deserialize,
  };
});
