import { ref } from "vue";
import { defineStore } from "pinia";
import { useAudio } from "@/composables/useAudio";
import { getThemeByKey, type ThemeKey } from "@/data/themes";
import { applyQmsgConfig } from "@/composables/useGameLog";

export type QmsgPosition =
  | "topleft"
  | "top"
  | "topright"
  | "left"
  | "center"
  | "right"
  | "bottomleft"
  | "bottom"
  | "bottomright";
export type QmsgLimitWidthWrap = "no-wrap" | "wrap" | "ellipsis";

const DEFAULT_FONT_SIZE = 16;
const DEFAULT_THEME: ThemeKey = "dark";
const DEFAULT_QMSG_POSITION: QmsgPosition = "bottom";

const DEV_MODE_KEY = "taoyuan_dev_mode";

export const useSettingsStore = defineStore("settings", () => {
  const fontSize = ref(DEFAULT_FONT_SIZE);
  /** Developer mode: shown on main menu, persists in localStorage (not in save). */
  const developerMode = ref(localStorage.getItem(DEV_MODE_KEY) === "1");
  const theme = ref<ThemeKey>(DEFAULT_THEME);
  const qmsgPosition = ref<QmsgPosition>(DEFAULT_QMSG_POSITION);
  const qmsgTimeout = ref(2500);
  const qmsgMaxNums = ref(5);
  const qmsgIsLimitWidth = ref(true);
  const qmsgLimitWidthNum = ref(200);
  const qmsgLimitWidthWrap = ref<QmsgLimitWidthWrap>("wrap");
  const qmsgAnimation = ref(true);
  const qmsgAutoClose = ref(true);
  const qmsgShowClose = ref(false);
  const qmsgShowIcon = ref(false);
  const qmsgShowReverse = ref(false);

  const applyFontSize = () => {
    document.documentElement.style.fontSize = fontSize.value + "px";
  };

  const applyTheme = () => {
    const t = getThemeByKey(theme.value);
    document.documentElement.style.setProperty("--color-bg", t.bg);
    document.documentElement.style.setProperty("--color-panel", t.panel);
    document.documentElement.style.setProperty("--color-text", t.text);
    if (t.accent != null)
      document.documentElement.style.setProperty("--color-accent", t.accent);
    else document.documentElement.style.removeProperty("--color-accent");
    if (t.danger != null)
      document.documentElement.style.setProperty("--color-danger", t.danger);
    else document.documentElement.style.removeProperty("--color-danger");
    if (t.success != null)
      document.documentElement.style.setProperty("--color-success", t.success);
    else document.documentElement.style.removeProperty("--color-success");
    if (t.muted != null)
      document.documentElement.style.setProperty("--color-muted", t.muted);
    else document.documentElement.style.removeProperty("--color-muted");
  };

  const changeFontSize = (delta: number) => {
    fontSize.value = Math.min(24, Math.max(12, fontSize.value + delta));
    applyFontSize();
  };

  const changeTheme = (key: ThemeKey) => {
    theme.value = key;
    applyTheme();
  };

  const setDeveloperMode = (on: boolean) => {
    developerMode.value = on;
    if (on) localStorage.setItem(DEV_MODE_KEY, "1");
    else localStorage.removeItem(DEV_MODE_KEY);
  };

  const changeQmsgPosition = (pos: QmsgPosition) => {
    qmsgPosition.value = pos;
    syncQmsgConfig();
  };

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
    });
  };

  const serialize = () => {
    const { sfxEnabled, bgmEnabled } = useAudio();
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
    };
  };

  const deserialize = (data: any) => {
    fontSize.value = data?.fontSize ?? DEFAULT_FONT_SIZE;
    applyFontSize();
    theme.value = data?.theme ?? DEFAULT_THEME;
    applyTheme();
    qmsgPosition.value = data?.qmsgPosition ?? DEFAULT_QMSG_POSITION;
    qmsgTimeout.value = data?.qmsgTimeout ?? 2500;
    qmsgMaxNums.value = data?.qmsgMaxNums ?? 5;
    qmsgIsLimitWidth.value = data?.qmsgIsLimitWidth ?? true;
    qmsgLimitWidthNum.value = data?.qmsgLimitWidthNum ?? 200;
    qmsgLimitWidthWrap.value = data?.qmsgLimitWidthWrap ?? "wrap";
    qmsgAnimation.value = data?.qmsgAnimation ?? true;
    qmsgAutoClose.value = data?.qmsgAutoClose ?? true;
    qmsgShowClose.value = data?.qmsgShowClose ?? false;
    qmsgShowIcon.value = data?.qmsgShowIcon ?? false;
    qmsgShowReverse.value = data?.qmsgShowReverse ?? false;
    syncQmsgConfig();
    const { sfxEnabled, bgmEnabled } = useAudio();
    sfxEnabled.value = data?.sfxEnabled ?? false;
    bgmEnabled.value = data?.bgmEnabled ?? false;
  };

  return {
    fontSize,
    developerMode,
    setDeveloperMode,
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
    changeFontSize,
    changeTheme,
    changeQmsgPosition,
    syncQmsgConfig,
    applyFontSize,
    applyTheme,
    serialize,
    deserialize,
  };
});
