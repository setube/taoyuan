import { ref } from "vue";
import { defineStore } from "pinia";

const BASE_LAYOUT_KEY = "taoyuan_base_layout";

/** 末日生存：基地（公寓）状态，替代 FarmStore */
export const useBaseStore = defineStore("base", () => {
  /** 加固等级 0–3 */
  const barricadeLevel = ref(0);

  /** 基地布局概念 1–5，仅 UI 偏好，存 localStorage（不写入存档） */
  const baseLayoutConcept = ref(
    Math.min(5, Math.max(1, parseInt(localStorage.getItem(BASE_LAYOUT_KEY) ?? "1", 10) || 1)),
  );

  const cycleBaseLayout = () => {
    baseLayoutConcept.value = (baseLayoutConcept.value % 5) + 1;
    localStorage.setItem(BASE_LAYOUT_KEY, String(baseLayoutConcept.value));
  };

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
    baseLayoutConcept,
    cycleBaseLayout,
    upgradeBarricade,
    serialize,
    deserialize,
  };
});
