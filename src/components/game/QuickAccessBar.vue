<template>
  <div
    class="quick-access-bar flex flex-col gap-1 border-l border-accent/30 pl-2 py-2"
  >
    <p class="text-accent text-xs text-center mb-1 tracking-widest">导航</p>
    <button
      v-for="t in TABS"
      :key="t.key"
      class="quick-access-btn"
      :class="{ 'quick-access-btn-active': currentPanel === t.key }"
      :title="t.label"
      @click="go(t.key)"
    >
      <component :is="t.icon" :size="18" class="shrink-0" />
    </button>
    <button
      class="quick-access-btn mt-2"
      title="设置"
      @click="$emit('open-settings')"
    >
      <SettingsIcon :size="18" class="shrink-0" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { Settings as SettingsIcon } from "lucide-vue-next";
import { TABS, navigateToPanel } from "@/composables/useNavigation";
import type { PanelKey } from "@/composables/useNavigation";

const route = useRoute();

defineEmits<{ "open-settings": [] }>();

const currentPanel = computed(() => (route.name as string) ?? "base");

const go = (key: PanelKey) => {
  navigateToPanel(key);
};
</script>

<style scoped>
.quick-access-bar {
  width: 72px;
  min-width: 72px;
}

.quick-access-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px 4px;
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

.quick-access-btn:hover,
.quick-access-btn:active {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: var(--color-bg);
}

.quick-access-btn-active {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: var(--color-bg);
}
</style>
