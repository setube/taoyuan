<template>
  <div>
    <!-- 标题 -->
    <div class="flex items-center justify-between mb-1">
      <div class="flex items-center space-x-1.5 text-sm text-accent">
        <Package :size="14" />
        <span>背包</span>
      </div>
      <span class="text-xs text-muted">
        {{ inventoryStore.items.length }}/{{ inventoryStore.capacity }}
        <span v-if="inventoryStore.tempItems.length > 0" class="text-danger">+{{ inventoryStore.tempItems.length }}溢出</span>
      </span>
    </div>

    <!-- 页签切换 -->
    <div class="flex space-x-1 mb-3">
      <Button class="flex-1 justify-center" :class="{ '!bg-accent !text-bg': tab === 'items' }" @click="tab = 'items'">物品</Button>
      <Button class="flex-1 justify-center" :class="{ '!bg-accent !text-bg': tab === 'tools' }" @click="tab = 'tools'">装备</Button>
      <Button
        class="flex-1 justify-center"
        :class="{ '!bg-danger !text-text': tab === 'temp', 'text-danger': tab !== 'temp' && inventoryStore.tempItems.length > 0 }"
        @click="tab = 'temp'"
      >
        临时{{ inventoryStore.tempItems.length > 0 ? `(${inventoryStore.tempItems.length})` : '' }}
      </Button>
    </div>

    <!-- 物品页 -->
    <template v-if="tab === 'items'">
      <div v-if="inventoryStore.items.length > 1" class="flex justify-end mb-1.5 space-x-1">
        <Button
          class="py-0 px-1.5"
          :class="{ '!bg-accent !text-bg': isFilterActive }"
          :icon="Filter"
          :icon-size="12"
          @click="openFilterModal"
        >
          筛选
        </Button>
        <Button class="py-0 px-1.5" :icon="ArrowDown01" :icon-size="12" @click="inventoryStore.sortItems()">整理</Button>
      </div>
      <div v-if="filteredItems.length > 0" class="grid grid-cols-3 md:grid-cols-5 gap-1.5">
        <div
          v-for="(item, idx) in filteredItems"
          :key="idx"
          class="border border-accent/20 rounded-xs p-1.5 text-center cursor-pointer hover:bg-accent/5 transition-colors relative"
          @click="activeItemKey = item.itemId + ':' + item.quality + ':' + (item.weight ?? '')"
        >
          <Lock v-if="item.locked" :size="10" class="absolute top-0.5 left-0.5 text-accent/60" />
          <div
            class="text-xs truncate"
            :class="{
              'text-quality-fine': item.quality === 'fine',
              'text-quality-excellent': item.quality === 'excellent',
              'text-quality-supreme': item.quality === 'supreme'
            }"
          >
            {{ getItemById(item.itemId)?.name }}
          </div>
          <div class="text-xs text-muted">×{{ item.quantity }}</div>
        </div>

        <!-- 空格子 -->
        <div
          v-for="i in isFilterActive ? 0 : Math.max(0, inventoryStore.capacity - inventoryStore.items.length)"
          :key="'empty-' + i"
          class="border border-accent/10 rounded-xs p-1.5 text-center text-xs text-muted/30"
        >
          空
        </div>
      </div>
      <div v-else class="flex flex-col items-center justify-center py-4 text-muted">
        <Package :size="24" />
        <p class="text-xs mt-1">背包是空的</p>
      </div>
    </template>

    <!-- 临时背包页 -->
    <template v-if="tab === 'temp'">
      <div v-if="inventoryStore.tempItems.length > 0">
        <div class="flex items-center justify-between mb-1.5">
          <span class="text-[10px] text-muted">背包满时溢出的物品，请及时取回</span>
          <Button v-if="!inventoryStore.isFull" class="py-0 px-1.5" @click="handleMoveAllFromTemp">全部取回</Button>
        </div>
        <div class="grid grid-cols-3 md:grid-cols-5 gap-1.5">
          <div
            v-for="(item, idx) in inventoryStore.tempItems"
            :key="'temp-' + idx"
            class="border border-danger/30 rounded-xs p-1.5 text-center cursor-pointer hover:bg-danger/5 transition-colors"
            @click="activeTempIdx = idx"
          >
            <div
              class="text-xs truncate"
              :class="{
                'text-quality-fine': item.quality === 'fine',
                'text-quality-excellent': item.quality === 'excellent',
                'text-quality-supreme': item.quality === 'supreme'
              }"
            >
              {{ getItemById(item.itemId)?.name }}
            </div>
            <div class="text-xs text-muted">×{{ item.quantity }}</div>
          </div>

          <!-- 空格子 -->
          <div
            v-for="i in Math.max(0, 10 - inventoryStore.tempItems.length)"
            :key="'temp-empty-' + i"
            class="border border-danger/10 rounded-xs p-1.5 text-center text-xs text-muted/30"
          >
            空
          </div>
        </div>
      </div>
      <div v-else class="flex flex-col items-center justify-center py-4 text-muted">
        <Archive :size="24" />
        <p class="text-xs mt-1">临时背包是空的</p>
      </div>
    </template>

    <!-- 装备页 -->
    <template v-if="tab === 'tools'">
      <!-- 方案按钮 -->
      <div class="flex items-center justify-end mb-1.5 space-x-1.5">
        <span v-if="activePresetName" class="text-[10px] text-success truncate">{{ activePresetName }}</span>
        <Button class="py-0 px-1.5" :icon="ArrowDown01" :icon-size="12" @click="inventoryStore.sortEquipment()">整理</Button>
        <Button class="py-0 px-1.5" :icon="BookMarked" :icon-size="12" @click="showPresetModal = true">方案</Button>
      </div>

      <!-- 武器 -->
      <div class="border border-accent/20 rounded-xs p-2 mb-3">
        <p class="text-xs text-muted mb-1">武器</p>
        <div class="flex flex-col space-y-1 max-h-40 overflow-y-auto">
          <div
            v-for="(weapon, idx) in inventoryStore.ownedWeapons"
            :key="idx"
            class="flex items-center justify-between border rounded-xs px-2 py-1 mr-1 cursor-pointer hover:bg-accent/5"
            :class="idx === inventoryStore.equippedWeaponIndex ? 'border-accent/30' : 'border-accent/10'"
            @click="activeWeaponIdx = idx"
          >
            <span class="text-xs" :class="idx === inventoryStore.equippedWeaponIndex ? 'text-accent' : ''">
              {{ getWeaponDisplayName(weapon.defId, weapon.enchantmentId) }}
            </span>
            <span v-if="idx === inventoryStore.equippedWeaponIndex" class="text-xs text-accent">装备中</span>
            <span v-else class="text-xs text-muted">{{ getWeaponSellPrice(weapon.defId, weapon.enchantmentId) }}文</span>
          </div>
        </div>
      </div>

      <!-- 帽子 -->
      <div class="border border-accent/20 rounded-xs p-2 mb-3">
        <p class="text-xs text-muted mb-1">帽子</p>
        <div v-if="inventoryStore.ownedHats.length > 0" class="flex flex-col space-y-1">
          <!-- 槽位 -->
          <div class="border border-accent/10 rounded-xs px-2 py-1 text-center mb-1">
            <p class="text-[10px] text-muted">装备中</p>
            <p class="text-xs" :class="equippedHatName ? 'text-accent' : 'text-muted/40'">
              {{ equippedHatName ?? '空' }}
            </p>
          </div>
          <!-- 拥有的帽子列表 -->
          <div class="max-h-40 overflow-y-auto flex flex-col space-y-1">
            <div
              v-for="(hat, idx) in inventoryStore.ownedHats"
              :key="idx"
              class="flex items-center justify-between border rounded-xs px-2 py-1 mr-1 cursor-pointer hover:bg-accent/5"
              :class="inventoryStore.equippedHatIndex === idx ? 'border-accent/30' : 'border-accent/10'"
              @click="activeHatIdx = idx"
            >
              <div class="min-w-0">
                <span class="text-xs" :class="inventoryStore.equippedHatIndex === idx ? 'text-accent' : ''">
                  {{ getHatById(hat.defId)?.name ?? hat.defId }}
                </span>
                <p class="text-[10px] text-muted truncate">{{ getHatById(hat.defId)?.description }}</p>
              </div>
              <Button
                class="py-0 px-1.5 shrink-0 ml-2"
                :class="inventoryStore.equippedHatIndex === idx ? '!bg-accent !text-bg' : ''"
                @click.stop="handleToggleHat(idx)"
              >
                {{ inventoryStore.equippedHatIndex === idx ? '卸下' : '装备' }}
              </Button>
            </div>
          </div>
        </div>
        <p v-else class="text-xs text-muted/40 text-center py-2">暂无帽子</p>
      </div>

      <!-- 鞋子 -->
      <div class="border border-accent/20 rounded-xs p-2 mb-3">
        <p class="text-xs text-muted mb-1">鞋子</p>
        <div v-if="inventoryStore.ownedShoes.length > 0" class="flex flex-col space-y-1">
          <!-- 槽位 -->
          <div class="border border-accent/10 rounded-xs px-2 py-1 text-center mb-1">
            <p class="text-[10px] text-muted">装备中</p>
            <p class="text-xs" :class="equippedShoeName ? 'text-accent' : 'text-muted/40'">
              {{ equippedShoeName ?? '空' }}
            </p>
          </div>
          <!-- 拥有的鞋子列表 -->
          <div class="max-h-40 overflow-y-auto flex flex-col space-y-1">
            <div
              v-for="(shoe, idx) in inventoryStore.ownedShoes"
              :key="idx"
              class="flex items-center justify-between border rounded-xs px-2 py-1 mr-1 cursor-pointer hover:bg-accent/5"
              :class="inventoryStore.equippedShoeIndex === idx ? 'border-accent/30' : 'border-accent/10'"
              @click="activeShoeIdx = idx"
            >
              <div class="min-w-0">
                <span class="text-xs" :class="inventoryStore.equippedShoeIndex === idx ? 'text-accent' : ''">
                  {{ getShoeById(shoe.defId)?.name ?? shoe.defId }}
                </span>
                <p class="text-[10px] text-muted truncate">{{ getShoeById(shoe.defId)?.description }}</p>
              </div>
              <Button
                class="py-0 px-1.5 shrink-0 ml-2"
                :class="inventoryStore.equippedShoeIndex === idx ? '!bg-accent !text-bg' : ''"
                @click.stop="handleToggleShoe(idx)"
              >
                {{ inventoryStore.equippedShoeIndex === idx ? '卸下' : '装备' }}
              </Button>
            </div>
          </div>
        </div>
        <p v-else class="text-xs text-muted/40 text-center py-2">暂无鞋子</p>
      </div>

      <!-- 戒指 -->
      <div class="border border-accent/20 rounded-xs p-2">
        <p class="text-xs text-muted mb-1">戒指</p>
        <div v-if="inventoryStore.ownedRings.length > 0" class="flex flex-col space-y-1">
          <!-- 槽位 -->
          <div class="flex space-x-1 mb-1">
            <div class="flex-1 border border-accent/10 rounded-xs px-2 py-1 text-center">
              <p class="text-[10px] text-muted">槽位1</p>
              <p class="text-xs" :class="equippedRing1Name ? 'text-accent' : 'text-muted/40'">
                {{ equippedRing1Name ?? '空' }}
              </p>
            </div>
            <div class="flex-1 border border-accent/10 rounded-xs px-2 py-1 text-center">
              <p class="text-[10px] text-muted">槽位2</p>
              <p class="text-xs" :class="equippedRing2Name ? 'text-accent' : 'text-muted/40'">
                {{ equippedRing2Name ?? '空' }}
              </p>
            </div>
          </div>
          <!-- 拥有的戒指列表 -->
          <div class="max-h-40 overflow-y-auto flex flex-col space-y-1">
            <div
              v-for="(ring, idx) in inventoryStore.ownedRings"
              :key="idx"
              class="flex items-center justify-between border rounded-xs px-2 py-1 mr-1 cursor-pointer hover:bg-accent/5"
              :class="isRingEquipped(idx) ? 'border-accent/30' : 'border-accent/10'"
              @click="activeRingIdx = idx"
            >
              <div class="min-w-0">
                <span class="text-xs" :class="isRingEquipped(idx) ? 'text-accent' : ''">
                  {{ getRingById(ring.defId)?.name ?? ring.defId }}
                </span>
                <p class="text-[10px] text-muted truncate">{{ getRingById(ring.defId)?.description }}</p>
              </div>
              <div class="flex space-x-1 shrink-0 ml-2">
                <Button
                  class="py-0 px-1.5"
                  :class="
                    inventoryStore.equippedRingSlot1 === idx
                      ? '!bg-accent !text-bg'
                      : isRingBlockedForSlot(idx, 0)
                        ? 'opacity-30 cursor-not-allowed'
                        : ''
                  "
                  :disabled="isRingBlockedForSlot(idx, 0)"
                  @click.stop="handleToggleRingSlot(idx, 0)"
                >
                  槽1
                </Button>
                <Button
                  class="py-0 px-1.5"
                  :class="
                    inventoryStore.equippedRingSlot2 === idx
                      ? '!bg-accent !text-bg'
                      : isRingBlockedForSlot(idx, 1)
                        ? 'opacity-30 cursor-not-allowed'
                        : ''
                  "
                  :disabled="isRingBlockedForSlot(idx, 1)"
                  @click.stop="handleToggleRingSlot(idx, 1)"
                >
                  槽2
                </Button>
              </div>
            </div>
          </div>
        </div>
        <p v-else class="text-xs text-muted/40 text-center py-2">暂无戒指</p>
      </div>

      <!-- 套装 -->
      <div v-if="inventoryStore.setsWithOwnedPieces.length > 0" class="border border-accent/20 rounded-xs p-2 mt-3">
        <p class="text-xs text-muted mb-1">套装</p>
        <div
          v-for="set in inventoryStore.setsWithOwnedPieces"
          :key="set.id"
          class="border border-accent/10 rounded-xs p-2 mb-1.5 last:mb-0"
        >
          <div class="flex items-center justify-between mb-1 gap-2">
            <span class="text-xs text-accent">{{ set.name }}</span>
            <span class="text-xs text-muted shrink-0">背包 {{ set.owned }}/{{ set.total }} · 已穿 {{ set.equipped }}</span>
          </div>
          <div class="flex items-center justify-between gap-2">
            <p class="text-[10px] text-muted/70 truncate" :title="setSourceHint(set.id)">{{ setSourceHint(set.id) }}</p>
            <div class="flex gap-1 shrink-0">
              <Button class="text-[10px] py-0 px-1.5" @click="handleEquipSet(set.id)">穿戴</Button>
              <Button class="text-[10px] py-0 px-1.5 opacity-80" @click="handleEquipSetWithPreset(set.id)">穿戴并存方案</Button>
            </div>
          </div>
          <template v-for="active in inventoryStore.activeSets.filter(s => s.id === set.id)" :key="active.id + '-b'">
            <div v-for="bonus in active.bonuses" :key="bonus.count" class="text-[10px] mt-1" :class="bonus.active ? 'text-success' : 'text-muted/40'">
              ({{ bonus.count }}件) {{ bonus.description }}
            </div>
          </template>
        </div>
      </div>
    </template>

    <!-- 装备方案弹窗 -->
    <Transition name="panel-fade">
      <div
        v-if="showPresetModal"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        @click.self="showPresetModal = false"
      >
        <div class="game-panel max-w-xs w-full relative">
          <button class="absolute top-2 right-2 text-muted hover:text-text" @click="showPresetModal = false">
            <X :size="14" />
          </button>
          <p class="text-sm text-accent mb-2">装备方案</p>
          <div v-if="inventoryStore.equipmentPresets.length > 0" class="flex flex-col space-y-1.5 mb-3 max-h-60 overflow-y-auto">
            <div
              v-for="preset in inventoryStore.equipmentPresets"
              :key="preset.id"
              class="border rounded-xs p-2"
              :class="activePresetId === preset.id ? 'border-accent/40' : 'border-accent/10'"
            >
              <div class="flex items-center justify-between mb-1">
                <template v-if="renamingPresetId === preset.id">
                  <input
                    v-model="renameValue"
                    class="bg-transparent border border-accent/30 rounded-xs px-1 py-0.5 text-xs text-text w-full mr-2 outline-none"
                    @keyup.enter="confirmRename(preset.id)"
                    @blur="confirmRename(preset.id)"
                  />
                </template>
                <template v-else>
                  <span class="text-xs text-accent truncate">{{ preset.name }}</span>
                </template>
                <span v-if="activePresetId === preset.id" class="text-[10px] text-success shrink-0 ml-1">使用中</span>
              </div>
              <div class="flex space-x-1">
                <Button
                  class="py-0 px-1.5 flex-1 justify-center"
                  :disabled="activePresetId === preset.id"
                  @click="handleApplyPreset(preset.id)"
                >
                  使用
                </Button>
                <Button class="py-0 px-1.5 flex-1 justify-center" @click="handleSaveToPreset(preset.id)">保存</Button>
                <Button class="py-0 px-1.5" @click="startRename(preset)">改名</Button>
                <Button class="py-0 px-1.5 text-danger" :disabled="activePresetId === preset.id" @click="handleDeletePreset(preset.id)">
                  删除
                </Button>
              </div>
            </div>
          </div>
          <div v-else class="flex flex-col items-center justify-center py-6 mb-3">
            <BookMarked :size="24" class="text-muted/30" />
            <p class="text-xs text-muted mt-1">暂无方案</p>
            <p class="text-[10px] text-muted/60 mt-0.5">创建方案后可快速切换装备配置</p>
          </div>
          <Button class="w-full justify-center" :disabled="inventoryStore.equipmentPresets.length >= 5" @click="handleCreatePreset">
            新建方案
          </Button>
        </div>
      </div>
    </Transition>

    <!-- 临时背包物品详情弹窗 -->
    <Transition name="panel-fade">
      <div
        v-if="showFilterModal"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        @click.self="showFilterModal = false"
      >
        <div class="game-panel max-w-xs w-full relative">
          <button class="absolute top-2 right-2 text-muted hover:text-text" @click="showFilterModal = false">
            <X :size="14" />
          </button>
          <p class="text-sm text-accent mb-2">物品筛选</p>
          <p class="text-[10px] text-muted mb-2">选择要显示的分类，不选则显示全部</p>
          <div class="grid grid-cols-3 gap-1.5 mb-3">
            <div
              v-for="cat in FILTER_CATEGORIES"
              :key="cat"
              class="border rounded-xs px-1.5 py-1 text-center text-xs cursor-pointer transition-colors"
              :class="tempFilter.has(cat) ? 'border-accent/50 bg-accent/10 text-accent' : 'border-accent/20 text-muted hover:bg-accent/5'"
              @click="toggleCategory(cat)"
            >
              {{ CATEGORY_NAMES[cat] }}
            </div>
          </div>
          <div class="flex space-x-1.5">
            <Button class="flex-1 justify-center" @click="handleClearFilter">全部显示</Button>
            <Button class="flex-1 justify-center !bg-accent !text-bg" @click="handleSaveFilter">保存</Button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 临时背包物品详情弹窗 -->
    <Transition name="panel-fade">
      <div
        v-if="activeTempItem"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        @click.self="activeTempIdx = null"
      >
        <div class="game-panel max-w-xs w-full relative">
          <button class="absolute top-2 right-2 text-muted hover:text-text" @click="activeTempIdx = null">
            <X :size="14" />
          </button>
          <p
            class="text-sm mb-2"
            :class="{
              'text-quality-fine': activeTempItem.quality === 'fine',
              'text-quality-excellent': activeTempItem.quality === 'excellent',
              'text-quality-supreme': activeTempItem.quality === 'supreme',
              'text-accent': activeTempItem.quality === 'normal'
            }"
          >
            {{ activeTempItemDef?.name }}
            <span class="text-xs text-danger ml-1">（临时）</span>
          </p>
          <div class="border border-accent/10 rounded-xs p-2 mb-2">
            <p class="text-xs text-muted">{{ activeTempItemDef?.description }}</p>
          </div>
          <div class="border border-accent/10 rounded-xs p-2 mb-2">
            <div class="flex items-center justify-between">
              <span class="text-xs text-muted">数量</span>
              <span class="text-xs">×{{ activeTempItem.quantity }}</span>
            </div>
            <div v-if="activeTempItem.quality !== 'normal'" class="flex items-center justify-between mt-0.5">
              <span class="text-xs text-muted">品质</span>
              <span
                class="text-xs"
                :class="{
                  'text-quality-fine': activeTempItem.quality === 'fine',
                  'text-quality-excellent': activeTempItem.quality === 'excellent',
                  'text-quality-supreme': activeTempItem.quality === 'supreme'
                }"
              >
                {{ QUALITY_NAMES[activeTempItem.quality] }}
              </span>
            </div>
          </div>
          <div class="flex flex-col space-y-1.5">
            <Button
              class="w-full justify-center"
              :class="inventoryStore.isFull ? 'opacity-50' : ''"
              :icon="ArrowRight"
              :icon-size="12"
              :disabled="inventoryStore.isFull"
              @click="handleMoveFromTemp"
            >
              放入背包
            </Button>
            <Button class="w-full justify-center text-danger border-danger/40" @click="handleDiscardTemp">丢弃</Button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 物品详情弹窗 -->
    <Transition name="panel-fade">
      <div v-if="activeItem" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" @click.self="activeItemKey = null">
        <div class="game-panel max-w-xs w-full relative">
          <button class="absolute top-2 right-2 text-muted hover:text-text" @click="activeItemKey = null">
            <X :size="14" />
          </button>

          <p
            class="text-sm mb-2"
            :class="{
              'text-quality-fine': activeItem.quality === 'fine',
              'text-quality-excellent': activeItem.quality === 'excellent',
              'text-quality-supreme': activeItem.quality === 'supreme',
              'text-accent': activeItem.quality === 'normal'
            }"
          >
            {{ activeItemDef?.name }}
          </p>

          <div class="border border-accent/10 rounded-xs p-2 mb-2">
            <p class="text-xs text-muted">{{ activeItemDef?.description }}</p>
          </div>

          <div class="border border-accent/10 rounded-xs p-2 mb-2">
            <div class="flex items-center justify-between">
              <span class="text-xs text-muted">数量</span>
              <span class="text-xs">×{{ activeItem.quantity }}</span>
            </div>
            <div v-if="activeItem.quality !== 'normal'" class="flex items-center justify-between mt-0.5">
              <span class="text-xs text-muted">品质</span>
              <span
                class="text-xs"
                :class="{
                  'text-quality-fine': activeItem.quality === 'fine',
                  'text-quality-excellent': activeItem.quality === 'excellent',
                  'text-quality-supreme': activeItem.quality === 'supreme'
                }"
              >
                {{ QUALITY_NAMES[activeItem.quality] }}
              </span>
            </div>
            <div v-if="activeItem.weight != null" class="flex items-center justify-between mt-0.5">
              <span class="text-xs text-muted">重量</span>
              <span class="text-xs text-accent">{{ activeItem.weight }}斤</span>
            </div>
            <div v-if="activeItemDef?.sellPrice" class="flex items-center justify-between mt-0.5">
              <span class="text-xs text-muted">售价</span>
              <span class="text-xs text-accent">{{ activeItemSellPrice }}文</span>
            </div>
            <div v-if="activeItemDef?.staminaRestore" class="flex items-center justify-between mt-0.5">
              <span class="text-xs text-muted">恢复</span>
              <span class="text-xs text-success">
                +{{ activeItemDef.staminaRestore }}体力
                <template v-if="activeItemDef.healthRestore">/ +{{ activeItemDef.healthRestore }}HP</template>
              </span>
            </div>
            <div v-if="activeItemBuff" class="flex items-center justify-between mt-0.5">
              <span class="text-xs text-muted">增益</span>
              <span class="text-xs text-accent">{{ activeItemBuff.description }}</span>
            </div>
            <div class="flex items-center justify-between mt-0.5">
              <span class="text-xs text-muted">来源</span>
              <span class="text-xs text-muted">{{ getItemSource(activeItem.itemId) }}</span>
            </div>
          </div>

          <div class="flex flex-col space-y-1.5">
            <Button
              class="w-full justify-center"
              :icon="activeItem.locked ? LockOpen : Lock"
              :icon-size="12"
              @click="inventoryStore.toggleLock(activeItem.itemId, activeItem.quality)"
            >
              {{ activeItem.locked ? '解锁' : '锁定' }}
            </Button>
            <Button
              v-if="isEdible(activeItem.itemId)"
              class="w-full justify-center"
              :icon="Apple"
              :icon-size="12"
              @click="handleEat(activeItem.itemId, activeItem.quality)"
            >
              食用
            </Button>
            <Button
              v-if="isUsable(activeItem.itemId)"
              class="w-full justify-center"
              :icon="Zap"
              :icon-size="12"
              @click="handleUse(activeItem.itemId, activeItem.quality)"
            >
              使用
            </Button>
            <!-- 丢弃 -->
            <template v-if="!activeItem.locked">
              <div v-if="discardMode" class="flex items-center space-x-1">
                <input
                  v-model.number="discardQty"
                  type="number"
                  :min="1"
                  :max="activeItem.quantity"
                  class="flex-1 bg-bg border border-accent/20 rounded-xs px-1.5 py-0.5 text-xs text-text w-12 text-center"
                />
                <Button class="flex-1 justify-center !bg-danger !text-text" @click="confirmDiscard">确认丢弃</Button>
                <Button class="flex-1 justify-center" @click="cancelDiscard">取消</Button>
              </div>
              <Button
                v-else
                class="w-full justify-center text-danger border-danger/40"
                :icon="Trash2"
                :icon-size="12"
                @click="enterDiscardMode"
              >
                丢弃
              </Button>
            </template>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 武器详情弹窗 -->
    <Transition name="panel-fade">
      <div
        v-if="activeWeaponIdx !== null && activeWeaponDef"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        @click.self="activeWeaponIdx = null"
      >
        <div class="game-panel max-w-xs w-full relative">
          <button class="absolute top-2 right-2 text-muted hover:text-text" @click="activeWeaponIdx = null">
            <X :size="14" />
          </button>
          <p class="text-sm text-accent mb-2">{{ activeWeaponName }}</p>
          <div class="border border-accent/10 rounded-xs p-2 mb-2">
            <p class="text-xs text-muted">{{ activeWeaponDef.description }}</p>
          </div>
          <div class="border border-accent/10 rounded-xs p-2 mb-2">
            <div class="flex items-center justify-between">
              <span class="text-xs text-muted">类型</span>
              <span class="text-xs">{{ WEAPON_TYPE_NAMES[activeWeaponDef.type] }}</span>
            </div>
            <div class="flex items-center justify-between mt-0.5">
              <span class="text-xs text-muted">攻击力</span>
              <span class="text-xs">{{ activeWeaponDef.attack }}</span>
            </div>
            <div class="flex items-center justify-between mt-0.5">
              <span class="text-xs text-muted">暴击率</span>
              <span class="text-xs">{{ Math.round(activeWeaponDef.critRate * 100) }}%</span>
            </div>
            <div v-if="activeWeaponEnchant" class="flex items-center justify-between mt-0.5">
              <span class="text-xs text-muted">附魔</span>
              <span class="text-xs text-accent">{{ activeWeaponEnchant.name }}：{{ activeWeaponEnchant.description }}</span>
            </div>
            <div class="flex items-center justify-between mt-0.5">
              <span class="text-xs text-muted">售价</span>
              <span class="text-xs text-accent">{{ activeWeaponPrice }}文</span>
            </div>
          </div>
          <div class="flex flex-col space-y-1.5">
            <Button v-if="activeWeaponIdx !== inventoryStore.equippedWeaponIndex" class="w-full justify-center" @click="handleEquipWeapon">
              装备
            </Button>
            <Button
              v-if="activeWeaponIdx !== inventoryStore.equippedWeaponIndex && inventoryStore.ownedWeapons.length > 1"
              class="w-full justify-center text-danger border-danger/40"
              @click="handleSellWeapon"
            >
              卖出 · {{ activeWeaponPrice }}文
            </Button>
            <p v-if="activeWeaponIdx === inventoryStore.equippedWeaponIndex" class="text-[10px] text-muted text-center">
              当前装备中，请先切换其他武器再卖出
            </p>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 戒指详情弹窗 -->
    <Transition name="panel-fade">
      <div
        v-if="activeRingIdx !== null && activeRingDef"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        @click.self="activeRingIdx = null"
      >
        <div class="game-panel max-w-xs w-full relative">
          <button class="absolute top-2 right-2 text-muted hover:text-text" @click="activeRingIdx = null">
            <X :size="14" />
          </button>
          <p class="text-sm text-accent mb-2">{{ activeRingDef.name }}</p>
          <div class="border border-accent/10 rounded-xs p-2 mb-2">
            <p class="text-xs text-muted">{{ activeRingDef.description }}</p>
          </div>
          <div class="border border-accent/10 rounded-xs p-2 mb-2">
            <div v-for="eff in activeRingDef.effects" :key="eff.type" class="flex items-center justify-between mt-0.5 first:mt-0">
              <span class="text-xs text-muted">{{ RING_EFFECT_NAMES[eff.type] ?? eff.type }}</span>
              <span class="text-xs text-success">+{{ formatEffectValue(eff) }}</span>
            </div>
            <div class="flex items-center justify-between mt-0.5">
              <span class="text-xs text-muted">售价</span>
              <span class="text-xs text-accent">{{ activeRingDef.sellPrice }}文</span>
            </div>
          </div>
          <div class="flex flex-col space-y-1.5">
            <div class="flex space-x-1.5">
              <Button
                class="flex-1 justify-center"
                :class="activeRingIdx !== null && isRingBlockedForSlot(activeRingIdx, 0) ? 'opacity-30 cursor-not-allowed' : ''"
                :disabled="activeRingIdx !== null && isRingBlockedForSlot(activeRingIdx, 0)"
                @click="handleEquipRingFromPopup(0)"
              >
                {{ inventoryStore.equippedRingSlot1 === activeRingIdx ? '卸下槽1' : '装备槽1' }}
              </Button>
              <Button
                class="flex-1 justify-center"
                :class="activeRingIdx !== null && isRingBlockedForSlot(activeRingIdx, 1) ? 'opacity-30 cursor-not-allowed' : ''"
                :disabled="activeRingIdx !== null && isRingBlockedForSlot(activeRingIdx, 1)"
                @click="handleEquipRingFromPopup(1)"
              >
                {{ inventoryStore.equippedRingSlot2 === activeRingIdx ? '卸下槽2' : '装备槽2' }}
              </Button>
            </div>
            <Button class="w-full justify-center text-danger border-danger/40" @click="handleSellRing">
              卖出 · {{ activeRingDef.sellPrice }}文
            </Button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 帽子详情弹窗 -->
    <Transition name="panel-fade">
      <div
        v-if="activeHatIdx !== null && activeHatDef"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        @click.self="activeHatIdx = null"
      >
        <div class="game-panel max-w-xs w-full relative">
          <button class="absolute top-2 right-2 text-muted hover:text-text" @click="activeHatIdx = null">
            <X :size="14" />
          </button>
          <p class="text-sm text-accent mb-2">{{ activeHatDef.name }}</p>
          <div class="border border-accent/10 rounded-xs p-2 mb-2">
            <p class="text-xs text-muted">{{ activeHatDef.description }}</p>
          </div>
          <div class="border border-accent/10 rounded-xs p-2 mb-2">
            <div v-for="eff in activeHatDef.effects" :key="eff.type" class="flex items-center justify-between mt-0.5 first:mt-0">
              <span class="text-xs text-muted">{{ RING_EFFECT_NAMES[eff.type] ?? eff.type }}</span>
              <span class="text-xs text-success">+{{ formatEffectValue(eff) }}</span>
            </div>
            <div class="flex items-center justify-between mt-0.5">
              <span class="text-xs text-muted">售价</span>
              <span class="text-xs text-accent">{{ activeHatDef.sellPrice }}文</span>
            </div>
          </div>
          <div class="flex flex-col space-y-1.5">
            <Button class="w-full justify-center" @click="handleToggleHatFromPopup">
              {{ inventoryStore.equippedHatIndex === activeHatIdx ? '卸下' : '装备' }}
            </Button>
            <Button class="w-full justify-center text-danger border-danger/40" @click="handleSellHat">
              卖出 · {{ activeHatDef.sellPrice }}文
            </Button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 鞋子详情弹窗 -->
    <Transition name="panel-fade">
      <div
        v-if="activeShoeIdx !== null && activeShoeDef"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        @click.self="activeShoeIdx = null"
      >
        <div class="game-panel max-w-xs w-full relative">
          <button class="absolute top-2 right-2 text-muted hover:text-text" @click="activeShoeIdx = null">
            <X :size="14" />
          </button>
          <p class="text-sm text-accent mb-2">{{ activeShoeDef.name }}</p>
          <div class="border border-accent/10 rounded-xs p-2 mb-2">
            <p class="text-xs text-muted">{{ activeShoeDef.description }}</p>
          </div>
          <div class="border border-accent/10 rounded-xs p-2 mb-2">
            <div v-for="eff in activeShoeDef.effects" :key="eff.type" class="flex items-center justify-between mt-0.5 first:mt-0">
              <span class="text-xs text-muted">{{ RING_EFFECT_NAMES[eff.type] ?? eff.type }}</span>
              <span class="text-xs text-success">+{{ formatEffectValue(eff) }}</span>
            </div>
            <div class="flex items-center justify-between mt-0.5">
              <span class="text-xs text-muted">售价</span>
              <span class="text-xs text-accent">{{ activeShoeDef.sellPrice }}文</span>
            </div>
          </div>
          <div class="flex flex-col space-y-1.5">
            <Button class="w-full justify-center" @click="handleToggleShoeFromPopup">
              {{ inventoryStore.equippedShoeIndex === activeShoeIdx ? '卸下' : '装备' }}
            </Button>
            <Button class="w-full justify-center text-danger border-danger/40" @click="handleSellShoe">
              卖出 · {{ activeShoeDef.sellPrice }}文
            </Button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import { Apple, Archive, ArrowDown01, ArrowRight, BookMarked, Filter, Lock, LockOpen, Package, Trash2, X, Zap } from 'lucide-vue-next'
  import Button from '@/components/game/Button.vue'
  import { useCookingStore } from '@/stores/useCookingStore'
  import { useGameStore } from '@/stores/useGameStore'
  import { useInventoryStore } from '@/stores/useInventoryStore'
  import { useShopStore } from '@/stores/useShopStore'
  import { usePlayerStore } from '@/stores/usePlayerStore'
  import { useSystemStore } from '@/stores/useSystemStore'
  import { useSettingsStore } from '@/stores/useSettingsStore'
  import { useSkillStore } from '@/stores/useSkillStore'
  import { getItemById, getItemSource } from '@/data'
  import { getRecipeById } from '@/data/recipes'
  import { getWeaponById, getWeaponDisplayName, getWeaponSellPrice, getEnchantmentById, WEAPON_TYPE_NAMES } from '@/data/weapons'
  import { getRingById } from '@/data/rings'
  import { getHatById } from '@/data/hats'
  import { getShoeById } from '@/data/shoes'
  import { QUALITY_NAMES } from '@/composables/useFarmActions'
  import { addLog } from '@/composables/useGameLog'
  import { getSetSourceHint } from '@/data/forgeSetSources'
  import { getEquipmentSetById } from '@/data/equipmentSets'
  import type { Quality, RingEffectType, ItemCategory } from '@/types'

  const inventoryStore = useInventoryStore()

  const setSourceHint = (setId: string) => getSetSourceHint(setId)

  const handleEquipSet = (setId: string) => {
    const res = inventoryStore.equipSet(setId)
    const setName = getEquipmentSetById(setId)?.name ?? setId
    if (res.ok) {
      addLog(`已穿戴整套：${setName}`)
    } else if (res.missing.length > 0) {
      addLog(`缺少 ${res.missing.map(m => m.name).join('、')}。${getSetSourceHint(setId)}`)
    } else {
      addLog('无法穿戴该套装。')
    }
  }

  const handleEquipSetWithPreset = (setId: string) => {
    const res = inventoryStore.equipSetWithPreset(setId)
    const setName = getEquipmentSetById(setId)?.name ?? setId
    if (res.ok) {
      addLog(`已穿戴整套：${setName}${res.presetSaved ? '，并保存为装备方案' : ''}`)
    } else if (res.missing.length > 0) {
      addLog(`缺少 ${res.missing.map(m => m.name).join('、')}。${getSetSourceHint(setId)}`)
    }
  }
  const shopStore = useShopStore()
  const playerStore = usePlayerStore()
  const skillStore = useSkillStore()
  const gameStore = useGameStore()
  const cookingStore = useCookingStore()
  const settingsStore = useSettingsStore()

  // === 页签 ===

  const tab = ref<'items' | 'tools' | 'temp'>('items')

  // === 物品筛选 ===

  const FILTER_CATEGORIES: ItemCategory[] = [
    'seed',
    'crop',
    'fruit',
    'fish',
    'animal_product',
    'processed',
    'food',
    'ore',
    'gem',
    'material',
    'machine',
    'sprinkler',
    'fertilizer',
    'bait',
    'tackle',
    'bomb',
    'sapling',
    'gift',
    'fossil',
    'artifact',
    'misc'
  ]

  const CATEGORY_NAMES: Partial<Record<ItemCategory, string>> = {
    seed: '种子',
    crop: '作物',
    fruit: '水果',
    fish: '鱼类',
    animal_product: '畜产',
    processed: '加工品',
    food: '料理',
    ore: '矿石',
    gem: '宝石',
    material: '材料',
    machine: '机器',
    sprinkler: '洒水器',
    fertilizer: '肥料',
    bait: '鱼饵',
    tackle: '钓具',
    bomb: '炸弹',
    sapling: '树苗',
    gift: '礼物',
    fossil: '化石',
    artifact: '文物',
    misc: '杂货'
  }

  const showFilterModal = ref(false)
  const tempFilter = ref<Set<ItemCategory>>(new Set())

  const isFilterActive = computed(() => settingsStore.inventoryFilter.length > 0)

  const filteredItems = computed(() => {
    if (settingsStore.inventoryFilter.length === 0) return inventoryStore.items
    const allowed = new Set(settingsStore.inventoryFilter)
    return inventoryStore.items.filter(item => {
      const def = getItemById(item.itemId)
      return def && allowed.has(def.category)
    })
  })

  const openFilterModal = () => {
    tempFilter.value = new Set(settingsStore.inventoryFilter)
    showFilterModal.value = true
  }

  const toggleCategory = (cat: ItemCategory) => {
    if (tempFilter.value.has(cat)) {
      tempFilter.value.delete(cat)
    } else {
      tempFilter.value.add(cat)
    }
  }

  const handleSaveFilter = () => {
    settingsStore.inventoryFilter = [...tempFilter.value]
    showFilterModal.value = false
  }

  const handleClearFilter = () => {
    tempFilter.value = new Set()
  }

  // === 装备方案 ===

  const showPresetModal = ref(false)
  const renamingPresetId = ref<string | null>(null)
  const renameValue = ref('')

  const activePresetId = computed(() => inventoryStore.activePresetId)

  const activePresetName = computed(() => {
    if (!activePresetId.value) return null
    return inventoryStore.equipmentPresets.find(p => p.id === activePresetId.value)?.name ?? null
  })

  const handleCreatePreset = () => {
    inventoryStore.createEquipmentPreset('方案' + (inventoryStore.equipmentPresets.length + 1))
  }

  const startRename = (preset: { id: string; name: string }) => {
    renamingPresetId.value = preset.id
    renameValue.value = preset.name
  }

  const confirmRename = (id: string) => {
    if (renamingPresetId.value === null) return
    inventoryStore.renameEquipmentPreset(id, renameValue.value)
    renamingPresetId.value = null
  }

  const handleSaveToPreset = (id: string) => {
    if (renamingPresetId.value) confirmRename(renamingPresetId.value)
    inventoryStore.saveCurrentToPreset(id)
    addLog('已保存当前装备到方案。')
  }

  const handleApplyPreset = (id: string) => {
    if (renamingPresetId.value) confirmRename(renamingPresetId.value)
    const result = inventoryStore.applyEquipmentPreset(id)
    addLog(result.message)
  }

  const handleDeletePreset = (id: string) => {
    if (renamingPresetId.value) confirmRename(renamingPresetId.value)
    inventoryStore.deleteEquipmentPreset(id)
  }

  // === 戒指辅助 ===

  const equippedRing1Name = computed(() => {
    const idx = inventoryStore.equippedRingSlot1
    const ring = inventoryStore.ownedRings[idx]
    if (!ring) return null
    return getRingById(ring.defId)?.name ?? null
  })

  const equippedRing2Name = computed(() => {
    const idx = inventoryStore.equippedRingSlot2
    const ring = inventoryStore.ownedRings[idx]
    if (!ring) return null
    return getRingById(ring.defId)?.name ?? null
  })

  const isRingEquipped = (idx: number): boolean => {
    return inventoryStore.equippedRingSlot1 === idx || inventoryStore.equippedRingSlot2 === idx
  }

  /** 检查戒指是否因同defId冲突被另一槽位阻止 */
  const isRingBlockedForSlot = (ringIdx: number, slot: 0 | 1): boolean => {
    const otherSlotIdx = slot === 0 ? inventoryStore.equippedRingSlot2 : inventoryStore.equippedRingSlot1
    if (otherSlotIdx < 0 || otherSlotIdx === ringIdx) return false
    if (otherSlotIdx >= inventoryStore.ownedRings.length) return false
    return inventoryStore.ownedRings[ringIdx]?.defId === inventoryStore.ownedRings[otherSlotIdx]?.defId
  }

  /** 切换戒指槽位（点击高亮按钮 → 卸下；点击非高亮按钮 → 装备/换位） */
  const handleToggleRingSlot = (ringIdx: number, slot: 0 | 1) => {
    const slotRef = slot === 0 ? inventoryStore.equippedRingSlot1 : inventoryStore.equippedRingSlot2
    if (slotRef === ringIdx) {
      inventoryStore.unequipRing(slot)
    } else {
      if (isRingBlockedForSlot(ringIdx, slot)) return
      inventoryStore.equipRing(ringIdx, slot)
    }
  }

  // === 戒指效果显示 ===

  const RING_EFFECT_NAMES: Record<RingEffectType, string> = {
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

  const PERCENTAGE_EFFECTS: Set<RingEffectType> = new Set([
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
    'travel_speed'
  ])

  const formatEffectValue = (eff: { type: RingEffectType; value: number }): string => {
    if (PERCENTAGE_EFFECTS.has(eff.type)) return `${Math.round(eff.value * 100)}%`
    return `${eff.value}`
  }

  // === 武器弹窗 ===

  const activeWeaponIdx = ref<number | null>(null)

  const activeWeaponDef = computed(() => {
    if (activeWeaponIdx.value === null) return null
    const weapon = inventoryStore.ownedWeapons[activeWeaponIdx.value]
    if (!weapon) return null
    return getWeaponById(weapon.defId) ?? null
  })

  const activeWeaponName = computed(() => {
    if (activeWeaponIdx.value === null) return ''
    const weapon = inventoryStore.ownedWeapons[activeWeaponIdx.value]
    if (!weapon) return ''
    return getWeaponDisplayName(weapon.defId, weapon.enchantmentId)
  })

  const activeWeaponEnchant = computed(() => {
    if (activeWeaponIdx.value === null) return null
    const weapon = inventoryStore.ownedWeapons[activeWeaponIdx.value]
    if (!weapon?.enchantmentId) return null
    return getEnchantmentById(weapon.enchantmentId) ?? null
  })

  const activeWeaponPrice = computed(() => {
    if (activeWeaponIdx.value === null) return 0
    const weapon = inventoryStore.ownedWeapons[activeWeaponIdx.value]
    if (!weapon) return 0
    return getWeaponSellPrice(weapon.defId, weapon.enchantmentId)
  })

  const handleEquipWeapon = () => {
    if (activeWeaponIdx.value === null) return
    inventoryStore.equipWeapon(activeWeaponIdx.value)
    activeWeaponIdx.value = null
  }

  const handleSellWeapon = () => {
    if (activeWeaponIdx.value === null) return
    const result = inventoryStore.sellWeapon(activeWeaponIdx.value)
    addLog(result.message)
    activeWeaponIdx.value = null
  }

  // === 戒指弹窗 ===

  const activeRingIdx = ref<number | null>(null)

  const activeRingDef = computed(() => {
    if (activeRingIdx.value === null) return null
    const ring = inventoryStore.ownedRings[activeRingIdx.value]
    if (!ring) return null
    return getRingById(ring.defId) ?? null
  })

  const handleEquipRingFromPopup = (slot: 0 | 1) => {
    if (activeRingIdx.value === null) return
    if (isRingBlockedForSlot(activeRingIdx.value, slot)) return
    const slotRef = slot === 0 ? inventoryStore.equippedRingSlot1 : inventoryStore.equippedRingSlot2
    if (slotRef === activeRingIdx.value) {
      inventoryStore.unequipRing(slot)
    } else {
      inventoryStore.equipRing(activeRingIdx.value, slot)
    }
  }

  const handleSellRing = () => {
    if (activeRingIdx.value === null) return
    const result = inventoryStore.sellRing(activeRingIdx.value)
    addLog(result.message)
    activeRingIdx.value = null
  }

  // === 帽子辅助 ===

  const equippedHatName = computed(() => {
    const idx = inventoryStore.equippedHatIndex
    const hat = inventoryStore.ownedHats[idx]
    if (!hat) return null
    return getHatById(hat.defId)?.name ?? null
  })

  const handleToggleHat = (idx: number) => {
    if (inventoryStore.equippedHatIndex === idx) {
      inventoryStore.unequipHat()
    } else {
      inventoryStore.equipHat(idx)
    }
  }

  // === 帽子弹窗 ===

  const activeHatIdx = ref<number | null>(null)

  const activeHatDef = computed(() => {
    if (activeHatIdx.value === null) return null
    const hat = inventoryStore.ownedHats[activeHatIdx.value]
    if (!hat) return null
    return getHatById(hat.defId) ?? null
  })

  const handleToggleHatFromPopup = () => {
    if (activeHatIdx.value === null) return
    handleToggleHat(activeHatIdx.value)
  }

  const handleSellHat = () => {
    if (activeHatIdx.value === null) return
    const result = inventoryStore.sellHat(activeHatIdx.value)
    addLog(result.message)
    activeHatIdx.value = null
  }

  // === 鞋子辅助 ===

  const equippedShoeName = computed(() => {
    const idx = inventoryStore.equippedShoeIndex
    const shoe = inventoryStore.ownedShoes[idx]
    if (!shoe) return null
    return getShoeById(shoe.defId)?.name ?? null
  })

  const handleToggleShoe = (idx: number) => {
    if (inventoryStore.equippedShoeIndex === idx) {
      inventoryStore.unequipShoe()
    } else {
      inventoryStore.equipShoe(idx)
    }
  }

  // === 鞋子弹窗 ===

  const activeShoeIdx = ref<number | null>(null)

  const activeShoeDef = computed(() => {
    if (activeShoeIdx.value === null) return null
    const shoe = inventoryStore.ownedShoes[activeShoeIdx.value]
    if (!shoe) return null
    return getShoeById(shoe.defId) ?? null
  })

  const handleToggleShoeFromPopup = () => {
    if (activeShoeIdx.value === null) return
    handleToggleShoe(activeShoeIdx.value)
  }

  const handleSellShoe = () => {
    if (activeShoeIdx.value === null) return
    const result = inventoryStore.sellShoe(activeShoeIdx.value)
    addLog(result.message)
    activeShoeIdx.value = null
  }

  // === 临时背包 ===

  const activeTempIdx = ref<number | null>(null)

  const activeTempItem = computed(() => {
    if (activeTempIdx.value === null) return null
    return inventoryStore.tempItems[activeTempIdx.value] ?? null
  })

  const activeTempItemDef = computed(() => {
    if (!activeTempItem.value) return null
    return getItemById(activeTempItem.value.itemId) ?? null
  })

  const handleMoveFromTemp = () => {
    if (activeTempIdx.value === null) return
    const success = inventoryStore.moveFromTemp(activeTempIdx.value)
    if (success) {
      addLog('物品已转移到背包。')
      activeTempIdx.value = null
    } else {
      addLog('背包空间不足，部分物品仍在临时背包中。')
    }
  }

  const handleMoveAllFromTemp = () => {
    const moved = inventoryStore.moveAllFromTemp()
    if (moved > 0) {
      addLog(`已将${moved}项物品从临时背包转移到背包。`)
    }
    if (inventoryStore.tempItems.length > 0) {
      addLog('部分物品因空间不足仍在临时背包中。')
    }
  }

  const handleDiscardTemp = () => {
    if (activeTempIdx.value === null) return
    const item = inventoryStore.tempItems[activeTempIdx.value]
    const name = getItemById(item?.itemId ?? '')?.name ?? ''
    inventoryStore.discardTempItem(activeTempIdx.value)
    addLog(`丢弃了${name}。`)
    activeTempIdx.value = null
  }

  // === 物品弹窗 ===

  const activeItemKey = ref<string | null>(null)

  const activeItem = computed(() => {
    if (!activeItemKey.value) return null
    const [itemId, quality, weightStr] = activeItemKey.value.split(':')
    const weight = weightStr === undefined || weightStr === '' ? undefined : parseFloat(weightStr)
    return (
      inventoryStore.items.find(
        i => i.itemId === itemId && i.quality === quality && i.weight === weight
      ) ?? null
    )
  })

  const activeItemDef = computed(() => {
    if (!activeItem.value) return null
    return getItemById(activeItem.value.itemId) ?? null
  })

  const activeItemSellPrice = computed(() => {
    if (!activeItem.value || !activeItemDef.value?.sellPrice) return 0
    return shopStore.calculateBaseSellPrice(
      activeItem.value.itemId,
      1,
      activeItem.value.quality,
      activeItem.value.weight
    )
  })

  /** 烹饪品的buff描述 */
  const activeItemBuff = computed(() => {
    if (!activeItem.value) return null
    const itemId = activeItem.value.itemId
    if (!itemId.startsWith('food_')) return null
    const recipe = getRecipeById(itemId.slice(5))
    return recipe?.effect.buff ?? null
  })

  const isEdible = (itemId: string): boolean => {
    const def = getItemById(itemId)
    return !!def?.edible && !!def.staminaRestore
  }

  const handleEat = (itemId: string, quality: Quality) => {
    const def = getItemById(itemId)
    if (!def?.edible || !def.staminaRestore) return
    const staminaFull = playerStore.stamina >= playerStore.maxStamina
    const hpFull = playerStore.hp >= playerStore.getMaxHp()
    if (staminaFull && hpFull) {
      addLog('体力和生命值都已满，不需要食用。')
      return
    }

    // 烹饪品走 cookingStore.eat()，以正确应用buff、厨房加成等
    if (itemId.startsWith('food_')) {
      const recipeId = itemId.slice(5) // 去掉 'food_' 前缀
      const result = cookingStore.eat(recipeId, quality)
      if (result.success) {
        addLog(result.message)
      } else {
        addLog(result.message)
      }
      // 物品消耗完则关闭弹窗
      if (!inventoryStore.items.find(i => i.itemId === itemId && i.quality === quality)) {
        activeItemKey.value = null
      }
      return
    }

    if (!inventoryStore.removeItem(itemId, 1, quality, activeItem.value?.weight)) return
    try {
      useSystemStore().onFoodConsumed(itemId, false)
    } catch {
      /* pinia 未就绪 */
    }
    // 炼金师专精：食物恢复+50%
    const alchemistBonus = skillStore.getSkill('foraging').perk10 === 'alchemist' ? 1.5 : 1.0
    const staminaRestore = Math.floor(def.staminaRestore * alchemistBonus)
    playerStore.restoreStamina(staminaRestore)
    let msg = `食用了${def.name}，恢复${staminaRestore}体力`
    if (def.healthRestore) {
      const healthRestore = Math.floor(def.healthRestore * alchemistBonus)
      playerStore.restoreHealth(healthRestore)
      msg += `、${healthRestore}生命值`
    }
    msg += '。'
    addLog(msg)
    // 物品消耗完则关闭弹窗
    if (!inventoryStore.items.find(i => i.itemId === itemId && i.quality === quality)) {
      activeItemKey.value = null
    }
  }

  /** 可使用的特殊物品 */
  const USABLE_ITEMS = new Set(['rain_totem', 'stamina_fruit'])

  const isUsable = (itemId: string): boolean => {
    return USABLE_ITEMS.has(itemId)
  }

  const handleUse = (itemId: string, quality: Quality) => {
    if (itemId === 'rain_totem') {
      if (!inventoryStore.removeItem(itemId, 1, quality, activeItem.value?.weight)) return
      gameStore.setTomorrowWeather('rainy')
      addLog('你使用了雨图腾，明天将会下雨。')
    }
    if (itemId === 'stamina_fruit') {
      if (playerStore.staminaCapLevel >= 4) {
        addLog('体力上限已达到最高，无法再使用仙桃。')
        return
      }
      if (!inventoryStore.removeItem(itemId, 1, quality, activeItem.value?.weight)) return
      playerStore.upgradeMaxStamina()
      addLog(`食用了仙桃，体力上限永久提升至${playerStore.maxStamina}！`)
    }
    // 物品消耗完则关闭弹窗
    if (!inventoryStore.items.find(i => i.itemId === itemId && i.quality === quality)) {
      activeItemKey.value = null
    }
  }

  // === 丢弃物品 ===

  const discardMode = ref(false)
  const discardQty = ref(1)

  watch(activeItemKey, () => {
    discardMode.value = false
  })

  /** 进入丢弃模式 */
  const enterDiscardMode = () => {
    discardMode.value = true
    discardQty.value = 1
  }

  /** 确认丢弃 */
  const confirmDiscard = () => {
    if (!activeItem.value) return
    const { itemId, quality, weight } = activeItem.value
    const name = activeItemDef.value?.name ?? ''
    const qty = Math.min(discardQty.value, activeItem.value.quantity)
    if (qty <= 0) return
    if (!inventoryStore.removeItem(itemId, qty, quality, weight)) return
    addLog(`丢弃了${name}×${qty}。`)
    discardMode.value = false
    // 物品消耗完则关闭弹窗
    if (!inventoryStore.items.find(i => i.itemId === itemId && i.quality === quality)) {
      activeItemKey.value = null
    }
  }

  /** 取消丢弃 */
  const cancelDiscard = () => {
    discardMode.value = false
  }
</script>
