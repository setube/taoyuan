<template>
  <div>
    <div class="flex items-center justify-between mb-1">
      <div class="flex items-center space-x-1.5 text-sm text-accent">
        <Handshake :size="14" />
        <span>商会</span>
      </div>
      <span class="text-xs text-muted">
        积分
        <span class="text-accent">{{ tradeStore.points }}</span>
      </span>
    </div>

    <!-- 标签页 -->
    <div class="flex space-x-1 mb-3">
      <Button class="flex-1 justify-center" :class="{ '!bg-accent !text-bg': tab === 'orders' }" @click="tab = 'orders'">订单</Button>
      <Button class="flex-1 justify-center" :class="{ '!bg-accent !text-bg': tab === 'rewards' }" @click="tab = 'rewards'">兑换</Button>
    </div>

    <!-- 订单 -->
    <template v-if="tab === 'orders'">
      <div v-if="orderCards.length === 0" class="flex flex-col items-center justify-center py-8 text-muted">
        <Handshake :size="32" class="text-accent/30" />
        <p class="text-xs mt-2">暂无订单</p>
      </div>
      <div v-else class="flex flex-col space-y-1.5">
        <div
          v-for="order in orderCards"
          :key="order.id"
          class="flex items-center justify-between border rounded-xs px-3 py-2"
          :class="order.delivered ? 'border-success/30' : order.deliverable ? 'border-success/50 bg-success/5' : 'border-accent/20'"
        >
          <div class="flex-1 min-w-0">
            <span v-if="order.kind === 'weekly'" class="inline-block text-[10px] text-accent border border-accent/30 rounded-xs px-1 mb-1">
              周单
            </span>
            <div v-for="line in order.lines" :key="line.itemId" class="flex items-center justify-between">
              <span class="text-xs truncate" :class="{ 'text-muted': order.delivered }">{{ line.name }} ×{{ line.quantity }}</span>
              <span v-if="!order.delivered" class="text-[10px] ml-2 shrink-0" :class="line.enough ? 'text-success' : 'text-muted'">
                持有 {{ line.held }}
              </span>
            </div>
          </div>
          <div class="flex flex-col items-end ml-3 shrink-0">
            <span class="text-xs text-accent">{{ order.points }} 积分</span>
            <span v-if="order.delivered" class="text-xs text-success mt-1">已交付</span>
            <Button
              v-else
              class="btn-compact mt-1"
              :class="{ '!bg-accent !text-bg': order.deliverable }"
              :icon="PackageCheck"
              :icon-size="12"
              :disabled="!order.deliverable"
              @click="handleDeliver(order.id)"
            >
              交付
            </Button>
          </div>
        </div>
      </div>
    </template>

    <!-- 兑换 -->
    <div v-else class="flex flex-col space-y-1.5">
      <div
        v-for="reward in rewardCards"
        :key="reward.itemId"
        class="flex items-center justify-between border border-accent/20 rounded-xs px-3 py-2"
        :title="reward.description"
      >
        <div class="flex-1 min-w-0">
          <p class="text-xs truncate">{{ reward.name }}</p>
          <p v-if="reward.limitLabel" class="text-[10px]" :class="reward.remaining > 0 ? 'text-muted' : 'text-danger'">
            {{ reward.limitLabel }}
          </p>
        </div>
        <div class="flex flex-col items-end ml-3 shrink-0">
          <span class="text-xs" :class="reward.affordable ? 'text-accent' : 'text-danger'">{{ reward.cost }} 积分</span>
          <Button class="btn-compact mt-1" :icon="Gift" :icon-size="12" :disabled="!reward.redeemable" @click="handleRedeem(reward.itemId)">
            兑换
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import { Gift, Handshake, PackageCheck } from 'lucide-vue-next'
  import Button from '@/components/game/Button.vue'
  import { useTradeStore } from '@/stores/useTradeStore'
  import { useGameStore } from '@/stores/useGameStore'
  import { getItemById } from '@/data/items'
  import { TRADE_REWARDS } from '@/data/trade'
  import { showFloat } from '@/composables/useGameLog'
  import { sfxBuy, sfxCoin } from '@/composables/useAudio'
  import { getCombinedItemCount } from '@/composables/useCombinedInventory'
  import type { TradeOrder, TradeOrderKind, TradeRewardDef } from '@/types'

  type Tab = 'orders' | 'rewards'

  interface OrderLineView {
    itemId: string
    name: string
    quantity: number
    held: number
    enough: boolean
  }

  interface OrderCardView {
    id: string
    kind: TradeOrderKind
    points: number
    delivered: boolean
    deliverable: boolean
    lines: OrderLineView[]
  }

  interface RewardCardView {
    itemId: string
    name: string
    description: string
    cost: number
    limitLabel: string
    remaining: number
    affordable: boolean
    redeemable: boolean
  }

  const tradeStore = useTradeStore()
  const gameStore = useGameStore()

  const tab = ref<Tab>('orders')

  // 进面板时、以及停留期间换日时刷新订单
  watch(
    () => [gameStore.year, gameStore.season, gameStore.day],
    () => tradeStore.refreshOrders(),
    { immediate: true }
  )

  const getItemName = (itemId: string): string => getItemById(itemId)?.name ?? itemId

  const toOrderCard = (order: TradeOrder): OrderCardView => ({
    id: order.id,
    kind: order.kind,
    points: order.points,
    delivered: order.delivered,
    deliverable: tradeStore.canDeliver(order),
    lines: order.lines.map(line => {
      const held = getCombinedItemCount(line.itemId)
      return { itemId: line.itemId, name: getItemName(line.itemId), quantity: line.quantity, held, enough: held >= line.quantity }
    })
  })

  const orderCards = computed<OrderCardView[]>(() => {
    const orders = tradeStore.weeklyOrder ? [...tradeStore.dailyOrders, tradeStore.weeklyOrder] : tradeStore.dailyOrders
    return orders.map(toOrderCard)
  })

  /** 限兑标签：本周 剩余/上限 或 限 剩余/上限 */
  const formatLimit = (reward: TradeRewardDef): string => {
    if (reward.weeklyLimit !== undefined) return `本周 ${tradeStore.getWeeklyRemaining(reward)}/${reward.weeklyLimit}`
    if (reward.totalLimit !== undefined) return `限 ${tradeStore.getTotalRemaining(reward)}/${reward.totalLimit}`
    return ''
  }

  const rewardCards = computed<RewardCardView[]>(() =>
    TRADE_REWARDS.map(reward => ({
      itemId: reward.itemId,
      name: getItemName(reward.itemId),
      description: getItemById(reward.itemId)?.description ?? '',
      cost: reward.cost,
      limitLabel: formatLimit(reward),
      remaining: Math.min(tradeStore.getWeeklyRemaining(reward), tradeStore.getTotalRemaining(reward)),
      affordable: tradeStore.points >= reward.cost,
      redeemable: tradeStore.canRedeem(reward)
    }))
  )

  const handleDeliver = (orderId: string) => {
    const result = tradeStore.deliverOrder(orderId)
    if (result.success) sfxCoin()
    else showFloat(result.message, 'danger')
  }

  const handleRedeem = (itemId: string) => {
    const result = tradeStore.redeem(itemId)
    if (result.success) sfxBuy()
    else showFloat(result.message, 'danger')
  }
</script>
