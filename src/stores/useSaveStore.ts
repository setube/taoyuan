import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import CryptoJS from 'crypto-js'
import { saveAs } from 'file-saver'
import { useGameStore, SEASON_NAMES } from './useGameStore'
import { usePlayerStore } from './usePlayerStore'
import { useInventoryStore } from './useInventoryStore'
import { useFarmStore } from './useFarmStore'
import { useSkillStore } from './useSkillStore'
import { useNpcStore } from './useNpcStore'
import { useMiningStore } from './useMiningStore'
import { useCookingStore } from './useCookingStore'
import { useProcessingStore } from './useProcessingStore'
import { useAchievementStore } from './useAchievementStore'
import { useAnimalStore } from './useAnimalStore'
import { useHomeStore } from './useHomeStore'
import { useFishingStore } from './useFishingStore'
import { useWalletStore } from './useWalletStore'
import { useQuestStore } from './useQuestStore'
import { useShopStore } from './useShopStore'
import { useSettingsStore } from './useSettingsStore'
import { useWarehouseStore } from './useWarehouseStore'
import { useBreedingStore } from './useBreedingStore'
import { useMuseumStore } from './useMuseumStore'
import { useGuildStore } from './useGuildStore'
import { useSecretNoteStore } from './useSecretNoteStore'
import { useHanhaiStore } from './useHanhaiStore'
import { useFishPondStore } from './useFishPondStore'
import { useTutorialStore } from './useTutorialStore'
import { useHiddenNpcStore } from './useHiddenNpcStore'
import { useBankStore } from './useBankStore'
import { useTavernStore } from './useTavernStore'
import { useSystemStore } from './useSystemStore'
import { useForgeStore } from './useForgeStore'
import { getBackendUrl } from '@/utils/backendUrl'

const SAVE_KEY_PREFIX = 'taoyuanxiang_save_'
const MAX_SLOTS = 5
const ENCRYPTION_KEY = 'taoyuanxiang_2024_secret'
const SAVE_FILE_EXT = '.tyx'

/** 加密 JSON 字符串 */
const encrypt = (json: string): string => {
  return CryptoJS.AES.encrypt(json, ENCRYPTION_KEY).toString()
}

/** 解密为 JSON 字符串，失败返回 null */
const decrypt = (cipher: string): string | null => {
  try {
    const bytes = CryptoJS.AES.decrypt(cipher, ENCRYPTION_KEY)
    const result = bytes.toString(CryptoJS.enc.Utf8)
    return result || null
  } catch {
    return null
  }
}

/** 解密并解析存档数据 */
export const parseSaveData = (raw: string): Record<string, any> | null => {
  const decrypted = decrypt(raw)
  if (!decrypted) return null
  try {
    return JSON.parse(decrypted) as Record<string, any>
  } catch {
    return null
  }
}

export interface SaveSlotInfo {
  slot: number
  exists: boolean
  year?: number
  season?: string
  day?: number
  money?: number
  playerName?: string
  savedAt?: string
}

export type CloudConflictStatus = 'no_local' | 'no_cloud' | 'synced' | 'local_newer' | 'cloud_newer'

export const useSaveStore = defineStore('save', () => {
  /** 当前活跃存档槽位（-1 表示未分配） */
  const activeSlot = ref(-1)

  /** 获取所有存档槽位信息 */
  const getSlots = (): SaveSlotInfo[] => {
    const slots: SaveSlotInfo[] = []
    for (let i = 0; i < MAX_SLOTS; i++) {
      try {
        const raw = localStorage.getItem(`${SAVE_KEY_PREFIX}${i}`)
        if (raw) {
          const data = parseSaveData(raw)
          if (data) {
            slots.push({
              slot: i,
              exists: true,
              year: data.game?.year,
              season: data.game?.season,
              day: data.game?.day,
              money: data.player?.money,
              playerName: data.player?.playerName,
              savedAt: data.savedAt
            })
          } else {
            slots.push({ slot: i, exists: false })
          }
        } else {
          slots.push({ slot: i, exists: false })
        }
      } catch {
        slots.push({ slot: i, exists: false })
      }
    }
    return slots
  }

  /** 为新游戏分配一个空闲槽位，无空闲则返回 -1 */
  const assignNewSlot = (): number => {
    const slots = getSlots()
    const empty = slots.find(s => !s.exists)
    const slot = empty ? empty.slot : -1
    activeSlot.value = slot
    return slot
  }

  /** 保存到指定槽位 */
  const saveToSlot = (slot: number): boolean => {
    if (slot < 0 || slot >= MAX_SLOTS) return false
    try {
      const gameStore = useGameStore()
      const playerStore = usePlayerStore()
      const inventoryStore = useInventoryStore()
      const farmStore = useFarmStore()
      const skillStore = useSkillStore()
      const npcStore = useNpcStore()
      const miningStore = useMiningStore()
      const cookingStore = useCookingStore()
      const processingStore = useProcessingStore()
      const achievementStore = useAchievementStore()
      const animalStore = useAnimalStore()
      const homeStore = useHomeStore()
      const fishingStore = useFishingStore()
      const walletStore = useWalletStore()
      const questStore = useQuestStore()
      const shopStore = useShopStore()
      const settingsStore = useSettingsStore()
      const warehouseStore = useWarehouseStore()
      const breedingStore = useBreedingStore()
      const museumStore = useMuseumStore()
      const guildStore = useGuildStore()
      const secretNoteStore = useSecretNoteStore()
      const hanhaiStore = useHanhaiStore()
      const fishPondStore = useFishPondStore()
      const tutorialStore = useTutorialStore()
      const hiddenNpcStore = useHiddenNpcStore()
      const bankStore = useBankStore()
      const tavernStore = useTavernStore()
      const systemStore = useSystemStore()
      const forgeStore = useForgeStore()
      const data = {
        game: gameStore.serialize(),
        player: playerStore.serialize(),
        inventory: inventoryStore.serialize(),
        farm: farmStore.serialize(),
        skill: skillStore.serialize(),
        npc: npcStore.serialize(),
        mining: miningStore.serialize(),
        cooking: cookingStore.serialize(),
        processing: processingStore.serialize(),
        achievement: achievementStore.serialize(),
        animal: animalStore.serialize(),
        home: homeStore.serialize(),
        fishing: fishingStore.serialize(),
        wallet: walletStore.serialize(),
        quest: questStore.serialize(),
        shop: shopStore.serialize(),
        settings: settingsStore.serialize(),
        warehouse: warehouseStore.serialize(),
        breeding: breedingStore.serialize(),
        museum: museumStore.serialize(),
        guild: guildStore.serialize(),
        secretNote: secretNoteStore.serialize(),
        hanhai: hanhaiStore.serialize(),
        fishPond: fishPondStore.serialize(),
        tutorial: tutorialStore.serialize(),
        hiddenNpc: hiddenNpcStore.serialize(),
        bank: bankStore.serialize(),
        tavern: tavernStore.serialize(),
        system: systemStore.serialize(),
        forge: forgeStore.serialize(),
        savedAt: new Date().toISOString()
      }
      localStorage.setItem(`${SAVE_KEY_PREFIX}${slot}`, encrypt(JSON.stringify(data)))
      activeSlot.value = slot
      if (systemStore.cloudBackupEnabled) {
        void uploadToCloud(slot)
      }
      return true
    } catch {
      return false
    }
  }

  /** 自动存档到当前活跃槽位（开启云备时后台上传） */
  const autoSave = (): boolean => {
    if (activeSlot.value < 0) return false
    const ok = saveToSlot(activeSlot.value)
    if (ok && systemStore.cloudBackupEnabled) {
      void uploadToCloud(activeSlot.value)
    }
    return ok
  }

  /** 从指定槽位加载 */
  const loadFromSlot = (slot: number): boolean => {
    try {
      const raw = localStorage.getItem(`${SAVE_KEY_PREFIX}${slot}`)
      if (!raw) return false

      const data = parseSaveData(raw)
      if (!data) return false
      const gameStore = useGameStore()
      const playerStore = usePlayerStore()
      const inventoryStore = useInventoryStore()
      const farmStore = useFarmStore()
      const skillStore = useSkillStore()
      const npcStore = useNpcStore()
      const miningStore = useMiningStore()
      const cookingStore = useCookingStore()
      const processingStore = useProcessingStore()
      const achievementStore = useAchievementStore()
      const animalStore = useAnimalStore()
      const homeStore = useHomeStore()
      const fishingStore = useFishingStore()
      const walletStore = useWalletStore()
      const questStore = useQuestStore()
      const shopStore = useShopStore()
      const settingsStore = useSettingsStore()
      const warehouseStore = useWarehouseStore()
      const breedingStore = useBreedingStore()
      const museumStore = useMuseumStore()
      const guildStore = useGuildStore()
      const secretNoteStore = useSecretNoteStore()
      const hanhaiStore = useHanhaiStore()
      const fishPondStore = useFishPondStore()
      const tutorialStore = useTutorialStore()
      const hiddenNpcStore = useHiddenNpcStore()
      const bankStore = useBankStore()
      const tavernStore = useTavernStore()
      gameStore.deserialize(data.game)
      playerStore.deserialize(data.player)
      inventoryStore.deserialize(data.inventory)
      farmStore.deserialize(data.farm)
      if (data.skill) skillStore.deserialize(data.skill)
      if (data.npc) npcStore.deserialize(data.npc)
      if (data.mining) miningStore.deserialize(data.mining)
      if (data.cooking) cookingStore.deserialize(data.cooking)
      if (data.processing) processingStore.deserialize(data.processing)
      if (data.achievement) achievementStore.deserialize(data.achievement)
      if (data.animal) animalStore.deserialize(data.animal)
      if (data.home) homeStore.deserialize(data.home)
      if (data.fishing) fishingStore.deserialize(data.fishing)
      if (data.wallet) walletStore.deserialize(data.wallet)
      if (data.quest) questStore.deserialize(data.quest)
      if (data.shop) shopStore.deserialize(data.shop)
      if (data.settings) settingsStore.deserialize(data.settings)
      if (data.warehouse) warehouseStore.deserialize(data.warehouse)
      if (data.breeding) breedingStore.deserialize(data.breeding)
      if (data.museum) museumStore.deserialize(data.museum)
      if (data.guild) guildStore.deserialize(data.guild)
      if (data.secretNote) secretNoteStore.deserialize(data.secretNote)
      if (data.hanhai) hanhaiStore.deserialize(data.hanhai)
      if (data.fishPond) fishPondStore.deserialize(data.fishPond)
      if (data.tutorial) tutorialStore.deserialize(data.tutorial)
      if (data.hiddenNpc) hiddenNpcStore.deserialize(data.hiddenNpc)
      if (data.bank) bankStore.deserialize(data.bank)
      if (data.tavern) tavernStore.deserialize(data.tavern)
      else tavernStore.deserialize({})
      const forgeStore = useForgeStore()
      if (data.forge) forgeStore.deserialize(data.forge)
      else forgeStore.deserialize(undefined)
      forgeStore.migrateFromDefeatedBosses(miningStore.defeatedBosses)
      const systemStore = useSystemStore()
      activeSlot.value = slot
      if (data.system) systemStore.deserialize(data.system, slot)
      if (systemStore.awakened) {
        systemStore.reconcileQuestsOnLoad(gameStore.day)
        systemStore.onSaveLoaded()
      }
      if (!tutorialStore.getFlag('cooking_exp_migrated')) {
        if (skillStore.migrateCookingExpFromRecipes(achievementStore.stats.totalRecipesCooked, false)) {
          tutorialStore.setFlag('cooking_exp_migrated', true)
        }
      }
      return true
    } catch {
      return false
    }
  }

  /** 删除指定槽位 */
  const deleteSlot = (slot: number): boolean => {
    if (slot < 0 || slot >= MAX_SLOTS) return false
    localStorage.removeItem(`${SAVE_KEY_PREFIX}${slot}`)
    if (activeSlot.value === slot) activeSlot.value = -1
    return true
  }

  /** 导出存档为加密文件 */
  const exportSave = (slot: number): boolean => {
    try {
      const raw = localStorage.getItem(`${SAVE_KEY_PREFIX}${slot}`)
      if (!raw) return false
      const blob = new Blob([raw], { type: 'application/octet-stream' })
      const info = getSlots().find(s => s.slot === slot)
      const name = info?.exists
        ? `桃源乡_存档${slot + 1}_第${info.year}年${SEASON_NAMES[info.season as keyof typeof SEASON_NAMES] ?? info.season}第${info.day}天`
        : `桃源乡_存档${slot + 1}`
      saveAs(blob, `${name}${SAVE_FILE_EXT}`)
      return true
    } catch {
      return false
    }
  }

  /** 从文件导入存档到指定槽位 */
  const importSave = (slot: number, fileContent: string): boolean => {
    if (slot < 0 || slot >= MAX_SLOTS) return false
    try {
      // 验证文件内容可解密
      const data = parseSaveData(fileContent)
      if (!data) return false
      localStorage.setItem(`${SAVE_KEY_PREFIX}${slot}`, fileContent)
      return true
    } catch {
      return false
    }
  }

  /** 生成设备 ID 指纹（浏览器特征哈希，无需登录） */
  const getDeviceId = (): string => {
    const key = 'taoyuan_device_id'
    const stored = localStorage.getItem(key)
    if (stored) return stored
    // 首次生成：基于 screen + navigator + timezone 等浏览器指纹
    const fp = [
      navigator.hardwareConcurrency,
      navigator.maxTouchPoints,
      screen.colorDepth,
      screen.width + 'x' + screen.height,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      navigator.language
    ].join('|')
    const hash = CryptoJS.SHA256(fp).toString().slice(0, 16)
    localStorage.setItem(key, hash)
    return hash
  }

  const systemStore = useSystemStore()

  const BACKEND_URL = getBackendUrl()

  /** 云端备份状态（从系统Store读取，随存档持久化） */
  const cloudBackupEnabled = computed(() => systemStore.cloudBackupEnabled)

  const toggleCloudBackup = () => {
    systemStore.cloudBackupEnabled = !systemStore.cloudBackupEnabled
  }

  /** 后端 API 公共请求 */
  const apiFetch = async (path: string, options?: RequestInit): Promise<any> => {
    try {
      const res = await fetch(`${BACKEND_URL}${path}`, {
        ...options,
        headers: { 'Content-Type': 'application/json', ...options?.headers }
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        throw new Error(err.error ?? `请求失败 (${res.status})`)
      }
      return res.json()
    } catch (e: any) {
      console.warn('[CloudSave]', e.message)
      return null
    }
  }

  /** 上传存档到云端 */
  const uploadToCloud = async (slot: number): Promise<boolean> => {
    const raw = localStorage.getItem(`${SAVE_KEY_PREFIX}${slot}`)
    if (!raw) return false
    const deviceId = getDeviceId()
    const result = await apiFetch('/api/v1/saves/upload', {
      method: 'POST',
      body: JSON.stringify({ deviceId, slot, data: raw })
    })
    return result?.status === 'ok'
  }

  /** 从云端下载存档到本地 */
  const downloadFromCloud = async (slot: number): Promise<boolean> => {
    const deviceId = getDeviceId()
    const result = await apiFetch(`/api/v1/saves/${slot}/download?deviceId=${encodeURIComponent(deviceId)}`)
    if (!result?.data) return false
    localStorage.setItem(`${SAVE_KEY_PREFIX}${slot}`, result.data)
    return true
  }

  /** 删除云端存档 */
  const deleteCloudSave = async (slot: number): Promise<boolean> => {
    const deviceId = getDeviceId()
    const result = await apiFetch(`/api/v1/saves/${slot}?deviceId=${encodeURIComponent(deviceId)}`, {
      method: 'DELETE'
    })
    return result?.status === 'ok'
  }

  /** 列出云端存档 */
  const listCloudSaves = async (): Promise<{ slot: number; updatedAt: string }[]> => {
    const deviceId = getDeviceId()
    const result = await apiFetch(`/api/v1/saves?deviceId=${encodeURIComponent(deviceId)}`)
    return result ?? []
  }

  /** 比较本地与云端存档时间 */
  const compareCloudWithLocal = async (slot: number): Promise<CloudConflictStatus> => {
    const raw = localStorage.getItem(`${SAVE_KEY_PREFIX}${slot}`)
    if (!raw) return 'no_local'
    const localData = parseSaveData(raw)
    if (!localData?.savedAt) return 'no_local'

    const deviceId = getDeviceId()
    const cloudList = await listCloudSaves()
    const cloud = cloudList.find(s => s.slot === slot)
    if (!cloud?.updatedAt) return 'no_cloud'

    const localMs = new Date(localData.savedAt as string).getTime()
    const cloudMs = new Date(cloud.updatedAt).getTime()
    if (Math.abs(localMs - cloudMs) < 2000) return 'synced'
    return cloudMs > localMs ? 'cloud_newer' : 'local_newer'
  }

  /** 冲突解决：上传本地覆盖云端，或下载云端覆盖本地 */
  const resolveCloudConflict = async (slot: number, choice: 'local' | 'cloud'): Promise<boolean> => {
    if (choice === 'cloud') return downloadFromCloud(slot)
    return uploadToCloud(slot)
  }

  return {
    activeSlot,
    getSlots,
    assignNewSlot,
    saveToSlot,
    autoSave,
    loadFromSlot,
    deleteSlot,
    exportSave,
    importSave,
    getDeviceId,
    cloudBackupEnabled,
    toggleCloudBackup,
    uploadToCloud,
    downloadFromCloud,
    deleteCloudSave,
    listCloudSaves,
    compareCloudWithLocal,
    resolveCloudConflict
  }
})
