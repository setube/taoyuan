/**
 * Furniture definitions for Concept 4 (Top-Down Floor Plan)
 * Each furniture piece has a grid position and size in the 10×20 grid
 */

export type FurnitureType =
  | "door"
  | "bed"
  | "storage"
  | "crafting"
  | "window"
  | "bathroom"
  | "kitchen";

export interface FurnitureDef {
  id: string;
  name: string;
  icon: string; // lucide icon name
  gridArea: string; // CSS grid-area shorthand, e.g., "1/1/3/3" (row-start/col-start/row-end/col-end)
  type: FurnitureType;
  actions: string[]; // action IDs
}

/**
 * Apartment furniture layout for a small Shanghai student apartment (~30㎡)
 * Grid: 10 rows × 20 columns
 *
 * Layout visualization:
 * - Door at entrance (top-left, 2×2)
 * - Bathroom near entrance (top, 3×2)
 * - Bed in main area (3×3)
 * - Desk for work/craft (2×2)
 * - Closet for storage (3×2)
 * - Kitchen counter (2×2)
 * - Window (2×2)
 * - Small cabinets and fridge scattered
 */
export const APARTMENT_FURNITURE: FurnitureDef[] = [
  // Door - Entrance (top-left)
  {
    id: "door",
    name: "门",
    icon: "Door",
    gridArea: "1/1/3/3", // Row 1-3, Col 1-3 (2×2)
    type: "door",
    actions: ["barricade", "listen", "peek"],
  },

  // Bathroom - Near entrance (top, 3×2)
  {
    id: "bathroom",
    name: "卫生间",
    icon: "Droplets",
    gridArea: "1/4/4/6", // Row 1-4, Col 4-6 (3×2)
    type: "bathroom",
    actions: ["wash", "getMedicine", "getWater"],
  },

  // Bed - Main sleeping area (3×3)
  {
    id: "bed",
    name: "床铺",
    icon: "Bed",
    gridArea: "3/12/6/15", // Row 3-6, Col 12-15 (3×3)
    type: "bed",
    actions: ["rest", "sleep", "tidy"],
  },

  // Closet - Tall storage (3×2)
  {
    id: "closet",
    name: "衣柜",
    icon: "Package",
    gridArea: "3/18/6/20", // Row 3-6, Col 18-20 (3×2)
    type: "storage",
    actions: ["store", "search", "organize"],
  },

  // Small Cabinet - Storage (2×1)
  {
    id: "cabinet",
    name: "小橱柜",
    icon: "Box",
    gridArea: "6/2/8/3", // Row 6-8, Col 2-3 (2×1)
    type: "storage",
    actions: ["store", "search"],
  },

  // Desk - Work/craft area (2×2)
  {
    id: "desk",
    name: "书桌",
    icon: "BookOpen",
    gridArea: "6/8/8/10", // Row 6-8, Col 8-10 (2×2)
    type: "crafting",
    actions: ["craft", "read", "organize"],
  },

  // Kitchen Counter (2×2)
  {
    id: "kitchen",
    name: "厨房台",
    icon: "Coffee",
    gridArea: "8/2/10/4", // Row 8-10, Col 2-4 (2×2)
    type: "kitchen",
    actions: ["cook", "boilWater", "checkFood"],
  },

  // Fridge (2×1)
  {
    id: "fridge",
    name: "冰箱",
    icon: "Snowflake",
    gridArea: "8/4/10/5", // Row 8-10, Col 4-5 (2×1)
    type: "storage",
    actions: ["checkFood", "store"],
  },

  // Window - Outside view (2×2)
  {
    id: "window",
    name: "窗户",
    icon: "Square",
    gridArea: "8/18/10/20", // Row 8-10, Col 18-20 (2×2)
    type: "window",
    actions: ["barricade", "lookOut", "ventilate"],
  },
];

/**
 * Get furniture by ID
 */
export function getFurnitureById(id: string): FurnitureDef | undefined {
  return APARTMENT_FURNITURE.find((f) => f.id === id);
}

/**
 * Get all furniture of a specific type
 */
export function getFurnitureByType(type: FurnitureType): FurnitureDef[] {
  return APARTMENT_FURNITURE.filter((f) => f.type === type);
}
