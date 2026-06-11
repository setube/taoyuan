<script setup lang="ts">
  import { type Component } from 'vue'

  withDefaults(
    defineProps<{
      icon?: Component
      iconSize?: number
    }>(),
    { iconSize: 14 }
  )
</script>

<template>
  <button type="button" class="btn text-xs">
    <component v-if="icon" :is="icon" :size="iconSize" />
    <span v-if="$slots.default">
      <slot />
    </span>
  </button>
</template>
