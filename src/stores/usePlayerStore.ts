import { ref, computed } from "vue";
import { defineStore } from "pinia";
import type { Gender, AttributeType, AttributeSet } from "@/types";
import type { DerivedSkillType } from "@/types/skill";
import { getAttributeModifier, DEFAULT_ATTRIBUTES } from "@/types/attributes";
import {
  LATE_NIGHT_RECOVERY_MAX,
  LATE_NIGHT_RECOVERY_MIN,
  PASSOUT_STAMINA_RECOVERY,
  PASSOUT_MONEY_PENALTY_RATE,
  PASSOUT_MONEY_PENALTY_CAP,
} from "@/data/timeConstants";
import { useSkillStore } from "./useSkillStore";
import { useHomeStore } from "./useHomeStore";
import { useInventoryStore } from "./useInventoryStore";

/** 最大体力阶梯 (5档, 270 起 508 顶) */
const STAMINA_CAPS = [120, 160, 200, 250, 300];

/** HP 常量 */
const BASE_MAX_HP = 100;
const HP_PER_COMBAT_LEVEL = 5;
const FIGHTER_HP_BONUS = 25;
const WARRIOR_HP_BONUS = 40;

export const usePlayerStore = defineStore("player", () => {
  const playerName = ref("未命名");
  const gender = ref<Gender>("male");
  /** 旧存档加载后需要设置身份（不持久化） */
  const needsIdentitySetup = ref(false);
  const money = ref(500);
  const stamina = ref(120);
  const maxStamina = ref(120);
  const staminaCapLevel = ref(0); // 0=120, 1=160, 2=200, 3=250, 4=300

  // HP 系统
  const hp = ref(BASE_MAX_HP);
  const baseMaxHp = ref(BASE_MAX_HP);

  /** 末日生存：六维属性（力量、敏捷、体质、智力、感知、魅力） */
  const attributes = ref<AttributeSet>({ ...DEFAULT_ATTRIBUTES });
  const HP_PER_CON_MOD = 10;

  /** 末日生存：获取单属性调整值 */
  const getModifier = (attr: AttributeType): number => {
    return getAttributeModifier(attributes.value[attr]);
  };

  /** 末日生存：派生技能调整值（战斗=STR+CON+DEX 平均，制作=INT+WIS 平均，搜寻=DEX+WIS 平均） */
  const getDerivedSkillModifier = (skill: DerivedSkillType): number => {
    const a = attributes.value;
    const str = getAttributeModifier(a.str);
    const dex = getAttributeModifier(a.dex);
    const con = getAttributeModifier(a.con);
    const int = getAttributeModifier(a.int);
    const wis = getAttributeModifier(a.wis);
    switch (skill) {
      case "combat":
        return Math.floor((str + con + dex) / 2);
      case "craft":
        return Math.floor((int + wis) / 2);
      case "scavenge":
        return Math.floor((dex + wis) / 2);
      default:
        return 0;
    }
  };

  const isExhausted = computed(() => stamina.value <= 5);
  const staminaPercent = computed(() =>
    Math.round((stamina.value / maxStamina.value) * 100),
  );
  /** NPC 用来称呼玩家的称谓 */
  const honorific = computed(() => (gender.value === "male" ? "小哥" : "姑娘"));

  /** 计算当前最大 HP：末日生存下为 baseMaxHp + 体质调整值*N；否则沿用旧公式 */
  const getMaxHp = (): number => {
    const conMod = getModifier("con");
    const attrBonus = conMod * HP_PER_CON_MOD;
    const ringHpBonus = useInventoryStore().getRingEffectValue("max_hp_bonus");
    try {
      const skillStore = useSkillStore();
      const combatLevel = skillStore.combatLevel ?? 0;
      const perk5 = skillStore.getSkill?.("combat")?.perk5;
      const perk10 = skillStore.getSkill?.("combat")?.perk10;
      let skillBonus = combatLevel * HP_PER_COMBAT_LEVEL;
      if (perk5 === "fighter") skillBonus += FIGHTER_HP_BONUS;
      if (perk10 === "warrior") skillBonus += WARRIOR_HP_BONUS;
      return baseMaxHp.value + attrBonus + skillBonus + ringHpBonus;
    } catch {
      return baseMaxHp.value + attrBonus + ringHpBonus;
    }
  };

  const getHpPercent = (): number => {
    return Math.round((hp.value / getMaxHp()) * 100);
  };

  const getIsLowHp = (): boolean => {
    return hp.value <= getMaxHp() * 0.25;
  };

  /** 消耗体力，返回是否成功 */
  const consumeStamina = (amount: number): boolean => {
    if (stamina.value < amount) return false;
    stamina.value -= amount;
    return true;
  };

  /** 恢复体力 */
  const restoreStamina = (amount: number) => {
    stamina.value = Math.min(stamina.value + amount, maxStamina.value);
  };

  /** 受到伤害（扣 HP），返回实际伤害值 */
  const takeDamage = (amount: number): number => {
    const actual = Math.min(amount, hp.value);
    hp.value -= actual;
    return actual;
  };

  /** 恢复生命值 */
  const restoreHealth = (amount: number) => {
    hp.value = Math.min(hp.value + amount, getMaxHp());
  };

  /**
   * 每日重置
   * - 正常：满体力 + 满HP
   * - 晚睡：渐进恢复 (24时90%→25时60%) + 满HP
   * - 昏倒：50% 体力 + 满HP + 扣10%金币
   */
  const dailyReset = (
    mode: "normal" | "late" | "passout",
    bedHour?: number,
  ): { moneyLost: number; recoveryPct: number } => {
    let moneyLost = 0;
    let recoveryPct = 1;
    switch (mode) {
      case "normal":
        stamina.value = maxStamina.value;
        break;
      case "late": {
        // 渐进式恢复：24时→90%, 25时→60%, 线性插值
        const homeStore = useHomeStore();
        const staminaBonus = homeStore.getStaminaRecoveryBonus();
        const t = Math.min(Math.max((bedHour ?? 24) - 24, 0), 1);
        recoveryPct =
          LATE_NIGHT_RECOVERY_MAX -
          t * (LATE_NIGHT_RECOVERY_MAX - LATE_NIGHT_RECOVERY_MIN) +
          staminaBonus;
        stamina.value = Math.floor(maxStamina.value * Math.min(recoveryPct, 1));
        break;
      }
      case "passout": {
        const homeStore2 = useHomeStore();
        const staminaBonus2 = homeStore2.getStaminaRecoveryBonus();
        recoveryPct = PASSOUT_STAMINA_RECOVERY + staminaBonus2;
        stamina.value = Math.floor(maxStamina.value * Math.min(recoveryPct, 1));
        moneyLost = Math.min(
          Math.floor(money.value * PASSOUT_MONEY_PENALTY_RATE),
          PASSOUT_MONEY_PENALTY_CAP,
        );
        money.value -= moneyLost;
        break;
      }
    }
    // HP 每天都回满
    hp.value = getMaxHp();
    return { moneyLost, recoveryPct };
  };

  /** 提升体力上限 */
  const upgradeMaxStamina = (): boolean => {
    if (staminaCapLevel.value >= STAMINA_CAPS.length - 1) return false;
    staminaCapLevel.value++;
    maxStamina.value = STAMINA_CAPS[staminaCapLevel.value]!;
    return true;
  };

  /** 花费金币，返回是否成功 */
  const spendMoney = (amount: number): boolean => {
    if (money.value < amount) return false;
    money.value -= amount;
    return true;
  };

  /** 获得金币 */
  const earnMoney = (amount: number) => {
    money.value += amount;
  };

  /** 设置玩家身份（新游戏或旧存档迁移时调用） */
  const setIdentity = (name: string, g: Gender) => {
    playerName.value = name;
    gender.value = g;
    needsIdentitySetup.value = false;
  };

  /** 设置六维属性（新游戏角色创建时调用） */
  const setAttributes = (attrs: AttributeSet) => {
    attributes.value = { ...attrs };
  };

  const serialize = () => {
    return {
      playerName: playerName.value,
      gender: gender.value,
      money: money.value,
      stamina: stamina.value,
      maxStamina: maxStamina.value,
      staminaCapLevel: staminaCapLevel.value,
      hp: hp.value,
      baseMaxHp: baseMaxHp.value,
      attributes: attributes.value,
    };
  };

  const deserialize = (data: ReturnType<typeof serialize>) => {
    const hasIdentity = (data as any).playerName != null;
    playerName.value = (data as any).playerName ?? "未命名";
    gender.value = (data as any).gender ?? "male";
    needsIdentitySetup.value = !hasIdentity;
    money.value = data.money;
    stamina.value = data.stamina;
    maxStamina.value = data.maxStamina;
    staminaCapLevel.value = data.staminaCapLevel;
    hp.value = (data as any).hp ?? BASE_MAX_HP;
    baseMaxHp.value = (data as any).baseMaxHp ?? BASE_MAX_HP;
    if ((data as any).attributes) {
      attributes.value = { ...DEFAULT_ATTRIBUTES, ...(data as any).attributes };
    }
  };

  return {
    playerName,
    gender,
    needsIdentitySetup,
    honorific,
    money,
    stamina,
    maxStamina,
    staminaCapLevel,
    hp,
    baseMaxHp,
    attributes,
    getModifier,
    getDerivedSkillModifier,
    isExhausted,
    staminaPercent,
    getMaxHp,
    getHpPercent,
    getIsLowHp,
    consumeStamina,
    restoreStamina,
    takeDamage,
    restoreHealth,
    dailyReset,
    upgradeMaxStamina,
    spendMoney,
    earnMoney,
    setIdentity,
    setAttributes,
    serialize,
    deserialize,
  };
});
