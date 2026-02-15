<template>
  <div
    class="status-bar flex flex-col gap-1 min-h-0"
    :class="
      vertical
        ? 'status-bar-vertical pr-1.5 py-1.5'
        : 'border-b border-accent/30 pb-2 md:pb-3'
    "
  >
    <!-- Block 1: Identity -->
    <div
      :class="
        vertical
          ? 'status-bar-vertical-block text-xs flex flex-col gap-0.5 shrink-0'
          : 'text-xs md:text-sm flex items-center justify-between'
      "
    >
      <div
        :class="
          vertical
            ? 'flex flex-col gap-0.5'
            : 'flex items-center gap-2 md:gap-3'
        "
      >
        <span class="text-muted text-xs max-w-full truncate">{{
          playerStore.playerName
        }}</span>
        <template v-if="!vertical">
          <span class="hidden md:inline">第{{ gameStore.year }}年</span>
          <span
            >{{ SEASON_NAMES[gameStore.season] }} 第{{ gameStore.day }}天</span
          >
          <span class="text-muted hidden md:inline"
            >({{ gameStore.weekdayName }})</span
          >
          <span :class="{ 'text-danger': gameStore.isLateNight }">{{
            gameStore.timeDisplay
          }}</span>
          <span class="text-muted">{{ WEATHER_NAMES[gameStore.weather] }}</span>
        </template>
      </div>
      <span v-if="!vertical" class="text-accent shrink-0">
        <Coins :size="12" class="inline" />
        {{ playerStore.money }}文
      </span>
    </div>

    <!-- 5 tracks + 效果 (vertical only) -->
    <div
      v-if="vertical"
      class="status-bar-top flex flex-col gap-1 shrink-0 min-h-0 overflow-y-auto"
    >
      <!-- Block 2: 生命 / 体力 / 饥饿 / 疲劳 / 士气 — label + value -->
      <div
        v-for="row in statRows"
        :key="row.key"
        class="status-bar-track flex items-center justify-between gap-1 text-xs shrink-0"
      >
        <span :class="row.labelClass">{{ row.label }}</span>
        <span class="tabular-nums text-muted shrink-0">{{
          row.valueText
        }}</span>
      </div>

      <!-- Block 3: 效果 — section title + one row per status with hover tooltip -->
      <div class="shrink-0 mt-1">
        <p class="text-[10px] text-muted font-medium mb-0.5">效果</p>
        <div class="flex flex-col gap-0.5">
          <div
            v-for="row in effectRows"
            :key="row.key"
            class="status-bar-effect-row flex items-center justify-between text-[10px] cursor-help"
            @mouseenter="setHoveredEffect(row.key, $event)"
            @mouseleave="clearHoveredEffect"
          >
            <span :class="row.class">{{ row.label }}</span>
            <span class="text-muted tabular-nums">
              {{ row.turnsLeft == null ? "—" : `${row.turnsLeft} 回` }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile: compact backpack link -->
    <div v-if="!vertical" class="shrink-0">
      <button
        type="button"
        class="flex items-center gap-1 text-xs text-accent hover:bg-accent/10 rounded-xs py-0.5 px-1 -mb-1"
        @click="openBackpack"
      >
        <Package :size="12" />
        背包 {{ backpackSummary }}
      </button>
    </div>

    <!-- Effect tooltip: teleported to body, free-positioned, full-width capable -->
    <Teleport to="body">
      <div
        v-show="hoveredEffectKey && hoveredTooltipDescription"
        class="status-bar-effect-tooltip-fixed fixed z-100 px-2 py-1.5 rounded-xs bg-panel border border-muted/30 text-xs text-text whitespace-normal shadow-lg pointer-events-none"
        :style="effectTooltipStyle"
      >
        {{ hoveredTooltipDescription }}
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import {
  useGameStore,
  usePlayerStore,
  useSurvivalStore,
  useInventoryStore,
  SEASON_NAMES,
  WEATHER_NAMES,
} from "@/stores";
import {
  getHungerStageLabel,
  getFatigueStageLabel,
  getMoraleStageLabel,
  getHungerStageDescription,
  getFatigueStageDescription,
  getMoraleStageDescription,
  getTurnsUntilNextStage,
  HUNGER_STAGES,
  FATIGUE_STAGES,
  MORALE_STAGES,
} from "@/data/survivalStages";
import {
  HUNGER_RATE_PER_TURN,
  FATIGUE_RATE_PER_TURN,
} from "@/data/survivalConstants";
import { navigateToPanel } from "@/composables/useNavigation";
import { Coins, Package } from "lucide-vue-next";

defineProps<{ vertical?: boolean }>();

const gameStore = useGameStore();
const playerStore = usePlayerStore();
const survivalStore = useSurvivalStore();
const inventoryStore = useInventoryStore();

const hoveredEffectKey = ref<string | null>(null);
const tooltipPosition = ref<{ top: number; left: number } | null>(null);

function setHoveredEffect(key: string, ev: MouseEvent) {
  hoveredEffectKey.value = key;
  const el = ev.currentTarget as HTMLElement;
  if (el) {
    const rect = el.getBoundingClientRect();
    tooltipPosition.value = { top: rect.bottom + 4, left: rect.left };
  } else {
    tooltipPosition.value = null;
  }
}

function clearHoveredEffect() {
  hoveredEffectKey.value = null;
  tooltipPosition.value = null;
}

const hoveredTooltipDescription = computed(() => {
  if (!hoveredEffectKey.value) return "";
  const row = effectRows.value.find((r) => r.key === hoveredEffectKey.value);
  return row?.description ?? "";
});

const effectTooltipStyle = computed(() => {
  const pos = tooltipPosition.value;
  if (!pos) return {};
  return {
    top: `${pos.top}px`,
    left: `${pos.left}px`,
    maxWidth: "min(90vw, 420px)",
  };
});

/** Stat rows for 生命/体力/饥饿/疲劳/士气: label + value */
const statRows = computed(() => [
  {
    key: "hp",
    label: "生命",
    valueText: `${playerStore.hp}/${playerStore.getMaxHp()}`,
    labelClass: playerStore.getIsLowHp() ? "text-danger stamina-critical" : "",
  },
  {
    key: "stamina",
    label: "体力",
    valueText: `${playerStore.stamina}/${playerStore.maxStamina}`,
    labelClass: playerStore.isExhausted ? "text-danger stamina-critical" : "",
  },
  {
    key: "hunger",
    label: "饥饿",
    valueText: String(survivalStore.hunger),
    labelClass: "text-muted",
  },
  {
    key: "fatigue",
    label: "疲劳",
    valueText: String(survivalStore.fatigue),
    labelClass: "text-muted",
  },
  {
    key: "morale",
    label: "士气",
    valueText: String(survivalStore.morale),
    labelClass: "text-muted",
  },
]);

/** Effect rows: label, turns left, description (tooltip), class */
const effectRows = computed(() => {
  const h = survivalStore.hunger;
  const f = survivalStore.fatigue;
  const m = survivalStore.morale;
  const hungerTurns = getTurnsUntilNextStage(
    h,
    HUNGER_RATE_PER_TURN,
    HUNGER_STAGES,
  );
  const fatigueTurns = getTurnsUntilNextStage(
    f,
    FATIGUE_RATE_PER_TURN,
    FATIGUE_STAGES,
  );
  const moraleTurns = getTurnsUntilNextStage(m, 0, MORALE_STAGES);
  const rowClass = (val: number, isMorale: boolean) => {
    if (isMorale) {
      if (val <= 25) return "text-danger";
      if (val <= 50) return "text-accent";
      return "text-success";
    }
    if (val >= 75) return "text-danger";
    if (val >= 50) return "text-accent";
    return "text-success";
  };
  return [
    {
      key: "hunger",
      label: getHungerStageLabel(h),
      turnsLeft: hungerTurns,
      description: getHungerStageDescription(h),
      class: rowClass(h, false),
    },
    {
      key: "fatigue",
      label: getFatigueStageLabel(f),
      turnsLeft: fatigueTurns,
      description: getFatigueStageDescription(f),
      class: rowClass(f, false),
    },
    {
      key: "morale",
      label: getMoraleStageLabel(m),
      turnsLeft: moraleTurns,
      description: getMoraleStageDescription(m),
      class: rowClass(m, true),
    },
  ];
});

const backpackSummary = computed(() => {
  const count = inventoryStore.items.length;
  const cap = inventoryStore.capacity;
  return `${count}/${cap}`;
});

function openBackpack() {
  navigateToPanel("inventory");
}
</script>

<style scoped>
@keyframes staminaPulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}

.stamina-critical {
  animation: staminaPulse 1s ease-in-out infinite;
}

.status-bar-vertical {
  min-width: 0;
  font-size: 11px;
}

.status-bar-vertical .status-bar-vertical-block {
  font-size: 11px;
}

.status-bar-track {
  width: 100%;
}

/* 效果 rows: consistent hit target */
.status-bar-effect-row {
  min-height: 1.25rem;
}
</style>
