# 锻造扩展 — 家造工坊 / NPC 请教 / 练习 / 体力时间

> 日期：2026-06-11  
> 前置：`2026-06-10-forging-design.md`  
> 状态：待实现

## 1. 目标摘要

| # | 需求 | 决策 |
|---|------|------|
| 1 | 锻造 Lv3+ 可在家建造锻造工坊 | 设施页建造；功能与铁匠铺「锻造工坊」一致 |
| 2 | 桃源村与孙铁匠/阿铁聊天增加「请教」 | 复用 `attendLesson`；与工坊请教 **共用每日 1 次** |
| 3 | 增加「练习」小游戏获经验；正式打造经验随 tier/品质提升 | 练习 **不耗材料**；经验按得分 + 专精 |
| 4 | 每次锻造/练习扣 **20 体力**、推进 **2 游戏小时** | 专精树调整为 **效率向**（省体/省时/经验） |

---

## 2. 家造锻造工坊

### 2.1 解锁与建造

- **条件**：锻造技能 **≥ Lv3**（`useSkillStore.getSkill('forging').level`）
- **入口**：`HomeView`（设施）新增「锻造工坊」卡片
- **存档字段**：`home.forgeWorkshopBuilt: boolean`（默认 `false`，旧档兼容）
- **建造费用（初版）**：
  - 铜钱 8000
  - 木材 ×30、铜锭 ×10、石头 ×50（与温室量级接近，可微调）
- **建造后**：设施页显示「进入锻造工坊」，嵌入 `ForgeView`（与 `ShopView` 相同组件）

### 2.2 入口矩阵（建造后）

| 入口 | 打造 | 练习 | 图纸店 | 请教 | 任务 | 重刷 | 工具 |
|------|------|------|--------|------|------|------|------|
| 铁匠铺·锻造工坊 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 设施·家造工坊 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 地图·工坊 | — | — | — | — | — | — | 仅工具升级 |

铁匠铺 **周日店休** 时，家造工坊仍可锻造（室内设施，不受孙铁匠营业影响）。图纸店 UI 仍显示孙铁匠价目，叙事上为「已购图纸在家开炉」。

### 2.3 请教/任务

- 孙铁匠 **周日** 无法 NPC 对话请教，但家造工坊内「请教」页签仍可用（课表为数据驱动，不校验 NPC 营业时间）。

---

## 3. NPC 对话请教

### 3.1 UI

`NpcView.vue` 选中 `sun_tiejiang` 或 `a_tie` 时，在「聊天 / 送礼」旁增加 **「请教」** 按钮。

### 3.2 逻辑

- 弹出可选课目列表：`visibleForgeLessons(npcId)` — 未学过、等级达标、前置满足
- 点击调用 `forgeStore.attendLesson(lessonId)`
- **每日限额**：与 `ForgeView` 请教页 **共用** `lastLessonDay`（全游戏每日 1 次请教）
- **时间**：成功请教 `advanceTime(ACTION_TIME_COSTS.talk)`（约 0.17h，与聊天同级）
- **体力**：不额外扣（与现有工坊请教一致）

---

## 4. 练习模式

### 4.1 入口

`ForgeView` 增加页签 **「练习」**（与「锻造」并列，默认在锻造 Lv1 开炉后可见）。

### 4.2 流程

1. 检查体力 ≥ 20（经专精减免后）
2. `consumeStamina(20 * (1 - forgingStaminaReduction))`，最低 1
3. `advanceTime(2 * (1 - forgingTimeReduction))`，最低 `MIN_ACTION` 约束
4. 打开 `ForgeMinigame`（`mode: 'practice'`）
5. 结算：`completePractice(forgeScore)` — **不产出装备、不扣材料**

### 4.3 经验公式

```text
baseExp = floor(forgeScore / 5)          // 0～150 分 → 0～30 基础
practiceMult = 1 + 专精练习加成
finalExp = max(5, floor(baseExp * practiceMult * 全局锻造经验倍率))
```

- 得分 ≥120 额外 +10（与正式打造一致）
- 每日练习次数 **不限制**（仅受体力/时间约束）

### 4.4 正式打造（调整）

在 `completeForge` 前（小游戏开始前 `startForge` 后或完成时统一）：

- 扣体力 20（专精减免）
- `advanceTime(2h)`（专精减免）

**经验公式（加强 tier / 品质）**：

```text
tierBase = weapon: [20,30,40,55] / 配饰: [15,22,30,40]   // 原表 ×约1.3～1.5
qualityBonus = normal:0, fine:8, excellent:18, supreme:35  // 上调
scoreBonus = score>=120 ? 15 : score>=80 ? 8 : 0
finalExp = floor((tierBase + qualityBonus + scoreBonus) * expMult)
```

---

## 5. 体力与时间常量

`timeConstants.ts` 新增：

```typescript
forge: 2,           // 正式打造 / 练习
forgePractice: 2,   // 可与 forge 合并
```

体力：**基础 20** / 次（打造 + 练习 + 工具升级可选同步，工具升级暂保持原 1h 时间，体力改为 10 或沿用 20 — **v1 工具升级也扣 20 体 + 2h，与打造统一**）。

---

## 6. 专精树调整（效率向）

保留 Lv5 两分支 ID（`apprentice` / `merchant`）以兼容旧档，**扩展效果**并调整 Lv10/15/20 描述与数值：

### Lv5

| ID | 名称 | 效果 |
|----|------|------|
| apprentice | 学徒 | 锻造经验 +15% |
| merchant | 行商 | 打造装备出售 +10%（不变） |

### Lv10（效率为主）

| 分支 | ID | 名称 | 效果 |
|------|-----|------|------|
| apprentice | smith_sword | 铸剑 | 小游戏目标区 +20% |
| apprentice | **smith_stamina** | **省劲** | **锻造/练习体力 -25%** |
| merchant | enchanter | 附魔师 | 重刷材料 -20% |
| merchant | **smith_time** | **快手** | **锻造/练习时间 -0.5h（2h→1.5h）** |

### Lv15

| 前置 | ID | 名称 | 效果 |
|------|-----|------|------|
| smith_sword | keen_eye | 锐眼 | 目标区再 +10% |
| smith_sword | flame_keeper | 守炉 | 品质权重 +5% |
| smith_stamina | **steady_arm** | **稳臂** | **练习经验 +25%** |
| smith_stamina | efficient_smith | 省料锻 | 工具升级材料 -10% |
| smith_time | **quick_quench** | **速淬** | **时间再 -0.25h** |
| smith_time | rune_touch | 符文手 | 重刷铜钱 -25% |
| enchanter | lucky_reroll | 吉锻 | 重刷升 tier 15% |
| enchanter | frugal_fit | 俭锻 | 配饰材料 -10% |

（`smith_tool` / `smith_armor` 旧 ID 映射：读档时 `smith_tool`→`smith_stamina`，`smith_armor`→`smith_time`，防旧档 perk 失效）

### Lv20（保留部分旧效果 + 效率 capstone）

- `master_blade` / `supreme_forge` 保留
- 新增 **`forge_master`**：体力再 -15%，时间再 -0.25h（最低 1h）
- 新增 **`practice_sage`**：练习得分→经验 +30%

---

## 7. 数据与兼容

| 字段 | 位置 | 默认 |
|------|------|------|
| `forgeWorkshopBuilt` | `home` serialize | `false` |
| `practiceCount` | 可选统计 `forgeStats.practiceCount` | 0 |

旧档：无 `forgeWorkshopBuilt` 视为未建；已有 perk ID 做 migrate 映射。

---

## 8. 知识库 / 告示

- 更新 `kb_part11_forging.json`：家造工坊、练习、体力时间
- `gameAnnouncements.ts` 追加一行（玩家可见）

---

## 9. 测试要点

- 家造：Lv2 不可建，Lv3 可建；建造后 ForgeView 全页签可用
- NPC 请教与工坊请教共享每日 1 次
- 练习不扣材料，扣 20 体 + 2h，得经验
- 正式打造扣体+时间，tier4 supreme 经验高于 tier1 normal
- 专精 `smith_stamina` 体力 20→15

---

## 10. 不在本次范围

- 家造工坊外观/地图坐标放置
- 练习排行榜
- 铁匠铺「材料」弱化合成改动
