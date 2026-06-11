# 铁匠锻造 + 图纸套装 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 按已定稿 [锻造 spec](../specs/2026-06-10-forging-design.md) 实装当场锻造（节奏小游戏）、图纸解锁、25 套装备锻造（含固定词条）、矿洞/Boss/NPC 图纸来源、准备页一键穿戴整套，并接入 `forging` 技能与专精（§8.7 已回填 [技能树 spec](../specs/2026-06-10-skill-tree-design.md)）。

**Architecture:** 纯函数层（`composables/forgeRoll.ts`：品质/属性/词条/天气）+ 数据层（`forge.ts` / `forgeBlueprints.ts` / `affixes.ts` / `forgeWeather.ts`）+ `useForgeStore`（图纸、打造、请教、铁匠任务）+ UI（`ForgeView.vue`、铁匠铺页签）。套装计数扩展 `useInventoryStore._getSetPieceCount` 支持 `setId`。旧存档：无 `forging` 补技能；`pendingUpgrade` 当场结算；已杀 Boss 补图纸。

**Tech Stack:** Vue 3 + Pinia + TypeScript + Vitest + Tailwind（`game-panel`）

**Spec:** [../specs/2026-06-10-forging-design.md](../specs/2026-06-10-forging-design.md)  
**Skill:** [../specs/2026-06-10-skill-tree-design.md](../specs/2026-06-10-skill-tree-design.md) §8.7  
**Compat:** [../../../AGENT.md](../../../AGENT.md) §2

**依赖：** 技能树基础设施（`SkillType` 含 `forging`、`perk15/20`、`src/data/skills.ts`）可与本计划 **Phase 1 Task 0** 合并实现；若技能树独立 PR 未合并，须先完成 Task 0。

---

## File Map

| 职责 | 创建 | 修改 |
|------|------|------|
| 类型 | `src/types/forge.ts` | `src/types/skill.ts`, `src/types/ring.ts`, `src/types/item.ts` |
| 纯函数 | `src/composables/forgeRoll.ts`, `src/composables/useRhythmMinigame.ts` | — |
| 数据 | `src/data/affixes.ts`, `src/data/forge.ts`, `src/data/forgeBlueprints.ts`, `src/data/forgeWeather.ts`, `src/data/forgeSets.ts` | `src/data/equipmentSets.ts`, `src/data/hats.ts`, `src/data/shoes.ts`, `src/data/rings.ts`, `src/data/weapons.ts`, `src/data/index.ts` |
| Store | `src/stores/useForgeStore.ts` | `useInventoryStore.ts`, `useMiningStore.ts`, `useSkillStore.ts`, `useNpcStore.ts`, `useSaveStore.ts`, `useShopStore.ts` |
| UI | `src/components/game/ForgeMinigame.vue`, `src/views/game/ForgeView.vue` | `ShopView.vue`, `InventoryView.vue`, `MiningView.vue`, `ToolUpgradeView.vue`, `router/index.ts`, `useNavigation.ts` |
| 日结/请教 | `src/data/forgeLessons.ts`, `src/data/forgeQuests.ts` | `useEndDay.ts` |
| 测试 | `src/composables/forgeRoll.test.ts`, `src/stores/useForgeStore.test.ts`, `src/data/forgeBlueprints.test.ts` | `src/smoke/gameSmoke.test.ts`（轻量回归） |
| 文档/KB | — | `README.md`, `AGENT.md` §6, `backend/internal/knowledge/kb_part*.json`（铁匠/图纸） |

---

## Phase 0 — 技能与类型地基

### Task 0: `forging` 技能 + EquipmentEffectType 扩展

**Files:**
- Modify: `src/types/skill.ts`
- Modify: `src/types/ring.ts`
- Modify: `src/stores/useSkillStore.ts`
- Create: `src/data/skills.ts`（若技能树 plan 未建，至少 forging 分支）
- Test: `src/stores/useForgeStore.skill.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
// src/stores/useForgeStore.skill.test.ts
import { beforeEach, describe, expect, it } from 'vitest'
import { createTestPinia } from '@/test/pinia'
import { useSkillStore } from '@/stores/useSkillStore'

describe('forging 技能', () => {
  beforeEach(() => createTestPinia())

  it('skills 含 forging', () => {
    expect(useSkillStore().skills.some(s => s.type === 'forging')).toBe(true)
  })

  it('addExp forging 可升级', () => {
    const ss = useSkillStore()
    for (let i = 0; i < 30; i++) ss.addExp('forging', 200)
    expect(ss.getSkill('forging').level).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: 运行确认 FAIL** — `cd taoyuan && pnpm test src/stores/useForgeStore.skill.test.ts`

- [ ] **Step 3: 实现**

`skill.ts`：`SkillType` 加 `'forging'`；`SkillPerk5/10/15/20` 加 forging 全 ID（§8.7）。

`ring.ts`：`EquipmentEffectType` 加 `foraging_stamina` | `forging_exp_bonus`。

`skills.ts`：`PERK5_OPTIONS.forging`、`PERK10_BRANCHES`…`PERK20_BRANCHES` 按技能树 spec §8.7 树形。

`useSkillStore.ts`：`createSkill('forging')`；`addExp` 对 `forging_exp_bonus` 仅锻造经验分支（在 `useForgeStore.addForgingExp` 调用）。

- [ ] **Step 4: 测试 PASS**

- [ ] **Step 5: Commit** — `feat(skill): add forging skill and perk tree data`

---

## Phase 1 — 数据层与 Store 骨架

### Task 1: 类型与 `affixes.ts` + `forgeWeather.ts`

**Files:**
- Create: `src/types/forge.ts`
- Create: `src/data/affixes.ts`
- Create: `src/data/forgeWeather.ts`
- Test: `src/composables/forgeRoll.test.ts`（先写 weather/affix 过滤）

- [ ] **Step 1: 定义 `ForgeRecipeDef`, `ForgeBlueprintDef`, `CraftedWeapon`, `CraftedAccessory`（spec §4.1、§9.7）**

- [ ] **Step 2: 从 spec §8.8～§8.10 录入 `AFFIXES` 常量（含天气 `requiredWeather`）**

- [ ] **Step 3: `FORGE_WEATHER_QUALITY_DELTA` + `FORGE_WEATHER_MINIGAME`（spec §7.4）**

- [ ] **Step 4: 测试 — 天气不符时天气词条不进池**

```ts
it('wx_thunder 仅 stormy 进池', () => {
  const pool = getAffixPool({ category: 'weapon', quality: 'supreme', weather: 'sunny', forgingLevel: 15 })
  expect(pool.some(a => a.id === 'wx_thunder')).toBe(false)
  const storm = getAffixPool({ category: 'weapon', quality: 'supreme', weather: 'stormy', forgingLevel: 15 })
  expect(storm.some(a => a.id === 'wx_thunder')).toBe(true)
})
```

- [ ] **Step 5: Commit** — `feat(forge): add affix and weather data`

---

### Task 2: `forge.ts` 配方 + `forgeBlueprints.ts`

**Files:**
- Create: `src/data/forge.ts`
- Create: `src/data/forgeBlueprints.ts`
- Test: `src/data/forgeBlueprints.test.ts`

- [ ] **Step 1: `FORGE_RECIPES`** — 从 `CRAFTABLE_*` + 可锻造武器迁移；每条含 `setId?`, `fixedAffixId?`, `tier`, `requiredForgingLevel`

- [ ] **Step 2: `FORGE_BLUEPRINTS`** — spec §9.10～§9.12 全部 `id` + `unlocksRecipeIds`；孙铁匠商店价

- [ ] **Step 3: 辅助函数 `getBlueprintById`, `getRecipesForBlueprint`, `getShopBlueprintsForSun()`**

- [ ] **Step 4: 测试 — 学习 `bp_boss_frost_queen_set` 解锁 4 条 recipe id**

- [ ] **Step 5: Commit** — `feat(forge): recipes and blueprint definitions`

---

### Task 3: `useForgeStore` 图纸与存档

**Files:**
- Create: `src/stores/useForgeStore.ts`
- Modify: `src/stores/useSaveStore.ts`
- Test: `src/stores/useForgeStore.test.ts`

- [ ] **Step 1: state** — `unlockedRecipeIds`, `defeatedBossFloors`, `sunBlueprintShopPurchased`, `forgeStats`, 请教/任务字段（§10）

- [ ] **Step 2: `learnBlueprint(id)`** — 合并 recipe ids；去重

- [ ] **Step 3: `purchaseSunBlueprint(id)`** — 扣钱 + 标记已购

- [ ] **Step 4: `serialize` / `deserialize`** + save 挂钩

- [ ] **Step 5: 测试 learn + purchase**

- [ ] **Step 6: Commit** — `feat(forge): useForgeStore blueprint progress`

---

## Phase 2 — 节奏小游戏

### Task 4: `useRhythmMinigame` + `ForgeMinigame.vue`

**Files:**
- Create: `src/composables/useRhythmMinigame.ts`（从 `TeaContestView.vue` 抽取）
- Create: `src/components/game/ForgeMinigame.vue`
- Modify: `src/components/game/TeaContestView.vue`（改用 composable，行为不变）

- [ ] **Step 1: 抽取 fillTimer / lockStep / grade → 返回 `forgeScore` 0～150**

- [ ] **Step 2: 三步文案 spec §6.2；天气修正起炉宽度（`windy`）、全流程条速（`stormy`/`snowy` 锻打）**

- [ ] **Step 3: `ForgeMinigame` emit `complete(score)` / `cancel`**

- [ ] **Step 4: 手动进游戏斗茶回归 + 新组件 Storybook 式自测**

- [ ] **Step 5: Commit** — `feat(forge): rhythm minigame shared with tea contest`

---

## Phase 3 — 结算纯函数

### Task 5: `forgeRoll.ts`

**Files:**
- Create: `src/composables/forgeRoll.ts`
- Test: `src/composables/forgeRoll.test.ts`

- [ ] **Step 1: `rollForgeQuality(score, forgingLevel, weather, perks)`** — 含 sunny +2% / snowy -2%

- [ ] **Step 2: `rollWeaponStats(recipe, quality, forgingLevel)`** — **无**天气攻乘

- [ ] **Step 3: `rollAccessoryEffects(def, quality)`**

- [ ] **Step 4: `rollAffixes({ category, quality, forgingLevel, weather, fixedAffixId, isSetPiece })`** — 固定槽 1 + 极品槽 2；专精 `lucky_reroll` / `arch_enchanter` 钩子参数

- [ ] **Step 5: 测试表锁定 spec §7.4、§8.3 各一档样例**

- [ ] **Step 6: Commit** — `feat(forge): quality stat and affix roll functions`

---

### Task 6: `completeForge` 端到端

**Files:**
- Modify: `src/stores/useForgeStore.ts`
- Modify: `src/stores/useInventoryStore.ts`（打造实例列表）

- [ ] **Step 1: `startForge(recipeId)`** — 校验解锁/等级/材料 → 开小游戏

- [ ] **Step 2: `completeForge(recipeId, forgeScore)`** — roll → 写入 `craftedWeapons[]` / `craftedAccessories[]`（含 `setId`）

- [ ] **Step 3: `addForgingExp`** — 叠 `apprentice` / `forging_exp_bonus` 词条

- [ ] **Step 4: `upgradeTool`** — §6.3 当场升档 + `pendingUpgrade` 废弃

- [ ] **Step 5: `rerollAffixes(instanceId)`**

- [ ] **Step 6: Store 测试 — 扣料、产出实例、经验增加**

- [ ] **Step 7: Commit** — `feat(forge): complete forge and tool upgrade flow`

---

## Phase 4 — 套装与装备（一次做完 25 套）

### Task 7: 扩展 `equipmentSets.ts` + 新 def

**Files:**
- Create: `src/data/forgeSets.ts`（新 def 元数据：31 件清单）
- Modify: `src/data/equipmentSets.ts`
- Modify: `src/data/hats.ts`, `shoes.ts`, `rings.ts`, `weapons.ts`

- [ ] **Step 1: 新增 setId** — `mud_king_set`, `lava_lord_set`, `crystal_king_set`, `shadow_sovereign_set`, `master_smith_set`, `forager_set`, `hearth_set`, `tea_zen_set`, `escort_set`, `furnace_set`, `shrine_harvest_set`（spec §9.13）

- [ ] **Step 2: 更新** — `frost_queen_set` / `dragon_king_set` 四件 bonus；其余现网 14 套条目核对

- [ ] **Step 3: 录入新 def** — `recipe: null`, `obtainSource: '锻造'`, effects 底材

- [ ] **Step 4: `FORGE_RECIPES` 补全每套 3～4 条 + `fixedAffixId`**

- [ ] **Step 5: Commit** — `feat(forge): equipment sets and craftable defs`

---

### Task 8: 套装计数 + 战斗/生活读 affix

**Files:**
- Modify: `src/stores/useInventoryStore.ts`
- Modify: `src/stores/useMiningStore.ts`, `useFishingStore.ts`, `useFarmActions.ts`, `ForageView.vue`

- [ ] **Step 1: `_getSetPieceCount`** — `crafted.setId === set.id` OR `defId` match

- [ ] **Step 2: `getEquipmentBonus`** — 聚合打造实例 affixes + 底材 scaled effects

- [ ] **Step 3: `getWeaponAttack/Crit`** — rolled + affix + 旧 enchantment 兼容

- [ ] **Step 4: `foraging_stamina` / `forging_exp_bonus` 接线**

- [ ] **Step 5: `equipSet(setId)`** — 每槽最高品质实例；返回缺件列表

- [ ] **Step 6: Commit** — `feat(forge): set matching equipSet and affix aggregation`

---

## Phase 5 — 图纸来源

### Task 9: 孙铁匠商店 + 好感赠送

**Files:**
- Modify: `src/views/game/ForgeView.vue`（或 `ShopView` 锻造页签）
- Modify: `src/stores/useNpcStore.ts`（好感升级钩子）

- [ ] **Step 1: 图纸商店 UI** — `purchaseSunBlueprint`；相识起显示

- [ ] **Step 2: `onFriendshipLevelUp(sun_tiejiang)`** — acquaintance/friendly/bestFriend 送 spec §9.10 图纸

- [ ] **Step 3: 阿铁好感图纸 §9.10**

- [ ] **Step 4: 其他 NPC §9.15** — 林老/云飞/阿石等 `learnBlueprint` 对话触发

- [ ] **Step 5: Commit** — `feat(forge): NPC and shop blueprint unlocks`

---

### Task 10: 矿洞掉落 + Boss 首杀

**Files:**
- Modify: `src/stores/useMiningStore.ts`
- Modify: `src/data/items.ts`（`blueprint_scroll` 或具名图纸物品）

- [ ] **Step 1: `rollForgeBlueprintDrop(floor)`** — spec §9.11 池 + `treasure_find` 加成

- [ ] **Step 2: 怪物死亡 / 宝箱开启调用**

- [ ] **Step 3: `onBossDefeated(floor)`** — 20/40/60/80/100/120 → `learnBlueprint` + `defeatedBossFloors`

- [ ] **Step 4: 读档迁移** — 已有 Boss 击杀记录补图纸（spec §12）

- [ ] **Step 5: 测试 `forgeBlueprints.test.ts` 掉率池按层段**

- [ ] **Step 6: Commit** — `feat(forge): mine blueprint drops and boss unlocks`

---

### Task 11: 请教 + 铁匠任务

**Files:**
- Create: `src/data/forgeLessons.ts`, `src/data/forgeQuests.ts`
- Modify: `useForgeStore.ts`, `ForgeView.vue`, `useEndDay.ts`

- [ ] **Step 1: `attendLesson`** — §10.2 课表 + 解锁配方

- [ ] **Step 2: `forgeBoardQuests` 生成/交付** — §10.3

- [ ] **Step 3: 「开炉」解锁 forging 技能可见**

- [ ] **Step 4: Commit** — `feat(forge): lessons and blacksmith quests`

---

## Phase 6 — UI 整合

### Task 12: `ForgeView` + 铁匠铺入口

**Files:**
- Create: `src/views/game/ForgeView.vue`
- Modify: `ShopView.vue`, `router/index.ts`

- [ ] **Step 1: 子页签** — 打造 / 图纸店 / 请教 / 任务 / 重刷

- [ ] **Step 2: 配方列表** — 仅 `unlockedRecipeIds`；显示天气提示 + 天象词条角标

- [ ] **Step 3: 弱化合成保留** §9.6 文案

- [ ] **Step 4: `ToolUpgradeView` 重定向或嵌入工具页签**

- [ ] **Step 5: Commit** — `feat(forge): ForgeView and shop integration`

---

### Task 13: 背包 / 矿洞一键穿戴

**Files:**
- Modify: `InventoryView.vue`, `MiningView.vue`

- [ ] **Step 1: 套装进度 UI +「穿戴整套」按钮**

- [ ] **Step 2: 缺件 tooltip 显示图纸来源**

- [ ] **Step 3: 可选保存为 `equipmentPreset`**

- [ ] **Step 4: Commit** — `feat(forge): equip full set from inventory and mine prep`

---

## Phase 7 — 专精、文档、回归

### Task 14: 锻造专精效果接入

**Files:**
- Modify: `forgeRoll.ts`, `useForgeStore.ts`, `useSkillStore.ts`
- Modify: `PerkSelectDialog.vue`, `SkillView.vue`（若尚未支持 perk15/20）

- [ ] **Step 1: `hasPerk('smith_sword')` 等影响 minigame / roll / reroll / tool / sell**

- [ ] **Step 2: 专精弹窗 forging 分支显示**

- [ ] **Step 3: Commit** — `feat(forge): wire forging perk effects`

---

### Task 15: 知识库 + README + 冒烟

**Files:**
- Modify: `backend/internal/knowledge/kb_part2.json`, `kb_part3.json`（铁匠/图纸/套装）
- Modify: `README.md`, `AGENT.md`

- [ ] **Step 1: KB 条目** — 图纸来源、Boss 套、匠师挚友套、一键穿戴

- [ ] **Step 2: `pnpm run check` 全绿**

- [ ] **Step 3: `gameSmoke.test.ts` 补一条 deserialize forge 存档**

- [ ] **Step 4: Commit** — `docs: forging system knowledge and smoke test`

---

## Spec 覆盖自检

| Spec 章节 | Task |
|-----------|------|
| §4 实例 setId | Task 6, 8 |
| §6.3 工具当场 | Task 6 |
| §7.4 天气 | Task 1, 5 |
| §8 词条 | Task 1, 5 |
| §9.7～9.15 图纸套装 | Task 2, 7, 9, 10 |
| §9.6 弱化合成 | Task 12 |
| §10 经验三线 | Task 6, 11 |
| §11 专精 | Task 0, 14 |
| §12 存档 | Task 3, 10 |

---

## 执行顺序建议

```text
Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7
```

Phase 4（25 套）**不要拆分 PR**；可在 Task 7 内按文件 commit，但同一 feature 分支一次合并。

---

**Plan complete and saved to `design/superpowers/plans/2026-06-10-forging-implementation.md`.**

**两种执行方式：**

1. **Subagent-Driven（推荐）** — 每 Task 派生子 agent，Task 间人工/代理审查  
2. **Inline Execution** — 本会话按 Phase 连续实现，Phase 结束设检查点  

**你希望用哪种方式开始？**（若技能树 `src/data/skills.ts` 尚未存在，建议先做 Phase 0 + 技能树 plan 中的 `skills.ts` 骨架。）
