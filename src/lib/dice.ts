/**
 * 解析骰子表达式并投掷，如 "d20", "2d6+3"
 */
export function roll(diceNotation: string): number {
  const match = diceNotation.match(/^(\d*)d(\d+)([+-]\d+)?$/i);
  if (!match) return 0;
  const count = Math.max(1, parseInt(match[1] || "1", 10));
  const sides = parseInt(match[2]!, 10);
  const modifier = match[3] ? parseInt(match[3], 10) : 0;
  let total = 0;
  for (let i = 0; i < count; i++) {
    total += Math.floor(Math.random() * sides) + 1;
  }
  return total + modifier;
}

export interface StatCheckResult {
  success: boolean;
  roll: number;
  modifier: number;
  total: number;
  dc: number;
}

/**
 * 单属性检定：d20 + modifier vs DC
 * modifier 由调用方从 usePlayerStore.getModifier(attr) 传入，避免循环依赖
 */
export function statCheck(
  modifier: number,
  dc: number,
  options?: { advantage?: boolean; disadvantage?: boolean },
): StatCheckResult {
  let r = roll("d20");
  if (options?.advantage) {
    const r2 = roll("d20");
    r = Math.max(r, r2);
  }
  if (options?.disadvantage) {
    const r2 = roll("d20");
    r = Math.min(r, r2);
  }
  const total = r + modifier;
  return {
    success: total >= dc,
    roll: r,
    modifier,
    total,
    dc,
  };
}

export interface SkillCheckResult extends StatCheckResult {}

/**
 * 派生技能检定：d20 + derivedSkillModifier vs DC
 * derivedSkillModifier 由调用方从 getDerivedSkillModifier(skill) 传入
 */
export function skillCheck(
  derivedSkillModifier: number,
  dc: number,
  options?: { advantage?: boolean; disadvantage?: boolean },
): SkillCheckResult {
  return statCheck(derivedSkillModifier, dc, options) as SkillCheckResult;
}
