import { ref } from "vue";
import Qmsg from "qmsg";

export type FloatColor = "danger" | "success" | "accent" | "water";

export interface LogEntry {
  id: number;
  /** Who is speaking (e.g. 叙事, 系统, 玩家). Optional. */
  speaker?: string;
  /** Real-world time when the message was added. Omitted on legacy entries. */
  time?: Date;
  text: string;
}

const MAX_LOG_ENTRIES = 100;
let logIdNext = 0;
const logEntries = ref<LogEntry[]>([]);

export interface QmsgConfigOptions {
  position: string;
  timeout: number;
  maxNums: number;
  isLimitWidth: boolean;
  limitWidthNum: number;
  limitWidthWrap: "no-wrap" | "wrap" | "ellipsis";
  animation: boolean;
  autoClose: boolean;
  showClose: boolean;
  showIcon: boolean;
  showReverse: boolean;
}

// 配置 Qmsg 全局样式
Qmsg.config({
  position: "top",
  showIcon: false,
  maxNums: 5,
  timeout: 2500,
  useShadowRoot: false,
});

/** 动态更新 Qmsg 全部通知配置 */
export const applyQmsgConfig = (opts: QmsgConfigOptions) => {
  Qmsg.config({
    position: opts.position as "top",
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
    useShadowRoot: false,
  });
};

// 天赋检查回调 — 由 useDialogs 注册以避免循环导入
let _perkChecker: (() => void) | null = null;

/** 注册天赋检查回调（useDialogs 初始化时调用） */
export const _registerPerkChecker = (fn: () => void) => {
  _perkChecker = fn;
};

export interface AddLogOptions {
  /** Who is speaking. Optional. */
  speaker?: string;
}

/** 添加日志消息（追加到历史并显示为 toast 通知） */
export const addLog = (msg: string, options?: AddLogOptions) => {
  const entry: LogEntry = {
    id: ++logIdNext,
    speaker: options?.speaker,
    time: new Date(),
    text: msg,
  };
  logEntries.value = [...logEntries.value.slice(-(MAX_LOG_ENTRIES - 1)), entry];
  Qmsg.info(msg);
  _perkChecker?.();
};

/** 显示浮动文本反馈（显示为 toast 通知） */
export const showFloat = (text: string, color: FloatColor = "accent") => {
  switch (color) {
    case "danger":
      Qmsg.error(text, { timeout: 1500 });
      break;
    case "success":
      Qmsg.success(text, { timeout: 1500 });
      break;
    case "accent":
      Qmsg.warning(text, { timeout: 1500 });
      break;
    case "water":
      Qmsg.info(text, { timeout: 1500 });
      break;
  }
};

/** 重置日志（新游戏） */
export const resetLogs = () => {
  logEntries.value = [];
  Qmsg.closeAll();
};

export const useGameLog = () => {
  return {
    logEntries,
    addLog,
    showFloat,
    resetLogs,
  };
};
