<template>
  <div>
    <!-- 标签切换 -->
    <div class="flex space-x-1.5 mb-3">
      <Button
        class="flex-1 justify-center"
        :class="{ '!bg-accent !text-bg': activeTab === 'process' }"
        :icon="Boxes"
        @click="activeTab = 'process'"
      >
        加工区
        <span class="text-[10px] ml-0.5 opacity-70">{{ processingStore.machineCount }}/{{ processingStore.maxMachines }}</span>
      </Button>
      <Button
        class="flex-1 justify-center"
        :class="{ '!bg-accent !text-bg': activeTab === 'craft' }"
        :icon="Hammer"
        @click="activeTab = 'craft'"
      >
        制造
      </Button>
    </div>

    <!-- 加工区 -->
    <div v-if="activeTab === 'process'" class="border border-accent/20 rounded-xs p-3">
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center space-x-1.5 text-sm text-accent">
          <Boxes :size="14" />
          <span>加工区</span>
          <span class="text-[10px] text-muted font-normal">{{ processingStore.machineCount }}/{{ processingStore.maxMachines }}</span>
        </div>
        <button
          v-if="nextUpgrade || processingStore.workshopLevel > 0"
          class="text-[10px] px-2 py-0.5 border rounded-xs"
          :class="nextUpgrade ? 'border-accent/30 text-accent hover:bg-accent/5 cursor-pointer' : 'border-accent/10 text-muted'"
          @click="showUpgradeModal = true"
        >
          <ArrowUpCircle :size="10" class="inline mr-0.5" />
          工坊 Lv.{{ processingStore.workshopLevel }}
        </button>
      </div>

      <!-- 只显示可加工 -->
      <label class="flex items-center space-x-1 mb-2 cursor-pointer select-none">
        <input type="checkbox" v-model="onlyAvailable" class="accent-accent" />
        <span class="text-[10px] text-muted">只显示有材料的配方</span>
      </label>

      <!-- 空状态 -->
      <div v-if="processingStore.machines.length === 0" class="flex flex-col items-center justify-center py-8">
        <Boxes :size="36" class="text-accent/20 mb-2" />
        <p class="text-xs text-muted">还没有机器</p>
        <p class="text-[10px] text-muted/50 mt-0.5">切换到「制造」标签制造一台加工机器吧</p>
      </div>

      <!-- 机器列表（按类型分组） -->
      <div v-else class="flex flex-col space-y-2">
        <div v-for="group in machineGroups" :key="group.machineType" class="border border-accent/10 rounded-xs">
          <!-- 分组标题（可折叠） -->
          <div
            class="flex items-center justify-between px-2 py-1.5 cursor-pointer hover:bg-accent/5 select-none"
            @click="toggleGroup(group.machineType)"
          >
            <div class="flex items-center space-x-1">
              <span class="text-xs text-accent">{{ group.name }}</span>
              <span class="text-[10px] text-muted">×{{ group.slots.length }}</span>
              <span v-if="group.slots.some(s => s.slot.ready)" class="text-[10px] text-success">
                ({{ group.slots.filter(s => s.slot.ready).length }}可收取)
              </span>
            </div>
            <span class="text-[10px] text-muted">{{ processingStore.collapsedGroups.has(group.machineType) ? '▸' : '▾' }}</span>
          </div>

          <!-- 展开的机器明细 -->
          <div v-if="!processingStore.collapsedGroups.has(group.machineType)" class="flex flex-col space-y-1.5 px-2 pb-2">
            <div
              v-for="{ slot, originalIndex } in group.slots"
              :key="originalIndex"
              class="border rounded-xs p-2"
              :class="slot.ready ? 'border-success/30' : 'border-accent/20'"
            >
              <div class="flex items-center justify-between mb-1.5">
                <span class="text-xs" :class="slot.ready ? 'text-success' : 'text-accent'">{{ group.name }}</span>
                <button class="text-muted hover:text-danger" @click="handleRemoveMachine(originalIndex)">
                  <Trash2 :size="12" />
                </button>
              </div>

              <!-- 空闲：选择配方 -->
              <div v-if="!slot.recipeId">
                <!-- 种子制造机：按品质展开 -->
                <template v-if="slot.machineType === 'seed_maker'">
                  <div v-if="getSeedMakerQualityRecipes(slot.machineType).length > 0" class="grid space-y-1">
                    <Button
                      v-for="qr in getSeedMakerQualityRecipes(slot.machineType)"
                      :key="qr.recipe.id + ':' + qr.quality"
                      :disabled="!qr.available"
                      @click="handleStartProcessing(originalIndex, qr.recipe.id, qr.quality)"
                    >
                      {{ qr.recipe.name }}
                      <span
                        v-if="qr.quality !== 'normal'"
                        :class="{
                          'text-quality-fine': qr.quality === 'fine',
                          'text-quality-excellent': qr.quality === 'excellent',
                          'text-quality-supreme': qr.quality === 'supreme'
                        }"
                      >
                        [{{ QUALITY_NAMES[qr.quality] }}]
                      </span>
                      <span class="text-muted">({{ qr.count }}/{{ qr.recipe.inputQuantity }})</span>
                    </Button>
                  </div>
                  <p v-else class="text-xs text-muted">{{ onlyAvailable ? '没有材料足够的配方' : '无可用配方' }}</p>
                </template>
                <!-- 熔炉：同类矿石，每次最多5个 -->
                <template v-else-if="slot.machineType === 'furnace'">
                  <p class="text-[10px] text-muted mb-1">选择同类矿石，一次最多投入5个（1:1产出锭）</p>
                  <div v-if="getFilteredRecipes('furnace').length > 0" class="grid space-y-1">
                    <Button
                      v-for="recipe in getFilteredRecipes('furnace')"
                      :key="recipe.id"
                      :disabled="!recipe.inputItemId || !hasCombinedItem(recipe.inputItemId, 1)"
                      @click="openFurnaceBatchModal(originalIndex, recipe.id)"
                    >
                      {{ getItemName(recipe.inputItemId!) }} → {{ recipe.name }}
                      <span class="text-muted">(库存{{ getCombinedItemCount(recipe.inputItemId!) }})</span>
                    </Button>
                  </div>
                  <p v-else class="text-xs text-muted">{{ onlyAvailable ? '没有可用矿石' : '无可用矿石' }}</p>
                </template>
                <!-- 其他机器：普通配方列表 -->
                <template v-else>
                  <div v-if="getFilteredRecipes(slot.machineType).length > 0" class="grid space-y-1">
                    <Button
                      v-for="recipe in getFilteredRecipes(slot.machineType)"
                      :key="recipe.id"
                      :disabled="recipe.inputItemId !== null && !hasCombinedItem(recipe.inputItemId, recipe.inputQuantity)"
                      @click="handleStartProcessing(originalIndex, recipe.id)"
                    >
                      {{ recipe.name }}
                      <span v-if="recipe.inputItemId" class="text-muted">
                        ({{ getItemName(recipe.inputItemId) }} {{ getCombinedItemCount(recipe.inputItemId) }}/{{ recipe.inputQuantity }})
                      </span>
                    </Button>
                  </div>
                  <p v-else class="text-xs text-muted">{{ onlyAvailable ? '没有材料足够的配方' : '无可用配方' }}</p>
                </template>
              </div>

              <!-- 加工中 -->
              <div v-else-if="!slot.ready">
                <div class="flex items-center justify-between text-xs mb-1">
                  <span class="text-muted">{{ getProcessingStatusLabel(slot) }}</span>
                  <span class="text-muted">{{ slot.daysProcessed }}/{{ slot.totalDays }}天</span>
                </div>
                <div class="h-1 bg-bg rounded-xs border border-accent/10 mb-1.5">
                  <div
                    class="h-full bg-accent rounded-xs transition-all"
                    :style="{ width: Math.floor((slot.daysProcessed / slot.totalDays) * 100) + '%' }"
                  />
                </div>
                <Button class="w-full justify-center" :icon="X" :icon-size="10" @click="handleCancelProcessing(originalIndex)">
                  取消加工
                </Button>
              </div>

              <!-- 完成 -->
              <div v-else>
                <Button
                  class="w-full justify-center !bg-accent !text-bg"
                  :icon="Package"
                  :icon-size="12"
                  @click="handleCollect(originalIndex)"
                >
                  收取 {{ getCollectLabel(slot) }}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 制造区 -->
    <div v-if="activeTab === 'craft'" class="border border-accent/20 rounded-xs p-3">
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center space-x-1.5 text-sm text-accent">
          <Hammer :size="14" />
          <span>制造</span>
        </div>
        <span class="text-xs text-muted">机器 {{ processingStore.machineCount }}/{{ processingStore.maxMachines }}</span>
      </div>

      <div v-for="cat in craftCategories" :key="cat.label" class="mb-3 last:mb-0">
        <p class="text-xs text-muted mb-1">{{ cat.label }}</p>
        <div class="flex flex-col space-y-1 max-h-60 overflow-y-auto">
          <div
            v-for="item in cat.items"
            :key="item.id"
            class="flex items-center justify-between border border-accent/20 rounded-xs px-3 py-1.5 cursor-pointer hover:bg-accent/5 mr-1"
            @click="openCraftModal(item)"
          >
            <div class="text-xs truncate mr-2">
              {{ item.name }}
              <span v-if="item.badge" class="text-muted ml-1">[{{ item.badge }}]</span>
            </div>
            <span v-if="item.cost > 0" class="text-xs text-accent whitespace-nowrap">{{ item.cost }}文</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 工坊扩建弹窗 -->
    <Transition name="panel-fade">
      <div
        v-if="showUpgradeModal"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        @click.self="showUpgradeModal = false"
      >
        <div class="game-panel max-w-xs w-full relative">
          <button class="absolute top-2 right-2 text-muted hover:text-text" @click="showUpgradeModal = false">
            <X :size="14" />
          </button>

          <p class="text-sm text-accent mb-2">
            <ArrowUpCircle :size="14" class="inline mr-0.5" />
            工坊信息
          </p>

          <!-- 当前状态 -->
          <div class="border border-accent/10 rounded-xs p-2 mb-2">
            <div class="flex items-center justify-between">
              <span class="text-xs text-muted">当前等级</span>
              <span class="text-xs text-accent">Lv.{{ processingStore.workshopLevel }}</span>
            </div>
            <div class="flex items-center justify-between mt-0.5">
              <span class="text-xs text-muted">机器上限</span>
              <span class="text-xs text-text">{{ processingStore.maxMachines }} 台</span>
            </div>
          </div>

          <!-- 下一级升级 -->
          <template v-if="nextUpgrade">
            <div class="border border-accent/10 rounded-xs p-2 mb-2">
              <p class="text-xs text-muted mb-1">升级至 Lv.{{ processingStore.workshopLevel + 1 }}</p>
              <div class="flex items-center justify-between">
                <span class="text-xs text-muted">机器上限</span>
                <span class="text-xs text-text">{{ processingStore.maxMachines }} → {{ processingStore.maxMachines + 5 }}</span>
              </div>
            </div>

            <!-- 所需材料 -->
            <div class="border border-accent/10 rounded-xs p-2 mb-2">
              <p class="text-xs text-muted mb-1">所需材料</p>
              <div v-for="mat in nextUpgrade.materials" :key="mat.itemId" class="flex items-center justify-between">
                <span class="text-xs text-muted">{{ getItemById(mat.itemId)?.name }}</span>
                <span class="text-xs" :class="getCombinedItemCount(mat.itemId) >= mat.quantity ? '' : 'text-danger'">
                  {{ getCombinedItemCount(mat.itemId) }}/{{ mat.quantity }}
                </span>
              </div>
              <div class="flex items-center justify-between mt-0.5">
                <span class="text-xs text-muted">铜钱</span>
                <span class="text-xs" :class="playerStore.money >= nextUpgrade.cost ? '' : 'text-danger'">{{ nextUpgrade.cost }}文</span>
              </div>
            </div>

            <!-- 扩建按钮 -->
            <Button
              v-if="!showUpgradeConfirm"
              class="w-full justify-center"
              :class="{ '!bg-accent !text-bg': canUpgrade }"
              :icon="ArrowUpCircle"
              :icon-size="12"
              :disabled="!canUpgrade"
              @click="showUpgradeConfirm = true"
            >
              扩建工坊
            </Button>

            <!-- 确认 -->
            <div v-else class="flex space-x-1">
              <Button class="flex-1 justify-center" @click="showUpgradeConfirm = false">取消</Button>
              <Button
                class="flex-1 justify-center !bg-accent !text-bg"
                :icon="ArrowUpCircle"
                :icon-size="12"
                @click="handleUpgradeFromModal"
              >
                确认扩建
              </Button>
            </div>
          </template>

          <p v-else class="text-[10px] text-muted text-center">工坊已达到最高等级。</p>
        </div>
      </div>
    </Transition>

    <!-- 熔炉投入数量 -->
    <Transition name="panel-fade">
      <div
        v-if="furnaceBatchModal"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        @click.self="furnaceBatchModal = null"
      >
        <div class="game-panel max-w-xs w-full relative">
          <button class="absolute top-2 right-2 text-muted hover:text-text" @click="furnaceBatchModal = null">
            <X :size="14" />
          </button>
          <p class="text-sm text-accent mb-2">投入数量</p>
          <p v-if="furnaceBatchRecipe" class="text-xs text-muted mb-2">
            {{ getItemName(furnaceBatchRecipe.inputItemId!) }} → {{ furnaceBatchRecipe.name }}（库存
            {{ getCombinedItemCount(furnaceBatchRecipe.inputItemId!) }}，最多5个）
          </p>
          <div class="flex space-x-1 mb-3">
            <Button
              v-for="n in 5"
              :key="n"
              class="flex-1 justify-center"
              :class="{ '!bg-accent !text-bg': furnaceBatchQty === n }"
              :disabled="!furnaceBatchRecipe || !hasCombinedItem(furnaceBatchRecipe.inputItemId!, n)"
              @click="furnaceBatchQty = n"
            >
              {{ n }}
            </Button>
          </div>
          <p class="text-xs text-muted mb-2 text-center">将产出 {{ furnaceBatchQty }} 个{{ furnaceBatchRecipe?.name ?? '金属锭' }}</p>
          <Button
            class="w-full justify-center !bg-accent !text-bg"
            :disabled="!furnaceBatchRecipe || !hasCombinedItem(furnaceBatchRecipe.inputItemId!, furnaceBatchQty)"
            @click="confirmFurnaceBatch"
          >
            开始冶炼
          </Button>
        </div>
      </div>
    </Transition>

    <!-- 制造弹窗 -->
    <Transition name="panel-fade">
      <div v-if="craftModal" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" @click.self="craftModal = null">
        <div class="game-panel max-w-xs w-full relative">
          <button class="absolute top-2 right-2 text-muted hover:text-text" @click="craftModal = null">
            <X :size="14" />
          </button>

          <p class="text-sm text-accent mb-2">{{ craftModal.name }}</p>

          <div class="border border-accent/10 rounded-xs p-2 mb-2">
            <p class="text-xs text-muted">{{ craftModal.description }}</p>
            <p v-if="craftModal.badge" class="text-xs text-muted mt-0.5">当前：{{ craftModal.badge }}</p>
          </div>

          <div class="border border-accent/10 rounded-xs p-2 mb-2">
            <p class="text-xs text-muted mb-1">所需材料</p>
            <div v-for="mat in craftModal.materials" :key="mat.itemId" class="flex items-center justify-between">
              <span class="text-xs text-muted">{{ getItemName(mat.itemId) }}</span>
              <span class="text-xs" :class="getCombinedItemCount(mat.itemId) >= mat.quantity * displayQty ? '' : 'text-danger'">
                {{ getCombinedItemCount(mat.itemId) }}/{{ mat.quantity * displayQty }}
              </span>
            </div>
            <div v-if="craftModal.cost > 0" class="flex items-center justify-between mt-0.5">
              <span class="text-xs text-muted">铜钱</span>
              <span class="text-xs" :class="playerStore.money >= craftModal.cost * displayQty ? '' : 'text-danger'">
                {{ craftModal.cost * displayQty }}文
              </span>
            </div>
          </div>

          <!-- 批量数量控制 -->
          <div v-if="craftModal.batchable && maxCraftable > 1" class="border border-accent/10 rounded-xs p-2 mb-2">
            <div class="flex items-center justify-between mb-1.5">
              <span class="text-xs text-muted">数量</span>
              <div class="flex items-center space-x-1">
                <Button class="h-6 px-1.5 py-0.5 text-xs justify-center" :disabled="craftQuantity <= 1" @click="addCraftQuantity(-1)">
                  -
                </Button>
                <input
                  type="number"
                  :value="craftQuantity"
                  min="1"
                  :max="maxCraftable"
                  class="w-16 h-6 px-2 py-0.5 bg-bg border border-accent/30 rounded-xs text-xs text-center text-accent outline-none focus:border-accent transition-colors"
                  @input="onCraftQuantityInput"
                />
                <Button
                  class="h-6 px-1.5 py-0.5 text-xs justify-center"
                  :disabled="craftQuantity >= maxCraftable"
                  @click="addCraftQuantity(1)"
                >
                  +
                </Button>
              </div>
            </div>
            <div class="flex space-x-1">
              <Button class="flex-1 justify-center" :disabled="craftQuantity <= 1" @click="setCraftQuantity(1)">最少</Button>
              <Button class="flex-1 justify-center" :disabled="craftQuantity >= maxCraftable" @click="setCraftQuantity(maxCraftable)">
                最多
              </Button>
            </div>
            <div v-if="craftModal.cost > 0" class="flex items-center justify-between mt-1.5">
              <span class="text-xs text-muted">合计</span>
              <span class="text-xs text-accent">{{ craftModal.cost * craftQuantity }}文</span>
            </div>
          </div>

          <Button
            class="w-full justify-center"
            :class="{ '!bg-accent !text-bg': craftModal.canCraft() }"
            :icon="Hammer"
            :icon-size="12"
            :disabled="!craftModal.canCraft()"
            @click="handleCraftFromModal"
          >
            {{ craftModal.batchable && craftQuantity > 1 ? `制造 ×${craftQuantity}` : '制造' }}
          </Button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { Hammer, Trash2, Package, Boxes, X, ArrowUpCircle } from 'lucide-vue-next'
  import Button from '@/components/game/Button.vue'
  import type { MachineType, AnimalBuildingType, ChestTier, Quality, ProcessingSlot, ProcessingRecipeDef } from '@/types'
  import { QUALITY_NAMES } from '@/composables/useFarmActions'
  import { useAnimalStore } from '@/stores/useAnimalStore'
  import { useFarmStore } from '@/stores/useFarmStore'
  import { useGameStore } from '@/stores/useGameStore'
  import { useInventoryStore } from '@/stores/useInventoryStore'
  import { usePlayerStore } from '@/stores/usePlayerStore'
  import { useProcessingStore } from '@/stores/useProcessingStore'
  import { useSkillStore } from '@/stores/useSkillStore'
  import { useWarehouseStore } from '@/stores/useWarehouseStore'
  import { getCombinedItemCount, hasCombinedItem, removeCombinedItem } from '@/composables/useCombinedInventory'
  import {
    PROCESSING_MACHINES,
    SPRINKLERS,
    FERTILIZERS,
    BAITS,
    TACKLES,
    TAPPER,
    CRAB_POT_CRAFT,
    LIGHTNING_ROD,
    SCARECROW,
    AUTO_PETTER,
    BOMBS,
    getProcessingRecipeById,
    getRecipeMaxInput,
    getRecipeMinInput,
    getOutputQuantityForInput,
    getSlotInputAmount
  } from '@/data/processing'
  import { getItemById, CHEST_DEFS, CHEST_TIER_ORDER } from '@/data/items'
  import { ACTION_TIME_COSTS } from '@/data/timeConstants'
  import { sfxClick } from '@/composables/useAudio'
  import { addLog } from '@/composables/useGameLog'
  import { handleEndDay } from '@/composables/useEndDay'

  const processingStore = useProcessingStore()
  const inventoryStore = useInventoryStore()
  const playerStore = usePlayerStore()
  const gameStore = useGameStore()
  const farmStore = useFarmStore()
  const animalStore = useAnimalStore()
  const skillStore = useSkillStore()
  const warehouseStore = useWarehouseStore()

  const activeTab = ref<'process' | 'craft'>('process')
  const onlyAvailable = ref(false)

  const getFilteredRecipes = (machineType: MachineType) => {
    const recipes = processingStore.getAvailableRecipes(machineType)
    if (!onlyAvailable.value) return recipes
    return recipes.filter(r => {
      if (r.inputItemId === null) return true
      const need = r.maxInputQuantity ? getRecipeMinInput(r) : r.inputQuantity
      return hasCombinedItem(r.inputItemId, need)
    })
  }

  const furnaceBatchModal = ref<{ slotIndex: number; recipeId: string } | null>(null)
  const furnaceBatchQty = ref(1)

  const furnaceBatchRecipe = computed((): ProcessingRecipeDef | null => {
    const id = furnaceBatchModal.value?.recipeId
    if (!id) return null
    return getProcessingRecipeById(id) ?? null
  })

  const openFurnaceBatchModal = (slotIndex: number, recipeId: string) => {
    const recipe = getProcessingRecipeById(recipeId)
    if (!recipe?.inputItemId) return
    const stock = getCombinedItemCount(recipe.inputItemId)
    if (stock < 1) return
    furnaceBatchQty.value = Math.min(getRecipeMaxInput(recipe), stock)
    furnaceBatchModal.value = { slotIndex, recipeId }
  }

  const confirmFurnaceBatch = () => {
    const modal = furnaceBatchModal.value
    if (!modal) return
    handleStartProcessing(modal.slotIndex, modal.recipeId, undefined, furnaceBatchQty.value)
    furnaceBatchModal.value = null
  }

  const QUALITY_ORDER: Quality[] = ['normal', 'fine', 'excellent', 'supreme']

  /** 种子制造机：按品质展开配方列表 */
  const getSeedMakerQualityRecipes = (machineType: MachineType) => {
    const recipes = processingStore.getAvailableRecipes(machineType)
    const result: { recipe: (typeof recipes)[number]; quality: Quality; count: number; available: boolean }[] = []
    for (const recipe of recipes) {
      if (!recipe.inputItemId) continue
      let hasAny = false
      for (const q of QUALITY_ORDER) {
        const count = getCombinedItemCount(recipe.inputItemId, q)
        if (count > 0) {
          hasAny = true
          result.push({ recipe, quality: q, count, available: count >= recipe.inputQuantity })
        }
      }
      // 无任何品质库存时，仅在非筛选模式下显示一条（普通品质，不可用）
      if (!hasAny && !onlyAvailable.value) {
        result.push({ recipe, quality: 'normal' as Quality, count: 0, available: false })
      }
    }
    return result
  }

  // === 机器分组（相同设备排到一起，可折叠） ===

  interface MachineGroup {
    machineType: MachineType
    name: string
    slots: { slot: (typeof processingStore.machines)[number]; originalIndex: number }[]
  }

  const machineGroups = computed((): MachineGroup[] => {
    const groupMap = new Map<MachineType, MachineGroup>()
    // 按 PROCESSING_MACHINES 定义顺序作为排序基准
    const typeOrder = new Map(PROCESSING_MACHINES.map((m, i) => [m.id as MachineType, i]))
    for (let i = 0; i < processingStore.machines.length; i++) {
      const slot = processingStore.machines[i]!
      let group = groupMap.get(slot.machineType)
      if (!group) {
        group = { machineType: slot.machineType, name: getMachineName(slot.machineType), slots: [] }
        groupMap.set(slot.machineType, group)
      }
      group.slots.push({ slot, originalIndex: i })
    }
    return [...groupMap.values()].sort((a, b) => (typeOrder.get(a.machineType) ?? 99) - (typeOrder.get(b.machineType) ?? 99))
  })

  const toggleGroup = (type: MachineType) => {
    processingStore.toggleGroup(type)
  }

  /** 获取某类型机器的已有数量 */
  const getMachineCountByType = (type: MachineType): number => {
    return processingStore.machines.filter(m => m.machineType === type).length
  }

  // === 工坊升级 ===

  const showUpgradeModal = ref(false)
  const showUpgradeConfirm = ref(false)

  const nextUpgrade = computed(() => processingStore.getNextUpgrade())

  const canUpgrade = computed(() => {
    const u = nextUpgrade.value
    if (!u) return false
    return processingStore.canCraft(u.materials, u.cost)
  })

  const handleUpgradeFromModal = () => {
    const result = processingStore.upgradeWorkshop()
    sfxClick()
    addLog(result.message)
    if (result.success) {
      const tr = gameStore.advanceTime(ACTION_TIME_COSTS.craftMachine)
      if (tr.message) addLog(tr.message)
      if (tr.passedOut) handleEndDay()
    }
    showUpgradeConfirm.value = false
    showUpgradeModal.value = false
  }

  // === 制造弹窗 ===

  interface CraftableItem {
    id: string
    name: string
    description: string
    materials: { itemId: string; quantity: number }[]
    cost: number
    onCraft: () => void
    canCraft: () => boolean
    badge?: string
    batchable?: boolean
    maxBatch?: () => number
  }

  const craftModal = ref<CraftableItem | null>(null)
  const craftQuantity = ref(1)

  const maxCraftable = computed(() => {
    const item = craftModal.value
    if (!item?.batchable) return 1
    let max = 999
    for (const m of item.materials) {
      max = Math.min(max, Math.floor(getCombinedItemCount(m.itemId) / m.quantity))
    }
    if (item.cost > 0) {
      max = Math.min(max, Math.floor(playerStore.money / item.cost))
    }
    if (item.maxBatch) {
      max = Math.min(max, item.maxBatch())
    }
    return Math.max(1, max)
  })

  const displayQty = computed(() => (craftModal.value?.batchable ? craftQuantity.value : 1))

  const openCraftModal = (item: CraftableItem) => {
    craftModal.value = item
    craftQuantity.value = 1
  }

  const setCraftQuantity = (val: number) => {
    craftQuantity.value = Math.max(1, Math.min(val, maxCraftable.value))
  }

  const addCraftQuantity = (delta: number) => {
    setCraftQuantity(craftQuantity.value + delta)
  }

  const onCraftQuantityInput = (e: Event) => {
    const val = parseInt((e.target as HTMLInputElement).value, 10)
    if (!isNaN(val)) setCraftQuantity(val)
  }

  const JADE_RING_COST = [
    { itemId: 'jade', quantity: 1 },
    { itemId: 'gold_ore', quantity: 2 }
  ]
  const JADE_RING_MONEY = 500

  const canCraftJadeRing = computed(() => processingStore.canCraft(JADE_RING_COST, JADE_RING_MONEY))

  const STAMINA_FRUIT_COST = [
    { itemId: 'prismatic_shard', quantity: 1 },
    { itemId: 'dragon_jade', quantity: 2 },
    { itemId: 'ginseng', quantity: 5 },
    { itemId: 'iridium_bar', quantity: 3 }
  ]
  const STAMINA_FRUIT_MONEY = 10000

  const allSkillsAbove8 = computed(() => ['farming', 'foraging', 'fishing', 'mining'].every(s => skillStore.getSkill(s as any).level >= 8))
  const canCraftStaminaFruit = computed(
    () => allSkillsAbove8.value && playerStore.staminaCapLevel < 4 && processingStore.canCraft(STAMINA_FRUIT_COST, STAMINA_FRUIT_MONEY)
  )

  const craftCategories = computed((): { label: string; items: CraftableItem[] }[] => [
    {
      label: '加工机器',
      items: PROCESSING_MACHINES.map(m => ({
        id: m.id as string,
        name: m.name,
        description: m.description,
        materials: m.craftCost,
        cost: m.craftMoney,
        onCraft: () => handleCraftMachine(m.id),
        canCraft: () => processingStore.canCraft(m.craftCost, m.craftMoney) && processingStore.machineCount < processingStore.maxMachines,
        badge: `已有${getMachineCountByType(m.id)}`,
        batchable: true,
        maxBatch: () => processingStore.maxMachines - processingStore.machineCount
      }))
    },
    {
      label: '农场设施',
      items: [
        ...SPRINKLERS.map(s => ({
          id: s.id,
          name: s.name,
          description: s.description,
          materials: s.craftCost,
          cost: s.craftMoney,
          onCraft: () => handleCraftSprinkler(s.id),
          canCraft: () => processingStore.canCraft(s.craftCost, s.craftMoney),
          batchable: true
        })),
        ...FERTILIZERS.map(f => ({
          id: f.id,
          name: f.name,
          description: f.description,
          materials: f.craftCost,
          cost: f.craftMoney,
          onCraft: () => handleCraftFertilizer(f.id),
          canCraft: () => processingStore.canCraft(f.craftCost, f.craftMoney),
          batchable: true
        })),
        {
          id: 'tapper',
          name: TAPPER.name,
          description: TAPPER.description,
          materials: TAPPER.craftCost,
          cost: TAPPER.craftMoney,
          onCraft: () => handleCraftTapper(),
          canCraft: () => processingStore.canCraft(TAPPER.craftCost, TAPPER.craftMoney),
          batchable: true
        },
        {
          id: 'lightning_rod',
          name: LIGHTNING_ROD.name,
          description: LIGHTNING_ROD.description,
          materials: LIGHTNING_ROD.craftCost,
          cost: LIGHTNING_ROD.craftMoney,
          onCraft: () => handleCraftLightningRod(),
          canCraft: () => processingStore.canCraft(LIGHTNING_ROD.craftCost, LIGHTNING_ROD.craftMoney),
          badge: `已有${farmStore.lightningRods}`,
          batchable: true
        },
        {
          id: 'scarecrow',
          name: SCARECROW.name,
          description: SCARECROW.description,
          materials: SCARECROW.craftCost,
          cost: SCARECROW.craftMoney,
          onCraft: () => handleCraftScarecrow(),
          canCraft: () => processingStore.canCraft(SCARECROW.craftCost, SCARECROW.craftMoney),
          badge: `已有${farmStore.scarecrows}`,
          batchable: true
        },
        ...((animalStore.buildings.find(b => b.type === 'coop')?.level ?? 0) >= 2
          ? [
              {
                id: 'auto_petter_coop',
                name: `${AUTO_PETTER.name}（鸡舍）`,
                description: AUTO_PETTER.description,
                materials: AUTO_PETTER.craftCost,
                cost: AUTO_PETTER.craftMoney,
                onCraft: () => handleCraftAutoPetter('coop'),
                canCraft: () =>
                  !animalStore.hasAutoPetter('coop') && processingStore.canCraft(AUTO_PETTER.craftCost, AUTO_PETTER.craftMoney),
                badge: animalStore.hasAutoPetter('coop') ? '已安装' : undefined
              }
            ]
          : []),
        ...((animalStore.buildings.find(b => b.type === 'barn')?.level ?? 0) >= 2
          ? [
              {
                id: 'auto_petter_barn',
                name: `${AUTO_PETTER.name}（牧场）`,
                description: AUTO_PETTER.description,
                materials: AUTO_PETTER.craftCost,
                cost: AUTO_PETTER.craftMoney,
                onCraft: () => handleCraftAutoPetter('barn'),
                canCraft: () =>
                  !animalStore.hasAutoPetter('barn') && processingStore.canCraft(AUTO_PETTER.craftCost, AUTO_PETTER.craftMoney),
                badge: animalStore.hasAutoPetter('barn') ? '已安装' : undefined
              }
            ]
          : [])
      ]
    },
    {
      label: '渔具',
      items: [
        ...BAITS.map(b => ({
          id: b.id,
          name: b.name,
          description: b.description,
          materials: b.craftCost,
          cost: b.craftMoney,
          onCraft: () => handleCraftBait(b.id),
          canCraft: () => processingStore.canCraft(b.craftCost, b.craftMoney),
          batchable: true
        })),
        ...TACKLES.map(t => ({
          id: t.id,
          name: t.name,
          description: t.description,
          materials: t.craftCost,
          cost: t.craftMoney,
          onCraft: () => handleCraftTackle(t.id),
          canCraft: () => processingStore.canCraft(t.craftCost, t.craftMoney),
          batchable: true
        })),
        {
          id: CRAB_POT_CRAFT.id,
          name: CRAB_POT_CRAFT.name,
          description: CRAB_POT_CRAFT.description,
          materials: CRAB_POT_CRAFT.craftCost,
          cost: CRAB_POT_CRAFT.craftMoney,
          onCraft: () => handleCraftCrabPot(),
          canCraft: () => processingStore.canCraft(CRAB_POT_CRAFT.craftCost, CRAB_POT_CRAFT.craftMoney),
          batchable: true
        }
      ]
    },
    {
      label: '其他',
      items: [
        ...BOMBS.map(b => ({
          id: b.id,
          name: b.name,
          description: b.description,
          materials: b.id === 'mega_bomb' ? [{ itemId: 'mega_bomb_recipe', quantity: 1 }, ...b.craftCost] : b.craftCost,
          cost: b.craftMoney,
          onCraft: () => handleCraftBomb(b.id),
          canCraft: () =>
            (b.id !== 'mega_bomb' || hasCombinedItem('mega_bomb_recipe')) && processingStore.canCraft(b.craftCost, b.craftMoney),
          batchable: true
        })),
        {
          id: 'jade_ring',
          name: '翡翠戒指',
          description: '用翡翠和金矿制成的戒指，可以用来求婚。',
          materials: JADE_RING_COST,
          cost: JADE_RING_MONEY,
          onCraft: () => handleCraftJadeRing(),
          canCraft: () => canCraftJadeRing.value
        },
        ...(allSkillsAbove8.value
          ? [
              {
                id: 'stamina_fruit',
                name: '仙桃',
                description: '蕴含远古灵气的果实，食用后永久提升体力上限。需要种植/觅食/钓鱼/采矿全部≥8级。',
                materials: STAMINA_FRUIT_COST,
                cost: STAMINA_FRUIT_MONEY,
                onCraft: () => handleCraftStaminaFruit(),
                canCraft: () => canCraftStaminaFruit.value,
                badge: playerStore.staminaCapLevel >= 4 ? '已满级' : `${playerStore.staminaCapLevel}/4`
              }
            ]
          : [])
      ]
    },
    ...(warehouseStore.unlocked
      ? [
          {
            label: '箱子',
            items: CHEST_TIER_ORDER.map(tier => {
              const def = CHEST_DEFS[tier]
              return {
                id: `chest_${tier}`,
                name: def.name,
                description: def.description,
                materials: def.craftCost,
                cost: def.craftMoney,
                onCraft: () => handleCraftChest(tier),
                canCraft: () =>
                  warehouseStore.chests.length < warehouseStore.maxChests && processingStore.canCraft(def.craftCost, def.craftMoney),
                badge: `${warehouseStore.chests.length}/${warehouseStore.maxChests}`,
                batchable: true,
                maxBatch: () => warehouseStore.maxChests - warehouseStore.chests.length
              }
            })
          }
        ]
      : [])
  ])

  const handleCraftFromModal = () => {
    if (!craftModal.value) return
    const qty = craftModal.value.batchable ? Math.min(craftQuantity.value, maxCraftable.value) : 1
    const startDay = gameStore.day
    for (let i = 0; i < qty; i++) {
      if (!craftModal.value.canCraft()) break
      craftModal.value.onCraft()
      // 晕倒导致日期变更，停止批量制造
      if (gameStore.day !== startDay) break
    }
    craftModal.value = null
  }

  // === 工具函数 ===

  const getMachineName = (type: MachineType): string => {
    return PROCESSING_MACHINES.find(m => m.id === type)?.name ?? type
  }

  const getItemName = (id: string): string => {
    return getItemById(id)?.name ?? id
  }

  const getRecipeName = (recipeId: string): string => {
    return getProcessingRecipeById(recipeId)?.name ?? recipeId
  }

  const getRecipeOutputName = (recipeId: string): string => {
    const recipe = getProcessingRecipeById(recipeId)
    if (!recipe) return recipeId
    return getItemById(recipe.outputItemId)?.name ?? recipe.name
  }

  const getProcessingStatusLabel = (slot: ProcessingSlot): string => {
    if (!slot.recipeId) return ''
    const recipe = getProcessingRecipeById(slot.recipeId)
    if (!recipe) return getRecipeName(slot.recipeId)
    const outName = getItemById(recipe.outputItemId)?.name ?? recipe.name
    const qty = getOutputQuantityForInput(recipe, getSlotInputAmount(recipe, slot))
    return `${outName}×${qty}`
  }

  const getCollectLabel = (slot: ProcessingSlot): string => {
    return getProcessingStatusLabel(slot) || getRecipeOutputName(slot.recipeId ?? '')
  }

  // === 制造处理 ===

  const handleCraftMachine = (machineType: MachineType) => {
    if (processingStore.craftMachine(machineType)) {
      sfxClick()
      addLog(`制造了${getMachineName(machineType)}并放置到加工区。`)
      const tr = gameStore.advanceTime(ACTION_TIME_COSTS.craftMachine)
      if (tr.message) addLog(tr.message)
      if (tr.passedOut) {
        handleEndDay()
        return
      }
    } else {
      addLog('材料不足或已达上限。')
    }
  }

  const handleCraftSprinkler = (sprinklerId: string) => {
    if (processingStore.craftSprinkler(sprinklerId)) {
      sfxClick()
      const name = SPRINKLERS.find(s => s.id === sprinklerId)?.name ?? sprinklerId
      addLog(`制造了${name}，已放入背包。去农场放置吧。`)
      const tr = gameStore.advanceTime(ACTION_TIME_COSTS.craftMachine)
      if (tr.message) addLog(tr.message)
      if (tr.passedOut) {
        handleEndDay()
        return
      }
    } else {
      addLog('材料不足。')
    }
  }

  const handleCraftFertilizer = (fertilizerId: string) => {
    if (processingStore.craftFertilizer(fertilizerId)) {
      sfxClick()
      const name = FERTILIZERS.find(f => f.id === fertilizerId)?.name ?? fertilizerId
      addLog(`制造了${name}，已放入背包。`)
      const tr = gameStore.advanceTime(ACTION_TIME_COSTS.craftMachine)
      if (tr.message) addLog(tr.message)
      if (tr.passedOut) {
        handleEndDay()
        return
      }
    } else {
      addLog('材料不足。')
    }
  }

  const handleCraftBait = (baitId: string) => {
    if (processingStore.craftBait(baitId)) {
      sfxClick()
      const name = BAITS.find(b => b.id === baitId)?.name ?? baitId
      addLog(`制造了${name}，已放入背包。`)
      const tr = gameStore.advanceTime(ACTION_TIME_COSTS.craftMachine)
      if (tr.message) addLog(tr.message)
      if (tr.passedOut) {
        handleEndDay()
        return
      }
    } else {
      addLog('材料不足。')
    }
  }

  const handleCraftTackle = (tackleId: string) => {
    if (processingStore.craftTackle(tackleId)) {
      sfxClick()
      const name = TACKLES.find(t => t.id === tackleId)?.name ?? tackleId
      addLog(`制造了${name}，已放入背包。`)
      const tr = gameStore.advanceTime(ACTION_TIME_COSTS.craftMachine)
      if (tr.message) addLog(tr.message)
      if (tr.passedOut) {
        handleEndDay()
        return
      }
    } else {
      addLog('材料不足。')
    }
  }

  const handleCraftCrabPot = () => {
    if (processingStore.craftCrabPot()) {
      sfxClick()
      addLog(`制造了${CRAB_POT_CRAFT.name}，已放入背包。`)
      const tr = gameStore.advanceTime(ACTION_TIME_COSTS.craftMachine)
      if (tr.message) addLog(tr.message)
      if (tr.passedOut) {
        handleEndDay()
        return
      }
    } else {
      addLog('材料不足。')
    }
  }

  const handleCraftTapper = () => {
    if (processingStore.craftTapper()) {
      sfxClick()
      addLog(`制造了采脂器，已放入背包。去农场安装到野树上吧。`)
      const tr = gameStore.advanceTime(ACTION_TIME_COSTS.craftMachine)
      if (tr.message) addLog(tr.message)
      if (tr.passedOut) {
        handleEndDay()
        return
      }
    } else {
      addLog('材料不足。')
    }
  }

  const handleCraftLightningRod = () => {
    if (processingStore.consumeCraftMaterials(LIGHTNING_ROD.craftCost, LIGHTNING_ROD.craftMoney)) {
      sfxClick()
      farmStore.lightningRods++
      addLog(`制造了避雷针，已安装到农场。(共${farmStore.lightningRods}根)`)
      const tr = gameStore.advanceTime(ACTION_TIME_COSTS.craftMachine)
      if (tr.message) addLog(tr.message)
      if (tr.passedOut) {
        handleEndDay()
        return
      }
    } else {
      addLog('材料不足。')
    }
  }

  const handleCraftScarecrow = () => {
    if (processingStore.consumeCraftMaterials(SCARECROW.craftCost, SCARECROW.craftMoney)) {
      sfxClick()
      farmStore.scarecrows++
      addLog(`制造了稻草人，已安装到农场。(共${farmStore.scarecrows}个)`)
      const tr = gameStore.advanceTime(ACTION_TIME_COSTS.craftMachine)
      if (tr.message) addLog(tr.message)
      if (tr.passedOut) {
        handleEndDay()
        return
      }
    } else {
      addLog('材料不足。')
    }
  }

  const handleCraftAutoPetter = (buildingType: AnimalBuildingType) => {
    if (animalStore.hasAutoPetter(buildingType)) {
      addLog('该畜舍已安装自动抚摸机。')
      return
    }
    if (processingStore.consumeCraftMaterials(AUTO_PETTER.craftCost, AUTO_PETTER.craftMoney)) {
      sfxClick()
      const result = animalStore.installAutoPetter(buildingType)
      addLog(result.message)
      const tr = gameStore.advanceTime(ACTION_TIME_COSTS.craftMachine)
      if (tr.message) addLog(tr.message)
      if (tr.passedOut) {
        handleEndDay()
        return
      }
    } else {
      addLog('材料不足。')
    }
  }

  const handleCraftBomb = (bombId: string) => {
    if (processingStore.craftBomb(bombId)) {
      sfxClick()
      const name = BOMBS.find(b => b.id === bombId)?.name ?? bombId
      addLog(`制造了${name}，已放入背包。`)
      const tr = gameStore.advanceTime(ACTION_TIME_COSTS.craftMachine)
      if (tr.message) addLog(tr.message)
      if (tr.passedOut) {
        handleEndDay()
        return
      }
    } else {
      addLog('材料不足。')
    }
  }

  const handleCraftJadeRing = () => {
    if (!canCraftJadeRing.value) return
    if (!playerStore.spendMoney(JADE_RING_MONEY)) return
    for (const c of JADE_RING_COST) {
      if (!removeCombinedItem(c.itemId, c.quantity)) {
        playerStore.earnMoney(JADE_RING_MONEY)
        return
      }
    }
    inventoryStore.addItem('jade_ring')
    sfxClick()
    addLog('制造了翡翠戒指！可以用来求婚。')
    const tr = gameStore.advanceTime(ACTION_TIME_COSTS.craftMachine)
    if (tr.message) addLog(tr.message)
    if (tr.passedOut) {
      handleEndDay()
      return
    }
  }

  const handleCraftStaminaFruit = () => {
    if (!canCraftStaminaFruit.value) return
    if (processingStore.consumeCraftMaterials(STAMINA_FRUIT_COST, STAMINA_FRUIT_MONEY)) {
      sfxClick()
      inventoryStore.addItem('stamina_fruit')
      addLog('制造了仙桃！在背包中使用可永久提升体力上限。')
      const tr = gameStore.advanceTime(ACTION_TIME_COSTS.craftMachine)
      if (tr.message) addLog(tr.message)
      if (tr.passedOut) {
        handleEndDay()
        return
      }
    } else {
      addLog('材料不足。')
    }
  }

  const handleCraftChest = (tier: ChestTier) => {
    const def = CHEST_DEFS[tier]
    if (warehouseStore.chests.length >= warehouseStore.maxChests) {
      addLog('箱子槽位已满，请先扩建仓库。')
      return
    }
    if (processingStore.consumeCraftMaterials(def.craftCost, def.craftMoney)) {
      sfxClick()
      warehouseStore.addChest(tier)
      addLog(`制造了${def.name}，已放入仓库。`)
      const tr = gameStore.advanceTime(ACTION_TIME_COSTS.craftMachine)
      if (tr.message) addLog(tr.message)
      if (tr.passedOut) {
        handleEndDay()
        return
      }
    } else {
      addLog('材料不足。')
    }
  }

  // === 加工处理 ===

  const handleStartProcessing = (slotIndex: number, recipeId: string, quality?: Quality, inputAmount?: number) => {
    if (processingStore.startProcessing(slotIndex, recipeId, quality, inputAmount)) {
      sfxClick()
      const recipe = getProcessingRecipeById(recipeId)
      const qualityLabel = quality && quality !== 'normal' ? `(${QUALITY_NAMES[quality]})` : ''
      const batchLabel =
        recipe && inputAmount && recipe.maxInputQuantity
          ? `（投入${inputAmount}个${getItemName(recipe.inputItemId!)}）`
          : ''
      addLog(`开始加工${recipe?.name ?? recipeId}${batchLabel}${qualityLabel}，需要${recipe?.processingDays ?? '?'}天。`)
    } else {
      addLog('原料不足或机器正在使用。')
    }
  }

  const handleCollect = (slotIndex: number) => {
    const outputId = processingStore.collectProduct(slotIndex)
    if (outputId) {
      sfxClick()
      const name = getItemById(outputId)?.name ?? outputId
      addLog(`收取了${name}！`)
    }
  }

  const handleRemoveMachine = (slotIndex: number) => {
    const slot = processingStore.machines[slotIndex]
    if (!slot) return
    const name = getMachineName(slot.machineType)
    if (processingStore.removeMachine(slotIndex)) {
      addLog(`拆除了${name}，制作材料已退还。`)
    }
  }

  const handleCancelProcessing = (slotIndex: number) => {
    const slot = processingStore.machines[slotIndex]
    if (!slot) return
    const name = getMachineName(slot.machineType)
    if (processingStore.cancelProcessing(slotIndex)) {
      addLog(`${name}已停止加工，原料已退回。`)
    }
  }
</script>
