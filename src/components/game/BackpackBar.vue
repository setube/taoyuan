<template>
  <section
    class="backpack-bar flex flex-col rounded-xs bg-panel border border-muted/30 overflow-hidden min-h-0 flex-1"
  >
    <button
      type="button"
      class="backpack-bar-title w-full text-left px-1.5 py-1 text-xs font-medium text-accent hover:bg-accent/10 transition-colors cursor-pointer border-0 bg-transparent shrink-0"
      @click="openBackpack"
    >
      背包
    </button>
    <div
      class="backpack-bar-list border-t border-muted/25 px-1.5 pb-1.5 pt-1.5 flex flex-col gap-0.5 min-h-0 overflow-y-auto flex-1"
    >
      <template v-if="inventoryStore.items.length > 0">
        <div
          v-for="(item, idx) in inventoryStore.items"
          :key="idx"
          class="text-[10px] flex items-center justify-between gap-1 truncate"
          :class="{
            'text-quality-fine': item.quality === 'fine',
            'text-quality-excellent': item.quality === 'excellent',
            'text-quality-supreme': item.quality === 'supreme',
          }"
        >
          <span class="truncate min-w-0">{{
            getItemById(item.itemId)?.name ?? item.itemId
          }}</span>
          <span class="text-muted shrink-0 tabular-nums"
            >×{{ item.quantity }}</span
          >
        </div>
      </template>
      <p v-else class="text-[10px] text-muted/70">（空）</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useInventoryStore } from "@/stores";
import { getItemById } from "@/data";
import { navigateToPanel } from "@/composables/useNavigation";

const inventoryStore = useInventoryStore();

function openBackpack() {
  navigateToPanel("inventory");
}
</script>

<style scoped>
.backpack-bar-title {
  font-family: inherit;
}

.backpack-bar-list {
  min-height: 0;
}
</style>
