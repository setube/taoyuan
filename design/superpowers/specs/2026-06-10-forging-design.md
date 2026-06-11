# 铁匠锻造系统 — 产品需求与玩法设计（草案）

> **状态**：定稿（implementation plan 已写）  
> **文档日期**：2026-06-10  
> **项目**：桃源谷（`taoyuan`）  
> **前置**：[2026-06-10-skill-tree-design.md](./2026-06-10-skill-tree-design.md)（`forging` 技能 + Lv15/20 专精待本文回填）  
> **规范参照**：[README.md](../../../README.md)、[AGENT.md](../../../AGENT.md)（存档兼容）

---

## 1. 设计目标

| 目标 | 说明 |
|------|------|
| 核心体验 | **当场打铁**：交材料 → 立刻玩节奏小游戏 → 结算品质/属性/词条；有「亲手铸器」的仪式感 |
| 品类范围 | **铁匠铺全家桶**：武器、帽/鞋/戒、工具升级、词条重刷；与泡茶游戏同构的节奏条 |
| 并行保留 | 镖局购武、掉落/Boss 装、旧即时合成入口**不删**；打造是更强、可定制线 |
| 成长 | 新技能 `forging`（20 级 + 专精）；经验 **打造 + 请教 + 铁匠任务** 三线并行（§10） |
| 技术 | 复用 `TeaContestView` 节奏引擎；新 `useForgeStore` + 装备实例扩展 |

---

## 2. 已确认决策总表

| # | 议题 | 结论 |
|---|------|------|
| 1 | 可打造范围 | **C 全家桶**：武器、附魔/词条、工具、戒指/帽/鞋 |
| 2 | 工具例外 | 工具**无品质、无词条、无小游戏**；**当场升档**，门槛 = `forging` 等级（见 §6.3） |
| 3 | 武器属性 | **品质 + 基础属性（攻/暴等）+ 词条** 三者独立 |
| 4 | 其他装备 | **品质 + 词条**；`effects` 与现表一致，按品质缩放 |
| 5 | 品质来源 | 锻造技能等级 + **天气（仅少数现实相关修正）** + 随机 + **小游戏总分** |
| 6 | 武器数值 | 配方底材 × 品质倍率 × 技能加成（**天气不改攻/暴底材**） |
| 7 | 词条 | 打造完成时 roll；**种类与数值均受品质约束**；花材料可重刷（池子锁定该件品质档） |
| 8 | 小游戏时机 | **A 当场锻造**：交材料后立刻玩，不排队取货 |
| 9 | 小游戏形态 | **类斗茶**：条子填充 + 目标区按键；三步 **起炉 → 锻打 → 淬火** |
| 10 | 机制绑定 | 专精/词条仅引用 `src/` 已有或本文实装机制（见技能 spec §7.5） |
| 11 | 锻造经验 | **三线并行**：**打造** + **对话请教** + **铁匠任务**（不占全村告示栏槽位） |
| 12 | 旧一键合成 | **保留弱化版**：`ShopView` 戒/帽/鞋快捷合成不删（见 §9.6） |
| 13 | 工具升级 | **当场完成**；每档升级需达到对应 `forging` 等级（见 §6.3） |
| 14 | 天气 | **有现实依据才生效**；无影响天气 = 0；稀有词条可 `requiredWeather`（§7.4、§8.9） |
| 15 | 图纸与套装 | **单品 + 套装图纸**；孙铁匠商店/好感/Boss 首杀/矿洞掉落；套装件 **固定词条**；准备 **一键穿戴**（§9.7～§9.14） |

---

## 3. 与现有系统关系

```text
矿洞/熔炉/商圈 ──→ 锭与材料
        ↓
铁匠铺「锻造」面板 ──→ 当场小游戏 ──→ 打造实例（品质/属性/词条）
        ↓
背包装备栏 / 矿洞战斗

并行：
  镖局 ──→ 商店武器（无品质档，固定表）
  掉落/Boss ──→ 固定附魔武器
  旧 ShopView 合成 ──→ **弱化快捷合成**（无小游戏、无品质/词条、材料略省）
  工坊 ToolUpgrade ──→ 并入铁匠铺「工具」页签；**当场升档** + forging 等级门槛
```

| 模块 | 锻造后角色 |
|------|------------|
| `weapons.ts` / `ENCHANTMENTS` | 配方底材；词条池可收录原 6 附魔 |
| `hats.ts` / `shoes.ts` / `rings.ts` | 配方 + 底材 `effects`；打造实例叠品质与额外词条 |
| `useInventoryStore` | 扩展 **打造实例** 存盘（见 §5） |
| `TeaContestView.vue` | 抽取共用节奏逻辑 → `ForgeMinigame.vue` |
| `ShopView` 铁匠铺 | 新增「锻造」入口（或独立 `ForgeView` 路由） |
| `useSkillStore` `forging` | 小游戏结算、请教、任务加经验 |
| 孙铁匠 / 阿铁 | 请教、订单任务、好感解锁配方 |

---

## 4. 打造品属性模型

### 4.1 实例字段（新类型 `CraftedEquipment`）

```ts
/** 打造装备实例（武器/帽/鞋/戒） */
interface CraftedEquipmentBase {
  recipeId: string
  quality: Quality // normal | fine | excellent | supreme
  affixes: { id: string; rolledValue: number }[] // 条数由品质决定，见 §8.2
  /** 对齐 equipmentSets.id；套装打造必写，供套装计数与一键穿戴 */
  setId: string | null
  forgedDay: number
  forgeScore: number // 小游戏总分，供成就/重铸参考
}

/** 武器实例 = 现有 OwnedWeapon 扩展 */
interface CraftedWeapon extends CraftedEquipmentBase {
  defId: string // 对应 WeaponDef
  /** 本次打造 roll 出的攻击/暴击（已含品质+技能+天气） */
  rolledAttack: number
  rolledCritRate: number
  /** 旧 enchantmentId：商店/掉落武器仍用；打造武器以 affixIds 为主，见 §9 */
  enchantmentId: string | null
}

/** 帽/鞋/戒：在现有「拥有即 defId」上增加实例层，或 id+实例索引 */
interface CraftedAccessory extends CraftedEquipmentBase {
  defId: string
  /** effects 数值 = 配方底材 effects × 品质倍率（与烹饪 QUALITY_MULTIPLIER 同表） */
}
```

### 4.2 品类对照

| 品类 | 品质 | 基础属性 | 词条 | 小游戏 |
|------|------|----------|------|--------|
| 武器 | ✅ | ✅ 攻/暴等 | ✅ | ✅ 1 轮三式 |
| 戒指 | ✅ | ✅ `effects` 缩放 | ✅ | ✅ |
| 帽子 | ✅ | ✅ | ✅ | ✅ |
| 鞋子 | ✅ | ✅ | ✅ | ✅ |
| 工具升级 | ❌ | 仅 tier | ❌ | ❌（或可选简化 QTE 仅加经验，默认不做） |

**说明**：现网帽/鞋/戒在 `HatDef.effects` / `ShoeDef.effects` / `RingDef.effects` 已有 `attack_bonus`、`defense_bonus`、`travel_speed` 等；打造版 = **同 type 的 effects × 品质倍率 + 额外词条**。

---

## 5. 当场锻造流程（A）

```text
1. 铁匠铺选配方 → 检查 forging 等级 / 材料 / 铜钱
2. 扣除材料 → 进入 ForgeMinigame（复用斗茶引擎）
3. 一轮三步：起炉 → 锻打 → 淬火（每步 perfect/good/poor）
4. 结算：
   - forgeScore（0～150，与斗茶单轮满分同量级）
   - rollQuality(skill, weather, random, forgeScore)  // weather 仅 §7.4 品质修正
   - 武器：rollWeaponStats(recipe, quality, skill)
   - rollAffixes(category, quality, skill, weather)  // weather 决定天气稀有词条
   - rollAffixes(category, quality, skill)
5. 实例入背包 → forging 经验 + 成就/任务钩子
6. （可选）词条重刷：同界面花材料 rerollAffixes，不重新小游戏
```

**时间**：小游戏约 30～60 秒；`advanceTime` 建议 **0.5～1h**（与 `ACTION_TIME_COSTS.cook` 同级），避免白嫖。

---

## 6. 打铁小游戏（类斗茶）

### 6.1 引擎复用

| 斗茶 (`TeaContestView`) | 锻造 (`ForgeMinigame`) |
|-------------------------|-------------------------|
| 控温 / 投茶 / 出汤 | **起炉** / **锻打** / **淬火** |
| 条子 0→100 填充，目标区 25～80% | 同左 |
| offset≤4 perfect，≤12 good | 同阈值（可调专精） |
| 3 轮 × 3 步（节日） | **v1：1 轮 × 3 步**（当场锻造不宜过长） |
| 总分映射奖金 | 总分映射 **品质权重** |

实现：抽取 `useRhythmMinigame.ts`（fillTimer、lockStep、grade），`TeaContestView` 与 `ForgeMinigame` 共用。

### 6.2 步骤文案

| 步 | 短标 | 提示 | 按键 | 条两端 |
|----|------|------|------|--------|
| 起炉 | 炉 | 烧到合适火候 | 定炉！ | 凉 ↔ 烫 |
| 锻打 | 锻 | 锤准着力点 | 落锤！ | 轻 ↔ 重 |
| 淬火 | 淬 | 入水时机 | 淬火！ | 慢 ↔ 急 |

音效：复用 `sfxTeaPour` / `sfxMiniPerfect` 等占位，后续换锤击音（`useAudio` 登记）。

### 6.3 工具升级（当场 + 技能门槛）

- **无品质、无词条、无小游戏**。
- 交材料 + 铜钱后 **立刻升档**（废除 `pendingUpgrade` 2 天等待）；入口以铁匠铺「工具」页签为主，`ToolUpgradeView` 可重定向或保留为快捷入口。
- **锻造等级门槛**：每档 `toTier` 绑定 `requiredForgingLevel`；不足时按钮灰显并提示「需锻造 LvN」。

| 升档 | 目标 tier | 所需 `forging` | 说明 |
|------|-----------|----------------|------|
| 初始 → 铁制 | `iron` | **1** | 完成孙铁匠「开炉」请教后即可 |
| 铁制 → 精钢 | `steel` | **6** | 对齐中期装备配方节奏 |
| 精钢 → 铱金 | `iridium` | **12** | 高阶矿洞前门槛 |
| 铱金 | — | — | 已满级 |

材料/铜钱仍读 `upgrades.ts` 的 `TOOL_UPGRADE_COSTS`；实现时在 `ToolUpgradeCost` 增加 `requiredForgingLevel` 字段（或旁路表 `TOOL_FORGE_LEVEL`）。

校验：`useForgeStore.upgradeTool(type)` → `skillStore.getLevel('forging') >= required` → 扣费 → `inventoryStore.setToolTier` → `addExp('forging', 15)`。

**与弱化合成区别**：工具只走铁匠铺升级线，不提供 ShopView 一键升工具。

### 6.4 存档迁移（工具）

| 场景 | 处理 |
|------|------|
| 旧档存在 `pendingUpgrade` | 读档 **一次性当场结算** 为 `targetTier`，清空 `pendingUpgrade` |
| 新档 | 不再写入 `pendingUpgrade` |

---

## 7. 品质与属性公式（v1 草案）

### 7.1 品质 `rollForgeQuality`

输入：`forgeScore`（0～150）、`forgingLevel`、`weather`、`perks`、小随机。

| forgeScore 段 | 品质权重倾向 |
|---------------|----------------|
| ≥120 | 极品权重高 |
| 70～119 | 精品 |
| 40～69 | 优良 |
| &lt;40 | 普通 |

叠加：

- 锻造等级：每级 +1% 升档概率（Lv15/20 门槛对齐技能 spec §6.2）
- 天气：仅 §7.4 列出的 **品质权重 / 小游戏步骤** 修正（无列 = 0）
- 专精：如 `apprentice` 经验向、`enchanter` 词条向（见 §11 回填）

### 7.2 武器基础属性

```text
rolledAttack = floor( weaponDef.attack × QUALITY_MULT[quality]
                      × (1 + forgingLevel × 0.02) )
rolledCritRate = 同理基于 weaponDef.critRate，上限封顶 0.5
```

**天气不参与攻/暴乘算**（室内铁匠铺完工，成件硬度主要由材料与技艺决定）。

### 7.3 帽/鞋/戒 effects 缩放

```text
effectValue = floor( baseEffect.value × QUALITY_MULT[quality] )
```

额外 **词条** 在底材 `effects` 之外**独立叠加**（见 §8）。

### 7.4 天气与锻造（定稿）

铁匠铺在室内作业；天气 **不** 改铜钱、材料、工具升级门槛。仅下列有现实或桃源谷叙事依据的效果：

| 天气 | 现实依据 | 品质升档权重 | 小游戏 | 词条 |
|------|----------|-------------|--------|------|
| `sunny` 晴 | 干燥，炉温与金属发色易辨认 | **+2%** | — | 可出 T3「烈阳」 |
| `rainy` 雨 | 室内锻造无直接影响；淬火液与潮湿空气略改冷却节奏 | **0** | — | 可出 T3「雨淬」 |
| `stormy` 暴风雨 | 雷暴扰神、节奏难稳；民间「雷击淬刃」传说 | **0** | 全流程条速 **+8%** | 可出 T4「雷淬」（仅暴风雨） |
| `snowy` 雪 | 工坊冷，工件离火后表面降温快、锻打窗口短 | **-2%** | **锻打**步条速 +5% | 可出 T3「雪晶」 |
| `windy` 大风 | 风助炉火（等同鼓风），起炉更顺 | **0** | **起炉**步目标区宽度 **+8%** | 可出 T3「风刃」 |
| `green_rain` 绿雨 | 桃源谷天象，非现实锻铁 | **0** | — | 可出 T4「灵锻」（仅绿雨） |

**无列出的效果 = 不生效**（例如雨天不再给全局 +5% 品质；暴风雨不再给 +3% 极品权重）。

UI：锻造面板顶栏显示当日天气 + 一行短提示（如「今日大风，起炉更顺手」）；若当日可出天气词条，显示「天象词条可铸」角标。

```ts
// src/data/forgeWeather.ts — 实现落表
export const FORGE_WEATHER_QUALITY_DELTA: Partial<Record<Weather, number>> = {
  sunny: 0.02,
  snowy: -0.02
}
export const FORGE_WEATHER_MINIGAME: Partial<Record<Weather, ForgeMinigameMod>> = { ... }
```

---

## 8. 词条系统（品质分档）

> **原则**：品质越高 → 可抽到的词条**种类越好**、**数值越高**；重刷只在**该件品质对应的池子**内换种类/数值，**不能**靠重刷升品质或升池。

### 8.1 数据结构（`src/data/affixes.ts`）

```ts
/** 词条稀有度层（决定最低打造品质） */
export type AffixTier = 1 | 2 | 3 | 4 // 凡 / 良 / 稀 / 传说

export interface AffixDef {
  id: string
  name: string
  description: string
  tier: AffixTier
  /** 可出现的装备类别 */
  categories: ('weapon' | 'hat' | 'shoe' | 'ring')[]
  /** 对齐现有战斗/生活系统 */
  effect:
    | { kind: 'equipment'; type: EquipmentEffectType; baseValue: number }
    | { kind: 'weapon_enchant'; enchantId: string } // 映射原 ENCHANTMENTS
  /** 低于此品质绝不进池 */
  minQuality: Quality
  /** 随机权重（同 tier 内） */
  weight: number
  /** 非空 = 仅当日天气匹配时进池（天气稀有词条） */
  requiredWeather?: Weather | null
}
```

### 8.2 品质 → 可抽词条层（种类挂钩）

| 打造品质 | 可抽 tier | 词条条数 | 说明 |
|----------|-----------|----------|------|
| 普通 normal | **仅 T1** | 1 | 弱属性：+2 攻、+3% 防、+5 生命等 |
| 优良 fine | T1～**T2** | 1 | 解锁中等词条：+5% 暴击、挖矿体力 -5% 等 |
| 精品 excellent | T1～**T3** | 1 | 可出原「附魔」档（锋利/精准等）；T3 低权重 |
| 极品 supreme | T1～**T4** | **2** | 第二槽仅 T3～T4；吸血/幸运强化版仅 T4 |

**T4 示例（仅 supreme 池，且多为第二槽）**：吸血 18%、幸运 +25% 掉落、全技能 +3、旅行速度 +20% 等——数值显著高于 T1 同名效果。

武器附魔（锋利/炽热/精准/吸血/坚韧/幸运）拆进词条表：**T3 起**进池（精品可低概率出），**T4** 为强化数值版。

### 8.3 数值挂钩（同一条词条随品质变强）

在选中 `affixId` 后，最终数值：

```text
rolledValue = round( affix.baseValue × AFFIX_QUALITY_MULT[quality] × (1 + forgingLevel × 0.01) )
```

| 品质 | AFFIX_QUALITY_MULT |
|------|---------------------|
| 普通 | 1.00 |
| 优良 | 1.15 |
| 精品 | 1.35 |
| 极品 | 1.60 |

示例（T2 `attack_bonus`，baseValue = 3 表示 +3 攻）：

| 品质 | 实际 +攻击 |
|------|------------|
| 普通 | （不进 T2 池） |
| 优良 | +3 |
| 精品 | +4 |
| 极品 | +5 |

武器 `weapon_enchant` 类词条：`baseValue` 映射 `ENCHANTMENTS.attackBonus` / `critBonus`，同样 × `AFFIX_QUALITY_MULT`。

### 8.4 Roll 流程

```text
rollAffixes(category, quality, forgingLevel, weather):
  1. pool = AFFIXES.filter(a =>
       a.categories includes category &&
       a.tier <= MAX_TIER_FOR_QUALITY[quality] &&
       a.minQuality <= quality &&
       (!a.requiredWeather || a.requiredWeather === weather))
  2. slotCount = AFFIX_SLOTS[quality]  // supreme → 2
  3. 对每个 slot 加权随机 affixId（同件不重复，除非池耗尽）
  4. 对每个 affix 计算 rolledValue（§8.3）
  5. 写入实例 affixes: { id, rolledValue }[]；记录 forgedWeather 供展示
```

**重刷**：`requiredWeather` 词条 **不会** 在重刷日天气不符时进池（与打造当日一致，实例存 `forgedWeather` 仅展示用，重刷用 **当前** 天气）。

`MAX_TIER_FOR_QUALITY`：`normal→1, fine→2, excellent→3, supreme→4`。

### 8.5 重刷

- `rerollAffixes(instance)`：**品质、rolledAttack、底材 effects 不变**。
- 重抽仅在本件 `quality` 对应的 **tier 上限与 slot 数** 内换词条 id / rolledValue。
- 材料：铜钱 + 锭/木炭（`enchanter` 专精 -20%）。
- **不重新玩小游戏**。

### 8.6 与旧「附魔」、商店装

| 来源 | 规则 |
|------|------|
| 打造武器 | 统一 `affixes[]`；**不写** `enchantmentId` |
| 商店/掉落武器 | 仍用 `enchantmentId`（只读） |
| Boss 固定附魔 | 不变、不可重刷 |
| 战斗聚合 | `getWeaponAttack()` 等：底材攻击 + rolledAttack + **sum(affix)** + 旧附魔兼容层 |

### 8.7 UI 展示

- 名称示例：`精品 铁刀「锋利」`（品质色 + 底材名 + 词条名）
- 极品双词条：`极品 碧灵指环「幸运 · 渔翁」`
- 词条 tooltip 显示 tier 色边（T1 灰 / T2 绿 / T3 蓝 / T4 金）
- 天气词条名称旁显示天气图标（如 ⚡ 雷淬）

### 8.8 词条总表（`affixes.ts` 预备）

> 全部 `effect.type` 对齐 `EquipmentEffectType` 或 `weapon_enchant` → `ENCHANTMENTS`；实现时 `baseValue` 为 **优良品质 1.0×** 基准，再乘 §8.3 品质系数。

#### T1 — 凡（`minQuality: normal`，全品类均衡）

| id | 名 | 效果 | baseValue | 适用 |
|----|-----|------|-----------|------|
| `t1_attack` | 微锋 | `attack_bonus` | 2 | 武器、戒 |
| `t1_defense` | 薄盾 | `defense_bonus` | 0.03 | 帽、鞋、戒 |
| `t1_hp` | 固元 | `max_hp_bonus` | 5 | 帽、戒 |
| `t1_stamina` | 省力 | `stamina_reduction` | 0.03 | 鞋、戒 |
| `t1_mining` | 矿手 | `mining_stamina` | 0.03 | 戒、帽 |
| `t1_fishing` | 溪钓 | `fishing_stamina` | 0.03 | 戒、帽 |
| `t1_farm` | 锄痕 | `farming_stamina` | 0.03 | 戒、帽 |
| `t1_luck` | 小吉 | `luck` | 0.03 | 戒 |

#### T2 — 良（`minQuality: fine`）

| id | 名 | 效果 | baseValue | 适用 |
|----|-----|------|-----------|------|
| `t2_attack` | 锐刃 | `attack_bonus` | 3 | 武器、戒 |
| `t2_crit` | 疾击 | `crit_rate_bonus` | 0.05 | 武器、戒 |
| `t2_defense` | 铁壁 | `defense_bonus` | 0.05 | 帽、鞋、戒 |
| `t2_hp` | 健魄 | `max_hp_bonus` | 15 | 帽、戒 |
| `t2_mining` | 矿工 | `mining_stamina` | 0.05 | 戒、帽 |
| `t2_fishing` | 渔翁 | `fishing_stamina` | 0.05 | 戒、帽 |
| `t2_farming` | 耕夫 | `farming_stamina` | 0.05 | 戒、帽 |
| `t2_travel` | 轻足 | `travel_speed` | 0.08 | 鞋 |
| `t2_sell` | 通商 | `sell_price_bonus` | 0.03 | 戒 |
| `t2_crop_quality` | 粒满 | `crop_quality_bonus` | 0.04 | 戒、帽 |
| `t2_fish_calm` | 稳竿 | `fishing_calm` | 0.05 | 戒、帽 |
| `t2_luck` | 吉兆 | `luck` | 0.05 | 戒 |
| `t2_treasure` | 洞感 | `treasure_find` | 0.05 | 戒、帽 |
| `t2_gift` | 礼意 | `gift_friendship` | 0.06 | 戒 |
| `t2_shop` | 还价 | `shop_discount` | 0.02 | 戒 |
| `t2_stamina` | 轻身 | `stamina_reduction` | 0.05 | 鞋、帽、戒 |

#### T3 — 稀（`minQuality: excellent`）

| id | 名 | 效果 | baseValue / 映射 | 适用 |
|----|-----|------|------------------|------|
| `t3_sharp` | 锋利 | `weapon_enchant` → `sharp` | ENCHANTMENTS | 武器 |
| `t3_fierce` | 炽热 | `weapon_enchant` → `fierce` | ENCHANTMENTS | 武器 |
| `t3_precise` | 精准 | `weapon_enchant` → `precise` | ENCHANTMENTS | 武器 |
| `t3_vampiric` | 吸血 | `vampiric` / `weapon_enchant` | 0.10 | 武器、帽、鞋 |
| `t3_sturdy` | 坚韧 | `weapon_enchant` → `sturdy` | ENCHANTMENTS | 武器、帽 |
| `t3_lucky` | 幸运 | `monster_drop_bonus` | 0.12 | 武器、戒、鞋 |
| `t3_exp` | 勤学 | `exp_bonus` | 0.05 | 戒、帽 |
| `t3_ore` | 探矿 | `ore_bonus` | 1 | 戒、帽 |
| `t3_treasure` | 寻宝 | `treasure_find` | 0.08 | 戒、鞋 |
| `t3_fish_quality` | 鲜鳞 | `fish_quality_bonus` | 0.06 | 戒、帽 |
| `t3_crop` | 丰壤 | `crop_growth_bonus` | 0.06 | 戒、帽 |
| `t3_gift` | 善缘 | `gift_friendship` | 0.10 | 戒 |
| `t3_shop` | 精打细算 | `shop_discount` | 0.04 | 戒 |
| `t3_stamina` | 逸步 | `stamina_reduction` | 0.08 | 鞋、帽 |
| `t3_crop_quality` | 穗丰 | `crop_quality_bonus` | 0.06 | 戒、帽 |
| `t3_fish_calm` | 定波 | `fishing_calm` | 0.08 | 戒、帽 |
| `t3_miner_kit` | 矿脉 | `ore_bonus` 1 + `mining_stamina` 0.06 | 双效 | 戒、帽 |
| `t3_angler_kit` | 江潮 | `fish_quality_bonus` 0.06 + `fishing_calm` 0.06 | 双效 | 戒、帽 |
| `t3_merchant_kit` | 货郎 | `sell_price_bonus` 0.04 + `shop_discount` 0.03 | 双效 | 戒 |
| `t3_warrior_kit` | 战意 | `attack_bonus` 4 + `crit_rate_bonus` 0.04 | 双效 | 武器、戒 |
| `t3_foraging` | 樵夫 | `foraging_stamina` | 0.06 | 戒、帽 |
| `t3_forging_exp` | 锤音 | `forging_exp_bonus` | 0.08 | 戒、帽 |

#### T4 — 传说（`minQuality: supreme`，多为极品第二槽）

| id | 名 | 效果 | baseValue / 映射 | 适用 |
|----|-----|------|------------------|------|
| `t4_sharp` | 极锋 | `weapon_enchant` → `sharp` | 攻 +4 档 | 武器 |
| `t4_fierce` | 熔火 | `weapon_enchant` → `fierce` | 攻 +7 档 | 武器 |
| `t4_precise` | 神准 | `crit_rate_bonus` | 0.12 | 武器、戒 |
| `t4_vampiric` | 嗜血 | `vampiric` | 0.18 | 武器、帽、鞋 |
| `t4_sturdy` | 金刚 | `defense_bonus` | 0.15 | 帽、武器 |
| `t4_lucky` | 天眷 | `monster_drop_bonus` | 0.25 | 戒、鞋 |
| `t4_exp` | 顿悟 | `exp_bonus` | 0.08 | 戒、帽 |
| `t4_travel` | 神行 | `travel_speed` | 0.20 | 鞋 |
| `t4_luck` | 鸿运 | `luck` | 0.12 | 戒 |
| `t4_harvest` | 丰年 | `crop_quality_bonus` + `crop_growth_bonus` | 0.08 / 0.08 | 戒、帽 |
| `t4_fishing_calm` | 静水 | `fishing_calm` | 0.12 | 戒、帽 |
| `t4_foraging` | 山行 | `foraging_stamina` | 0.10 | 戒、帽、鞋 |
| `t4_forging_exp` | 百炼心 | `forging_exp_bonus` | 0.15 | 戒、帽 |

**权重（同 tier 内默认）**：T1/T2 `weight: 10`；T3 附魔类 `6`、生活类 `8`、双效套装 `5`；T4 `4`；天气词条见 §8.9。

### 8.10 新增效果类型（v1 锻造同期接线）

扩展 `EquipmentEffectType`（`src/types/ring.ts`）：

| type | 读取位置 | 说明 |
|------|----------|------|
| `foraging_stamina` | `ForageView` / 采集扣体 | 仿 `farming_stamina`：`cost × (1 - bonus)` |
| `forging_exp_bonus` | `useForgeStore` / `useSkillStore.addExp('forging')` | 仅锻造技能经验；与泛 `exp_bonus` 叠加 |

打造装词条经 `getEquipmentBonus` 聚合（与戒/帽/鞋底材一致）；武器 affix 若含生活类效果，仅在对应玩法生效（机制绑定 §7.5）。

### 8.9 天气稀有词条

仅 `requiredWeather` 匹配 **打造当日** `gameStore.weather` 时进池；最低 **精品**（`minQuality: excellent`），T4 需 **极品** 或第二槽。

| id | 名 | tier | 天气 | 效果 | baseValue | 适用 | weight |
|----|-----|------|------|------|-----------|------|--------|
| `wx_solar` | 烈阳 | T3 | `sunny` | `attack_bonus` | 5 | 武器、戒 | 6 |
| `wx_rain_quench` | 雨淬 | T3 | `rainy` | `defense_bonus` | 0.10 | 武器、帽、戒 | 6 |
| `wx_snow_crystal` | 雪晶 | T3 | `snowy` | `max_hp_bonus` | 20 | 帽、戒、鞋 | 6 |
| `wx_gale_edge` | 风刃 | T3 | `windy` | `crit_rate_bonus` | 0.08 | 武器、鞋 | 6 |
| `wx_thunder` | 雷淬 | T4 | `stormy` | `weapon_enchant` → `fierce` + 额外 `crit_rate_bonus` | 0.06 | 武器 | 3 |
| `wx_green_spirit` | 灵锻 | T4 | `green_rain` | `luck` + `exp_bonus` | 0.10 / 0.05 | 全品类 | 3 |

叙事：雷淬 = 暴风雨夜炉旁惊雷，淬火刹那电光；灵锻 = 绿雨浸润金属，桃源灵气入刃。

**与普池关系**：天气词条 **额外** 进池，不替换普池；精品日晴打造 = 普池 T1～T3 + 可能出「烈阳」。暴风雨未出极品时仍 **不能** 出雷淬。

---

## 9. 配方与入口

### 9.1 现网：配方/图纸怎么来（实现前对照）

> 锻造系统 **尚未实装**；以下为 `src/` 当前行为，避免与规划混淆。

| 类别 | 入口 | 解锁条件 | 数据锚点 |
|------|------|----------|----------|
| **戒/帽/鞋 · 快捷合成** | 铁匠铺 `ShopView` 合成区 | `recipe !== null` 的 **全部一开始就显示**，无等级/NPC 门槛 | `CRAFTABLE_RINGS` / `CRAFTABLE_HATS` / `CRAFTABLE_SHOES` |
| **戒/帽/鞋 · 直购** | 铁匠铺（部分） | `shopPrice !== null` 且未拥有；**无解锁** | `hats.ts` / `shoes.ts` / `rings.ts` |
| **武器 · 购买** | **镖局**（云飞），非铁匠铺 | `shopPrice !== null` 共 11 把；铜钱 + 可选矿石材料；每把 **限购 1** | `SHOP_WEAPONS` ← `weapons.ts` |
| **武器 · 掉落** | 矿洞怪物 | 按层区 `MONSTER_DROP_WEAPONS` 概率；Boss 固定 `fixedEnchantment` | `weapons.ts` |
| **Boss 戒帽鞋** | 掉落 | `recipe: null`，**不可合成** | 各 `obtainSource: 'BOSS掉落…'` |
| **矿石/锭/木炭** | 铁匠铺货架 | 营业即买 | `useShopStore.blacksmithItems` |
| **工具升级** | 工坊 `ToolUpgradeView` | 有 `TOOL_UPGRADE_COSTS` 下一档即显示；**暂无技能门槛**（本文 §6.3 将改） | `upgrades.ts` |
| **烹饪食谱** | 厨房 | `useCookingStore.unlockedRecipes`；初始约 17 道 + 结婚/节日/NPC/成就等 `unlockRecipe` | `recipes.ts` + `useEndDay.ts` |
| **加工配方** | 工坊机器 | 放置对应机器后 **全配方可见**，无单独解锁表 | `processing.ts` `getRecipesForMachine` |

**要点**：现网装备「配方」= 数据表里写了 `recipe` 或 `shopPrice`，**没有** `unlockedForgeRecipes` 一类存档；铁匠铺合成与锻造是两套逻辑（后者待建）。

### 9.2 规划总览（图纸驱动）

锻造 **不再** 开局全开；玩家持有 **图纸**（背包物品 `blueprint_*` 或存档 `unlockedRecipeIds`）后，对应配方才进 `ForgeView`。

| 配方类型 | 说明 |
|----------|------|
| **单品图纸** | 解锁 1 条 `ForgeRecipeDef` |
| **套装图纸** | 一次解锁该套 **全部件** 的锻造配方（3～4 条） |

解锁渠道（详见 §9.9～§9.12）：孙铁匠 **商店购买**、**好感赠送**、**请教**、铁匠任务、**矿洞怪物/宝箱随机掉落**、**Boss 首杀**、其他 NPC 好感。

未解锁：锻造列表不显示（或灰显 + 来源提示）。**快捷合成** §9.6 仍不要求图纸。

### 9.3 数据来源（实现）

| 文件 | 职责 |
|------|------|
| `src/data/forge.ts` | `ForgeRecipeDef`、`FORGE_RECIPES` |
| `src/data/forgeBlueprints.ts` | 图纸定义、商店价、掉落池、好感赠送表 |
| `src/data/forgeSets.ts` | 套装锻造扩展（`setId`、固定词条、新增件 def） |
| `src/data/affixes.ts` | §8.8～§8.10 |
| `src/data/forgeWeather.ts` | §7.4 |
| `src/data/equipmentSets.ts` | 扩展现网 14 套 + 新增套；**一次实装** |
| `useForgeStore.ts` | `unlockedRecipeIds`、`defeatedBossFloors`、`learnBlueprint()` |

### 9.4 UI

- **入口**：铁匠铺 `ShopView` 新页签「锻造」，或路由 `/forge`（`game-panel` 风格）。
- 子页签：武器 / 防具（帽鞋戒） / 工具 / 词条重刷（选中背包打造品）。
- 孙铁匠立绘 + 阿铁客串台词（好感高时小游戏目标区加宽提示）。

### 9.5 并行路径

| 路径 | 定位 |
|------|------|
| 亲手打造 | 最高品质/词条/custom；消耗材料 + 小游戏 |
| 镖局购武 | 快、稳定、无词条；前期过渡 |
| 掉落/Boss | 固定强装、叙事奖励 |
| **弱化快捷合成** | 见 §9.6 |

### 9.6 弱化快捷合成（保留）

**范围**：铁匠铺 `ShopView` 现有 **戒指 / 帽子 / 鞋子** 一键合成（`craftRing` / `craftHat` / `craftShoe`），**不删、不强制跳转锻造**。

| 维度 | 弱化合成 | 亲手锻造 |
|------|----------|----------|
| 小游戏 | ❌ | ✅ 起炉/锻打/淬火 |
| 品质 | 无（等同表内 `effects` 固定档） | ✅ normal～supreme |
| 词条 | ❌ | ✅ |
| 材料 | 配方材料 × **0.85**（约省 15%） | 全价配方 |
| 铜钱 | 不变或略低（实现时二选一，默认不变） | 按 `forge.ts` |
| `forging` 经验 | **0**（或 2，实现取 0 以拉开差距） | 10～35 |
| 锻造等级 | **不要求** | 按配方 `requiredForgingLevel` |
| UI 文案 | 页签标注「快捷合成」；锻造页签引导「更高品质请去锻造」 | — |

**设计意图**：前期省材料赶进度；中后期追求极品/双词条走锻造。武器 **不在** 弱化合成内（仍在镖局购武 + 锻造）。

实现：`ShopView` 合成扣料时用 `ceil(qty × 0.85)`；逻辑仍走 `useInventoryStore.craft*`，产出仍为 `defId` 无实例层。

### 9.7 数据结构（图纸 + 套装配方）

```ts
/** 图纸（消耗品或学习后记入存档） */
interface ForgeBlueprintDef {
  id: string
  name: string
  kind: 'single' | 'set'
  /** 学习后写入 useForgeStore.unlockedRecipeIds */
  unlocksRecipeIds: string[]
  setId?: string // kind=set 时必填，对应 equipmentSets.id
  description: string
}

interface ForgeRecipeDef {
  id: string
  category: 'weapon' | 'hat' | 'shoe' | 'ring'
  targetDefId: string
  setId: string | null // 套装件必填
  ingredients: { itemId: string; quantity: number }[]
  moneyCost: number
  requiredForgingLevel: number
  tier: 1 | 2 | 3 | 4 // 铜铁金晶，影响经验与材料档
  /** 套装打造：第 1 词条槽固定，不随机（极品第 2 槽仍 roll） */
  fixedAffixId?: string
  /** 非套装：按 §8 roll；套装：fixed + 可选第 2 槽 */
  isSetPiece: boolean
}

/** 存档 */
interface ForgeProgress {
  unlockedRecipeIds: string[]
  defeatedBossFloors: number[] // 20,40,… 首杀标记
  sunBlueprintShopPurchased: string[] // 防重复购
}
```

**学习图纸**：`learnBlueprint(blueprintId)` → 合并 `unlocksRecipeIds` → 可选消耗背包图纸物品 → 弹窗「领悟了 XXX」。

### 9.8 套装锻造规则

1. **套装效果**：仍读 `equipmentSets.ts` 的 `bonuses`；`_getSetPieceCount` 扩展为：
   - 已装备实例 `setId === set.id` → 计 1 件；或
   - `defId` 落在 `set.pieces`（兼容旧掉落成品）。
2. **固定词条**：`isSetPiece && fixedAffixId` → 结算时 **槽 1** 必为该词条（数值仍乘品质 §8.3）；非极品仅 1 槽；极品槽 2 正常 roll（可出天气/双效，但不含覆盖固定槽）。
3. **打造 vs 掉落**：同 `setId` 可并存；打造版品质/词条可更强，套装件数 **合计** 不重复计数同槽位。
4. **公会勇士套** `guild_champion_set`：**不可锻造**（无图纸），保持公会专属。

#### 固定词条约定（套装件 · 槽 1）

| 套系 | fixedAffixId | 主题 |
|------|--------------|------|
| 匠师 `master_smith_set` | `t3_forging_exp` | 锻造经验 |
| 生活套（樵采/灶火/茶禅/行镖/炉工/公祠） | 见 §9.13 表 | 对应 `*_stamina` / 技能向 |
| Boss 套 | 见 §9.13 | 战斗或区域主题（如冰后 `t3_fish_calm`） |
| 现网 14 套 | 各套 1 个 T2～T3 代表词条 | 如矿工 `t2_mining`、渔夫 `t2_fishing` |

### 9.9 图纸获取渠道（总表）

| 渠道 | 触发 | 典型内容 |
|------|------|----------|
| **孙铁匠商店** | 相识起；铜钱购买 | 铜/铁 **单品** 图纸（§9.10） |
| **孙铁匠好感** | 达标对话自动送 | 单品包 → **挚友匠师套装** |
| **阿铁好感** | 友好+ | 戒指单品线图纸（不抢匠师套） |
| **请教** §10.2 | 课目 | 开炉铜戒、Lv3 武器等（等同免费图纸） |
| **铁匠任务** | 交付 | 指定 `blueprintId` 或 `recipeId` |
| **矿洞怪物** | 击杀 roll | 按层段池 §9.11；受 `treasure_find` 微加成 |
| **矿洞宝箱** | 开启 | 图纸权重 ×3～×5 |
| **Boss 首杀** | `defeatedBossFloors` 写入 | **整套套装图纸** §9.12 |
| **其他 NPC** | 好感/任务 | 生活套图纸 §9.13 |
| **功勋商店** | 功勋兑换 | 公祠丰收套图纸（可选） |

### 9.10 孙铁匠 / 阿铁（好感阈值同全局：相识 500 / 友好 1000 / 挚友 2000）

#### 孙铁匠 · 商店（相识起，铁匠铺「图纸」子页）

| 图纸 id | 价 | 解锁配方 |
|---------|-----|----------|
| `bp_shop_copper_ring` | 200 | 铜素戒 ×1 |
| `bp_shop_copper_band` | 250 | 铜护戒 ×1 |
| `bp_shop_straw_hat` | 150 | 草帽打造（等同 `straw_hat`） |
| `bp_shop_copper_sword` | 400 | 铜剑锻造 |
| `bp_shop_miner_ring` | 600 | 矿工戒单品（`miners_ring`） |
| `bp_shop_iron_blade` | 1200 | 铁刀（友好后上架） |
| `bp_shop_merchant_ring` | 1500 | 商贾戒（友好后上架） |

#### 孙铁匠 · 好感赠送

| 好感 | 赠送 |
|------|------|
| 相识 | 对话送 `bp_gift_copper_pack`（铜戒+铜帽单品） |
| 友好 | `bp_gift_iron_weapon` + `bp_gift_miner_set_partial`（矿工套戒+帽单品图，鞋需矿洞掉） |
| 挚友 | **`bp_gift_master_smith_set`**（匠师 **4 件套** 套装图纸，含可选匠锤武） |

#### 阿铁 · 好感赠送

| 好感 | 赠送 |
|------|------|
| 相识 | `bp_a_tie_practice_ring`（练习铜戒） |
| 友好 | `bp_a_tie_fine_rings`（2 枚铁戒单品图） |
| 挚友 | 不送套装（终奖归孙铁匠）；送 `bp_a_tie_reroll_kit` 材料包 + 心传课 T4 权重 |

### 9.11 矿洞随机图纸掉落

**物品**：`blueprint_scroll` 开卷后 `learnBlueprint`（或直接掉 named blueprint 物品）。

| 层段 | 区域 | 怪物掉率（基础） | 宝箱 | 图纸池（权重） |
|------|------|------------------|------|----------------|
| 1～19 | 浅层 | 0.8% | 4% | 铜单品；`miner_set` 单品；`forager_set` 单品 |
| 20～39 | 泥岩/冰霜前 | 1.0% | 5% | 铁单品；`mud_king_set` **单品**（非整套）；渔夫/黑曜单品 |
| 40～59 | 冰霜/熔岩前 | 1.2% | 6% | 冰后单品；`frost_queen_set` 单品；战龙单品 |
| 60～79 | 熔岩/水晶前 | 1.2% | 6% | 熔岩单品；`lava_lord_set` 单品；凤凰/丰收单品 |
| 80～99 | 水晶/暗影前 | 1.5% | 8% | 晶王单品；`shadow_sovereign_set` 单品 |
| 100～119 | 深渊前 | 1.5% | 8% | 暗影君主单品；高锭单品 |
| 120 | 龙王前 | 不掉整套 | — | 仅材料；**龙王套整套仅 Boss 首杀** |

`treasure_find` 每 10% 使掉率 ×1.08（上限 ×1.5）。

### 9.12 Boss 首杀 → 套装图纸（一次解锁全套锻造配方）

| 层 | Boss | 图纸 id | setId | 件数 |
|----|------|---------|-------|------|
| 20 | 泥岩巨兽 | `bp_boss_mud_king_set` | `mud_king_set` | 4（含新帽鞋，见 §9.13） |
| 40 | 冰霜女王 | `bp_boss_frost_queen_set` | `frost_queen_set` | **4**（纳入 `frost_queen_sting`） |
| 60 | 熔岩君主 | `bp_boss_lava_lord_set` | `lava_lord_set` | 4 |
| 80 | 水晶之王 | `bp_boss_crystal_king_set` | `crystal_king_set` | 4 |
| 100 | 暗影君主 | `bp_boss_shadow_sovereign_set` | `shadow_sovereign_set` | 4（与 `shadow_set` 小怪套区分） |
| 120 | 深渊龙王 | `bp_boss_dragon_king_set` | `dragon_king_set` | **4**（纳入 `abyss_dragon_mace`） |

首杀当下：弹窗 + 自动 `learnBlueprint`；存档 `defeatedBossFloors`。重复击杀不再给图纸。

### 9.13 套装全表（共 25 套：`equipmentSets` 现网 14 + 新增 11；一次实装）

> **可锻造** 24 套（除公会勇士、且每套有图纸链）；每套列出件、套装效果、固定词条、图纸主要来源。  
> 新增件写入 `hats.ts` / `shoes.ts` / `weapons.ts`（`recipe: null`，仅锻造产出）。

#### A. 现网生活/战斗套（14）— 扩展为可锻造

| setId | 名称 | 件（戒/帽/鞋/武） | 2件 / 3件 效果 | fixedAffix（槽1） | 图纸来源 |
|-------|------|-------------------|----------------|------------------|----------|
| `miner_set` | 矿工 | miners_ring / miner_helmet / miner_boots | 矿石+1 / 挖矿体-10% | `t2_mining` | 孙友好部分+矿洞1～39掉单品；友好送 2/3 |
| `fisher_set` | 渔夫 | anglers_ring / fisher_hat / fishing_waders | 鱼品质+10% / 钓鱼稳+10% | `t2_fishing` | 孙商店+秋月友好 `bp_fisher_partial` |
| `merchant_set` | 商贾 | merchants_ring / merchant_hat / merchant_boots | 售价+5% / 折扣+8% | `t2_sell` | 孙商店+友好 |
| `harvest_set` | 丰收 | harvest_moon_ring / jade_hairpin / silk_slippers | 生长+10% / 品质+10% | `t2_crop_quality` | 矿洞60～79+农任务 |
| `dragon_warrior_set` | 战龙 | warlord_ring / dragon_helm / dragon_scale_boots | 攻+3 / 暴+10% | `t2_attack` | 锻造 Lv8+；矿洞40～59 |
| `obsidian_set` | 黑曜 | stalwart_ring / obsidian_helm / obsidian_greaves | HP+20 / 防+10% | `t2_defense` | 矿洞20～59掉单品 |
| `phoenix_set` | 凤凰 | fortune_ring / phoenix_crown / phoenix_boots | 幸运+5% / 经验+15% | `t3_exp` | 锻造 Lv12+；矿洞60～79 |
| `shadow_set` | 暗影 | shadow_ring / shadow_mask / shadow_striders | 吸血+5% / 掉落+15% | `t3_vampiric` | 暗影层怪物掉 **单品图**（非君主套） |
| `frost_queen_set` | 冰后 | frost_queen_circlet / frost_queen_tiara / frost_queen_slippers / **frost_queen_sting** | 2:钓鱼稳+10%；3:掉落+10%；**4:鱼品质+12%** | `t3_fish_calm` | **Boss40 整套**；40～59掉单品 |
| `dragon_king_set` | 龙王 | abyss_dragon_ring / abyss_dragon_horns / abyss_dragon_treads / **abyss_dragon_mace** | 2:攻+5；3:吸血+8%&防+8%；**4:攻+6** | `t3_lucky` | **Boss120 整套** |
| `forest_hunter_set` | 竹林猎手 | wolf_fang_pendant / wolf_pelt_hood / bear_pelt_boots | 攻+3 / 暴+8%&掉落+10% | `t2_crit` | 竹林野兽材料任务解锁图纸 |
| `beast_king_set` | 兽王 | tiger_fang_ring / tiger_pelt_cape / bear_pelt_boots | 攻+5 / 吸血+6%&防+8% | `t3_vampiric` | 兽王事件解锁整套图 |
| `guild_champion_set` | 公会勇士 | guild_war_ring / guild_war_helm / guild_war_boots / guild_war_blade | 2:攻+3；3:防&HP；4:吸血&暴 | — | **不可锻造** |

#### B. Boss 补全套（5 套新 setId）

| setId | 名称 | 件 | 2件 / 3件 / 4件 | fixedAffix | 新增 defId |
|-------|------|-----|-------------------|------------|------------|
| `mud_king_set` | 泥岩王 | mud_golem_band / **mud_crown** / **mud_stride_boots** / mud_king_fang | 体减+5% / 挖矿体-12% / 4:防+8% | `t2_stamina` | `mud_crown`, `mud_stride_boots` |
| `lava_lord_set` | 熔岩君主 | lava_lord_seal / **lava_lord_crown** / lava_lord_greaves / lava_lord_maul | 攻+4 / 吸血+6% / 4:暴+8% | `t3_fierce`（武）或 `t3_vampiric` | `lava_lord_crown` |
| `crystal_king_set` | 晶王 | crystal_king_seal / crystal_king_crown / **crystal_step_boots** / crystal_king_blade | 经验+8% / 幸运+6% / 4:经验+12% | `t3_exp` | `crystal_step_boots` |
| `shadow_sovereign_set` | 暗影君主 | shadow_sovereign_ring / **shadow_sovereign_veil** / shadow_sovereign_treads / shadow_sovereign_fang | 暴+8% / 吸血+6% / 4:掉落+12% | `t3_precise` | `shadow_sovereign_veil` |
| （冰后/龙王见上） | | | | | |

#### C. 生活机制套（7 套新）

| setId | 名称 | 件 | 2件 / 3件 效果 | fixedAffix | 图纸来源 |
|-------|------|-----|------------------|------------|----------|
| `master_smith_set` | **匠师** | **smith_mastery_ring** / **smith_apron** / **smith_sole** / **smith_hammer**（武） | 锻造经验+8% / 材料-10% / 4:锻造经验+15% | **`t3_forging_exp`** | 孙铁匠 **挚友** |
| `forager_set` | 樵采 | **forager_ring** / **forager_hood** / **forager_boots** | 采集体-8% / 采集体-12% / 3:`luck`+5% | `t3_foraging` | 林老友好；浅层矿洞掉 |
| `hearth_set` | 灶火 | **hearth_ring** / **hearth_cap** / **hearth_slippers** | 食物恢复+10% / 经验+8% / 3:烹饪相关 buff 延长 1 日（接烹饪 store） | `t3_exp` | 客栈厨师友好 |
| `tea_zen_set` | 茶禅 | **tea_ring** / **tea_hat** / **tea_shoes** | 送礼好感+8% / 幸运+6% / 3:斗茶分数 +5%（接茶小游戏） | `t2_gift` | 茶庄 NPC 相识起任务链 |
| `escort_set` | 行镖 | **escort_ring** / **escort_headband** / **escort_boots** | 旅行速度+10% / 攻+3 / 3:体减+5% | `t2_travel` | 云飞友好 |
| `furnace_set` | 炉工 | **furnace_ring** / **furnace_mask** / **furnace_boots** | 矿石+1 / 挖矿体-8% / 3:加工产出 +10%（接 `processing`） | `t3_ore` | 阿石友好；熔炉旁宝箱 |
| `shrine_harvest_set` | 公祠丰收 | **shrine_ring** / **shrine_hat** / **shrine_shoes** | 生长+8% / 品质+8% / 3:售价+5% | `t2_crop_quality` | 祠堂任务×10 或功勋商店 |

**新增 def 合计**：Boss 线 5 件 + 生活线 22 件 + 匠师 4 件 ≈ **31** 个新 `defId`（与现网件共用 setId 的不重复建表）。

### 9.14 准备页 · 一键穿戴整套

| 位置 | 行为 |
|------|------|
| 背包 `InventoryView` | 套装区显示进度 `2/4`；按钮 **「穿戴整套」** |
| 矿洞 `MiningView` | 装备与状态区同按钮；可写入 `equipmentPresets` |
| 逻辑 `equipSet(setId)` | 每槽选背包中该 `setId` **品质最高** 实例（武器→戒→帽→鞋顺序装备） |
| 缺件 | 灰显，提示缺件名 + 图纸来源（读 `forgeBlueprints` 反查） |
| 与方案 | 一键穿戴后可提示「是否保存为装备方案」；复用 `createEquipmentPreset` |

`applyEquipmentPreset` 保持不变；新增 `equipSet` 不强制覆盖已有 preset。

### 9.15 其他 NPC 图纸（简表）

| NPC | 好感 | 图纸 |
|-----|------|------|
| 林老 `lin_lao` | 友好 | `bp_lin_forager_set`（樵采 3 件套） |
| 云飞 `yun_fei` | 友好 | `bp_yun_escort_set` |
| 阿石 `a_shi` | 友好 | `bp_shi_furnace_set` |
| 客栈厨 | 友好 | `bp_cook_hearth_set` |
| 茶庄 | 相识链 | `bp_tea_zen_set` |
| 柳村长 / 祠堂 | 任务 | `bp_shrine_harvest_set` |

---

## 10. 锻造经验：打造 + 请教 + 铁匠任务

```text
                    ┌─ 当场打造（小游戏结算）──→ forging 经验（主来源）
                    │
铁匠铺 ForgeView ───┼─ 对话请教（孙/阿铁）────→ forging 经验 + 配方/技巧解锁
                    │
                    └─ 铁匠任务板（店内独立）──→ forging 经验 + 铜钱/好感/材料
```

三者 **叠加**，互不替代；与全村「告示栏」`QuestView` / `useQuestStore` **分离**（不占 `MAX_ACTIVE_QUESTS=3`）。

### 10.1 打造经验（实操）

| 行为 | 经验（草案） | 机制锚点 |
|------|-------------|----------|
| 完成武器打造 | 15～35（按配方 `tier`） | `useForgeStore.completeForge` |
| 完成帽/鞋/戒打造 | 10～25 | 同上 |
| 工具当场升档 | 15 | `useForgeStore.upgradeTool` 结算 |
| 词条重刷 | 3 | `rerollAffixes` |
| 小游戏全 perfect | 额外 +10 | `forgeScore` 段 |
| 品质加成 | 优良 +5 / 精品 +10 / 极品 +20 | 结算时叠加上表 |

公式：`skillStore.addExp('forging', amount)`；受戒指 `exp_bonus`、功勋加成与 `apprentice` 专精影响。

**解锁**：`forging` 技能在玩家完成孙铁匠 **首次请教「开炉」** 后从 0 级可见（见 §10.2）。

### 10.2 对话请教

**入口**：铁匠铺 `ForgeView` 或 `NpcView` 选中孙铁匠/阿铁 → **「请教」**（铁匠铺营业时间内；孙：周日店休，阿铁：周日可在场）。

| 规则 | 说明 |
|------|------|
| 频次 | 每游戏日 **1 次**请教经验（孙、阿铁共享计数，做过了今日不能再领经验） |
| 内容 | 短对话 2～4 句 + 1 个锻造技巧 tip（显示在请教弹窗，非系统任务） |
| 经验 | 20～50，按 `lessonIndex` 递增；重复课目降为 15 |
| 解锁 | 配方、小游戏目标区预览圈（阿铁好感友好+）、词条池 T3 预览说明 |

**课表**（`src/data/forgeLessons.ts`，按 `forgingLevel` 门槛）：

| 门槛 | 导师 | 主题 | 解锁 |
|------|------|------|------|
| Lv0 首次 | 孙铁匠 | 开炉 | 锻造面板、铜级戒指配方 |
| Lv3 | 孙铁匠 | 火候 | 武器打造配方×1 |
| Lv5 | 阿铁 | 落锤 | 小游戏目标区 +5% 宽（被动，存 `useForgeStore`） |
| Lv8 | 孙铁匠 | 淬火 | 优良品质权重 +3%（被动） |
| Lv10 | 阿铁 | 识纹 | 重刷词条功能说明 + 帽配方 |
| Lv15 | 孙铁匠 | 百炼 | 精品配方 |
| Lv18 | 阿铁 | 心传 | 阿铁好感挚友时 T4 词条权重 +5% |

实现：`useForgeStore.attendLesson(npcId)` → 检查 `lastLessonDay < gameDay` → 弹 `ForgeLessonDialog` → 写 `lessonsSeen[]`、解锁配方 id、`addExp('forging')`。

**与好感**：请教 **不替代** 送礼/对话好感；可选每次请教 +3 好感（同 NPC 每日上限内）。

### 10.3 铁匠任务（店内任务板）

**入口**：铁匠铺页签 **「任务」**（非导航栏告示栏）。

| 规则 | 说明 |
|------|------|
| 存储 | `useForgeStore.forgeBoardQuests` + `activeForgeQuests`（**独立**于 `useQuestStore`） |
| 刷新 | 每周一 + 首次进入铁匠铺时若板空则 roll 1 条；板上最多 **2 条**可接 |
| 并行上限 | 同时进行 **2 个**铁匠任务 |
| 期限 | 默认 **7 天**；过期失败，无罚金 |
| 奖励 | `forging` 经验 + 铜钱 + 可选材料；部分任务 +孙/阿铁好感 |

**任务类型**（`ForgeQuestType`，模板在 `src/data/forgeQuests.ts`）：

| 类型 | 说明 | 验收 |
|------|------|------|
| `forge_craft` | 亲手打造 N 次（可限品类） | `useForgeStore` 计数 `totalForges` |
| `forge_deliver` | 交付 1 件打造品（指定 def / 品类） | 背包实例 `crafted` 且 `quality >= minQuality` |
| `forge_reroll` | 重刷词条 N 次 | `affixRerollCount` |
| `forge_material` | 收集铜/铁锭等交给孙铁匠 | `removeCombinedItem` 同告示栏送货 |
| `forge_perfect` | 小游戏单步 perfect ≥2 次（1 次打造内） | `forgeScore` 分解记录 |

**发布者**：`issuerNpcId` 为 `sun_tiejiang` 或 `a_tie`；阿铁任务偏戒指/练习，孙铁匠偏武器与锭料。

**示例任务**：

| 描述 | 类型 | 经验 |
|------|------|------|
| 孙铁匠：打造 2 把铜剑 | forge_craft | 40 |
| 交付 1 件优良以上铁戒指 | forge_deliver | 55 |
| 帮阿铁重锻词条 3 次 | forge_reroll | 35 |
| 收集 10 铜锭 | forge_material | 30 |

完成：`turnInForgeQuest(id)` → 扣物品/校验计数 → `addExp('forging')` + 发奖。

### 10.4 三线经验占比（设计意图）

| 阶段 | 打造 | 请教 | 铁匠任务 |
|------|------|------|----------|
| 前期 Lv1～5 | 40% | 35% | 25% |
| 中期 Lv6～15 | 55% | 15% | 30% |
| 后期 Lv16～20 | 65% | 10% | 25% |

避免只靠刷请教升级；任务引导体验重刷、交付高品、多品类打造。

### 10.5 NPC 分工

| NPC | 请教 | 铁匠任务 | 其他 |
|-----|------|----------|------|
| 孙铁匠 | 配方/火候/百炼课 | 武器、锭料、高品交付 | 店休周日 |
| 阿铁 | 落锤/识纹/心传 | 戒指练习、重刷、perfect 挑战 | 好感解锁 T4 权重；可结婚 |

### 10.6 实现文件

| 文件 | 职责 |
|------|------|
| `src/data/forgeLessons.ts` | 请教课表 |
| `src/data/forgeQuests.ts` | 铁匠任务模板 + `generateForgeQuest()` |
| `src/data/forgeBlueprints.ts` | 图纸、商店、掉落池、好感表 §9.10～§9.15 |
| `src/stores/useForgeStore.ts` | 打造、图纸解锁、Boss 首杀、任务板 |
| `ForgeView.vue` | 打造 + 图纸商店 + 请教 + 任务 |
| `useMiningStore.ts` | Boss 首杀 → `learnBlueprint`；怪物/宝箱掉图纸 |
| `useInventoryStore.ts` | `equipSet(setId)`、套装计数 `setId` |
| `useEndDay.ts` | 铁匠任务过期（**不再**日结工具升级） |

---

## 11. 锻造专精回填（技能 spec §8.7）

当场锻造下，原占位「打造时间 -1 天」改为小游戏向：

| 等级 | ID | 修订效果 |
|------|-----|----------|
| 5 | apprentice | 锻造经验 +15% |
| 5 | merchant | 打造装备出售 +10% |
| 10 | smith_sword | 武器打造：小游戏目标区宽度 +20% |
| 10 | smith_tool | 工具升级材料消耗 **-20%**（当场升级向） |
| 10 | enchanter | 词条重刷材料 -20% |
| 10 | smith_armor | 帽/鞋/戒打造铜钱 -15% |
| 15/20 | *16 节点* | 实现前按 §8.0 机制绑定逐条填 |

定稿后 **回写** [技能树 spec](./2026-06-10-skill-tree-design.md) §8.7 树形与审计表。

---

## 12. 存档兼容

| 场景 | 处理 |
|------|------|
| 旧武器 `{ defId, enchantmentId }` | 保留；新打造用扩展结构 |
| 旧帽/鞋/戒仅 defId | 保留；新打造加 `craftedInstances[]` 或统一实例列表 |
| 缺 `forging` 技能 | 见技能 spec 迁移 |
| 缺打造配方解锁 | 仅「开炉」课 + 已持图纸对应配方 |
| 旧档 `pendingUpgrade` | 读档当场完成升档（§6.4） |
| 已击败 Boss 无图纸标记 | 读档补写 `defeatedBossFloors` 并 `learnBlueprint` 对应 Boss 套 |
| 快捷合成过的 defId | 可选：自动解锁同 def 单品锻造图（迁移友好） |

---

## 13. 待决

| # | 项 | 选项 / 默认 |
|---|-----|-------------|
| 1 | ~~词条 vs 旧附魔~~ | **已定**：打造装统一 `affixes[]`；附魔进 T3+ 词条池 |
| 2 | ~~词条条数~~ | **已定**：普通～精品 **1** 条；极品 **2** 条（第二槽 T3～T4） |
| 3 | ~~旧 ShopView 一键合成~~ | **已定**：保留弱化版（§9.6） |
| 4 | ~~工具升级~~ | **已定**：当场完成 + forging 等级门槛（§6.3） |
| 5 | ~~NPC 请教/任务~~ | **已定**：§10 三线经验；铁匠任务独立于告示栏 |
| 6 | ~~天气数值表~~ | **已定**：§7.4 品质/小游戏；§8.9 天气词条；`forgeWeather.ts` + `forge.test.ts` |
| 7 | ~~图纸与套装~~ | **已定**：§9.7～§9.15，25 套一次实装 |
| 8 | ~~锻造 spec 定稿~~ | **已定** → [implementation plan](../plans/2026-06-10-forging-implementation.md) |

---

## 14. 实现阶段预览（见 implementation plan）

| Phase | 内容 |
|-------|------|
| P1 | `forge.ts` + `forgeBlueprints.ts` + `useForgeStore`（图纸/配方/存档） |
| P2 | `useRhythmMinigame` + `ForgeMinigame.vue` |
| P3 | 品质/属性/词条 roll + `setId` / `fixedAffixId` + 战斗/装备读 affix |
| P4 | `equipmentSets` 扩表（25 套）+ 31 新 def + `equipSet` 一键穿戴 |
| P5 | 铁匠铺 UI（锻造/图纸店/重刷）+ 矿洞掉图 + Boss 首杀 |
| P6 | forging 经验三线 + 孙/阿铁好感图纸 + 其他 NPC 图纸 |
| P7 | 专精接入 + 技能 spec §8.7 回填 + 知识库 |

---

**Implementation plan:** [2026-06-10-forging-implementation.md](../plans/2026-06-10-forging-implementation.md)  
**技能树 §8.7 锻造专精** 已回填至 [技能树 spec](./2026-06-10-skill-tree-design.md)。
