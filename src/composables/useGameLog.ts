import { ref } from "vue";
import Qmsg from "qmsg";
import { usePlayerStore } from "@/stores/usePlayerStore";

export type FloatColor = "danger" | "success" | "accent" | "water";

/** Default speaker when none is provided (narrator / void voice). */
export const DEFAULT_SPEAKER = "旁白";

/** Style variant for a log line (e.g. narrator text before a choice). */
export type LogEntryVariant = "default" | "narrator-before-choice";

export interface LogEntry {
  id: number;
  /** Who is speaking (e.g. 叙事, 系统, 玩家). Optional. */
  speaker?: string;
  /** Real-world time when the message was added. Omitted on legacy entries. */
  time?: Date;
  text: string;
  /** Optional style variant (e.g. color the line differently). */
  variant?: LogEntryVariant;
}

const MAX_LOG_ENTRIES = 100;
let logIdNext = 0;
const logEntries = ref<LogEntry[]>([]);

export interface PendingChoice {
  options: [string, string, string];
  resolve: (index: number) => void;
  reject: (err: unknown) => void;
  speaker: string;
}

const pendingChoice = ref<PendingChoice | null>(null);

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
  /** Optional style variant for this line. */
  variant?: LogEntryVariant;
}

/** 添加日志消息（追加到历史并显示为 toast 通知） */
export const addLog = (msg: string, options?: AddLogOptions) => {
  const entry: LogEntry = {
    id: ++logIdNext,
    speaker: options?.speaker ?? DEFAULT_SPEAKER,
    time: new Date(),
    text: msg,
    variant: options?.variant,
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

/**
 * Show a three-option choice attributed to the main character.
 * User presses 1, 2, or 3 to pick. Returns the chosen index (0, 1, or 2).
 * Call resolveChoice(index) from the UI when the user presses a key.
 */
export function showChoice(
  options: [string, string, string],
  speaker?: string,
): Promise<number> {
  if (pendingChoice.value) {
    pendingChoice.value.reject(new Error("Choice already pending"));
    pendingChoice.value = null;
    return Promise.reject(new Error("Choice already pending"));
  }
  const playerName = speaker ?? usePlayerStore().playerName;
  return new Promise<number>((resolve, reject) => {
    pendingChoice.value = {
      options,
      resolve,
      reject,
      speaker: playerName,
    };
  });
}

/**
 * Resolve the current choice with the given index (0, 1, or 2).
 * Adds a log entry for the chosen option and clears the pending choice.
 * Called by GameLogPanel when user presses 1/2/3 or clicks an option.
 */
export function resolveChoice(index: number): void {
  const choice = pendingChoice.value;
  if (!choice || index < 0 || index > 2) return;
  const text = choice.options[index];
  addLog(text, { speaker: choice.speaker });
  choice.resolve(index);
  pendingChoice.value = null;
}

export interface RunChoiceSceneOptions {
  /** Narrator (旁白) text shown before the choice; styled as pre-choice flavor. */
  flavorText: string;
  /** Three options for the player (main character). */
  options: [string, string, string];
  /** Optional follow-up lines; [index] is logged after the choice. */
  followUps?: [string, string, string];
  /** Speaker for the choice line; defaults to player name. */
  speaker?: string;
}

/**
 * Reusable choice scene: log flavor text (styled as pre-choice), show choice,
 * then optionally log the chosen follow-up. Returns the chosen index (0–2).
 */
export async function runChoiceScene(
  opts: RunChoiceSceneOptions,
): Promise<number> {
  addLog(opts.flavorText, { variant: "narrator-before-choice" });
  try {
    const index = await showChoice(opts.options, opts.speaker);
    if (opts.followUps) {
      addLog(opts.followUps[index]);
    }
    return index;
  } catch {
    return -1;
  }
}

/** 重置日志（新游戏） */
export const resetLogs = () => {
  if (pendingChoice.value) {
    pendingChoice.value.reject(new Error("Log reset"));
    pendingChoice.value = null;
  }
  logEntries.value = [];
  Qmsg.closeAll();
};

export const useGameLog = () => {
  return {
    logEntries,
    pendingChoice,
    addLog,
    showFloat,
    showChoice,
    resolveChoice,
    runChoiceScene,
    resetLogs,
  };
};
