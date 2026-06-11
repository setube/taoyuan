<template>
  <div>
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-accent text-sm">
        <Mountain :size="14" class="inline" />
        {{ miningStore.isInSkullCavern ? '骷髅矿穴' : '云隐矿洞' }}
      </h3>
      <Button class="py-0 px-1" :icon="Map" @click="showMapModal = true" />
    </div>
    <p v-if="tutorialHint" class="text-[10px] text-muted/50 mb-2">{{ tutorialHint }}</p>

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
      <p class="text-xs text-muted">无限层 · 每10层安全点 · 铱矿来源 · 怪物随深度增强</p>
      <p v-if="miningStore.skullSafePointFloor > 0" class="text-xs text-muted mt-0.5">安全点：第{{ miningStore.skullSafePointFloor }}层</p>
    </div>

    <!-- 装备与状态 -->
    <div class="border border-accent/20 rounded-xs p-3 mb-4">
      <div class="flex items-center justify-between mb-2">
        <p class="text-sm text-accent">
          <Swords :size="14" class="inline" />
          装备与状态
        </p>
      </div>
      <div class="flex flex-col space-y-1">
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
          <div class="flex items-center space-x-2">
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

      <div v-if="inventoryStore.setsWithOwnedPieces.length > 0" class="mt-2 pt-2 border-t border-accent/10">
        <p class="text-[10px] text-muted mb-1">套装快捷穿戴</p>
        <div class="flex flex-wrap gap-1">
          <Button
            v-for="set in inventoryStore.setsWithOwnedPieces.slice(0, 4)"
            :key="set.id"
            class="text-[10px] py-0 px-1.5"
            @click="handleEquipSet(set.id)"
          >
            {{ set.name }}
          </Button>
          <Button
            v-for="set in inventoryStore.setsWithOwnedPieces.slice(0, 4)"
            :key="set.id + '-preset'"
            class="text-[10px] py-0 px-1.5 opacity-80"
            @click="handleEquipSetWithPreset(set.id)"
          >
            {{ set.name }}·存方案
          </Button>
        </div>
      </div>
    </div>

    <!-- 进入矿洞 -->
    <div
      class="border border-accent/20 rounded-xs px-3 py-2 mb-4 flex items-center justify-between cursor-pointer hover:bg-accent/5"
      @click="hasElevator ? (showElevatorModal = true) : handleEnterMine(undefined)"
    >
      <div class="flex items-center space-x-1.5">
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
      <div class="flex flex-col space-y-1">
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
            <Button class="py-0 px-1" :icon="X" :icon-size="12" @click="showMapModal = false" />
          </div>
          <p class="text-xs text-muted mb-2">安全点：{{ miningStore.safePointFloor > 0 ? `第${miningStore.safePointFloor}层` : '入口' }}</p>
          <div class="flex flex-col space-y-1.5">
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
                <span v-if="zone.bossDefeated" class="text-success flex items-center">
                  <Check :size="12" class="mr-0.5" />
                  {{ zone.bossName }}
                </span>
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
              <div class="flex flex-wrap space-x-1">
                <Button v-for="sp in zone.floors" :key="sp" class="py-0.5 px-0 min-w-9 justify-center" @click="handleEnterMine(sp)">
                  {{ sp + 1 }}
                </Button>
              </div>
            </div>
          </div>

          <!-- 骷髅矿穴 -->
          <div v-if="miningStore.isSkullCavernUnlocked()">
            <div
              class="flex items-center justify-between border border-danger/30 rounded-xs px-3 py-1.5 mb-2 cursor-pointer hover:bg-danger/5"
              @click="handleEnterSkullCavern(undefined)"
            >
              <span class="text-xs text-danger">
                <Skull :size="12" class="inline" />
                进入骷髅矿穴
              </span>
              <span class="text-xs text-muted">第{{ miningStore.skullSafePointFloor + 1 }}层</span>
            </div>
            <!-- 骷髅矿穴安全点楼层 -->
            <div v-if="skullElevatorFloors.length > 0" class="max-h-48 overflow-y-auto grid-cols-5 grid m">
              <Button
                v-for="sp in skullElevatorFloors"
                :key="sp"
                class="py-0.5 px-0 min-w-9 justify-center !border-danger/30 !text-danger mb-1 mr-1"
                @click="handleEnterSkullCavern(sp)"
              >
                {{ sp + 1 }}
              </Button>
            </div>
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
            <Button class="py-0 px-1" :icon="X" :icon-size="12" @click="showLeaveConfirm = true" />
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
          <div class="flex flex-col space-y-1 mb-3">
            <!-- 一键探索 -->
            <div
              class="flex items-center justify-between border border-accent/30 rounded-xs px-3 py-1.5 cursor-pointer hover:bg-accent/5"
              @click="handleAutoExplore"
            >
              <span class="text-xs text-accent">
                <Zap :size="12" class="inline" />
                一键探索
              </span>
              <span class="text-[10px] text-muted">从上到下 · 遇怪逃跑</span>
            </div>
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
              @click="openCombatItems"
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
              @click="showLeaveConfirm = true"
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

          <!-- 玩家 vs 怪物 -->
          <div class="grid grid-cols-[1fr_auto_1fr] gap-1.5 mb-3 items-center">
            <!-- 玩家 -->
            <div class="border border-accent/10 rounded-xs p-2 relative" :class="playerAnim">
              <p class="text-xs text-center mb-1.5 truncate">你</p>
              <div class="bg-bg rounded-xs h-1.5 mb-1">
                <div
                  class="h-1.5 rounded-xs transition-all"
                  :class="playerStore.getIsLowHp() ? 'bg-danger' : 'bg-success'"
                  :style="{ width: `${playerStore.getHpPercent()}%` }"
                />
              </div>
              <p class="text-[10px]" :class="playerStore.getIsLowHp() ? 'text-danger' : 'text-muted'">
                {{ playerStore.hp }}/{{ playerStore.getMaxHp() }}
              </p>
              <span
                v-if="playerFloat"
                :key="playerFloat.key"
                class="absolute -top-1 right-0 text-danger text-[11px] font-bold anim-float-up pointer-events-none"
              >
                {{ playerFloat.text }}
              </span>
            </div>
            <!-- VS -->
            <span class="text-[10px] text-muted/40">VS</span>
            <!-- 怪物 -->
            <div class="border border-danger/20 rounded-xs p-2 relative" :class="monsterAnim">
              <p class="text-xs text-center text-danger mb-1.5 truncate">
                {{ miningStore.combatMonster?.name }}
                <span v-if="miningStore.combatIsBoss" class="text-[10px]">[BOSS]</span>
              </p>
              <div class="bg-bg rounded-xs h-1.5 mb-1">
                <div
                  class="h-1.5 bg-danger rounded-xs transition-all"
                  :style="{
                    width: `${miningStore.combatMonster ? (miningStore.combatMonsterHp / miningStore.combatMonster.hp) * 100 : 0}%`
                  }"
                />
              </div>
              <p class="text-[10px] text-muted">{{ miningStore.combatMonsterHp }}/{{ miningStore.combatMonster?.hp }}</p>
              <span
                v-if="monsterFloat"
                :key="monsterFloat.key"
                class="absolute -top-1 right-0 text-accent text-[11px] font-bold anim-float-up pointer-events-none"
              >
                {{ monsterFloat.text }}
              </span>
            </div>
          </div>

          <!-- 战斗操作 -->
          <div class="mb-3 space-y-1">
            <!-- 攻击 / 防御 / 逃跑 -->
            <div class="grid grid-cols-3 gap-1">
              <div
                class="flex flex-col items-center border border-accent/20 rounded-xs py-1.5"
                :class="combatAnimLock ? 'opacity-50' : 'cursor-pointer hover:bg-accent/5'"
                @click="!combatAnimLock && handleCombat('attack')"
              >
                <span class="text-xs">
                  <Swords :size="12" class="inline" />
                  攻击
                </span>
                <span class="text-[10px] text-muted">{{ weaponAttack }}攻击力</span>
              </div>
              <div
                class="flex flex-col items-center border border-accent/20 rounded-xs py-1.5"
                :class="combatAnimLock ? 'opacity-50' : 'cursor-pointer hover:bg-accent/5'"
                @click="!combatAnimLock && handleCombat('defend')"
              >
                <span class="text-xs">
                  <Shield :size="12" class="inline" />
                  防御
                </span>
                <span class="text-[10px] text-muted">减免伤害</span>
              </div>
              <div
                class="flex flex-col items-center border rounded-xs py-1.5"
                :class="
                  miningStore.combatIsBoss || combatAnimLock
                    ? 'border-accent/10 opacity-50'
                    : 'border-danger/20 cursor-pointer hover:bg-danger/5'
                "
                @click="!miningStore.combatIsBoss && !combatAnimLock && handleCombat('flee')"
              >
                <span class="text-xs" :class="miningStore.combatIsBoss ? 'text-muted' : 'text-danger'">
                  <MoveRight :size="12" class="inline" />
                  {{ miningStore.combatIsBoss ? '无法' : '逃跑' }}
                </span>
                <span v-if="miningStore.combatIsBoss" class="text-[10px] text-muted/40">BOSS战</span>
              </div>
            </div>
            <!-- 使用道具 -->
            <div
              v-if="availableCombatItems.length > 0"
              class="flex items-center justify-between border border-success/20 rounded-xs px-3 py-1.5 cursor-pointer hover:bg-success/5"
              @click="openCombatItems"
            >
              <span class="text-xs text-success">
                <Backpack :size="12" class="inline" />
                使用道具
              </span>
              <span class="text-xs text-muted">{{ availableCombatItems.length }}种</span>
            </div>
            <!-- 切换装备方案 -->
            <div
              v-if="inventoryStore.equipmentPresets.length > 0"
              class="flex items-center justify-between border border-accent/20 rounded-xs px-3 py-1.5 cursor-pointer hover:bg-accent/5"
              @click="showPresetListModal = true"
            >
              <span class="text-xs text-accent">
                <BookMarked :size="12" class="inline" />
                切换装备方案
              </span>
              <span v-if="inventoryStore.activePresetId" class="text-[10px] text-muted">
                {{ inventoryStore.equipmentPresets.find(p => p.id === inventoryStore.activePresetId)?.name ?? '' }}
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

    <!-- 道具使用弹窗（战斗/探索共用，支持多选+数量） -->
    <Transition name="panel-fade">
      <div
        v-if="showCombatItems"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4"
        @click.self="closeCombatItems"
      >
        <div class="game-panel max-w-xs w-full">
          <div class="flex items-center justify-between mb-2">
            <p class="text-sm text-accent">
              <Backpack :size="14" class="inline" />
              使用道具
            </p>
            <Button class="py-0 px-1" :icon="X" :icon-size="12" @click="closeCombatItems" />
          </div>
          <p class="text-[10px] text-muted mb-2">勾选多种道具并设置数量，确认后一次性使用。</p>
          <div class="flex flex-col space-y-1 max-h-56 overflow-y-auto">
            <div
              v-for="item in availableCombatItems"
              :key="item.itemId"
              class="border rounded-xs px-2 py-1.5 transition-colors"
              :class="isCombatItemSelected(item.itemId) ? 'border-accent/40 bg-accent/5' : 'border-accent/10'"
            >
              <div class="flex items-start gap-2">
                <input
                  type="checkbox"
                  class="mt-0.5 accent-accent shrink-0"
                  :checked="isCombatItemSelected(item.itemId)"
                  @change="toggleCombatItemSelect(item.itemId, item.count)"
                />
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between gap-2">
                    <span class="text-xs truncate">{{ item.name }}</span>
                    <span class="text-xs text-muted shrink-0">&times;{{ item.count }}</span>
                  </div>
                  <span class="text-[10px] text-muted">{{ item.desc }}</span>
                  <div
                    v-if="isCombatItemSelected(item.itemId) && canSetCombatQty(item.itemId) && item.count > 1"
                    class="flex items-center justify-end space-x-1 mt-1"
                    @click.stop
                  >
                    <Button
                      class="h-6 px-1.5 py-0.5 text-xs justify-center"
                      :disabled="getCombatItemQty(item.itemId) <= 1"
                      @click="adjustCombatItemQty(item.itemId, -1, item.count)"
                    >
                      -
                    </Button>
                    <input
                      type="number"
                      :value="getCombatItemQty(item.itemId)"
                      min="1"
                      :max="item.count"
                      class="w-12 h-6 px-1 py-0.5 bg-bg border border-accent/30 rounded-xs text-xs text-center text-accent outline-none"
                      @input="onCombatItemQtyInput(item.itemId, $event, item.count)"
                    />
                    <Button
                      class="h-6 px-1.5 py-0.5 text-xs justify-center"
                      :disabled="getCombatItemQty(item.itemId) >= item.count"
                      @click="adjustCombatItemQty(item.itemId, 1, item.count)"
                    >
                      +
                    </Button>
                    <Button
                      class="h-6 px-1.5 py-0.5 text-[10px] justify-center"
                      @click="setCombatItemQty(item.itemId, item.count, item.count)"
                    >
                      最多
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <p v-if="availableCombatItems.length === 0" class="text-xs text-muted text-center py-2">没有可用道具</p>
          <div class="flex space-x-1.5 mt-2">
            <Button class="flex-1 justify-center" @click="closeCombatItems">取消</Button>
            <Button
              class="flex-1 justify-center !bg-accent !text-bg"
              :disabled="selectedCombatItemCount === 0"
              @click="handleConfirmMultiUse"
            >
              确认使用{{ selectedCombatItemCount > 0 ? `(${selectedCombatItemCount}种)` : '' }}
            </Button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 离开矿洞确认弹窗 -->
    <Transition name="panel-fade">
      <div
        v-if="showLeaveConfirm"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4"
        @click.self="showLeaveConfirm = false"
      >
        <div class="game-panel max-w-xs w-full">
          <p class="text-sm text-accent mb-2">确认离开</p>
          <p class="text-xs text-muted mb-3">确定要离开{{ miningStore.isInSkullCavern ? '骷髅矿穴' : '矿洞' }}吗？{{ leaveHint }}</p>
          <div class="flex space-x-1.5">
            <Button class="flex-1 justify-center" @click="showLeaveConfirm = false">继续探索</Button>
            <Button class="flex-1 justify-center btn-danger" :icon="LogOut" @click="confirmLeave">确认离开</Button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 安全点解锁提示 -->
    <Transition name="panel-fade">
      <div
        v-if="miningStore.pendingSafePointEntryFloor != null"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-[75] p-4"
      >
        <div class="game-panel max-w-xs w-full text-center">
          <p class="text-sm text-accent mb-3">
            太好了！找到了废弃的矿道，下次可以直接进入第{{ miningStore.pendingSafePointEntryFloor }}层
          </p>
          <Button class="w-full justify-center" @click="dismissSafePointNotice">太好了</Button>
        </div>
      </div>
    </Transition>

    <!-- 快速切装：方案列表弹窗 -->
    <Transition name="panel-fade">
      <div
        v-if="showPresetListModal"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-70 p-4"
        @click.self="showPresetListModal = false"
      >
        <div class="game-panel max-w-xs w-full relative">
          <button class="absolute top-2 right-2 text-muted hover:text-text" @click="showPresetListModal = false">
            <X :size="14" />
          </button>
          <p class="text-sm text-accent mb-2">
            <BookMarked :size="14" class="inline" />
            装备方案
          </p>
          <div v-if="inventoryStore.equipmentPresets.length > 0" class="flex flex-col space-y-1.5 max-h-60 overflow-y-auto">
            <div
              v-for="preset in inventoryStore.equipmentPresets"
              :key="preset.id"
              class="border rounded-xs p-2"
              :class="inventoryStore.activePresetId === preset.id ? 'border-accent/40' : 'border-accent/10'"
            >
              <div class="flex items-center justify-between mb-1">
                <p class="text-xs text-accent truncate">{{ preset.name }}</p>
                <span v-if="inventoryStore.activePresetId === preset.id" class="text-[10px] text-success shrink-0 ml-1">使用中</span>
              </div>
              <div class="grid grid-cols-2 gap-1">
                <Button
                  class="py-0 px-1.5 text-[10px]"
                  :disabled="inventoryStore.activePresetId === preset.id"
                  @click="quickApplyPreset(preset.id)"
                >
                  使用
                </Button>
                <Button class="py-0 px-1.5 text-[10px]" @click="viewPresetDetail(preset.id)">查看</Button>
              </div>
            </div>
          </div>
          <div v-else class="flex flex-col items-center justify-center py-6">
            <BookMarked :size="24" class="text-muted/30" />
            <p class="text-xs text-muted mt-1">暂无方案</p>
            <p class="text-[10px] text-muted/60 mt-0.5">前往背包装备页创建方案</p>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 快速切装：方案详情弹窗 -->
    <Transition name="panel-fade">
      <div
        v-if="showPresetDetailModal && detailPreset"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-80 p-4"
        @click.self="showPresetDetailModal = false"
      >
        <div class="game-panel max-w-xs w-full relative">
          <button class="absolute top-2 right-2 text-muted hover:text-text" @click="showPresetDetailModal = false">
            <X :size="14" />
          </button>
          <p class="text-sm text-accent mb-2">{{ detailPreset.name }}</p>
          <div class="flex flex-col space-y-1">
            <div
              class="flex items-center justify-between border border-accent/10 rounded-xs px-3 py-1.5"
              :class="detailPreset.weaponDefId ? 'cursor-pointer hover:bg-accent/5' : ''"
              @click="detailPreset.weaponDefId && viewEquipProperty('weapon', detailPreset.weaponDefId)"
            >
              <span class="text-xs text-muted">武器</span>
              <span class="text-xs" :class="detailPreset.weaponDefId ? 'text-accent' : 'text-muted/40'">
                {{ detailPreset.weaponDefId ? (getWeaponById(detailPreset.weaponDefId)?.name ?? '未知') : '无' }}
              </span>
            </div>
            <div
              class="flex items-center justify-between border border-accent/10 rounded-xs px-3 py-1.5"
              :class="detailPreset.ringSlot1DefId ? 'cursor-pointer hover:bg-accent/5' : ''"
              @click="detailPreset.ringSlot1DefId && viewEquipProperty('ring', detailPreset.ringSlot1DefId)"
            >
              <span class="text-xs text-muted">戒指1</span>
              <span class="text-xs" :class="detailPreset.ringSlot1DefId ? 'text-accent' : 'text-muted/40'">
                {{ detailPreset.ringSlot1DefId ? (getRingById(detailPreset.ringSlot1DefId)?.name ?? '未知') : '无' }}
              </span>
            </div>
            <div
              class="flex items-center justify-between border border-accent/10 rounded-xs px-3 py-1.5"
              :class="detailPreset.ringSlot2DefId ? 'cursor-pointer hover:bg-accent/5' : ''"
              @click="detailPreset.ringSlot2DefId && viewEquipProperty('ring', detailPreset.ringSlot2DefId)"
            >
              <span class="text-xs text-muted">戒指2</span>
              <span class="text-xs" :class="detailPreset.ringSlot2DefId ? 'text-accent' : 'text-muted/40'">
                {{ detailPreset.ringSlot2DefId ? (getRingById(detailPreset.ringSlot2DefId)?.name ?? '未知') : '无' }}
              </span>
            </div>
            <div
              class="flex items-center justify-between border border-accent/10 rounded-xs px-3 py-1.5"
              :class="detailPreset.hatDefId ? 'cursor-pointer hover:bg-accent/5' : ''"
              @click="detailPreset.hatDefId && viewEquipProperty('hat', detailPreset.hatDefId)"
            >
              <span class="text-xs text-muted">帽子</span>
              <span class="text-xs" :class="detailPreset.hatDefId ? 'text-accent' : 'text-muted/40'">
                {{ detailPreset.hatDefId ? (getHatById(detailPreset.hatDefId)?.name ?? '未知') : '无' }}
              </span>
            </div>
            <div
              class="flex items-center justify-between border border-accent/10 rounded-xs px-3 py-1.5"
              :class="detailPreset.shoeDefId ? 'cursor-pointer hover:bg-accent/5' : ''"
              @click="detailPreset.shoeDefId && viewEquipProperty('shoe', detailPreset.shoeDefId)"
            >
              <span class="text-xs text-muted">鞋子</span>
              <span class="text-xs" :class="detailPreset.shoeDefId ? 'text-accent' : 'text-muted/40'">
                {{ detailPreset.shoeDefId ? (getShoeById(detailPreset.shoeDefId)?.name ?? '未知') : '无' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 快速切装：装备属性弹窗 -->
    <Transition name="panel-fade">
      <div
        v-if="showEquipPropertyModal && equipPropertyInfo"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-90 p-4"
        @click.self="showEquipPropertyModal = false"
      >
        <div class="game-panel max-w-xs w-full relative">
          <button class="absolute top-2 right-2 text-muted hover:text-text" @click="showEquipPropertyModal = false">
            <X :size="14" />
          </button>
          <p class="text-[10px] text-muted mb-0.5">{{ equipPropertyInfo.category }}</p>
          <p class="text-sm text-accent mb-1">{{ equipPropertyInfo.name }}</p>
          <p class="text-xs text-muted mb-2">{{ equipPropertyInfo.description }}</p>
          <div v-if="equipPropertyInfo.effects.length > 0" class="flex flex-col space-y-1">
            <div
              v-for="(eff, i) in equipPropertyInfo.effects"
              :key="i"
              class="flex items-center justify-between border border-accent/10 rounded-xs px-3 py-1"
            >
              <span class="text-xs text-muted">{{ eff.label }}</span>
              <span class="text-xs text-accent">{{ eff.value }}</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import {
    Mountain,
    Pickaxe,
    Zap,
    ChevronDown,
    LogOut,
    Swords,
    Shield,
    MoveRight,
    Skull,
    X,
    Map,
    Backpack,
    Lock,
    BookMarked,
    Check
  } from 'lucide-vue-next'
  import Button from '@/components/game/Button.vue'
  import { useAchievementStore } from '@/stores/useAchievementStore'
  import { useGameStore } from '@/stores/useGameStore'
  import { useInventoryStore } from '@/stores/useInventoryStore'
  import { useMiningStore } from '@/stores/useMiningStore'
  import { usePlayerStore } from '@/stores/usePlayerStore'
  import { useSkillStore } from '@/stores/useSkillStore'
  import { useTutorialStore } from '@/stores/useTutorialStore'
  import { ZONE_NAMES, getFloor, BOSS_MONSTERS } from '@/data'
  import { getWeaponById, getEnchantmentById, getWeaponDisplayName, WEAPON_TYPE_NAMES } from '@/data/weapons'
  import { getRingById, getHatById, getShoeById } from '@/data'
  import type { EquipmentEffectType } from '@/types'
  import { ACTION_TIME_COSTS } from '@/data/timeConstants'
  import { BOMBS } from '@/data/processing'
  import { getItemById } from '@/data/items'
  import type { CombatAction, MineTile } from '@/types'
  import { sfxMine, sfxAttack, sfxHurt, sfxClick, sfxEncounter, sfxDefend, sfxFlee, sfxVictory } from '@/composables/useAudio'
  import { useAudio } from '@/composables/useAudio'
  import { addLog } from '@/composables/useGameLog'
  import { getSetSourceHint } from '@/data/forgeSetSources'
  import { getEquipmentSetById } from '@/data/equipmentSets'
  import { handleEndDay } from '@/composables/useEndDay'
  import { lockBodyScroll, unlockBodyScroll } from '@/composables/useScrollLock'

  const miningStore = useMiningStore()
  const gameStore = useGameStore()
  const playerStore = usePlayerStore()
  const inventoryStore = useInventoryStore()

  const handleEquipSet = (setId: string) => {
    const res = inventoryStore.equipSet(setId)
    const setName = getEquipmentSetById(setId)?.name ?? setId
    if (res.ok) addLog(`已穿戴整套：${setName}`)
    else if (res.missing.length > 0) {
      addLog(`缺少 ${res.missing.map(m => m.name).join('、')}。${getSetSourceHint(setId)}`)
    }
  }

  const handleEquipSetWithPreset = (setId: string) => {
    const res = inventoryStore.equipSetWithPreset(setId)
    const setName = getEquipmentSetById(setId)?.name ?? setId
    if (res.ok) addLog(`已穿戴整套：${setName}${res.presetSaved ? '，并保存为装备方案' : ''}`)
    else if (res.missing.length > 0) {
      addLog(`缺少 ${res.missing.map(m => m.name).join('、')}。${getSetSourceHint(setId)}`)
    }
  }

  const skillStore = useSkillStore()
  const achievementStore = useAchievementStore()
  const tutorialStore = useTutorialStore()
  const { startBattleBgm, resumeNormalBgm } = useAudio()

  const tutorialHint = computed(() => {
    if (!tutorialStore.enabled || gameStore.year > 1) return null
    if (achievementStore.stats.highestMineFloor === 0)
      return '矿洞是6x6的网格，点击格子探索。遇到矿石可以开采，遇到怪物需要战斗。找到楼梯可下一层。'
    return null
  })

  const exploreLog = ref<string[]>([])

  const showMapModal = ref(false)
  const showElevatorModal = ref(false)

  /** 炸弹模式 */
  const bombModeId = ref<string | null>(null)

  /** 战斗道具面板（多选） */
  const showCombatItems = ref(false)
  const SINGLE_USE_COMBAT_ITEMS = new Set(['slayer_charm'])
  const combatItemSelections = ref<Record<string, number>>({})

  const isCombatItemSelected = (itemId: string) => itemId in combatItemSelections.value
  const getCombatItemQty = (itemId: string) => combatItemSelections.value[itemId] ?? 1
  const canSetCombatQty = (itemId: string) => !SINGLE_USE_COMBAT_ITEMS.has(itemId)
  const selectedCombatItemCount = computed(() => Object.keys(combatItemSelections.value).length)

  const toggleCombatItemSelect = (itemId: string, maxCount: number) => {
    if (combatItemSelections.value[itemId]) {
      const next = { ...combatItemSelections.value }
      delete next[itemId]
      combatItemSelections.value = next
    } else {
      combatItemSelections.value = { ...combatItemSelections.value, [itemId]: 1 }
    }
    void maxCount
  }

  const setCombatItemQty = (itemId: string, qty: number, max: number) => {
    if (!isCombatItemSelected(itemId)) return
    combatItemSelections.value = {
      ...combatItemSelections.value,
      [itemId]: Math.max(1, Math.min(max, qty))
    }
  }

  const adjustCombatItemQty = (itemId: string, delta: number, max: number) => {
    setCombatItemQty(itemId, getCombatItemQty(itemId) + delta, max)
  }

  const onCombatItemQtyInput = (itemId: string, event: Event, max: number) => {
    const val = parseInt((event.target as HTMLInputElement).value) || 1
    setCombatItemQty(itemId, val, max)
  }

  const closeCombatItems = () => {
    showCombatItems.value = false
    combatItemSelections.value = {}
  }

  const openCombatItems = () => {
    combatItemSelections.value = {}
    showCombatItems.value = true
  }

  /** 离开矿洞确认 */
  const showLeaveConfirm = ref(false)

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

    // 生命护符
    const talismanCount = inventoryStore.getItemCount('life_talisman')
    if (talismanCount > 0) {
      items.push({ itemId: 'life_talisman', name: '生命护符', desc: '最大生命值永久+15', count: talismanCount })
    }

    // 幸运铜钱
    const coinCount = inventoryStore.getItemCount('lucky_coin')
    if (coinCount > 0) {
      items.push({ itemId: 'lucky_coin', name: '幸运铜钱', desc: '掉落率永久+5%', count: coinCount })
    }

    // 守护符
    const defenseCharmCount = inventoryStore.getItemCount('defense_charm')
    if (defenseCharmCount > 0) {
      items.push({ itemId: 'defense_charm', name: '守护符', desc: '防御永久+3%', count: defenseCharmCount })
    }

    // 猎魔符
    if (!miningStore.slayerCharmActive) {
      const charmCount = inventoryStore.getItemCount('slayer_charm')
      if (charmCount > 0) {
        items.push({ itemId: 'slayer_charm', name: '猎魔符', desc: '掉落率+20%（本次探索）', count: charmCount })
      }
    }

    // 所有可食用的恢复类道具
    const seen = new Set<string>(['guild_badge', 'slayer_charm', 'monster_lure', 'life_talisman', 'lucky_coin', 'defense_charm'])
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
    const floor = miningStore.getActiveFloorData()
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

  /** 离开矿洞提示文案 */
  const leaveHint = computed(() => {
    if (miningStore.isInSkullCavern) {
      const floorData = miningStore.getActiveFloorData()
      if (floorData?.isSafePoint) return `当前为安全点，进度将保存至第${miningStore.skullCavernFloor}层。`
      const lastSafe = miningStore.skullSafePointFloor
      return lastSafe > 0 ? `下次将从第${lastSafe + 1}层开始。` : '当前进度不会保留。'
    }
    return '当前进度不会保留。'
  })

  /** 骷髅矿穴可选安全点楼层（排除最高安全点，因为主按钮已默认从那里开始） */
  const skullElevatorFloors = computed(() => {
    return miningStore.getUnlockedSkullSafePoints().filter(sp => sp < miningStore.skullSafePointFloor)
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

  const handleEnterSkullCavern = (startFrom?: number) => {
    showElevatorModal.value = false
    showCombatItems.value = false
    const msg = miningStore.enterSkullCavern(startFrom)
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

  const handleConfirmMultiUse = () => {
    const entries = Object.entries(combatItemSelections.value)
    if (entries.length === 0) return
    for (const [itemId, qty] of entries) {
      const result = miningStore.useCombatItem(itemId, qty)
      sfxClick()
      addLog(result.message)
      if (result.success) {
        exploreLog.value.push(result.message)
      }
    }
    closeCombatItems()
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

  /** 一键探索 */
  const handleAutoExplore = () => {
    if (gameStore.isPastBedtime) {
      addLog('太晚了，没法继续探索了。')
      handleEndDay()
      return
    }

    const result = miningStore.autoExplore()
    for (const msg of result.messages) {
      exploreLog.value.push(msg)
      addLog(msg)
    }

    if (result.passedOut) {
      handleEndDay()
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
    showLeaveConfirm.value = false
    const msg = miningStore.leaveMine()
    exploreLog.value = []
    bombModeId.value = null
    addLog(msg)
  }

  const confirmLeave = () => {
    handleLeave()
  }

  const dismissSafePointNotice = () => {
    sfxClick()
    miningStore.clearSafePointNotice()
  }

  // ==================== 快速切装 ====================

  const showPresetListModal = ref(false)
  const showPresetDetailModal = ref(false)
  const detailPresetId = ref<string | null>(null)
  const showEquipPropertyModal = ref(false)

  // 弹窗打开时锁定背景滚动，防止 iOS Safari 滚动穿透
  watch(
    () =>
      showMapModal.value ||
      showElevatorModal.value ||
      (miningStore.isExploring && !miningStore.inCombat) ||
      miningStore.inCombat ||
      showCombatItems.value ||
      showLeaveConfirm.value ||
      showPresetListModal.value ||
      showPresetDetailModal.value ||
      showEquipPropertyModal.value,
    hasModal => {
      if (hasModal) lockBodyScroll()
      else unlockBodyScroll()
    }
  )

  interface EquipPropertyInfo {
    category: string
    name: string
    description: string
    effects: { label: string; value: string }[]
  }

  const equipPropertyInfo = ref<EquipPropertyInfo | null>(null)

  const EFFECT_NAMES: Record<EquipmentEffectType, string> = {
    attack_bonus: '攻击力',
    crit_rate_bonus: '暴击率',
    defense_bonus: '防御',
    vampiric: '吸血',
    max_hp_bonus: '最大HP',
    stamina_reduction: '体力消耗',
    mining_stamina: '采矿体力',
    farming_stamina: '农作体力',
    fishing_stamina: '钓鱼体力',
    crop_quality_bonus: '作物品质',
    crop_growth_bonus: '作物生长',
    fish_quality_bonus: '鱼类品质',
    fishing_calm: '钓鱼稳定',
    sell_price_bonus: '售价加成',
    shop_discount: '商店折扣',
    gift_friendship: '送礼好感',
    monster_drop_bonus: '掉落率',
    exp_bonus: '经验加成',
    treasure_find: '宝箱概率',
    ore_bonus: '矿石加成',
    luck: '幸运',
    travel_speed: '旅行加速',
    foraging_stamina: '采集体力减免',
    forging_exp_bonus: '锻造经验加成'
  }

  const PCTG_EFFECTS: Set<EquipmentEffectType> = new Set([
    'crit_rate_bonus',
    'vampiric',
    'stamina_reduction',
    'mining_stamina',
    'farming_stamina',
    'fishing_stamina',
    'crop_quality_bonus',
    'crop_growth_bonus',
    'fish_quality_bonus',
    'fishing_calm',
    'sell_price_bonus',
    'shop_discount',
    'gift_friendship',
    'monster_drop_bonus',
    'exp_bonus',
    'treasure_find',
    'ore_bonus',
    'luck',
    'travel_speed',
    'defense_bonus'
  ])

  const fmtEffect = (eff: { type: EquipmentEffectType; value: number }): string => {
    if (PCTG_EFFECTS.has(eff.type)) return `+${Math.round(eff.value * 100)}%`
    return `+${eff.value}`
  }

  const detailPreset = computed(() => {
    if (!detailPresetId.value) return null
    return inventoryStore.equipmentPresets.find(p => p.id === detailPresetId.value) ?? null
  })

  const quickApplyPreset = (id: string) => {
    const result = inventoryStore.applyEquipmentPreset(id)
    addLog(result.message)
    showPresetListModal.value = false
  }

  const viewPresetDetail = (id: string) => {
    detailPresetId.value = id
    showPresetDetailModal.value = true
  }

  const viewEquipProperty = (type: 'weapon' | 'ring' | 'hat' | 'shoe', defId: string) => {
    if (type === 'weapon') {
      const def = getWeaponById(defId)
      if (!def) return
      equipPropertyInfo.value = {
        category: '武器',
        name: def.name,
        description: def.description,
        effects: [
          { label: '攻击力', value: `${def.attack}` },
          { label: '类型', value: WEAPON_TYPE_NAMES[def.type] },
          { label: '暴击率', value: `${Math.round(def.critRate * 100)}%` }
        ]
      }
    } else if (type === 'ring') {
      const def = getRingById(defId)
      if (!def) return
      equipPropertyInfo.value = {
        category: '戒指',
        name: def.name,
        description: def.description,
        effects: def.effects.map(e => ({ label: EFFECT_NAMES[e.type], value: fmtEffect(e) }))
      }
    } else if (type === 'hat') {
      const def = getHatById(defId)
      if (!def) return
      equipPropertyInfo.value = {
        category: '帽子',
        name: def.name,
        description: def.description,
        effects: def.effects.map(e => ({ label: EFFECT_NAMES[e.type], value: fmtEffect(e) }))
      }
    } else {
      const def = getShoeById(defId)
      if (!def) return
      equipPropertyInfo.value = {
        category: '鞋子',
        name: def.name,
        description: def.description,
        effects: def.effects.map(e => ({ label: EFFECT_NAMES[e.type], value: fmtEffect(e) }))
      }
    }
    showEquipPropertyModal.value = true
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
      background-color: rgba(195, 64, 67, 0.3);
    }
  }

  @keyframes combat-flash-defend {
    0%,
    100% {
      background-color: transparent;
    }
    50% {
      background-color: rgba(76, 110, 138, 0.3);
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
      border-color: rgba(200, 164, 92, 0.3);
    }
    50% {
      border-color: rgba(200, 164, 92, 0.8);
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
