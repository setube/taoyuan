import { ref } from "vue";
import { defineStore } from "pinia";
import type { MonsterDef } from "@/types/skill";
import { skillCheck } from "@/lib/dice";
import { usePlayerStore } from "./usePlayerStore";
import { useInventoryStore } from "./useInventoryStore";
import { useGameStore } from "./useGameStore";
import { TURN_COSTS } from "@/data/timeConstants";
import { addLog } from "@/composables/useGameLog";

export const useCombatStore = defineStore("combat", () => {
  const inCombat = ref(false);
  const combatMonster = ref<MonsterDef | null>(null);
  const combatMonsterHp = ref(0);
  const combatRound = ref(0);
  const combatLog = ref<string[]>([]);

  function startCombat(monster: MonsterDef) {
    inCombat.value = true;
    combatMonster.value = monster;
    combatMonsterHp.value = monster.hp;
    combatRound.value = 0;
    combatLog.value = [`遭遇了${monster.name}！`];
  }

  function endCombat() {
    inCombat.value = false;
    combatMonster.value = null;
    combatMonsterHp.value = 0;
    combatRound.value = 0;
    combatLog.value = [];
  }

  function doAction(action: "attack" | "defend" | "flee"): {
    message: string;
    combatOver: boolean;
    won: boolean;
  } {
    const playerStore = usePlayerStore();
    const inventoryStore = useInventoryStore();
    const gameStore = useGameStore();

    if (!inCombat.value || !combatMonster.value) {
      return { message: "不在战斗中。", combatOver: true, won: false };
    }

    const monster = combatMonster.value;
    combatRound.value++;

    if (action === "flee") {
      endCombat();
      gameStore.advanceTurns(TURN_COSTS.combat);
      addLog("你逃离了战斗。");
      return { message: "成功逃离了战斗。", combatOver: true, won: false };
    }

    if (action === "defend") {
      const damage = Math.max(1, Math.floor(monster.attack * 0.5));
      playerStore.takeDamage(damage);
      combatLog.value.push(`你举盾防御，受到${damage}点伤害。`);
      if (playerStore.hp <= 0) {
        endCombat();
        addLog("你被击倒了……");
        return { message: "你被击倒了……", combatOver: true, won: false };
      }
      return {
        message: `防御！受到${damage}点伤害。`,
        combatOver: false,
        won: false,
      };
    }

    // 攻击：先检定命中（DC = 10 + 怪物防御）
    const combatMod = playerStore.getDerivedSkillModifier("combat");
    const ac = 10 + monster.defense;
    const hitCheck = skillCheck(combatMod, ac);
    if (!hitCheck.success) {
      combatLog.value.push(
        `你的攻击未命中${monster.name}！（d20+${combatMod}=${hitCheck.total} < AC${ac}）`,
      );
      return { message: `攻击未命中！`, combatOver: false, won: false };
    }

    const baseAttack = inventoryStore.getWeaponAttack?.() ?? 5;
    const damageToMonster = Math.max(
      1,
      baseAttack + combatMod - monster.defense,
    );
    combatMonsterHp.value -= damageToMonster;
    combatLog.value.push(
      `你攻击${monster.name}，造成${damageToMonster}点伤害。`,
    );

    if (combatMonsterHp.value <= 0) {
      endCombat();
      gameStore.advanceTurns(TURN_COSTS.combat);
      for (const drop of monster.drops) {
        if (Math.random() < drop.chance) {
          inventoryStore.addItem?.(drop.itemId);
        }
      }
      addLog(`${monster.name}被击败了！`);
      return {
        message: `${monster.name}被击败了！`,
        combatOver: true,
        won: true,
      };
    }

    // 怪物反击
    const monsterDamage = Math.max(
      1,
      monster.attack - Math.floor(combatMod / 2),
    );
    playerStore.takeDamage(monsterDamage);
    combatLog.value.push(`${monster.name}反击，你受到${monsterDamage}点伤害。`);

    if (playerStore.hp <= 0) {
      endCombat();
      addLog("你被击倒了……");
      return { message: "你被击倒了……", combatOver: true, won: false };
    }

    return {
      message: `${monster.name}反击，你受到${monsterDamage}点伤害。`,
      combatOver: false,
      won: false,
    };
  }

  const serialize = () => ({
    inCombat: inCombat.value,
    combatMonster: combatMonster.value,
    combatMonsterHp: combatMonsterHp.value,
    combatRound: combatRound.value,
    combatLog: combatLog.value,
  });

  const deserialize = (_data: ReturnType<typeof serialize>) => {
    inCombat.value = false;
    combatMonster.value = null;
    combatMonsterHp.value = 0;
    combatRound.value = 0;
    combatLog.value = [];
  };

  return {
    inCombat,
    combatMonster,
    combatMonsterHp,
    combatRound,
    combatLog,
    startCombat,
    endCombat,
    doAction,
    serialize,
    deserialize,
  };
});
