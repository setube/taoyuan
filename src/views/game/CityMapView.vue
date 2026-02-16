<template>
  <div>
    <div class="flex items-center gap-1.5 text-sm text-accent mb-3">
      <Map :size="14" />
      <span>城市地图</span>
    </div>
    <p class="text-xs text-muted mb-3">当前所在：{{ currentLocationName }}</p>

    <div class="map-grid" :style="gridStyle">
      <button
        v-for="cell in gridCells"
        :key="`${cell.row}-${cell.col}`"
        type="button"
        class="map-cell"
        :class="{
          'map-cell--current': isCurrentCell(cell.row, cell.col),
          'map-cell--street': cell.locationId === 'street',
        }"
        :title="`${getLocationName(cell.locationId)}${travelCost(cell) > 0 ? ` · ${travelCost(cell)} 回合` : ''}`"
        @click="travelToCell(cell.row, cell.col)"
      >
        {{ cellLabel(cell.locationId) }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Map } from "lucide-vue-next";
import { useGameStore } from "@/stores/useGameStore";
import { getLocationName } from "@/data/locations";
import {
  GRID_ROWS,
  GRID_COLS,
  getCellAt,
  getTravelTurnsBetween,
} from "@/data/mapGrid";
import { useEncounterStore } from "@/stores/useEncounterStore";
import { useCombatStore } from "@/stores/useCombatStore";
import { getZombieById } from "@/data/zombies";
import { addLog } from "@/composables/useGameLog";
import router from "@/router";

const gameStore = useGameStore();
const encounterStore = useEncounterStore();
const combatStore = useCombatStore();

const currentLocationName = computed(() =>
  getLocationName(gameStore.currentCityLocation),
);

const gridStyle = computed(() => ({
  display: "grid",
  gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
  gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`,
}));

const gridCells = computed(() => {
  const cells: {
    row: number;
    col: number;
    locationId: ReturnType<typeof getCellAt>;
  }[] = [];
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      cells.push({ row: r, col: c, locationId: getCellAt(r, c) });
    }
  }
  return cells;
});

function cellLabel(locationId: string): string {
  const labels: Record<string, string> = {
    apartment: "公",
    supermarket: "超",
    pharmacy: "药",
    hardware: "五",
    street: "·",
  };
  return labels[locationId] ?? "·";
}

function isCurrentCell(row: number, col: number): boolean {
  return gameStore.mapPosition.row === row && gameStore.mapPosition.col === col;
}

function travelCost(cell: { row: number; col: number }): number {
  return getTravelTurnsBetween(gameStore.mapPosition, {
    row: cell.row,
    col: cell.col,
  });
}

function travelToCell(row: number, col: number) {
  const fromId = gameStore.currentCityLocation;
  const result = gameStore.travelToGridCell(row, col);
  const toId = gameStore.currentCityLocation;
  addLog(result.message || `到达${getLocationName(toId)}。`);
  if (result.passedOut) {
    // TODO: handleEndDay
  }
  if (result.newDay) {
    // day rolled over
  }
  const encounter = encounterStore.rollEncounter(fromId, toId, gameStore.phase);
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
  if (toId !== "street") {
    router.push(`/game/location/${toId}`);
  }
}
</script>

<style scoped>
.map-grid {
  aspect-ratio: 1;
  max-width: 280px;
  gap: 2px;
  margin: 0 auto;
}

.map-cell {
  min-height: 2rem;
  font-size: 0.75rem;
  padding: 0.25rem;
  border: 1px solid oklch(from var(--color-muted) l c h / 0.5);
  border-radius: 4px;
  background: var(--color-panel);
  color: var(--color-text);
  cursor: pointer;
  transition: background 0.15s;
}

.map-cell:hover {
  background: oklch(from var(--color-accent) l c h / 0.15);
}

.map-cell--current {
  background: var(--color-accent);
  color: var(--color-bg);
  font-weight: 600;
}

.map-cell--street {
  opacity: 0.85;
}
</style>
