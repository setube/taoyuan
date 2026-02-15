<template>
  <section
    class="status-bar flex flex-col rounded-xs bg-panel border border-muted/30 overflow-hidden min-h-0"
    :class="vertical ? 'flex-1' : ''"
  >
    <!-- Title: Identity row (player name, date/time, money) -->
    <div
      class="status-bar-title w-full text-left px-1.5 py-1 text-xs shrink-0"
      :class="
        vertical
          ? 'flex flex-col gap-0.5'
          : 'flex items-center justify-between flex-wrap gap-x-2 gap-y-0.5'
      "
    >
      <div
        :class="
          vertical
            ? 'flex flex-col gap-0.5'
            : 'flex items-center gap-2 md:gap-3 flex-wrap'
        "
      >
        <button
          type="button"
          class="status-bar-name text-accent text-xs max-w-full truncate text-left font-medium hover:bg-accent/10 transition-colors rounded-xs px-0.5 -mx-0.5 py-0 border-0 bg-transparent cursor-pointer"
          @click="openCharInfo"
        >
          {{ playerStore.playerName }}
        </button>
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

    <!-- Content: stats + effects (vertical only), or backpack link (horizontal) -->
    <div
      class="status-bar-list border-t border-muted/25 px-1.5 pb-1.5 pt-1.5 flex flex-col gap-0.5 min-h-0 overflow-y-auto flex-1"
    >
      <template v-if="vertical">
        <!-- Block: 生命 / 体力 / 饥饿 / 疲劳 / 士气 -->
        <div
          v-for="row in statRows"
          :key="row.key"
          class="status-bar-track text-[10px] flex items-center justify-between gap-1 shrink-0"
        >
          <span :class="row.labelClass">{{ row.label }}</span>
          <span class="tabular-nums text-muted shrink-0">{{
            row.valueText
          }}</span>
        </div>

        <!-- Block: 效果 -->
        <div class="shrink-0 mt-0.5">
          <p class="text-[10px] text-accent font-medium mb-0.5">效果</p>
          <div class="flex flex-col gap-0.5">
            <div
              v-for="row in effectRows"
              :key="row.key"
              class="status-bar-effect-row flex items-center justify-between text-[10px] cursor-help min-h-5"
              @mouseenter="setHoveredEffect(row.key, $event)"
              @mouseleave="clearHoveredEffect"
            >
              <span :class="row.class">{{ row.label }}</span>
              <span class="text-muted tabular-nums shrink-0">
                {{ row.turnsLeft == null ? "—" : `${row.turnsLeft} 回` }}
              </span>
            </div>
          </div>
        </div>
      </template>

      <!-- Horizontal: compact backpack link -->
      <div v-if="!vertical" class="shrink-0">
        <button
          type="button"
          class="w-full text-left px-0 py-0.5 text-xs font-medium text-accent hover:bg-accent/10 transition-colors cursor-pointer border-0 bg-transparent flex items-center gap-1"
          @click="openBackpack"
        >
          <Package :size="12" />
          背包 {{ backpackSummary }}
        </button>
      </div>
    </div>

    <!-- Effect tooltip: teleported to body -->
    <Teleport to="body">
      <div
        v-show="hoveredEffectKey && hoveredTooltipDescription"
        class="status-bar-effect-tooltip-fixed fixed z-100 px-2 py-1.5 rounded-xs bg-panel border border-muted/30 text-xs text-text whitespace-normal shadow-lg pointer-events-none"
        :style="effectTooltipStyle"
      >
        {{ hoveredTooltipDescription }}
      </div>
    </Teleport>
  </section>
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

function openCharInfo() {
  navigateToPanel("charinfo");
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

.status-bar-title {
  font-family: inherit;
}

.status-bar-name {
  font-family: inherit;
}

.status-bar-list {
  min-height: 0;
}

.status-bar-track {
  width: 100%;
}
</style>
