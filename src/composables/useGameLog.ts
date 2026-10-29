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
  isHTML: true,
  useShadowRoot: false
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

/**
 * 主动触发一次天赋检查。
 * 供技能升级时直接调用：矿洞里的挖矿/战斗不经过 addLog，
 * 否则升到 5/10 级后专精弹窗要等玩家离开矿洞才弹出来，
 * 造成「选完专精就出矿洞」的错觉。
 */
export const triggerPerkCheck = () => {
  _perkChecker?.()
}

// === 日志历史记录（内存中，不存档，刷新页面清空） ===

export interface LogEntry {
  msg: string
  dayLabel: string
}

/** 全部日志历史 */
export const logHistory = ref<LogEntry[]>([])

/** 天数标签获取器 — 由 App 启动时注册以避免循环导入 */
let _dayLabelGetter: (() => string) | null = null

/** 注册天数标签获取器（App 初始化时调用） */
export const _registerDayLabelGetter = (fn: () => string) => {
  _dayLabelGetter = fn
}

/** 日志历史最大条数，超出后从头部裁剪 */
const LOG_HISTORY_MAX = 300

/** 添加日志消息（显示为 toast 通知，同时记录到历史） */
export const addLog = (msg: string) => {
  Qmsg.info(msg)
  const dayLabel = _dayLabelGetter?.() ?? ''
  logHistory.value.push({ msg, dayLabel })
  // 防止长时间游玩导致日志无限堆积，只保留最近 300 条
  if (logHistory.value.length > LOG_HISTORY_MAX) {
    logHistory.value.splice(0, logHistory.value.length - LOG_HISTORY_MAX)
  }
  _perkChecker?.()
}

/** 显示浮动文本反馈（显示为 toast 通知） */
export const showFloat = (text: string, color: FloatColor = 'accent') => {
  switch (color) {
    case 'danger':
      Qmsg.error(text, { timeout: 1500 })
      break
    case 'success':
      Qmsg.success(text, { timeout: 1500 })
      break
    case 'accent':
      Qmsg.warning(text, { timeout: 1500 })
      break
    case 'water':
      Qmsg.info(text, { timeout: 1500 })
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
