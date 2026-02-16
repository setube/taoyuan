<template>
  <div>
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-accent text-sm">
        <Mountain :size="14" class="inline" />
        {{ miningStore.isInSkullCavern ? '骷髅矿穴' : '云隐矿洞' }}
      </h3>
      <button class="btn text-xs py-0 px-1" @click="showMapModal = true">
        <Map :size="14" />
      </button>
    </div>

    <!-- 骷髅矿穴 -->
    <div v-if="miningStore.isSkullCavernUnlocked()" class="border border-accent/20 rounded-xs p-3 mb-4">
      <div class="flex items-center justify-between mb-1">
        <p class="text-sm text-danger">
          <Skull :size="14" class="inline" />
          骷髅矿穴
        </p>
        <span v-if="miningStore.skullCavernBestFloor > 0" class="text-xs text-muted">最深 第{{ miningStore.skullCavernBestFloor }}层</span>
        <span v-else class="text-xs text-muted/40">未探索</span>
      </div>
      <p class="text-xs text-muted">无限层 · 无安全点 · 铱矿来源 · 怪物随深度增强</p>
    </div>

    <!-- 装备与状态 -->
    <div class="border border-accent/20 rounded-xs p-3 mb-4">
      <p class="text-sm text-accent mb-2">
        <Swords :size="14" class="inline" />
        装备与状态
      </p>
      <div class="flex flex-col gap-1">
        <div class="flex items-center justify-between border border-accent/10 rounded-xs px-3 py-1.5">
          <span class="text-xs">武器</span>
          <span class="text-xs text-accent">{{ weaponDisplayName }}</span>
        </div>
        <div class="flex items-center justify-between border border-accent/10 rounded-xs px-3 py-1.5">
          <span class="text-xs">攻击力</span>
          <span class="text-xs text-accent">{{ weaponAttack }}</span>
        </div>
        <div class="flex items-center justify-between border border-accent/10 rounded-xs px-3 py-1.5">
          <span class="text-xs">类型 · 暴击</span>
          <span class="text-xs text-muted">{{ weaponTypeName }} · {{ critRateDisplay }}</span>
        </div>
        <div v-if="weaponEnchantName" class="flex items-center justify-between border border-accent/10 rounded-xs px-3 py-1.5">
          <span class="text-xs">附魔</span>
          <span class="text-xs text-success">{{ weaponEnchantName }}</span>
        </div>
        <div class="flex items-center justify-between border border-accent/10 rounded-xs px-3 py-1.5">
          <span class="text-xs">HP</span>
          <div class="flex items-center gap-2">
            <div class="w-20 h-1.5 bg-bg rounded-xs border border-accent/10">
              <div
                class="h-full rounded-xs transition-all"
                :class="playerStore.getIsLowHp() ? 'bg-danger' : 'bg-success'"
                :style="{ width: playerStore.getHpPercent() + '%' }"
              />
            </div>
            <span class="text-xs" :class="playerStore.getIsLowHp() ? 'text-danger' : 'text-muted'">
              {{ playerStore.hp }}/{{ playerStore.getMaxHp() }}
            </span>
          </div>
        </div>
        <div class="flex items-center justify-between border border-accent/10 rounded-xs px-3 py-1.5">
          <span class="text-xs">体力</span>
          <span class="text-xs text-muted">{{ playerStore.stamina }}/{{ playerStore.maxStamina }}</span>
        </div>
      </div>
    </div>

    <!-- 进入矿洞 -->
    <div
      class="border border-accent/20 rounded-xs px-3 py-2 mb-4 flex items-center justify-between cursor-pointer hover:bg-accent/5"
      @click="hasElevator ? (showElevatorModal = true) : handleEnterMine(undefined)"
    >
      <div class="flex items-center gap-1.5">
        <Pickaxe :size="14" class="text-accent" />
        <span class="text-sm text-accent">探索</span>
      </div>
      <span class="text-xs text-muted">第{{ miningStore.safePointFloor + 1 }}层</span>
    </div>

    <!-- 已击败BOSS -->
    <div v-if="miningStore.defeatedBosses.length > 0" class="border border-accent/20 rounded-xs p-3">
      <p class="text-sm text-accent mb-2">
        <Skull :size="14" class="inline" />
        已击败BOSS
      </p>
      <div class="flex flex-col gap-1">
        <div
          v-for="zone in mineZones.filter(z => z.bossDefeated)"
          :key="zone.id"
          class="flex items-center justify-between border border-accent/10 rounded-xs px-3 py-1.5"
        >
          <span class="text-xs text-success">{{ zone.bossName }}</span>
          <span class="text-xs text-muted">{{ zone.name }}</span>
        </div>
      </div>
    </div>

    <!-- 矿洞地图弹窗 -->
    <Transition name="panel-fade">
      <div
        v-if="showMapModal"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        @click.self="showMapModal = false"
      >
        <div class="game-panel max-w-xs w-full">
          <div class="flex items-center justify-between mb-2">
            <p class="text-sm text-accent">
              <Map :size="14" class="inline" />
              矿洞地图
            </p>
            <button class="btn text-xs py-0 px-1" @click="showMapModal = false">
              <X :size="12" />
            </button>
          </div>
          <p class="text-xs text-muted mb-2">安全点：{{ miningStore.safePointFloor > 0 ? `第${miningStore.safePointFloor}层` : '入口' }}</p>
          <div class="flex flex-col gap-1.5">
            <div
              v-for="zone in mineZones"
              :key="zone.id"
              class="border rounded-xs p-2"
              :class="zone.isCurrentZone ? 'border-accent/40' : 'border-accent/10'"
            >
              <div class="flex justify-between items-center text-xs mb-1">
                <span :class="zone.isCurrentZone ? 'text-accent' : zone.reached ? 'text-text' : 'text-muted/40'">
                  {{ zone.name }}
                  <span class="text-muted ml-1">{{ zone.start }}-{{ zone.end }}层</span>
                </span>
                <span v-if="zone.bossDefeated" class="text-success">&#x2713; {{ zone.bossName }}</span>
                <span v-else-if="zone.reached" class="text-danger/70">{{ zone.bossName }}</span>
                <span v-else class="text-muted/30">
                  <Lock :size="12" class="inline" />
                </span>
              </div>
              <div class="bg-bg rounded-xs h-1.5">
                <div class="h-1.5 rounded-xs transition-all" :class="zone.barColor" :style="{ width: zone.progress + '%' }" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 电梯弹窗 -->
    <Transition name="panel-fade">
      <div
        v-if="showElevatorModal"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        @click.self="showElevatorModal = false"
      >
        <div class="game-panel max-w-xs w-full relative">
          <button class="absolute top-2 right-2 text-muted hover:text-text" @click="showElevatorModal = false">
            <X :size="14" />
          </button>

          <p class="text-sm text-accent mb-1">
            <Pickaxe :size="14" class="inline" />
            探索
          </p>
          <p class="text-xs text-muted mb-2">安全点：{{ miningStore.safePointFloor > 0 ? `第${miningStore.safePointFloor}层` : '入口' }}</p>

          <!-- 进入矿洞（前线） -->
          <div
            class="flex items-center justify-between border border-accent/30 rounded-xs px-3 py-1.5 cursor-pointer hover:bg-accent/5 mb-2"
            @click="handleEnterMine(undefined)"
          >
            <span class="text-xs text-accent">进入矿洞</span>
            <span class="text-xs text-muted">第{{ miningStore.safePointFloor + 1 }}层</span>
          </div>

          <!-- 电梯楼层（按区域分组网格） -->
          <div v-if="elevatorZones.length > 0" class="max-h-48 overflow-y-auto mb-2">
            <div v-for="zone in elevatorZones" :key="zone.name" class="mb-2 last:mb-0">
              <p class="text-[10px] text-muted mb-1">{{ zone.name }}</p>
              <div class="flex flex-wrap gap-1">
                <button
                  v-for="sp in zone.floors"
                  :key="sp"
                  class="btn text-xs py-0.5 px-0 min-w-9 justify-center"
                  @click="handleEnterMine(sp)"
                >
                  {{ sp + 1 }}
                </button>
              </div>
            </div>
          </div>

          <!-- 骷髅矿穴 -->
          <div
            v-if="miningStore.isSkullCavernUnlocked()"
            class="flex items-center justify-between border border-danger/30 rounded-xs px-3 py-1.5 cursor-pointer hover:bg-danger/5"
            @click="handleEnterSkullCavern"
          >
            <span class="text-xs text-danger">
              <Skull :size="12" class="inline" />
              进入骷髅矿穴
            </span>
            <span class="text-xs text-muted">无限层</span>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 矿洞探索弹窗 -->
    <Transition name="panel-fade">
      <div
        v-if="miningStore.isExploring && !miningStore.inCombat"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      >
        <div class="game-panel max-w-sm w-full">
          <!-- 标题栏 -->
          <div class="flex items-center justify-between mb-2">
            <p class="text-sm text-accent">
              第{{ activeFloorNum }}层
              <span v-if="!miningStore.isInSkullCavern" class="text-muted">{{ zoneName }}</span>
              <span v-if="currentFloorSpecial === 'mushroom'" class="text-success ml-1">蘑菇洞穴</span>
              <span v-if="currentFloorSpecial === 'treasure'" class="text-accent ml-1">宝箱层</span>
              <span v-if="currentFloorSpecial === 'infested'" class="text-danger ml-1">感染层</span>
              <span v-if="currentFloorSpecial === 'dark'" class="text-muted ml-1">暗河层</span>
              <span v-if="currentFloorSpecial === 'boss'" class="text-danger ml-1">BOSS层</span>
            </p>
            <button class="btn text-xs py-0 px-1" @click="handleLeave">
              <X :size="12" />
            </button>
          </div>

          <!-- 武器信息 -->
          <div class="text-xs text-muted mb-2 border-b border-accent/20 pb-2 space-y-0.5">
            <p>
              <Swords :size="12" class="inline" />
              {{ weaponDisplayName }}（{{ weaponTypeName }} · 攻击 {{ weaponAttack }} · 暴击 {{ critRateDisplay }}）
            </p>
            <p v-if="weaponEnchantName" class="text-success">附魔：{{ weaponEnchantName }}</p>
          </div>

          <!-- 感染层提示 -->
          <p v-if="currentFloorSpecial === 'infested' && remainingMonsters > 0" class="text-xs text-danger mb-2">
            感染层：还需击败 {{ remainingMonsters }} 只怪物
          </p>

          <!-- 炸弹模式指示 -->
          <div v-if="bombModeId" class="text-xs text-accent mb-2 border border-accent/30 rounded-xs px-2 py-1">
            <Zap :size="12" class="inline" />
            炸弹模式：点击已探索格子作为爆炸中心
            <button class="text-muted ml-2 underline" @click="bombModeId = null">取消</button>
          </div>

          <!-- 6×6 格子 -->
          <div class="flex justify-center mb-3">
            <div class="grid grid-cols-6 gap-1" style="max-width: 264px">
              <button
                v-for="tile in miningStore.floorGrid"
                :key="tile.index"
                class="w-10 h-10 rounded-xs flex items-center justify-center text-xs border transition-colors"
                :class="getTileClass(tile)"
                :disabled="!isTileClickable(tile)"
                @click="handleTileClick(tile)"
              >
                {{ getTileIcon(tile) }}
              </button>
            </div>
          </div>

          <!-- 操作区 -->
          <div class="flex flex-col gap-1 mb-3">
            <div v-for="bombItem in availableBombs" :key="bombItem.id">
              <div
                class="flex items-center justify-between border rounded-xs px-3 py-1.5 cursor-pointer hover:bg-accent/5"
                :class="bombModeId === bombItem.id ? 'border-accent text-accent' : 'border-accent/20'"
                @click="toggleBombMode(bombItem.id)"
              >
                <span class="text-xs">
                  <Zap :size="12" class="inline" />
                  {{ bombItem.name }}
                </span>
                <span class="text-xs text-muted">&times;{{ bombItem.count }}</span>
              </div>
            </div>
            <div
              v-if="hasMonsterLure"
              class="flex items-center justify-between border border-danger/20 rounded-xs px-3 py-1.5 cursor-pointer hover:bg-danger/5"
              @click="handleUseMonsterLure"
            >
              <span class="text-xs text-danger">
                <Skull :size="12" class="inline" />
                怪物诱饵
              </span>
              <span class="text-xs text-muted">&times;{{ inventoryStore.getItemCount('monster_lure') }}</span>
            </div>
            <div
              v-if="availableCombatItems.length > 0"
              class="flex items-center justify-between border border-success/20 rounded-xs px-3 py-1.5 cursor-pointer hover:bg-success/5"
              @click="showCombatItems = true"
            >
              <span class="text-xs text-success">
                <Backpack :size="12" class="inline" />
                使用道具
              </span>
              <span class="text-xs text-muted">{{ availableCombatItems.length }}种</span>
            </div>
            <div
              v-if="miningStore.stairsFound"
              class="flex items-center justify-between border border-success/30 rounded-xs px-3 py-1.5"
              :class="miningStore.stairsUsable ? 'cursor-pointer hover:bg-success/5' : 'opacity-50'"
              @click="miningStore.stairsUsable && handleNextFloor()"
            >
              <span class="text-xs text-success">
                <ChevronDown :size="12" class="inline" />
                下一层
              </span>
              <span v-if="!miningStore.stairsUsable" class="text-xs text-muted">楼梯不可用</span>
            </div>
            <div
              class="flex items-center justify-between border border-danger/30 rounded-xs px-3 py-1.5 cursor-pointer hover:bg-danger/5"
              @click="handleLeave"
            >
              <span class="text-xs text-danger">
                <LogOut :size="12" class="inline" />
                {{ miningStore.isInSkullCavern ? '离开骷髅矿穴' : '离开矿洞' }}
              </span>
            </div>
          </div>

          <!-- 探索日志 -->
          <div class="text-xs text-muted space-y-0.5 max-h-24 overflow-y-auto">
            <p v-for="(msg, i) in recentLog" :key="i" :class="{ 'text-text': i === recentLog.length - 1 }">{{ msg }}</p>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 战斗弹窗 -->
    <Transition name="panel-fade">
      <div v-if="miningStore.inCombat" class="fixed inset-0 bg-black/60 flex items-center justify-center z-60 p-4">
        <div class="game-panel max-w-xs w-full">
          <!-- 标题 -->
          <div class="flex items-center justify-between mb-2">
            <p class="text-sm" :class="miningStore.combatIsBoss ? 'text-danger' : 'text-accent'">
              {{ miningStore.combatIsBoss ? 'BOSS 战' : '遭遇怪物' }}
            </p>
          </div>

          <!-- 玩家 HP -->
          <div class="border border-accent/10 rounded-xs p-2 mb-2 relative" :class="playerAnim">
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
            <span
              v-if="playerFloat"
              :key="playerFloat.key"
              class="absolute -top-1 right-0 text-danger text-[11px] font-bold anim-float-up pointer-events-none"
            >
              {{ playerFloat.text }}
            </span>
          </div>

          <!-- 怪物 HP -->
          <div class="border border-danger/20 rounded-xs p-2 mb-3 relative" :class="monsterAnim">
            <div class="flex items-center justify-between text-xs mb-1">
              <span class="text-danger">
                {{ miningStore.combatMonster?.name }}
                <span v-if="miningStore.combatIsBoss" class="text-[10px]">[BOSS]</span>
              </span>
              <span class="text-muted">{{ miningStore.combatMonsterHp }}/{{ miningStore.combatMonster?.hp }}</span>
            </div>
            <div class="bg-bg rounded-xs h-2">
              <div
                class="h-2 bg-danger rounded-xs transition-all"
                :style="{ width: `${miningStore.combatMonster ? (miningStore.combatMonsterHp / miningStore.combatMonster.hp) * 100 : 0}%` }"
              />
            </div>
            <span
              v-if="monsterFloat"
              :key="monsterFloat.key"
              class="absolute -top-1 right-0 text-accent text-[11px] font-bold anim-float-up pointer-events-none"
            >
              {{ monsterFloat.text }}
            </span>
          </div>

          <!-- 战斗操作 -->
          <div class="flex flex-col gap-1 mb-3">
            <div
              class="flex items-center justify-between border border-accent/20 rounded-xs px-3 py-1.5"
              :class="combatAnimLock ? 'opacity-50' : 'cursor-pointer hover:bg-accent/5'"
              @click="!combatAnimLock && handleCombat('attack')"
            >
              <span class="text-xs">
                <Swords :size="12" class="inline" />
                攻击
              </span>
              <span class="text-xs text-muted">{{ weaponAttack }}攻击力</span>
            </div>
            <div
              class="flex items-center justify-between border border-accent/20 rounded-xs px-3 py-1.5"
              :class="combatAnimLock ? 'opacity-50' : 'cursor-pointer hover:bg-accent/5'"
              @click="!combatAnimLock && handleCombat('defend')"
            >
              <span class="text-xs">
                <Shield :size="12" class="inline" />
                防御
              </span>
              <span class="text-xs text-muted">减免伤害</span>
            </div>
            <div
              v-if="availableCombatItems.length > 0"
              class="flex items-center justify-between border border-success/20 rounded-xs px-3 py-1.5 cursor-pointer hover:bg-success/5"
              @click="showCombatItems = true"
            >
              <span class="text-xs text-success">
                <Backpack :size="12" class="inline" />
                使用道具
              </span>
              <span class="text-xs text-muted">{{ availableCombatItems.length }}种</span>
            </div>
            <div
              class="flex items-center justify-between border rounded-xs px-3 py-1.5"
              :class="
                miningStore.combatIsBoss || combatAnimLock
                  ? 'border-accent/10 opacity-50'
                  : 'border-danger/20 cursor-pointer hover:bg-danger/5'
              "
              @click="!miningStore.combatIsBoss && !combatAnimLock && handleCombat('flee')"
            >
              <span class="text-xs" :class="miningStore.combatIsBoss ? 'text-muted' : 'text-danger'">
                <MoveRight :size="12" class="inline" />
                {{ miningStore.combatIsBoss ? '无法逃跑' : '逃跑' }}
              </span>
            </div>
          </div>

          <!-- 战斗日志 -->
          <div class="text-xs space-y-0.5 max-h-28 overflow-y-auto">
            <p
              v-for="(msg, i) in miningStore.combatLog"
              :key="i"
              :class="i < miningStore.combatLog.length - 1 ? 'text-muted' : 'text-text'"
            >
              {{ msg }}
            </p>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 道具使用弹窗（战斗/探索共用） -->
    <Transition name="panel-fade">
      <div
        v-if="showCombatItems"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-70 p-4"
        @click.self="showCombatItems = false"
      >
        <div class="game-panel max-w-xs w-full">
          <div class="flex items-center justify-between mb-2">
            <p class="text-sm text-accent">
              <Backpack :size="14" class="inline" />
              使用道具
            </p>
            <button class="btn text-xs py-0 px-1" @click="showCombatItems = false">
              <X :size="12" />
            </button>
          </div>
          <div class="flex flex-col gap-1 max-h-48 overflow-y-auto">
            <div
              v-for="item in availableCombatItems"
              :key="item.itemId"
              class="flex items-center justify-between border border-success/20 rounded-xs px-3 py-1.5 cursor-pointer hover:bg-success/5"
              @click="handleUseCombatItem(item.itemId)"
            >
              <div class="flex flex-col">
                <span class="text-xs">{{ item.name }}</span>
                <span class="text-[10px] text-muted">{{ item.desc }}</span>
              </div>
              <span class="text-xs text-muted">&times;{{ item.count }}</span>
            </div>
          </div>
          <p v-if="availableCombatItems.length === 0" class="text-xs text-muted text-center py-2">没有可用道具</p>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { Mountain, Pickaxe, Zap, ChevronDown, LogOut, Swords, Shield, MoveRight, Skull, X, Map, Backpack, Lock } from 'lucide-vue-next'
  import { useMiningStore, useGameStore, usePlayerStore, useInventoryStore, useSkillStore } from '@/stores'
  import { ZONE_NAMES, getFloor, BOSS_MONSTERS } from '@/data'
  import { getWeaponById, getEnchantmentById, getWeaponDisplayName, WEAPON_TYPE_NAMES } from '@/data/weapons'
  import { ACTION_TIME_COSTS } from '@/data/timeConstants'
  import { BOMBS } from '@/data/processing'
  import { getItemById } from '@/data/items'
  import type { CombatAction, MineTile } from '@/types'
  import { sfxMine, sfxAttack, sfxHurt, sfxClick, sfxEncounter, sfxDefend, sfxFlee, sfxVictory } from '@/composables/useAudio'
  import { useAudio } from '@/composables/useAudio'
  import { addLog } from '@/composables/useGameLog'
  import { handleEndDay } from '@/composables/useEndDay'

  const miningStore = useMiningStore()
  const gameStore = useGameStore()
  const playerStore = usePlayerStore()
  const inventoryStore = useInventoryStore()
  const skillStore = useSkillStore()
  const { startBattleBgm, resumeNormalBgm } = useAudio()
  const exploreLog = ref<string[]>([])

  const showMapModal = ref(false)
  const showElevatorModal = ref(false)

  /** 炸弹模式 */
  const bombModeId = ref<string | null>(null)

  /** 战斗道具面板 */
  const showCombatItems = ref(false)

  // 战斗动画状态
  const combatAnimLock = ref(false)
  const playerAnim = ref('')
  const monsterAnim = ref('')
  const playerFloat = ref<{ text: string; key: number } | null>(null)
  const monsterFloat = ref<{ text: string; key: number } | null>(null)
  let floatCounter = 0

  const triggerAnim = (target: 'player' | 'monster', cls: string, duration: number = 400) => {
    if (target === 'player') {
      playerAnim.value = cls
      setTimeout(() => {
        playerAnim.value = ''
      }, duration)
    } else {
      monsterAnim.value = cls
      setTimeout(() => {
        monsterAnim.value = ''
      }, duration)
    }
  }

  const showDamageFloat = (target: 'player' | 'monster', text: string) => {
    const obj = { text, key: ++floatCounter }
    if (target === 'player') {
      playerFloat.value = obj
      setTimeout(() => {
        playerFloat.value = null
      }, 800)
    } else {
      monsterFloat.value = obj
      setTimeout(() => {
        monsterFloat.value = null
      }, 800)
    }
  }

  const parseDamage = (msg: string): { dealt: number; taken: number; isCrit: boolean } => {
    const dealt = msg.match(/造成(\d+)点伤害/)
    const taken = msg.match(/受到(\d+)点伤害/)
    return {
      dealt: dealt ? parseInt(dealt[1]!) : 0,
      taken: taken ? parseInt(taken[1]!) : 0,
      isCrit: msg.includes('暴击')
    }
  }

  const recentLog = computed(() => exploreLog.value.slice(-8))

  const activeFloorNum = computed(() => {
    return miningStore.isInSkullCavern ? miningStore.skullCavernFloor : miningStore.currentFloor
  })

  const availableBombs = computed(() => {
    return BOMBS.map(b => ({ id: b.id, name: b.name, count: inventoryStore.getItemCount(b.id) })).filter(b => b.count > 0)
  })

  /** 战斗中可用道具列表 */
  const availableCombatItems = computed(() => {
    const items: { itemId: string; name: string; desc: string; count: number }[] = []

    // 公会徽章
    const badgeCount = inventoryStore.getItemCount('guild_badge')
    if (badgeCount > 0) {
      items.push({ itemId: 'guild_badge', name: '公会徽章', desc: '攻击力永久+3', count: badgeCount })
    }

    // 猎魔符
    if (!miningStore.slayerCharmActive) {
      const charmCount = inventoryStore.getItemCount('slayer_charm')
      if (charmCount > 0) {
        items.push({ itemId: 'slayer_charm', name: '猎魔符', desc: '掉落率+20%（本次探索）', count: charmCount })
      }
    }

    // 所有可食用的恢复类道具
    const seen = new Set<string>(['guild_badge', 'slayer_charm', 'monster_lure'])
    for (const invItem of inventoryStore.items) {
      if (invItem.quantity <= 0 || seen.has(invItem.itemId)) continue
      const def = getItemById(invItem.itemId)
      if (!def?.edible) continue
      if (!def.healthRestore && !def.staminaRestore) continue
      seen.add(invItem.itemId)

      const parts: string[] = []
      if (def.healthRestore) parts.push(def.healthRestore >= 999 ? 'HP全满' : `HP+${def.healthRestore}`)
      if (def.staminaRestore) parts.push(`体力+${def.staminaRestore}`)

      items.push({
        itemId: invItem.itemId,
        name: def.name,
        desc: parts.join('，'),
        count: inventoryStore.getItemCount(invItem.itemId)
      })
    }

    return items
  })

  /** 是否有怪物诱饵 */
  const hasMonsterLure = computed(() => inventoryStore.getItemCount('monster_lure') > 0)

  const zoneName = computed(() => {
    const floor = getFloor(miningStore.currentFloor)
    return floor ? ZONE_NAMES[floor.zone] : ''
  })

  /** 矿洞地图区域数据 */
  const mineZones = computed(() => {
    const zones = [
      { id: 'shallow', name: '浅矿·土石洞穴', start: 1, end: 20, bossFloor: 20 },
      { id: 'frost', name: '冰窟·冰霜暗河', start: 21, end: 40, bossFloor: 40 },
      { id: 'lava', name: '熔岩层·地火暗涌', start: 41, end: 60, bossFloor: 60 },
      { id: 'crystal', name: '晶窟·水晶迷宫', start: 61, end: 80, bossFloor: 80 },
      { id: 'shadow', name: '幽境·暗影裂隙', start: 81, end: 100, bossFloor: 100 },
      { id: 'abyss', name: '深渊·无底深渊', start: 101, end: 120, bossFloor: 120 }
    ]
    const sp = miningStore.safePointFloor
    return zones.map(z => {
      const reached = sp >= z.start - 1
      const boss = BOSS_MONSTERS[z.bossFloor]
      const bossDefeated = boss ? miningStore.defeatedBosses.includes(boss.id) : false
      const progress = Math.min(100, Math.max(0, ((sp - (z.start - 1)) / 20) * 100))
      const isCurrentZone = sp >= z.start - 1 && sp < z.end
      return {
        ...z,
        reached,
        bossName: boss?.name ?? '???',
        bossDefeated,
        progress: reached ? Math.max(5, progress) : 0,
        isCurrentZone,
        barColor: bossDefeated ? 'bg-success' : isCurrentZone ? 'bg-accent' : reached ? 'bg-accent/50' : 'bg-bg'
      }
    })
  })

  /** 当前层是否为特殊楼层 */
  const currentFloorSpecial = computed(() => {
    const floor = getFloor(miningStore.currentFloor)
    return floor?.specialType ?? null
  })

  /** 感染层剩余怪物 */
  const remainingMonsters = computed(() => {
    return miningStore.totalMonstersOnFloor - miningStore.monstersDefeatedCount
  })

  /** 是否显示电梯（有可返回楼层或骷髅矿穴已解锁） */
  const hasElevator = computed(() => elevatorZones.value.length > 0 || miningStore.isSkullCavernUnlocked())

  /** 武器信息 */
  const weaponDisplayName = computed(() => {
    const owned = inventoryStore.getEquippedWeapon()
    return getWeaponDisplayName(owned.defId, owned.enchantmentId)
  })
  const weaponTypeName = computed(() => {
    const owned = inventoryStore.getEquippedWeapon()
    const def = getWeaponById(owned.defId)
    return def ? WEAPON_TYPE_NAMES[def.type] : '未知'
  })
  const weaponAttack = computed(
    () =>
      inventoryStore.getWeaponAttack() +
      skillStore.combatLevel * 2 +
      inventoryStore.getRingEffectValue('attack_bonus') +
      miningStore.guildBadgeBonusAttack
  )
  const critRateDisplay = computed(
    () => `${Math.round((inventoryStore.getWeaponCritRate() + inventoryStore.getRingEffectValue('crit_rate_bonus')) * 100)}%`
  )
  const weaponEnchantName = computed(() => {
    const owned = inventoryStore.getEquippedWeapon()
    if (!owned.enchantmentId) return ''
    const enchant = getEnchantmentById(owned.enchantmentId)
    return enchant ? `${enchant.name} - ${enchant.description}` : ''
  })

  /** 电梯楼层按区域分组 */
  const elevatorZones = computed(() => {
    const allSafePoints = miningStore.getUnlockedSafePoints().filter(sp => sp < miningStore.safePointFloor)
    const zones = [
      { name: '浅矿', min: 0, max: 20 },
      { name: '冰窟', min: 21, max: 40 },
      { name: '熔岩', min: 41, max: 60 },
      { name: '晶窟', min: 61, max: 80 },
      { name: '幽境', min: 81, max: 100 },
      { name: '深渊', min: 101, max: 120 }
    ]
    return zones
      .map(z => ({
        name: z.name,
        floors: allSafePoints.filter(sp => sp >= z.min && sp <= z.max)
      }))
      .filter(z => z.floors.length > 0)
  })

  // ==================== 格子 UI 辅助 ====================

  /** 格子样式 */
  const getTileClass = (tile: MineTile): string => {
    if (tile.state === 'hidden') {
      if (bombModeId.value) return 'bg-panel/50 border-accent/10 cursor-not-allowed opacity-40'
      if (miningStore.canRevealTile(tile.index)) return 'bg-panel border-accent/30 hover:border-accent cursor-pointer'
      return 'bg-panel/50 border-accent/10 cursor-not-allowed opacity-40'
    }
    switch (tile.type) {
      case 'empty':
        return 'bg-bg border-accent/10'
      case 'ore':
        return tile.state === 'collected' ? 'bg-bg border-accent/10' : 'bg-accent/20 border-accent/40'
      case 'monster':
        return tile.state === 'defeated' ? 'bg-bg border-accent/10' : 'bg-danger/20 border-danger/40 cursor-pointer'
      case 'boss':
        return tile.state === 'defeated' ? 'bg-bg border-accent/10' : 'bg-danger/30 border-danger/50 cursor-pointer'
      case 'stairs':
        return 'bg-success/20 border-success/40'
      case 'trap':
        return 'bg-danger/10 border-danger/20'
      case 'treasure':
        return tile.state === 'collected' ? 'bg-bg border-accent/10' : 'bg-accent/30 border-accent/50'
      case 'mushroom':
        return tile.state === 'collected' ? 'bg-bg border-accent/10' : 'bg-success/20 border-success/30'
      default:
        return 'bg-bg border-accent/10'
    }
  }

  /** 格子图标 */
  const getTileIcon = (tile: MineTile): string => {
    if (tile.state === 'hidden') return '?'
    switch (tile.type) {
      case 'empty':
        return '\u00B7'
      case 'ore':
        return tile.state === 'collected' ? '\u00B7' : '\u25C6'
      case 'monster':
        return tile.state === 'defeated' ? '\u00D7' : '!'
      case 'boss':
        return tile.state === 'defeated' ? '\u00D7' : '\u2620'
      case 'stairs':
        return '\u25BC'
      case 'trap':
        return '\u25B3'
      case 'treasure':
        return tile.state === 'collected' ? '\u00B7' : '\u2605'
      case 'mushroom':
        return tile.state === 'collected' ? '\u00B7' : '\u273F'
      default:
        return '\u00B7'
    }
  }

  /** 格子是否可点击 */
  const isTileClickable = (tile: MineTile): boolean => {
    if (bombModeId.value) {
      return tile.state !== 'hidden'
    }
    // 已揭示的怪物/BOSS格可以重新交战
    if (tile.state === 'revealed' && (tile.type === 'monster' || tile.type === 'boss') && tile.data?.monster) {
      return true
    }
    return tile.state === 'hidden' && miningStore.canRevealTile(tile.index)
  }

  /** 格子点击处理 */
  const handleTileClick = (tile: MineTile) => {
    if (gameStore.isPastBedtime) {
      addLog('太晚了，没法继续探索了。')
      handleEndDay()
      return
    }

    if (bombModeId.value) {
      const result = miningStore.useBombOnGrid(bombModeId.value, tile.index)
      if (result.success) {
        sfxMine()
        exploreLog.value.push(result.message)
        addLog(result.message)
        const tr = gameStore.advanceTime(ACTION_TIME_COSTS.mineOre)
        if (tr.message) addLog(tr.message)
        if (tr.passedOut) handleEndDay()
      } else {
        exploreLog.value.push(result.message)
      }
      bombModeId.value = null
      return
    }

    // 已揭示的怪物/BOSS格：重新交战
    if (tile.state === 'revealed' && (tile.type === 'monster' || tile.type === 'boss') && tile.data?.monster) {
      const result = miningStore.engageRevealedMonster(tile.index)
      if (result.success) {
        exploreLog.value.push(result.message)
        addLog(result.message)
        if (result.startsCombat) {
          startBattleBgm()
          sfxEncounter()
        }
      } else {
        exploreLog.value.push(result.message)
        addLog(result.message)
      }
      return
    }

    const result = miningStore.revealTile(tile.index)
    if (result.success) {
      exploreLog.value.push(result.message)
      addLog(result.message)

      if (result.startsCombat) {
        startBattleBgm()
        sfxEncounter()
        const tr = gameStore.advanceTime(ACTION_TIME_COSTS.combat)
        if (tr.message) addLog(tr.message)
        if (tr.passedOut) handleEndDay()
      } else {
        sfxClick()
        const tr = gameStore.advanceTime(ACTION_TIME_COSTS.revealTile)
        if (tr.message) addLog(tr.message)
        if (tr.passedOut) handleEndDay()
      }
    } else {
      exploreLog.value.push(result.message)
      addLog(result.message)
    }
  }

  /** 切换炸弹模式 */
  const toggleBombMode = (bombId: string) => {
    bombModeId.value = bombModeId.value === bombId ? null : bombId
  }

  // ==================== 事件处理 ====================

  const handleEnterMine = (startFrom?: number) => {
    showElevatorModal.value = false
    showCombatItems.value = false
    const msg = miningStore.enterMine(startFrom)
    exploreLog.value = [msg]
    sfxClick()
    addLog(msg)
  }

  const handleEnterSkullCavern = () => {
    showElevatorModal.value = false
    showCombatItems.value = false
    const msg = miningStore.enterSkullCavern()
    exploreLog.value = [msg]
    sfxClick()
    addLog(msg)
  }

  const handleCombat = (action: CombatAction) => {
    if (combatAnimLock.value) return
    combatAnimLock.value = true

    const result = miningStore.combatAction(action)
    const { dealt, taken, isCrit } = parseDamage(result.message)

    if (action === 'attack') sfxAttack()
    if (action === 'defend') sfxDefend()
    if (action === 'flee') sfxFlee()
    if (result.message.includes('受到')) sfxHurt()

    if (action === 'attack' && dealt > 0) {
      triggerAnim('monster', isCrit ? 'anim-shake-heavy' : 'anim-shake', isCrit ? 400 : 300)
      showDamageFloat('monster', isCrit ? `暴击 -${dealt}` : `-${dealt}`)
    }
    if (action === 'defend') {
      triggerAnim('player', 'anim-flash-defend', 400)
    }
    if (taken > 0) {
      triggerAnim('player', isCrit ? 'anim-shake-heavy anim-flash-red' : 'anim-flash-red', 400)
      showDamageFloat('player', `-${taken}`)
    }

    addLog(result.message)

    if (result.combatOver) {
      if (result.won) {
        sfxVictory()
        triggerAnim('monster', 'anim-victory', 1500)
      }
      resumeNormalBgm()
      showCombatItems.value = false
      if (!miningStore.isExploring) {
        exploreLog.value.push(result.message)
      }
    }

    setTimeout(() => {
      combatAnimLock.value = false
    }, 400)
  }

  /** 使用战斗道具 */
  const handleUseCombatItem = (itemId: string) => {
    const result = miningStore.useCombatItem(itemId)
    sfxClick()
    addLog(result.message)
    if (result.success) {
      exploreLog.value.push(result.message)
    }
  }

  /** 使用怪物诱饵 */
  const handleUseMonsterLure = () => {
    const result = miningStore.useMonsterLure()
    sfxClick()
    addLog(result.message)
    if (result.success) {
      exploreLog.value.push(result.message)
    }
  }

  const handleNextFloor = () => {
    if (gameStore.isPastBedtime) {
      addLog('太晚了，该回去了。')
      handleEndDay()
      return
    }
    showCombatItems.value = false
    const result = miningStore.goNextFloor()
    if (result.success) {
      exploreLog.value = [result.message]
      bombModeId.value = null
    } else {
      exploreLog.value.push(result.message)
    }
    addLog(result.message)
    const tr = gameStore.advanceTime(ACTION_TIME_COSTS.nextFloor)
    if (tr.message) addLog(tr.message)
    if (tr.passedOut) handleEndDay()
  }

  const handleLeave = () => {
    if (miningStore.inCombat) resumeNormalBgm()
    showCombatItems.value = false
    const msg = miningStore.leaveMine()
    exploreLog.value = []
    bombModeId.value = null
    addLog(msg)
  }
</script>

<style scoped>
  /* === 战斗动画 === */

  @keyframes combat-shake {
    0%,
    100% {
      transform: translateX(0);
    }
    20% {
      transform: translateX(-3px);
    }
    40% {
      transform: translateX(3px);
    }
    60% {
      transform: translateX(-2px);
    }
    80% {
      transform: translateX(2px);
    }
  }

  @keyframes combat-shake-heavy {
    0%,
    100% {
      transform: translateX(0);
    }
    10% {
      transform: translate(-4px, 2px);
    }
    30% {
      transform: translate(4px, -2px);
    }
    50% {
      transform: translate(-3px, 1px);
    }
    70% {
      transform: translate(3px, -1px);
    }
    90% {
      transform: translate(-2px, 1px);
    }
  }

  @keyframes combat-flash-red {
    0%,
    100% {
      background-color: transparent;
    }
    50% {
      background-color: oklch(from var(--color-danger) l c h / 0.3);
    }
  }

  @keyframes combat-flash-defend {
    0%,
    100% {
      background-color: transparent;
    }
    50% {
      background-color: oklch(from var(--color-water) l c h / 0.3);
    }
  }

  @keyframes combat-float-up {
    0% {
      opacity: 1;
      transform: translateY(0);
    }
    100% {
      opacity: 0;
      transform: translateY(-24px);
    }
  }

  @keyframes combat-victory-flash {
    0%,
    100% {
      border-color: oklch(from var(--color-accent) l c h / 0.3);
    }
    50% {
      border-color: oklch(from var(--color-accent) l c h / 0.8);
    }
  }

  .anim-shake {
    animation: combat-shake 0.3s ease-in-out;
  }
  .anim-shake-heavy {
    animation: combat-shake-heavy 0.4s ease-in-out;
  }
  .anim-flash-red {
    animation: combat-flash-red 0.3s ease-in-out;
  }
  .anim-flash-defend {
    animation: combat-flash-defend 0.4s ease-in-out;
  }
  .anim-victory {
    animation: combat-victory-flash 0.5s ease-in-out 3;
  }
  .anim-float-up {
    animation: combat-float-up 0.8s ease-out forwards;
  }
</style>
