<template>
  <div class="flex flex-col items-center gap-4 p-4">
    <h3 class="text-accent text-xs">概念2：工作室平面图</h3>

    <!-- Floor Plan Canvas -->
    <div class="floor-plan">
      <button
        v-for="zone in zones"
        :key="zone.id"
        class="zone-btn"
        :style="zone.style"
        @click="openZoneModal(zone)"
      >
        <component :is="zone.icon" :size="14" />
        <span class="text-[10px] text-accent">{{ zone.name }}</span>

        <!-- Barricade overlay -->
        <div
          v-if="showBarricadeOverlay(zone)"
          class="barricade-hatching"
          :style="{ opacity: getBarricadeOpacity(zone) }"
        />
      </button>
    </div>

    <!-- Zone Modal -->
    <BaseRoomModal
      v-if="selectedZone"
      :name="selectedZone.name"
      :icon="selectedZone.icon"
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
  import { DoorClosed, Bed, BookOpen, Coffee, Droplets, Package, Square } from 'lucide-vue-next'
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

  interface Zone {
    id: string
    name: string
    icon: any
    style: Record<string, string>
  }

  // Positioned zones (absolute positioning within 400×300px canvas)
  const zones: Zone[] = [
    { id: 'door', name: '门', icon: DoorClosed, style: { top: '10px', left: '10px', width: '60px', height: '60px' } },
    { id: 'bed', name: '床', icon: Bed, style: { top: '10px', right: '10px', width: '80px', height: '60px' } },
    { id: 'desk', name: '书桌', icon: BookOpen, style: { top: '120px', left: '120px', width: '80px', height: '60px' } },
    { id: 'window', name: '窗', icon: Square, style: { top: '120px', right: '10px', width: '60px', height: '60px' } },
    { id: 'kitchen', name: '厨', icon: Coffee, style: { bottom: '10px', left: '10px', width: '60px', height: '50px' } },
    { id: 'storage', name: '储', icon: Package, style: { bottom: '10px', left: '150px', width: '50px', height: '50px' } },
    { id: 'bathroom', name: '浴', icon: Droplets, style: { bottom: '10px', right: '10px', width: '50px', height: '50px' } },
  ]

  const selectedZone = ref<Zone | null>(null)
  const currentFlavorText = ref('')

  const showBarricadeOverlay = (zone: Zone): boolean => {
    if (zone.id === 'door') return baseStore.getDoorBarricade() > 0
    if (zone.id === 'window') return baseStore.getWindowBarricade() > 0
    return false
  }

  const getBarricadeOpacity = (zone: Zone): number => {
    const level = zone.id === 'door' ? baseStore.getDoorBarricade() : baseStore.getWindowBarricade()
    return 0.1 + level * 0.1
  }

  const openZoneModal = (zone: Zone) => {
    selectedZone.value = zone
    currentFlavorText.value = getRandomFlavor(zone.id)
  }

  const closeModal = () => {
    selectedZone.value = null
  }

  const primaryActions = computed<RoomAction[]>(() => {
    if (!selectedZone.value) return []

    const zone = selectedZone.value
    const actions: RoomAction[] = []

    switch (zone.id) {
      case 'bed':
        actions.push({ id: 'rest', label: '休息 (2回合)', handler: handleRest })
        actions.push({ id: 'sleep', label: '长眠至早晨', handler: handleSleep })
        break

      case 'door':
      case 'window':
        const level = zone.id === 'door' ? baseStore.getDoorBarricade() : baseStore.getWindowBarricade()
        actions.push({
          id: 'barricade',
          label: `加固${zone.name}`,
          badge: `${level}/3`,
          disabled: level >= 3,
          handler: () =>
            zone.id === 'door'
              ? baseStore.upgradeBarricade() && addLog('加固了门')
              : baseStore.upgradeFurnitureBarricade('window') && addLog('加固了窗户'),
        })
        break

      case 'desk':
        actions.push({ id: 'craft', label: '制作物品', handler: () => router.push('/game/workshop') })
        break

      case 'kitchen':
        actions.push({ id: 'cook', label: '做饭', handler: () => addLog('做了简单的饭') })
        break

      case 'bathroom':
        actions.push({ id: 'wash', label: '洗漱', handler: () => addLog('简单洗漱了一下') })
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
  .floor-plan {
    position: relative;
    width: 100%;
    max-width: 400px;
    height: 300px;
    background: var(--color-panel);
    border: 1px solid oklch(from var(--color-accent) l c h / 0.3);
    border-radius: 4px;
  }

  .zone-btn {
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    background: oklch(from var(--color-accent) l c h / 0.05);
    border: 1px solid oklch(from var(--color-accent) l c h / 0.2);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .zone-btn:hover {
    border-color: oklch(from var(--color-accent) l c h / 0.6);
    background: oklch(from var(--color-accent) l c h / 0.15);
  }

  .barricade-hatching {
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      45deg,
      transparent,
      transparent 6px,
      oklch(from var(--color-accent) l c h / 0.3) 6px,
      oklch(from var(--color-accent) l c h / 0.3) 12px
    );
    pointer-events: none;
    border-radius: 4px;
  }

  @media (max-width: 640px) {
    .floor-plan {
      max-width: calc(100vw - 32px);
      height: 240px;
    }

    .zone-btn {
      transform: scale(0.9);
    }
  }
</style>
