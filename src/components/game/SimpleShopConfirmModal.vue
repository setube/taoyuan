<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black/60 flex items-center justify-center z-60 p-4"
    @click.self="$emit('cancel')"
  >
    <div class="game-panel max-w-xs w-full p-3">
      <p class="text-accent text-xs font-medium mb-1">
        {{ type === "buy" ? "购买" : "出售" }}
      </p>
      <p class="text-sm mb-1">{{ itemName }}</p>
      <p class="text-muted text-xs mb-3">
        {{ type === "buy" ? "花费" : "获得" }} {{ price }}文
      </p>
      <div class="flex gap-2">
        <button
          type="button"
          class="btn text-xs flex-1"
          @click="$emit('cancel')"
        >
          取消
        </button>
        <button
          type="button"
          class="btn text-xs flex-1 bg-accent text-bg"
          @click="$emit('confirm')"
        >
          {{ type === "buy" ? "确认" : "出售" }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  show: boolean;
  type: "buy" | "sell";
  itemName: string;
  price: number;
}>();
defineEmits<{
  confirm: [];
  cancel: [];
}>();
</script>
