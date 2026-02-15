<template>
  <div class="flex flex-col items-center gap-4 p-4">
    <h3 class="text-accent text-xs">概念1：等距网格 (2×3)</h3>

    <!-- 2×3 Grid -->
    <div class="isometric-grid">
      <button
        v-for="room in rooms"
        :key="room.id"
        class="iso-cell"
        @click="openRoomModal(room)"
      >
        <component :is="room.icon" :size="18" class="text-accent" />
        <span class="text-xs text-accent font-medium">{{ room.name }}</span>
        <span class="text-[10px] text-muted">{{ getRoomStatus(room.id) }}</span>
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
  import { DoorClosed, Bed, Coffee, BookOpen, Square, Package } from 'lucide-vue-next'
  import { getRandomFlavor } from '@/data/baseFlavor'
  import BaseRoomModal, { type RoomAction } from '@/components/game/BaseRoomModal.vue'
  import { useBaseStore } from '@/stores/useBaseStore'
  import { useGameStore } from '@/stores/useGameStore'
  import { usePlayerStore } from '@/stores/usePlayerStore'
  import { useGameLog } from '@/composables/useGameLog'

  const router = useRouter()
  const baseStore = useBaseStore()
  const gameStore = useGameStore()
  const playerStore = usePlayerStore()
  const { addLog } = useGameLog()

  const requestSleep = inject<() => void>('requestSleep')

  interface Room {
    id: string
    name: string
    icon: any
  }

  const rooms: Room[] = [
    { id: 'entrance', name: '门厅', icon: DoorClosed },
    { id: 'bedroom', name: '卧室', icon: Bed },
    { id: 'kitchenBath', name: '厨卫', icon: Coffee },
    { id: 'window', name: '窗户', icon: Square },
    { id: 'living', name: '起居', icon: BookOpen },
    { id: 'storage', name: '储物', icon: Package },
  ]

  const selectedRoom = ref<Room | null>(null)
  const currentFlavorText = ref('')

  const getRoomStatus = (roomId: string): string => {
    switch (roomId) {
      case 'entrance':
        const doorLevel = baseStore.getDoorBarricade()
        return doorLevel > 0 ? `加固 ${'█'.repeat(doorLevel)}` : '·'
      case 'window':
        const windowLevel = baseStore.getWindowBarricade()
        return windowLevel > 0 ? `加固 ${'█'.repeat(windowLevel)}` : '·'
      case 'bedroom':
        return '休息'
      case 'kitchenBath':
        const foodCount = baseStore.getFurnitureSupplies('kitchen')
        return foodCount > 0 ? `物资 ${'●'.repeat(Math.min(foodCount, 5))}` : '·'
      case 'living':
        return '工作台'
      case 'storage':
        const supplies = baseStore.getFurnitureSupplies('closet')
        return supplies > 0 ? `库存 ${Math.round((supplies / 20) * 100)}%` : '空'
      default:
        return ''
    }
  }

  const openRoomModal = (room: Room) => {
    selectedRoom.value = room
    currentFlavorText.value = getRandomFlavor(room.id)
  }

  const closeModal = () => {
    selectedRoom.value = null
  }

  const primaryActions = computed<RoomAction[]>(() => {
    if (!selectedRoom.value) return []

    const room = selectedRoom.value
    const actions: RoomAction[] = []

    switch (room.id) {
      case 'bedroom':
        actions.push({ id: 'rest', label: '休息 (2回合)', handler: handleRest })
        actions.push({ id: 'sleep', label: '长眠至早晨', handler: handleSleep })
        break

      case 'entrance':
        actions.push({
          id: 'barricade',
          label: '加固门',
          badge: `${baseStore.getDoorBarricade()}/3`,
          disabled: baseStore.getDoorBarricade() >= 3,
          handler: () => baseStore.upgradeBarricade() && addLog('加固了门'),
        })
        break

      case 'window':
        actions.push({
          id: 'barricade',
          label: '加固窗户',
          badge: `${baseStore.getWindowBarricade()}/3`,
          disabled: baseStore.getWindowBarricade() >= 3,
          handler: () => baseStore.upgradeFurnitureBarricade('window') && addLog('加固了窗户'),
        })
        break

      case 'kitchenBath':
        actions.push({ id: 'cook', label: '做饭', handler: () => addLog('做了简单的饭') })
        actions.push({ id: 'wash', label: '洗漱', handler: () => addLog('简单洗漱了一下') })
        break

      case 'living':
        actions.push({ id: 'craft', label: '制作物品', handler: () => router.push('/game/workshop') })
        break

      case 'storage':
        actions.push({ id: 'search', label: '翻找物品', handler: () => addLog('翻找了一番') })
        break
    }

    return actions
  })

  const generalActions = computed<RoomAction[]>(() => [
    { id: 'inventory', label: '查看背包', handler: () => router.push('/game/inventory') },
    { id: 'rest', label: '休息一会儿', handler: handleRest },
  ])

  const handleRest = () => {
    gameStore.advanceTurns(2)
    playerStore.stamina = Math.min(100, playerStore.stamina + 30)
    addLog('休息了一会儿')
  }

  const handleSleep = () => {
    if (requestSleep) requestSleep()
  }
</script>

<style scoped>
  .isometric-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(2, 1fr);
    gap: 8px;
    width: 100%;
    max-width: 360px;
    aspect-ratio: 3 / 2;
  }

  .iso-cell {
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
    padding: 8px;
  }

  .iso-cell:hover {
    border-color: oklch(from var(--color-accent) l c h / 0.5);
    background: oklch(from var(--color-accent) l c h / 0.05);
  }
</style>
