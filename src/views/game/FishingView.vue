<template>
  <div>
    <h3 class="text-accent text-sm mb-3">
      <Fish :size="14" class="inline" />
      {{ currentLocationName }}钓鱼
    </h3>
    <p v-if="tutorialHint" class="text-[10px] text-muted/50 mb-2">{{ tutorialHint }}</p>

    <!-- 钓鱼地点 -->
    <div class="border border-accent/20 rounded-xs p-3 mb-4">
      <p class="text-sm text-accent mb-2">
        <MapPin :size="14" class="inline" />
        钓鱼地点
      </p>
      <div class="grid grid-cols-3 gap-1">
        <div
          v-for="loc in FISHING_LOCATIONS"
          :key="loc.id"
          class="text-center border rounded-xs px-2 py-1.5 cursor-pointer"
          :class="fishingStore.fishingLocation === loc.id ? 'border-accent/60 bg-accent/10' : 'border-accent/20 hover:bg-accent/5'"
          @click="handleSetLocation(loc.id)"
        >
          <span class="text-xs" :class="fishingStore.fishingLocation === loc.id ? 'text-accent' : ''">
            {{ loc.name }}
          </span>
        </div>
      </div>
      <p class="text-xs text-muted mt-2">{{ currentLocationDesc }}</p>
    </div>

    <!-- 装备 -->
    <div class="border border-accent/20 rounded-xs p-3 mb-4">
      <p class="text-sm text-accent mb-2">装备</p>
      <div class="flex flex-col space-y-1">
        <!-- 鱼竿 -->
        <div class="flex items-center justify-between border border-accent/10 rounded-xs px-3 py-1.5">
          <span class="text-xs">鱼竿</span>
          <span class="text-xs text-accent">{{ rodTierName }}</span>
        </div>
        <!-- 鱼饵 -->
        <div
          class="flex items-center justify-between border border-accent/20 rounded-xs px-3 py-1.5 cursor-pointer hover:bg-accent/5"
          @click="showBaitModal = true"
        >
          <span class="text-xs">鱼饵</span>
          <span class="text-xs" :class="fishingStore.equippedBait ? 'text-accent' : 'text-muted'">
            <template v-if="fishingStore.equippedBait">
              {{ getBaitName(fishingStore.equippedBait) }}
              <span class="text-muted">(&times;{{ inventoryStore.getItemCount(fishingStore.equippedBait) }})</span>
            </template>
            <template v-else>未装备</template>
          </span>
        </div>
        <!-- 浮漂 -->
        <div
          class="flex items-center justify-between border border-accent/20 rounded-xs px-3 py-1.5"
          :class="canEquipTackle ? 'cursor-pointer hover:bg-accent/5' : 'opacity-50'"
          @click="canEquipTackle && (showTackleModal = true)"
        >
          <span class="text-xs">浮漂</span>
          <span class="text-xs" :class="fishingStore.equippedTackle ? 'text-accent' : 'text-muted'">
            <template v-if="fishingStore.equippedTackle">
              {{ getTackleName(fishingStore.equippedTackle) }}
              <span class="text-muted">({{ fishingStore.tackleDurability }})</span>
            </template>
            <template v-else>{{ canEquipTackle ? '未装备' : '需铁竿以上' }}</template>
          </span>
        </div>
      </div>
    </div>

    <!-- 钓鱼操作 -->
    <div class="border border-accent/20 rounded-xs p-3 mb-4">
      <div class="flex items-center justify-between mb-2">
        <p class="text-sm text-accent">钓鱼</p>
        <span class="text-xs text-muted">{{ playerStore.stamina }}/{{ playerStore.maxStamina }} 体力</span>
      </div>
      <div
        class="flex items-center justify-between border border-accent/20 rounded-xs px-3 py-1.5 cursor-pointer hover:bg-accent/5"
        @click="handleStartFishing"
      >
        <span class="text-xs">
          <Target :size="12" class="inline" />
          抛竿
        </span>
        <span class="text-xs text-muted">消耗体力 · {{ fishTimeLabel }}</span>
      </div>
    </div>

    <!-- 钓鱼结果 -->
    <div class="border border-accent/20 rounded-xs p-3 mb-4">
      <p class="text-sm text-accent mb-2">钓鱼结果</p>
      <div v-if="lastResult" class="border border-accent/10 rounded-xs px-3 py-1.5">
        <span class="text-xs">{{ lastResult }}</span>
      </div>
      <div v-else class="flex flex-col items-center justify-center py-6 text-muted">
        <Fish :size="32" class="text-muted/30 mb-2" />
        <p class="text-xs">还没有钓过鱼，去试试吧。</p>
      </div>
    </div>

    <!-- 当前可钓鱼类 -->
    <div class="border border-accent/20 rounded-xs p-3 mb-4">
      <div class="flex items-center justify-between mb-2">
        <p class="text-sm text-accent">当前可钓鱼类</p>
        <span class="text-xs text-muted">{{ fishingStore.availableFish.length }}种</span>
      </div>
      <div v-if="fishingStore.availableFish.length > 0" class="flex flex-col space-y-1">
        <div
          v-for="f in fishingStore.availableFish"
          :key="f.name"
          class="flex items-center justify-between border border-accent/10 rounded-xs px-3 py-1.5 cursor-pointer hover:bg-accent/5"
          @click="selectedFish = f"
        >
          <span class="text-xs" :class="DIFFICULTY_COLORS[f.difficulty]">{{ f.name }}</span>
          <span class="text-[10px]" :class="DIFFICULTY_COLORS[f.difficulty]">
            {{ DIFFICULTY_NAMES[f.difficulty] }}
          </span>
        </div>
      </div>
      <div v-else class="flex flex-col items-center justify-center py-6 text-muted">
        <Fish :size="32" class="text-muted/30 mb-2" />
        <p class="text-xs">当前时段/天气/地点没有可钓的鱼。</p>
      </div>
    </div>

    <!-- 蟹笼管理 -->
    <div class="border border-accent/20 rounded-xs p-3 mb-4">
      <div class="flex items-center justify-between mb-2">
        <p class="text-sm text-accent">
          <Box :size="14" class="inline" />
          蟹笼
        </p>
        <span class="text-xs text-muted">{{ fishingStore.crabPots.length }}/10</span>
      </div>
      <div v-if="crabPotLocations.length > 0" class="flex flex-col space-y-1 mb-2">
        <div v-for="loc in crabPotLocations" :key="loc.id" class="border border-accent/10 rounded-xs p-2">
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs text-accent">{{ loc.name }}</span>
            <div class="flex space-x-1">
              <Button class="py-0 px-1" @click="handleBaitCrabPots(loc.id)">装饵</Button>
              <Button class="py-0 px-1" @click="handleRemoveCrabPot(loc.id)">回收</Button>
            </div>
          </div>
          <p class="text-[10px] text-muted">{{ loc.total }}个 · {{ loc.baited }}个已装饵</p>
        </div>
      </div>
      <div v-else-if="!hasCrabPotInBag" class="flex flex-col items-center justify-center py-6 text-muted mb-2">
        <Box :size="32" class="text-muted/30 mb-2" />
        <p class="text-xs">购买或制造蟹笼后可在此放置。</p>
      </div>
      <div
        v-if="hasCrabPotInBag"
        class="flex items-center justify-between border border-accent/20 rounded-xs px-3 py-1.5 cursor-pointer hover:bg-accent/5"
        @click="handlePlaceCrabPot"
      >
        <span class="text-xs">放置蟹笼</span>
        <span class="text-xs text-muted">{{ currentLocationName }}</span>
      </div>
    </div>

    <!-- 淘金 -->
    <div class="border border-accent/20 rounded-xs p-3">
      <p class="text-sm text-accent mb-2">
        <CircleDot :size="14" class="inline" />
        淘金
      </p>
      <div v-if="canPan">
        <p class="text-xs text-muted mb-2">雨天河水涨起，可以用淘金盘在水边淘金。</p>
        <div
          class="flex items-center justify-between border border-accent/20 rounded-xs px-3 py-1.5 cursor-pointer hover:bg-accent/5"
          @click="handlePan"
        >
          <span class="text-xs">淘金一次</span>
          <span class="text-xs text-muted">消耗体力 · {{ Math.round(panTime * 60) }}分钟</span>
        </div>
        <div v-if="panResult" class="border border-accent/10 rounded-xs px-3 py-1.5 mt-1">
          <span class="text-xs">{{ panResult }}</span>
        </div>
      </div>
      <div v-else class="flex flex-col items-center justify-center py-6 text-muted">
        <CircleDot :size="32" class="text-muted/30 mb-2" />
        <p class="text-xs">{{ panDisabledReason }}</p>
      </div>
    </div>

    <!-- 鱼饵选择弹窗 -->
    <Transition name="panel-fade">
      <div
        v-if="showBaitModal"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        @click.self="showBaitModal = false"
      >
        <div class="game-panel max-w-xs w-full relative">
          <button class="absolute top-2 right-2 text-muted hover:text-text" @click="showBaitModal = false">
            <X :size="14" />
          </button>
          <p class="text-sm text-accent mb-2">鱼饵</p>
          <!-- 当前装备 -->
          <div v-if="fishingStore.equippedBait" class="border border-accent/10 rounded-xs p-2 mb-2">
            <p class="text-[10px] text-muted mb-1">当前装备</p>
            <div class="flex items-center justify-between">
              <span class="text-xs text-accent">{{ getBaitName(fishingStore.equippedBait) }}</span>
              <Button class="py-0 px-1" @click="handleUnequipBait">卸下</Button>
            </div>
          </div>
          <!-- 可用鱼饵列表 -->
          <div v-if="availableBaits.length > 0" class="border border-accent/10 rounded-xs p-2">
            <p class="text-[10px] text-muted mb-1">背包中的鱼饵</p>
            <div class="flex flex-col space-y-1">
              <div
                v-for="b in availableBaits"
                :key="b.id"
                class="flex items-center justify-between border border-accent/10 rounded-xs px-2 py-1 cursor-pointer hover:bg-accent/5"
                @click="handleEquipBaitFromModal(b.id)"
              >
                <span class="text-xs">{{ b.name }}</span>
                <span class="text-xs text-muted">&times;{{ b.count }}</span>
              </div>
            </div>
          </div>
          <div v-else-if="!fishingStore.equippedBait" class="flex flex-col items-center justify-center py-4 text-muted">
            <Target :size="28" class="text-muted/30 mb-2" />
            <p class="text-xs">背包中没有鱼饵</p>
            <p class="text-[10px] text-muted/60 mt-0.5">可在商店购买或加工制造</p>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 浮漂选择弹窗 -->
    <Transition name="panel-fade">
      <div
        v-if="showTackleModal"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        @click.self="showTackleModal = false"
      >
        <div class="game-panel max-w-xs w-full relative">
          <button class="absolute top-2 right-2 text-muted hover:text-text" @click="showTackleModal = false">
            <X :size="14" />
          </button>
          <p class="text-sm text-accent mb-2">浮漂</p>
          <!-- 当前装备 -->
          <div v-if="fishingStore.equippedTackle" class="border border-accent/10 rounded-xs p-2 mb-2">
            <p class="text-[10px] text-muted mb-1">当前装备</p>
            <div class="flex items-center justify-between">
              <span class="text-xs text-accent">{{ getTackleName(fishingStore.equippedTackle) }}</span>
              <div class="flex items-center space-x-2">
                <span class="text-[10px] text-muted">耐久 {{ fishingStore.tackleDurability }}</span>
                <Button class="py-0 px-1" @click="handleUnequipTackle">卸下</Button>
              </div>
            </div>
          </div>
          <!-- 可用浮漂列表 -->
          <div v-if="availableTackles.length > 0" class="border border-accent/10 rounded-xs p-2">
            <p class="text-[10px] text-muted mb-1">背包中的浮漂</p>
            <div class="flex flex-col space-y-1">
              <div
                v-for="t in availableTackles"
                :key="t.id"
                class="flex items-center justify-between border border-accent/10 rounded-xs px-2 py-1 cursor-pointer hover:bg-accent/5"
                @click="handleEquipTackleFromModal(t.id)"
              >
                <span class="text-xs">{{ t.name }}</span>
                <span class="text-xs text-muted">&times;{{ t.count }}</span>
              </div>
            </div>
          </div>
          <div v-else-if="!fishingStore.equippedTackle" class="flex flex-col items-center justify-center py-4 text-muted">
            <MapPin :size="28" class="text-muted/30 mb-2" />
            <p class="text-xs">背包中没有浮漂</p>
            <p class="text-[10px] text-muted/60 mt-0.5">可在商店购买或加工制造</p>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 钓鱼游戏弹窗 -->
    <Transition name="panel-fade">
      <div
        v-if="showFishingModal && miniGameParams"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        @click.self="handleCloseFishingModal"
      >
        <div class="game-panel max-w-sm w-full relative">
          <button class="absolute top-2 right-2 text-muted hover:text-text" @click="handleCloseFishingModal">
            <X :size="14" />
          </button>
          <p class="text-sm text-accent mb-2">
            <Fish :size="14" class="inline" />
            钓鱼
          </p>
          <!-- 放弃确认 -->
          <div v-if="showCloseConfirm" class="border border-danger/40 rounded-xs p-3 mb-3">
            <p class="text-xs text-danger mb-2">鱼还在咬钩，确定要放弃吗？</p>
            <div class="flex space-x-2">
              <Button class="text-danger" @click="handleConfirmClose">确认放弃</Button>
              <Button @click="showCloseConfirm = false">继续钓鱼</Button>
            </div>
          </div>
          <FishingMiniGame v-bind="miniGameParams" @complete="handleMiniGameComplete" />
        </div>
      </div>
    </Transition>

    <!-- 钓鱼结果弹窗 -->
    <Transition name="panel-fade">
      <div v-if="catchResult" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div class="game-panel max-w-xs w-full relative">
          <button class="absolute top-2 right-2 text-muted hover:text-text" @click="dismissCatchResult">
            <X :size="14" />
          </button>

          <p
            class="text-sm mb-2"
            :class="
              catchResult.success && catchResult.quality
                ? QUALITY_COLORS[catchResult.quality]
                : catchResult.success
                  ? 'text-accent'
                  : 'text-danger'
            "
          >
            {{ catchResult.fishName }}
          </p>

          <div v-if="catchResult.description" class="border border-accent/10 rounded-xs p-2 mb-2">
            <p class="text-xs text-muted">{{ catchResult.description }}</p>
          </div>

          <div class="border border-accent/10 rounded-xs p-2 mb-2">
            <div class="flex items-center justify-between">
              <span class="text-xs text-muted">结果</span>
              <span class="text-xs" :class="catchResult.success ? 'text-success' : 'text-danger'">
                {{ catchResult.success ? '成功捕获' : '鱼跑了' }}
              </span>
            </div>
            <div v-if="catchResult.success && catchResult.quantity" class="flex items-center justify-between mt-0.5">
              <span class="text-xs text-muted">数量</span>
              <span class="text-xs">×{{ catchResult.quantity }}</span>
            </div>
            <div v-if="catchResult.success && catchResult.weight" class="flex items-center justify-between mt-0.5">
              <span class="text-xs text-muted">重量</span>
              <span class="text-xs text-accent">
                {{ catchResult.weight }}斤
                <span v-if="catchResult.isNewRecord" class="text-quality-supreme ml-1">新纪录!</span>
              </span>
            </div>
            <div v-if="catchResult.success && catchResult.quality" class="flex items-center justify-between mt-0.5">
              <span class="text-xs text-muted">品质</span>
              <span class="text-xs" :class="QUALITY_COLORS[catchResult.quality]">{{ QUALITY_NAMES[catchResult.quality] }}</span>
            </div>
            <div v-if="catchResult.difficulty" class="flex items-center justify-between mt-0.5">
              <span class="text-xs text-muted">难度</span>
              <span class="text-xs" :class="DIFFICULTY_COLORS[catchResult.difficulty]">{{ DIFFICULTY_NAMES[catchResult.difficulty] }}</span>
            </div>
            <div v-if="catchResult.sellPrice" class="flex items-center justify-between mt-0.5">
              <span class="text-xs text-muted">售价</span>
              <span class="text-xs text-accent">{{ catchResult.sellPrice }}文</span>
            </div>
          </div>

          <p v-if="catchResult.message.includes('宝箱')" class="text-xs text-accent mb-2">
            {{ catchResult.message.slice(catchResult.message.indexOf('宝箱')) }}
          </p>

          <Button class="w-full justify-center !bg-accent !text-bg" @click="dismissCatchResult">确认</Button>
        </div>
      </div>
    </Transition>

    <!-- 鱼类详情弹窗 -->
    <Transition name="panel-fade">
      <div
        v-if="selectedFish"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        @click.self="selectedFish = null"
      >
        <div class="game-panel max-w-xs w-full relative">
          <button class="absolute top-2 right-2 text-muted hover:text-text" @click="selectedFish = null">
            <X :size="14" />
          </button>
          <p class="text-sm mb-2" :class="DIFFICULTY_COLORS[selectedFish.difficulty]">{{ selectedFish.name }}</p>

          <div class="border border-accent/10 rounded-xs p-2 mb-2">
            <p class="text-xs text-muted">{{ selectedFish.description }}</p>
          </div>

          <div class="border border-accent/10 rounded-xs p-2">
            <div class="flex items-center justify-between">
              <span class="text-xs text-muted">难度</span>
              <span class="text-xs" :class="DIFFICULTY_COLORS[selectedFish.difficulty]">
                {{ DIFFICULTY_NAMES[selectedFish.difficulty] }}
              </span>
            </div>
            <div class="flex items-center justify-between mt-0.5">
              <span class="text-xs text-muted">重量</span>
              <span class="text-xs">{{ selectedFish.minWeight }} – {{ selectedFish.maxWeight }} 斤</span>
            </div>
            <div class="flex items-center justify-between mt-0.5">
              <span class="text-xs text-muted">基础售价</span>
              <span class="text-xs text-accent">{{ selectedFish.sellPrice }}文</span>
            </div>
            <div class="flex items-center justify-between mt-0.5">
              <span class="text-xs text-muted">季节</span>
              <span class="text-xs">{{ selectedFish.season.map(s => SEASON_LABEL[s] ?? s).join('、') }}</span>
            </div>
            <div class="flex items-center justify-between mt-0.5">
              <span class="text-xs text-muted">天气</span>
              <span class="text-xs">{{ selectedFish.weather.map(w => WEATHER_LABEL[w] ?? w).join('、') }}</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { Fish, X, Target, MapPin, Box, CircleDot } from 'lucide-vue-next'
  import { useAchievementStore } from '@/stores/useAchievementStore'
  import { useFishingStore } from '@/stores/useFishingStore'
  import { useGameStore } from '@/stores/useGameStore'
  import { useInventoryStore } from '@/stores/useInventoryStore'
  import { usePlayerStore } from '@/stores/usePlayerStore'
  import { useSkillStore } from '@/stores/useSkillStore'
  import { useTutorialStore } from '@/stores/useTutorialStore'
  import { getBaitById, getTackleById } from '@/data/processing'
  import { FISHING_LOCATIONS } from '@/data/fish'
  import type { BaitType, TackleType, FishingLocation, FishDef, MiniGameParams, MiniGameResult, Quality } from '@/types'
  import { ACTION_TIME_COSTS, TOOL_TIME_SAVINGS, SKILL_TIME_REDUCTION_PER_LEVEL, MIN_ACTION_MINUTES } from '@/data/timeConstants'
  import { sfxFishCatch, sfxLineBroken, sfxClick } from '@/composables/useAudio'
  import { addLog } from '@/composables/useGameLog'
  import { handleEndDay } from '@/composables/useEndDay'
  import FishingMiniGame from '@/components/game/FishingMiniGame.vue'
  import Button from '@/components/game/Button.vue'

  const fishingStore = useFishingStore()
  const gameStore = useGameStore()
  const inventoryStore = useInventoryStore()
  const playerStore = usePlayerStore()
  const skillStore = useSkillStore()
  const achievementStore = useAchievementStore()
  const tutorialStore = useTutorialStore()

  const tutorialHint = computed(() => {
    if (!tutorialStore.enabled || gameStore.year > 1) return null
    if (achievementStore.stats.totalFishCaught === 0) return '选择一个钓点后点击「开始钓鱼」。鱼上钩后需要完成小游戏来捕获。'
    return null
  })

  // === State ===

  const lastResult = ref<string | null>(null)
  const miniGameParams = ref<MiniGameParams | null>(null)
  const panResult = ref<string | null>(null)

  const showBaitModal = ref(false)
  const showTackleModal = ref(false)
  const showFishingModal = ref(false)
  const showCloseConfirm = ref(false)
  const miniGameCompleted = ref(false)
  const selectedFish = ref<FishDef | null>(null)
  const catchResult = ref<{
    fishName: string
    fishId?: string
    difficulty?: string
    sellPrice?: number
    description?: string
    quality?: Quality
    quantity?: number
    weight?: number
    isNewRecord?: boolean
    success: boolean
    message: string
  } | null>(null)

  // === Computed ===

  /** 钓鱼耗时（小时），受工具和技能减免 */
  const fishTime = computed(() => {
    const baseMin = ACTION_TIME_COSTS.fishStart * 60
    const toolTier = inventoryStore.getTool('fishingRod')?.tier ?? 'basic'
    const saving = TOOL_TIME_SAVINGS[toolTier] ?? 0
    const skillReduction = skillStore.getSkill('fishing').level * SKILL_TIME_REDUCTION_PER_LEVEL
    return Math.max(MIN_ACTION_MINUTES, Math.round((baseMin - saving) * (1 - skillReduction))) / 60
  })

  const fishTimeLabel = computed(() => `${Math.round(fishTime.value * 60)}分钟`)

  /** 淘金耗时（小时），受工具和技能减免 */
  const panTime = computed(() => {
    const baseMin = ACTION_TIME_COSTS.pan * 60
    const toolTier = inventoryStore.getTool('pan')?.tier ?? 'basic'
    const saving = TOOL_TIME_SAVINGS[toolTier] ?? 0
    const skillReduction = skillStore.getSkill('fishing').level * SKILL_TIME_REDUCTION_PER_LEVEL
    return Math.max(MIN_ACTION_MINUTES, Math.round((baseMin - saving) * (1 - skillReduction))) / 60
  })

  const currentLocationName = computed(() => {
    return FISHING_LOCATIONS.find(l => l.id === fishingStore.fishingLocation)?.name ?? '溪流'
  })

  const currentLocationDesc = computed(() => {
    return FISHING_LOCATIONS.find(l => l.id === fishingStore.fishingLocation)?.description ?? ''
  })

  const rodTierName = computed(() => {
    const tier = inventoryStore.getTool?.('fishingRod')?.tier ?? 'basic'
    const names: Record<string, string> = { basic: '竹竿', iron: '铁竿', steel: '钢竿', iridium: '铱金竿' }
    return names[tier] ?? tier
  })

  const canEquipTackle = computed(() => {
    const tier = inventoryStore.getTool?.('fishingRod')?.tier ?? 'basic'
    return tier !== 'basic'
  })

  const ALL_BAIT_TYPES: BaitType[] = ['standard_bait', 'wild_bait', 'magic_bait', 'deluxe_bait', 'targeted_bait']
  const availableBaits = computed(() => {
    return ALL_BAIT_TYPES.map(id => ({ id, name: getBaitById(id)?.name ?? id, count: inventoryStore.getItemCount(id) })).filter(
      b => b.count > 0
    )
  })

  const availableTackles = computed(() => {
    const tackleTypes: TackleType[] = ['spinner', 'trap_bobber', 'cork_bobber', 'quality_bobber', 'lead_bobber']
    if (!canEquipTackle.value) return []
    return tackleTypes
      .map(id => ({ id, name: getTackleById(id)?.name ?? id, count: inventoryStore.getItemCount(id) }))
      .filter(t => t.count > 0)
  })

  const hasCrabPotInBag = computed(() => inventoryStore.getItemCount('crab_pot') > 0)

  const crabPotLocations = computed(() => {
    const result: { id: string; name: string; total: number; baited: number }[] = []
    for (const loc of FISHING_LOCATIONS) {
      const info = fishingStore.crabPotsByLocation[loc.id as FishingLocation]
      if (info) {
        result.push({ id: loc.id, name: loc.name, total: info.total, baited: info.baited })
      }
    }
    return result
  })

  const PAN_LOCATIONS: FishingLocation[] = ['creek', 'river', 'waterfall']
  const canPan = computed(() => gameStore.isRainy && PAN_LOCATIONS.includes(fishingStore.fishingLocation))
  const panDisabledReason = computed(() => {
    if (!gameStore.isRainy) return '需要雨天才能淘金（河水上涨时沙金露出）。'
    if (!PAN_LOCATIONS.includes(fishingStore.fishingLocation)) return '当前地点无法淘金，需前往溪流、江河或瀑布。'
    return ''
  })

  const DIFFICULTY_NAMES: Record<string, string> = {
    easy: '简单',
    normal: '普通',
    hard: '困难',
    legendary: '传说'
  }
  const DIFFICULTY_COLORS: Record<string, string> = {
    easy: 'text-success',
    normal: 'text-muted',
    hard: 'text-danger',
    legendary: 'text-accent'
  }

  const SEASON_LABEL: Record<string, string> = { spring: '春', summer: '夏', autumn: '秋', winter: '冬' }
  const WEATHER_LABEL: Record<string, string> = {
    any: '任意',
    sunny: '晴',
    rainy: '雨',
    stormy: '雷雨',
    snowy: '雪',
    windy: '大风'
  }

  // === Helpers ===

  const getBaitName = (type: BaitType): string => getBaitById(type)?.name ?? type
  const getTackleName = (type: TackleType): string => getTackleById(type)?.name ?? type

  // === Location ===

  const handleSetLocation = (loc: FishingLocation) => {
    fishingStore.setLocation(loc)
    sfxClick()
  }

  // === Equipment ===

  const handleEquipBaitFromModal = (baitId: BaitType) => {
    const result = fishingStore.equipBait(baitId)
    addLog(result.message)
    showBaitModal.value = false
  }

  const handleUnequipBait = () => {
    const msg = fishingStore.unequipBait()
    addLog(msg)
  }

  const handleEquipTackleFromModal = (tackleId: TackleType) => {
    const result = fishingStore.equipTackle(tackleId)
    addLog(result.message)
    showTackleModal.value = false
  }

  const handleUnequipTackle = () => {
    const msg = fishingStore.unequipTackle()
    addLog(msg)
  }

  // === Fishing ===

  const handleStartFishing = () => {
    if (gameStore.isPastBedtime) {
      addLog('太晚了，没法钓鱼了。')
      handleEndDay()
      return
    }
    if (!inventoryStore.isToolAvailable('fishingRod')) {
      addLog('鱼竿正在升级中，无法钓鱼。')
      return
    }
    const result = fishingStore.startFishing()
    if (result.success) {
      sfxClick()
      const tr = gameStore.advanceTime(fishTime.value)
      if (tr.message) addLog(tr.message)
      if (tr.passedOut) {
        handleEndDay()
        return
      }
      if (result.junk) {
        // 垃圾直接入包，不进入小游戏
        lastResult.value = result.message
      } else {
        miniGameParams.value = fishingStore.calculateMiniGameParams()
        miniGameCompleted.value = false
        showCloseConfirm.value = false
        showFishingModal.value = true
      }
    }
    addLog(result.message)
    if (!result.success) {
      lastResult.value = result.message
    }
  }

  const QUALITY_NAMES: Record<Quality, string> = {
    normal: '普通',
    fine: '优良',
    excellent: '优质',
    supreme: '极品'
  }

  const QUALITY_COLORS: Record<Quality, string> = {
    normal: 'text-muted',
    fine: 'text-quality-fine',
    excellent: 'text-quality-excellent',
    supreme: 'text-quality-supreme'
  }

  const handleMiniGameComplete = (result: MiniGameResult) => {
    miniGameCompleted.value = true

    const ratingNames: Record<string, string> = {
      perfect: '完美',
      excellent: '优秀',
      good: '良好',
      poor: '失败'
    }
    addLog(`小游戏评级：${ratingNames[result.rating]}！`)

    const catchData = fishingStore.completeFishing(result.rating)
    if (catchData) {
      addLog(catchData.message)
      lastResult.value = catchData.message
      if (catchData.success) sfxFishCatch()
      else sfxLineBroken()

      // 显示结果弹窗
      catchResult.value = {
        fishName: catchData.fishName ?? '',
        fishId: catchData.fishId,
        difficulty: catchData.difficulty,
        sellPrice: catchData.sellPrice,
        description: catchData.description,
        quality: catchData.quality,
        quantity: catchData.quantity,
        weight: catchData.weight,
        isNewRecord: catchData.isNewRecord,
        success: catchData.success,
        message: catchData.message
      }
    }

    showFishingModal.value = false
    showCloseConfirm.value = false
    miniGameParams.value = null
  }

  const dismissCatchResult = () => {
    catchResult.value = null
  }

  const handleCloseFishingModal = () => {
    if (!miniGameCompleted.value) {
      showCloseConfirm.value = true
    } else {
      showFishingModal.value = false
      miniGameParams.value = null
    }
  }

  const handleConfirmClose = () => {
    showCloseConfirm.value = false
    showFishingModal.value = false
    miniGameParams.value = null
    lastResult.value = '放弃了钓鱼，鱼跑掉了。'
    addLog('放弃了钓鱼，鱼跑掉了。')
  }

  // === Crab Pots ===

  const handlePlaceCrabPot = () => {
    const result = fishingStore.placeCrabPot(fishingStore.fishingLocation)
    addLog(result.message)
  }

  const handleRemoveCrabPot = (locId: string) => {
    const result = fishingStore.removeCrabPot(locId as FishingLocation)
    addLog(result.message)
  }

  const handleBaitCrabPots = (locId: string) => {
    const result = fishingStore.baitCrabPots(locId as FishingLocation)
    addLog(result.message)
  }

  // === Panning ===

  const handlePan = () => {
    if (gameStore.isPastBedtime) {
      addLog('太晚了，没法淘金了。')
      handleEndDay()
      return
    }

    if (!inventoryStore.isToolAvailable('pan')) {
      addLog('淘金盘正在升级中，无法淘金。')
      return
    }

    const panMultiplier = inventoryStore.getToolStaminaMultiplier('pan')
    const cost = Math.max(1, Math.floor(4 * panMultiplier))
    if (!playerStore.consumeStamina(cost)) {
      addLog('体力不足，无法淘金。')
      return
    }

    const panTier = inventoryStore.getTool('pan')?.tier ?? 'basic'
    const tiers: string[] = ['basic', 'iron', 'steel', 'iridium']
    const tierIndex = tiers.indexOf(panTier)

    const roll = Math.random()
    let itemId: string
    let qty = 1
    let name: string

    if (roll < 0.4) {
      itemId = 'copper_ore'
      qty = 1
      name = '铜矿'
    } else if (roll < 0.62) {
      itemId = tierIndex >= 1 ? 'iron_ore' : 'copper_ore'
      qty = 1
      name = tierIndex >= 1 ? '铁矿' : '铜矿'
    } else if (roll < 0.75) {
      itemId = tierIndex >= 2 ? 'gold_ore' : 'iron_ore'
      qty = 1
      name = tierIndex >= 2 ? '金矿' : '铁矿'
    } else if (roll < 0.84) {
      itemId = 'quartz'
      qty = 1
      name = '石英'
    } else if (roll < 0.9) {
      itemId = 'jade'
      qty = 1
      name = '翡翠'
    } else if (roll < 0.95) {
      itemId = 'ruby'
      qty = 1
      name = '红宝石'
    } else {
      const goldNuggetChance = tierIndex >= 3 ? 0.12 : 0.04
      if (Math.random() < goldNuggetChance / 0.05) {
        itemId = 'gold_nugget'
        qty = 1
        name = '金砂'
      } else {
        itemId = 'copper_ore'
        qty = 1
        name = '铜矿'
      }
    }

    inventoryStore.addItem(itemId, qty)
    achievementStore.discoverItem(itemId)
    skillStore.addExp('mining', 5)
    panResult.value = `淘到了${name}！(-${cost}体力)`
    addLog(`淘金获得了${name}。(-${cost}体力)`)

    const tr = gameStore.advanceTime(panTime.value)
    if (tr.message) addLog(tr.message)
    if (tr.passedOut) handleEndDay()
  }
</script>
