<template>
  <div class="h-full min-h-0 flex flex-col gap-2">
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
              'bg-accent/10 border-accent/30': isMyEntrySelected(entry.key),
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

      <!-- Center: 我提供 (top), 对方提供 (below), break-even, button -->
      <div
        class="flex flex-col min-h-0 border border-muted/20 rounded-xs overflow-hidden shrink-0"
      >
        <div class="flex-1 min-h-0 flex flex-col">
          <!-- Top: 我提供 (list, content at top) -->
          <div
            class="flex-1 min-h-0 flex flex-col border-b border-muted/20 overflow-hidden"
          >
            <div
              class="px-2 py-1 border-b border-muted/10 shrink-0 flex items-center"
            >
              <span class="text-accent text-[10px] font-medium">我提供</span>
            </div>
            <div
              class="flex-1 min-h-0 overflow-y-auto px-2 py-1 flex flex-col items-start gap-1"
            >
              <template v-if="selectedMyList.length">
                <div
                  v-for="(item, idx) in selectedMyList"
                  :key="`my-${item.entry.key}`"
                  class="w-full flex items-center gap-1.5 text-[10px] py-0.5"
                >
                  <span class="truncate min-w-0 flex-1">{{
                    item.entry.name
                  }}</span>
                  <span class="text-muted tabular-nums shrink-0"
                    >×{{ item.quantity }}</span
                  >
                  <div class="flex items-center shrink-0 gap-0 h-6">
                    <button
                      type="button"
                      class="btn text-[10px] w-6 h-6 p-0 min-h-0 min-w-0 flex items-center justify-center"
                      title="减少数量"
                      @click="decrementMyQty(idx)"
                    >
                      －
                    </button>
                    <button
                      type="button"
                      class="btn text-[10px] w-6 h-6 p-0 min-h-0 min-w-0 flex items-center justify-center"
                      title="增加数量"
                      @click="incrementMyQty(idx)"
                    >
                      ＋
                    </button>
                  </div>
                  <span class="text-accent tabular-nums shrink-0"
                    >{{ item.entry.sellPrice * item.quantity }}文</span
                  >
                  <button
                    type="button"
                    class="btn text-[10px] w-6 h-6 p-0 min-h-0 min-w-0 flex items-center justify-center shrink-0"
                    title="移除"
                    @click="removeMyItem(idx)"
                  >
                    ×
                  </button>
                </div>
                <span class="text-[10px] text-muted tabular-nums shrink-0">
                  小计 {{ totalMyValue }} 文
                </span>
              </template>
              <p
                v-else
                class="text-muted/60 text-[10px] py-0.5"
              >
                点击左侧物品（可只买不换）
              </p>
            </div>
          </div>

          <!-- 对方提供 (list, content at top) -->
          <div
            class="flex-1 min-h-0 flex flex-col border-b border-muted/20 overflow-hidden"
          >
            <div
              class="px-2 py-1 border-b border-muted/10 shrink-0 flex items-center"
            >
              <span class="text-accent text-[10px] font-medium">对方提供</span>
            </div>
            <div
              class="flex-1 min-h-0 overflow-y-auto px-2 py-1 flex flex-col items-start gap-1"
            >
              <template v-if="selectedShopList.length">
                <div
                  v-for="(item, idx) in selectedShopList"
                  :key="`shop-${item.entry.key}`"
                  class="w-full flex items-center gap-1.5 text-[10px] py-0.5"
                >
                  <span class="truncate min-w-0 flex-1">{{
                    item.entry.name
                  }}</span>
                  <span class="text-muted tabular-nums shrink-0"
                    >×{{ item.quantity }}</span
                  >
                  <div class="flex items-center shrink-0 gap-0 h-6">
                    <button
                      type="button"
                      class="btn text-[10px] w-6 h-6 p-0 min-h-0 min-w-0 flex items-center justify-center"
                      title="减少数量"
                      @click="decrementShopQty(idx)"
                    >
                      －
                    </button>
                    <button
                      type="button"
                      class="btn text-[10px] w-6 h-6 p-0 min-h-0 min-w-0 flex items-center justify-center"
                      title="增加数量"
                      @click="incrementShopQty(idx)"
                    >
                      ＋
                    </button>
                  </div>
                  <span class="text-accent tabular-nums shrink-0">{{
                    discounted(item.entry.price) * item.quantity
                  }}文</span>
                  <button
                    type="button"
                    class="btn text-[10px] w-6 h-6 p-0 min-h-0 min-w-0 flex items-center justify-center shrink-0"
                    title="移除"
                    @click="removeShopItem(idx)"
                  >
                    ×
                  </button>
                </div>
                <span class="text-[10px] text-muted tabular-nums shrink-0">
                  小计 {{ totalShopCost }} 文
                </span>
              </template>
              <p v-else class="text-muted/60 text-[10px] py-0.5">
                点击右侧物品
              </p>
            </div>
          </div>

          <!-- Break-even -->
          <div
            class="py-1.5 px-2 border-b border-muted/20 shrink-0 flex items-center justify-center min-h-[28px]"
          >
            <template v-if="selectedShopList.length && selectedMyList.length">
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
            <template v-else-if="selectedShopList.length">
              <span class="text-[10px] text-muted tabular-nums"
                >支付 {{ totalShopCost }} 文</span
              >
            </template>
            <span v-else class="text-muted/50 text-[10px]">—</span>
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
              {{ selectedMyList.length ? "交换" : "购买" }}
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
              'bg-accent/10 border-accent/30': isShopEntrySelected(entry.key),
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

type MySelectionItem = { entry: SellEntry; quantity: number };
type ShopSelectionItem = { entry: BuyEntry; quantity: number };

/** My list: each click adds or increments. */
const selectedMyList = ref<MySelectionItem[]>([]);
/** Shop list: each click adds or increments. */
const selectedShopList = ref<ShopSelectionItem[]>([]);

/** Shop/NPC wallet (how much they can pay for your sales). Wire to NPC/shop data when needed. */
const shopMoney = ref(1000);

function isMyEntrySelected(entryKey: string): boolean {
  return selectedMyList.value.some((item) => item.entry.key === entryKey);
}

function isShopEntrySelected(entryKey: string): boolean {
  return selectedShopList.value.some((item) => item.entry.key === entryKey);
}

function addMySelection(entry: SellEntry) {
  const existing = selectedMyList.value.find((item) => item.entry.key === entry.key);
  if (existing) {
    if (existing.quantity < entry.quantity)
      existing.quantity += 1;
  } else {
    selectedMyList.value = [...selectedMyList.value, { entry, quantity: 1 }];
  }
}

function addShopSelection(entry: BuyEntry) {
  const existing = selectedShopList.value.find((item) => item.entry.key === entry.key);
  if (existing) {
    existing.quantity += 1;
  } else {
    selectedShopList.value = [...selectedShopList.value, { entry, quantity: 1 }];
  }
}

function removeMyItem(idx: number) {
  selectedMyList.value = selectedMyList.value.filter((_, i) => i !== idx);
}

function removeShopItem(idx: number) {
  selectedShopList.value = selectedShopList.value.filter((_, i) => i !== idx);
}

function decrementMyQty(idx: number) {
  const list = selectedMyList.value;
  const item = list[idx];
  if (!item) return;
  if (item.quantity <= 1) {
    selectedMyList.value = list.filter((_, i) => i !== idx);
    return;
  }
  selectedMyList.value = list.map((x, i) =>
    i === idx ? { ...x, quantity: x.quantity - 1 } : x
  );
}

function decrementShopQty(idx: number) {
  const list = selectedShopList.value;
  const item = list[idx];
  if (!item) return;
  if (item.quantity <= 1) {
    selectedShopList.value = list.filter((_, i) => i !== idx);
    return;
  }
  selectedShopList.value = list.map((x, i) =>
    i === idx ? { ...x, quantity: x.quantity - 1 } : x
  );
}

function incrementMyQty(idx: number) {
  const list = selectedMyList.value;
  const item = list[idx];
  if (!item) return;
  const max = item.entry.quantity;
  if (item.quantity >= max) return;
  selectedMyList.value = list.map((x, i) =>
    i === idx ? { ...x, quantity: x.quantity + 1 } : x
  );
}

function incrementShopQty(idx: number) {
  const list = selectedShopList.value;
  const item = list[idx];
  if (!item) return;
  selectedShopList.value = list.map((x, i) =>
    i === idx ? { ...x, quantity: x.quantity + 1 } : x
  );
}

const totalMyValue = computed(() =>
  selectedMyList.value.reduce(
    (sum, item) => sum + item.entry.sellPrice * item.quantity,
    0
  )
);

const totalShopCost = computed(() =>
  selectedShopList.value.reduce(
    (sum, item) => sum + discounted(item.entry.price) * item.quantity,
    0
  )
);

const breakEvenDiff = computed(() => {
  if (!selectedShopList.value.length || !selectedMyList.value.length)
    return null;
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
  if (!selectedShopList.value.length) return false;
  const cost = totalShopCost.value;
  if (selectedMyList.value.length) {
    const afterSell = playerStore.money + totalMyValue.value;
    if (afterSell < cost) return false;
    const shopPaysUs = totalMyValue.value - cost;
    if (shopPaysUs > 0 && shopMoney.value < shopPaysUs) return false;
    return true;
  }
  return playerStore.money >= cost;
});

function executeExchange() {
  if (!canExchange.value || !selectedShopList.value.length) return;
  const cost = totalShopCost.value;
  const myValue = totalMyValue.value;
  for (const my of selectedMyList.value) {
    shopStore.sellItem(my.entry.itemId, my.quantity, my.entry.quality);
  }
  shopMoney.value = shopMoney.value - myValue + cost;
  selectedMyList.value = [];
  for (const shop of selectedShopList.value) {
    if (shop.entry.type === "seed") {
      shopStore.buySeed(shop.entry.seedId, shop.quantity);
    } else {
      shopStore.buyItem(shop.entry.itemId, shop.entry.price, shop.quantity);
    }
  }
  selectedShopList.value = [];
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
