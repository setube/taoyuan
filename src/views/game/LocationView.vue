<template>
  <div>
    <div class="flex items-center gap-1.5 text-sm text-accent mb-3">
      <Store :size="14" />
      <span>{{ locationName }}</span>
    </div>

    <template v-if="locationBlurb">
      <p class="text-xs text-muted">{{ locationBlurb }}</p>
      <button class="btn text-xs mt-2" @click="goToMap">{{ locationCopy.LOCATION_BTN_BACK_MAP }}</button>
    </template>
    <template v-else>
      <!-- NPC interaction: chip(s) and action buttons on the same row -->
      <template v-if="npcsAtThisLocation.length > 0">
        <div class="flex flex-wrap items-center gap-1.5 mb-3">
          <LocationNpcConceptC
            :npcs="npcsAtThisLocation"
            :chip-suffix="locationCopy.LOCATION_NPC_CHIP_SUFFIX"
            @interact="startNpcConversation"
          />
          <template v-if="activeNpc">
            <button
              type="button"
              class="btn text-[10px] px-2 py-1 rounded-full bg-panel border border-muted/30 hover:border-accent/40 text-muted hover:text-accent"
              @click="handleNpcAction('talk')"
            >
              {{ locationCopy.LOCATION_NPC_BTN_TALK }}
            </button>
            <button
              type="button"
              class="btn text-[10px] px-2 py-1 rounded-full bg-panel border border-muted/30 hover:border-accent/40 text-muted hover:text-accent"
              @click="handleNpcAction('buy')"
            >
              {{ locationCopy.LOCATION_NPC_BTN_BUY }}
            </button>
            <button
              type="button"
              class="btn text-[10px] px-2 py-1 rounded-full bg-panel border border-muted/30 hover:border-accent/40 text-muted hover:text-accent"
              @click="handleNpcAction('rob')"
            >
              {{ locationCopy.LOCATION_NPC_BTN_ROB }}
            </button>
            <button
              type="button"
              class="btn text-[10px] px-2 py-1 rounded-full bg-panel border border-muted/30 hover:border-accent/40 text-muted hover:text-accent"
              @click="handleNpcAction('scare')"
            >
              {{ locationCopy.LOCATION_NPC_BTN_SCARE }}
            </button>
            <button
              type="button"
              class="btn text-[10px] px-2 py-1 rounded-full border border-muted/50 text-muted"
              @click="activeNpc = null"
            >
              {{ locationCopy.LOCATION_NPC_BTN_END }}
            </button>
          </template>
        </div>
      </template>

      <template v-if="gameStore.phase === 'pre'">
        <p class="text-xs text-muted mb-2">{{ locationCopy.LOCATION_HINT_PRE }}</p>
        <button class="btn text-xs w-full" @click="handleShop">
          {{ locationCopy.LOCATION_BTN_SHOP }}
        </button>
      </template>
      <template v-else>
        <p class="text-xs text-muted mb-2">{{ locationCopy.LOCATION_HINT_POST }}</p>
        <button class="btn text-xs w-full" @click="handleScavenge">
          {{ locationCopy.LOCATION_BTN_SCAVENGE }}
        </button>
      </template>
      <button class="btn text-xs mt-2 w-full" @click="goToMap">{{ locationCopy.LOCATION_BTN_BACK_MAP }}</button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Store } from "lucide-vue-next";
import { useGameStore } from "@/stores/useGameStore";
import { getLocationName } from "@/data/locations";
import {
  getAllSurvivalNpcs,
  DEFAULT_NPC_GREETING,
  DEFAULT_NPC_ACTION_MESSAGES,
} from "@/data/survivalNpcs";
import type { SurvivalNpcDef, NpcActionKey } from "@/data/survivalNpcs";
import * as locationCopy from "@/data/locationCopy";
import { TURN_COSTS } from "@/data/timeConstants";
import { addLog, useGameLog } from "@/composables/useGameLog";
import { getScript } from "@/data/scripts";
import {
  locationFirstVisitKey,
  npcFirstTalkKey,
  getScriptIdForTrigger,
} from "@/data/scriptTriggers";
import { useScriptTriggerStore } from "@/stores/useScriptTriggerStore";
import type { CityLocationId } from "@/types/game";
import type { SurvivalNpcId } from "@/types/survival";
import LocationNpcConceptC from "./location/LocationNpcConceptC.vue";

const route = useRoute();
const router = useRouter();
const gameStore = useGameStore();
const scriptTriggerStore = useScriptTriggerStore();
const { runScript } = useGameLog();

const locationId = computed(() => (route.params.id as string) || "apartment");
const locationName = computed(() => getLocationName(locationId.value as any));
const locationBlurb = computed(() =>
  locationCopy.getLocationBlurb(locationId.value as any),
);

const npcsAtThisLocation = computed(() =>
  getAllSurvivalNpcs().filter((def) => def.locationId === locationId.value),
);

const activeNpc = ref<SurvivalNpcDef | null>(null);

/** Fire location_first_visit trigger if registered and not yet fired. */
async function tryFireLocationFirstVisit(id: CityLocationId) {
  const key = locationFirstVisitKey(id);
  if (scriptTriggerStore.hasFired(key)) return;
  const scriptId = getScriptIdForTrigger(key);
  if (!scriptId) return;
  const script = getScript(scriptId);
  if (!script) return;
  await runScript(script);
  scriptTriggerStore.markFired(key);
}

/** Fire npc_first_talk trigger if registered and not yet fired. Returns true if a script ran. */
async function tryFireNpcFirstTalk(npcId: SurvivalNpcId): Promise<boolean> {
  const key = npcFirstTalkKey(npcId);
  if (scriptTriggerStore.hasFired(key)) return false;
  const scriptId = getScriptIdForTrigger(key);
  if (!scriptId) return false;
  const script = getScript(scriptId);
  if (!script) return false;
  await runScript(script);
  scriptTriggerStore.markFired(key);
  return true;
}

async function startNpcConversation(npc: SurvivalNpcDef) {
  activeNpc.value = npc;
  await tryFireNpcFirstTalk(npc.id);
  const msg = npc.greeting ?? DEFAULT_NPC_GREETING;
  addLog(msg, { speaker: npc.name });
}

function handleNpcAction(action: NpcActionKey) {
  const npc = activeNpc.value;
  if (!npc) return;
  const msg =
    npc.actionMessages?.[action] ?? DEFAULT_NPC_ACTION_MESSAGES[action];
  addLog(msg, { speaker: npc.name });
}

function goToMap() {
  router.push("/game/map");
}

function handleShop() {
  gameStore.advanceTurns(TURN_COSTS.shop);
  addLog(locationCopy.getShopResultMessage(locationName.value));
}

function handleScavenge() {
  gameStore.advanceTurns(TURN_COSTS.scavenge);
  addLog(locationCopy.getScavengeResultMessage(locationName.value));
}

onMounted(() => {
  tryFireLocationFirstVisit(locationId.value as CityLocationId);
});

watch(locationId, (id) => {
  tryFireLocationFirstVisit(id as CityLocationId);
});
</script>
