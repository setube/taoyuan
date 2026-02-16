<template>
  <div>
    <div class="flex items-center gap-1.5 text-sm text-accent mb-3">
      <Store :size="14" />
      <span>{{ locationName }}</span>
    </div>

    <template v-if="isApartment">
      <p class="text-xs text-muted">这里是公寓，请从地图前往其他地点。</p>
      <button class="btn text-xs mt-2" @click="goToMap">返回地图</button>
    </template>
    <template v-else-if="locationId === 'street'">
      <p class="text-xs text-muted">你在街道上，无特别之处。</p>
      <button class="btn text-xs mt-2" @click="goToMap">返回地图</button>
    </template>
    <template v-else>
      <!-- NPC interaction: chip(s) and action buttons on the same row -->
      <template v-if="npcsAtThisLocation.length > 0">
        <div class="flex flex-wrap items-center gap-1.5 mb-3">
          <LocationNpcConceptC
            :npcs="npcsAtThisLocation"
            @interact="startNpcConversation"
          />
          <template v-if="activeNpc">
            <button
              type="button"
              class="btn text-[10px] px-2 py-1 rounded-full bg-panel border border-muted/30 hover:border-accent/40 text-muted hover:text-accent"
              @click="handleNpcAction('talk')"
            >
              交谈
            </button>
            <button
              type="button"
              class="btn text-[10px] px-2 py-1 rounded-full bg-panel border border-muted/30 hover:border-accent/40 text-muted hover:text-accent"
              @click="handleNpcAction('buy')"
            >
              购买
            </button>
            <button
              type="button"
              class="btn text-[10px] px-2 py-1 rounded-full bg-panel border border-muted/30 hover:border-accent/40 text-muted hover:text-accent"
              @click="handleNpcAction('rob')"
            >
              抢劫
            </button>
            <button
              type="button"
              class="btn text-[10px] px-2 py-1 rounded-full bg-panel border border-muted/30 hover:border-accent/40 text-muted hover:text-accent"
              @click="handleNpcAction('scare')"
            >
              恐吓
            </button>
            <button
              type="button"
              class="btn text-[10px] px-2 py-1 rounded-full border border-muted/50 text-muted"
              @click="activeNpc = null"
            >
              结束
            </button>
          </template>
        </div>
      </template>

      <template v-if="gameStore.phase === 'pre'">
        <p class="text-xs text-muted mb-2">疫情尚未爆发，可以购物。</p>
        <button class="btn text-xs w-full" @click="handleShop">
          购物（1 回合）
        </button>
      </template>
      <template v-else>
        <p class="text-xs text-muted mb-2">搜寻物资。</p>
        <button class="btn text-xs w-full" @click="handleScavenge">
          搜寻（1 回合）
        </button>
      </template>
      <button class="btn text-xs mt-2 w-full" @click="goToMap">返回地图</button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Store } from "lucide-vue-next";
import { useGameStore } from "@/stores/useGameStore";
import { getLocationName } from "@/data/locations";
import { getAllSurvivalNpcs } from "@/data/survivalNpcs";
import type { SurvivalNpcDef } from "@/data/survivalNpcs";
import { TURN_COSTS } from "@/data/timeConstants";
import { addLog } from "@/composables/useGameLog";
import LocationNpcConceptC from "./location/LocationNpcConceptC.vue";

const route = useRoute();
const router = useRouter();
const gameStore = useGameStore();

const locationId = computed(() => (route.params.id as string) || "apartment");
const locationName = computed(() => getLocationName(locationId.value as any));
const isApartment = computed(() => locationId.value === "apartment");

const npcsAtThisLocation = computed(() =>
  getAllSurvivalNpcs().filter((def) => def.locationId === locationId.value),
);

const activeNpc = ref<SurvivalNpcDef | null>(null);
function startNpcConversation(npc: SurvivalNpcDef) {
  activeNpc.value = npc;
  addLog("欢迎，需要什么？", { speaker: npc.name });
}

type NpcActionKey = "talk" | "buy" | "rob" | "scare";
function handleNpcAction(action: NpcActionKey) {
  const npc = activeNpc.value;
  if (!npc) return;
  const messages: Record<NpcActionKey, string> = {
    talk: "你们随便聊了几句。",
    buy: "（购买功能尚未开放）",
    rob: "（抢劫会带来后果，尚未开放）",
    scare: "（恐吓会影响关系，尚未开放）",
  };
  addLog(messages[action], { speaker: npc.name });
}

function goToMap() {
  router.push("/game/map");
}

function handleShop() {
  gameStore.advanceTurns(TURN_COSTS.shop);
  addLog(`在${locationName.value}逛了逛，暂时没有购买。`);
}

function handleScavenge() {
  gameStore.advanceTurns(TURN_COSTS.scavenge);
  addLog(`在${locationName.value}搜寻了一番。`);
}
</script>
