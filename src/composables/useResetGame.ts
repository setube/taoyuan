import { useAchievementStore } from '@/stores/useAchievementStore'
import { useAnimalStore } from '@/stores/useAnimalStore'
import { useBreedingStore } from '@/stores/useBreedingStore'
import { useCookingStore } from '@/stores/useCookingStore'
import { useFarmStore } from '@/stores/useFarmStore'
import { useFishPondStore } from '@/stores/useFishPondStore'
import { useFishingStore } from '@/stores/useFishingStore'
import { useGameStore } from '@/stores/useGameStore'
import { useGuildStore } from '@/stores/useGuildStore'
import { useHanhaiStore } from '@/stores/useHanhaiStore'
import { useHomeStore } from '@/stores/useHomeStore'
import { useInventoryStore } from '@/stores/useInventoryStore'
import { useMiningStore } from '@/stores/useMiningStore'
import { useMuseumStore } from '@/stores/useMuseumStore'
import { useNpcStore } from '@/stores/useNpcStore'
import { usePlayerStore } from '@/stores/usePlayerStore'
import { useProcessingStore } from '@/stores/useProcessingStore'
import { useQuestStore } from '@/stores/useQuestStore'
import { useSecretNoteStore } from '@/stores/useSecretNoteStore'
import { useShopStore } from '@/stores/useShopStore'
import { useSkillStore } from '@/stores/useSkillStore'
import { useTutorialStore } from '@/stores/useTutorialStore'
import { useWalletStore } from '@/stores/useWalletStore'
import { useBankStore } from '@/stores/useBankStore'
import { useWarehouseStore } from '@/stores/useWarehouseStore'

/**
 * 重置所有游戏相关 store 到初始状态（开新游戏时调用）。
 * 不重置: useSettingsStore（跨存档设置）、useSaveStore（存档管理）。
 */
export const resetAllStoresForNewGame = () => {
  useGameStore().$reset()
  usePlayerStore().$reset()
  useInventoryStore().$reset()
  useFarmStore().$reset()
  useSkillStore().$reset()
  useNpcStore().$reset()
  useMiningStore().$reset()
  useCookingStore().$reset()
  useProcessingStore().$reset()
  useAchievementStore().$reset()
  useAnimalStore().$reset()
  useHomeStore().$reset()
  useFishingStore().$reset()
  useWalletStore().$reset()
  useQuestStore().$reset()
  useShopStore().$reset()
  useWarehouseStore().$reset()
  useBreedingStore().$reset()
  useMuseumStore().$reset()
  useGuildStore().$reset()
  useSecretNoteStore().$reset()
  useHanhaiStore().$reset()
  useFishPondStore().$reset()
  useTutorialStore().$reset()
  useBankStore().$reset()
}
