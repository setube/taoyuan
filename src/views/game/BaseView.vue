<template>
  <div class="relative">
    <!-- Developer Mode Toggle (top-right corner) -->
    <button
      v-if="settingsStore.developerMode"
      class="absolute top-2 right-2 px-2 py-1 text-[10px] bg-accent/20 text-accent border border-accent/30 rounded-full hover:bg-accent/30 transition-colors z-10"
      @click="cycleLayout"
    >
      概念{{ currentLayoutNumber }}
    </button>

    <!-- Layout Components -->
    <BaseLayoutConcept1 v-if="currentLayout === 'concept1'" />
    <BaseLayoutConcept2 v-else-if="currentLayout === 'concept2'" />
    <BaseLayoutConcept3 v-else-if="currentLayout === 'concept3'" />
    <BaseLayoutConcept4 v-else />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useSettingsStore } from "@/stores/useSettingsStore";
import BaseLayoutConcept1 from "./BaseLayoutConcept1.vue";
import BaseLayoutConcept2 from "./BaseLayoutConcept2.vue";
import BaseLayoutConcept3 from "./BaseLayoutConcept3.vue";
import BaseLayoutConcept4 from "./BaseLayoutConcept4.vue";

const settingsStore = useSettingsStore();

type LayoutType = "concept1" | "concept2" | "concept3" | "concept4";

const currentLayout = ref<LayoutType>("concept4");

const currentLayoutNumber = computed(() => {
  const layouts: LayoutType[] = [
    "concept1",
    "concept2",
    "concept3",
    "concept4",
  ];
  return layouts.indexOf(currentLayout.value) + 1;
});

onMounted(() => {
  // Load saved layout preference (only in dev mode)
  if (settingsStore.developerMode) {
    const saved = localStorage.getItem("devBaseLayout");
    if (
      saved &&
      ["concept1", "concept2", "concept3", "concept4"].includes(saved)
    ) {
      currentLayout.value = saved as LayoutType;
    }
  } else {
    // Default to Concept 4 (most immersive) in production
    currentLayout.value = "concept4";
  }
});

const cycleLayout = () => {
  const layouts: LayoutType[] = [
    "concept1",
    "concept2",
    "concept3",
    "concept4",
  ];
  const currentIndex = layouts.indexOf(currentLayout.value);
  const nextIndex = (currentIndex + 1) % layouts.length;
  const nextLayout = layouts[nextIndex]!!;
  currentLayout.value = nextLayout;

  // Save preference
  localStorage.setItem("devBaseLayout", currentLayout.value);
};
</script>
