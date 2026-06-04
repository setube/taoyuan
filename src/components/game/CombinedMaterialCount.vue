<template>
  <span class="inline-flex flex-col items-end leading-tight">
    <span :class="[textClass, sufficient ? '' : 'text-danger']">
      {{ stock.total }}<template v-if="required !== undefined">/{{ required }}</template>
    </span>
    <span v-if="showDetail" class="text-[10px] text-muted whitespace-nowrap">背包{{ stock.inventory }}<template v-if="stock.warehouse > 0"> · 仓{{ stock.warehouse }}</template></span>
  </span>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { getMaterialStockBreakdown } from '@/composables/useCombinedInventory'
  import { useWarehouseStore } from '@/stores/useWarehouseStore'

  const props = withDefaults(
    defineProps<{
      itemId: string
      required?: number
      textClass?: string
      /** 未解锁仓库时不显示明细 */
      alwaysShowBreakdown?: boolean
    }>(),
    {
      textClass: 'text-xs',
      alwaysShowBreakdown: false
    }
  )

  const warehouseStore = useWarehouseStore()
  const stock = computed(() => getMaterialStockBreakdown(props.itemId))
  const sufficient = computed(() => (props.required === undefined ? true : stock.value.total >= props.required))
  const showDetail = computed(
    () =>
      props.alwaysShowBreakdown ||
      (warehouseStore.unlocked && (stock.value.warehouse > 0 || props.required !== undefined))
  )
</script>
