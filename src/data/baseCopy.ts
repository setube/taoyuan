/**
 * Copy for base (apartment) actions and log messages.
 * BaseLayoutConcept4 reads labels and messages from here so components stay presentational.
 */

export const BASE_ACTION_LABELS = {
  rest: "休息 (2回合)",
  sleep: "长眠至早晨",
  barricade: (furnitureName: string) => `加固${furnitureName}`,
  lookOut: "观察外面",
  craft: "制作物品",
  read: "阅读书籍",
  search: "翻找物品",
  organize: "整理物资",
  cook: "做简单的饭",
  boilWater: "烧水",
  wash: "洗漱",
  getWater: "取水",
  viewInventory: "查看背包",
  quickRest: "休息一会儿",
} as const;

export const BASE_LAYOUT_TITLE = "真实俯视图 (10×20)";
export const BASE_REARRANGE_BTN = "重新摆放";
export const BASE_REARRANGE_DONE_BTN = "完成摆放";

/** Log message for rest action. */
export const BASE_MSG_REST = "你休息了一会儿，恢复了体力。";

/** Template: 你加固了{name}，当前等级: {level}/3 */
export function getBarricadeSuccessMessage(name: string, level: number): string {
  return `你加固了${name}，当前等级: ${level}/3`;
}

export const BASE_MSG_BARRICADE_MAX = "已经达到最大加固等级";

/** Look out (door): random flavor lines. */
export const BASE_LOOK_OUT_DOOR_MESSAGES = [
  "街上一片死寂，偶尔有游荡的尸群经过",
  "对面楼的窗户紧闭，不知道里面还有没有活人",
  "远处传来汽车警报声，引来了更多的僵尸",
] as const;

/** Look out (window): choice scene content. Used by script or directly. */
export const BASE_LOOK_OUT_WINDOW = {
  flavorText:
    "你凑到窗边。外面天色阴沉，街道上零星有影子在动；远处有一缕黑烟缓缓升起。",
  options: ["向左看", "向下看", "盯着远处的烟多看一会儿"] as const,
  followUps: [
    "左边那栋楼的阳台上有几盆枯死的植物，晾衣绳空荡荡的。",
    "楼下人行道上有几具倒伏的躯体，分不清是人是尸。",
    "那缕烟像是从几条街外的工厂区飘来的，说不清是火情还是有人在生火。",
  ] as const,
};

export const BASE_MSG_READ = "你翻阅着旧书，暂时忘记了外面的恐怖。";
export const BASE_MSG_SEARCH = "你翻找了一番，但没有发现什么有用的东西。";
export const BASE_MSG_ORGANIZE = "你整理了一下物资，心里稍微安心了一些。";
export const BASE_MSG_COOK = "你做了一顿简单的饭，填饱了肚子。";
export const BASE_MSG_BOIL_WATER = "你烧了一壶开水，可以喝上热水了。";
export const BASE_MSG_WASH = "你简单洗漱了一下，感觉清爽了些。";
export const BASE_MSG_GET_WATER = "你从浴缸里取了一些水，得省着用。";

export const BASE_FURNITURE_NAME_DOOR = "门";
export const BASE_FURNITURE_NAME_WINDOW = "窗户";
