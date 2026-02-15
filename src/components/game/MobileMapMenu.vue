<template>
  <Transition name="panel-fade">
    <div
      v-if="open"
      class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-3"
      @click.self="$emit('close')"
    >
      <div
        class="map-container game-panel w-full max-w-sm md:max-w-150 max-h-[85vh] overflow-y-auto relative"
      >
        <button
          class="absolute top-4 right-4 px-2 py-1 text-xs transition-colors hover:border-accent/60 hover:bg-panel/80 text-muted border border-accent/20"
          @click="$emit('close')"
        >
          <X :size="14" />
        </button>
        <p class="text-accent text-sm text-center mb-3 tracking-widest">
          末日生存 · 导航
        </p>

        <div class="map-area">
          <p class="map-area-title">地点</p>
          <div class="map-area-grid">
            <button
              v-for="t in mainGroup"
              :key="t.key"
              class="map-loc"
              :class="{ 'map-loc-active': current === t.key }"
              @click="go(t.key)"
            >
              <component :is="t.icon" :size="18" />
              <span>{{ t.label }}</span>
            </button>
          </div>
        </div>

        <div class="map-path">···</div>

        <div class="map-area">
          <p class="map-area-title">随身</p>
          <div class="map-area-grid">
            <button
              v-for="t in personalGroup"
              :key="t.key"
              class="map-loc"
              :class="{ 'map-loc-active': current === t.key }"
              @click="go(t.key)"
            >
              <component :is="t.icon" :size="18" />
              <span>{{ t.label }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { X } from "lucide-vue-next";
import { TABS, navigateToPanel } from "@/composables/useNavigation";
import type { PanelKey } from "@/composables/useNavigation";

defineProps<{ open: boolean; current: string }>();
const emit = defineEmits<{ close: [] }>();

const tabMap = computed(() => {
  const m = new Map<string, (typeof TABS)[number]>();
  for (const t of TABS) m.set(t.key, t);
  return m;
});

const pick = (keys: PanelKey[]) =>
  keys.map((k) => tabMap.value.get(k)!).filter(Boolean);

const mainGroup = computed(() => pick(["base", "map"]));
const personalGroup = computed(() =>
  pick(["charinfo", "inventory", "skills", "quest"]),
);

const go = (key: PanelKey) => {
  navigateToPanel(key);
  emit("close");
};
</script>

<style scoped>
/* 地图菜单 */
.map-area {
  border: 1px dashed oklch(from var(--color-accent) l c h / 0.3);
  border-radius: 2px;
  padding: 8px;
}

.map-area-title {
  font-size: 10px;
  color: var(--color-muted);
  margin-bottom: 6px;
  letter-spacing: 0.1em;
  text-align: center;
}

.map-area-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
}

.map-loc {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px 8px;
  min-width: 52px;
  font-family: var(--font-game);
  font-size: 10px;
  color: var(--color-text);
  background: var(--color-bg);
  border: 1px solid oklch(from var(--color-accent) l c h / 0.2);
  border-radius: 2px;
  cursor: pointer;
  transition:
    background-color 0.15s,
    border-color 0.15s,
    color 0.15s;
}

.map-loc:hover,
.map-loc:active {
  background: var(--color-accent);
  border-color: var(--color-accent);
}

.map-loc-active {
  background: var(--color-accent);
  border-color: var(--color-accent);
}

.map-path {
  text-align: center;
  color: oklch(from var(--color-accent) l c h / 0.3);
  font-size: 10px;
  line-height: 1;
  padding: 4px 0;
  letter-spacing: 0.3em;
}
</style>
