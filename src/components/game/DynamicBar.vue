<template>
  <div class="dynamic-bar flex flex-col gap-2 min-h-0 flex-1 min-w-0">
    <!-- Context panel (BackpackBar-style) -->
    <section
      class="dynamic-bar-panel flex flex-col rounded-xs bg-panel border border-muted/30 overflow-hidden min-h-0 flex-1"
    >
      <div
        class="dynamic-bar-title w-full text-left px-1.5 py-1 text-xs font-medium text-accent shrink-0"
      >
        情境
      </div>
      <div
        class="dynamic-bar-list border-t border-muted/25 px-1.5 pb-1.5 pt-1.5 flex flex-col gap-0.5 min-h-0 overflow-y-auto flex-1"
      >
        <!-- Location notes: one row per attribute -->
        <template v-if="locationDef">
          <p class="text-[10px] text-accent font-medium truncate mb-0.5">
            {{ locationDef.name }}
          </p>
          <div
            class="dynamic-bar-row text-[10px] flex items-center justify-between gap-1 shrink-0"
          >
            <span class="text-muted">危险</span>
            <span class="tabular-nums text-muted shrink-0"
              >Lv.{{ locationDef.dangerLevel ?? 0 }}</span
            >
          </div>
          <div
            class="dynamic-bar-row text-[10px] flex items-center justify-between gap-1 shrink-0"
          >
            <span class="text-muted">警觉</span>
            <span class="tabular-nums text-muted shrink-0">{{
              alertLevel
            }}</span>
          </div>
          <div
            class="dynamic-bar-row text-[10px] flex items-center justify-between gap-1 shrink-0"
          >
            <span class="text-muted">物资</span>
            <span class="tabular-nums text-muted shrink-0">{{
              locationDef.lootQuality ?? 0
            }}</span>
          </div>
          <div
            class="dynamic-bar-row text-[10px] flex items-center justify-between gap-1 shrink-0"
          >
            <span class="text-muted">熟悉度</span>
            <span class="tabular-nums text-muted shrink-0">{{
              familiarityLabel
            }}</span>
          </div>
        </template>
        <!-- NPCs in area: one row per attribute per NPC -->
        <template v-if="npcsAtLocation.length > 0">
          <div
            v-for="npc in npcsAtLocation"
            :key="npc.id"
            class="flex flex-col gap-0.5 shrink-0 mt-0.5"
          >
            <span class="text-[10px] text-accent/90 font-medium truncate">
              {{ npc.name }}
            </span>
            <div
              class="dynamic-bar-row text-[10px] flex items-center justify-between gap-1 shrink-0"
            >
              <span class="text-muted">好感</span>
              <span class="tabular-nums text-muted shrink-0">{{
                getRelation(npc.id).affection
              }}</span>
            </div>
            <div
              class="dynamic-bar-row text-[10px] flex items-center justify-between gap-1 shrink-0"
            >
              <span class="text-muted">恐惧</span>
              <span class="tabular-nums text-muted shrink-0">{{
                getRelation(npc.id).fear
              }}</span>
            </div>
            <div
              class="dynamic-bar-row text-[10px] flex items-center justify-between gap-1 shrink-0"
            >
              <span class="text-muted">道德</span>
              <span class="tabular-nums text-muted shrink-0">{{
                getRelation(npc.id).moralIntegrity
              }}</span>
            </div>
          </div>
        </template>
        <p
          v-else-if="locationDef && npcsAtLocation.length === 0"
          class="text-[10px] text-muted/70 shrink-0"
        >
          （此处无 NPC）
        </p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import { useGameStore } from "@/stores/useGameStore";
import { useMapStateStore } from "@/stores/useMapStateStore";
import { useFamiliarityStore } from "@/stores/useFamiliarityStore";
import { useSurvivalNpcStore } from "@/stores/useSurvivalNpcStore";
import { getLocationById } from "@/data/locations";
import { getAllSurvivalNpcs } from "@/data/survivalNpcs";
import { FAMILIARITY_TIER_NAMES } from "@/types/survival";
import type { FamiliarityTier } from "@/types/survival";

const gameStore = useGameStore();
const mapStateStore = useMapStateStore();
const familiarityStore = useFamiliarityStore();
const survivalNpcStore = useSurvivalNpcStore();

const currentCityLocation = computed(() => gameStore.currentCityLocation);

const locationDef = computed(() => getLocationById(currentCityLocation.value));

const alertLevel = computed(() =>
  mapStateStore.getAlertLevel(currentCityLocation.value),
);

const familiarityTier = computed(() =>
  familiarityStore.getFamiliarity(currentCityLocation.value),
);

const familiarityLabel = computed(
  () =>
    FAMILIARITY_TIER_NAMES[familiarityTier.value as FamiliarityTier] ?? "陌生",
);

const npcsAtLocation = computed(() =>
  getAllSurvivalNpcs().filter(
    (def) => def.locationId === currentCityLocation.value,
  ),
);

/** Ensure NPCs at current location are initialized so getRelation returns values. */
watch(
  npcsAtLocation,
  (npcs) => {
    npcs.forEach((npc) => survivalNpcStore.initNpc(npc.id));
  },
  { immediate: true },
);

function getRelation(npcId: string) {
  return survivalNpcStore.getRelation(npcId);
}
</script>

<style scoped>
.dynamic-bar {
  width: 120px;
  min-width: 120px;
}

.dynamic-bar-title {
  font-family: inherit;
}

.dynamic-bar-list {
  min-height: 0;
}
</style>
