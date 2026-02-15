import type { CityLocationId, GridPosition } from "@/types/game";

export const GRID_ROWS = 7;
export const GRID_COLS = 7;
export const CENTER_ROW = 3;
export const CENTER_COL = 3;

/** POIs on the grid: only these cells have a non-street location. */
export const GRID_POIS: {
  row: number;
  col: number;
  locationId: CityLocationId;
}[] = [
  { row: CENTER_ROW, col: CENTER_COL, locationId: "apartment" },
  { row: 1, col: 2, locationId: "supermarket" },
  { row: 2, col: 5, locationId: "pharmacy" },
  { row: 5, col: 2, locationId: "hardware" },
];

export function getCellAt(row: number, col: number): CityLocationId {
  const poi = GRID_POIS.find((p) => p.row === row && p.col === col);
  return poi?.locationId ?? "street";
}

/** Travel cost between two grid cells (1 turn per Manhattan step). */
export function getTravelTurnsBetween(
  from: GridPosition,
  to: GridPosition,
): number {
  return Math.abs(from.row - to.row) + Math.abs(from.col - to.col);
}

export function getCenter(): GridPosition {
  return { row: CENTER_ROW, col: CENTER_COL };
}
