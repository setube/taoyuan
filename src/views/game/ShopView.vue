<template>
  <div
    class="rounded-xs bg-panel border border-muted/30 p-2 h-full min-h-0 flex flex-col"
  >
    <h3 class="text-accent text-[10px] font-medium mb-2 shrink-0">
      交易 · 以物易物
    </h3>

    <div
      class="grid grid-cols-[1fr_minmax(180px,1fr)_1fr] gap-2 flex-1 min-h-0"
      style="grid-template-rows: 1fr"
    >
      <!-- Left: my inventory -->
      <div
        class="flex flex-col min-h-0 border border-muted/20 rounded-xs overflow-hidden"
      >
        <div
          class="flex items-center justify-between px-2 py-1 border-b border-muted/20 shrink-0 gap-2"
        >
          <p class="text-accent text-[10px] font-medium">我的物品</p>
          <span class="text-[10px] text-muted tabular-nums shrink-0"
            >{{ playerStore.money }}文</span
          >
        </div>
        <div class="flex-1 min-h-0 overflow-y-auto">
          <div
            v-for="entry in sellList"
            :key="entry.key"
            class="grid grid-cols-[1fr_36px_60px] gap-1 items-center text-[10px] py-1 px-2 border-b border-muted/10 cursor-pointer hover:bg-accent/5 tabular-nums"
            :class="{
              'bg-accent/10 border-accent/30':
                selectedMy?.entry.key === entry.key,
            }"
            @click="addMySelection(entry)"
          >
            <span class="truncate">{{ entry.name }}</span>
            <span class="text-right">×{{ entry.quantity }}</span>
            <span class="text-accent text-right">{{ entry.sellPrice }}文</span>
          </div>
          <p
            v-if="sellList.length === 0"
            class="text-muted/60 text-[10px] py-2 px-2"
          >
            暂无
          </p>
        </div>
      </div>

      <!-- Center: selected shop (top), break-even (middle), selected mine (bottom) -->
      <div
        class="flex flex-col min-h-0 border border-muted/20 rounded-xs overflow-hidden shrink-0"
      >
        <div class="flex-1 min-h-0 flex flex-col">
          <!-- Top: 对方提供 (single horizontal row) -->
          <div
            class="border-b border-muted/20 px-2 py-1.5 shrink-0 flex items-center gap-1.5 min-h-[28px]"
          >
            <span class="text-accent text-[10px] font-medium shrink-0"
              >对方提供</span
            >
            <template v-if="selectedShop">
              <span class="text-[10px] truncate min-w-0">{{
                selectedShop.entry.name
              }}</span>
              <span class="text-[10px] text-muted tabular-nums shrink-0"
                >×{{ selectedShop.quantity }}</span
              >
              <div class="flex items-center shrink-0 gap-0 h-7">
                <button
                  type="button"
                  class="btn text-[10px] w-7 h-7 p-0 min-h-0 min-w-0 flex items-center justify-center"
                  title="减少数量"
                  @click="decrementShopQty"
                >
                  －
                </button>
                <button
                  type="button"
                  class="btn text-[10px] w-7 h-7 p-0 min-h-0 min-w-0 flex items-center justify-center"
                  title="增加数量"
                  @click="incrementShopQty"
                >
                  ＋
                </button>
              </div>
              <span
                class="text-[10px] text-accent tabular-nums shrink-0 ml-auto"
                >{{ totalShopCost }}文</span
              >
            </template>
            <p v-else class="text-muted/60 text-[10px]">点击右侧物品</p>
          </div>

          <!-- Middle: break-even -->
          <div
            class="py-1.5 px-2 border-b border-muted/20 shrink-0 flex items-center justify-center min-h-[28px]"
          >
            <template v-if="selectedShop && selectedMy">
              <span
                class="text-[10px] font-medium tabular-nums"
                :class="
                  breakEvenDiff === 0
                    ? 'text-muted'
                    : breakEvenDiff > 0
                      ? 'text-success'
                      : 'text-danger'
                "
              >
                {{ breakEvenLabel }}
              </span>
            </template>
            <template v-else-if="selectedShop">
              <span class="text-[10px] text-muted tabular-nums"
                >支付 {{ totalShopCost }} 文</span
              >
            </template>
            <span v-else class="text-muted/50 text-[10px]">—</span>
          </div>

          <!-- Bottom: 我提供 (single horizontal row) -->
          <div
            class="border-b border-muted/20 px-2 py-1.5 flex-1 min-h-[28px] flex items-center gap-1.5"
          >
            <span class="text-accent text-[10px] font-medium shrink-0"
              >我提供</span
            >
            <template v-if="selectedMy">
              <span class="text-[10px] truncate min-w-0">{{
                selectedMy.entry.name
              }}</span>
              <span class="text-[10px] text-muted tabular-nums shrink-0"
                >×{{ selectedMy.quantity }}</span
              >
              <div class="flex items-center shrink-0 gap-0 h-7">
                <button
                  type="button"
                  class="btn text-[10px] w-7 h-7 p-0 min-h-0 min-w-0 flex items-center justify-center"
                  title="减少数量"
                  @click="decrementMyQty"
                >
                  －
                </button>
                <button
                  type="button"
                  class="btn text-[10px] w-7 h-7 p-0 min-h-0 min-w-0 flex items-center justify-center"
                  title="增加数量"
                  @click="incrementMyQty"
                >
                  ＋
                </button>
              </div>
              <span
                class="text-[10px] text-accent tabular-nums shrink-0 ml-auto"
                >{{ totalMyValue }}文</span
              >
            </template>
            <p v-else class="text-muted/60 text-[10px]">
              点击左侧物品（可只买不换）
            </p>
          </div>

          <!-- 交换 / 购买 button -->
          <div class="p-2 shrink-0">
            <button
              type="button"
              class="btn text-[10px] w-full py-1.5 h-7"
              :class="canExchange ? 'bg-accent text-bg' : ''"
              :disabled="!canExchange"
              @click="executeExchange"
            >
              {{ selectedMy ? "交换" : "购买" }}
            </button>
          </div>
        </div>
      </div>

      <!-- Right: shop inventory -->
      <div
        class="flex flex-col min-h-0 border border-muted/20 rounded-xs overflow-hidden"
      >
        <div
          class="flex items-center justify-between px-2 py-1 border-b border-muted/20 shrink-0 gap-2"
        >
          <p class="text-accent text-[10px] font-medium">商店/摊贩</p>
          <span class="text-[10px] text-muted tabular-nums shrink-0"
            >{{ shopMoney }}文</span
          >
        </div>
        <div class="flex-1 min-h-0 overflow-y-auto">
          <div
            v-for="entry in buyList"
            :key="entry.key"
            class="grid grid-cols-[1fr_60px] gap-1 items-center text-[10px] py-1 px-2 border-b border-muted/10 cursor-pointer hover:bg-accent/5 tabular-nums"
            :class="{
              'bg-accent/10 border-accent/30':
                selectedShop?.entry.key === entry.key,
            }"
            @click="addShopSelection(entry)"
          >
            <span class="truncate">{{ entry.name }}</span>
            <span class="text-accent text-right"
              >{{ discounted(entry.price) }}文</span
            >
          </div>
        </div>
      </div>
    </div>

    <SimpleShopConfirmModal
      :show="!!confirmState"
      :type="confirmState?.type ?? 'buy'"
      :item-name="confirmState?.itemName ?? ''"
      :price="confirmState?.price ?? 0"
      @confirm="handleConfirm"
      @cancel="confirmState = null"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import {
  useShopStore,
  usePlayerStore,
  useInventoryStore,
  useWalletStore,
} from "@/stores";
import { getItemById } from "@/data";
import SimpleShopConfirmModal from "@/components/game/SimpleShopConfirmModal.vue";
import type { Quality } from "@/types";

const shopStore = useShopStore();
const playerStore = usePlayerStore();
const inventoryStore = useInventoryStore();
const walletStore = useWalletStore();

function discounted(price: number): number {
  const w = walletStore.getShopDiscount();
  const r = inventoryStore.getRingEffectValue("shop_discount");
  return Math.floor(price * (1 - w) * (1 - r));
}

const buyList = computed(() => {
  const seeds = shopStore.availableSeeds.map((s) => ({
    key: `seed_${s.seedId}`,
    type: "seed" as const,
    seedId: s.seedId,
    name: `${s.cropName}种子`,
    price: s.price,
  }));
  const items = shopStore.apothecaryItems.map((i) => ({
    key: `item_${i.itemId}`,
    type: "item" as const,
    itemId: i.itemId,
    name: i.name,
    price: i.price,
  }));
  return [...seeds, ...items];
});

type SellEntry = {
  key: string;
  itemId: string;
  quality: Quality;
  name: string;
  quantity: number;
  sellPrice: number;
};

const sellList = computed<SellEntry[]>(() =>
  inventoryStore.items.map((i) => {
    const def = getItemById(i.itemId);
    const sellPrice = shopStore.calculateSellPrice(i.itemId, 1, i.quality);
    return {
      key: `${i.itemId}_${i.quality}`,
      itemId: i.itemId,
      quality: i.quality,
      name: def?.name ?? i.itemId,
      quantity: i.quantity,
      sellPrice,
    };
  }),
);

type BuyEntry = (typeof buyList.value)[number];

/** My selection: entry + quantity (multiple clicks add). */
const selectedMy = ref<{ entry: SellEntry; quantity: number } | null>(null);
/** Shop selection: entry + quantity (multiple clicks add). */
const selectedShop = ref<{ entry: BuyEntry; quantity: number } | null>(null);

/** Shop/NPC wallet (how much they can pay for your sales). Wire to NPC/shop data when needed. */
const shopMoney = ref(1000);

function addMySelection(entry: SellEntry) {
  if (selectedMy.value?.entry.key === entry.key) {
    const max = entry.quantity;
    if (selectedMy.value.quantity < max)
      selectedMy.value = {
        ...selectedMy.value,
        quantity: selectedMy.value.quantity + 1,
      };
  } else {
    selectedMy.value = { entry, quantity: 1 };
  }
}

function addShopSelection(entry: BuyEntry) {
  if (selectedShop.value?.entry.key === entry.key) {
    selectedShop.value = {
      ...selectedShop.value,
      quantity: selectedShop.value.quantity + 1,
    };
  } else {
    selectedShop.value = { entry, quantity: 1 };
  }
}

function decrementMyQty() {
  if (!selectedMy.value) return;
  if (selectedMy.value.quantity <= 1) {
    selectedMy.value = null;
    return;
  }
  selectedMy.value = {
    ...selectedMy.value,
    quantity: selectedMy.value.quantity - 1,
  };
}

function decrementShopQty() {
  if (!selectedShop.value) return;
  if (selectedShop.value.quantity <= 1) {
    selectedShop.value = null;
    return;
  }
  selectedShop.value = {
    ...selectedShop.value,
    quantity: selectedShop.value.quantity - 1,
  };
}

function incrementMyQty() {
  if (!selectedMy.value) return;
  const max = selectedMy.value.entry.quantity;
  if (selectedMy.value.quantity >= max) return;
  selectedMy.value = {
    ...selectedMy.value,
    quantity: selectedMy.value.quantity + 1,
  };
}

function incrementShopQty() {
  if (!selectedShop.value) return;
  selectedShop.value = {
    ...selectedShop.value,
    quantity: selectedShop.value.quantity + 1,
  };
}

const totalMyValue = computed(() => {
  if (!selectedMy.value) return 0;
  return selectedMy.value.entry.sellPrice * selectedMy.value.quantity;
});

const totalShopCost = computed(() => {
  if (!selectedShop.value) return 0;
  return (
    discounted(selectedShop.value.entry.price) * selectedShop.value.quantity
  );
});

const breakEvenDiff = computed(() => {
  if (!selectedShop.value || !selectedMy.value) return null;
  return totalMyValue.value - totalShopCost.value;
});

const breakEvenLabel = computed(() => {
  const d = breakEvenDiff.value;
  if (d === null) return "";
  if (d === 0) return "持平";
  if (d > 0) return `赚 ${d} 文`;
  return `亏 ${-d} 文`;
});

const canExchange = computed(() => {
  if (!selectedShop.value || selectedShop.value.quantity < 1) return false;
  const cost = totalShopCost.value;
  if (selectedMy.value) {
    const afterSell = playerStore.money + totalMyValue.value;
    if (afterSell < cost) return false;
    const shopPaysUs = totalMyValue.value - cost;
    if (shopPaysUs > 0 && shopMoney.value < shopPaysUs) return false;
    return true;
  }
  return playerStore.money >= cost;
});

function executeExchange() {
  if (!canExchange.value || !selectedShop.value) return;
  const shop = selectedShop.value;
  const shopQty = shop.quantity;
  if (selectedMy.value) {
    const my = selectedMy.value;
    shopStore.sellItem(my.entry.itemId, my.quantity, my.entry.quality);
    shopMoney.value =
      shopMoney.value - totalMyValue.value + totalShopCost.value;
    selectedMy.value = null;
  } else {
    shopMoney.value = shopMoney.value + totalShopCost.value;
  }
  if (shop.entry.type === "seed") {
    shopStore.buySeed(shop.entry.seedId, shopQty);
  } else {
    shopStore.buyItem(shop.entry.itemId, shop.entry.price, shopQty);
  }
  selectedShop.value = null;
}

type ConfirmState =
  | { type: "buy"; itemName: string; price: number; onConfirm: () => void }
  | {
      type: "sell";
      itemName: string;
      price: number;
      itemId: string;
      quality: Quality;
    };

const confirmState = ref<ConfirmState | null>(null);

function handleConfirm() {
  if (!confirmState.value) return;
  if (confirmState.value.type === "buy") {
    confirmState.value.onConfirm();
  } else {
    shopStore.sellItem(
      confirmState.value.itemId,
      1,
      confirmState.value.quality,
    );
  }
  confirmState.value = null;
}
</script>
