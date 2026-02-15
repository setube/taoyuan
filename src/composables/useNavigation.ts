import type { Component } from "vue";
import router from "@/router";
import { useGameStore } from "@/stores";
import { addLog } from "./useGameLog";
import { handleEndDay } from "./useEndDay";
import { sfxClick, useAudio } from "./useAudio";
import { Home, Map, Package, Star, ScrollText, User } from "lucide-vue-next";

export type PanelKey =
  | "base"
  | "map"
  | "inventory"
  | "skills"
  | "quest"
  | "charinfo"
  | "farm"
  | "shop"
  | "upgrade"
  | "workshop"
  | "home"
  | "village"
  | "forage"
  | "fishing"
  | "mining"
  | "cooking"
  | "animal"
  | "breeding"
  | "achievement"
  | "wallet"
  | "museum"
  | "guild"
  | "hanhai";

export const TABS: { key: PanelKey; label: string; icon: Component }[] = [
  { key: "base", label: "基地", icon: Home },
  { key: "map", label: "地图", icon: Map },
  { key: "charinfo", label: "属性", icon: User },
  { key: "inventory", label: "背包", icon: Package },
  { key: "skills", label: "技能", icon: Star },
  { key: "quest", label: "任务", icon: ScrollText },
];

/** 导航到游戏面板（末日生存：无旅行时间，直接跳转） */
export const navigateToPanel = (panelKey: PanelKey) => {
  const gameStore = useGameStore();
  const { startBgm } = useAudio();

  if (gameStore.isPastBedtime) {
    addLog("已经凌晨2点了，你必须休息。");
    handleEndDay();
    return;
  }

  sfxClick();
  startBgm();
  void router.push({ name: panelKey });
};

export const useNavigation = () => {
  return {
    TABS,
    navigateToPanel,
  };
};
