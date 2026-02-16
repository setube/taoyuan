<template>
  <div class="flex flex-wrap gap-1.5">
    <button
      v-for="npc in npcs"
      :key="npc.id"
      type="button"
      class="location-npc-chip btn text-xs px-2.5 py-1.5 rounded-full bg-panel border border-muted/30 text-muted hover:border-accent/40 hover:text-accent"
      @click="emit('interact', npc)"
    >
      {{ npc.name }}{{ chipSuffix }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { SurvivalNpcDef } from "@/data/survivalNpcs";

withDefaults(
  defineProps<{
    npcs: SurvivalNpcDef[];
    chipSuffix?: string;
  }>(),
  { chipSuffix: " · 交谈" },
);

const emit = defineEmits<{
  interact: [npc: SurvivalNpcDef];
}>();
</script>
