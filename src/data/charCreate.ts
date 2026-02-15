import type { AttributeSet } from "@/types/attributes";

/** 创建角色时每项属性的基础值（未分配点数前） */
export const CHAR_CREATE_BASE_STAT = 8;

/** 可自由分配到六维的点数总和 */
export const CHAR_CREATE_POINTS_TO_DISTRIBUTE = 12;

/** 单项属性最小值 */
export const CHAR_CREATE_MIN_STAT = 8;

/** 单项属性最大值 */
export const CHAR_CREATE_MAX_STAT = 18;

/** 序章剧情文案（简体中文） */
export const INTRO_FLAVOR_TEXT = `这是你从小长大的城市。熟悉的街道、常去的超市、总在加班的路灯——直到几天前，一切都变了。

新闻报道里开始出现“不明感染”和“戒严”的字眼。你躲在家中，靠着存粮撑过最混乱的那段日子。今天清晨，你从短暂的睡梦中醒来，窗外一片死寂。食物和水所剩无几，你必须走出这扇门，在这座已不再熟悉的城市里活下去。

末日已至。你的旅程，从这里开始。`;

/** 根据分配点数生成最终属性（基础值 + 分配） */
export function buildAttributesFromPoints(
  points: AttributeSet,
): AttributeSet {
  return {
    str: CHAR_CREATE_BASE_STAT + points.str,
    dex: CHAR_CREATE_BASE_STAT + points.dex,
    con: CHAR_CREATE_BASE_STAT + points.con,
    int: CHAR_CREATE_BASE_STAT + points.int,
    wis: CHAR_CREATE_BASE_STAT + points.wis,
    cha: CHAR_CREATE_BASE_STAT + points.cha,
  };
}
