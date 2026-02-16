import type { CityLocationId } from "@/types/game";
import { getLocationName } from "@/data/locations";

/** Message when player avoids danger (stealth success). */
export const MAP_MSG_STEALTH_SUCCESS = "你悄悄避开了危险。";

/** Message when encountering a zombie (caller appends zombie name). */
export const MAP_MSG_ENCOUNTER_PREFIX = "遭遇了";

/** Template for arrival: 到达{locationName}。 */
export function getArrivalMessage(locationId: CityLocationId): string {
  const name = getLocationName(locationId);
  return `到达${name}。`;
}

/** Fallback when travel result has no message: use arrival. */
export function getTravelResultMessage(
  resultMessage: string,
  toLocationId: CityLocationId,
): string {
  return resultMessage || getArrivalMessage(toLocationId);
}
