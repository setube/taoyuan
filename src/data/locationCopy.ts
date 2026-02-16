import type { CityLocationId } from "@/types/game";

/** Blurb shown when viewing a location (e.g. apartment, street). */
const LOCATION_BLURBS: Partial<Record<CityLocationId, string>> = {
  apartment: "这里是公寓，请从地图前往其他地点。",
  street: "你在街道上，无特别之处。",
};

/** Phase-specific hint for location panel. */
export const LOCATION_HINT_PRE = "疫情尚未爆发，可以购物。";
export const LOCATION_HINT_POST = "搜寻物资。";

/** Button labels. */
export const LOCATION_BTN_SHOP = "购物（1 回合）";
export const LOCATION_BTN_SCAVENGE = "搜寻（1 回合）";
export const LOCATION_BTN_BACK_MAP = "返回地图";

/** NPC action row button labels (交谈, 购买, 抢劫, 恐吓, 结束). */
export const LOCATION_NPC_BTN_TALK = "交谈";
export const LOCATION_NPC_BTN_BUY = "购买";
export const LOCATION_NPC_BTN_ROB = "抢劫";
export const LOCATION_NPC_BTN_SCARE = "恐吓";
export const LOCATION_NPC_BTN_END = "结束";

/** NPC chip label suffix (e.g. " · 交谈"). */
export const LOCATION_NPC_CHIP_SUFFIX = " · 交谈";

export function getLocationBlurb(id: CityLocationId): string {
  return LOCATION_BLURBS[id] ?? "";
}

export function getShopResultMessage(locationName: string): string {
  return `在${locationName}逛了逛，暂时没有购买。`;
}

export function getScavengeResultMessage(locationName: string): string {
  return `在${locationName}搜寻了一番。`;
}
