import { ref } from 'vue'
import { Capacitor, registerPlugin } from '@capacitor/core'

// ── Capacitor Plugin 接口声明 ────────────────────────────────────

interface CloudSavePlugin {
  uploadSave(options: { slot: number; data: string }): Promise<{ success: boolean }>
  downloadSave(options: { slot: number }): Promise<{ data: string | null }>
  login(): Promise<{ success: boolean; name?: string }>
  logout(): Promise<{ success: boolean }>
  getLoginStatus(): Promise<{ loggedIn: boolean; name?: string }>
  requestReview(): Promise<{ success: boolean }>
}

// 注册 Native Plugin（Android 侧 CloudSavePlugin.java）
const CloudSave = registerPlugin<CloudSavePlugin>('CloudSave')

// ── 响应式状态（模块级单例） ───────────────────────────────────────

export type CloudSyncStatus = 'idle' | 'syncing' | 'error' | 'success'

const isCloudAvailable = ref(false)
const cloudSyncStatus = ref<CloudSyncStatus>('idle')

// ── 公共 API ──────────────────────────────────────────────────────

/** 检测 TDS 云存档是否可用（仅安卓原生端） */
const checkAvailability = (): boolean => {
  const available = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'
  isCloudAvailable.value = available
  return available
}

/**
 * 上传加密存档到云端
 * @param slot 槽位编号 0-2
 * @param encryptedData localStorage 里的原始加密字符串
 */
const uploadSave = async (slot: number, encryptedData: string): Promise<boolean> => {
  if (!checkAvailability()) return false
  try {
    cloudSyncStatus.value = 'syncing'
    const result = await CloudSave.uploadSave({ slot, data: encryptedData })
    cloudSyncStatus.value = result.success ? 'success' : 'error'
    return result.success
  } catch {
    cloudSyncStatus.value = 'error'
    return false
  }
}

/**
 * 从云端下载加密存档
 * @param slot 槽位编号 0-2
 * @returns 原始加密字符串，云端无存档返回 null
 */
const downloadSave = async (slot: number): Promise<string | null> => {
  if (!checkAvailability()) return null
  try {
    cloudSyncStatus.value = 'syncing'
    const result = await CloudSave.downloadSave({ slot })
    cloudSyncStatus.value = result.data !== null ? 'success' : 'idle'
    return result.data
  } catch {
    cloudSyncStatus.value = 'error'
    return null
  }
}

/** 发起 TapTap 登录 */
const login = async (): Promise<{ success: boolean; name?: string }> => {
  if (!checkAvailability()) return { success: false }
  try {
    return await CloudSave.login()
  } catch {
    return { success: false }
  }
}

/** 登出 */
const logout = async (): Promise<boolean> => {
  if (!checkAvailability()) return false
  try {
    await CloudSave.logout()
    return true
  } catch {
    return false
  }
}

/** 获取当前登录状态 */
const getLoginStatus = async (): Promise<{ loggedIn: boolean; name?: string }> => {
  if (!checkAvailability()) return { loggedIn: false }
  try {
    return await CloudSave.getLoginStatus()
  } catch {
    return { loggedIn: false }
  }
}

/** 唤起 TapTap 评价弹窗 */
const requestReview = async (): Promise<boolean> => {
  if (!checkAvailability()) return false
  try {
    const result = await CloudSave.requestReview()
    return result.success
  } catch {
    return false
  }
}

export const useTapTapCloud = () => ({
  isCloudAvailable,
  cloudSyncStatus,
  checkAvailability,
  uploadSave,
  downloadSave,
  login,
  logout,
  getLoginStatus,
  requestReview,
})
