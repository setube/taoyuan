import { ref } from 'vue'
import Qmsg from 'qmsg'

export type FloatColor = 'danger' | 'success' | 'accent' | 'water'

export interface QmsgConfigOptions {
  position: string
  timeout: number
  maxNums: number
  isLimitWidth: boolean
  limitWidthNum: number
  limitWidthWrap: 'no-wrap' | 'wrap' | 'ellipsis'
  animation: boolean
  autoClose: boolean
  listenEventToPauseAutoClose?: boolean
  showClose: boolean
  showIcon: boolean
  showReverse: boolean
}

// 配置 Qmsg 全局样式
Qmsg.config({
  position: 'top',
  showIcon: false,
  maxNums: 5,
  timeout: 2500,
  autoClose: true,
  listenEventToPauseAutoClose: true,
  isHTML: true,
  useShadowRoot: false
})

const toastOpts = (timeout = 2500) => ({
  timeout,
  autoClose: true,
  listenEventToPauseAutoClose: true
})

/** 动态更新 Qmsg 全部通知配置 */
export const applyQmsgConfig = (opts: QmsgConfigOptions) => {
  Qmsg.config({
    isHTML: true,
    position: opts.position as 'top',
    timeout: opts.timeout,
    maxNums: opts.maxNums,
    isLimitWidth: opts.isLimitWidth,
    limitWidthNum: opts.limitWidthNum,
    limitWidthWrap: opts.limitWidthWrap,
    animation: opts.animation,
    autoClose: opts.autoClose,
    listenEventToPauseAutoClose: opts.listenEventToPauseAutoClose ?? false,
    showClose: opts.showClose,
    showIcon: opts.showIcon,
    showReverse: opts.showReverse,
    useShadowRoot: false
  })
}

// 天赋检查回调 — 由 useDialogs 注册以避免循环导入
let _perkChecker: (() => void) | null = null

/** 注册天赋检查回调（useDialogs 初始化时调用） */
export const _registerPerkChecker = (fn: () => void) => {
  _perkChecker = fn
}

// === 日志历史记录（内存中，不存档，刷新页面清空） ===

export interface LogEntry {
  msg: string
  dayLabel: string
}

/** 全部日志历史 */
export const logHistory = ref<LogEntry[]>([])

/** 天数标签获取器 — 由 GameLayout 注册以避免循环导入 */
let _dayLabelGetter: (() => string) | null = null

/** 注册天数标签获取器（GameLayout 初始化时调用） */
export const _registerDayLabelGetter = (fn: () => string) => {
  _dayLabelGetter = fn
}

/** 添加日志消息（显示为 toast 通知，同时记录到历史） */
export const addLog = (msg: string) => {
  Qmsg.info(msg, toastOpts())
  const dayLabel = _dayLabelGetter?.() ?? ''
  logHistory.value.push({ msg, dayLabel })
  _perkChecker?.()
}

/** 显示浮动文本反馈（显示为 toast 通知） */
export const showFloat = (text: string, color: FloatColor = 'accent') => {
  const opts = toastOpts(1500)
  switch (color) {
    case 'danger':
      Qmsg.error(text, opts)
      break
    case 'success':
      Qmsg.success(text, opts)
      break
    case 'accent':
      Qmsg.warning(text, opts)
      break
    case 'water':
      Qmsg.info(text, opts)
      break
  }
}

/** 重置日志（新游戏） */
export const resetLogs = () => {
  Qmsg.closeAll()
}

/** 清空全部日志历史 */
export const clearAllLogs = () => {
  logHistory.value = []
}

/** 清空指定天的日志 */
export const clearDayLogs = (dayLabel: string) => {
  logHistory.value = logHistory.value.filter(e => e.dayLabel !== dayLabel)
}

export const useGameLog = () => {
  return {
    addLog,
    showFloat,
    resetLogs,
    clearAllLogs,
    clearDayLogs,
    logHistory
  }
}
