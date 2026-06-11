# 钓鱼重量系统 — 产品需求与技术设计

> **状态**：已实现（2026-06-10）  
> **文档日期**：2026-06-10  
> **项目**：桃源谷（`taoyuan`）  
> **参照玩法**：星露谷物语钓鱼体长机制（仅鱼竿主动钓鱼）  
> **实现方案**：方案一 — 扩展现有数据结构

本文档汇总钓鱼重量加强讨论结论。目标是在保留现有品质系统的前提下，为鱼竿钓获增加**重量随机、重量影响售价、图鉴记录最大鱼**，蟹笼/鱼塘等途径行为不变。

---

## 1. 设计目标

| 目标 | 说明 |
|------|------|
| 重量维度 | 鱼竿钓获的鱼除品质外，每条有独立重量（斤，1 位小数） |
| 售价联动 | 重量影响售价，大鱼溢价平滑（平方根缩放，避免暴涨） |
| 图鉴记录 | 图鉴记录每种鱼的历史最大重量，破纪录时提示 |
| 技能联动 | 钓鱼等级抬重量上限；小游戏评级影响当次重量偏移 |
| 最小侵入 | 蟹笼、鱼塘、任务奖励等**不**引入重量，沿用现有逻辑 |
| 存档兼容 | 旧存档无 `weight` / `fishMaxWeights` 时自动降级，不损坏 |

---

## 2. 已确认决策总表

| # | 议题 | 结论 |
|---|------|------|
| 1 | 背包模型 | **轻量方案**：`InventoryItem` 增加可选 `weight`；仅鱼竿钓获写入 |
| 2 | 堆叠规则 | **重量不同不合并**：仅 `itemId + quality + weight` 完全一致才堆叠 |
| 3 | 重量随机 | **D**：钓鱼等级决定有效上限；小游戏评级决定当次偏移量 |
| 4 | 售价公式 | **C**：`基础价 × √(重量/最小重量) × 品质倍率 × 技能加成` |
| 5 | 适用范围 | **A（对齐星露谷）**：仅鱼竿主动钓鱼有重量；蟹笼/鱼塘/任务等不变 |
| 6 | 实现路径 | **方案一**：扩展 `FishDef`、`InventoryItem`、`addItem`、售价与图鉴 store |
| 7 | 重量单位 | **斤**，保留 1 位小数（与 `FishingContestView` 一致） |
| 8 | 双倍钓获 | 同一次钓获的两条鱼**相同重量** |
| 9 | 钓鱼大赛 | 暂不统一，沿用独立 `FISH_TIERS` 逻辑（可后续对齐） |

---

## 3. 星露谷对照（范围依据）

| 来源 | 星露谷 | 桃源谷本 spec |
|------|--------|----------------|
| 鱼竿钓鱼 | 有体长、影响售价、图鉴记最大 | ✅ 实现 |
| 蟹笼 | 计入图鉴，无体长随机，固定品质/基础价 | ❌ 不加重量 |
| 鱼塘收获 | 不计图鉴，固定普通品质 | ❌ 不加重量 |
| 滩涂采集/打怪 | 不计图鉴 | ❌ 不加重量 |

---

## 4. 数据模型

### 4.1 `FishDef` 扩展（`src/types/skill.ts`）

```ts
export interface FishDef {
  // ...现有字段
  /** 最小重量（斤） */
  minWeight: number
  /** 最大重量（斤） */
  maxWeight: number
}
```

**默认区间（按 `difficulty`，可在 `src/data/fish.ts` 逐鱼微调）：**

| difficulty | minWeight（斤） | maxWeight（斤） |
|------------|-----------------|-----------------|
| easy | 0.3 | 1.5 |
| normal | 0.5 | 3.0 |
| hard | 1.0 | 6.0 |
| legendary | 2.0 | 12.0 |

61 种鱼的重量区间定义在 **`src/data/fishWeights.ts`**（含现实参考注释），由 `src/data/fish.ts` 在导出时合并。传说鱼（龙鱼、江龙、深渊巨蟒等）按名称/描述单独设定上限。

### 4.2 `InventoryItem` 扩展（`src/types/item.ts`）

```ts
export interface InventoryItem {
  itemId: string
  quantity: number
  quality: Quality
  /** 仅鱼竿钓获的鱼类有值；无此字段 = 旧逻辑堆叠与定价 */
  weight?: number
  locked?: boolean
  fromGreenhouse?: boolean
}
```

### 4.3 图鉴最大记录（`useAchievementStore`）

```ts
/** 鱼类历史最大重量 { fishId: weight } */
fishMaxWeights: Record<string, number>
```

新增方法：

```ts
/** 记录鱼重，返回是否刷新纪录 */
recordFishWeight(fishId: string, weight: number): boolean
getFishMaxWeight(fishId: string): number | null
```

`serialize` / `deserialize` 需包含 `fishMaxWeights`，缺省为 `{}`。

### 4.4 `addItem` 签名扩展（`useInventoryStore`）

```ts
addItem(
  itemId: string,
  quantity?: number,
  quality?: Quality,
  opts?: { fromGreenhouse?: boolean; weight?: number }
): boolean
```

**堆叠键规则：**

- 若 `opts.weight` 有值：匹配 `itemId + quality + weight`（三者全等才合并）
- 若 `opts.weight` 无值：匹配 `itemId + quality` 且双方 `weight` 均为 `undefined`（与现有一致）

出货箱（`useShopStore.collectToShippingBox`）、仓库（`useWarehouseStore.depositCollectedItem`）需同步传递 `weight`。

---

## 5. 重量随机算法

实现位置建议：`src/composables/rollFishWeight.ts`（纯函数，便于单测）。

### 5.1 输入

| 参数 | 来源 |
|------|------|
| `fish: FishDef` | 上钩鱼种 |
| `rating: MiniGameRating` | 小游戏评级（`poor` 不会进入此流程） |
| `fishingLevel: number` | `skillStore.getSkill('fishing').level` |

### 5.2 公式

```
skillFactor   = min(1, fishingLevel / 10)
effectiveMax  = minWeight + (maxWeight - minWeight) × skillFactor

ratingBias    = { perfect: 0.85, excellent: 0.65, good: 0.40 }
roll          = min(1, ratingBias[rating] + random(0, 0.15))

weight        = minWeight + (effectiveMax - minWeight) × roll
weight        = round(weight, 1)   // 保留 1 位小数
```

### 5.3 行为说明

| 条件 | 效果 |
|------|------|
| 钓鱼 0 级 | `effectiveMax = minWeight`，只能钓到最小重量 |
| 钓鱼 10 级 | `effectiveMax = maxWeight`，理论上可达鱼种上限 |
| 完美收竿 | `roll` 基准 0.85，再加 0~0.15 随机，偏向大鱼 |
| 良好收竿 | 基准 0.40，整体偏小 |
| 双倍钓获 | 只掷一次重量，两条鱼共用 |

### 5.4 边界

- `weight` 钳制在 `[minWeight, maxWeight]`
- 浮点展示统一 `toFixed(1)`，存储为 `number`

---

## 6. 售价计算

实现位置：`useShopStore._basePrice` 扩展。

### 6.1 有重量的鱼（鱼竿钓获）

```
weightMult = √(weight / minWeight)    // minWeight 取自 FishDef
base       = itemDef.sellPrice × weightMult × qualityMultiplier[quality] × skillBonus
final      = floor(base × marketMultiplier × ringBonus × ...)
```

**售价示例（鲫鱼，基础价 15，min 0.3，max 1.5，普通品质，无技能加成）：**

| 重量 | weightMult | 售价 |
|------|------------|------|
| 0.3 斤 | 1.00 | 15 文 |
| 0.8 斤 | 1.63 | 24 文 |
| 1.5 斤 | 2.24 | 34 文 |

最重约为最轻的 **2.24 倍**（同品质），溢价平滑。

### 6.2 无重量的鱼（蟹笼、鱼塘、旧存档物品）

沿用现有公式：`sellPrice × qualityMultiplier × skillBonus`，**不乘** `weightMult`。

### 6.3 API 变更

```ts
// 估价与出售需能传入 weight
calculateSellPrice(itemId, quantity, quality, weight?: number): number
calculateBaseSellPrice(itemId, quantity, quality, weight?: number): number
sellItem(itemId, quantity, quality, weight?: number): number
```

`removeItem` 在指定 `quality` 时，若调用方传入 `weight`，应优先匹配同重量栈。

---

## 7. 钓鱼流程改动

### 7.1 `useFishingStore.completeFishing`

在品质计算完成后、入包前：

1. 调用 `rollFishWeight(currentFish, rating, fishingLevel)`
2. `inventoryStore.addItem(fishId, catchQty, quality, { weight })`
3. `achievementStore.recordFishWeight(fishId, weight)` → 若返回 `true`，结果中带 `isNewRecord: true`
4. 返回值增加 `weight`、`isNewRecord` 字段

**不改动：**

- `startFishing` / 上钩逻辑
- 蟹笼 `collectCrabPot` 的 `addItem` 调用（不传 `weight`）
- 垃圾、宝箱逻辑

### 7.2 其他鱼类来源（保持现状）

| 来源 | 文件 | 行为 |
|------|------|------|
| 蟹笼 | `useFishingStore` 蟹笼收集 | 不传 `weight` |
| 鱼塘 | `useFishPondStore` | 不传 `weight` |
| 农场鱼塘 | `FarmView.vue` | 不传 `weight` |
| 任务/奖励 | 各处 `addItem` | 不传 `weight` |

---

## 8. UI 改动

### 8.1 钓鱼结算弹窗（`FishingView.vue`）

成功钓获时显示：

```
成功钓上了鲫鱼！
1.2斤 · 优良 · 24文
[新纪录！]   ← 仅破纪录时
```

### 8.2 背包 / 出货箱 / 仓库

鱼类物品行增加重量标签：`鲫鱼 ×1 · 1.2斤 · 优良`

出售预览使用带 `weight` 的 `calculateSellPrice`。

### 8.3 图鉴（`AchievementView.vue`，鱼类分类）

已发现鱼类详情增加：

| 字段 | 内容 |
|------|------|
| 重量区间 | `0.3 – 1.5 斤`（来自 `FishDef`） |
| 最大记录 | `1.4 斤` 或 `—`（来自 `fishMaxWeights`） |

列表格可选显示小字：`最大 1.4斤`（已发现时）。

### 8.4 钓鱼页鱼类预览（`FishingView.vue`）

鱼类详情弹窗增加重量区间说明（数据来自 `FishDef`）。

---

## 9. 存档兼容

| 场景 | 处理 |
|------|------|
| 旧存档无 `fishMaxWeights` | `deserialize` 默认 `{}` |
| 旧背包物品无 `weight` | 正常堆叠、按旧公式出售 |
| 新钓获的鱼 | 自动带 `weight` |
| 读档后混合背包 | 同 `itemId+quality` 下，有重/无重分属不同栈，互不影响 |

无需迁移脚本；玩家旧鱼自然消耗后背包逐步过渡。

---

## 10. 文件改动清单

| 文件 | 改动 |
|------|------|
| `src/types/skill.ts` | `FishDef` 增加 `minWeight` / `maxWeight` |
| `src/types/item.ts` | `InventoryItem.weight?` |
| `src/data/fish.ts` | 60 种鱼补充重量区间 |
| `src/composables/rollFishWeight.ts` | **新建** 重量随机纯函数 |
| `src/stores/useFishingStore.ts` | 钓获流程掷重量、入包、返回字段 |
| `src/stores/useInventoryStore.ts` | `addItem` 堆叠键含 `weight`；`removeItem` 可选匹配 |
| `src/stores/useShopStore.ts` | 售价公式含 `weightMult`；出货箱传 `weight` |
| `src/stores/useWarehouseStore.ts` | 存取传 `weight` |
| `src/stores/useAchievementStore.ts` | `fishMaxWeights` + 序列化 |
| `src/views/game/FishingView.vue` | 结算弹窗、鱼类预览 |
| `src/views/game/AchievementView.vue` | 图鉴最大记录 |
| `src/views/game/InventoryView.vue` | 背包显示重量、出售传参 |
| `src/composables/rollFishWeight.test.ts` | **新建** 重量算法单测（可选但推荐） |

**明确不改动（本阶段）：**

- `FishingContestView.vue`（钓鱼大赛独立逻辑）
- 蟹笼 / 鱼塘 store 核心逻辑
- 品质计算、小游戏参数

---

## 11. 测试要点

### 11.1 单元测试（`rollFishWeight`）

- 0 级钓鱼 → 重量恒为 `minWeight`
- 10 级 + perfect → 重量 ≥ 10 级 + good 的 P95（统计抽样）
- 输出始终在 `[minWeight, maxWeight]` 且为 0.1 步进

### 11.2 集成验证

- [ ] 鱼竿钓获：背包显示重量，不同重量不占同一格
- [ ] 同重量同品质：可堆叠
- [ ] 出售：重鱼单价高于轻鱼；无重鱼价格与改动前一致
- [ ] 图鉴：首次钓获点亮；更重鱼刷新最大记录并显示「新纪录」
- [ ] 蟹笼收获：无重量字段，价格不变
- [ ] 旧存档加载：无报错，旧鱼可正常出售
- [ ] 出货箱/仓库：带重鱼进出后重量保留

---

## 12. 后续可选项（不在本 spec 范围）

- 钓鱼大赛与主系统重量区间对齐
- 鱼饵/浮漂影响重量分布（如「大鱼饵」抬高 `ratingBias`）
- 成就：「钓到 10 条 5 斤以上的鱼」
- 烹饪配方是否消耗重量（当前：仅按 `itemId+quality` 匹配，不区分重量）

---

## 13. Spec 自检

| 检查项 | 结果 |
|--------|------|
| 占位符 / TBD | 无 |
| 内部一致性 | 堆叠键、售价、图鉴、存档四者均以 `weight?` 可选字段统一 |
| 范围 | 单次实现可完成，不需拆子项目 |
| 歧义 | 仅鱼竿钓鱼有重量；无 weight 走旧逻辑 — 已写明 |

---

---

## 附录 A：鱼类重量一览

完整数据见 [`src/data/fishWeights.ts`](../../../src/data/fishWeights.ts)。下表为摘要（单位：斤）：

| 鱼名 | ID | 最小 | 最大 | 参考依据 |
|------|-----|------|------|----------|
| 鲫鱼 | crucian | 0.2 | 1.2 | 常见渔获 0.1–0.7kg |
| 鲤鱼 | carp | 1.0 | 8.0 | 溪边个体 1–4kg |
| 龙鱼 | dragonfish | 6.0 | 18.0 | 观赏龙鱼 + 传说设定 |
| 草鱼 | grass_carp | 3.0 | 18.0 | 2–15kg |
| 锦鲤 | koi | 2.0 | 12.0 | 1–10kg |
| 鲟鱼 | sturgeon | 10.0 | 40.0 | 大型鲟科缩放 |
| 中华鲟 | chinese_sturgeon | 15.0 | 50.0 | 百公斤级洄游鱼缩放 |
| 刀鱼 | knife_fish | 0.2 | 0.6 | 刀鲚体细长，半斤内 |
| 娃娃鱼 | giant_salamander | 8.0 | 30.0 | 大鲵 10–30kg+ |
| 深渊巨蟒 | abyss_leviathan | 25.0 | 80.0 | 虚构远古巨兽 |
| 江龙 | river_dragon | 20.0 | 45.0 | 虚构传说巨鱼 |
| 翠龙 | jade_dragon | 15.0 | 35.0 | 虚构灵龙 |
| 溪虾 | creek_shrimp | 0.1 | 0.3 | 溪虾单只几钱 |

其余 48 种见源文件注释。

*文档版本：1.1 | 2026-06-10 实现完成*
