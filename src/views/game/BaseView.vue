<template>
  <div>
    <div class="flex items-center gap-1.5 text-sm text-accent mb-3">
      <Home :size="14" />
      <span>基地（公寓）</span>
    </div>
    <p class="text-xs text-muted mb-3">
      这里是你的避难所。加固门窗、休息或制作物品。
    </p>

    <div class="flex flex-col gap-2 mb-4">
      <div
        class="border border-accent/20 rounded-xs p-2 flex justify-between items-center"
      >
        <span class="text-xs">加固等级</span>
        <span class="text-xs">{{ baseStore.barricadeLevel }}/3</span>
      </div>
      <button
        class="btn text-xs"
        :disabled="baseStore.barricadeLevel >= 3"
        @click="handleUpgradeBarricade"
      >
        加固门窗（需材料）
      </button>
    </div>

    <div class="flex flex-col gap-2">
      <button class="btn text-xs w-full justify-center" @click="handleRest">
        <Moon :size="12" class="mr-1" />
        休息（2 回合）
      </button>
      <button
        class="btn btn-danger text-xs w-full justify-center"
        @click="requestSleep"
      >
        <Moon :size="12" class="mr-1" />
        回家休息
      </button>
      <button class="btn text-xs w-full justify-center" @click="goCraft">
        制作
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject } from "vue";
import { Home, Moon } from "lucide-vue-next";
import { useBaseStore } from "@/stores/useBaseStore";
import { useGameStore } from "@/stores/useGameStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { TURN_COSTS } from "@/data/timeConstants";
import { addLog } from "@/composables/useGameLog";
import router from "@/router";

const requestSleep = inject<() => void>("requestSleep", () => {});

const baseStore = useBaseStore();
const gameStore = useGameStore();
const playerStore = usePlayerStore();

function handleUpgradeBarricade() {
  if (baseStore.upgradeBarricade()) {
    addLog("你加固了门窗，基地更安全了。");
  }
}

function handleRest() {
  const result = gameStore.advanceTurns(TURN_COSTS.rest);
  playerStore.restoreStamina(30);
  playerStore.restoreHealth(5);
  addLog("你休息了一会儿，恢复了少量体力和生命。");
  if (result.message) addLog(result.message);
}

function goCraft() {
  router.push("/game/workshop");
}
</script>
