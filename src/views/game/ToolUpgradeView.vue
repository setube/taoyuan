<template>
  <div>
    <!-- 标题 -->
    <div class="flex items-center justify-between mb-1">
      <div class="flex items-center space-x-1.5 text-sm text-accent">
        <Wrench :size="14" />
        <span>工具升级</span>
      </div>
      <span class="text-xs text-muted">铁匠·小满</span>
    </div>
    <p class="text-xs text-muted mb-3">消耗金属锭和铜钱升级工具，需等待2天。</p>

    <!-- 正在升级提示 -->
    <div v-if="inventoryStore.pendingUpgrade" class="border border-accent/30 rounded-xs px-3 py-2 mb-3 flex items-center justify-between">
      <div class="flex items-center space-x-1.5">
        <Clock :size="12" class="text-accent shrink-0" />
        <span class="text-xs text-accent">
          锻造中「{{ TOOL_NAMES[inventoryStore.pendingUpgrade.toolType] }}」→ {{ TIER_NAMES[inventoryStore.pendingUpgrade.targetTier] }}
        </span>
      </div>
      <span class="text-xs text-muted whitespace-nowrap ml-2">剩{{ inventoryStore.pendingUpgrade.daysRemaining }}天</span>
    </div>

    <div class="flex flex-col space-y-1.5">
      <div
        v-for="tool in inventoryStore.tools"
        :key="tool.type"
        class="flex items-center justify-between border rounded-xs px-3 py-1.5 cursor-pointer hover:bg-accent/5"
        :class="isUpgrading(tool.type) ? 'border-accent/30' : 'border-accent/20'"
        @click="selectedTool = tool.type"
      >
        <div class="min-w-0">
          <span class="text-sm" :class="isUpgrading(tool.type) ? 'text-accent' : ''">{{ TOOL_NAMES[tool.type] }}</span>
          <p class="text-xs text-muted">{{ TIER_NAMES[tool.tier] }}</p>
        </div>
        <span v-if="isUpgrading(tool.type)" class="text-xs text-accent whitespace-nowrap ml-2">锻造中</span>
        <span v-else-if="getUpgradeCost(tool.type, tool.tier)" class="text-xs text-muted whitespace-nowrap ml-2">
          → {{ TIER_NAMES[getUpgradeCost(tool.type, tool.tier)!.toTier] }}
        </span>
        <CircleCheck v-else :size="14" class="text-success shrink-0 ml-2" />
      </div>
    </div>

    <!-- 工具详情弹窗 -->
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

          <p class="text-sm mb-2" :class="isUpgrading(selectedTool) ? 'text-accent' : 'text-text'">
            {{ TOOL_NAMES[selectedTool] }}
          </p>

          <!-- 当前状态 -->
          <div class="border border-accent/10 rounded-xs p-2 mb-2">
            <div class="flex items-center justify-between">
              <span class="text-xs text-muted">当前等级</span>
              <span class="text-xs">{{ TIER_NAMES[selectedToolObj!.tier] }}</span>
            </div>
            <div class="flex items-center justify-between mt-0.5">
              <span class="text-xs text-muted">体力减免</span>
              <span class="text-xs">{{ staminaText(selectedToolObj!.tier) }}</span>
            </div>
            <template v-if="selectedTool === 'fishingRod'">
              <div class="flex items-center justify-between mt-0.5">
                <span class="text-xs text-muted">钩子范围</span>
                <span class="text-xs">{{ ROD_HOOK[selectedToolObj!.tier] }}</span>
              </div>
              <div class="flex items-center justify-between mt-0.5">
                <span class="text-xs text-muted">钓鱼时限</span>
                <span class="text-xs">{{ ROD_TIME[selectedToolObj!.tier] }}秒</span>
              </div>
            </template>
            <div v-if="isUpgrading(selectedTool)" class="flex items-center justify-between mt-1">
              <span class="text-xs text-muted">锻造目标</span>
              <span class="text-xs text-accent">{{ TIER_NAMES[inventoryStore.pendingUpgrade!.targetTier] }}</span>
            </div>
            <div v-if="isUpgrading(selectedTool)" class="flex items-center space-x-2 mt-1.5">
              <span class="text-xs text-muted shrink-0">进度</span>
              <div class="flex-1 h-1 bg-bg rounded-xs border border-accent/10">
                <div
                  class="h-full rounded-xs bg-accent transition-all"
                  :style="{ width: ((2 - inventoryStore.pendingUpgrade!.daysRemaining) / 2) * 100 + '%' }"
                />
              </div>
              <span class="text-xs text-muted whitespace-nowrap">{{ 2 - inventoryStore.pendingUpgrade!.daysRemaining }}/2天</span>
            </div>
          </div>

          <!-- 升级信息 -->
          <template v-if="!isUpgrading(selectedTool) && selectedUpgradeCost">
            <div class="border border-accent/10 rounded-xs p-2 mb-2">
              <p class="text-xs text-muted mb-1">升级至 {{ TIER_NAMES[selectedUpgradeCost.toTier] }}</p>
              <div class="flex items-center justify-between">
                <span class="text-xs text-muted">铜钱</span>
                <span class="text-xs" :class="playerStore.money >= selectedUpgradeCost.money ? '' : 'text-danger'">
                  {{ selectedUpgradeCost.money }}文
                </span>
              </div>
              <div v-for="mat in selectedUpgradeCost.materials" :key="mat.itemId" class="flex items-center justify-between mt-0.5">
                <span class="text-xs text-muted">{{ getItemById(mat.itemId)?.name ?? mat.itemId }}</span>
                <CombinedMaterialCount :item-id="mat.itemId" :required="mat.quantity" always-show-breakdown />
              </div>
              <template v-if="selectedFriendshipReq">
                <div class="flex items-center justify-between mt-0.5">
                  <span class="text-xs text-muted">小满好感</span>
                  <span
                    class="text-xs"
                    :class="meetsLevel(npcStore.getFriendshipLevel('xiao_man'), selectedFriendshipReq) ? '' : 'text-danger'"
                  >
                    {{ LEVEL_NAMES[npcStore.getFriendshipLevel('xiao_man')] }} / {{ LEVEL_NAMES[selectedFriendshipReq] }}
                  </span>
                </div>
              </template>
            </div>

            <!-- 升级效果预览 -->
            <div class="border border-success/20 rounded-xs p-2 mb-2">
              <p class="text-xs text-muted mb-1">升级效果</p>
              <div class="flex items-center justify-between">
                <span class="text-xs text-muted">体力减免</span>
                <span class="text-xs">
                  {{ staminaText(selectedToolObj!.tier) }} →
                  <span class="text-success">{{ staminaText(selectedUpgradeCost.toTier) }}</span>
                </span>
              </div>
              <template v-if="selectedTool === 'fishingRod'">
                <div class="flex items-center justify-between mt-0.5">
                  <span class="text-xs text-muted">钩子范围</span>
                  <span class="text-xs">
                    {{ ROD_HOOK[selectedToolObj!.tier] }} →
                    <span class="text-success">{{ ROD_HOOK[selectedUpgradeCost.toTier] }}</span>
                  </span>
                </div>
                <div class="flex items-center justify-between mt-0.5">
                  <span class="text-xs text-muted">钓鱼时限</span>
                  <span class="text-xs">
                    {{ ROD_TIME[selectedToolObj!.tier] }}秒 →
                    <span class="text-success">{{ ROD_TIME[selectedUpgradeCost.toTier] }}秒</span>
                  </span>
                </div>
              </template>
            </div>

            <p v-if="getUpgradeBlockReason(selectedTool)" class="text-xs text-danger mb-2">
              {{ getUpgradeBlockReason(selectedTool) }}
            </p>

            <button
              class="btn text-xs w-full justify-center"
              :class="{ '!bg-accent !text-bg': canUpgrade(selectedTool) }"
              :disabled="!canUpgrade(selectedTool)"
              @click="handleUpgradeAndClose(selectedTool)"
            >
              <ArrowUp :size="12" />
              升级 {{ selectedUpgradeCost.money }}文
            </button>
          </template>

          <!-- 满级 -->
          <div v-else-if="!isUpgrading(selectedTool)" class="border border-success/30 rounded-xs p-2">
            <div class="flex items-center justify-center space-x-1">
              <CircleCheck :size="12" class="text-success" />
              <span class="text-xs text-success">已达到最高等级</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { ArrowUp, Wrench, Clock, CircleCheck, X } from 'lucide-vue-next'
  import { useGameStore } from '@/stores/useGameStore'
  import { useInventoryStore } from '@/stores/useInventoryStore'
  import { useNpcStore } from '@/stores/useNpcStore'
  import { usePlayerStore } from '@/stores/usePlayerStore'
  import { getCombinedItemCount, removeCombinedItem } from '@/composables/useCombinedInventory'
  import CombinedMaterialCount from '@/components/game/CombinedMaterialCount.vue'
  import { getUpgradeCost, TOOL_NAMES, TIER_NAMES, getItemById } from '@/data'
  import { ACTION_TIME_COSTS } from '@/data/timeConstants'
  import { addLog } from '@/composables/useGameLog'
  import { handleEndDay } from '@/composables/useEndDay'
  import type { ToolType, ToolTier, FriendshipLevel } from '@/types'

  /** 升级目标等级 → 所需小满好感 */
  const TIER_FRIENDSHIP_REQ: Partial<Record<ToolTier, FriendshipLevel>> = {
    iron: 'acquaintance',
    steel: 'friendly',
    iridium: 'bestFriend'
  }

  /** 各等级体力消耗倍率（与 useInventoryStore 一致） */
  const STAMINA_MULTIPLIERS: Record<ToolTier, number> = { basic: 1.0, iron: 0.8, steel: 0.6, iridium: 0.4 }
  const ROD_HOOK: Record<ToolTier, number> = { basic: 40, iron: 45, steel: 50, iridium: 60 }
  const ROD_TIME: Record<ToolTier, number> = { basic: 30, iron: 33, steel: 36, iridium: 40 }

  const staminaText = (tier: ToolTier): string => {
    const r = Math.round((1 - STAMINA_MULTIPLIERS[tier]) * 100)
    return r > 0 ? `-${r}%` : '无加成'
  }
  const LEVEL_ORDER: FriendshipLevel[] = ['stranger', 'acquaintance', 'friendly', 'bestFriend']
  const LEVEL_NAMES: Record<FriendshipLevel, string> = {
    stranger: '陌生',
    acquaintance: '相识',
    friendly: '熟识',
    bestFriend: '挚友'
  }
  const meetsLevel = (current: FriendshipLevel, required: FriendshipLevel): boolean =>
    LEVEL_ORDER.indexOf(current) >= LEVEL_ORDER.indexOf(required)

  const inventoryStore = useInventoryStore()
  const playerStore = usePlayerStore()
  const npcStore = useNpcStore()
  const gameStore = useGameStore()

  // === 弹窗状态 ===

  const selectedTool = ref<ToolType | null>(null)

  const selectedToolObj = computed(() => {
    if (!selectedTool.value) return null
    return inventoryStore.getTool(selectedTool.value) ?? null
  })

  const selectedUpgradeCost = computed(() => {
    if (!selectedToolObj.value) return null
    return getUpgradeCost(selectedToolObj.value.type, selectedToolObj.value.tier) ?? null
  })

  const selectedFriendshipReq = computed(() => {
    if (!selectedUpgradeCost.value) return null
    return TIER_FRIENDSHIP_REQ[selectedUpgradeCost.value.toTier] ?? null
  })

  /** 该工具是否正在升级中 */
  const isUpgrading = (type: ToolType): boolean => {
    return inventoryStore.pendingUpgrade?.toolType === type
  }

  const canUpgrade = (type: ToolType): boolean => {
    // 已有工具在升级中，不能再升级
    if (inventoryStore.pendingUpgrade) return false

    const tool = inventoryStore.getTool(type)
    if (!tool) return false
    const cost = getUpgradeCost(type, tool.tier)
    if (!cost) return false

    const requiredLevel = TIER_FRIENDSHIP_REQ[cost.toTier]
    if (requiredLevel && !meetsLevel(npcStore.getFriendshipLevel('xiao_man'), requiredLevel)) return false

    if (playerStore.money < cost.money) return false
    for (const mat of cost.materials) {
      if (getCombinedItemCount(mat.itemId) < mat.quantity) return false
    }
    return true
  }

  /** 返回升级被阻止的原因（用于 UI 提示），可升级时返回空字符串 */
  const getUpgradeBlockReason = (type: ToolType): string => {
    if (inventoryStore.pendingUpgrade) return '小满正在锻造其他工具'

    const tool = inventoryStore.getTool(type)
    if (!tool) return ''
    const cost = getUpgradeCost(type, tool.tier)
    if (!cost) return ''

    const requiredLevel = TIER_FRIENDSHIP_REQ[cost.toTier]
    if (requiredLevel && !meetsLevel(npcStore.getFriendshipLevel('xiao_man'), requiredLevel)) {
      return `需要小满好感达到「${LEVEL_NAMES[requiredLevel]}」`
    }

    if (playerStore.money < cost.money) return '铜钱不足'
    for (const mat of cost.materials) {
      if (getCombinedItemCount(mat.itemId) < mat.quantity) {
        const itemName = getItemById(mat.itemId)?.name ?? mat.itemId
        return `${itemName}不足（${getCombinedItemCount(mat.itemId)}/${mat.quantity}）`
      }
    }
    return ''
  }

  const handleUpgradeAndClose = (type: ToolType) => {
    const tool = inventoryStore.getTool(type)
    if (!tool) return
    const cost = getUpgradeCost(type, tool.tier)
    if (!cost) return
    if (!canUpgrade(type)) {
      addLog('条件不足，无法升级。')
      return
    }

    playerStore.spendMoney(cost.money)
    for (const mat of cost.materials) {
      removeCombinedItem(mat.itemId, mat.quantity)
    }
    inventoryStore.startUpgrade(type, cost.toTier)

    addLog(`你把${TOOL_NAMES[type]}和材料交给了小满，${cost.money}文。2天后可以取回升级后的工具。`)
    selectedTool.value = null
    const tr = gameStore.advanceTime(ACTION_TIME_COSTS.toolUpgrade)
    if (tr.message) addLog(tr.message)
    if (tr.passedOut) {
      handleEndDay()
      return
    }
  }
</script>
