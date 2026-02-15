<template>
  <div v-if="combatStore.inCombat" class="max-w-xs mx-auto">
    <div class="flex items-center justify-between mb-2">
      <p class="text-sm text-accent">遭遇战</p>
    </div>

    <div class="border border-accent/10 rounded-xs p-2 mb-2">
      <div class="flex items-center justify-between text-xs mb-1">
        <span>你的 HP</span>
        <span :class="playerStore.getIsLowHp() ? 'text-danger' : 'text-muted'">
          {{ playerStore.hp }}/{{ playerStore.getMaxHp() }}
        </span>
      </div>
      <div class="bg-bg rounded-xs h-2">
        <div
          class="h-2 rounded-xs transition-all"
          :class="playerStore.getIsLowHp() ? 'bg-danger' : 'bg-success'"
          :style="{ width: `${playerStore.getHpPercent()}%` }"
        />
      </div>
    </div>

    <div
      v-if="combatStore.combatMonster"
      class="border border-danger/20 rounded-xs p-2 mb-3"
    >
      <div class="flex items-center justify-between text-xs mb-1">
        <span class="text-danger">{{ combatStore.combatMonster.name }}</span>
        <span class="text-muted"
          >{{ combatStore.combatMonsterHp }}/{{
            combatStore.combatMonster.hp
          }}</span
        >
      </div>
      <div class="bg-bg rounded-xs h-2">
        <div
          class="h-2 bg-danger rounded-xs transition-all"
          :style="{
            width: `${combatStore.combatMonster ? (combatStore.combatMonsterHp / combatStore.combatMonster.hp) * 100 : 0}%`,
          }"
        />
      </div>
    </div>

    <div class="flex flex-col gap-1 mb-3">
      <button
        class="btn text-xs w-full justify-between"
        @click="handleCombat('attack')"
      >
        <span>攻击</span>
      </button>
      <button
        class="btn text-xs w-full justify-between"
        @click="handleCombat('defend')"
      >
        <span>防御</span>
      </button>
      <button
        class="btn text-xs w-full text-danger"
        @click="handleCombat('flee')"
      >
        逃跑
      </button>
    </div>

    <div class="text-xs space-y-0.5 max-h-28 overflow-y-auto">
      <p
        v-for="(msg, i) in combatStore.combatLog"
        :key="i"
        :class="
          i < combatStore.combatLog.length - 1 ? 'text-muted' : 'text-text'
        "
      >
        {{ msg }}
      </p>
    </div>
  </div>
  <div v-else class="text-center text-muted text-sm py-4">
    <p>当前没有战斗。</p>
    <button class="btn text-xs mt-2" @click="goBack">返回</button>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { useCombatStore } from "@/stores/useCombatStore";
import { usePlayerStore } from "@/stores/usePlayerStore";

const router = useRouter();
const combatStore = useCombatStore();
const playerStore = usePlayerStore();

function handleCombat(action: "attack" | "defend" | "flee") {
  const result = combatStore.doAction(action);
  if (result.combatOver) {
    setTimeout(() => goBack(), 500);
  }
}

function goBack() {
  router.push("/game/map");
}
</script>
