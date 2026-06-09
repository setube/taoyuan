# 酒肆经营 + 烹饪技能 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 按已定稿规格实现烹饪技能（第 6 技能 + 专精树）、酒坊 1～3 批量、前厅酒肆 5 级扩建与经营（菜单/定价/鲜果产季/日结自动/亲自值班/员工/NPC 宴席），UI 与现有桃源乡面板统一。

**Architecture:** 分 **4 个可独立合并的阶段** 交付——① 烹饪技能 ② 酒坊批量 ③ 酒肆数据层+日结 ④ 酒肆 UI+亲自营业。核心状态在 `useTavernStore` + `data/tavern.ts`；定价/产季/来客公式纯函数便于 Vitest；`useEndDay` 钩子演算自动营业；亲自值班在 `TavernView` 分步状态机。旧存档：`deserialize` 缺省未扩建、`cooking` 技能补全并一次性迁移 `totalRecipesCooked×5` 经验。

**Tech Stack:** Vue 3 + Pinia + TypeScript + Vitest + Tailwind（`game-panel` / `text-accent` 体系）

**Spec:** [../specs/2026-06-04-tavern-design.md](../specs/2026-06-04-tavern-design.md)  
**Compat:** [../../../AGENT.md](../../../AGENT.md) §2  
**UI:** Spec §15 + [../../../README.md](../../../README.md) §设计规范

---

## File Map（创建 / 修改一览）

| 职责 | 创建 | 修改 |
|------|------|------|
| 烹饪技能类型 | — | `src/types/skill.ts` |
| 技能 store | — | `src/stores/useSkillStore.ts` |
| 烹饪加经验/专精 | — | `src/stores/useCookingStore.ts` |
| 专精弹窗/UI | — | `PerkSelectDialog.vue`, `SkillView.vue`, `CharInfoView.vue` |
| 商圈市厨售价 | — | `src/stores/useShopStore.ts` |
| 膳修 buff | — | `useCookingStore.eat`, `usePlayerStore` buff 时段 |
| 酒坊批量 | — | `src/data/processing.ts`, `processing.furnace.test.ts` 旁新建 `processing.wine.test.ts`, `useProcessingStore.ts`, `ProcessingView.vue` |
| 酒肆数据 | `src/data/tavern.ts`, `src/data/npcTavernPrefs.ts`, `src/data/fruitSeason.ts` | `src/data/index.ts` |
| 酒肆 store | `src/stores/useTavernStore.ts` | `src/stores/useSaveStore.ts` |
| 日结 | `src/composables/tavernSimulate.ts` | `src/composables/useEndDay.ts` |
| 温室标记 | — | `src/stores/useFarmStore.ts`（收获写 `fromGreenhouse`） |
| UI | `src/views/game/TavernView.vue` | `CottageView.vue`, `router/index.ts`, `useNavigation.ts` |
| 告示/文档 | — | `gameAnnouncements.ts`, `README.md`, `AGENT.md` §6 |
| 测试 | `src/data/tavern.test.ts`, `src/stores/useTavernStore.test.ts`, `src/stores/useCookingStore.skill.test.ts`, `src/composables/tavernSimulate.test.ts` | — |

---

## Phase 1 — 烹饪技能（可先上线）

### Task 1: 扩展技能类型与 store

**Files:**
- Modify: `src/types/skill.ts`
- Modify: `src/stores/useSkillStore.ts`
- Test: `src/stores/useCookingStore.skill.test.ts`（先写测试文件骨架）

- [ ] **Step 1: 写失败测试 — cooking 技能存在且可升级**

```ts
// src/stores/useCookingStore.skill.test.ts
import { beforeEach, describe, expect, it } from 'vitest'
import { createTestPinia } from '@/test/pinia'
import { useSkillStore } from './useSkillStore'

describe('cooking 技能', () => {
  beforeEach(() => createTestPinia())

  it('skills 数组包含 cooking', () => {
    const skillStore = useSkillStore()
    expect(skillStore.skills.some(s => s.type === 'cooking')).toBe(true)
  })

  it('addExp cooking 可升级', () => {
    const skillStore = useSkillStore()
    for (let i = 0; i < 25; i++) skillStore.addExp('cooking', 100)
    expect(skillStore.getSkill('cooking').level).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: 运行测试确认 FAIL**

```bash
cd taoyuan && pnpm test src/stores/useCookingStore.skill.test.ts
```

Expected: FAIL — `cooking` 不在 `SkillType` 或 skills 数组

- [ ] **Step 3: 实现类型与 store**

`src/types/skill.ts` 追加：

```ts
export type SkillType = 'farming' | 'foraging' | 'fishing' | 'mining' | 'combat' | 'cooking'

// SkillPerk5 追加：
| 'prep_cook' | 'vendor_chef' // 烹饪

// SkillPerk10 追加：
| 'double_batch' | 'gourmet_craft' // prep_cook
| 'buff_chef' | 'tavern_master'   // vendor_chef
```

`useSkillStore.ts`：
- `skills` 初始数组 `push(createSkill('cooking'))`
- `deserialize`：若存档 skills 无 `cooking`，`push({ type:'cooking', exp:0, level:0, perk5:null, perk10:null })`
- 新增 `migrateCookingExpFromRecipes(totalRecipesCooked: number, migrated: boolean)`：若 `!migrated && totalRecipesCooked > 0`，`addExp('cooking', totalRecipesCooked * 5)` 并返回 `true`

- [ ] **Step 4: 运行测试 PASS**

```bash
pnpm test src/stores/useCookingStore.skill.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/types/skill.ts src/stores/useSkillStore.ts src/stores/useCookingStore.skill.test.ts
git commit -m "feat(skill): add cooking skill type and store entry"
```

---

### Task 2: 专精 UI（PerkSelectDialog + SkillView + CharInfoView）

**Files:**
- Modify: `src/components/game/PerkSelectDialog.vue`
- Modify: `src/views/game/SkillView.vue`
- Modify: `src/views/game/CharInfoView.vue`

- [ ] **Step 1: PerkSelectDialog 增加 cooking 分支**

```ts
// PERK5_OPTIONS.cooking
{ id: 'prep_cook', name: '备料手', description: '烹饪时20%概率节省一种主料' },
{ id: 'vendor_chef', name: '市厨', description: '食物售价+15%（当老板的选这个）' },

// PERK10_BRANCHES.cooking
prep_cook: [
  { id: 'double_batch', name: '双灶', description: '烹饪成功15%概率额外+1份' },
  { id: 'gourmet_craft', name: '匠心', description: '25%概率成品品质+1档' }
],
vendor_chef: [
  { id: 'buff_chef', name: '膳修', description: 'buff效果+30%，持续时段+1' },
  { id: 'tavern_master', name: '肆尊', description: '酒肆经营加成：厨艺+2、失误-3%、食物指导价+10%' }
]
```

`SKILL_NAMES` / `SKILL_ICONS`（`ChefHat` from lucide）同步三处文件。

- [ ] **Step 2: SkillView 增加 SKILL_DESCS / SKILL_LEVEL_BONUS / PERK_DESCS / PERK_NAMES**

```ts
cooking: '烹制料理。等级越高，成品品质越好。',
cooking: '烹饪升档概率提升',
```

- [ ] **Step 3: 手动验证** — `pnpm dev`，控制台给 cooking 加经验到 5/10，确认弹窗与描述含「当老板的选这个」

- [ ] **Step 4: Commit**

```bash
git commit -m "feat(skill): cooking perk UI in SkillView and PerkSelectDialog"
```

---

### Task 3: cook() 加经验 + 专精效果（备料/双灶/匠心/市厨/膳修）

**Files:**
- Modify: `src/stores/useCookingStore.ts`
- Modify: `src/stores/useShopStore.ts`（`vendor_chef` +15% 食物售价）
- Extend: `src/stores/useCookingStore.skill.test.ts`

- [ ] **Step 1: 写失败测试 — cook 后 cooking 经验增加**

```ts
it('cook 成功后增加 cooking 经验', () => {
  const cookingStore = useCookingStore()
  const skillStore = useSkillStore()
  const inv = useInventoryStore()
  // 备齐 stir_fried_cabbage 材料并 unlock
  cookingStore.unlockedRecipes.push('stir_fried_cabbage')
  inv.addItem('cabbage', 5)
  inv.addItem('firewood', 5)
  const before = skillStore.getSkill('cooking').exp
  cookingStore.cook('stir_fried_cabbage', 1)
  expect(skillStore.getSkill('cooking').exp).toBeGreaterThan(before)
})
```

- [ ] **Step 2: 实现 cook 内 `skillStore.addExp('cooking', 5 * maxPossible)`**

- [ ] **Step 3: 实现专精钩子（抽取小函数便于测）**

新建 `src/composables/cookingPerks.ts`：

```ts
export function rollPrepCookSave(ingredientQty: number): boolean { /* perk5 prep_cook 20% */ }
export function rollDoubleBatch(): boolean { /* perk10 double_batch 15% */ }
export function rollGourmetUpgrade(): boolean { /* perk10 gourmet_craft 25% */ }
export function getVendorChefSellMult(perk5: SkillPerk5 | null): number {
  return perk5 === 'vendor_chef' ? 1.15 : 1.0
}
```

在 `cook()` 中：省料 → 双份 → 匠心升档；`useShopStore.calculateSellPrice` 对 `food_*` 乘 `getVendorChefSellMult`。

- [ ] **Step 4: 膳修 — `eat()` buff 分支**

若 `perk10 === 'buff_chef'` 且 `recipe.effect.buff`：`value *= 1.3`，并设 `buffDurationExtra = 1`（在 `activeBuff` 或 gameStore 时段计数器实现，勿改炼金师恢复逻辑）。

- [ ] **Step 5: 测试 + commit**

```bash
pnpm test src/stores/useCookingStore.skill.test.ts
git commit -m "feat(cooking): exp on cook and cooking perk effects"
```

---

### Task 4: 旧档迁移 + 存档 + README

**Files:**
- Modify: `src/stores/useSaveStore.ts`（load 后调用 migrate）
- Modify: `src/stores/useAchievementStore.ts` 或 load 钩子传入 `totalRecipesCooked`
- Modify: `README.md`（技能成长补「烹饪」）
- Modify: `src/data/gameAnnouncements.ts`（一行：烹饪技能与专精）

- [ ] **Step 1: loadFromSlot 在 achievement deserialize 后**

```ts
if (!skillStore.getFlag?.('cookingExpMigrated')) {
  if (skillStore.migrateCookingExpFromRecipes(achievementStore.stats.totalRecipesCooked, false)) {
    tutorialStore.setFlag('cookingExpMigrated', true) // 或 tavernStore 专用 flag
  }
}
```

使用 `tutorial.flags.cooking_exp_migrated` 防重复（AGENT §2.1 新 flag）。

- [ ] **Step 2: 读旧 .tyx 槽位验证 cooking 为 0 级但迁移后有经验**

- [ ] **Step 3: 告示栏 + README + commit**

```bash
git commit -m "feat(cooking): old save exp migration and announcement"
```

**Phase 1 验收:** `pnpm test` 全绿；技能页见烹饪；烹饪加经验；市厨加价；旧档可读。

---

## Phase 2 — 酒坊 1～3 批量（可先上线）

### Task 5: processing 数据与纯函数测试

**Files:**
- Modify: `src/data/processing.ts` — 所有 `machineType === 'wine_workshop'` 配方设 `maxInputQuantity: 3`, `inputQuantity: 1`（米醋等保持原 input/output 比例，按批倍率）
- Create: `src/data/processing.wine.test.ts`
- Modify: `getSlotInputAmount` — `wine_workshop` 缺省 **1**（非熔炉 5）

- [ ] **Step 1: 写测试（照抄 furnace.test 结构）**

```ts
describe('酒坊（1～3 批 1:1 产出）', () => {
  it('西瓜酒 maxInput 为 3', () => {
    const recipe = getProcessingRecipeById('brew_watermelon_wine')! // 用实际 id
    expect(recipe.machineType).toBe('wine_workshop')
    expect(getRecipeMaxInput(recipe)).toBe(3)
  })
  it('旧存档酒坊加工缺省投入为 1', () => {
    const recipe = getProcessingRecipeById('brew_watermelon_wine')!
    expect(getSlotInputAmount(recipe, {})).toBe(1)
  })
})
```

- [ ] **Step 2: 批量改配方 + 实现 getSlotInputAmount 分支 → 测试 PASS**

- [ ] **Step 3: Commit**

```bash
git commit -m "feat(processing): wine_workshop batch 1-3 like furnace"
```

---

### Task 6: ProcessingView + useProcessingStore

**Files:**
- Modify: `src/views/game/ProcessingView.vue` — 酒坊槽位复用熔炉批量 UI（上限 3）
- Modify: `src/stores/useProcessingStore.ts` — `startProcessing` 校验 `wine_workshop` inputAmount 1～3
- Create: `src/stores/useProcessingStore.wine.test.ts`

- [ ] **Step 1: store 测试 startProcessing wine 3 批**

- [ ] **Step 2: UI 数量选择器与熔炉同组件逻辑**

- [ ] **Step 3: gameAnnouncements 追加「酒坊：单次最多酿 3 批」+ commit**

**Phase 2 验收:** 酒坊可选 1～3 批；旧档进行中酒坊槽位按 1 结算。

---

## Phase 3 — 酒肆数据层 + Store + 日结演算

### Task 7: `data/tavern.ts` 纯函数

**Files:**
- Create: `src/data/tavern.ts`
- Create: `src/data/tavern.test.ts`
- Create: `src/data/fruitSeason.ts`（`getFruitSeason(itemId)`, `isFruitInSeason(itemId, season)`）

- [ ] **Step 1: 写定价测试**

```ts
import { getGuidePrice, clampPlayerPrice, TAVERN_PRICE_MULT } from './tavern'

it('热菜指导价 sellPrice×3.2', () => {
  expect(getGuidePrice({ category: 'dish', sellPrice: 100, slot: 'dish' })).toBe(320)
})
it('反季鲜果×4.8', () => {
  expect(getGuidePrice({ category: 'fruit', sellPrice: 50, slot: 'fruit', inSeason: false })).toBe(240)
})
it('肆尊食物指导价+10%', () => {
  expect(getGuidePrice({ category: 'dish', sellPrice: 100, slot: 'dish', tavernMaster: true })).toBe(352)
})
```

- [ ] **Step 2: 实现 `TAVERN_UPGRADES`、`getTavernUpgrade(level)`、来客公式 `calcGuestCount(base, reputation, priceMod)`、`simulateAutoNight(...)` 入参类型**

- [ ] **Step 3: `pnpm test src/data/tavern.test.ts` PASS + commit**

---

### Task 8: `useTavernStore`

**Files:**
- Create: `src/stores/useTavernStore.ts`
- Create: `src/stores/useTavernStore.test.ts`
- Modify: `src/stores/useSaveStore.ts`

- [ ] **Step 1: 状态字段**

```ts
tavernLevel: 0 // 0=未建
reputation: 50
todayMode: 'auto' | 'manual' | 'closed'
menuSlots: { wine, dish, snack, fruit, cellar }[] // 每槽 itemId + priceMult
employees: TavernEmployee[]
manualSession: { step, queue, ... } | null
feastOrders: FeastOrder[]
cookingExpMigrated?: boolean // 若放 tutorial flag 则省略
```

- [ ] **Step 2: `buildTavern` / `upgradeTavern` — 校验 farmhouseLevel>=3、扣钱料**

- [ ] **Step 3: serialize/deserialize 缺省 `tavernLevel: 0`**

- [ ] **Step 4: useSaveStore 增加 `tavern: tavernStore.serialize()` / load**

- [ ] **Step 5: 测试建造 + 旧档缺字段 + commit**

---

### Task 9: 日结演算 `tavernSimulate` + `useEndDay`

**Files:**
- Create: `src/composables/tavernSimulate.ts`
- Create: `src/composables/tavernSimulate.test.ts`
- Modify: `src/composables/useEndDay.ts`

- [ ] **Step 1: 测试日结 — auto 模式来客>0、扣库存、manual 跳过**

```ts
it('todayMode manual 时不演算', () => {
  tavernStore.todayMode = 'manual'
  expect(runTavernEndDay()).toBeNull()
})
```

- [ ] **Step 2: 实现 `runTavernEndDay()`** — 工资、营业额、`reputation` 微调、NPC 好感、`addLog` 摘要

- [ ] **Step 3: 在 `useEndDay` 日结末尾调用（`todayMode !== 'manual'` 且 `tavernLevel >= 1`）**

- [ ] **Step 4: 玩家厨艺：帮厨空位用 `cooking.level`；`tavern_master` +15% 收益**

- [ ] **Step 5: commit**

**Phase 3 验收:** 无 UI 也可用 devtools 建酒肆、设菜单、日结见日志收入。

---

## Phase 4 — 酒肆 UI + 亲自值班 + NPC

### Task 10: 路由与小屋入口

**Files:**
- Create: `src/views/game/TavernView.vue`（骨架 + 概览/菜单 Tab）
- Modify: `src/router/index.ts` — `{ path: 'tavern', name: 'tavern', component: ... }`（**不进**底部 TABS）
- Modify: `src/views/game/CottageView.vue` — §15.2 酒肆区块
- Modify: `src/composables/useNavigation.ts` — `PanelKey` 加 `'tavern'`（仅 `navigateToPanel` 用，不加 TABS）

- [ ] **Step 1: CottageView 区块** — 未 Lv3 / 未建 / 已建三态；「进入经营」→ `router.push('/game/tavern')`

- [ ] **Step 2: TavernView 标题行 + 口碑 + todayMode 切换（亲自/日结/打烊）**

- [ ] **Step 3: 样式对照 `CottageView` 酒窖区块自检 §15**

- [ ] **Step 4: commit**

---

### Task 11: 菜单槽 UI + 定价滑条 + 鲜果产季

**Files:**
- Modify: `src/views/game/TavernView.vue`
- Modify: `src/stores/useFarmStore.ts`（收获 fruit 写 metadata，若库存支持 `extra` 字段）

- [ ] **Step 1: 菜单 Tab** — 五类槽位卡片；选品下拉（过滤已解锁/库存）；显示 `getGuidePrice`；步进调价 0.85～1.40

- [ ] **Step 2: 缺货 `text-danger`；反季鲜果标签**

- [ ] **Step 3: 温室 `fromGreenhouse`** — 收获时若 item 为 fruit，`inventoryStore.addItem(id, qty, quality, { fromGreenhouse: true })`（按现有 API 扩展或 parallel map）

- [ ] **Step 4: commit**

---

### Task 12: 员工招聘 / 培训 / 排班

**Files:**
- Modify: `src/data/tavern.ts` — 工资公式、培训费用
- Modify: `TavernView.vue` — 员工 Tab
- Modify: `tavernSimulate.ts` — 排班参与演算

- [ ] **Step 1: 随机候选人生成（姓名池 `data/tavern.ts`）**

- [ ] **Step 2: 雇佣上限读 `TAVERN_UPGRADES[level]`**

- [ ] **Step 3: 培训扣钱涨属性；** v1 **不占时段**（spec 可选）

- [ ] **Step 4: commit**

---

### Task 13: 亲自值班状态机

**Files:**
- Modify: `src/stores/useTavernStore.ts`
- Modify: `src/views/game/TavernView.vue` — 营业 Tab

- [ ] **Step 1: `startManualShift()`** — 设 `todayMode='manual'`，初始化 queue

- [ ] **Step 2: 步骤 ②～⑤** — 每步 `playerStore.consumeStamina(cost)` + `advanceTime`；体力 ≤5 禁用

| 步骤 | 体力 |
|------|------|
| 接客 | 4 |
| 后厨 | 8 |
| 上菜 | 5 |
| 结账 | 3 |

- [ ] **Step 3: 后厨用 `getEffectiveCookingLevel()`（§6.1 + 肆尊 +2）；失误率随机重做**

- [ ] **Step 4: 结账 — 小费、好感、上错口碑 -1**

- [ ] **Step 5: `closeManualShift()` 汇总收入 `showFloat` + `addLog`**

- [ ] **Step 6: commit**

---

### Task 14: NPC 喜好与宴席

**Files:**
- Create: `src/data/npcTavernPrefs.ts`
- Modify: `TavernView.vue` — 宴席 Tab
- Modify: `tavernSimulate.ts` + manual 结账 — 读 prefs

- [ ] **Step 1: 先配置 6～8 个核心 NPC 的 `favoriteDrink/Dish/Fruit`**

- [ ] **Step 2: 宴席订单数据结构 + 完成领奖**

- [ ] **Step 3: 来客权重偏好 NPC**

- [ ] **Step 4: commit**

---

### Task 15: 收尾 — 告示栏、AGENT、全量验证

**Files:**
- Modify: `src/data/gameAnnouncements.ts`
- Modify: `AGENT.md` §6
- Modify: `design/superpowers/specs/2026-06-04-tavern-design.md` — 文首状态改为「实现中/已完成」

- [ ] **Step 1: gameAnnouncements 追加行（分阶段已发的合并为最终一批也可）**

```
酒肆：农舍 Lv3 可建前厅，亲自值班或日结经营。
烹饪：新增烹饪技能与专精（市厨适合当老板）。
酒坊：酿酒类配方支持 1～3 批批量生产。
```

- [ ] **Step 2: AGENT §6 追加酒肆、烹饪技能、酒坊批量行**

- [ ] **Step 3: 全量检查**

```bash
cd taoyuan && pnpm check
```

Expected: type-check + lint + vitest 全通过

- [ ] **Step 4: 旧档 .tyx 读档 + 日结 + 亲自营业 smoke test**

- [ ] **Step 5: Commit**

```bash
git commit -m "docs: tavern v1 announcements and agent index"
```

---

## Spec Coverage Self-Review

| Spec § | Task |
|--------|------|
| §5.3 烹饪技能 | Task 1–4 |
| §10 酒坊×3 | Task 5–6 |
| §4.1 扩建表 | Task 7–8 |
| §8.3–8.4 定价/鲜果 | Task 7, 11 |
| §5.1 日结自动 | Task 9 |
| §5.2–§6 亲自值班/体力 | Task 13 |
| §7 员工 | Task 12 |
| §9 NPC/宴席 | Task 14 |
| §15 UI | Task 10–13 |
| §16 检查清单 | Task 15 + 各 Phase 验收 |
| §17 负面事件不做 | Task 13 仅口碑 -1 |
| 肆尊/市厨/膳修/备料 | Task 3, 7, 9, 13 |
| 培训不占时段 | Task 12 默认不占 |

**未纳入 v1（明确延后）：** 口碑等级阈值、节日客流公式（spec §13 可选）。

---

## 建议合并顺序（PR）

1. `feat(skill): cooking` — Phase 1  
2. `feat(processing): wine batch` — Phase 2  
3. `feat(tavern): data store simulate` — Phase 3  
4. `feat(tavern): ui manual npc` — Phase 4  

每 PR 后 `pnpm check` + 旧档读档。

---

*Plan generated 2026-06-04. Maintainer: 实现偏离时先改 spec 再改本 plan。*
