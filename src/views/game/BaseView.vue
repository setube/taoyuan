<template>
  <div>
    <div class="flex items-center gap-1.5 text-sm text-accent mb-3">
      <Home :size="14" />
      <span>基地（公寓）</span>
      <span
        v-if="baseStore.baseLayoutConcept > 1"
        class="text-[10px] px-1.5 py-0.5 rounded border border-accent/40 text-accent/90 bg-accent/10"
      >
        概念{{ baseStore.baseLayoutConcept }}
      </span>
    </div>
    <p class="text-xs text-muted mb-3">
      这里是你的避难所。加固门窗、休息或制作物品。顶栏可点「布局 N」切换布局。
    </p>

    <!-- 概念1：默认竖排 -->
    <template v-if="baseStore.baseLayoutConcept === 1">
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
    </template>

    <!-- 概念2：先休息区再加固 -->
    <template v-else-if="baseStore.baseLayoutConcept === 2">
      <div class="grid grid-cols-2 gap-2 mb-4">
        <button class="btn text-xs justify-center py-3" @click="handleRest">
          <Moon :size="12" class="mr-1" />
          休息
        </button>
        <button
          class="btn btn-danger text-xs justify-center py-3"
          @click="requestSleep"
        >
          <Moon :size="12" class="mr-1" />
          回家休息
        </button>
        <button class="btn text-xs col-span-2 justify-center" @click="goCraft">
          制作
        </button>
      </div>
      <div
        class="border border-accent/20 rounded-xs p-2 flex justify-between items-center mb-2"
      >
        <span class="text-xs">加固等级</span>
        <span class="text-xs">{{ baseStore.barricadeLevel }}/3</span>
      </div>
      <button
        class="btn text-xs w-full"
        :disabled="baseStore.barricadeLevel >= 3"
        @click="handleUpgradeBarricade"
      >
        加固门窗（需材料）
      </button>
    </template>

    <!-- 概念3：横向快捷条 + 加固 -->
    <template v-else-if="baseStore.baseLayoutConcept === 3">
      <div
        class="flex flex-wrap gap-2 mb-4 p-2 border border-accent/20 rounded-xs"
      >
        <button class="btn text-xs flex-1 min-w-20" @click="handleRest">
          <Moon :size="12" class="mr-1" />
          休息
        </button>
        <button
          class="btn btn-danger text-xs flex-1 min-w-20"
          @click="requestSleep"
        >
          <Moon :size="12" class="mr-1" />
          回家休息
        </button>
        <button class="btn text-xs flex-1 min-w-20" @click="goCraft">
          制作
        </button>
      </div>
      <div
        class="border border-accent/20 rounded-xs p-2 flex justify-between items-center mb-2"
      >
        <span class="text-xs">加固等级</span>
        <span class="text-xs">{{ baseStore.barricadeLevel }}/3</span>
      </div>
      <button
        class="btn text-xs w-full"
        :disabled="baseStore.barricadeLevel >= 3"
        @click="handleUpgradeBarricade"
      >
        加固门窗（需材料）
      </button>
    </template>

    <!-- 概念4：卡片式 -->
    <template v-else-if="baseStore.baseLayoutConcept === 4">
      <div class="grid grid-cols-2 gap-2 mb-4">
        <div class="border border-accent/20 rounded-xs p-2 flex flex-col gap-1">
          <span class="text-xs text-muted">加固</span>
          <span class="text-accent text-sm"
            >{{ baseStore.barricadeLevel }}/3</span
          >
          <button
            class="btn text-xs mt-1"
            :disabled="baseStore.barricadeLevel >= 3"
            @click="handleUpgradeBarricade"
          >
            加固
          </button>
        </div>
        <div class="border border-accent/20 rounded-xs p-2 flex flex-col gap-1">
          <span class="text-xs text-muted">休息</span>
          <button class="btn text-xs py-2" @click="handleRest">
            休息（2 回合）
          </button>
          <button class="btn btn-danger text-xs py-2" @click="requestSleep">
            回家休息
          </button>
        </div>
      </div>
      <button class="btn text-xs w-full justify-center" @click="goCraft">
        制作
      </button>
    </template>

    <!-- 概念5：20×10 俯视平面图 -->
    <template v-else-if="baseStore.baseLayoutConcept === 5">
      <div
        class="base-floor-grid mb-4 rounded-xs overflow-hidden bg-accent/5"
        style="
          display: grid;
          grid-template-columns: repeat(10, 1fr);
          grid-template-rows: repeat(4, 1fr);
          aspect-ratio: 10 / 4;
          max-height: 50vh;
          gap: 2px;
        "
      >
        <div
          v-for="item in BASE_FURNITURE"
          :key="item.id"
          class="base-furniture-tile relative flex items-center justify-center rounded-sm border border-accent/30 bg-panel/90 hover:bg-accent/20 cursor-pointer transition-colors text-xs text-accent font-medium"
          :style="{
            gridColumn: `${item.x + 1} / span ${item.w}`,
            gridRow: `${item.y + 1} / span ${item.h}`,
          }"
          @click="selectedFurniture = item"
        >
          <span>{{ item.name }}</span>
          <span
            v-if="
              (item.id === 'door' || item.id === 'window') &&
              baseStore.barricadeLevel > 0
            "
            class="absolute bottom-0.5 right-0.5 text-[10px] text-muted"
          >
            {{ baseStore.barricadeLevel }}/3
          </span>
        </div>
      </div>
      <p class="text-xs text-muted mb-2">点击家具选择操作。</p>

      <!-- 概念5：选中家具后的操作按钮（顶栏下方） -->
      <div v-if="selectedFurniture" class="mb-3">
        <p class="text-xs text-muted mb-2">
          当前：{{ selectedFurniture.name }}
        </p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="action in selectedFurniture.actions"
            :key="action.type + action.label"
            class="btn text-xs"
            :class="action.type === 'sleep' ? 'btn-danger' : ''"
            :disabled="
              action.type === 'barricade' && baseStore.barricadeLevel >= 3
            "
            @click="
              dispatchBaseAction(action.type);
              selectedFurniture = null;
            "
          >
            {{
              action.type === "barricade" && baseStore.barricadeLevel >= 3
                ? "加固已满"
                : action.label
            }}
          </button>
          <button
            class="btn text-xs text-muted border border-accent/20"
            @click="selectedFurniture = null"
          >
            取消
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { inject, ref } from "vue";
import { Home, Moon } from "lucide-vue-next";
import { useBaseStore } from "@/stores/useBaseStore";
import { useGameStore } from "@/stores/useGameStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { TURN_COSTS } from "@/data/timeConstants";
import { BASE_FURNITURE } from "@/data/baseFurniture";
import type { BaseActionType, BaseFurnitureItem } from "@/data/baseFurniture";
import { addLog } from "@/composables/useGameLog";
import router from "@/router";

const requestSleep = inject<() => void>("requestSleep", () => {});

const baseStore = useBaseStore();
const gameStore = useGameStore();
const playerStore = usePlayerStore();

/** Concept 5: selected furniture for action modal */
const selectedFurniture = ref<BaseFurnitureItem | null>(null);

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

function dispatchBaseAction(type: BaseActionType) {
  switch (type) {
    case "rest":
      handleRest();
      break;
    case "sleep":
      requestSleep();
      break;
    case "craft":
      goCraft();
      break;
    case "barricade":
      handleUpgradeBarricade();
      break;
    case "inventory":
      router.push({ name: "inventory" });
      break;
  }
}
</script>
