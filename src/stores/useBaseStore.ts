import { ref } from "vue";
import { defineStore } from "pinia";
import type { FurnitureType } from "@/data/baseFurniture";

/**
 * Furniture state for new apartment layouts
 */
export interface FurnitureState {
  id: string
  type: FurnitureType
  barricadeLevel?: number // 0-3 for door/window
  supplies?: number // inventory count for storage furniture
  lastInteracted?: number // timestamp
}

/** 末日生存：基地（公寓）状态，替代 FarmStore */
export const useBaseStore = defineStore("base", () => {
  /** 加固等级 0–3 (legacy, used for door by default) */
  const barricadeLevel = ref(0);

  /** Furniture states for new layouts */
  const furnitureStates = ref<Record<string, FurnitureState>>({
    door: { id: 'door', type: 'door', barricadeLevel: 0 },
    window: { id: 'window', type: 'window', barricadeLevel: 0 },
    kitchen: { id: 'kitchen', type: 'kitchen', supplies: 0 },
    closet: { id: 'closet', type: 'storage', supplies: 0 },
    fridge: { id: 'fridge', type: 'storage', supplies: 0 },
    cabinet: { id: 'cabinet', type: 'storage', supplies: 0 },
  });

  const serialize = () => ({
    barricadeLevel: barricadeLevel.value,
    furnitureStates: furnitureStates.value,
  });

  const deserialize = (data: ReturnType<typeof serialize>) => {
    barricadeLevel.value = data?.barricadeLevel ?? 0;
    if (data?.furnitureStates) {
      furnitureStates.value = data.furnitureStates;
    }
  };

  const upgradeBarricade = (): boolean => {
    if (barricadeLevel.value >= 3) return false;
    barricadeLevel.value++;
    // Also update door furniture state
    if (furnitureStates.value.door) {
      furnitureStates.value.door.barricadeLevel = barricadeLevel.value;
    }
    return true;
  };

  // New furniture-specific methods
  const getFurnitureState = (id: string): FurnitureState | undefined => {
    return furnitureStates.value[id];
  };

  const getDoorBarricade = (): number => {
    return furnitureStates.value.door?.barricadeLevel ?? barricadeLevel.value;
  };

  const getWindowBarricade = (): number => {
    return furnitureStates.value.window?.barricadeLevel ?? 0;
  };

  const getFurnitureSupplies = (id: string): number => {
    return furnitureStates.value[id]?.supplies ?? 0;
  };

  const upgradeFurnitureBarricade = (id: string): boolean => {
    const furniture = furnitureStates.value[id];
    if (!furniture || furniture.type !== 'door' && furniture.type !== 'window') {
      return false;
    }
    const currentLevel = furniture.barricadeLevel ?? 0;
    if (currentLevel >= 3) return false;

    furniture.barricadeLevel = currentLevel + 1;
    furniture.lastInteracted = Date.now();

    // Sync with legacy barricadeLevel if it's the door
    if (id === 'door') {
      barricadeLevel.value = furniture.barricadeLevel;
    }

    return true;
  };

  const updateFurnitureSupplies = (id: string, count: number) => {
    const furniture = furnitureStates.value[id];
    if (!furniture) return;

    furniture.supplies = count;
    furniture.lastInteracted = Date.now();
  };

  const interactWithFurniture = (id: string) => {
    const furniture = furnitureStates.value[id];
    if (!furniture) return;

    furniture.lastInteracted = Date.now();
  };

  return {
    barricadeLevel,
    furnitureStates,
    upgradeBarricade,
    getFurnitureState,
    getDoorBarricade,
    getWindowBarricade,
    getFurnitureSupplies,
    upgradeFurnitureBarricade,
    updateFurnitureSupplies,
    interactWithFurniture,
    serialize,
    deserialize,
  };
});
