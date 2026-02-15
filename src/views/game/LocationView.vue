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
    <template v-else>
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
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Store } from "lucide-vue-next";
import { useGameStore } from "@/stores/useGameStore";
import { getLocationName } from "@/data/locations";
import { TURN_COSTS } from "@/data/timeConstants";
import { addLog } from "@/composables/useGameLog";

const route = useRoute();
const router = useRouter();
const gameStore = useGameStore();

const locationId = computed(() => (route.params.id as string) || "apartment");
const locationName = computed(() => getLocationName(locationId.value as any));
const isApartment = computed(() => locationId.value === "apartment");

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
