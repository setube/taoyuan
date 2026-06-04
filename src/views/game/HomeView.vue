<template>
  <div>
    <h3 class="text-accent text-sm mb-3">
      <Building :size="14" class="inline" />
      设施
    </h3>

    <!-- 山洞 -->
    <div class="border border-accent/20 rounded-xs p-3 mb-4">
      <p class="text-sm text-accent mb-2">
        <Mountain :size="14" class="inline" />
        {{ homeStore.caveUnlocked && homeStore.caveChoice !== 'none' ? homeStore.caveName : '山洞' }}
      </p>
      <div v-if="!homeStore.caveUnlocked">
        <p class="text-xs text-muted">山洞尚未开放。（累计收入达到一定额度后自动开放）</p>
      </div>
      <div v-else-if="homeStore.caveChoice === 'none'">
        <p class="text-xs text-muted mb-2">选择山洞用途（选定后不可更改）：</p>
        <div class="flex flex-col space-y-1">
          <div
            class="flex items-center justify-between border border-accent/20 rounded-xs px-3 py-1.5 cursor-pointer hover:bg-accent/5"
            @click="handleChooseCave('mushroom')"
          >
            <span class="text-xs">蘑菇洞</span>
            <span class="text-xs text-muted">每天60%概率产蘑菇</span>
          </div>
          <div
            class="flex items-center justify-between border border-accent/20 rounded-xs px-3 py-1.5 cursor-pointer hover:bg-accent/5"
            @click="handleChooseCave('fruit_bat')"
          >
            <span class="text-xs">蝙蝠洞</span>
            <span class="text-xs text-muted">每天50%概率产水果</span>
          </div>
        </div>
      </div>
      <div v-else>
        <p class="text-xs mb-1">
          {{ homeStore.caveChoice === 'mushroom' ? '蘑菇洞 — 每天有概率产出蘑菇类物品。' : '蝙蝠洞 — 每天有概率产出各季水果。' }}
        </p>
        <div class="border border-accent/10 rounded-xs p-2 mb-2 space-y-0.5">
          <div class="flex items-center justify-between">
            <span class="text-[10px] text-muted">等级</span>
            <span class="text-[10px] text-accent">{{ homeStore.caveName }}（Lv.{{ homeStore.caveLevel }}）</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-[10px] text-muted">运作天数</span>
            <span class="text-[10px]">{{ homeStore.caveDaysActive }}天</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-[10px] text-muted">产出品质</span>
            <span class="text-[10px]" :class="caveQualityClass">{{ caveQualityLabel }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-[10px] text-muted">产出概率</span>
            <span class="text-[10px]">{{ caveChanceText }}</span>
          </div>
          <div v-if="currentCaveDef && currentCaveDef.doubleChance > 0" class="flex items-center justify-between">
            <span class="text-[10px] text-muted">双倍概率</span>
            <span class="text-[10px]">{{ Math.round(currentCaveDef.doubleChance * 100) }}%</span>
          </div>
        </div>
        <!-- 山洞升级 -->
        <div v-if="homeStore.nextCaveUpgrade" class="border border-accent/10 rounded-xs p-2">
          <p class="text-[10px] text-muted mb-1">升级至 {{ homeStore.nextCaveUpgrade.name }}</p>
          <div class="space-y-0.5 mb-1.5">
            <div v-for="mat in homeStore.nextCaveUpgrade.materialCost" :key="mat.itemId" class="flex items-center justify-between">
              <span class="text-[10px] text-muted">{{ getItemName(mat.itemId) }}</span>
              <CombinedMaterialCount :item-id="mat.itemId" :required="mat.quantity" text-class="text-[10px]" always-show-breakdown />
            </div>
            <div class="flex items-center justify-between">
              <span class="text-[10px] text-muted">铜钱</span>
              <span class="text-[10px]" :class="playerStore.money >= homeStore.nextCaveUpgrade.cost ? '' : 'text-danger'">
                {{ homeStore.nextCaveUpgrade.cost }}文
              </span>
            </div>
          </div>
          <Button
            class="w-full justify-center"
            :class="{ '!bg-accent !text-bg': canUpgradeCave }"
            :disabled="!canUpgradeCave"
            :icon="ArrowUp"
            :icon-size="12"
            @click="handleUpgradeCave"
          >
            升级山洞
          </Button>
        </div>
        <div v-else class="text-[10px] text-muted">山洞已升至最高等级。</div>
      </div>
    </div>

    <!-- 温室 -->
    <div class="border border-accent/20 rounded-xs p-3 mb-4">
      <p class="text-sm text-accent mb-2">
        <Leaf :size="14" class="inline" />
        温室
      </p>
      <div v-if="!homeStore.greenhouseUnlocked">
        <p class="text-xs text-muted mb-2">解锁温室后可在任何季节种植作物，作物自动浇水。</p>
        <div
          class="flex items-center justify-between border border-accent/20 rounded-xs px-3 py-1.5 cursor-pointer hover:bg-accent/5"
          @click="showGreenhouseModal = true"
        >
          <span class="text-xs">解锁温室</span>
          <span class="text-xs text-accent whitespace-nowrap">{{ GREENHOUSE_UNLOCK_COST }}文</span>
        </div>
      </div>
      <div v-else>
        <p class="text-xs text-success">温室已开放。可在农场面板中切换至温室进行种植。</p>
      </div>
    </div>

    <!-- 仓库 -->
    <div class="border border-accent/20 rounded-xs p-3">
      <div class="flex items-center justify-between mb-2">
        <p class="text-sm text-accent">
          <Warehouse :size="14" class="inline" />
          仓库
        </p>
        <span v-if="warehouseStore.unlocked" class="text-xs text-muted">
          箱子 {{ warehouseStore.chests.length }}/{{ warehouseStore.maxChests }}
        </span>
      </div>

      <!-- 未解锁 -->
      <div v-if="!warehouseStore.unlocked">
        <p class="text-xs text-muted mb-2">解锁仓库后可放置箱子分类存放物品。</p>
        <div
          class="flex items-center justify-between border border-accent/20 rounded-xs px-3 py-1.5 cursor-pointer hover:bg-accent/5"
          @click="showWarehouseUnlockModal = true"
        >
          <span class="text-xs">解锁仓库</span>
          <span class="text-xs text-accent whitespace-nowrap">{{ warehouseStore.UNLOCK_COST }}文</span>
        </div>
      </div>

      <!-- 已解锁 -->
      <template v-else>
        <!-- 箱子列表 -->
        <div v-if="warehouseStore.chests.length > 0" class="flex flex-col space-y-1.5 mb-2">
          <div
            v-for="(chest, chestIdx) in warehouseStore.chests"
            :key="chest.id"
            class="border border-accent/10 rounded-xs px-3 py-2 cursor-pointer hover:bg-accent/5"
            @click="openChestId = chest.id"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-1.5">
                <span
                  class="text-[10px] px-1 rounded-xs border border-accent/30"
                  :class="chest.tier === 'void' ? 'text-quality-supreme' : 'text-accent'"
                >
                  {{ CHEST_DEFS[chest.tier].name }}
                </span>
                <span v-if="renamingChestId !== chest.id" class="text-xs">{{ chest.label }}</span>
                <input
                  v-else
                  v-model="renameInput"
                  class="text-xs bg-transparent border-b border-accent/40 outline-none w-20"
                  maxlength="8"
                  @keyup.enter="confirmRenameChest"
                  @keyup.escape="renamingChestId = null"
                  @click.stop
                />
                <button
                  v-if="renamingChestId !== chest.id"
                  class="text-muted hover:text-accent"
                  @click.stop="startRenameChest(chest.id, chest.label)"
                >
                  <Pencil :size="10" />
                </button>
              </div>
              <div class="flex items-center space-x-1.5">
                <span class="text-[10px] text-muted">{{ chest.items.length }}/{{ CHEST_DEFS[chest.tier].capacity }}</span>
                <button
                  v-if="warehouseStore.chests.length > 1 && chestIdx > 0"
                  class="text-muted hover:text-accent"
                  @click.stop="warehouseStore.moveChest(chest.id, 'up')"
                >
                  <ChevronUp :size="12" />
                </button>
                <button
                  v-if="warehouseStore.chests.length > 1 && chestIdx < warehouseStore.chests.length - 1"
                  class="text-muted hover:text-accent"
                  @click.stop="warehouseStore.moveChest(chest.id, 'down')"
                >
                  <ChevronDown :size="12" />
                </button>
                <button class="text-muted hover:text-danger" @click.stop="openDismantleConfirm(chest.id)">
                  <Trash2 :size="10" />
                </button>
              </div>
            </div>
            <div v-if="chest.filterCategories.length > 0" class="flex flex-wrap gap-1 mt-1">
              <span
                v-for="cat in chest.filterCategories"
                :key="cat"
                class="text-[10px] px-1 rounded-xs border border-accent/25 text-muted"
              >
                {{ CHEST_CATEGORY_LABELS[cat] }}
              </span>
            </div>
            <!-- 虚空箱角色 -->
            <template v-if="chest.tier === 'void'">
              <div class="flex items-center space-x-1 mt-1">
                <button
                  v-for="role in VOID_ROLES"
                  :key="role.value"
                  class="text-[10px] px-1 rounded-xs border"
                  :class="chest.voidRole === role.value ? 'border-accent text-accent' : 'border-accent/20 text-muted'"
                  @click.stop="handleSetVoidRole(chest.id, role.value)"
                >
                  {{ role.label }}
                </button>
              </div>
            </template>
          </div>
        </div>
        <div v-else class="flex flex-col items-center justify-center py-4 text-muted mb-2">
          <Warehouse :size="24" />
          <p class="text-xs mt-1">仓库空空如也</p>
        </div>

        <Button
          v-if="warehouseStore.chests.length > 0"
          class="w-full mb-1"
          :icon="LayoutGrid"
          :icon-size="12"
          @click="showWarehouseOverview = true"
        >
          仓库总览（{{ warehouseOverviewKindCount }}种）
        </Button>
        <Button
          v-if="warehouseStore.chests.length > 0"
          class="w-full mb-1"
          :icon="ArrowDownToLine"
          :icon-size="12"
          @click="handleAutoDepositAll"
        >
          一键放入
        </Button>
        <!-- 添加箱子 -->
        <Button
          v-if="warehouseStore.chests.length < warehouseStore.maxChests"
          class="w-full"
          :icon="Plus"
          :icon-size="12"
          @click="showAddChestModal = true"
        >
          添加箱子
        </Button>
      </template>
    </div>

    <!-- 解锁温室弹窗 -->
    <Transition name="panel-fade">
      <div
        v-if="showGreenhouseModal"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        @click.self="showGreenhouseModal = false"
      >
        <div class="game-panel max-w-xs w-full relative">
          <button class="absolute top-2 right-2 text-muted hover:text-text" @click="showGreenhouseModal = false">
            <X :size="14" />
          </button>

          <p class="text-sm text-accent mb-2">解锁温室</p>

          <div class="border border-accent/10 rounded-xs p-2 mb-2">
            <p class="text-xs text-muted">解锁后可在任何季节种植作物，作物自动浇水。</p>
          </div>

          <div class="border border-accent/10 rounded-xs p-2 mb-2 space-y-1">
            <p class="text-xs text-muted mb-1">所需材料</p>
            <div v-for="mat in GREENHOUSE_MATERIAL_COST" :key="mat.itemId" class="flex items-center justify-between">
              <span class="text-xs text-muted">{{ getItemName(mat.itemId) }}</span>
              <CombinedMaterialCount :item-id="mat.itemId" :required="mat.quantity" always-show-breakdown />
            </div>
            <div class="flex items-center justify-between">
              <span class="text-xs text-muted">铜钱</span>
              <span class="text-xs" :class="playerStore.money >= GREENHOUSE_UNLOCK_COST ? '' : 'text-danger'">
                {{ GREENHOUSE_UNLOCK_COST }}文
              </span>
            </div>
          </div>

          <Button
            class="w-full justify-center"
            :class="{ '!bg-accent !text-bg': canUnlockGreenhouse }"
            :disabled="!canUnlockGreenhouse"
            :icon="Unlock"
            :icon-size="12"
            @click="handleUnlockFromModal"
          >
            解锁
          </Button>
        </div>
      </div>
    </Transition>

    <!-- 仓库解锁弹窗 -->
    <Transition name="panel-fade">
      <div
        v-if="showWarehouseUnlockModal"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        @click.self="showWarehouseUnlockModal = false"
      >
        <div class="game-panel max-w-xs w-full relative">
          <button class="absolute top-2 right-2 text-muted hover:text-text" @click="showWarehouseUnlockModal = false">
            <X :size="14" />
          </button>

          <p class="text-sm text-accent mb-2">解锁仓库</p>

          <div class="border border-accent/10 rounded-xs p-2 mb-2">
            <p class="text-xs text-muted">解锁后可放置箱子分类存放物品，初始可放5个箱子，可在商店每次扩建+3个槽位。</p>
          </div>

          <div class="border border-accent/10 rounded-xs p-2 mb-2 space-y-1">
            <template v-if="WAREHOUSE_UNLOCK_MATERIALS.length > 0">
              <p class="text-xs text-muted mb-1">所需材料</p>
              <div v-for="mat in WAREHOUSE_UNLOCK_MATERIALS" :key="mat.itemId" class="flex items-center justify-between">
                <span class="text-xs text-muted">{{ getItemName(mat.itemId) }}</span>
                <CombinedMaterialCount :item-id="mat.itemId" :required="mat.quantity" always-show-breakdown />
              </div>
            </template>
            <div class="flex items-center justify-between">
              <span class="text-xs text-muted">铜钱</span>
              <span class="text-xs" :class="playerStore.money >= warehouseStore.UNLOCK_COST ? '' : 'text-danger'">
                {{ warehouseStore.UNLOCK_COST }}文
              </span>
            </div>
          </div>

          <Button
            class="w-full justify-center"
            :class="{ '!bg-accent !text-bg': canUnlockWarehouse }"
            :disabled="!canUnlockWarehouse"
            :icon="Unlock"
            :icon-size="12"
            @click="handleUnlockWarehouse"
          >
            解锁
          </Button>
        </div>
      </div>
    </Transition>

    <!-- 箱子详情弹窗 -->
    <Transition name="panel-fade">
      <div v-if="openChestId" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" @click.self="openChestId = null">
        <div v-if="currentOpenChest" class="game-panel max-w-sm w-full">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center space-x-1.5">
              <span
                class="text-[10px] px-1 rounded-xs border border-accent/30"
                :class="currentOpenChest.tier === 'void' ? 'text-quality-supreme' : 'text-accent'"
              >
                {{ CHEST_DEFS[currentOpenChest.tier].name }}
              </span>
              <p class="text-sm text-accent">{{ currentOpenChest.label }}</p>
              <span class="text-[10px] text-muted">
                {{ currentOpenChest.items.length }}/{{ CHEST_DEFS[currentOpenChest.tier].capacity }}
              </span>
            </div>
            <button class="text-muted hover:text-accent" title="重命名" @click="startRenameChest(currentOpenChest.id, currentOpenChest.label)">
              <Pencil :size="12" />
            </button>
            <Button class="py-0 px-1" :icon="X" :icon-size="12" @click="openChestId = null" />
          </div>

          <div class="border border-accent/10 rounded-xs p-2 mb-2">
            <p class="text-[10px] text-muted mb-1">存放分类（每类仅可绑一个箱子）</p>
            <div class="flex flex-wrap gap-1">
              <button
                v-for="cat in CHEST_FILTER_CATEGORIES"
                :key="cat"
                type="button"
                class="text-[10px] px-1.5 py-0.5 rounded-xs border"
                :class="
                  currentOpenChest.filterCategories.includes(cat)
                    ? 'border-accent text-accent bg-accent/10'
                    : isCategoryTakenByOther(cat)
                      ? 'border-accent/30 text-muted'
                      : 'border-accent/20 text-muted'
                "
                @click="handleToggleChestCategory(cat)"
              >
                {{ CHEST_CATEGORY_LABELS[cat] }}
              </button>
            </div>
            <p v-if="currentOpenChest.filterCategories.length === 0" class="text-[10px] text-muted/50 mt-1">未设置时仅支持手动存入</p>
          </div>

          <!-- 箱子物品列表 -->
          <div v-if="currentOpenChest.items.length > 0" class="flex flex-col space-y-1 mb-2 max-h-48 overflow-y-auto">
            <div
              v-for="(item, idx) in currentOpenChest.items"
              :key="idx"
              class="flex items-center justify-between border border-accent/10 rounded-xs px-2 py-1 mr-1"
              @click="chestItemDetail = { itemId: item.itemId, quality: item.quality, quantity: item.quantity }"
            >
              <span class="text-xs truncate mr-2 cursor-pointer hover:underline" :class="qualityTextClass(item.quality)">
                {{ getItemName(item.itemId) }}
                <span class="text-xs text-muted">&times;{{ item.quantity }}</span>
              </span>
              <div class="flex items-center space-x-1.5">
                <Button
                  class="py-0 px-1"
                  @click.stop="openChestQtyModal('withdraw', openChestId!, item.itemId, item.quality, item.quantity)"
                >
                  取出
                </Button>
              </div>
            </div>
          </div>
          <div v-else class="flex flex-col items-center justify-center py-6 mb-2">
            <Warehouse :size="36" class="text-accent/20 mb-2" />
            <p class="text-xs text-muted">箱子是空的</p>
            <p class="text-[10px] text-muted/50 mt-0.5">点击下方「存入物品」添加</p>
          </div>

          <Button
            v-if="nextChestUpgradeTier"
            class="w-full mb-1"
            :icon="ArrowUp"
            :icon-size="12"
            :class="{ '!bg-accent !text-bg': canUpgradeOpenChest }"
            :disabled="!canUpgradeOpenChest"
            @click="handleUpgradeOpenChest"
          >
            扩容为{{ CHEST_DEFS[nextChestUpgradeTier].name }}（{{ CHEST_DEFS[nextChestUpgradeTier].capacity }}格）
          </Button>
          <!-- 一键整理 -->
          <Button
            v-if="currentOpenChest && currentOpenChest.items.length > 1"
            class="w-full mb-1"
            :icon="ArrowDown01"
            :icon-size="12"
            @click="warehouseStore.sortChest(openChestId!)"
          >
            整理
          </Button>
          <!-- 一键存入重复物品 -->
          <Button
            v-if="duplicateDepositItems.length > 0"
            class="w-full mb-1"
            :icon="ArrowDownToLine"
            :icon-size="12"
            @click="handleDepositDuplicates"
          >
            一键存入重复物品
          </Button>
          <!-- 存入按钮 -->
          <Button v-if="depositableItems.length > 0" class="w-full" :icon="ArrowDown" :icon-size="12" @click="showChestDepositModal = true">
            存入物品
          </Button>
        </div>
      </div>
    </Transition>

    <!-- 箱子存入弹窗 -->
    <Transition name="panel-fade">
      <div
        v-if="showChestDepositModal && openChestId"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        @click.self="showChestDepositModal = false"
      >
        <div class="game-panel max-w-sm w-full">
          <div class="flex items-center justify-between mb-2">
            <p class="text-sm text-accent">存入物品</p>
            <Button class="py-0 px-1" :icon="X" :icon-size="12" @click="showChestDepositModal = false" />
          </div>
          <div class="flex flex-col space-y-1 max-h-60 overflow-y-auto">
            <div
              v-for="item in depositableItems"
              :key="item.itemId + item.quality"
              class="flex items-center justify-between border border-accent/20 rounded-xs px-3 py-1.5 cursor-pointer hover:bg-accent/5"
              @click="openChestQtyModal('deposit', openChestId!, item.itemId, item.quality, item.quantity)"
            >
              <span class="text-xs truncate mr-2" :class="qualityTextClass(item.quality)">
                {{ getItemName(item.itemId) }}
                <span v-if="item.quality !== 'normal'" class="text-[10px]">({{ QUALITY_LABEL[item.quality] }})</span>
              </span>
              <span class="text-xs text-muted">&times;{{ item.quantity }}</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 箱子数量选择弹窗 -->
    <Transition name="panel-fade">
      <div
        v-if="chestQtyModal"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4"
        @click.self="chestQtyModal = null"
      >
        <div class="game-panel max-w-xs w-full">
          <div class="flex items-center justify-between mb-2">
            <p class="text-sm text-accent">{{ chestQtyModal.mode === 'withdraw' ? '取出' : '存入' }}</p>
            <Button class="py-0 px-1" :icon="X" :icon-size="12" @click="chestQtyModal = null" />
          </div>
          <p class="text-xs mb-2" :class="qualityTextClass(chestQtyModal.quality)">
            {{ getItemName(chestQtyModal.itemId) }}
            <span v-if="chestQtyModal.quality !== 'normal'" class="text-[10px]">({{ QUALITY_LABEL[chestQtyModal.quality] }})</span>
          </p>
          <div class="border border-accent/10 rounded-xs p-2 mb-2">
            <div class="flex items-center justify-between mb-1.5">
              <span class="text-xs text-muted">数量</span>
              <div class="flex items-center space-x-1">
                <Button class="h-6 px-1.5 py-0.5 text-xs justify-center" :disabled="chestQty <= 1" @click="addChestQty(-1)">-</Button>
                <input
                  type="number"
                  :value="chestQty"
                  min="1"
                  :max="chestQtyModal.max"
                  class="w-24 h-6 px-2 py-0.5 bg-bg border border-accent/30 rounded-xs text-xs text-center text-accent outline-none"
                  @input="onChestQtyInput"
                />
                <Button class="h-6 px-1.5 py-0.5 text-xs justify-center" :disabled="chestQty >= chestQtyModal.max" @click="addChestQty(1)">
                  +
                </Button>
              </div>
            </div>
            <div class="flex space-x-1">
              <Button class="flex-1 justify-center" :disabled="chestQty <= 1" @click="setChestQty(1)">最少</Button>
              <Button class="flex-1 justify-center" :disabled="chestQty >= chestQtyModal.max" @click="setChestQty(chestQtyModal!.max)">
                最多
              </Button>
            </div>
          </div>
          <Button class="w-full justify-center !bg-accent !text-bg" @click="confirmChestQty">
            {{ chestQtyModal.mode === 'withdraw' ? '取出' : '存入' }} &times;{{ chestQty }}
          </Button>
        </div>
      </div>
    </Transition>

    <!-- 拆卸箱子确认弹窗 -->
    <Transition name="panel-fade">
      <div
        v-if="dismantleChestId"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        @click.self="dismantleChestId = null"
      >
        <div class="game-panel max-w-xs w-full">
          <div class="flex items-center justify-between mb-2">
            <p class="text-sm text-accent">拆卸确认</p>
            <Button class="py-0 px-1" :icon="X" :icon-size="12" @click="dismantleChestId = null" />
          </div>
          <template v-if="dismantleChestInfo">
            <p class="text-xs mb-2">
              确定要拆卸「{{ dismantleChestInfo.label }}」吗？
              <span v-if="dismantleChestInfo.itemCount > 0" class="text-danger">
                箱内{{ dismantleChestInfo.itemCount }}格物品将返还背包。
              </span>
            </p>
            <div class="border border-accent/10 rounded-xs p-2 mb-3">
              <p class="text-[10px] text-muted mb-1">返还材料（50%）</p>
              <div class="flex flex-wrap gap-x-3 gap-y-0.5">
                <span v-for="mat in dismantleChestInfo.refund" :key="mat.itemId" class="text-[10px] text-success">
                  {{ getItemName(mat.itemId) }} ×{{ mat.quantity }}
                </span>
                <span v-if="dismantleChestInfo.refund.length === 0" class="text-[10px] text-muted">无</span>
              </div>
            </div>
            <div class="flex space-x-3 justify-center">
              <Button @click="dismantleChestId = null">取消</Button>
              <Button class="btn-danger" :icon="Trash2" :icon-size="12" @click="confirmDismantle">拆卸</Button>
            </div>
          </template>
        </div>
      </div>
    </Transition>

    <!-- 箱子道具信息弹窗 -->
    <Transition name="panel-fade">
      <div
        v-if="chestItemDetail && chestItemDef"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        @click.self="chestItemDetail = null"
      >
        <div class="game-panel max-w-xs w-full relative">
          <button class="absolute top-2 right-2 text-muted hover:text-text" @click="chestItemDetail = null">
            <X :size="14" />
          </button>
          <p class="text-sm mb-2" :class="qualityTextClass(chestItemDetail.quality, 'text-accent')">
            {{ chestItemDef.name }}
          </p>
          <div class="border border-accent/10 rounded-xs p-2 mb-2">
            <p class="text-xs text-muted">{{ chestItemDef.description }}</p>
          </div>
          <div class="border border-accent/10 rounded-xs p-2">
            <div class="flex items-center justify-between">
              <span class="text-xs text-muted">数量</span>
              <span class="text-xs">×{{ chestItemDetail.quantity }}</span>
            </div>
            <div v-if="chestItemDetail.quality !== 'normal'" class="flex items-center justify-between mt-0.5">
              <span class="text-xs text-muted">品质</span>
              <span class="text-xs" :class="qualityTextClass(chestItemDetail.quality)">{{ QUALITY_LABEL[chestItemDetail.quality] }}</span>
            </div>
            <div v-if="chestItemDef.sellPrice" class="flex items-center justify-between mt-0.5">
              <span class="text-xs text-muted">售价</span>
              <span class="text-xs text-accent">{{ chestItemDef.sellPrice }}文</span>
            </div>
            <div v-if="chestItemDef.staminaRestore" class="flex items-center justify-between mt-0.5">
              <span class="text-xs text-muted">恢复</span>
              <span class="text-xs text-success">
                +{{ chestItemDef.staminaRestore }}体力
                <template v-if="chestItemDef.healthRestore">/ +{{ chestItemDef.healthRestore }}HP</template>
              </span>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 仓库总览 -->
    <Transition name="panel-fade">
      <div
        v-if="showWarehouseOverview"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        @click.self="showWarehouseOverview = false"
      >
        <div class="game-panel max-w-md w-full max-h-[85vh] flex flex-col">
          <div class="flex items-center justify-between mb-2 shrink-0">
            <p class="text-sm text-accent">仓库总览</p>
            <Button class="py-0 px-1" :icon="X" :icon-size="12" @click="showWarehouseOverview = false" />
          </div>
          <p class="text-[10px] text-muted mb-2 shrink-0">共 {{ warehouseOverviewKindCount }} 种物品，可按分类查看并取出到背包</p>
          <div class="flex flex-wrap gap-1 mb-2 shrink-0 max-h-24 overflow-y-auto">
            <button
              type="button"
              class="text-[10px] px-1.5 py-0.5 rounded-xs border"
              :class="overviewCategory === 'all' ? 'border-accent text-accent bg-accent/10' : 'border-accent/20 text-muted'"
              @click="overviewCategory = 'all'"
            >
              全部
            </button>
            <button
              v-for="cat in overviewUsedCategories"
              :key="cat"
              type="button"
              class="text-[10px] px-1.5 py-0.5 rounded-xs border"
              :class="overviewCategory === cat ? 'border-accent text-accent bg-accent/10' : 'border-accent/20 text-muted'"
              @click="overviewCategory = cat"
            >
              {{ CHEST_CATEGORY_LABELS[cat] }}
            </button>
          </div>
          <div v-if="filteredOverviewEntries.length > 0" class="flex flex-col space-y-1 overflow-y-auto flex-1 min-h-0">
            <div
              v-for="entry in filteredOverviewEntries"
              :key="entry.itemId + entry.quality"
              class="border border-accent/10 rounded-xs px-2 py-1.5"
            >
              <div class="flex items-center justify-between">
                <span class="text-xs truncate mr-2" :class="qualityTextClass(entry.quality)">
                  {{ getItemName(entry.itemId) }}
                  <span v-if="entry.quality !== 'normal'" class="text-[10px]">({{ QUALITY_LABEL[entry.quality] }})</span>
                  <span class="text-muted">&times;{{ entry.totalQuantity }}</span>
                </span>
                <div class="flex items-center space-x-1 shrink-0">
                  <Button class="py-0 px-1 text-[10px]" @click="openOverviewWithdraw(entry)">取出</Button>
                  <Button
                    v-if="entry.locations[0]"
                    class="py-0 px-1 text-[10px]"
                    @click="openChestFromOverview(entry.locations[0]!.chestId)"
                  >
                    开箱
                  </Button>
                </div>
              </div>
              <p class="text-[10px] text-muted mt-0.5">
                {{ entry.locations.map(l => `${l.chestLabel}×${l.quantity}`).join('、') }}
              </p>
            </div>
          </div>
          <div v-else class="flex flex-col items-center py-8 text-muted">
            <Warehouse :size="32" class="opacity-30 mb-2" />
            <p class="text-xs">该分类下暂无物品</p>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 总览取出数量 -->
    <Transition name="panel-fade">
      <div
        v-if="overviewWithdrawModal"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4"
        @click.self="overviewWithdrawModal = null"
      >
        <div class="game-panel max-w-xs w-full">
          <p class="text-sm text-accent mb-2">取出到背包</p>
          <p class="text-xs mb-2" :class="qualityTextClass(overviewWithdrawModal.quality)">
            {{ getItemName(overviewWithdrawModal.itemId) }}（仓库共{{ overviewWithdrawModal.max }}）
          </p>
          <div class="border border-accent/10 rounded-xs p-2 mb-2">
            <div class="flex items-center justify-between">
              <span class="text-xs text-muted">数量</span>
              <input
                v-model.number="overviewWithdrawQty"
                type="number"
                min="1"
                :max="overviewWithdrawModal.max"
                class="w-20 h-6 px-2 bg-bg border border-accent/30 rounded-xs text-xs text-center"
              />
            </div>
          </div>
          <Button class="w-full justify-center !bg-accent !text-bg" @click="confirmOverviewWithdraw">确认取出</Button>
        </div>
      </div>
    </Transition>

    <!-- 添加箱子弹窗 -->
    <Transition name="panel-fade">
      <div
        v-if="showAddChestModal"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        @click.self="showAddChestModal = false"
      >
        <div class="game-panel max-w-sm w-full">
          <div class="flex items-center justify-between mb-2">
            <p class="text-sm text-accent">制作箱子</p>
            <Button class="py-0 px-1" :icon="X" :icon-size="12" @click="showAddChestModal = false" />
          </div>
          <div class="flex flex-col space-y-1.5">
            <div v-for="tier in CHEST_TIER_ORDER" :key="tier" class="border border-accent/20 rounded-xs p-2">
              <div class="flex items-center justify-between mb-1">
                <div class="flex items-center space-x-1.5">
                  <span class="text-xs font-bold" :class="tier === 'void' ? 'text-quality-supreme' : 'text-accent'">
                    {{ CHEST_DEFS[tier].name }}
                  </span>
                  <span class="text-[10px] text-muted">{{ CHEST_DEFS[tier].capacity }}格</span>
                </div>
                <Button
                  class="py-0 px-1.5"
                  :class="{ '!bg-accent !text-bg': canCraftChest(tier) }"
                  :disabled="!canCraftChest(tier)"
                  @click="handleCraftChest(tier)"
                >
                  制作
                </Button>
              </div>
              <p class="text-[10px] text-muted mb-1">{{ CHEST_DEFS[tier].description }}</p>
              <div class="flex flex-wrap gap-x-3 gap-y-0.5">
                <span v-for="mat in CHEST_DEFS[tier].craftCost" :key="mat.itemId" class="text-[10px] inline-flex items-center gap-1">
                  {{ getItemName(mat.itemId) }}
                  <CombinedMaterialCount :item-id="mat.itemId" :required="mat.quantity" text-class="text-[10px]" always-show-breakdown />
                </span>
                <span class="text-[10px]" :class="playerStore.money >= CHEST_DEFS[tier].craftMoney ? 'text-muted' : 'text-danger'">
                  {{ CHEST_DEFS[tier].craftMoney }}文
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue'
  import {
    ArrowDown,
    ArrowDown01,
    ArrowDownToLine,
    ArrowUp,
    Building,
    ChevronDown,
    ChevronUp,
    Mountain,
    Leaf,
    Pencil,
    Plus,
    Trash2,
    Unlock,
    LayoutGrid,
    Warehouse,
    X
  } from 'lucide-vue-next'
  import { useHomeStore } from '@/stores/useHomeStore'
  import { useInventoryStore } from '@/stores/useInventoryStore'
  import { usePlayerStore } from '@/stores/usePlayerStore'
  import { useProcessingStore } from '@/stores/useProcessingStore'
  import { useWarehouseStore } from '@/stores/useWarehouseStore'
  import { getCombinedItemCount, removeCombinedItem } from '@/composables/useCombinedInventory'
  import CombinedMaterialCount from '@/components/game/CombinedMaterialCount.vue'
  import type { WarehouseAggregatedEntry } from '@/stores/useWarehouseStore'
  import { getItemById } from '@/data'
  import { GREENHOUSE_UNLOCK_COST, GREENHOUSE_MATERIAL_COST, WAREHOUSE_UNLOCK_MATERIALS, getCaveUpgrade } from '@/data/buildings'
  import { CHEST_DEFS, CHEST_TIER_ORDER } from '@/data/items'
  import { CHEST_FILTER_CATEGORIES, CHEST_CATEGORY_LABELS, getNextChestUpgradeTier } from '@/data/warehouse'
  import type { Quality, ChestTier, VoidChestRole, ItemCategory } from '@/types'
  import { addLog } from '@/composables/useGameLog'
  import Button from '@/components/game/Button.vue'

  const homeStore = useHomeStore()
  const inventoryStore = useInventoryStore()
  const playerStore = usePlayerStore()
  const warehouseStore = useWarehouseStore()
  const processingStore = useProcessingStore()

  const showGreenhouseModal = ref(false)
  const showWarehouseUnlockModal = ref(false)
  const showAddChestModal = ref(false)
  const showChestDepositModal = ref(false)
  const showWarehouseOverview = ref(false)
  const overviewCategory = ref<ItemCategory | 'all'>('all')
  const overviewWithdrawModal = ref<{ itemId: string; quality: Quality; max: number } | null>(null)
  const overviewWithdrawQty = ref(1)
  const openChestId = ref<string | null>(null)
  const renamingChestId = ref<string | null>(null)
  const renameInput = ref('')

  const getItemName = (itemId: string): string => {
    return getItemById(itemId)?.name ?? itemId
  }

  // === 山洞 ===

  const handleChooseCave = (choice: 'mushroom' | 'fruit_bat') => {
    if (homeStore.chooseCave(choice)) {
      const name = choice === 'mushroom' ? '蘑菇洞' : '蝙蝠洞'
      addLog(`选择了${name}，每天会有被动产出。`)
    }
  }

  const currentCaveDef = computed(() => getCaveUpgrade(homeStore.caveLevel) ?? null)

  const caveQualityLabel = computed(() => QUALITY_LABEL[homeStore.caveQuality])

  const caveQualityClass = computed(() => qualityTextClass(homeStore.caveQuality))

  const caveChanceText = computed(() => {
    const def = currentCaveDef.value
    if (!def) return ''
    if (homeStore.caveChoice === 'mushroom') return `${Math.round(def.mushroomChance * 100)}%`
    if (homeStore.caveChoice === 'fruit_bat') return `${Math.round(def.fruitBatChance * 100)}%`
    return ''
  })

  const canUpgradeCave = computed(() => {
    const upgrade = homeStore.nextCaveUpgrade
    if (!upgrade) return false
    if (playerStore.money < upgrade.cost) return false
    return upgrade.materialCost.every(mat => getCombinedItemCount(mat.itemId) >= mat.quantity)
  })

  const handleUpgradeCave = () => {
    if (homeStore.upgradeCave()) {
      addLog(`山洞升级至${homeStore.caveName}！`)
    } else {
      addLog('铜钱或材料不足，无法升级山洞。')
    }
  }

  // === 温室 ===

  const canUnlockGreenhouse = computed(() => {
    if (playerStore.money < GREENHOUSE_UNLOCK_COST) return false
    return GREENHOUSE_MATERIAL_COST.every(mat => getCombinedItemCount(mat.itemId) >= mat.quantity)
  })

  const handleUnlockFromModal = () => {
    if (homeStore.unlockGreenhouse()) {
      addLog('温室已解锁！可在农场面板中切换至温室进行种植。')
      showGreenhouseModal.value = false
    } else {
      addLog('铜钱或材料不足，无法解锁温室。')
    }
  }

  // === 仓库 ===

  const canUnlockWarehouse = computed(() => {
    if (playerStore.money < warehouseStore.UNLOCK_COST) return false
    return WAREHOUSE_UNLOCK_MATERIALS.every(mat => getCombinedItemCount(mat.itemId) >= mat.quantity)
  })

  const handleUnlockWarehouse = () => {
    if (warehouseStore.unlocked) return
    if (!canUnlockWarehouse.value) {
      addLog('铜钱不足，无法解锁仓库。')
      return
    }
    for (const mat of WAREHOUSE_UNLOCK_MATERIALS) {
      removeCombinedItem(mat.itemId, mat.quantity)
    }
    playerStore.spendMoney(warehouseStore.UNLOCK_COST)
    warehouseStore.unlocked = true
    showWarehouseUnlockModal.value = false
    addLog(`仓库已解锁！（-${warehouseStore.UNLOCK_COST}文）`)
  }

  // === 箱子管理 ===

  /** 箱子道具信息弹窗 */
  const chestItemDetail = ref<{ itemId: string; quality: Quality; quantity: number } | null>(null)
  const chestItemDef = computed(() => {
    if (!chestItemDetail.value) return null
    return getItemById(chestItemDetail.value.itemId) ?? null
  })

  const QUALITY_LABEL: Record<Quality, string> = {
    normal: '普通',
    fine: '优良',
    excellent: '精品',
    supreme: '极品'
  }

  const qualityTextClass = (q: Quality, fallback = ''): string => {
    if (q === 'fine') return 'text-quality-fine'
    if (q === 'excellent') return 'text-quality-excellent'
    if (q === 'supreme') return 'text-quality-supreme'
    return fallback
  }

  const VOID_ROLES: { value: VoidChestRole; label: string }[] = [
    { value: 'none', label: '无' },
    { value: 'input', label: '原料箱' },
    { value: 'output', label: '成品箱' }
  ]

  const currentOpenChest = computed(() => {
    if (!openChestId.value) return null
    return warehouseStore.getChest(openChestId.value) ?? null
  })

  const allOverviewEntries = computed(() => warehouseStore.aggregateAllItems())

  const warehouseOverviewKindCount = computed(() => allOverviewEntries.value.length)

  const overviewUsedCategories = computed(() => {
    const set = new Set<ItemCategory>()
    for (const e of allOverviewEntries.value) set.add(e.category)
    return CHEST_FILTER_CATEGORIES.filter(c => set.has(c))
  })

  const filteredOverviewEntries = computed(() => {
    if (overviewCategory.value === 'all') return allOverviewEntries.value
    return warehouseStore.aggregateAllItems(overviewCategory.value)
  })

  const openChestFromOverview = (chestId: string) => {
    showWarehouseOverview.value = false
    openChestId.value = chestId
  }

  const openOverviewWithdraw = (entry: WarehouseAggregatedEntry) => {
    if (entry.totalQuantity <= 1) {
      const n = warehouseStore.withdrawFromAnyChest(entry.itemId, 1, entry.quality)
      if (n > 0) addLog(`取出了${getItemName(entry.itemId)}×${n}。`)
      else addLog('背包已满，无法取出。')
      return
    }
    overviewWithdrawModal.value = { itemId: entry.itemId, quality: entry.quality, max: entry.totalQuantity }
    overviewWithdrawQty.value = entry.totalQuantity
  }

  const confirmOverviewWithdraw = () => {
    if (!overviewWithdrawModal.value) return
    const { itemId, quality, max } = overviewWithdrawModal.value
    const qty = Math.max(1, Math.min(overviewWithdrawQty.value, max))
    const n = warehouseStore.withdrawFromAnyChest(itemId, qty, quality)
    if (n > 0) addLog(`取出了${getItemName(itemId)}×${n}。`)
    else addLog('背包已满，无法取出。')
    overviewWithdrawModal.value = null
  }

  /** 背包中可存入当前箱子的物品 */
  const depositableItems = computed(() => {
    const chestId = openChestId.value
    if (!chestId) return []
    return inventoryStore.items.filter(i => {
      if (i.locked) return false
      return warehouseStore.canDepositItemToChest(chestId, i.itemId)
    })
  })

  /** 背包中可一键存入的重复物品（箱子中已有且符合分类） */
  const duplicateDepositItems = computed(() => {
    if (!currentOpenChest.value || !openChestId.value) return []
    const chestId = openChestId.value
    const chestItemIds = new Set(currentOpenChest.value.items.map(i => i.itemId))
    return inventoryStore.items.filter(i => {
      if (i.locked) return false
      if (!chestItemIds.has(i.itemId)) return false
      return warehouseStore.canDepositItemToChest(chestId, i.itemId)
    })
  })

  const nextChestUpgradeTier = computed((): ChestTier | null => {
    if (!currentOpenChest.value) return null
    return getNextChestUpgradeTier(currentOpenChest.value.tier)
  })

  const canUpgradeOpenChest = computed(() => {
    const next = nextChestUpgradeTier.value
    if (!next) return false
    return processingStore.canCraft(CHEST_DEFS[next].craftCost, CHEST_DEFS[next].craftMoney)
  })

  const isCategoryTakenByOther = (category: ItemCategory): boolean => {
    if (!currentOpenChest.value) return false
    const other = warehouseStore.getChestForCategory(category)
    return !!other && other.id !== currentOpenChest.value.id
  }

  const handleToggleChestCategory = (category: ItemCategory) => {
    if (!openChestId.value) return
    const other = warehouseStore.getChestForCategory(category)
    if (other && other.id !== openChestId.value && !currentOpenChest.value?.filterCategories.includes(category)) {
      addLog(`「${CHEST_CATEGORY_LABELS[category]}」已从「${other.label}」改绑到当前箱子。`)
    }
    warehouseStore.toggleChestCategory(openChestId.value, category)
  }

  const handleAutoDepositAll = () => {
    const warnings = warehouseStore.autoDepositByCategories()
    if (warnings.length === 1 && warnings[0] === '请先在箱子上设置存放分类。') {
      addLog(warnings[0]!)
      return
    }
    if (warnings.length > 0) {
      for (const w of warnings) addLog(w)
    } else {
      addLog('已按分类将背包物品放入对应箱子。')
    }
  }

  const handleUpgradeOpenChest = () => {
    const chestId = openChestId.value
    const next = nextChestUpgradeTier.value
    if (!chestId || !next) return
    if (!canUpgradeOpenChest.value) {
      addLog('材料或铜钱不足，无法扩容箱子。')
      return
    }
    if (!processingStore.consumeCraftMaterials(CHEST_DEFS[next].craftCost, CHEST_DEFS[next].craftMoney)) return
    if (!warehouseStore.upgradeChestTier(chestId)) return
    addLog(`已将箱子扩容为${CHEST_DEFS[next].name}（${CHEST_DEFS[next].capacity}格）！（-${CHEST_DEFS[next].craftMoney}文）`)
  }

  /** 制作箱子 */
  const canCraftChest = (tier: ChestTier): boolean => {
    if (warehouseStore.chests.length >= warehouseStore.maxChests) return false
    return processingStore.canCraft(CHEST_DEFS[tier].craftCost, CHEST_DEFS[tier].craftMoney)
  }

  const handleCraftChest = (tier: ChestTier) => {
    if (!canCraftChest(tier)) {
      addLog('材料或铜钱不足。')
      return
    }
    if (!processingStore.consumeCraftMaterials(CHEST_DEFS[tier].craftCost, CHEST_DEFS[tier].craftMoney)) return
    warehouseStore.addChest(tier)
    addLog(`制作了${CHEST_DEFS[tier].name}！（-${CHEST_DEFS[tier].craftMoney}文）`)
    if (warehouseStore.chests.length >= warehouseStore.maxChests) {
      showAddChestModal.value = false
    }
  }

  /** 拆卸箱子确认 */
  const dismantleChestId = ref<string | null>(null)

  const dismantleChestInfo = computed(() => {
    if (!dismantleChestId.value) return null
    const chest = warehouseStore.getChest(dismantleChestId.value)
    if (!chest) return null
    const def = CHEST_DEFS[chest.tier]
    const refund = def.craftCost
      .map(mat => ({
        itemId: mat.itemId,
        quantity: Math.floor(mat.quantity * 0.5)
      }))
      .filter(m => m.quantity > 0)
    return { label: chest.label, tier: chest.tier, itemCount: chest.items.length, refund }
  })

  const openDismantleConfirm = (chestId: string) => {
    dismantleChestId.value = chestId
  }

  const confirmDismantle = () => {
    const chestId = dismantleChestId.value
    if (!chestId) return
    const chest = warehouseStore.getChest(chestId)
    if (!chest) return
    const info = dismantleChestInfo.value
    if (!info) return
    // 箱内物品返还背包
    for (const item of [...chest.items]) {
      inventoryStore.addItem(item.itemId, item.quantity, item.quality)
    }
    chest.items.length = 0
    // 拆除箱子
    const name = chest.label
    warehouseStore.removeChest(chestId)
    // 返还50%材料
    for (const mat of info.refund) {
      inventoryStore.addItem(mat.itemId, mat.quantity)
    }
    const refundText = info.refund.map(m => `${getItemName(m.itemId)}×${m.quantity}`).join('、')
    addLog(`拆卸了${name}。${refundText ? `返还了${refundText}。` : ''}`)
    dismantleChestId.value = null
    if (openChestId.value === chestId) openChestId.value = null
  }

  /** 重命名箱子 */
  const startRenameChest = (chestId: string, currentLabel: string) => {
    renamingChestId.value = chestId
    renameInput.value = currentLabel
  }

  const confirmRenameChest = () => {
    if (renamingChestId.value) {
      warehouseStore.renameChest(renamingChestId.value, renameInput.value)
    }
    renamingChestId.value = null
  }

  /** 虚空箱角色 */
  const handleSetVoidRole = (chestId: string, role: VoidChestRole) => {
    warehouseStore.setVoidRole(chestId, role)
    const chest = warehouseStore.getChest(chestId)
    if (!chest) return
    if (role === 'none') addLog(`${chest.label}已取消角色设置。`)
    else if (role === 'input') addLog(`${chest.label}已设为原料箱，作坊加工将自动从此箱取材料。`)
    else addLog(`${chest.label}已设为成品箱，作坊产品将自动放入此箱。`)
  }

  // === 箱子数量选择 ===
  interface ChestQtyModalData {
    mode: 'withdraw' | 'deposit'
    chestId: string
    itemId: string
    quality: Quality
    max: number
  }
  const chestQtyModal = ref<ChestQtyModalData | null>(null)
  const chestQty = ref(1)

  const openChestQtyModal = (mode: 'withdraw' | 'deposit', chestId: string, itemId: string, quality: Quality, max: number) => {
    if (max <= 1) {
      if (mode === 'withdraw') executeChestWithdraw(chestId, itemId, quality, 1)
      else executeChestDeposit(chestId, itemId, quality, 1)
      return
    }
    chestQtyModal.value = { mode, chestId, itemId, quality, max }
    chestQty.value = max
  }

  const setChestQty = (val: number) => {
    if (!chestQtyModal.value) return
    chestQty.value = Math.max(1, Math.min(val, chestQtyModal.value.max))
  }
  const addChestQty = (delta: number) => setChestQty(chestQty.value + delta)
  const onChestQtyInput = (e: Event) => {
    const val = parseInt((e.target as HTMLInputElement).value, 10)
    if (!isNaN(val)) setChestQty(val)
  }

  const executeChestWithdraw = (chestId: string, itemId: string, quality: Quality, qty: number) => {
    if (!warehouseStore.withdrawFromChest(chestId, itemId, qty, quality)) {
      addLog('背包已满，无法取出。')
      return
    }
    addLog(`取出了${getItemName(itemId)}×${qty}。`)
  }

  const executeChestDeposit = (chestId: string, itemId: string, quality: Quality, qty: number) => {
    const actualQty = warehouseStore.depositToChest(chestId, itemId, qty, quality)
    if (actualQty <= 0) {
      addLog('箱子已满，无法存入。')
      return
    }
    addLog(`存入了${getItemName(itemId)}×${actualQty}。`)
    if (depositableItems.value.length === 0 || warehouseStore.isChestFull(chestId)) {
      showChestDepositModal.value = false
    }
  }

  const confirmChestQty = () => {
    if (!chestQtyModal.value) return
    const { mode, chestId, itemId, quality } = chestQtyModal.value
    if (mode === 'withdraw') executeChestWithdraw(chestId, itemId, quality, chestQty.value)
    else executeChestDeposit(chestId, itemId, quality, chestQty.value)
    chestQtyModal.value = null
  }

  /** 一键存入重复物品 */
  const handleDepositDuplicates = () => {
    if (!openChestId.value) return
    const chestId = openChestId.value
    const snapshot = duplicateDepositItems.value.map(i => ({ itemId: i.itemId, quality: i.quality, quantity: i.quantity }))
    let totalDeposited = 0
    let kindCount = 0
    for (const item of snapshot) {
      const actual = warehouseStore.depositToChest(chestId, item.itemId, item.quantity, item.quality)
      if (actual > 0) {
        totalDeposited += actual
        kindCount++
      }
    }
    if (totalDeposited > 0) {
      addLog(`一键存入了${kindCount}种物品，共${totalDeposited}个。`)
    } else {
      addLog('箱子已满，无法存入。')
    }
  }
</script>
