export type BaseActionType =
  | "rest"
  | "sleep"
  | "craft"
  | "barricade"
  | "inventory";

export interface BaseFurnitureAction {
  type: BaseActionType;
  label: string;
}

export interface BaseFurnitureItem {
  id: string;
  name: string;
  x: number; // 0..9
  y: number; // 0..3
  w: number;
  h: number;
  actions: BaseFurnitureAction[];
}

/** 10×4 grid; positions must not overlap. Sizes are proportional (bed larger, workbench smaller). */
export const BASE_FURNITURE: BaseFurnitureItem[] = [
  { id: "window", name: "窗户", x: 4, y: 0, w: 1, h: 1, actions: [{ type: "barricade", label: "加固门窗" }] },
  { id: "door", name: "门", x: 9, y: 0, w: 1, h: 1, actions: [{ type: "barricade", label: "加固门窗" }] },
  { id: "closet", name: "衣柜", x: 0, y: 2, w: 1, h: 1, actions: [{ type: "inventory", label: "打开背包" }] },
  { id: "bed", name: "床", x: 1, y: 2, w: 3, h: 1, actions: [{ type: "rest", label: "休息（2 回合）" }, { type: "sleep", label: "回家休息" }] },
  { id: "desk", name: "工作台", x: 4, y: 2, w: 1, h: 1, actions: [{ type: "craft", label: "制作" }] },
  { id: "kitchen", name: "厨房", x: 5, y: 2, w: 2, h: 1, actions: [{ type: "craft", label: "制作" }] },
  { id: "sofa", name: "沙发", x: 7, y: 2, w: 2, h: 1, actions: [{ type: "rest", label: "休息（2 回合）" }] },
];
