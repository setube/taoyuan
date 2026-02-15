import { defineStore } from "pinia";
import type { EncounterResult } from "@/types/encounter";
import type { CityLocationId } from "@/types/game";
import { getRandomZombie } from "@/data/zombies";
import { skillCheck } from "@/lib/dice";
import { usePlayerStore } from "./usePlayerStore";

const ENCOUNTER_CHANCE = 0.35;
const STEALTH_DC = 12;

export const useEncounterStore = defineStore("encounter", () => {
  /** 末日生存：是否遭遇敌人（由 travel/scavenge 时调用 rollEncounter 决定） */
  function rollEncounter(
    _from: CityLocationId,
    _to: CityLocationId,
    phase: "pre" | "post",
  ): EncounterResult {
    if (phase === "pre") {
      return { encountered: false };
    }
    if (Math.random() > ENCOUNTER_CHANCE) {
      return { encountered: false };
    }
    const playerStore = usePlayerStore();
    const mod = playerStore.getDerivedSkillModifier("scavenge");
    const check = skillCheck(mod, STEALTH_DC);
    if (check.success) {
      return {
        encountered: false,
        stealthSuccess: true,
        stealthDC: STEALTH_DC,
      };
    }
    const zombie = getRandomZombie();
    return { encountered: true, zombieId: zombie.id };
  }

  return { rollEncounter };
});
