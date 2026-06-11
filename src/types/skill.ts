/** 技能类型 */
export type SkillType = 'farming' | 'foraging' | 'fishing' | 'mining' | 'combat' | 'cooking' | 'forging'

/** 技能专精（等级5选择） */
export type SkillPerk5 =
  | 'harvester'
  | 'rancher' // 农耕
  | 'lumberjack'
  | 'herbalist' // 采集
  | 'fisher'
  | 'trapper' // 钓鱼
  | 'miner'
  | 'geologist' // 挖矿
  | 'fighter'
  | 'defender' // 战斗
  | 'prep_cook'
  | 'vendor_chef' // 烹饪
  | 'apprentice'
  | 'merchant' // 锻造

/** 技能专精（等级10选择，基于等级5分支） */
export type SkillPerk10 =
  | 'intensive'
  | 'artisan' // 农耕: harvester分支
  | 'coopmaster'
  | 'shepherd' // 农耕: rancher分支
  | 'botanist'
  | 'alchemist' // 采集: herbalist分支
  | 'forester'
  | 'tracker' // 采集: lumberjack分支
  | 'angler'
  | 'aquaculture' // 钓鱼: fisher分支
  | 'mariner'
  | 'luremaster' // 钓鱼: trapper分支
  | 'prospector'
  | 'blacksmith' // 挖矿: miner分支
  | 'excavator'
  | 'mineralogist' // 挖矿: geologist分支
  | 'warrior'
  | 'brute' // 战斗: fighter分支
  | 'acrobat'
  | 'tank' // 战斗: defender分支
  | 'double_batch'
  | 'gourmet_craft' // 烹饪: prep_cook分支
  | 'buff_chef'
  | 'tavern_master' // 烹饪: vendor_chef分支
  | 'smith_sword'
  | 'smith_stamina'
  | 'smith_tool' // 旧档兼容
  | 'enchanter'
  | 'smith_time'
  | 'smith_armor' // 旧档兼容

/** 技能专精（等级15，基于等级10分支）— 锻造先实装，其余技能后续扩展 */
export type SkillPerk15 =
  | 'keen_eye'
  | 'flame_keeper'
  | 'steady_arm'
  | 'tireless' // 旧档兼容
  | 'efficient_smith'
  | 'quick_quench'
  | 'rune_touch'
  | 'lucky_reroll'
  | 'set_mason'
  | 'frugal_fit'

/** 技能专精（等级20，基于等级15分支） */
export type SkillPerk20 =
  | 'master_blade'
  | 'supreme_forge'
  | 'tool_legend'
  | 'grand_temper'
  | 'arch_enchanter'
  | 'twin_runes'
  | 'royal_armorer'
  | 'golden_anvil'
  | 'forge_master'
  | 'practice_sage'

/** 技能状态 */
export interface SkillState {
  type: SkillType
  exp: number
  level: number
  perk5: SkillPerk5 | null
  perk10: SkillPerk10 | null
  perk15: SkillPerk15 | null
  perk20: SkillPerk20 | null
}

/** 钓鱼小游戏评级 */
export type MiniGameRating = 'perfect' | 'excellent' | 'good' | 'poor'

/** 钓鱼小游戏参数 */
export interface MiniGameParams {
  fishName: string
  difficulty: 'easy' | 'normal' | 'hard' | 'legendary'
  hookHeight: number
  fishSpeed: number
  fishChangeDir: number
  gravity: number
  liftSpeed: number
  scoreGain: number
  scoreLoss: number
  timeLimit: number
}

/** 钓鱼小游戏结果 */
export interface MiniGameResult {
  rating: MiniGameRating
  score: number
  perfect: boolean
}

/** 钓鱼地点 */
export type FishingLocation = 'creek' | 'pond' | 'river' | 'mine' | 'waterfall' | 'swamp'

/** 鱼定义 */
export interface FishDef {
  id: string
  name: string
  season: ('spring' | 'summer' | 'autumn' | 'winter')[]
  weather: ('sunny' | 'rainy' | 'stormy' | 'snowy' | 'windy' | 'any')[]
  difficulty: 'easy' | 'normal' | 'hard' | 'legendary'
  sellPrice: number
  description: string
  /** 最小重量（斤） */
  minWeight: number
  /** 最大重量（斤） */
  maxWeight: number
  /** 钓鱼地点（默认creek） */
  location?: FishingLocation
  /** 小游戏鱼移动速度（覆盖难度默认值） */
  miniGameSpeed?: number
  /** 小游戏鱼改变方向概率（覆盖难度默认值） */
  miniGameDirChange?: number
}

/** 矿洞层定义 */
export interface MineFloorDef {
  floor: number
  zone: 'shallow' | 'frost' | 'lava' | 'crystal' | 'shadow' | 'abyss'
  ores: string[] // 可获得的矿石ID
  monsters: MonsterDef[]
  isSafePoint: boolean // 是否为安全点（每5层）
  specialType: 'mushroom' | 'treasure' | 'infested' | 'dark' | 'boss' | null // 特殊楼层类型
}

/** 怪物定义 */
export interface MonsterDef {
  id: string
  name: string
  hp: number
  attack: number // 造成的HP伤害
  defense: number
  expReward: number // 击杀给予的战斗经验
  drops: { itemId: string; chance: number }[]
  description: string
}

/** 战斗状态 */
export interface CombatState {
  monster: MonsterDef
  monsterHp: number
  round: number
  log: string[]
  isBoss: boolean
}

/** 战斗操作 */
export type CombatAction = 'attack' | 'defend' | 'flee'

/** 食谱定义 */
export interface RecipeDef {
  id: string
  name: string
  ingredients: { itemId: string; quantity: number }[]
  effect: {
    staminaRestore: number
    healthRestore?: number
    buff?: {
      type: 'fishing' | 'mining' | 'giftBonus' | 'speed' | 'defense' | 'luck' | 'farming' | 'stamina' | 'all_skills'
      value: number // 百分比或倍率
      description: string
    }
  }
  unlockSource: string // 解锁来源描述
  description: string
  /** 需要的技能等级才能烹饪 */
  requiredSkill?: { type: SkillType; level: number }
}
