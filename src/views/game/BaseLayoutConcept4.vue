<template>
  <div class="flex flex-col items-center gap-4 p-4">
    <h3 class="text-accent text-xs">概念4：真实俯视图 (10×20)</h3>

    <!-- Apartment Grid -->
    <div class="apartment-grid">
      <button
        v-for="furniture in APARTMENT_FURNITURE"
        :key="furniture.id"
        :style="{ gridArea: furniture.gridArea }"
        class="furniture-btn"
        @click="openFurnitureModal(furniture)"
      >
        <component :is="getIcon(furniture.icon)" :size="getFurnitureIconSize(furniture)" />
        <span class="text-[10px] text-accent">{{ furniture.name }}</span>

        <!-- Barricade overlay if door/window -->
        <div
          v-if="showBarricadeOverlay(furniture)"
          class="barricade-overlay"
          :style="{ opacity: getBarricadeOpacity(furniture) }"
        />

        <!-- Badge for barricade level or supplies -->
        <span v-if="getFurnitureBadge(furniture)" class="furniture-badge">
          {{ getFurnitureBadge(furniture) }}
        </span>
      </button>
    </div>

    <!-- Center modal: description at top, actions as buttons at bottom -->
    <BaseRoomModal
      v-if="selectedFurniture"
      :name="selectedFurniture.name"
      :icon="getIcon(selectedFurniture.icon)"
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
  import {
    DoorClosed,
    Bed,
    BookOpen,
    Package,
    Coffee,
    Square,
    Droplets,
    Box,
    Snowflake,
  } from 'lucide-vue-next'
  import { APARTMENT_FURNITURE, type FurnitureDef } from '@/data/baseFurniture'
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

  const selectedFurniture = ref<FurnitureDef | null>(null)
  const currentFlavorText = ref('')

  // Icon mapping
  const iconMap: Record<string, any> = {
    DoorClosed,
    Bed,
    BookOpen,
    Package,
    Coffee,
    Square, // Window
    Droplets,
    Box,
    Snowflake,
  }

  const getIcon = (iconName: string) => {
    return iconMap[iconName] || Package
  }

  const getFurnitureIconSize = (furniture: FurnitureDef): number => {
    // Larger icons for bigger furniture
    const area = furniture.gridArea.split('/').map(Number)
    const rows = (area[2] ?? 1) - (area[0] ?? 0)
    const cols = (area[3] ?? 1) - (area[1] ?? 0)
    const totalCells = rows * cols

    if (totalCells >= 9) return 20 // Large furniture (3×3)
    if (totalCells >= 4) return 16 // Medium furniture (2×2)
    return 14 // Small furniture
  }

  const showBarricadeOverlay = (furniture: FurnitureDef): boolean => {
    if (furniture.type !== 'door' && furniture.type !== 'window') return false
    const barricadeLevel =
      furniture.id === 'door'
        ? baseStore.getDoorBarricade()
        : baseStore.getWindowBarricade()
    return barricadeLevel > 0
  }

  const getBarricadeOpacity = (furniture: FurnitureDef): number => {
    const barricadeLevel =
      furniture.id === 'door'
        ? baseStore.getDoorBarricade()
        : baseStore.getWindowBarricade()
    return 0.1 + barricadeLevel * 0.1 // 0.2, 0.3, 0.4 for levels 1, 2, 3
  }

  const getFurnitureBadge = (furniture: FurnitureDef): string | null => {
    // Barricade badge for door/window
    if (furniture.type === 'door' || furniture.type === 'window') {
      const barricadeLevel =
        furniture.id === 'door'
          ? baseStore.getDoorBarricade()
          : baseStore.getWindowBarricade()
      if (barricadeLevel > 0) {
        return `×${barricadeLevel}`
      }
    }

    // Supplies badge for storage
    if (furniture.type === 'storage' || furniture.type === 'kitchen') {
      const supplies = baseStore.getFurnitureSupplies(furniture.id)
      if (supplies > 0) {
        return `${supplies}`
      }
    }

    return null
  }

  const openFurnitureModal = (furniture: FurnitureDef) => {
    selectedFurniture.value = furniture
    currentFlavorText.value = getRandomFlavor(furniture.id)
    baseStore.interactWithFurniture(furniture.id)
  }

  const closeModal = () => {
    selectedFurniture.value = null
  }

  // Actions based on furniture type
  const primaryActions = computed<RoomAction[]>(() => {
    if (!selectedFurniture.value) return []

    const furniture = selectedFurniture.value
    const actions: RoomAction[] = []

    switch (furniture.type) {
      case 'bed':
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

      case 'door':
      case 'window':
        const barricadeLevel =
          furniture.id === 'door'
            ? baseStore.getDoorBarricade()
            : baseStore.getWindowBarricade()
        actions.push({
          id: 'barricade',
          label: `加固${furniture.name}`,
          badge: `${barricadeLevel}/3`,
          disabled: barricadeLevel >= 3,
          handler: () => handleBarricade(furniture.id),
        })
        actions.push({
          id: 'lookOut',
          label: `观察外面`,
          handler: () => handleLookOut(furniture.id),
        })
        break

      case 'crafting':
        actions.push({
          id: 'craft',
          label: '制作物品',
          handler: handleCraft,
        })
        actions.push({
          id: 'read',
          label: '阅读书籍',
          handler: () => handleRead(),
        })
        break

      case 'storage':
        actions.push({
          id: 'search',
          label: '翻找物品',
          handler: () => handleSearch(furniture.id),
        })
        actions.push({
          id: 'organize',
          label: '整理物资',
          handler: () => handleOrganize(furniture.id),
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

      case 'bathroom':
        actions.push({
          id: 'wash',
          label: '洗漱',
          handler: handleWash,
        })
        actions.push({
          id: 'getWater',
          label: '取水',
          handler: handleGetWater,
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

  // Action handlers
  const handleRest = () => {
    gameStore.advanceTurns(2)
    const restoreAmount = 30
    playerStore.stamina = Math.min(100, playerStore.stamina + restoreAmount)
    playerStore.hp = Math.min(playerStore.getMaxHp(), playerStore.hp + 5)
    addLog(`你休息了一会儿，恢复了体力。`)
  }

  const handleSleep = () => {
    if (requestSleep) {
      requestSleep()
    }
  }

  const handleBarricade = (furnitureId: string) => {
    const success = baseStore.upgradeFurnitureBarricade(furnitureId)
    if (success) {
      const level =
        furnitureId === 'door'
          ? baseStore.getDoorBarricade()
          : baseStore.getWindowBarricade()
      const name = furnitureId === 'door' ? '门' : '窗户'
      addLog(`你加固了${name}，当前等级: ${level}/3`)
    } else {
      addLog('已经达到最大加固等级')
    }
  }

  const handleLookOut = (_furnitureId: string) => {
    const messages = [
      '街上一片死寂，偶尔有游荡的尸群经过',
      '对面楼的窗户紧闭，不知道里面还有没有活人',
      '远处传来汽车警报声，引来了更多的僵尸',
    ]
    addLog((messages[Math.floor(Math.random() * messages.length)] ?? "..."))
    gameStore.advanceTurns(1)
  }

  const handleCraft = () => {
    router.push('/game/workshop')
  }

  const handleRead = () => {
    addLog('你翻阅着旧书，暂时忘记了外面的恐怖。')
    gameStore.advanceTurns(2)
  }

  const handleSearch = (_furnitureId: string) => {
    addLog('你翻找了一番，但没有发现什么有用的东西。')
    gameStore.advanceTurns(1)
  }

  const handleOrganize = (_furnitureId: string) => {
    addLog('你整理了一下物资，心里稍微安心了一些。')
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

  const handleWash = () => {
    addLog('你简单洗漱了一下，感觉清爽了些。')
    gameStore.advanceTurns(1)
  }

  const handleGetWater = () => {
    addLog('你从浴缸里取了一些水，得省着用。')
    gameStore.advanceTurns(1)
  }
</script>

<style scoped>
  .apartment-grid {
    display: grid;
    grid-template-columns: repeat(20, 1fr);
    grid-template-rows: repeat(10, 1fr);
    max-width: 600px;
    width: 100%;
    aspect-ratio: 2 / 1;
    gap: 1px;
    background: var(--color-bg);
    border: 1px solid oklch(from var(--color-accent) l c h / 0.3);
    border-radius: 4px;
    margin: 0 auto;
  }

  .furniture-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    background: var(--color-panel);
    border: 1px solid oklch(from var(--color-accent) l c h / 0.3);
    border-radius: 2px;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
    padding: 2px;
  }

  .furniture-btn:hover {
    border-color: oklch(from var(--color-accent) l c h / 0.6);
    background: oklch(from var(--color-accent) l c h / 0.1);
    transform: scale(1.02);
  }

  .barricade-overlay {
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      45deg,
      transparent,
      transparent 4px,
      oklch(from var(--color-accent) l c h / 0.2) 4px,
      oklch(from var(--color-accent) l c h / 0.2) 8px
    );
    pointer-events: none;
    border-radius: 2px;
  }

  .furniture-badge {
    position: absolute;
    top: 2px;
    right: 2px;
    padding: 1px 4px;
    font-size: 9px;
    background: oklch(from var(--color-accent) l c h / 0.2);
    color: var(--color-accent);
    border-radius: 6px;
    font-weight: 600;
    line-height: 1.2;
  }

  /* Mobile responsiveness */
  @media (max-width: 640px) {
    .apartment-grid {
      max-width: calc(100vw - 32px);
    }

    .furniture-btn {
      gap: 1px;
      padding: 1px;
    }

    .furniture-btn span {
      font-size: 8px;
    }
  }
</style>
