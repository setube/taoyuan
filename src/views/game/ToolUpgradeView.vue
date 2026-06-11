<template>
  <div>
    <div class="flex items-center justify-between mb-1">
      <div class="flex items-center space-x-1.5 text-sm text-accent">
        <Wrench :size="14" />
        <span>工具升级</span>
      </div>
      <span class="text-xs text-muted">铁匠·小满</span>
    </div>
    <p class="text-xs text-muted mb-3">当场锻造升级，需锻造等级与小满好感。铁匠铺锻造工坊也可办理。</p>
    <ToolForgePanel />
  </div>
</template>

<script setup lang="ts">
  import { Wrench } from 'lucide-vue-next'
  import ToolForgePanel from '@/components/game/ToolForgePanel.vue'
</script>
