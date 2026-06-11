import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useAudio } from '@/composables/useAudio'
import { getThemeByKey, hexToRgb, type ThemeKey } from '@/data/themes'
import { applyQmsgConfig } from '@/composables/useGameLog'
import type { SystemChatDisplayMode, SystemChatKindFilter } from '@/composables/useSystemChatGroups'
import type { ItemCategory } from '@/types'

export type QmsgPosition = 'topleft' | 'top' | 'topright' | 'left' | 'center' | 'right' | 'bottomleft' | 'bottom' | 'bottomright'
export type QmsgLimitWidthWrap = 'no-wrap' | 'wrap' | 'ellipsis'

const DEFAULT_FONT_SIZE = 16
const DEFAULT_THEME: ThemeKey = 'dark'
const DEFAULT_QMSG_POSITION: QmsgPosition = 'top'
const DEFAULT_SYSTEM_CHAT_DISPLAY_MODE: SystemChatDisplayMode = 'sectioned'
const DEFAULT_SYSTEM_CHAT_KIND_FILTER: SystemChatKindFilter = 'all'
const DEFAULT_SYSTEM_BUBBLE_ENABLED = true
const DEFAULT_SYSTEM_BUBBLE_AUTO_CLOSE = true
const DEFAULT_SYSTEM_BUBBLE_AUTO_CLOSE_MS = 1000

export const useSettingsStore = defineStore('settings', () => {
  const fontSize = ref(DEFAULT_FONT_SIZE)
  const theme = ref<ThemeKey>(DEFAULT_THEME)
  const qmsgPosition = ref<QmsgPosition>(DEFAULT_QMSG_POSITION)
  const qmsgTimeout = ref(2500)
  const qmsgMaxNums = ref(5)
  const qmsgIsLimitWidth = ref(true)
  const qmsgLimitWidthNum = ref(200)
  const qmsgLimitWidthWrap = ref<QmsgLimitWidthWrap>('wrap')
  const qmsgAnimation = ref(true)
  const qmsgAutoClose = ref(true)
  const qmsgShowClose = ref(false)
  const qmsgShowIcon = ref(false)
  const qmsgShowReverse = ref(false)
  const qmsgListenEventToPauseAutoClose = ref(true)

  /** 系统聊天展示：分类（碎碎念/提示/对话分区）或时间线（混合排序） */
  const systemChatDisplayMode = ref<SystemChatDisplayMode>(DEFAULT_SYSTEM_CHAT_DISPLAY_MODE)

  /** 系统聊天类型筛选 */
  const systemChatKindFilter = ref<SystemChatKindFilter>(DEFAULT_SYSTEM_CHAT_KIND_FILTER)

  /** 系统碎碎念气泡：总开关 */
  const systemBubbleEnabled = ref(DEFAULT_SYSTEM_BUBBLE_ENABLED)

  /** 系统碎碎念气泡：自动关闭 */
  const systemBubbleAutoClose = ref(DEFAULT_SYSTEM_BUBBLE_AUTO_CLOSE)

  /** 系统碎碎念气泡：自动关闭时长（毫秒） */
  const systemBubbleAutoCloseMs = ref(DEFAULT_SYSTEM_BUBBLE_AUTO_CLOSE_MS)

  /** 背包物品筛选：选中的分类（空数组 = 显示全部） */
  const inventoryFilter = ref<ItemCategory[]>([])

  /** 物品收集路由：itemId → shipping | warehouse（未配置 = 进背包） */
  const itemCollectRoutes = ref<Record<string, 'shipping' | 'warehouse'>>({})

  const getItemCollectRoute = (itemId: string): 'none' | 'shipping' | 'warehouse' => {
    return itemCollectRoutes.value[itemId] ?? 'none'
  }

  const setItemCollectRoute = (itemId: string, route: 'none' | 'shipping' | 'warehouse') => {
    if (route === 'none') {
      delete itemCollectRoutes.value[itemId]
    } else {
      itemCollectRoutes.value[itemId] = route
    }
  }

  const cycleItemCollectRoute = (itemId: string) => {
    const current = getItemCollectRoute(itemId)
    const next = current === 'none' ? 'shipping' : current === 'shipping' ? 'warehouse' : 'none'
    setItemCollectRoute(itemId, next)
  }

  const applyFontSize = () => {
    document.documentElement.style.fontSize = fontSize.value + 'px'
  }

  const applyTheme = () => {
    const t = getThemeByKey(theme.value)
    document.documentElement.style.setProperty('--color-bg', hexToRgb(t.bg))
    document.documentElement.style.setProperty('--color-panel', hexToRgb(t.panel))
    document.documentElement.style.setProperty('--color-text', hexToRgb(t.text))
  }

  const changeFontSize = (delta: number) => {
    fontSize.value = Math.min(24, Math.max(12, fontSize.value + delta))
    applyFontSize()
  }

  const changeTheme = (key: ThemeKey) => {
    theme.value = key
    applyTheme()
  }

  const changeSystemChatDisplayMode = (mode: SystemChatDisplayMode) => {
    systemChatDisplayMode.value = mode
  }

  const changeSystemChatKindFilter = (filter: SystemChatKindFilter) => {
    systemChatKindFilter.value = filter
  }

  const changeSystemBubbleEnabled = (enabled: boolean) => {
    systemBubbleEnabled.value = enabled
  }

  const changeSystemBubbleAutoClose = (enabled: boolean) => {
    systemBubbleAutoClose.value = enabled
  }

  const changeSystemBubbleAutoCloseMs = (delta: number) => {
    systemBubbleAutoCloseMs.value = Math.min(10000, Math.max(500, systemBubbleAutoCloseMs.value + delta))
  }

  const changeQmsgPosition = (pos: QmsgPosition) => {
    qmsgPosition.value = pos
    syncQmsgConfig()
  }

  /** 将当前所有通知设置同步到 Qmsg */
  const syncQmsgConfig = () => {
    applyQmsgConfig({
      position: qmsgPosition.value,
      timeout: qmsgTimeout.value,
      maxNums: qmsgMaxNums.value,
      isLimitWidth: qmsgIsLimitWidth.value,
      limitWidthNum: qmsgLimitWidthNum.value,
      limitWidthWrap: qmsgLimitWidthWrap.value,
      animation: qmsgAnimation.value,
      autoClose: qmsgAutoClose.value,
      showClose: qmsgShowClose.value,
      showIcon: qmsgShowIcon.value,
      showReverse: qmsgShowReverse.value,
      listenEventToPauseAutoClose: qmsgListenEventToPauseAutoClose.value
    })
  }

  const serialize = () => {
    const { sfxEnabled, bgmEnabled } = useAudio()
    return {
      fontSize: fontSize.value,
      sfxEnabled: sfxEnabled.value,
      bgmEnabled: bgmEnabled.value,
      theme: theme.value,
      qmsgPosition: qmsgPosition.value,
      qmsgTimeout: qmsgTimeout.value,
      qmsgMaxNums: qmsgMaxNums.value,
      qmsgIsLimitWidth: qmsgIsLimitWidth.value,
      qmsgLimitWidthNum: qmsgLimitWidthNum.value,
      qmsgLimitWidthWrap: qmsgLimitWidthWrap.value,
      qmsgAnimation: qmsgAnimation.value,
      qmsgAutoClose: qmsgAutoClose.value,
      qmsgShowClose: qmsgShowClose.value,
      qmsgShowIcon: qmsgShowIcon.value,
      qmsgShowReverse: qmsgShowReverse.value,
      inventoryFilter: inventoryFilter.value,
      itemCollectRoutes: itemCollectRoutes.value,
      systemChatDisplayMode: systemChatDisplayMode.value,
      systemChatKindFilter: systemChatKindFilter.value,
      systemBubbleEnabled: systemBubbleEnabled.value,
      systemBubbleAutoClose: systemBubbleAutoClose.value,
      systemBubbleAutoCloseMs: systemBubbleAutoCloseMs.value
    }
  }

  const deserialize = (data: any) => {
    fontSize.value = data?.fontSize ?? DEFAULT_FONT_SIZE
    applyFontSize()
    theme.value = data?.theme ?? DEFAULT_THEME
    applyTheme()
    qmsgPosition.value = data?.qmsgPosition ?? DEFAULT_QMSG_POSITION
    qmsgTimeout.value = data?.qmsgTimeout ?? 2500
    qmsgMaxNums.value = data?.qmsgMaxNums ?? 5
    qmsgIsLimitWidth.value = data?.qmsgIsLimitWidth ?? true
    qmsgLimitWidthNum.value = data?.qmsgLimitWidthNum ?? 200
    qmsgLimitWidthWrap.value = data?.qmsgLimitWidthWrap ?? 'wrap'
    qmsgAnimation.value = data?.qmsgAnimation ?? true
    qmsgAutoClose.value = data?.qmsgAutoClose ?? true
    qmsgShowClose.value = data?.qmsgShowClose ?? false
    qmsgShowIcon.value = data?.qmsgShowIcon ?? false
    qmsgShowReverse.value = data?.qmsgShowReverse ?? false
    inventoryFilter.value = data?.inventoryFilter ?? []
    itemCollectRoutes.value = data?.itemCollectRoutes ?? {}
    systemChatDisplayMode.value = data?.systemChatDisplayMode ?? DEFAULT_SYSTEM_CHAT_DISPLAY_MODE
    systemChatKindFilter.value = data?.systemChatKindFilter ?? DEFAULT_SYSTEM_CHAT_KIND_FILTER
    systemBubbleEnabled.value = data?.systemBubbleEnabled ?? DEFAULT_SYSTEM_BUBBLE_ENABLED
    systemBubbleAutoClose.value = data?.systemBubbleAutoClose ?? DEFAULT_SYSTEM_BUBBLE_AUTO_CLOSE
    systemBubbleAutoCloseMs.value = data?.systemBubbleAutoCloseMs ?? DEFAULT_SYSTEM_BUBBLE_AUTO_CLOSE_MS
    syncQmsgConfig()
    const { sfxEnabled, bgmEnabled } = useAudio()
    sfxEnabled.value = data?.sfxEnabled ?? true
    bgmEnabled.value = data?.bgmEnabled ?? true
  }

  // 初始化时立即同步到 Qmsg，确保新游戏/首次加载也能生效
  syncQmsgConfig()
  applyFontSize()
  applyTheme()

  return {
    fontSize,
    theme,
    qmsgPosition,
    qmsgTimeout,
    qmsgMaxNums,
    qmsgIsLimitWidth,
    qmsgLimitWidthNum,
    qmsgLimitWidthWrap,
    qmsgAnimation,
    qmsgAutoClose,
    qmsgShowClose,
    qmsgShowIcon,
    qmsgShowReverse,
    systemChatDisplayMode,
    systemChatKindFilter,
    systemBubbleEnabled,
    systemBubbleAutoClose,
    systemBubbleAutoCloseMs,
    inventoryFilter,
    itemCollectRoutes,
    getItemCollectRoute,
    setItemCollectRoute,
    cycleItemCollectRoute,
    changeFontSize,
    changeTheme,
    changeSystemChatDisplayMode,
    changeSystemChatKindFilter,
    changeSystemBubbleEnabled,
    changeSystemBubbleAutoClose,
    changeSystemBubbleAutoCloseMs,
    changeQmsgPosition,
    syncQmsgConfig,
    applyFontSize,
    applyTheme,
    serialize,
    deserialize
  }
})
