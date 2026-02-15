/** 技能类型 */
export type SkillType =
  | "farming"
  | "foraging"
  | "fishing"
  | "mining"
  | "combat";

/** 末日生存：由属性派生的技能（无独立经验/等级） */
export type DerivedSkillType = "combat" | "craft" | "scavenge";

/** 技能专精（等级5选择） */
export type SkillPerk5 =
  | "harvester"
  | "rancher" // 农耕
  | "lumberjack"
  | "herbalist" // 采集
  | "fisher"
  | "trapper" // 钓鱼
  | "miner"
  | "geologist" // 挖矿
  | "fighter"
  | "defender"; // 战斗

/** 技能专精（等级10选择，基于等级5分支） */
export type SkillPerk10 =
  | "intensive"
  | "artisan" // 农耕: harvester分支
  | "coopmaster"
  | "shepherd" // 农耕: rancher分支
  | "botanist"
  | "alchemist" // 采集: herbalist分支
  | "forester"
  | "tracker" // 采集: lumberjack分支
  | "angler"
  | "aquaculture" // 钓鱼: fisher分支
  | "mariner"
  | "luremaster" // 钓鱼: trapper分支
  | "prospector"
  | "blacksmith" // 挖矿: miner分支
  | "excavator"
  | "mineralogist" // 挖矿: geologist分支
  | "warrior"
  | "brute" // 战斗: fighter分支
  | "acrobat"
  | "tank"; // 战斗: defender分支

/** 技能状态 */
export interface SkillState {
  type: SkillType;
  exp: number;
  level: number;
  perk5: SkillPerk5 | null;
  perk10: SkillPerk10 | null;
}

/** 钓鱼小游戏评级 */
export type MiniGameRating = "perfect" | "excellent" | "good" | "poor";

/** 钓鱼小游戏参数 */
export interface MiniGameParams {
  fishName: string;
  difficulty: "easy" | "normal" | "hard" | "legendary";
  hookHeight: number;
  fishSpeed: number;
  fishChangeDir: number;
  gravity: number;
  liftSpeed: number;
  scoreGain: number;
  scoreLoss: number;
  timeLimit: number;
}

/** 钓鱼小游戏结果 */
export interface MiniGameResult {
  rating: MiniGameRating;
  score: number;
  perfect: boolean;
}

/** 钓鱼地点 */
export type FishingLocation =
  | "creek"
  | "pond"
  | "river"
  | "mine"
  | "waterfall"
  | "swamp";

/** 鱼定义 */
export interface FishDef {
  id: string;
  name: string;
  season: ("spring" | "summer" | "autumn" | "winter")[];
  weather: ("sunny" | "rainy" | "stormy" | "snowy" | "windy" | "any")[];
  difficulty: "easy" | "normal" | "hard" | "legendary";
  sellPrice: number;
  description: string;
  /** 钓鱼地点（默认creek） */
  location?: FishingLocation;
  /** 小游戏鱼移动速度（覆盖难度默认值） */
  miniGameSpeed?: number;
  /** 小游戏鱼改变方向概率（覆盖难度默认值） */
  miniGameDirChange?: number;
}

/** 矿洞层定义 */
export interface MineFloorDef {
  floor: number;
  zone: "shallow" | "frost" | "lava" | "crystal" | "shadow" | "abyss";
  ores: string[]; // 可获得的矿石ID
  monsters: MonsterDef[];
  isSafePoint: boolean; // 是否为安全点（每5层）
  specialType: "mushroom" | "treasure" | "infested" | "dark" | "boss" | null; // 特殊楼层类型
}

/** 怪物定义 */
export interface MonsterDef {
  id: string;
  name: string;
  hp: number;
  attack: number; // 造成的HP伤害
  defense: number;
  expReward: number; // 击杀给予的战斗经验
  drops: { itemId: string; chance: number }[];
  description: string;
}

/** 战斗状态 */
export interface CombatState {
  monster: MonsterDef;
  monsterHp: number;
  round: number;
  log: string[];
  isBoss: boolean;
}

/** 战斗操作 */
export type CombatAction = "attack" | "defend" | "flee";

/** 食谱定义 */
export interface RecipeDef {
  id: string;
  name: string;
  ingredients: { itemId: string; quantity: number }[];
  effect: {
    staminaRestore: number;
    healthRestore?: number;
    buff?: {
      type:
        | "fishing"
        | "mining"
        | "giftBonus"
        | "speed"
        | "defense"
        | "luck"
        | "farming"
        | "stamina"
        | "all_skills";
      value: number; // 百分比或倍率
      description: string;
    };
  };
  unlockSource: string; // 解锁来源描述
  description: string;
  /** 需要的技能等级才能烹饪 */
  requiredSkill?: { type: SkillType; level: number };
}
