<template>
  <div>
    <p class="text-xs text-muted mb-2">
      当场升级工具，需锻造等级达标（铁 Lv1 / 精钢 Lv6 / 铱金 Lv12）。每次约
      {{ toolStaminaCost }} 体力 / {{ toolTimeLabel }}。
    </p>
    <div class="flex flex-col space-y-1.5">
      <div
        v-for="tool in inventoryStore.tools"
        :key="tool.type"
        class="flex items-center justify-between border border-accent/20 rounded-xs px-3 py-1.5 cursor-pointer hover:bg-accent/5"
        @click="selectedTool = tool.type"
      >
        <div>
          <span class="text-sm">{{ TOOL_NAMES[tool.type] }}</span>
          <p class="text-xs text-muted">{{ TIER_NAMES[tool.tier] }}</p>
        </div>
        <span v-if="forgeStore.getEffectiveToolUpgradeCost(tool.type)" class="text-xs text-accent">
          → {{ TIER_NAMES[forgeStore.getEffectiveToolUpgradeCost(tool.type)!.toTier] }}
        </span>
        <span v-else class="text-xs text-success">满级</span>
      </div>
    </div>

    <Transition name="panel-fade">
      <div
        v-if="selectedTool"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        @click.self="selectedTool = null"
      >
        <div class="game-panel max-w-xs w-full relative">
          <button class="absolute top-2 right-2 text-muted hover:text-text" @click="selectedTool = null">
            <X :size="14" />
          </button>
          <p class="text-sm mb-2">{{ TOOL_NAMES[selectedTool] }}</p>

          <template v-if="effectiveCost">
            <div class="border border-accent/10 rounded-xs p-2 mb-2 text-xs space-y-1">
              <div class="flex justify-between">
                <span class="text-muted">目标</span>
                <span>{{ TIER_NAMES[effectiveCost.toTier] }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted">锻造等级</span>
                <span :class="forgingLevel >= effectiveCost.requiredForgingLevel ? '' : 'text-danger'">
                  需 Lv{{ effectiveCost.requiredForgingLevel }}（当前 {{ forgingLevel }}）
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted">铜钱</span>
                <span>{{ effectiveCost.money }}文</span>
              </div>
              <div v-for="mat in effectiveCost.materials" :key="mat.itemId" class="flex justify-between">
                <span class="text-muted">{{ getItemById(mat.itemId)?.name ?? mat.itemId }}</span>
                <span>×{{ mat.quantity }}</span>
              </div>
              <div v-if="friendshipReq" class="flex justify-between">
                <span class="text-muted">小满好感</span>
                <span :class="friendshipOk ? '' : 'text-danger'">{{ LEVEL_NAMES[friendshipReq] }}</span>
              </div>
            </div>
            <p v-if="blockReason" class="text-xs text-danger mb-2">{{ blockReason }}</p>
            <Button class="w-full text-xs" :disabled="!!blockReason" @click="doUpgrade">当场升级</Button>
          </template>
          <p v-else class="text-xs text-success text-center py-4">已满级</p>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { X } from 'lucide-vue-next'
  import Button from '@/components/game/Button.vue'
  import { useInventoryStore } from '@/stores/useInventoryStore'
  import { useForgeStore } from '@/stores/useForgeStore'
  import { useSkillStore } from '@/stores/useSkillStore'
  import { useNpcStore } from '@/stores/useNpcStore'
  import { usePlayerStore } from '@/stores/usePlayerStore'
  import { useGameStore } from '@/stores/useGameStore'
  import { TOOL_NAMES, TIER_NAMES } from '@/data/upgrades'
  import { getItemById } from '@/data/items'
  import { getCombinedItemCount } from '@/composables/useCombinedInventory'
  import { addLog, showFloat } from '@/composables/useGameLog'
  import {
    getForgeToolUpgradeStamina,
    getForgeToolUpgradeTimeHours
  } from '@/composables/forgeCosts'
  import { handleEndDay } from '@/composables/useEndDay'
  import type { ToolType, ToolTier, FriendshipLevel } from '@/types'

  const TIER_FRIENDSHIP_REQ: Partial<Record<ToolTier, FriendshipLevel>> = {
    iron: 'acquaintance',
    steel: 'friendly',
    iridium: 'bestFriend'
  }

  const LEVEL_ORDER: FriendshipLevel[] = ['stranger', 'acquaintance', 'friendly', 'bestFriend']
  const LEVEL_NAMES: Record<FriendshipLevel, string> = {
    stranger: '陌生',
    acquaintance: '相识',
    friendly: '熟识',
    bestFriend: '挚友'
  }

  const inventoryStore = useInventoryStore()
  const forgeStore = useForgeStore()
  const skillStore = useSkillStore()
  const npcStore = useNpcStore()
  const playerStore = usePlayerStore()
  const gameStore = useGameStore()

  const selectedTool = ref<ToolType | null>(null)
  const forgingLevel = computed(() => skillStore.getSkill('forging').level)
  const toolStaminaCost = computed(() => getForgeToolUpgradeStamina(forgingLevel.value))
  const toolTimeLabel = computed(() => {
    const h = getForgeToolUpgradeTimeHours(forgingLevel.value)
    const mins = Math.round(h * 60)
    return mins >= 60 ? `${h.toFixed(1)} 游戏小时` : `${mins} 分钟`
  })

  const effectiveCost = computed(() =>
    selectedTool.value ? forgeStore.getEffectiveToolUpgradeCost(selectedTool.value) : null
  )

  const friendshipReq = computed(() =>
    effectiveCost.value ? TIER_FRIENDSHIP_REQ[effectiveCost.value.toTier] : null
  )

  const friendshipOk = computed(() => {
    if (!friendshipReq.value) return true
    const cur = npcStore.getFriendshipLevel('xiao_man')
    return LEVEL_ORDER.indexOf(cur) >= LEVEL_ORDER.indexOf(friendshipReq.value)
  })

  const blockReason = computed(() => {
    if (!selectedTool.value || !effectiveCost.value) return ''
    if (forgingLevel.value < effectiveCost.value.requiredForgingLevel) {
      return `需要锻造 Lv${effectiveCost.value.requiredForgingLevel}`
    }
    if (!friendshipOk.value) return `需要小满好感「${LEVEL_NAMES[friendshipReq.value!]}」`
    if (playerStore.money < effectiveCost.value.money) return '铜钱不足'
    if (playerStore.stamina < toolStaminaCost.value) return `体力不足（需 ${toolStaminaCost.value}）`
    for (const mat of effectiveCost.value.materials) {
      if (getCombinedItemCount(mat.itemId) < mat.quantity) {
        return `${getItemById(mat.itemId)?.name ?? mat.itemId}不足`
      }
    }
    return ''
  })

  const doUpgrade = () => {
    if (!selectedTool.value || blockReason.value) return
    if (gameStore.isPastBedtime) {
      addLog('太晚了，没力气升级工具了。')
      handleEndDay()
      return
    }
    if (!playerStore.consumeStamina(toolStaminaCost.value)) {
      addLog(`体力不足，升级需要 ${toolStaminaCost.value} 点体力。`)
      return
    }
    const res = forgeStore.upgradeTool(selectedTool.value)
    if (res.ok) {
      addLog(res.message ?? '工具升级完成。')
      showFloat('升级完成', 'success')
      selectedTool.value = null
      const tr = gameStore.advanceTime(getForgeToolUpgradeTimeHours(forgingLevel.value))
      if (tr.message) addLog(tr.message)
      if (tr.passedOut) handleEndDay()
    } else if (res.reason === 'skill_level') {
      addLog('锻造等级不足。')
    } else {
      addLog('升级失败。')
    }
  }
</script>
