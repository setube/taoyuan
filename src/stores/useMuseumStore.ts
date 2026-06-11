import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { MUSEUM_ITEMS, MUSEUM_MILESTONES } from '@/data/museum'
import { useInventoryStore } from './useInventoryStore'
import { usePlayerStore } from './usePlayerStore'
import { useSystemStore } from './useSystemStore'

export const useMuseumStore = defineStore('museum', () => {
  /** 已捐赠物品ID集合 */
  const donatedItems = ref<string[]>([])

  /** 已领取的里程碑count值集合 */
  const claimedMilestones = ref<number[]>([])

  /** 已捐赠数量 */
  const donatedCount = computed(() => donatedItems.value.length)

  /** 总物品数 */
  const totalCount = computed(() => MUSEUM_ITEMS.length)

  /** 是否已捐赠 */
  const isDonated = (itemId: string): boolean => {
    return donatedItems.value.includes(itemId)
  }

  /** 是否可捐赠（背包中有且未捐赠过） */
  const canDonate = (itemId: string): boolean => {
    if (isDonated(itemId)) return false
    if (!MUSEUM_ITEMS.find(m => m.id === itemId)) return false
    const inventoryStore = useInventoryStore()
    return inventoryStore.hasItem(itemId)
  }

  /** 获取背包中可捐赠的物品列表 */
  const donatableItems = computed(() => {
    const inventoryStore = useInventoryStore()
    return inventoryStore.items
      .filter(inv => {
        const museumItem = MUSEUM_ITEMS.find(m => m.id === inv.itemId)
        return museumItem && !isDonated(inv.itemId)
      })
      .map(inv => inv.itemId)
  })

  /** 捐赠物品 */
  const donateItem = (itemId: string): boolean => {
    if (!canDonate(itemId)) return false
    const inventoryStore = useInventoryStore()
    const removed = inventoryStore.removeItem(itemId, 1)
    if (!removed) return false
    donatedItems.value.push(itemId)
    try {
      useSystemStore().onMuseumGemDonate(itemId)
    } catch {
      /* pinia 未就绪 */
    }
    return true
  }

  /** 可领取的里程碑 */
  const claimableMilestones = computed(() => {
    return MUSEUM_MILESTONES.filter(m => donatedCount.value >= m.count && !claimedMilestones.value.includes(m.count))
  })

  /** 领取里程碑奖励 */
  const claimMilestone = (count: number): boolean => {
    const milestone = MUSEUM_MILESTONES.find(m => m.count === count)
    if (!milestone) return false
    if (donatedCount.value < count) return false
    if (claimedMilestones.value.includes(count)) return false

    const playerStore = usePlayerStore()
    const inventoryStore = useInventoryStore()

    if (milestone.reward.money) {
      playerStore.earnMoney(milestone.reward.money)
    }
    if (milestone.reward.items) {
      for (const item of milestone.reward.items) {
        inventoryStore.addItem(item.itemId, item.quantity)
      }
    }
    claimedMilestones.value.push(count)
    return true
  }

  /** 序列化 */
  const serialize = () => ({
    donatedItems: [...donatedItems.value],
    claimedMilestones: [...claimedMilestones.value]
  })

  /** 反序列化 */
  const deserialize = (data: ReturnType<typeof serialize>) => {
    donatedItems.value = data.donatedItems ?? []
    claimedMilestones.value = data.claimedMilestones ?? []
  }

  return {
    donatedItems,
    claimedMilestones,
    donatedCount,
    totalCount,
    isDonated,
    canDonate,
    donatableItems,
    donateItem,
    claimableMilestones,
    claimMilestone,
    serialize,
    deserialize
  }
})
