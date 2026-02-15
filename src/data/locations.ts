import type { CityLocationId } from "@/types/game";

export interface CityLocationDef {
  id: CityLocationId;
  name: string;
  /** 阶段一（疫情前）可购物；阶段二（疫情后）可搜寻 */
  canShopInPre: boolean;
  canScavengeInPost: boolean;
}

export const CITY_LOCATIONS: CityLocationDef[] = [
  {
    id: "apartment",
    name: "公寓",
    canShopInPre: false,
    canScavengeInPost: false,
  },
  {
    id: "supermarket",
    name: "超市",
    canShopInPre: true,
    canScavengeInPost: true,
  },
  { id: "pharmacy", name: "药店", canShopInPre: true, canScavengeInPost: true },
  {
    id: "hardware",
    name: "五金店",
    canShopInPre: true,
    canScavengeInPost: true,
  },
  {
    id: "street",
    name: "街道",
    canShopInPre: false,
    canScavengeInPost: false,
  },
];

/** 两地之间的回合消耗（单向）。key: "fromId->toId" */
export const TRAVEL_TURN_COSTS: Record<string, number> = {
  "apartment->supermarket": 2,
  "apartment->pharmacy": 2,
  "apartment->hardware": 3,
  "supermarket->apartment": 2,
  "supermarket->pharmacy": 1,
  "supermarket->hardware": 2,
  "pharmacy->apartment": 2,
  "pharmacy->supermarket": 1,
  "pharmacy->hardware": 2,
  "hardware->apartment": 3,
  "hardware->supermarket": 2,
  "hardware->pharmacy": 2,
};

export function getTravelTurns(
  from: CityLocationId,
  to: CityLocationId,
): number {
  return TRAVEL_TURN_COSTS[`${from}->${to}`] ?? 2;
}

export function getLocationById(
  id: CityLocationId,
): CityLocationDef | undefined {
  return CITY_LOCATIONS.find((loc) => loc.id === id);
}

export function getLocationName(id: CityLocationId): string {
  return getLocationById(id)?.name ?? id;
}
