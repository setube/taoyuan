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

      <!-- 全局操作 -->
      <div class="flex items-center justify-between mb-2">
        <label class="flex items-center space-x-1 cursor-pointer select-none">
          <input type="checkbox" v-model="processingStore.onlyAvailable" class="accent-accent" />
          <span class="text-[10px] text-muted">只显示有材料的配方</span>
        </label>
        <Button v-if="totalReady > 0" class="py-0 px-1.5 text-[10px]" :icon="Package" :icon-size="10" @click="handleCollectAll()">
          一键收取全部（{{ totalReady }}）
        </Button>
      </div>

      <!-- 视图切换：合并成加工站，或逐台独立操作 -->
      <div v-if="processingStore.machines.length > 0" class="flex space-x-1 mb-2">
        <Button
          class="flex-1 justify-center py-0 text-[10px]"
          :class="{
            '!bg-accent !text-bg': processingStore.viewMode === 'station'
          }"
          @click="processingStore.viewMode = 'station'"
        >
          加工站视图
        </Button>
        <Button
          class="flex-1 justify-center py-0 text-[10px]"
          :class="{
            '!bg-accent !text-bg': processingStore.viewMode === 'individual'
          }"
          @click="processingStore.viewMode = 'individual'"
        >
          单台视图
        </Button>
      </div>

      <!-- 空状态 -->
      <div v-if="processingStore.machines.length === 0" class="flex flex-col items-center justify-center py-8">
        <Boxes :size="36" class="text-accent/20 mb-2" />
        <p class="text-xs text-muted">还没有加工设备</p>
        <p class="text-[10px] text-muted/50 mt-0.5">切换到「制造」标签建造设备，同类设备会自动合并为一座加工站</p>
      </div>

      <!-- 加工站列表：同类设备合并为一座工站，设备数 = 并行槽位数 -->
      <div v-else-if="processingStore.viewMode === 'station'" class="flex flex-col space-y-2">
        <div v-for="station in stations" :key="station.machineType" class="border border-accent/10 rounded-xs">
          <!-- 工站标题（可折叠 / 可改名 / 可调序） -->
          <div class="flex items-center justify-between px-2 py-1.5 select-none">
            <div class="flex items-center space-x-1 flex-1 min-w-0 cursor-pointer" @click="toggleGroup(station.machineType)">
              <template v-if="renamingType === station.machineType">
                <input
                  v-model="renameInput"
                  class="bg-bg border border-accent/30 rounded-xs px-1 py-0.5 text-xs text-text w-24 outline-none"
                  maxlength="10"
                  :placeholder="station.baseName"
                  @click.stop
                  @keyup.enter="confirmRename"
                  @keyup.escape="renamingType = null"
                />
                <Button class="py-0 px-1 text-[10px]" @click.stop="confirmRename">确定</Button>
                <Button class="py-0 px-1 text-[10px]" @click.stop="renamingType = null">取消</Button>
              </template>
              <template v-else>
                <span class="text-xs text-accent truncate">{{ station.name }}</span>
                <span v-if="station.name !== station.baseName" class="text-[10px] text-muted/50">({{ station.baseName }})</span>
                <span class="text-[10px] text-muted">&times;{{ station.stats.total }}</span>
                <span v-if="station.stats.ready > 0" class="text-[10px] text-success">{{ station.stats.ready }}可收</span>
              </template>
            </div>
            <div class="flex items-center space-x-1 flex-shrink-0">
              <button
                v-if="renamingType !== station.machineType"
                class="text-muted hover:text-accent"
                title="重命名"
                @click.stop="startRename(station.machineType, station.name, station.baseName)"
              >
                <Pencil :size="10" />
              </button>
              <button class="text-muted hover:text-accent" title="上移" @click.stop="handleMoveStation(station.machineType, -1)">
                <ChevronUp :size="12" />
              </button>
              <button class="text-muted hover:text-accent" title="下移" @click.stop="handleMoveStation(station.machineType, 1)">
                <ChevronDown :size="12" />
              </button>
              <span class="text-[10px] text-muted cursor-pointer" @click="toggleGroup(station.machineType)">
                {{ processingStore.collapsedGroups.has(station.machineType) ? '▸' : '▾' }}
              </span>
            </div>
          </div>
          <p class="text-[10px] text-muted px-2 -mt-1 mb-1">运行{{ station.stats.running }} · 空闲{{ station.stats.idle }}</p>

          <!-- 展开内容 -->
          <div v-if="!processingStore.collapsedGroups.has(station.machineType)" class="px-2 pb-2">
            <!-- 槽位占用条 -->
            <div class="h-1 bg-bg rounded-xs border border-accent/10 mb-2 flex overflow-hidden">
              <div
                class="h-full bg-success"
                :style="{
                  width: pct(station.stats.ready, station.stats.total)
                }"
              />
              <div
                class="h-full bg-accent"
                :style="{
                  width: pct(station.stats.running, station.stats.total)
                }"
              />
            </div>

            <!-- 工站操作 -->
            <div class="flex flex-wrap mb-2">
              <Button
                v-if="station.stats.idle > 0"
                class="py-0 px-1.5 text-[10px] mr-1 mb-1"
                :icon="Play"
                :icon-size="10"
                @click="openTaskModal(station.machineType)"
              >
                投料（{{ station.stats.idle }}个空槽）
              </Button>
              <Button
                v-if="station.stats.ready > 0"
                class="py-0 px-1.5 text-[10px] mr-1 mb-1 !bg-accent !text-bg"
                :icon="Package"
                :icon-size="10"
                @click="handleCollectAll(station.machineType)"
              >
                收取{{ station.stats.ready }}份
              </Button>
              <Button
                v-if="station.stats.running > 0"
                class="py-0 px-1.5 text-[10px] mr-1 mb-1"
                :icon="X"
                :icon-size="10"
                @click="handleCancelAll(station.machineType)"
              >
                全部停工
              </Button>
              <Button
                class="py-0 px-1.5 text-[10px] mr-1 mb-1 text-danger"
                :icon="Trash2"
                :icon-size="10"
                @click="handleRemoveOne(station.machineType)"
              >
                拆除一台
              </Button>
            </div>

            <!-- 槽位明细 -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-1">
              <div
                v-for="(entry, si) in station.slots"
                :key="entry.originalIndex"
                class="border rounded-xs px-2 py-1 flex items-center justify-between"
                :class="entry.slot.ready ? 'border-success/30' : entry.slot.recipeId ? 'border-accent/20' : 'border-accent/10'"
              >
                <span class="text-[10px] text-muted/50 mr-1 flex-shrink-0">{{ si + 1 }}</span>
                <span v-if="processingStore.getSlotLevel(entry.slot) > 0" class="text-[10px] text-accent mr-1 flex-shrink-0">
                  Lv.{{ processingStore.getSlotLevel(entry.slot) }}
                </span>
                <!-- 空闲 -->
                <template v-if="!entry.slot.recipeId">
                  <span class="text-[10px] text-muted flex-1">空闲</span>
                </template>
                <!-- 已完成 -->
                <template v-else-if="entry.slot.ready">
                  <span class="text-[10px] text-success flex-1 truncate">
                    {{ getRecipeOutputName(entry.slot.recipeId) }}{{ getOutputQtyLabel(entry.slot) }} 已完成
                  </span>
                  <button class="text-success hover:text-accent flex-shrink-0" @click="handleCollect(entry.originalIndex)">
                    <Package :size="12" />
                  </button>
                </template>
                <!-- 加工中 -->
                <template v-else>
                  <span class="text-[10px] flex-1 truncate">
                    {{ getRecipeName(entry.slot.recipeId) }}
                    <span class="text-muted">剩{{ Math.max(0, entry.slot.totalDays - entry.slot.daysProcessed) }}天</span>
                  </span>
                  <button class="text-muted hover:text-danger flex-shrink-0" @click="handleCancelProcessing(entry.originalIndex)">
                    <X :size="12" />
                  </button>
                </template>
                <!-- 设备升级入口：与单台视图共用升级弹窗 -->
                <button
                  v-if="processingStore.getSlotLevel(entry.slot) < MAX_MACHINE_LEVEL"
                  class="text-muted hover:text-accent flex-shrink-0 ml-1"
                  title="升级"
                  @click="openMachineUpgrade(entry.originalIndex)"
                >
                  <ArrowUpCircle :size="12" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 单台视图：每台设备各自一块面板，逐台投料与拆除 -->
      <div v-else class="flex flex-col space-y-2">
        <div v-for="station in stations" :key="station.machineType" class="border border-accent/10 rounded-xs">
          <!-- 分组标题（可折叠） -->
          <div
            class="flex items-center justify-between px-2 py-1.5 cursor-pointer hover:bg-accent/5 select-none"
            @click="toggleGroup(station.machineType)"
          >
            <div class="flex items-center space-x-1">
              <span class="text-xs text-accent">{{ station.name }}</span>
              <span class="text-[10px] text-muted">&times;{{ station.stats.total }}</span>
              <span v-if="station.stats.ready > 0" class="text-[10px] text-success">（{{ station.stats.ready }}可收取）</span>
            </div>
            <span class="text-[10px] text-muted">{{ processingStore.collapsedGroups.has(station.machineType) ? '▸' : '▾' }}</span>
          </div>

          <!-- 展开的机器明细 -->
          <div v-if="!processingStore.collapsedGroups.has(station.machineType)" class="flex flex-col space-y-1.5 px-2 pb-2">
            <div
              v-for="{ slot, originalIndex } in station.slots"
              :key="originalIndex"
              class="border rounded-xs p-2"
              :class="slot.ready ? 'border-success/30' : 'border-accent/20'"
            >
              <div class="flex items-center justify-between mb-1.5">
                <div class="flex items-center min-w-0">
                  <span class="text-xs truncate" :class="slot.ready ? 'text-success' : 'text-accent'">{{ station.name }}</span>
                  <span v-if="processingStore.getSlotLevel(slot) > 0" class="text-[10px] text-accent ml-1 flex-shrink-0">
                    Lv.{{ processingStore.getSlotLevel(slot) }}
                  </span>
                  <span v-if="processingStore.getSlotLevel(slot) >= MAX_MACHINE_LEVEL" class="text-[10px] text-muted ml-1.5 flex-shrink-0">
                    已满级
                  </span>
                  <button
                    v-else
                    class="flex items-center flex-shrink-0 ml-1.5 px-1.5 py-0.5 text-[10px] text-accent border border-accent/30 rounded-xs hover:bg-accent/5"
                    @click="openMachineUpgrade(originalIndex)"
                  >
                    <ArrowUpCircle :size="12" class="mr-0.5" />
                    升级
                  </button>
                </div>
                <button class="text-muted hover:text-danger flex-shrink-0 ml-2" @click="requestRemoveMachine(originalIndex)">
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
                  <p v-else class="text-xs text-muted">
                    {{ processingStore.onlyAvailable ? '没有材料足够的配方' : '无可用配方' }}
                  </p>
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
                  <p v-else class="text-xs text-muted">
                    {{ processingStore.onlyAvailable ? '没有材料足够的配方' : '无可用配方' }}
                  </p>
                </template>
              </div>

              <!-- 加工中 -->
              <div v-else-if="!slot.ready">
                <div class="flex items-center justify-between text-xs mb-1">
                  <span class="text-muted">{{ getRecipeName(slot.recipeId) }}</span>
                  <span class="text-muted">{{ slot.daysProcessed }}/{{ slot.totalDays }}天</span>
                </div>
                <div class="h-1 bg-bg rounded-xs border border-accent/10 mb-1.5">
                  <div
                    class="h-full bg-accent rounded-xs transition-all"
                    :style="{
                      width: Math.floor((slot.daysProcessed / slot.totalDays) * 100) + '%'
                    }"
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
                  收取 {{ getRecipeOutputName(slot.recipeId) }}{{ getOutputQtyLabel(slot) }}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 加工站投料弹窗：选配方 + 数量，自动分配到空闲槽位 -->
    <Transition name="panel-fade">
      <div v-if="taskModal" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" @click.self="closeTaskModal">
        <div class="game-panel max-w-xs w-full relative">
          <button class="absolute top-2 right-2 text-muted hover:text-text" @click="closeTaskModal">
            <X :size="14" />
          </button>

          <p class="text-sm text-accent mb-1">{{ getMachineName(taskModal.machineType) }} 投料</p>
          <p class="text-[10px] text-muted mb-2">空闲槽位 {{ taskIdleSlots }} 个，选好配方后按数量分配。</p>

          <!-- 第一步：选配方 -->
          <template v-if="!taskModal.recipeId">
            <!-- 种子制造机按品质拆分 -->
            <div v-if="taskModal.machineType === 'seed_maker'" class="flex flex-col space-y-1 max-h-56 overflow-y-auto">
              <Button
                v-for="qr in getSeedMakerQualityRecipes(taskModal.machineType)"
                :key="qr.recipe.id + ':' + qr.quality"
                class="w-full justify-between"
                :disabled="!qr.available"
                @click="selectTaskRecipe(qr.recipe.id, qr.quality)"
              >
                <span>
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
                </span>
                <span class="text-muted">{{ qr.count }}/{{ qr.recipe.inputQuantity }}</span>
              </Button>
              <p v-if="getSeedMakerQualityRecipes(taskModal.machineType).length === 0" class="text-xs text-muted text-center py-4">
                {{ processingStore.onlyAvailable ? '没有材料足够的配方' : '无可用配方' }}
              </p>
            </div>
            <!-- 其他设备 -->
            <div v-else class="flex flex-col space-y-1 max-h-56 overflow-y-auto">
              <Button
                v-for="recipe in getFilteredRecipes(taskModal.machineType)"
                :key="recipe.id"
                class="w-full justify-between"
                :disabled="recipe.inputItemId !== null && !hasCombinedItem(recipe.inputItemId, recipe.inputQuantity)"
                @click="selectTaskRecipe(recipe.id)"
              >
                <span class="truncate">{{ recipe.name }}</span>
                <span v-if="recipe.inputItemId" class="text-muted flex-shrink-0 ml-1">
                  {{ getCombinedItemCount(recipe.inputItemId) }}/{{ recipe.inputQuantity }}
                </span>
              </Button>
              <p v-if="getFilteredRecipes(taskModal.machineType).length === 0" class="text-xs text-muted text-center py-4">
                {{ processingStore.onlyAvailable ? '没有材料足够的配方' : '无可用配方' }}
              </p>
            </div>
          </template>

          <!-- 第二步：选数量 -->
          <template v-else>
            <div class="border border-accent/10 rounded-xs p-2 mb-2">
              <div class="flex items-center justify-between">
                <span class="text-xs text-accent">{{ getRecipeName(taskModal.recipeId) }}</span>
                <span class="text-[10px] text-muted">{{ taskRecipe?.processingDays ?? '?' }}天/份</span>
              </div>
              <div v-if="taskRecipe?.inputItemId" class="flex items-center justify-between mt-0.5">
                <span class="text-[10px] text-muted">每份消耗</span>
                <span class="text-[10px] text-muted">{{ getItemName(taskRecipe.inputItemId) }} &times;{{ taskRecipe.inputQuantity }}</span>
              </div>
            </div>

            <div class="border border-accent/10 rounded-xs p-2 mb-2">
              <div class="flex items-center justify-between mb-1.5">
                <span class="text-xs text-muted">投料份数</span>
                <div class="flex items-center space-x-1">
                  <Button class="h-6 px-1.5 py-0.5 text-xs justify-center" :disabled="taskQty <= 1" @click="addTaskQty(-1)">-</Button>
                  <input
                    type="number"
                    :value="taskQty"
                    min="1"
                    :max="maxTaskQty"
                    class="w-16 h-6 px-2 py-0.5 bg-bg border border-accent/30 rounded-xs text-xs text-center text-accent outline-none"
                    @input="onTaskQtyInput"
                  />
                  <Button class="h-6 px-1.5 py-0.5 text-xs justify-center" :disabled="taskQty >= maxTaskQty" @click="addTaskQty(1)">
                    +
                  </Button>
                </div>
              </div>
              <div class="flex space-x-1">
                <Button class="flex-1 justify-center" :disabled="taskQty <= 1" @click="setTaskQty(1)">最少</Button>
                <Button class="flex-1 justify-center" :disabled="taskQty >= maxTaskQty" @click="setTaskQty(maxTaskQty)">
                  排满（{{ maxTaskQty }}）
                </Button>
              </div>
            </div>

            <div class="flex space-x-1">
              <Button class="flex-1 justify-center" @click="taskModal.recipeId = null">重选配方</Button>
              <Button class="flex-1 justify-center !bg-accent !text-bg" :icon="Play" :icon-size="12" @click="confirmTask">
                开工 &times;{{ taskQty }}
              </Button>
            </div>
          </template>
        </div>
      </div>
    </Transition>

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
              <div v-for="mat in nextUpgrade.materials" :key="mat.itemId" class="mb-1 last:mb-0">
                <div class="flex items-center justify-between">
                  <span class="text-xs text-muted">{{ getItemById(mat.itemId)?.name }}</span>
                  <span class="text-xs" :class="getCombinedItemCount(mat.itemId) >= mat.quantity ? '' : 'text-danger'">
                    {{ getCombinedItemCount(mat.itemId) }}/{{ mat.quantity }}
                  </span>
                </div>
                <p v-if="getCombinedItemCount(mat.itemId) < mat.quantity" class="text-[10px] text-accent/60">
                  获取：{{ getItemSource(mat.itemId) }}
                </p>
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

    <!-- 设备升级弹窗 -->
    <Transition name="panel-fade">
      <div v-if="upgradeSlot" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" @click.self="closeMachineUpgrade">
        <div class="game-panel max-w-xs w-full relative">
          <button class="absolute top-2 right-2 text-muted hover:text-text" @click="closeMachineUpgrade">
            <X :size="14" />
          </button>

          <p class="text-sm text-accent mb-2">
            <ArrowUpCircle :size="14" class="inline mr-0.5" />
            {{ getStationDisplayName(upgradeSlot.machineType) }} 升级
          </p>

          <template v-if="upgradeCost">
            <div class="border border-accent/10 rounded-xs p-2 mb-2">
              <div class="flex items-center justify-between">
                <span class="text-xs text-muted">等级</span>
                <span class="text-xs text-accent">Lv.{{ upgradeSlotLevel }} → Lv.{{ upgradeCost.level }}</span>
              </div>
              <div class="flex items-center justify-between mt-0.5">
                <span class="text-xs text-muted">产出</span>
                <span class="text-xs text-text">&times;{{ upgradeSlotLevel + 1 }} → &times;{{ upgradeCost.level + 1 }}</span>
              </div>
            </div>

            <div class="border border-accent/10 rounded-xs p-2 mb-2">
              <p class="text-xs text-muted mb-1">所需材料</p>
              <div v-for="mat in upgradeCost.materials" :key="mat.itemId" class="flex items-center justify-between mb-1 last:mb-0">
                <span class="text-xs text-muted">{{ getItemName(mat.itemId) }}</span>
                <span class="text-xs" :class="getCombinedItemCount(mat.itemId) >= mat.quantity ? '' : 'text-danger'">
                  {{ getCombinedItemCount(mat.itemId) }}/{{ mat.quantity }}
                </span>
              </div>
              <div class="flex items-center justify-between mt-0.5">
                <span class="text-xs text-muted">铜钱</span>
                <span class="text-xs" :class="playerStore.money >= upgradeCost.money ? '' : 'text-danger'">{{ upgradeCost.money }}文</span>
              </div>
            </div>

            <div class="flex space-x-1">
              <Button class="flex-1 justify-center" @click="closeMachineUpgrade">取消</Button>
              <Button
                class="flex-1 justify-center"
                :class="{ '!bg-accent !text-bg': canUpgradeSlot }"
                :icon="ArrowUpCircle"
                :icon-size="12"
                :disabled="!canUpgradeSlot"
                @click="confirmMachineUpgrade"
              >
                确认升级
              </Button>
            </div>
          </template>

          <p v-else class="text-xs text-muted text-center">已满级</p>
        </div>
      </div>
    </Transition>

    <!-- 拆除确认（仅已升级设备） -->
    <Transition name="panel-fade">
      <div
        v-if="removeConfirmSlot"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        @click.self="removeConfirmIndex = null"
      >
        <div class="game-panel max-w-xs w-full relative">
          <button class="absolute top-2 right-2 text-muted hover:text-text" @click="removeConfirmIndex = null">
            <X :size="14" />
          </button>

          <p class="text-sm text-danger mb-3">
            拆除{{ getStationDisplayName(removeConfirmSlot.machineType) }} Lv.{{ processingStore.getSlotLevel(removeConfirmSlot) }}？
          </p>

          <div class="flex space-x-1">
            <Button class="flex-1 justify-center" @click="removeConfirmIndex = null">取消</Button>
            <Button class="flex-1 justify-center btn-danger" :icon="Trash2" :icon-size="12" @click="confirmRemoveMachine">确认拆除</Button>
          </div>
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
            <!-- 材料不足时直接标出哪儿能弄到，省得玩家满世界找 -->
            <div v-for="mat in craftModal.materials" :key="mat.itemId" class="mb-1 last:mb-0">
              <div class="flex items-center justify-between">
                <span class="text-xs text-muted">{{ getItemName(mat.itemId) }}</span>
                <span class="text-xs" :class="getCombinedItemCount(mat.itemId) >= mat.quantity * displayQty ? '' : 'text-danger'">
                  {{ getCombinedItemCount(mat.itemId) }}/{{ mat.quantity * displayQty }}
                </span>
              </div>
              <p v-if="getCombinedItemCount(mat.itemId) < mat.quantity * displayQty" class="text-[10px] text-accent/60">
                获取：{{ getItemSource(mat.itemId) }}
              </p>
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
  import { Hammer, Trash2, Package, Boxes, X, ArrowUpCircle, Play, Pencil, ChevronUp, ChevronDown } from 'lucide-vue-next'
  import Button from '@/components/game/Button.vue'
  import type { MachineType, AnimalBuildingType, ChestTier, ProcessingSlot, Quality } from '@/types'
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
    MAX_MACHINE_LEVEL,
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
    getProcessingRecipeById
  } from '@/data/processing'
  import { getItemById, CHEST_DEFS, CHEST_TIER_ORDER } from '@/data/items'
  import { getItemSource } from '@/data'
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

  const getFilteredRecipes = (machineType: MachineType) => {
    const recipes = processingStore.getAvailableRecipes(machineType)
    if (!processingStore.onlyAvailable) return recipes
    return recipes.filter(r => r.inputItemId === null || hasCombinedItem(r.inputItemId, r.inputQuantity))
  }

  const QUALITY_ORDER: Quality[] = ['normal', 'fine', 'excellent', 'supreme']

  /** 种子制造机：按品质展开配方列表 */
  const getSeedMakerQualityRecipes = (machineType: MachineType) => {
    const recipes = processingStore.getAvailableRecipes(machineType)
    const result: {
      recipe: (typeof recipes)[number]
      quality: Quality
      count: number
      available: boolean
    }[] = []
    for (const recipe of recipes) {
      if (!recipe.inputItemId) continue
      let hasAny = false
      for (const q of QUALITY_ORDER) {
        const count = getCombinedItemCount(recipe.inputItemId, q)
        if (count > 0) {
          hasAny = true
          result.push({
            recipe,
            quality: q,
            count,
            available: count >= recipe.inputQuantity
          })
        }
      }
      // 无任何品质库存时，仅在非筛选模式下显示一条（普通品质，不可用）
      if (!hasAny && !processingStore.onlyAvailable) {
        result.push({
          recipe,
          quality: 'normal' as Quality,
          count: 0,
          available: false
        })
      }
    }
    return result
  }

  // === 加工站（同类设备合并，设备数 = 并行槽位数） ===

  interface MachineStation {
    machineType: MachineType
    /** 玩家自定义名（未改名则等于 baseName） */
    name: string
    /** 设备原名 */
    baseName: string
    stats: { total: number; idle: number; running: number; ready: number }
    slots: {
      slot: (typeof processingStore.machines)[number]
      originalIndex: number
    }[]
  }

  const stations = computed((): MachineStation[] => {
    const map = new Map<MachineType, MachineStation>()
    // 按 PROCESSING_MACHINES 定义顺序作为默认排序基准
    const typeOrder = new Map(PROCESSING_MACHINES.map((m, i) => [m.id as MachineType, i]))
    for (let i = 0; i < processingStore.machines.length; i++) {
      const slot = processingStore.machines[i]!
      let station = map.get(slot.machineType)
      if (!station) {
        const baseName = getMachineName(slot.machineType)
        station = {
          machineType: slot.machineType,
          baseName,
          name: processingStore.getStationName(slot.machineType, baseName),
          stats: processingStore.getStationStats(slot.machineType),
          slots: []
        }
        map.set(slot.machineType, station)
      }
      station.slots.push({ slot, originalIndex: i })
    }
    const list = [...map.values()].sort((a, b) => (typeOrder.get(a.machineType) ?? 99) - (typeOrder.get(b.machineType) ?? 99))
    // 玩家自定义顺序优先
    const ordered = processingStore.sortStationTypes(list.map(s => s.machineType))
    return ordered.map(t => list.find(s => s.machineType === t)!).filter(Boolean)
  })

  // === 加工站改名与排序 ===

  const renamingType = ref<MachineType | null>(null)
  const renameInput = ref('')

  const startRename = (type: MachineType, currentName: string, baseName: string) => {
    renamingType.value = type
    renameInput.value = currentName === baseName ? '' : currentName
  }

  const confirmRename = () => {
    if (!renamingType.value) return
    processingStore.renameStation(renamingType.value, renameInput.value)
    renamingType.value = null
  }

  const handleMoveStation = (type: MachineType, direction: -1 | 1) => {
    processingStore.moveStation(
      type,
      direction,
      stations.value.map(s => s.machineType)
    )
  }

  /** 全部工站累计可收取份数 */
  const totalReady = computed(() => processingStore.machines.filter(m => m.ready).length)

  /** 槽位占用条的百分比宽度 */
  const pct = (part: number, total: number): string => {
    if (total <= 0) return '0%'
    return `${Math.round((part / total) * 100)}%`
  }

  const toggleGroup = (type: MachineType) => {
    processingStore.toggleGroup(type)
  }

  /** 获取某类型机器的已有数量 */
  const getMachineCountByType = (type: MachineType): number => {
    return processingStore.machines.filter(m => m.machineType === type).length
  }

  // === 投料弹窗 ===

  interface TaskModalState {
    machineType: MachineType
    recipeId: string | null
    quality?: Quality
  }

  const taskModal = ref<TaskModalState | null>(null)
  const taskQty = ref(1)

  const openTaskModal = (machineType: MachineType) => {
    taskModal.value = { machineType, recipeId: null }
    taskQty.value = 1
  }

  const closeTaskModal = () => {
    taskModal.value = null
  }

  const selectTaskRecipe = (recipeId: string, quality?: Quality) => {
    if (!taskModal.value) return
    taskModal.value = { ...taskModal.value, recipeId, quality }
    taskQty.value = maxTaskQty.value
  }

  const taskRecipe = computed(() => (taskModal.value?.recipeId ? getProcessingRecipeById(taskModal.value.recipeId) : null))

  /** 当前工站的空闲槽位数 */
  const taskIdleSlots = computed(() => {
    if (!taskModal.value) return 0
    return processingStore.getStationStats(taskModal.value.machineType).idle
  })

  /** 可投料份数上限 = min(空闲槽位, 材料够做几份) */
  const maxTaskQty = computed(() => {
    const recipe = taskRecipe.value
    if (!recipe) return 1
    let max = taskIdleSlots.value
    if (recipe.inputItemId) {
      const owned = taskModal.value?.quality
        ? getCombinedItemCount(recipe.inputItemId, taskModal.value.quality)
        : getCombinedItemCount(recipe.inputItemId)
      max = Math.min(max, Math.floor(owned / recipe.inputQuantity))
    }
    return Math.max(1, max)
  })

  const setTaskQty = (val: number) => {
    taskQty.value = Math.max(1, Math.min(val, maxTaskQty.value))
  }
  const addTaskQty = (delta: number) => setTaskQty(taskQty.value + delta)
  const onTaskQtyInput = (e: Event) => {
    const val = parseInt((e.target as HTMLInputElement).value, 10)
    if (!isNaN(val)) setTaskQty(val)
  }

  const confirmTask = () => {
    const modal = taskModal.value
    if (!modal?.recipeId) return
    const started = processingStore.startProcessingBatch(modal.machineType, modal.recipeId, taskQty.value, modal.quality)
    if (started > 0) {
      sfxClick()
      const recipe = getProcessingRecipeById(modal.recipeId)
      const qualityLabel = modal.quality && modal.quality !== 'normal' ? `(${QUALITY_NAMES[modal.quality]})` : ''
      addLog(
        `${getMachineName(modal.machineType)}开工${started}份${recipe?.name ?? ''}${qualityLabel}，${recipe?.processingDays ?? '?'}天后完成。`
      )
    } else {
      addLog('原料不足或没有空闲槽位。')
    }
    taskModal.value = null
  }

  // === 工站批量操作 ===

  const handleCollectAll = (machineType?: MachineType) => {
    // 收取前按槽位汇总实际产出数量（含设备等级），收取后槽位会被重置
    const totals = new Map<string, number>()
    for (const slot of processingStore.machines) {
      if (!slot.ready || !slot.recipeId || (machineType && slot.machineType !== machineType)) continue
      const outputId = getProcessingRecipeById(slot.recipeId)?.outputItemId
      if (!outputId) continue
      totals.set(outputId, (totals.get(outputId) ?? 0) + processingStore.getSlotOutputQuantity(slot))
    }
    const count = processingStore.collectAllReady(machineType)
    if (count > 0) {
      sfxClick()
      const summary = Array.from(totals.entries())
        .map(([id, qty]) => `${getItemName(id)}×${qty}`)
        .join('、')
      addLog(`收取了：${summary}。`)
    }
  }

  const handleCancelAll = (machineType: MachineType) => {
    const count = processingStore.cancelAllProcessing(machineType)
    if (count > 0) {
      addLog(`${getMachineName(machineType)}停工${count}个槽位，原料已退回。`)
    }
  }

  const handleRemoveOne = (machineType: MachineType) => {
    const index = processingStore.getStationRemoveIndex(machineType)
    if (index !== null) requestRemoveMachine(index)
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

  // === 设备升级 ===

  /** 正在查看升级费用的设备（machines 原始下标） */
  const upgradeIndex = ref<number | null>(null)

  const upgradeSlot = computed(() => (upgradeIndex.value === null ? null : (processingStore.machines[upgradeIndex.value] ?? null)))

  const upgradeSlotLevel = computed(() => (upgradeSlot.value ? processingStore.getSlotLevel(upgradeSlot.value) : 0))

  const upgradeCost = computed(() => (upgradeSlot.value ? processingStore.getMachineUpgradeCost(upgradeSlotLevel.value + 1) : null))

  const canUpgradeSlot = computed(() => upgradeIndex.value !== null && processingStore.canUpgradeMachine(upgradeIndex.value))

  const openMachineUpgrade = (index: number) => {
    upgradeIndex.value = index
  }

  const closeMachineUpgrade = () => {
    upgradeIndex.value = null
  }

  const confirmMachineUpgrade = () => {
    if (upgradeIndex.value === null) return
    const result = processingStore.upgradeMachine(upgradeIndex.value)
    upgradeIndex.value = null
    addLog(result.message)
    if (!result.success) return
    sfxClick()
    const tr = gameStore.advanceTime(ACTION_TIME_COSTS.craftMachine)
    if (tr.message) addLog(tr.message)
    if (tr.passedOut) handleEndDay()
  }

  // === 拆除确认（已升级设备） ===

  /** 待确认拆除的设备（machines 原始下标） */
  const removeConfirmIndex = ref<number | null>(null)

  const removeConfirmSlot = computed(() =>
    removeConfirmIndex.value === null ? null : (processingStore.machines[removeConfirmIndex.value] ?? null)
  )

  /** 拆除入口：已升级设备先确认，其余直接拆 */
  const requestRemoveMachine = (index: number) => {
    const slot = processingStore.machines[index]
    if (!slot) return
    if (processingStore.getSlotLevel(slot) > 0) {
      removeConfirmIndex.value = index
      return
    }
    handleRemoveMachine(index)
  }

  const confirmRemoveMachine = () => {
    const index = removeConfirmIndex.value
    removeConfirmIndex.value = null
    if (index !== null) handleRemoveMachine(index)
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

  /** 加工站显示名（玩家改过名则用自定义名） */
  const getStationDisplayName = (type: MachineType): string => {
    return processingStore.getStationName(type, getMachineName(type))
  }

  /** 槽位产出数量标签：多于 1 份时显示「×N」 */
  const getOutputQtyLabel = (slot: ProcessingSlot): string => {
    const qty = processingStore.getSlotOutputQuantity(slot)
    return qty > 1 ? `×${qty}` : ''
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

  // === 制造处理 ===

  const handleCraftMachine = (machineType: MachineType) => {
    if (processingStore.craftMachine(machineType)) {
      sfxClick()
      const count = getMachineCountByType(machineType)
      addLog(`建造了一台${getMachineName(machineType)}，加工站并行槽位增至${count}个。`)
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

  /** 单台视图：给指定机器投一份料 */
  const handleStartProcessing = (slotIndex: number, recipeId: string, quality?: Quality) => {
    if (processingStore.startProcessing(slotIndex, recipeId, quality)) {
      sfxClick()
      const recipe = getProcessingRecipeById(recipeId)
      const qualityLabel = quality && quality !== 'normal' ? `(${QUALITY_NAMES[quality]})` : ''
      addLog(`开始加工${recipe?.name ?? recipeId}${qualityLabel}，需要${recipe?.processingDays ?? '?'}天。`)
    } else {
      addLog('原料不足或该设备正在使用。')
    }
  }

  /** 拆除指定的那一台（单台视图的垃圾桶与加工站的「拆除一台」共用） */
  const handleRemoveMachine = (slotIndex: number) => {
    const slot = processingStore.machines[slotIndex]
    if (!slot) return
    const level = processingStore.getSlotLevel(slot)
    const name = getMachineName(slot.machineType) + (level > 0 ? ` Lv.${level}` : '')
    if (processingStore.removeMachine(slotIndex)) {
      addLog(`拆除了${name}，制作材料已退还。`)
    }
  }

  const handleCollect = (slotIndex: number) => {
    const slot = processingStore.machines[slotIndex]
    // 收取前先算好数量，收取后槽位会被重置
    const qtyLabel = slot ? getOutputQtyLabel(slot) : ''
    const outputId = processingStore.collectProduct(slotIndex)
    if (outputId) {
      sfxClick()
      const name = getItemById(outputId)?.name ?? outputId
      addLog(`收取了${name}${qtyLabel}。`)
    }
  }

  const handleCancelProcessing = (slotIndex: number) => {
    const slot = processingStore.machines[slotIndex]
    if (!slot) return
    const name = getMachineName(slot.machineType)
    if (processingStore.cancelProcessing(slotIndex)) {
      addLog(`${name}的一个槽位已停工，原料已退回。`)
    }
  }
</script>
