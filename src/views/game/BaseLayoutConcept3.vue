<template>
  <div class="flex flex-col items-center gap-4 p-4">
    <h3 class="text-accent text-xs">概念3：混合式 (2×2 + 快捷栏)</h3>

    <!-- Top Grid (2×2) -->
    <div class="room-grid">
      <button
        v-for="room in rooms"
        :key="room.id"
        class="room-cell"
        @click="openRoomModal(room)"
      >
        <component :is="room.icon" :size="20" class="text-accent" />
        <span class="text-xs text-accent font-medium">{{ room.name }}</span>
        <span class="text-[10px] text-muted">{{ getRoomStatus(room.id) }}</span>
      </button>
    </div>

    <!-- Bottom Quick Bar -->
    <div class="quick-bar">
      <button
        v-for="action in quickActions"
        :key="action.id"
        class="quick-btn"
        :disabled="action.disabled"
        @click="action.handler"
      >
        <component :is="action.icon" :size="16" />
        <span class="text-xs">{{ action.label }}</span>
        <span v-if="action.badge" class="action-badge">{{ action.badge }}</span>
      </button>
    </div>

    <!-- Room Modal -->
    <BaseRoomModal
      v-if="selectedRoom"
      :name="selectedRoom.name"
      :icon="selectedRoom.icon"
      :description="currentFlavorText"
      :primaryActions="primaryActions"
      :generalActions="generalActions"
      @close="closeModal"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, inject } from 'vue'
  import { useRouter } from 'vue-router'
  import { DoorClosed, Bed, Coffee, BookOpen, Moon, Package, Hammer } from 'lucide-vue-next'
  import { getRandomFlavor } from '@/data/baseFlavor'
  import BaseRoomModal, { type RoomAction } from '@/components/game/BaseRoomModal.vue'
  import { useBaseStore } from '@/stores/useBaseStore'
  import { useGameStore } from '@/stores/useGameStore'
  import { usePlayerStore } from '@/stores/usePlayerStore'
  import { useInventoryStore } from '@/stores/useInventoryStore'
  import { useGameLog } from '@/composables/useGameLog'

  const router = useRouter()
  const baseStore = useBaseStore()
  const gameStore = useGameStore()
  const playerStore = usePlayerStore()
  const inventoryStore = useInventoryStore()
  const { addLog } = useGameLog()

  const requestSleep = inject<() => void>('requestSleep')

  interface Room {
    id: string
    name: string
    icon: any
  }

  const rooms: Room[] = [
    { id: 'entrance', name: '门', icon: DoorClosed },
    { id: 'bedroom', name: '卧室', icon: Bed },
    { id: 'kitchen', name: '厨房', icon: Coffee },
    { id: 'living', name: '起居', icon: BookOpen },
  ]

  const selectedRoom = ref<Room | null>(null)
  const currentFlavorText = ref('')

  const getRoomStatus = (roomId: string): string => {
    switch (roomId) {
      case 'entrance':
        const barricadeLevel = baseStore.getDoorBarricade()
        return barricadeLevel > 0 ? `${'│'.repeat(barricadeLevel)}` : '·'
      case 'bedroom':
        return playerStore.stamina < 50 ? '疲惫' : '可休息'
      case 'kitchen':
        const foodCount = baseStore.getFurnitureSupplies('kitchen')
        return foodCount > 0 ? `${foodCount}食物` : '空'
      case 'living':
        return '工作台'
      default:
        return ''
    }
  }

  // Quick Actions
  const quickActions = computed(() => [
    {
      id: 'rest',
      label: '休息',
      icon: Moon,
      badge: getStaminaColor(),
      disabled: false,
      handler: handleQuickRest,
    },
    {
      id: 'barricade',
      label: '加固',
      icon: DoorClosed,
      badge: `${baseStore.getDoorBarricade()}/3`,
      disabled: baseStore.getDoorBarricade() >= 3,
      handler: handleQuickBarricade,
    },
    {
      id: 'supplies',
      label: '物资',
      icon: Package,
      badge: getInventoryFullness(),
      disabled: false,
      handler: () => router.push('/game/inventory'),
    },
    {
      id: 'craft',
      label: '制作',
      icon: Hammer,
      disabled: false,
      handler: () => router.push('/game/workshop'),
    },
  ])

  const getStaminaColor = (): string => {
    const stamina = playerStore.stamina
    if (stamina >= 70) return '●' // Green (full)
    if (stamina >= 40) return '◐' // Yellow (medium)
    return '○' // Red (low)
  }

  const getInventoryFullness = (): string => {
    const total = inventoryStore.items.length
    const maxSlots = 20 // Assume max 20 slots
    const percentage = Math.round((total / maxSlots) * 100)
    return `${percentage}%`
  }

  const openRoomModal = (room: Room) => {
    selectedRoom.value = room
    currentFlavorText.value = getRandomFlavor(room.id)
  }

  const closeModal = () => {
    selectedRoom.value = null
  }

  // Primary actions based on room
  const primaryActions = computed<RoomAction[]>(() => {
    if (!selectedRoom.value) return []

    const room = selectedRoom.value
    const actions: RoomAction[] = []

    switch (room.id) {
      case 'bedroom':
        actions.push({
          id: 'rest',
          label: '休息 (2回合)',
          handler: handleRest,
        })
        actions.push({
          id: 'sleep',
          label: '长眠至早晨',
          handler: handleSleep,
        })
        break

      case 'entrance':
        const barricadeLevel = baseStore.getDoorBarricade()
        actions.push({
          id: 'barricade',
          label: '加固门',
          badge: `${barricadeLevel}/3`,
          disabled: barricadeLevel >= 3,
          handler: () => handleBarricade('door'),
        })
        actions.push({
          id: 'listen',
          label: '聆听门外',
          handler: handleListen,
        })
        break

      case 'kitchen':
        actions.push({
          id: 'cook',
          label: '做简单的饭',
          handler: handleCook,
        })
        actions.push({
          id: 'boilWater',
          label: '烧水',
          handler: handleBoilWater,
        })
        break

      case 'living':
        actions.push({
          id: 'craft',
          label: '制作物品',
          handler: () => router.push('/game/workshop'),
        })
        actions.push({
          id: 'read',
          label: '阅读书籍',
          handler: handleRead,
        })
        break
    }

    return actions
  })

  const generalActions = computed<RoomAction[]>(() => [
    {
      id: 'viewInventory',
      label: '查看背包',
      handler: () => router.push('/game/inventory'),
    },
    {
      id: 'quickRest',
      label: '休息一会儿',
      handler: handleRest,
    },
  ])

  // Action handlers (same as Concept 4)
  const handleQuickRest = () => {
    gameStore.advanceTurns(2)
    playerStore.stamina = Math.min(100, playerStore.stamina + 30)
    playerStore.hp = Math.min(playerStore.getMaxHp(), playerStore.hp + 5)
    addLog('你休息了一会儿，恢复了体力。')
  }

  const handleRest = () => {
    handleQuickRest()
  }

  const handleSleep = () => {
    if (requestSleep) {
      requestSleep()
    }
  }

  const handleQuickBarricade = () => {
    const success = baseStore.upgradeBarricade()
    if (success) {
      addLog(`你加固了门，当前等级: ${baseStore.getDoorBarricade()}/3`)
    } else {
      addLog('门已经达到最大加固等级')
    }
  }

  const handleBarricade = (_furnitureId: string) => {
    handleQuickBarricade()
  }

  const handleListen = () => {
    const messages = [
      '门外一片死寂，什么也听不到',
      '隐约传来拖行的脚步声，正在远去',
      '门外有沉重的呼吸声，似乎有什么东西在徘徊',
    ]
    addLog((messages[Math.floor(Math.random() * messages.length)] ?? "..."))
    gameStore.advanceTurns(1)
  }

  const handleCook = () => {
    addLog('你做了一顿简单的饭，填饱了肚子。')
    gameStore.advanceTurns(3)
  }

  const handleBoilWater = () => {
    addLog('你烧了一壶开水，可以喝上热水了。')
    gameStore.advanceTurns(2)
  }

  const handleRead = () => {
    addLog('你翻阅着旧书，暂时忘记了外面的恐怖。')
    gameStore.advanceTurns(2)
  }
</script>

<style scoped>
  .room-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(2, 1fr);
    gap: 8px;
    width: 100%;
    max-width: 320px;
    aspect-ratio: 1;
  }

  .room-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    background: var(--color-panel);
    border: 1px solid oklch(from var(--color-accent) l c h / 0.2);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
    padding: 12px;
  }

  .room-cell:hover {
    border-color: oklch(from var(--color-accent) l c h / 0.5);
    background: oklch(from var(--color-accent) l c h / 0.05);
  }

  .quick-bar {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    width: 100%;
    max-width: 480px;
    padding: 12px;
    background: var(--color-panel);
    border-top: 1px solid oklch(from var(--color-accent) l c h / 0.3);
    border-radius: 4px;
  }

  .quick-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 8px;
    background: transparent;
    border: 1px solid oklch(from var(--color-accent) l c h / 0.2);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
  }

  .quick-btn:hover:not(:disabled) {
    border-color: oklch(from var(--color-accent) l c h / 0.5);
    background: oklch(from var(--color-accent) l c h / 0.1);
  }

  .quick-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .action-badge {
    position: absolute;
    top: 4px;
    right: 4px;
    padding: 1px 4px;
    font-size: 9px;
    background: oklch(from var(--color-accent) l c h / 0.2);
    color: var(--color-accent);
    border-radius: 6px;
    font-weight: 600;
    line-height: 1.2;
  }

  @media (max-width: 640px) {
    .room-grid {
      max-width: 280px;
    }

    .quick-bar {
      max-width: 100%;
      gap: 4px;
    }

    .quick-btn {
      padding: 6px;
      gap: 2px;
    }

    .quick-btn span {
      font-size: 10px;
    }
  }
</style>
