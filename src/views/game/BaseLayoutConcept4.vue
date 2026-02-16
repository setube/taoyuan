<template>
  <div class="flex flex-col items-center gap-4 p-4 min-h-0">
    <div class="w-full max-w-[600px] flex items-center justify-between gap-2">
      <h3 class="text-accent text-xs">真实俯视图 (10×20)</h3>
      <button
        type="button"
        class="btn text-xs"
        :class="
          rearrangeMode ? 'bg-accent/20 text-accent ring-2 ring-accent' : ''
        "
        @click="toggleRearrangeMode"
      >
        {{ rearrangeMode ? "完成摆放" : "重新摆放" }}
      </button>
    </div>

    <!-- Apartment Grid: wrapper is drop target (extends with -m-4 p-4 in rearrange so edge drops work), grid stays clickable -->
    <div
      class="relative shrink-0"
      :class="{ '-m-4 p-4': rearrangeMode }"
      @dragover="onGridDragOver"
      @drop="onGridDrop"
    >
      <div
        ref="gridEl"
        class="apartment-grid shrink-0"
        :class="{ 'rearrange-mode': rearrangeMode }"
      >
        <button
          v-for="furniture in furnitureLayout"
          :key="furniture.id"
          :style="{ gridArea: furniture.gridArea }"
          class="furniture-btn"
          :class="{
            'ring-2 ring-accent': selectedFurniture?.id === furniture.id,
            'rearrange-draggable': rearrangeMode,
          }"
          :draggable="rearrangeMode"
          @click="
            () => {
              if (!rearrangeMode) selectFurniture(furniture);
            }
          "
          @dragstart="onDragStart($event, furniture)"
        >
          <component
            :is="getIcon(furniture.icon)"
            :size="getFurnitureIconSize(furniture)"
          />
          <span class="text-[10px] text-accent">{{ furniture.name }}</span>

          <!-- Barricade overlay if door/window -->
          <div
            v-if="showBarricadeOverlay(furniture)"
            class="barricade-overlay"
            :style="{ opacity: getBarricadeOpacity(furniture) }"
          />

          <!-- Badge for barricade level or supplies -->
          <span v-if="getFurnitureBadge(furniture)" class="furniture-badge">
            {{ getFurnitureBadge(furniture) }}
          </span>
        </button>
      </div>
    </div>

    <!-- Bottom of center: action buttons when something is selected (no visible container) -->
    <div
      v-if="selectedFurniture"
      class="w-full max-w-[600px] shrink-0 flex flex-wrap items-center gap-2"
    >
      <span class="text-accent text-[10px] font-medium w-full md:w-auto">
        {{ selectedFurniture.name }} —
      </span>
      <button
        v-for="action in primaryActions"
        :key="action.id"
        class="btn text-xs"
        :disabled="action.disabled"
        @click="runAction(action)"
      >
        {{ action.label }}
        <span v-if="action.badge" class="ml-1 text-[10px] text-muted">{{
          action.badge
        }}</span>
      </button>
      <button
        v-for="action in generalActions"
        :key="action.id"
        class="btn text-xs opacity-80 hover:opacity-100"
        :disabled="action.disabled"
        @click="runAction(action)"
      >
        {{ action.label }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject, onMounted } from "vue";
import { useRouter } from "vue-router";
import {
  DoorClosed,
  Bed,
  BookOpen,
  Package,
  Coffee,
  Square,
  Droplets,
  Box,
  Snowflake,
} from "lucide-vue-next";
import { APARTMENT_FURNITURE, type FurnitureDef } from "@/data/baseFurniture";

const LAYOUT_STORAGE_KEY = "taoyuan-concept4-furniture-layout";

function loadSavedLayout(): FurnitureDef[] {
  try {
    const raw = localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (!raw)
      return APARTMENT_FURNITURE.map((f) => ({
        ...f,
        gridArea: normalizeGridArea(f.gridArea),
      }));
    const saved = JSON.parse(raw) as Record<string, string>;
    return APARTMENT_FURNITURE.map((f) => ({
      ...f,
      gridArea: normalizeGridArea(saved[f.id] ?? f.gridArea),
    }));
  } catch {
    return APARTMENT_FURNITURE.map((f) => ({
      ...f,
      gridArea: normalizeGridArea(f.gridArea),
    }));
  }
}

function saveLayout(layout: FurnitureDef[]) {
  const map: Record<string, string> = {};
  layout.forEach((f) => {
    map[f.id] = f.gridArea;
  });
  localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(map));
}
import { getRandomFlavor } from "@/data/baseFlavor";
import type { RoomAction } from "@/components/game/BaseRoomModal.vue";
import { useBaseStore } from "@/stores/useBaseStore";
import { useGameStore } from "@/stores/useGameStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useGameLog } from "@/composables/useGameLog";

const router = useRouter();
const baseStore = useBaseStore();
const gameStore = useGameStore();
const playerStore = usePlayerStore();
const { addLog, runChoiceScene } = useGameLog();

const requestSleep = inject<() => void>("requestSleep");

const selectedFurniture = ref<FurnitureDef | null>(null);
const furnitureLayout = ref<FurnitureDef[]>(loadSavedLayout());
const rearrangeMode = ref(false);
const draggedFurniture = ref<FurnitureDef | null>(null);
const gridEl = ref<HTMLElement | null>(null);

const GRID_ROWS = 10;
const GRID_COLS = 20;

/** Parse gridArea "r0/c0/r1/c1" to integers (1-based). End lines can go to GRID_ROWS+1 / GRID_COLS+1. */
function parseGridArea(area: string): {
  r0: number;
  c0: number;
  r1: number;
  c1: number;
} {
  const parts = area.split("/").map((s) => Math.round(Number(s)) || 1);
  const r0 = Math.max(1, Math.min(parts[0] ?? 1, GRID_ROWS));
  const c0 = Math.max(1, Math.min(parts[1] ?? 1, GRID_COLS));
  const r1 = Math.max(r0 + 1, Math.min(parts[2] ?? 2, GRID_ROWS + 1));
  const c1 = Math.max(c0 + 1, Math.min(parts[3] ?? 2, GRID_COLS + 1));
  return { r0, c0, r1, c1 };
}

/** Snap to grid: return "r0/c0/r1/c1" with top-left at (row, col), same size, clamped. Allows last row/col. */
function snapToGridArea(
  currentArea: string,
  dropRow: number,
  dropCol: number,
): string {
  const { r0, c0, r1, c1 } = parseGridArea(currentArea);
  const h = Math.max(1, r1 - r0);
  const w = Math.max(1, c1 - c0);
  const maxR0 = GRID_ROWS - h + 1;
  const maxC0 = GRID_COLS - w + 1;
  const r0n = Math.max(1, Math.min(dropRow, maxR0));
  const c0n = Math.max(1, Math.min(dropCol, maxC0));
  const r1n = r0n + h;
  const c1n = c0n + w;
  return `${r0n}/${c0n}/${r1n}/${c1n}`;
}

/** Normalize gridArea to integers and bounds. */
function normalizeGridArea(area: string): string {
  const { r0, c0, r1, c1 } = parseGridArea(area);
  return `${r0}/${c0}/${r1}/${c1}`;
}

/** Find furniture that contains cell (row, col) (1-based). */
function findFurnitureAt(
  layout: FurnitureDef[],
  row: number,
  col: number,
): FurnitureDef | null {
  for (const f of layout) {
    const { r0, c0, r1, c1 } = parseGridArea(f.gridArea);
    if (row >= r0 && row < r1 && col >= c0 && col < c1) return f;
  }
  return null;
}

/** Get 1-based grid cell (row, col) from mouse position. Clamps to grid rect so edge drops (e.g. in padding) still map to edge cells. */
function getGridCellFromEvent(
  e: DragEvent,
): { row: number; col: number } | null {
  const el = gridEl.value;
  if (!el || e.clientX == null) return null;
  const rect = el.getBoundingClientRect();
  let x = e.clientX - rect.left;
  let y = e.clientY - rect.top;
  x = Math.max(0, Math.min(rect.width, x));
  y = Math.max(0, Math.min(rect.height, y));
  const col = Math.min(GRID_COLS, Math.floor((x / rect.width) * GRID_COLS) + 1);
  const row = Math.min(
    GRID_ROWS,
    Math.floor((y / rect.height) * GRID_ROWS) + 1,
  );
  return {
    row: Math.max(1, Math.min(row, GRID_ROWS)),
    col: Math.max(1, Math.min(col, GRID_COLS)),
  };
}

onMounted(() => {
  furnitureLayout.value = loadSavedLayout().map((f) => ({
    ...f,
    gridArea: normalizeGridArea(f.gridArea),
  }));
  saveLayout(furnitureLayout.value);
});

function toggleRearrangeMode() {
  rearrangeMode.value = !rearrangeMode.value;
  if (!rearrangeMode.value) {
    selectedFurniture.value = null;
    draggedFurniture.value = null;
  }
}

function onDragStart(e: DragEvent, furniture: FurnitureDef) {
  if (!e.dataTransfer) return;
  draggedFurniture.value = furniture;
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/plain", furniture.id);
}

function onGridDragOver(e: DragEvent) {
  e.preventDefault();
  if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
}

function onGridDrop(e: DragEvent) {
  e.preventDefault();
  const source = draggedFurniture.value;
  if (!source) return;
  const cell = getGridCellFromEvent(e);
  if (!cell) return;
  const layout = furnitureLayout.value.map((f) => ({
    ...f,
    gridArea: normalizeGridArea(f.gridArea),
  }));
  const srcIdx = layout.findIndex((f) => f.id === source.id);
  if (srcIdx === -1) return;
  const newArea = snapToGridArea(source.gridArea, cell.row, cell.col);
  const occupant = findFurnitureAt(layout, cell.row, cell.col);
  if (occupant && occupant.id === source.id) {
    draggedFurniture.value = null;
    return;
  }
  const oldSrcArea = layout[srcIdx].gridArea;
  if (occupant) {
    const tgtIdx = layout.findIndex((f) => f.id === occupant.id);
    if (tgtIdx !== -1) {
      layout[srcIdx] = { ...layout[srcIdx], gridArea: newArea };
      layout[tgtIdx] = { ...layout[tgtIdx], gridArea: oldSrcArea };
    }
  } else {
    layout[srcIdx] = { ...layout[srcIdx], gridArea: newArea };
  }
  furnitureLayout.value = layout.map((f) => ({
    ...f,
    gridArea: normalizeGridArea(f.gridArea),
  }));
  saveLayout(furnitureLayout.value);
  draggedFurniture.value = null;
}

// Icon mapping
const iconMap: Record<string, any> = {
  DoorClosed,
  Bed,
  BookOpen,
  Package,
  Coffee,
  Square, // Window
  Droplets,
  Box,
  Snowflake,
};

const getIcon = (iconName: string) => {
  return iconMap[iconName] || Package;
};

const getFurnitureIconSize = (furniture: FurnitureDef): number => {
  // Larger icons for bigger furniture
  const area = furniture.gridArea.split("/").map(Number);
  const rows = (area[2] ?? 1) - (area[0] ?? 0);
  const cols = (area[3] ?? 1) - (area[1] ?? 0);
  const totalCells = rows * cols;

  if (totalCells >= 9) return 20; // Large furniture (3×3)
  if (totalCells >= 4) return 16; // Medium furniture (2×2)
  return 14; // Small furniture
};

const showBarricadeOverlay = (furniture: FurnitureDef): boolean => {
  if (furniture.type !== "door" && furniture.type !== "window") return false;
  const barricadeLevel =
    furniture.id === "door"
      ? baseStore.getDoorBarricade()
      : baseStore.getWindowBarricade();
  return barricadeLevel > 0;
};

const getBarricadeOpacity = (furniture: FurnitureDef): number => {
  const barricadeLevel =
    furniture.id === "door"
      ? baseStore.getDoorBarricade()
      : baseStore.getWindowBarricade();
  return 0.1 + barricadeLevel * 0.1; // 0.2, 0.3, 0.4 for levels 1, 2, 3
};

const getFurnitureBadge = (furniture: FurnitureDef): string | null => {
  // Barricade badge for door/window
  if (furniture.type === "door" || furniture.type === "window") {
    const barricadeLevel =
      furniture.id === "door"
        ? baseStore.getDoorBarricade()
        : baseStore.getWindowBarricade();
    if (barricadeLevel > 0) {
      return `×${barricadeLevel}`;
    }
  }

  // Supplies badge for storage
  if (furniture.type === "storage" || furniture.type === "kitchen") {
    const supplies = baseStore.getFurnitureSupplies(furniture.id);
    if (supplies > 0) {
      return `${supplies}`;
    }
  }

  return null;
};

const selectFurniture = (furniture: FurnitureDef) => {
  selectedFurniture.value = furniture;
  const flavor = getRandomFlavor(furniture.id);
  addLog(flavor);
  baseStore.interactWithFurniture(furniture.id);
};

const clearSelection = () => {
  selectedFurniture.value = null;
};

const runAction = (action: RoomAction) => {
  action.handler();
};

// Actions based on furniture type
const primaryActions = computed<RoomAction[]>(() => {
  if (!selectedFurniture.value) return [];

  const furniture = selectedFurniture.value;
  const actions: RoomAction[] = [];

  switch (furniture.type) {
    case "bed":
      actions.push({
        id: "rest",
        label: "休息 (2回合)",
        handler: handleRest,
      });
      actions.push({
        id: "sleep",
        label: "长眠至早晨",
        handler: handleSleep,
      });
      break;

    case "door":
    case "window":
      const barricadeLevel =
        furniture.id === "door"
          ? baseStore.getDoorBarricade()
          : baseStore.getWindowBarricade();
      actions.push({
        id: "barricade",
        label: `加固${furniture.name}`,
        badge: `${barricadeLevel}/3`,
        disabled: barricadeLevel >= 3,
        handler: () => handleBarricade(furniture.id),
      });
      actions.push({
        id: "lookOut",
        label: `观察外面`,
        handler: () => void handleLookOut(furniture.id),
      });
      break;

    case "crafting":
      actions.push({
        id: "craft",
        label: "制作物品",
        handler: handleCraft,
      });
      actions.push({
        id: "read",
        label: "阅读书籍",
        handler: () => handleRead(),
      });
      break;

    case "storage":
      actions.push({
        id: "search",
        label: "翻找物品",
        handler: () => handleSearch(furniture.id),
      });
      actions.push({
        id: "organize",
        label: "整理物资",
        handler: () => handleOrganize(furniture.id),
      });
      break;

    case "kitchen":
      actions.push({
        id: "cook",
        label: "做简单的饭",
        handler: handleCook,
      });
      actions.push({
        id: "boilWater",
        label: "烧水",
        handler: handleBoilWater,
      });
      break;

    case "bathroom":
      actions.push({
        id: "wash",
        label: "洗漱",
        handler: handleWash,
      });
      actions.push({
        id: "getWater",
        label: "取水",
        handler: handleGetWater,
      });
      break;
  }

  return actions;
});

const generalActions = computed<RoomAction[]>(() => [
  {
    id: "viewInventory",
    label: "查看背包",
    handler: () => router.push("/game/inventory"),
  },
  {
    id: "quickRest",
    label: "休息一会儿",
    handler: handleRest,
  },
]);

// Action handlers
const handleRest = () => {
  gameStore.advanceTurns(2);
  const restoreAmount = 30;
  playerStore.stamina = Math.min(100, playerStore.stamina + restoreAmount);
  playerStore.hp = Math.min(playerStore.getMaxHp(), playerStore.hp + 5);
  addLog(`你休息了一会儿，恢复了体力。`);
};

const handleSleep = () => {
  if (requestSleep) {
    requestSleep();
  }
};

const handleBarricade = (furnitureId: string) => {
  const success = baseStore.upgradeFurnitureBarricade(furnitureId);
  if (success) {
    const level =
      furnitureId === "door"
        ? baseStore.getDoorBarricade()
        : baseStore.getWindowBarricade();
    const name = furnitureId === "door" ? "门" : "窗户";
    addLog(`你加固了${name}，当前等级: ${level}/3`);
  } else {
    addLog("已经达到最大加固等级");
  }
};

const handleLookOut = async (furnitureId: string) => {
  if (furnitureId === "window") {
    await runChoiceScene({
      flavorText:
        "你凑到窗边。外面天色阴沉，街道上零星有影子在动；远处有一缕黑烟缓缓升起。",
      options: ["向左看", "向下看", "盯着远处的烟多看一会儿"],
      followUps: [
        "左边那栋楼的阳台上有几盆枯死的植物，晾衣绳空荡荡的。",
        "楼下人行道上有几具倒伏的躯体，分不清是人是尸。",
        "那缕烟像是从几条街外的工厂区飘来的，说不清是火情还是有人在生火。",
      ],
    });
    gameStore.advanceTurns(1);
    return;
  }
  const messages = [
    "街上一片死寂，偶尔有游荡的尸群经过",
    "对面楼的窗户紧闭，不知道里面还有没有活人",
    "远处传来汽车警报声，引来了更多的僵尸",
  ];
  addLog(messages[Math.floor(Math.random() * messages.length)] ?? "...");
  gameStore.advanceTurns(1);
};

const handleCraft = () => {
  router.push("/game/workshop");
};

const handleRead = () => {
  addLog("你翻阅着旧书，暂时忘记了外面的恐怖。");
  gameStore.advanceTurns(2);
};

const handleSearch = (_furnitureId: string) => {
  addLog("你翻找了一番，但没有发现什么有用的东西。");
  gameStore.advanceTurns(1);
};

const handleOrganize = (_furnitureId: string) => {
  addLog("你整理了一下物资，心里稍微安心了一些。");
  gameStore.advanceTurns(1);
};

const handleCook = () => {
  addLog("你做了一顿简单的饭，填饱了肚子。");
  gameStore.advanceTurns(3);
};

const handleBoilWater = () => {
  addLog("你烧了一壶开水，可以喝上热水了。");
  gameStore.advanceTurns(2);
};

const handleWash = () => {
  addLog("你简单洗漱了一下，感觉清爽了些。");
  gameStore.advanceTurns(1);
};

const handleGetWater = () => {
  addLog("你从浴缸里取了一些水，得省着用。");
  gameStore.advanceTurns(1);
};
</script>

<style scoped>
.apartment-grid {
  display: grid;
  grid-template-columns: repeat(20, 1fr);
  grid-template-rows: repeat(10, 1fr);
  max-width: 600px;
  width: 100%;
  aspect-ratio: 2 / 1;
  gap: 1px;
  background: var(--color-bg);
  border: 1px solid oklch(from var(--color-accent) l c h / 0.3);
  border-radius: 4px;
  margin: 0 auto;
}

.furniture-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  background: var(--color-panel);
  border: 1px solid oklch(from var(--color-accent) l c h / 0.3);
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  padding: 2px;
}

.furniture-btn:hover {
  border-color: oklch(from var(--color-accent) l c h / 0.6);
  background: oklch(from var(--color-accent) l c h / 0.1);
  transform: scale(1.02);
}

/* Rearrange mode: drag handle cue, no click select */
.rearrange-mode .furniture-btn {
  cursor: grab;
}
.rearrange-mode .furniture-btn:active {
  cursor: grabbing;
}
.rearrange-mode .furniture-btn.rearrange-draggable {
  border-style: dashed;
}
.rearrange-mode .furniture-btn:hover {
  border-color: oklch(from var(--color-accent) l c h / 0.8);
}

.barricade-overlay {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 4px,
    oklch(from var(--color-accent) l c h / 0.2) 4px,
    oklch(from var(--color-accent) l c h / 0.2) 8px
  );
  pointer-events: none;
  border-radius: 2px;
}

.furniture-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  padding: 1px 4px;
  font-size: 9px;
  background: oklch(from var(--color-accent) l c h / 0.2);
  color: var(--color-accent);
  border-radius: 6px;
  font-weight: 600;
  line-height: 1.2;
}

/* Mobile responsiveness */
@media (max-width: 640px) {
  .apartment-grid {
    max-width: calc(100vw - 32px);
  }

  .furniture-btn {
    gap: 1px;
    padding: 1px;
  }

  .furniture-btn span {
    font-size: 8px;
  }
}
</style>
