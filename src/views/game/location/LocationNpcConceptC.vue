<template>
  <div class="flex flex-wrap gap-1.5">
    <button
      v-for="npc in npcs"
      :key="npc.id"
      type="button"
      class="location-npc-chip btn text-xs px-2.5 py-1.5 rounded-full bg-panel border border-muted/30 text-muted hover:border-accent/40 hover:text-accent"
      @click="emit('interact', npc)"
    >
      {{ npc.name }} · 交谈
    </button>
  </div>
</template>

<script setup lang="ts">
import type { SurvivalNpcDef } from "@/data/survivalNpcs";

defineProps<{
  npcs: SurvivalNpcDef[];
}>();

const emit = defineEmits<{
  interact: [npc: SurvivalNpcDef];
}>();
</script>
