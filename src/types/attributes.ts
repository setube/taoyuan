/** 末日生存：DnD 风格属性类型 */
export type AttributeType = "str" | "dex" | "con" | "int" | "wis" | "cha";

/** 六维属性集合 */
export interface AttributeSet {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

/** 属性中文名 */
export const ATTRIBUTE_NAMES: Record<AttributeType, string> = {
  str: "力量",
  dex: "敏捷",
  con: "体质",
  int: "智力",
  wis: "感知",
  cha: "魅力",
};

/** 根据属性值计算调整值（DnD 5e：向下取整 (value - 10) / 2） */
export function getAttributeModifier(value: number): number {
  return Math.floor((value - 10) / 2);
}

/** 默认属性（10 为无加减） */
export const DEFAULT_ATTRIBUTES: AttributeSet = {
  str: 10,
  dex: 10,
  con: 10,
  int: 10,
  wis: 10,
  cha: 10,
};
