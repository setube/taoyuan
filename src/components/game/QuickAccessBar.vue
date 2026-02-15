<template>
  <div class="quick-access-bar flex flex-col gap-2 min-h-0 flex-1 min-w-0">
    <!-- Context panel (BackpackBar-style) -->
    <section
      class="context-panel flex flex-col rounded-xs bg-panel border border-muted/30 overflow-hidden min-h-0 flex-1"
    >
      <div
        class="context-panel-title w-full text-left px-1.5 py-1 text-xs font-medium text-accent shrink-0"
      >
        情境
      </div>
      <div
        class="context-panel-list border-t border-muted/25 px-1.5 pb-1.5 pt-1.5 flex flex-col gap-0.5 min-h-0 overflow-y-auto flex-1"
      >
        <!-- Location notes -->
        <template v-if="locationDef">
          <p class="text-[10px] text-accent font-medium truncate">
            {{ locationDef.name }}
          </p>
          <div class="text-[10px] text-muted flex flex-wrap gap-x-1.5 gap-y-0.5">
            <span>危险 Lv.{{ locationDef.dangerLevel ?? 0 }}</span>
            <span>·</span>
            <span>警觉 {{ alertLevel }}</span>
            <span>·</span>
            <span>物资 {{ locationDef.lootQuality ?? 0 }}</span>
            <span>·</span>
            <span>熟悉度：{{ familiarityLabel }}</span>
          </div>
        </template>
        <!-- NPCs in area -->
        <template v-if="npcsAtLocation.length > 0">
          <div
            v-for="npc in npcsAtLocation"
            :key="npc.id"
            class="text-[10px] flex flex-col gap-0.5 truncate"
          >
            <span class="text-accent/90 font-medium truncate">{{ npc.name }}</span>
            <div class="text-muted flex flex-wrap gap-x-1.5 gap-y-0">
              <span>好感 {{ getRelation(npc.id).affection }}</span>
              <span>恐惧 {{ getRelation(npc.id).fear }}</span>
              <span>道德 {{ getRelation(npc.id).moralIntegrity }}</span>
            </div>
          </div>
        </template>
        <p
          v-else-if="locationDef && npcsAtLocation.length === 0"
          class="text-[10px] text-muted/70"
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

const locationDef = computed(() =>
  getLocationById(currentCityLocation.value),
);

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
.quick-access-bar {
  width: 120px;
  min-width: 120px;
}

.context-panel-title {
  font-family: inherit;
}

.context-panel-list {
  min-height: 0;
}
</style>
