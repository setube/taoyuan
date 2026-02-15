<template>
  <div>
    <div class="flex items-center gap-1.5 text-sm text-accent mb-3">
      <Map :size="14" />
      <span>城市地图</span>
    </div>
    <p class="text-xs text-muted mb-3">当前所在：{{ currentLocationName }}</p>

    <div class="flex flex-col gap-2">
      <button
        v-for="loc in otherLocations"
        :key="loc.id"
        class="btn text-xs w-full justify-between"
        @click="travelTo(loc.id)"
      >
        <span>{{ loc.name }}</span>
        <span class="text-muted"
          >{{
            getTravelTurns(gameStore.currentCityLocation, loc.id)
          }}
          回合</span
        >
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Map } from "lucide-vue-next";
import { useGameStore } from "@/stores/useGameStore";
import {
  CITY_LOCATIONS,
  getTravelTurns,
  getLocationName,
} from "@/data/locations";
import { useEncounterStore } from "@/stores/useEncounterStore";
import { useCombatStore } from "@/stores/useCombatStore";
import { getZombieById } from "@/data/zombies";
import { addLog } from "@/composables/useGameLog";
import router from "@/router";
import type { CityLocationId } from "@/types";

const gameStore = useGameStore();
const encounterStore = useEncounterStore();
const combatStore = useCombatStore();

const currentLocationName = computed(() =>
  getLocationName(gameStore.currentCityLocation),
);

const otherLocations = computed(() =>
  CITY_LOCATIONS.filter((loc) => loc.id !== gameStore.currentCityLocation),
);

function travelTo(toId: CityLocationId) {
  const from = gameStore.currentCityLocation;
  const result = gameStore.travelToCityLocation(toId);
  addLog(result.message || `到达${getLocationName(toId)}。`);
  if (result.passedOut) {
    // TODO: handleEndDay
  }
  if (result.newDay) {
    // day rolled over
  }
  const encounter = encounterStore.rollEncounter(from, toId, gameStore.phase);
  if (encounter.encountered && encounter.zombieId) {
    const zombie = getZombieById(encounter.zombieId);
    if (zombie) {
      combatStore.startCombat(zombie);
      addLog(`遭遇了${zombie.name}！`);
      router.push("/game/combat");
      return;
    }
  }
  if (encounter.stealthSuccess) {
    addLog("你悄悄避开了危险。");
  }
  router.push(`/game/location/${toId}`);
}
</script>
