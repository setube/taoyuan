<template>
  <Transition name="panel-fade">
    <div v-if="open" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" @click.self="emit('close')">
      <div class="game-panel max-w-md w-full max-h-[90vh] flex flex-col">
        <div class="flex items-center justify-between mb-2 shrink-0">
          <div class="flex items-center space-x-1.5 text-sm text-accent">
            <ScrollText :size="14" />
            <span>收贮归置</span>
          </div>
          <Button class="py-0 px-1" :icon="X" :icon-size="12" @click="emit('close')" />
        </div>

        <p class="text-xs text-muted mb-2 shrink-0">
          收成入账之道：可设为收获后直接入出货箱，或直接入仓（不占行囊）。未设则照常入背包。
        </p>

        <div class="flex items-center space-x-1 mb-2 shrink-0">
          <div class="relative flex-1">
            <Search :size="12" class="absolute left-2 top-1/2 -translate-y-1/2 text-muted" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索物品名称..."
              class="w-full bg-bg border border-accent/20 rounded-xs pl-7 pr-2 py-1 text-xs text-text"
            />
          </div>
          <Button class="shrink-0" :icon="Filter" :icon-size="12" :class="{ '!bg-accent/20': isFilterActive }" @click="openFilterModal">
            筛选
          </Button>
        </div>

        <div v-if="isFilterActive" class="flex flex-wrap gap-1 mb-2 shrink-0">
          <span
            v-for="cat in activeCategories"
            :key="cat"
            class="text-[10px] px-1.5 py-0.5 rounded-xs border border-accent/30 text-accent bg-accent/10"
          >
            {{ CHEST_CATEGORY_LABELS[cat] }}
          </span>
        </div>

        <div class="flex items-center justify-between text-[10px] text-muted mb-1 shrink-0 px-0.5">
          <span>共 {{ filteredItems.length }} 种物品</span>
          <span>已配置 {{ configuredCount }} 种</span>
        </div>

        <div class="flex-1 overflow-y-auto min-h-0 border border-accent/10 rounded-xs">
          <div
            v-for="item in filteredItems"
            :key="item.id"
            class="flex items-center justify-between border-b border-accent/5 px-2 py-1.5 last:border-b-0"
          >
            <div class="min-w-0 mr-2">
              <p class="text-xs text-text truncate">{{ item.name }}</p>
              <p class="text-[10px] text-muted">{{ CHEST_CATEGORY_LABELS[item.category] ?? item.category }}</p>
            </div>
            <div class="flex shrink-0 space-x-0.5">
              <button
                type="button"
                class="text-[10px] px-1.5 py-0.5 rounded-xs border"
                :class="getRoute(item.id) === 'none' ? 'border-accent text-accent bg-accent/10' : 'border-accent/20 text-muted'"
                @click="settingsStore.setItemCollectRoute(item.id, 'none')"
              >
                背包
              </button>
              <button
                type="button"
                class="text-[10px] px-1.5 py-0.5 rounded-xs border"
                :class="getRoute(item.id) === 'shipping' ? 'border-accent text-accent bg-accent/10' : 'border-accent/20 text-muted'"
                @click="settingsStore.setItemCollectRoute(item.id, 'shipping')"
              >
                出货箱
              </button>
              <button
                type="button"
                class="text-[10px] px-1.5 py-0.5 rounded-xs border"
                :class="getRoute(item.id) === 'warehouse' ? 'border-accent text-accent bg-accent/10' : 'border-accent/20 text-muted'"
                @click="settingsStore.setItemCollectRoute(item.id, 'warehouse')"
              >
                仓库
              </button>
            </div>
          </div>
          <div v-if="filteredItems.length === 0" class="flex flex-col items-center py-8 text-muted">
            <Package :size="28" class="text-muted/30 mb-2" />
            <p class="text-xs">没有匹配的物品</p>
          </div>
        </div>
      </div>
    </div>
  </Transition>

  <!-- 分类筛选弹窗 -->
  <Transition name="panel-fade">
    <div v-if="showFilterModal" class="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4" @click.self="showFilterModal = false">
      <div class="game-panel max-w-xs w-full">
        <div class="flex items-center justify-between mb-2">
          <p class="text-sm text-accent">分类筛选</p>
          <Button class="py-0 px-1" :icon="X" :icon-size="12" @click="showFilterModal = false" />
        </div>
        <div class="flex flex-wrap gap-1 mb-3 max-h-48 overflow-y-auto">
          <button
            v-for="cat in CHEST_FILTER_CATEGORIES"
            :key="cat"
            type="button"
            class="text-[10px] px-1.5 py-0.5 rounded-xs border"
            :class="tempFilter.has(cat) ? 'border-accent text-accent bg-accent/10' : 'border-accent/20 text-muted'"
            @click="toggleCategory(cat)"
          >
            {{ CHEST_CATEGORY_LABELS[cat] }}
          </button>
        </div>
        <div class="flex space-x-1">
          <Button class="flex-1 justify-center" @click="handleClearFilter">清空</Button>
          <Button class="flex-1 justify-center !bg-accent !text-bg" @click="handleSaveFilter">确定</Button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { Filter, Package, Search, ScrollText, X } from 'lucide-vue-next'
  import Button from '@/components/game/Button.vue'
  import { ITEMS } from '@/data/items'
  import { CHEST_FILTER_CATEGORIES, CHEST_CATEGORY_LABELS } from '@/data/warehouse'
  import { useSettingsStore } from '@/stores/useSettingsStore'
  import type { ItemCategory } from '@/types'

  defineProps<{ open: boolean }>()
  const emit = defineEmits<{ close: [] }>()

  const settingsStore = useSettingsStore()
  const searchQuery = ref('')
  const categoryFilter = ref<ItemCategory[]>([])
  const showFilterModal = ref(false)
  const tempFilter = ref<Set<ItemCategory>>(new Set())

  const isFilterActive = computed(() => categoryFilter.value.length > 0)
  const activeCategories = computed(() => categoryFilter.value)

  const filteredItems = computed(() => {
    const q = searchQuery.value.trim().toLowerCase()
    const allowed = categoryFilter.value.length > 0 ? new Set(categoryFilter.value) : null
    return ITEMS.filter(item => {
      if (allowed && !allowed.has(item.category)) return false
      if (q && !item.name.toLowerCase().includes(q) && !item.id.toLowerCase().includes(q)) return false
      return true
    })
  })

  const configuredCount = computed(() => Object.keys(settingsStore.itemCollectRoutes).length)

  const getRoute = (itemId: string) => settingsStore.getItemCollectRoute(itemId)

  const openFilterModal = () => {
    tempFilter.value = new Set(categoryFilter.value)
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
    categoryFilter.value = [...tempFilter.value]
    showFilterModal.value = false
  }

  const handleClearFilter = () => {
    tempFilter.value = new Set()
  }
</script>
