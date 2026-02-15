import type { BackgroundDef, BackgroundId } from "@/types/survival";

/** Character-creation backgrounds with starting Familiarity bonuses (per node type or location id) */
export const BACKGROUNDS: BackgroundDef[] = [
  {
    id: "student",
    name: "学生",
    familiarityBonuses: {
      学校: 1,
      图书馆: 1,
      网吧: 1,
    },
  },
  {
    id: "hospital_intern",
    name: "医院实习生",
    familiarityBonuses: {
      医院: 1,
      药房: 1,
    },
  },
  {
    id: "delivery_driver",
    name: "外卖骑手",
    familiarityBonuses: {
      streets: 1,
    },
  },
  {
    id: "community_guard",
    name: "小区保安",
    familiarityBonuses: {
      住宅区: 1,
    },
  },
  {
    id: "net_cafe_owner",
    name: "网吧老板",
    familiarityBonuses: {
      commercial: 1,
      tech: 1,
    },
  },
];

export function getBackgroundById(id: BackgroundId): BackgroundDef | undefined {
  return BACKGROUNDS.find((b) => b.id === id);
}

export function getAllBackgrounds(): BackgroundDef[] {
  return [...BACKGROUNDS];
}
