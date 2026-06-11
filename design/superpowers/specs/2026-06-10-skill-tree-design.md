# 技能树重构 — 产品需求与技术设计

> **状态**：**定稿**（含锻造 Lv15/20 专精 §8.7），待实现  
> **文档日期**：2026-06-10  
> **项目**：桃源谷（`taoyuan`）  
> **前置**：无（本 spec 为铁匠/锻造系统的**前置依赖**）  
> **后续 spec**：[2026-06-10-forging-design.md](./2026-06-10-forging-design.md)（已定稿）  
> **实现计划**：[2026-06-10-forging-implementation.md](../plans/2026-06-10-forging-implementation.md)  
> **规范参照**：[README.md](../../../README.md)、[AGENT.md](../../../AGENT.md)（存档兼容）

本文档汇总技能树扩展讨论结论。**锻造配方、NPC 请教/任务、亲手打造** 不在本文范围，仅预留第 7 技能 `forging` 的槽位与专精树骨架。

---

## 1. 设计目标

| 目标 | 说明 |
|------|------|
| 成长深度 | 7 个技能统一 **0→20 级**；专精节点 **5 / 10 / 15 / 20**，每节点二选一 |
| 树形结构 | **延续现有分支树（方案 A）**：Lv10 依 Lv5 分支；Lv15 依 Lv10；Lv20 依 Lv15；每技能 **16 种终点 build** |
| 兼容现有 | Lv5/Lv10 专精 **ID 与效果保持不变**；已选专精旧档直接继承 |
| 技术收敛 | 专精数据从 `PerkSelectDialog.vue` 抽到 `src/data/skills.ts`；类型 `SkillPerk15` / `SkillPerk20` |
| 与锻造解耦 | 本文完成技能基础设施；锻造玩法在独立 spec 中接入 `forging` 经验源与专精效果 |

---

## 2. 已确认决策总表

| # | 议题 | 结论 |
|---|------|------|
| 1 | 技能上限 | **20 级**（`level` 最大 20） |
| 2 | 专精节点 | **5 / 10 / 15 / 20**，各 2 选 1 |
| 3 | 树形 | **方案 A**：严格按上级专精分支展开（16 终点 / 技能） |
| 4 | 技能范围 | **全部 7 技能**：农耕、采集、钓鱼、挖矿、战斗、烹饪、**锻造（新）** |
| 5 | 文档拆分 | **本文 = 技能树**；锻造 = 独立 spec，**先技能后锻造** |
| 6 | Lv5/Lv10 存量 | 现有 12 个专精 **不改 ID、不改数值** |
| 7 | 命名冲突 | 挖矿 Lv10 `blacksmith`（铁匠）**重命名为 `metal_merchant`（金属商）**；效果不变（金属矿石售价 +50%） |
| 8 | 被动成长 | 保留「每级体力消耗 -1%」；**20 级共 -20%** |
| 9 | 品质门槛 | 作物/采集/烹饪品质阈值由 3/6/9 **线性映射为 5/10/15**（见 §6） |
| 10 | **机制绑定** | 所有专精必须挂钩 **`src/` 已实现玩法**；知识库有描述但代码未做的机制（如中毒）**不得写入专精**，除非同期实现该机制 |

---

## 3. 技能一览

| 技能 ID | 中文 | 经验主要来源（现有） | Lv15/Lv20 主题方向 |
|---------|------|----------------------|---------------------|
| `farming` | 农耕 | 种植、收获、动物 | 产量 / 品质 / 畜舍 |
| `foraging` | 采集 | 伐木、觅食、山洞采集 | 木材 / 草药 / 炼金向 |
| `fishing` | 钓鱼 | 钓鱼小游戏、蟹笼 | 稀有鱼 / 品质 / 鱼饵 |
| `mining` | 挖矿 | 敲矿、炸弹、矿洞 | 矿石 / 宝石 / 炸弹 |
| `combat` | 战斗 | 击杀怪物 | 生存 / 输出 / 闪避 |
| `cooking` | 烹饪 | 烹饪、进食（已有） | 批量 / 品质 / 酒肆 / buff |
| `forging` | 锻造 | **锻造 spec 定义**（打铁、工具维护等） | 武器 / 工具 / 附魔 / 效率 |

---

## 4. 数据模型

### 4.1 类型扩展（`src/types/skill.ts`）

```ts
export type SkillType =
  | 'farming' | 'foraging' | 'fishing' | 'mining' | 'combat' | 'cooking' | 'forging'

export type SkillPerk5 = /* 现有 + forging 两个 */
export type SkillPerk10 = /* 现有 blacksmith→metal_merchant + forging 两个 */
export type SkillPerk15 = /* 新增，每技能 8 个 ID */
export type SkillPerk20 = /* 新增，每技能 16 个 ID */

export interface SkillState {
  type: SkillType
  exp: number
  level: number // 0..20
  perk5: SkillPerk5 | null
  perk10: SkillPerk10 | null
  perk15: SkillPerk15 | null
  perk20: SkillPerk20 | null
}
```

### 4.2 专精数据（新建 `src/data/skills.ts`）

集中定义：

- `PERK5_OPTIONS`、`PERK10_BRANCHES`、`PERK15_BRANCHES`、`PERK20_BRANCHES`
- `PERK_META: Record<AllPerkId, { name, description }>`
- `getPerkOptions(skillType, level: 5|10|15|20, skill: SkillState): PerkOption[]`

`PerkSelectDialog.vue` / `SkillView.vue` / `CharInfoView.vue` **只读 data 层**，不再内联专精表。

### 4.3 Store（`useSkillStore.ts`）

| 方法 | 行为 |
|------|------|
| `addExp` | `while (level < 20)` 对照 `EXP_TABLE` 升级 |
| `getExpToNextLevel` | `level >= 20` 返回 `null`（MAX） |
| `setPerk5/10/15/20` | 等级门槛 + 上级专精已选 + 未重复选择 |
| `hasPerk(id)` | 供各 store 查询（替代散落字符串比较） |
| `onSkillLevelUp` | 5/10/15/20 均触发 `useSystemStore().onSkillLevelUp` + 专精弹窗 |

专精弹窗触发点：升级时若 `level ∈ {5,10,15,20}` 且对应 `perk*` 为空 → 全局 `PerkSelectDialog`（与现有 Lv5/Lv10 一致）。

---

## 5. 经验曲线

### 5.1 `EXP_TABLE`（累计经验，索引 = 等级）

| Lv | 累计 EXP | Lv | 累计 EXP |
|----|----------|----|----------|
| 0 | 0 | 11 | 22,000 |
| 1 | 100 | 12 | 32,000 |
| 2 | 380 | 13 | 46,000 |
| 3 | 770 | 14 | 65,000 |
| 4 | 1,300 | 15 | 90,000 |
| 5 | 2,150 | 16 | 125,000 |
| 6 | 3,300 | 17 | 175,000 |
| 7 | 4,800 | 18 | 240,000 |
| 8 | 6,900 | 19 | 330,000 |
| 9 | 10,000 | 20 | 450,000（满级） |
| 10 | 15,000 | | |

**设计意图**：Lv10→15 约为原满级后 1.5 季活跃玩家可达；Lv20 为长线目标（约 2～3 季）。实现时允许 ±10% 微调，但须 **Vitest 锁定表值**。

### 5.2 满级后经验

满级后 `exp` 可继续累积（用于统计/成就），不再升级。

---

## 6. 等级被动（非专精）

### 6.1 通用

- **体力减免**：`level × 1%`（20 级 = 20%）
- **战斗生命**：`combat` 每级 +5 HP（20 级 +100，与专精叠加）

### 6.2 品质阈值缩放

将原 `level >= 3/6/9` 映射为 **`level >= 5/10/15`**（农耕 `rollCropQuality*`、采集 `rollForageQuality`、烹饪升档逻辑同理）。

| 品质 | 原门槛 | 新门槛 |
|------|--------|--------|
| 优良 fine | 3 | 5 |
| 精品 excellent | 6 | 10 |
| 极品 supreme | 9 | 15 |

**存档**：已达 Lv10 的老玩家自动享受新门槛（等级不变，规则变）。

### 6.3 其他等级门控（需扫代码更新）

| 位置 | 现规则 | 新规则建议 |
|------|--------|------------|
| `systemQuestTemplates` `skill_any_10` | 任意技能 10 级 | 保留 10 级任务，**新增** 15/20 级任务线 |
| `ProcessingView` 全技能 ≥8 | 解锁提示 | 改为 ≥12 或保持 8（**待实现时二选一，默认保持 8**） |
| `useWalletStore` 药典 | 采集 ≥8 | 保持 8 |
| 食谱 `requiredSkill.level` | 各食谱自定 | **不批量改**；新食谱可用 15/20 |

---

## 7. 存档迁移

| 场景 | 处理 |
|------|------|
| 缺 `perk15` / `perk20` 字段 | `deserialize` 补 `null` |
| 缺 `forging` 技能 | 插入 `{ type:'forging', exp:0, level:0, perks:null }` |
| 挖矿 `perk10 === 'blacksmith'` | 迁移为 `'metal_merchant'` |
| 玩家 Lv10 满级前 | 经验表扩展后 **不追回** 经验；若 `exp >= 15000` 且 `level===10`，下次 `addExp` 时自动连升 |
| 已选 Lv5/Lv10 | **保留**；达 Lv15/20 时正常弹窗 |
| `skillTreeMigrated` 旗标 | `useSaveStore` 一次性：`blacksmith` 重命名 + forging 补全 |

---

## 7.5 专精与机制绑定（硬性约束）

**规则**：每条专精的 `description` 必须能指向至少一处**已在代码中存在的系统**（store / 日结 / 战斗回合 / 配方表等）。允许专精效果尚未接入，但**禁止**引用不存在的玩法名词。

| 状态 | 示例 | 专精中是否可用 |
|------|------|----------------|
| ✅ 已实现 | 农场虫害 `plot.infested`、矿洞感染层 `specialType==='infested'`、搏鱼 `scoreLoss`、蟹笼 `MAX_CRAB_POTS`、夜间野兽入侵 `useEndDay` | 可以 |
| ⚠️ 知识库仅有 | 「中毒」「解毒」「药草茶解毒」——`src/` 无 `poison` 状态 | **禁止**，待机制实装后再设计专精 |
| ❌ 不存在 | 鱼线断裂、鱼饵吸引半径、连作减产、仓库作物栈上限、矿洞跳层楼梯、战斗击退 | **禁止** |

**撰写流程**：为每个 Lv15/Lv20 专精在附录注明 `机制锚点`（文件 + 字段/函数）。实现 PR 须带对应测试或 `grep` 验收。

**本次勘误**（相对初稿）：已对照 `src/` 全量审计；不合机制者已替换，见 §8.0。

---

## 8.0 机制审计总表（2026-06-10 对照 `src/`）

图例：**✅** 机制已存在（专精效果待接入）｜**⚠️** 已按代码改写描述｜**⏳** 锻造 spec 再定

### 农耕 `farming`

| 等级 | ID | 审计 | 机制锚点 |
|------|-----|------|----------|
| 5 | harvester | ✅ | `useShopStore` 作物售价 ×1.1 |
| 5 | rancher | ✅ | 畜产品售价 ×1.2 |
| 10 | artisan | ✅ | 加工品 `category==='processed'` 售价 ×1.25 |
| 10 | intensive | ✅ | `useFarmActions` 收获 20% 双倍 |
| 10 | coopmaster | ✅ | `useAnimalStore` 亲密度 ×1.5、孵化天数减半 |
| 10 | shepherd | ✅ | `getAnimalProductQuality` 畜产品升档 |
| 15 | master_artisan | ✅ | 同 artisan，叠乘售价 |
| 15 | bulk_artisan | ✅ | `processing.ts` `maxInputQuantity` |
| 15 | fertile_soil | ✅ | `FERTILIZERS` 的 `qualityBonus` / `growthSpeedup` / `retainChance` |
| 15 | pest_guard | ✅ | `useFarmStore.dailyUpdate` 虫害 `pestChance` |
| 15 | whisperer | ✅ | `animal.friendship` 叠 coopmaster |
| 15 | breeder | ⚠️ | **仅孵化器** `incubating.daysLeft`（无动物怀孕） |
| 15 | dairy_master | ✅ | 产物 id：`milk`/`goat_milk`/`*_milk` 品质规则 |
| 15 | woolwright | ✅ | 产物 id：`wool`/`alpaca_wool` 收集数量 |
| 20 | divine_artisan | ✅ | `useProcessingStore` `processingDays` + 加工品售价 |
| 20 | lord_of_mills | ✅ | `useProcessingStore.craftMachine` `craftMoney` |
| 20 | harvest_incarnate | ✅ | 叠 `intensive` 双倍概率 |
| 20 | bounty_crop | ✅ | 叠 `harvester` 作物售价 |
| 20 | beast_friend | ✅ | `animal.mood`、畜产品售价 |
| 20 | golden_herd | ✅ | `useAnimalStore` 日产出 `products.push` |
| 20 | cheese_lord | ✅ | 奶酪类 `processed` 出售 |
| 20 | silk_pasture | ✅ | `shepherd` 品质逻辑用于丝绸/羊绒 |

### 采集 `foraging`

| 等级 | ID | 审计 | 机制锚点 |
|------|-----|------|----------|
| 5 | lumberjack | ✅ | `ForageView` / `FarmView` 伐木额外木材 |
| 5 | herbalist | ✅ | `ForageView` `item.chance ×1.2` |
| 10 | forester | ✅ | 伐木必得额外木材 |
| 10 | tracker | ✅ | 觅食额外 +1 件 |
| 10 | botanist | ✅ | `rollForageQuality` 保底精品 |
| 10 | alchemist | ✅ | `useCookingStore.eat` 恢复 ×1.5 |
| 15 | titan_log / quick_chop | ✅ | `FarmView.confirmChopWildTree` 木材量、体力 |
| 15 | trail_sight | ⚠️ | 原「慧眼隐藏物」→ 觅食品 `item.chance +30%` |
| 15 | twin_gather | ✅ | 叠 tracker +1→+2 |
| 15 | herb_sage / herb_finder | ✅ | 草药类 `sellPrice` / 觅食 `chance` |
| 15 | spore_tamer | ✅ | `useHomeStore.dailyCaveUpdate` `mushroomChance` |
| 15 | tonic_cook | ✅ | 同 alchemist 进食恢复 |
| 20 | forest_king | ⚠️ | 原「砍树掉种子」→ 木材售价 +50%；`collectTapProduct` +1 |
| 20 | one_swing | ✅ | `useFarmStore.chopWildTree` `chopCount` 阈值 |
| 20 | chosen_forager | ✅ | `rollForageQuality` 极品概率 |
| 20 | overflow_basket | ✅ | `useWarehouseStore.depositToFirstAvailableChest` |
| 20 | hundred_herbs | ✅ | 叠 botanist，采集保底精品 |
| 20 | ginseng_sage | ✅ | `data/forage.ts` 掉落权重 |
| 20 | revival_hand / herb_tonic | ✅ | 食谱 `healthRestore` / `ingredients` 含草药类 |

### 钓鱼 `fishing`

| 等级 | ID | 审计 | 机制锚点 |
|------|-----|------|----------|
| 5–10 | fisher/trapper/angler/… | ✅ | 均已接入 `useFishingStore` / `useShopStore` |
| 15 | steady_hand | ⚠️ | `miniGameParams.fishSpeed`（非「鱼线断裂」） |
| 15 | tide_reader | ⚠️ | `gameStore.weather` 雨天/暴风雨 → 宝箱率 `rollTreasureChest` |
| 15 | bait_thrift | ✅ | 钓鱼后 `removeItem` 鱼饵 |
| 20 | abyss_gaze | ⚠️ | 原泛称宝箱 → **完美搏鱼**时 `rollTreasureChest` 概率 +25% |
| 20 | legend_hook | ✅ | 传说鱼权重 `difficulty==='legendary'` |
| 20 | fresh_keep | ✅ | 卖鱼 `QUALITY_MULTIPLIER` |
| 20 | aqua_tycoon | ✅ | `dailyHarvestCrabPots` 产出数量 |
| 20 | ice_chain | ✅ | `gameStore.season==='winter'` 钓鱼体力 |
| 20 | steady_pull | ✅ | `scoreLoss` |
| 20 | perfect_catch | ✅ | `perfectMult` 钓鱼经验 |
| 20 | crab_emperor | ✅ | `MAX_CRAB_POTS` / `MAX_CRAB_POTS_PER_LOCATION` |

### 挖矿 `mining`

| 等级 | ID | 审计 | 机制锚点 |
|------|-----|------|----------|
| 5–10 | miner/geologist/… | ✅ | `useMiningStore` 敲矿、炸弹、掉落 |
| 10 | metal_merchant | ✅ | 金属矿石售价（原 `blacksmith`） |
| 15 | smelter_touch | ✅ | `recipe.processingDays` |
| 15 | heart_of_ore | ✅ | 敲矿 `consumeStamina` |
| 15 | ingot_master | ✅ | 熔炉 `outputQuantity` |
| 15 | tunnel_rat | ✅ | 感染层 `stairsFound` 时绕过清怪，`goNextFloor` / `stairsUsable` |
| 20 | underwalker | ✅ | 叠隧道师；感染层跳过时 `goNextFloor` 体力消耗 -30% |
| 20 | furnace_king | ⚠️ | 无燃料系统 → 熔炉 `machineType==='furnace'` 时间 -25% |
| 20 | clean_blast | ⚠️ | 炸弹无体力消耗 → 炸弹炸矿 `ore` **产量 +1** |
| 20 | ancient_echo | ⚠️ | 宝箱无品质档 → `treasure` 格 **掉落数量 +1** 或钱币 +50% |
| 20 | crystal_hunter / fossil_seeker / gem_sovereign | ✅ | 矿石/古物/宝石掉落与 `useShopStore` 出售 |

### 战斗 `combat`

| 等级 | ID | 审计 | 机制锚点 |
|------|-----|------|----------|
| 5–10 | fighter/defender/… | ✅ | `useMiningStore.performCombatAction` |
| 15–20 | warrior_stance / battle_cry / … | ✅ | `defend`/`attack`/`combatRound`/`monster.defense`/`critMult` |
| 15 | counter_master | ✅ | `performCombatAction('defend')` 防御回合 30% 概率追加一次攻击 |
| 20 | night_watch | ✅ | `useEndDay` 夜间野兽入侵 `takeDamage` |
| 20 | immortal | ✅ | `handleDefeat` 前致死保底（新逻辑挂现有 HP） |

**不存在、已禁止引用**：中毒、击退、鱼线断裂、**未找到楼梯时连降多层**、NPC 同行减伤。

### 烹饪 `cooking`

| 等级 | ID | 审计 | 机制锚点 |
|------|-----|------|----------|
| 5–10 | prep_cook / vendor_chef / … | ✅ | `useCookingStore.cook` / `eat` / `tavernSimulate` |
| 15 | kitchen_overlord | ⚠️ | **烹饪不耗体力** → 批量烹饪 `maxPossible +1` |
| 15 | war_kitchen | ⚠️ | 无「时段 buff」→ `activeBuffExtraDays +2`（天） |
| 20 | signature_dish | ✅ | `useTavernStore` 菜单定价 |
| 20 | golden_plate | ✅ | 极品食物 `QUALITY_MULTIPLIER` 出售 |
| 20 | march_meal | ✅ | 矿洞自动探索 `cookingStore.eat` |
| 20 | first_kitchen / tavern_emperor | ✅ | `reputation`、日结酒肆收入 |

### 锻造 `forging`

| 等级 | ID | 审计 | 机制锚点 |
|------|-----|------|----------|
| 5–10 | apprentice…smith_armor | ⏳ | 锻造玩法未实装；Lv10 效果挂钩 **将有的** 打造/附魔/合成费 |
| 15–20 | TBD | ⏳ | 锻造 spec 定稿后必须重新审计 |

---

## 8. 专精树完整定义

> **数值原则**：Lv15 ≈ Lv10 强度的延伸；Lv20 为构筑终点。  
> **机制原则**：见 §7.5、§8.0；实现 PR 须对照审计表。  
> **实现**：`grep perk10` 所有引用点；新增 Lv15/20 时同步改对应 store。

### 8.1 农耕 `farming`

```
Lv5 丰收者 harvester ──┬─ Lv10 匠人 artisan ──┬─ Lv15 名匠 master_artisan ──┬─ Lv20 百工之神 divine_artisan
                       │                      └─ Lv15 批匠 bulk_artisan ─────┴─ Lv20 流水线 lord_of_mills
                       └─ Lv10 精耕 intensive ─┬─ Lv15 沃土 fertile_soil ─────┬─ Lv20 丰收化身 harvest_incarnate
                                               └─ Lv15 护苗 pest_guard ──────┴─ Lv20 金穗 bounty_crop

Lv5 牧人 rancher ──────┬─ Lv10 牧场主 coopmaster ─┬─ Lv15 亲驯 whisperer ────┬─ Lv20 万物亲和 beast_friend
                       │                           └─ Lv15 繁育 breeder ───────┴─ Lv20 黄金畜牧 golden_herd
                       └─ Lv10 牧羊人 shepherd ───┬─ Lv15 乳品师 dairy_master ─┬─ Lv20 酪王 cheese_lord
                                                  └─ Lv15 毛纺师 woolwright ──┴─ Lv20 锦绣牧场 silk_pasture
```

| ID | 名称 | 效果 |
|----|------|------|
| **master_artisan** | 名匠 | 加工品售价 +40%（叠 artisan 25% 为乘法后总 +75%） |
| **bulk_artisan** | 批匠 | 加工坊单次投入上限 +2（全局，需 processing 支持） |
| **divine_artisan** | 百工之神 | 加工品售价 +25%；加工时间 -1 天（最低 0.5 天） |
| **lord_of_mills** | 流水线 | 加工坊同类机器第 2 台起建造费 -30% |
| **fertile_soil** | 沃土 | 肥料效果 +50% |
| **pest_guard** | 护苗 | 作物地块每日虫害概率 -30%（叠稻草人减半） |
| **harvest_incarnate** | 丰收化身 | 收获双倍概率 20%→**35%** |
| **bounty_crop** | 金穗 | 作物售价 +20%（叠丰收者 10%） |
| **whisperer** | 亲驯 | 动物亲密度获取 +50%（叠 coopmaster） |
| **breeder** | 繁育 | 孵化器剩余天数 -25%（鸡舍/牲口棚，无「怀孕」机制） |
| **beast_friend** | 万物亲和 | 畜产品售价 +30%；动物心情每日额外 +5 |
| **golden_herd** | 黄金畜牧 | 收集动物产物时 20% 概率额外 +1 份（`useAnimalStore` 产出） |
| **dairy_master** | 乳品师 | 奶类产物品质 +1 档 |
| **woolwright** | 毛纺师 | 毛类产物数量 +25% |
| **cheese_lord** | 酪王 | 奶酪类加工品售价 +50% |
| **silk_pasture** | 锦绣牧场 | 丝绸/羊绒类畜产品直接精品品质 |

### 8.2 采集 `foraging`

```
Lv5 樵夫 lumberjack ──┬─ Lv10 伐木工 forester ──┬─ Lv15 巨木 titan_log ──────┬─ Lv20 森王 forest_king
                      │                          └─ Lv15 速伐 quick_chop ────┴─ Lv20 一斧封喉 one_swing
                      └─ Lv10 追踪者 tracker ────┬─ Lv15 熟路 trail_sight ──────┬─ Lv20 天选采集 chosen_forager
                                                 └─ Lv15 双收 twin_gather ───┴─ Lv20 盈筐 overflow_basket

Lv5 药师 herbalist ───┬─ Lv10 植物学家 botanist ─┬─ Lv15 药王 herb_sage ─────┬─ Lv20 百草宗师 hundred_herbs
                      │                           └─ Lv15 孢子师 spore_tamer ┴─ Lv20 参王 ginseng_sage
                      └─ Lv10 炼金师 alchemist ──┬─ Lv15 药膳师 tonic_cook ──┬─ Lv20 回春圣手 revival_hand
                                                 └─ Lv15 寻药 herb_finder ───┴─ Lv20 百草膳 herb_tonic
```

| ID | 名称 | 效果 |
|----|------|------|
| **titan_log** | 巨木 | 砍树额外 +2 木材 |
| **quick_chop** | 速伐 | 砍树体力 -30% |
| **forest_king** | 森王 | 木材售价 +50%；采脂器收取产物 +1（`collectTapProduct`） |
| **one_swing** | 一斧封喉 | 野树砍倒所需次数 -1（`chopCount` 阈值 3→2） |
| **trail_sight** | 熟路 | 觅食品 `item.chance` +30%（叠药师 +20%） |
| **twin_gather** | 双收 | 追踪者额外 +1→**+2** 物品 |
| **chosen_forager** | 天选采集 | 采集物 10% 概率极品 |
| **overflow_basket** | 盈筐 | 伐木/觅食时，若背包已满则溢出物改入仓库（`useWarehouseStore.deposit`） |
| **herb_sage** | 药王 | 草药类物品（`herb`/`ginseng`/`wild_mushroom`）售价 +60% |
| **spore_tamer** | 孢子师 | 蘑菇洞（农舍山洞选蘑菇）日产出概率 +50% |
| **hundred_herbs** | 百草宗师 | 采集物品质保底精品 |
| **ginseng_sage** | 参王 | 觅食品掉落 `ginseng` 权重 +100%（`ForageView` 掉落表） |
| **tonic_cook** | 药膳师 | 食物恢复 +50%（叠 alchemist，`useCookingStore.eat`） |
| **herb_finder** | 寻药 | 觅食品掉落草药类权重 +80% |
| **revival_hand** | 回春圣手 | 食用带 `healthRestore` 的料理额外 +20 HP |
| **herb_tonic** | 百草膳 | 食用配方含草药类食材的料理时，体力/生命恢复 +25% |

### 8.3 钓鱼 `fishing`

```
Lv5 渔夫 fisher ──────┬─ Lv10 垂钓大师 angler ──┬─ Lv15 海王 tide_lord ───────┬─ Lv20 传说之钩 legend_hook
                      │                         └─ Lv15 深潜 deep_diver ──────┴─ Lv20 深渊凝视 abyss_gaze
                      └─ Lv10 水产商 aquaculture ┬─ Lv15 鱼仓 fish_bank ─────┬─ Lv20 水产大亨 aqua_tycoon
                                                 └─ Lv15 鲜度 fresh_keep ─────┴─ Lv20 冰链 ice_chain

Lv5 捕手 trapper ─────┬─ Lv10 水手 mariner ─────┬─ Lv15 稳杆 steady_hand ─────┬─ Lv20 稳搏 steady_pull
                      │                          └─ Lv15 识潮 tide_reader ─────┴─ Lv20 完美搏鱼 perfect_catch
                      └─ Lv10 诱饵师 luremaster ─┬─ Lv15 省饵 bait_thrift ─────┬─ Lv20 饵王 bait_king
                                                 └─ Lv15 机括匠 trap_engineer ─┴─ Lv20 连环蟹笼 crab_emperor
```

| ID | 名称 | 效果 |
|----|------|------|
| **tide_lord** | 海王 | 传说鱼概率再 +50%（叠 angler） |
| **deep_diver** | 深潜 | 矿洞/瀑布稀有鱼权重 +100% |
| **legend_hook** | 传说之钩 | 传说鱼上钩率固定 +15% |
| **abyss_gaze** | 深渊凝视 | 完美搏鱼时 `rollTreasureChest` 概率 +25% |
| **fish_bank** | 鱼仓 | 鱼售价 +50%（叠 aquaculture） |
| **fresh_keep** | 鲜度 | 鱼品质出售倍率 +0.25 |
| **aqua_tycoon** | 水产大亨 | 蟹笼产出 +2 |
| **ice_chain** | 冰链 | 冬季钓鱼体力 -40% |
| **steady_hand** | 稳杆 | 搏鱼 `fishSpeed` -15%（小游戏参数） |
| **tide_reader** | 识潮 | 雨天/暴风雨时钓鱼宝箱基础概率 +20% |
| **steady_pull** | 稳搏 | 搏鱼 `scoreLoss` -25%（`useFishingStore` 小游戏参数） |
| **perfect_catch** | 完美搏鱼 | 完美评级钓鱼经验 +100% |
| **bait_thrift** | 省饵 | 钓鱼消耗鱼饵后 25% 概率不扣背包鱼饵 |
| **trap_engineer** | 机括匠 | 蟹笼装饵时 50% 概率不消耗鱼饵 |
| **bait_king** | 饵王 | 鱼饵效果 ×3（叠 luremaster） |
| **crab_emperor** | 连环蟹笼 | 全局/单地点蟹笼上限各 +1（`MAX_CRAB_POTS*` 常量） |

### 8.4 挖矿 `mining`

> `blacksmith` → **`metal_merchant`**（金属商），效果不变。

```
Lv5 矿工 miner ───────┬─ Lv10 探矿者 prospector ─┬─ Lv15 富矿 rich_vein ──────┬─ Lv20 矿脉之心 heart_of_ore
                      │                           └─ Lv15 精炼 smelter_touch ───┴─ Lv20 点石成金 midas_ore
                      └─ Lv10 金属商 metal_merchant ┬─ Lv15 锭匠 ingot_master ──┬─ Lv20 熔炉之王 furnace_king
                                                    └─ Lv15 行商 ore_trader ────┴─ Lv20 黄金契约 gold_pact

Lv5 地质学家 geologist ┬─ Lv10 挖掘者 excavator ──┬─ Lv15 爆破专家 blaster ────┬─ Lv20 无痕爆破 clean_blast
                       │                           └─ Lv15 隧道师 tunnel_rat ─────┴─ Lv20 地下行者 underwalker
                       └─ Lv10 宝石学家 mineralogist ┬─ Lv15 晶洞猎人 crystal_hunter ┬─ Lv20 璀璨 gem_sovereign
                                                    └─ Lv15 化石学者 fossil_seeker ┴─ Lv20 远古回响 ancient_echo
```

| ID | 名称 | 效果 |
|----|------|------|
| **rich_vein** | 富矿 | 矿石双倍 15%→**30%** |
| **smelter_touch** | 精炼 | 熔炉产出时间 -0.5 天 |
| **heart_of_ore** | 矿脉之心 | 敲矿 25% 不消耗体力 |
| **midas_ore** | 点石成金 | 矿石售价 +40% |
| **ingot_master** | 锭匠 | 金属锭合成产量 +1（熔炉类） |
| **ore_trader** | 行商 | 金属矿石售价 +50%（叠 metal_merchant） |
| **furnace_king** | 熔炉之王 | 熔炉类配方 `processingDays` -25%（`machineType==='furnace'`） |
| **gold_pact** | 黄金契约 | 卖矿时 10% 概率额外获得等量铜钱 |
| **blaster** | 爆破专家 | 炸弹不消耗 30%→**50%** |
| **tunnel_rat** | 隧道师 | 感染层已**发现楼梯**（`stairsFound`）时，无需清空怪物即可下楼（`goNextFloor` 忽略感染层清怪校验） |
| **clean_blast** | 富矿爆破 | 炸弹炸开的矿石格产量 +1（`useBombOnGrid` ore 分支） |
| **underwalker** | 地下行者 | 叠隧道师；从感染层跳过时，本次下楼相关探索体力消耗 -30% |
| **crystal_hunter** | 晶洞猎人 | 水晶/宝石掉落 +100% |
| **fossil_seeker** | 化石学者 | 古物/化石掉落 +50% |
| **gem_sovereign** | 璀璨 | 宝石售价 +80% |
| **ancient_echo** | 远古回响 | 矿洞 `treasure` 格钱币 +50%，或每件掉落数量 +1 |

### 8.5 战斗 `combat`

```
Lv5 斗士 fighter ─────┬─ Lv10 武者 warrior ─────┬─ Lv15 不动 warrior_stance ┬─ Lv20 战神 war_god
                      │                           └─ Lv15 战吼 battle_cry ────┴─ Lv20 破军 army_breaker
                      └─ Lv10 蛮力者 brute ───────┬─ Lv15 碎甲 armor_break ───┬─ Lv20 毁灭 destroyer
                                                  └─ Lv15 嗜血 bloodlust ─────┴─ Lv20 修罗 asura

Lv5 守护者 defender ──┬─ Lv10 杂技师 acrobat ────┬─ Lv15 影步 shadow_step ────┬─ Lv20 无形 phantom
                      │                           └─ Lv15 反击 counter_master ┴─ Lv20 千返 mirror_edge
                      └─ Lv10 重甲者 tank ───────┬─ Lv15 铁壁 iron_wall ──────┬─ Lv20 不朽 immortal
                                                 └─ Lv15 守夜 night_watch ──────┴─ Lv20 守护者誓约 guardian_oath
```

| ID | 名称 | 效果 |
|----|------|------|
| **warrior_stance** | 不动 | 防御后下次攻击 +50% |
| **battle_cry** | 战吼 | 开战首回合怪物攻击 -30% |
| **war_god** | 战神 | 生命上限 +60（叠 warrior） |
| **army_breaker** | 破军 | 攻击 +25%（叠 brute，`bruteBonus`） |
| **armor_break** | 碎甲 | 无视怪物 30% 防御 |
| **bloodlust** | 嗜血 | 击杀回复 10% 最大生命 |
| **destroyer** | 毁灭 | 暴击伤害 +50% |
| **asura** | 修罗 | HP 低于 30% 时攻击 +40% |
| **shadow_step** | 影步 | 闪避反击 25%→**40%** |
| **counter_master** | 反击 | 防御回合 30% 概率对当前怪物发动一次普通攻击（仍享受防御减伤，不额外消耗体力） |
| **phantom** | 无形 | 首回合必定闪避 |
| **mirror_edge** | 千返 | 闪避反击时 25% 双倍 |
| **iron_wall** | 铁壁 | 防御减伤 70%→**80%** |
| **night_watch** | 守夜 | 夜间野兽入侵受伤 -40%（`useEndDay` 野兽事件） |
| **immortal** | 不朽 | 每场战斗一次致死保命（剩 1 HP） |
| **guardian_oath** | 守护者誓约 | 防御每回合回血 5→**10** |

### 8.6 烹饪 `cooking`

```
Lv5 备料手 prep_cook ─┬─ Lv10 双灶 double_batch ──┬─ Lv15 三灶 triple_stove ────┬─ Lv20 膳房总管 kitchen_overlord
                      │                             └─ Lv15 省料 thrift_chef ─────┴─ Lv20 厨艺精通 recipe_mastery
                      └─ Lv10 匠心 gourmet_craft ───┬─ Lv15 食神 gourmet_saint ───┬─ Lv20 招牌宴 signature_dish
                                                    └─ Lv15 摆盘师 platter_artist ┴─ Lv20 金碟 golden_plate

Lv5 市厨 vendor_chef ──┬─ Lv10 膳修 buff_chef ─────┬─ Lv15 元气膳 vital_feast ─────┬─ Lv20 延寿宴 longevity_banquet
                      │                             └─ Lv15 战膳 war_kitchen ───────┴─ Lv20 出征餐 march_meal
                      └─ Lv10 肆尊 tavern_master ──┬─ Lv15 名厨 fame_chef ──────────┬─ Lv20 天下第一 first_kitchen
                                                   └─ Lv15 掌柜 owner_mind ─────────┴─ Lv20 酒肆皇帝 tavern_emperor
```

| ID | 名称 | 效果 |
|----|------|------|
| **triple_stove** | 三灶 | 双灶 15%→**25%** 额外 +1 份 |
| **thrift_chef** | 省料 | 备料手节省概率 20%→**35%** |
| **kitchen_overlord** | 膳房总管 | 单次批量烹饪份数 `maxPossible +1` |
| **recipe_mastery** | 厨艺精通 | 烹饪获得 `cooking` 经验 +25% |
| **gourmet_saint** | 食神 | 品质 +1 档 25%→**40%** |
| **platter_artist** | 摆盘师 | 食物售价 +25% |
| **signature_dish** | 招牌宴 | 酒肆菜单槽位中「热菜/小食」指导价 +15%（`useTavernStore` 定价） |
| **golden_plate** | 金碟 | 极品食物额外 +30% 售价 |
| **vital_feast** | 元气膳 | buff 效果 +30%（叠 buff_chef） |
| **war_kitchen** | 战膳 | 带 `buff` 的料理：额外持续天数 +2（`activeBuffExtraDays`） |
| **longevity_banquet** | 延寿宴 | 恢复类料理 +50% HP/体力 |
| **march_meal** | 出征餐 | 矿洞内食用料理效果 +40% |
| **fame_chef** | 名厨 | 酒肆厨艺 +3（叠 tavern_master） |
| **owner_mind** | 掌柜 | 食物售价 +15%（叠 vendor_chef） |
| **first_kitchen** | 天下第一 | 酒肆口碑获取 +20% |
| **tavern_emperor** | 酒肆皇帝 | 酒肆全日自动营业收入 +15% |

### 8.7 锻造 `forging`（与 [锻造 spec](./2026-06-10-forging-design.md) 对齐）

```
Lv5 学徒 apprentice ────┬─ Lv10 铸剑 smith_sword ───┬─ Lv15 锐眼 keen_eye ─────────┬─ Lv20 名匠 master_blade
                        │                           └─ Lv15 守炉 flame_keeper ─────┴─ Lv20 天工 supreme_forge
                        └─ Lv10 工具匠 smith_tool ──┬─ Lv15 不倦 tireless ─────────┬─ Lv20 工圣 tool_legend
                                                    └─ Lv15 省料锻 efficient_smith ┴─ Lv20 神淬 grand_temper

Lv5 行商 merchant ──────┬─ Lv10 附魔师 enchanter ───┬─ Lv15 符文手 rune_touch ─────┬─ Lv20 大宗师 arch_enchanter
                        │                           └─ Lv15 吉锻 lucky_reroll ─────┴─ Lv20 双纹 twin_runes
                        └─ Lv10 护甲匠 smith_armor ─┬─ Lv15 套匠 set_mason ────────┬─ Lv20 御用 royal_armorer
                                                    └─ Lv15 俭锻 frugal_fit ───────┴─ Lv20 金砧 golden_anvil
```

| 等级 | ID | 名称 | 效果（机制锚点） |
|------|-----|------|------------------|
| 5 | `apprentice` | 学徒 | 锻造经验 +15%（`useForgeStore` / `addExp('forging')`） |
| 5 | `merchant` | 行商 | 打造装备出售 +10%（`getWeaponSellPrice` / 打造实例估价） |
| 10 | `smith_sword` | 铸剑 | 武器打造小游戏目标区宽度 +20%（`ForgeMinigame`） |
| 10 | `smith_tool` | 工具匠 | 工具升级材料 -20%（`upgradeTool`） |
| 10 | `enchanter` | 附魔师 | 词条重刷材料 -20%（`rerollAffixes`） |
| 10 | `smith_armor` | 护甲匠 | 帽/鞋/戒打造铜钱 -15%（`ForgeRecipeDef.moneyCost`） |
| 15 | `keen_eye` | 锐眼 | 小游戏目标区再 +10%（叠 smith_sword） |
| 15 | `flame_keeper` | 守炉 | 起炉步 perfect 时品质升档权重 +5%（`rollForgeQuality`） |
| 15 | `tireless` | 不倦 | 工具升级锻造经验 +25% |
| 15 | `efficient_smith` | 省料锻 | 工具升级材料再 -10%（叠 smith_tool） |
| 15 | `rune_touch` | 符文手 | 词条重刷铜钱 -25% |
| 15 | `lucky_reroll` | 吉锻 | 重刷时 15% 在同品质池内升一档词条 tier（不超 `MAX_TIER_FOR_QUALITY`） |
| 15 | `set_mason` | 套匠 | 套装件 `fixedAffixId` 数值 +10% |
| 15 | `frugal_fit` | 俭锻 | 帽/鞋/戒打造材料 -10%（`ingredients`） |
| 20 | `master_blade` | 名匠 | 武器 `rolledAttack` 结算 +5% |
| 20 | `supreme_forge` | 天工 | 武器打造极品（supreme）权重 +5% |
| 20 | `tool_legend` | 工圣 | 工具升级所需 `forging` 等级 -1（下限 1） |
| 20 | `grand_temper` | 神淬 | 工具升级铜钱 -20% |
| 20 | `arch_enchanter` | 大宗师 | 极品第二词条槽 T4 权重 +12%（`rollAffixes`） |
| 20 | `twin_runes` | 双纹 | 词条重刷时 10% 额外多 roll 一次取优（同品质池） |
| 20 | `royal_armorer` | 御用 | 防具打造（帽/鞋/戒）品质升档权重 +5% |
| 20 | `golden_anvil` | 金砧 | 打造装备出售 +20%（叠 merchant） |

**经验来源**：见锻造 spec §10（打造 + 请教 + 铁匠任务）。`forging` 在「开炉」请教前 Lv0 且 UI 提示「孙铁匠处习得」。

---

## 9. UI / UX

### 9.1 `SkillView.vue`

- 展示 Lv5/10/15/20 四条专精（已选高亮，未达等级灰显）
- 经验条 MAX 于 20 级
- 新增 `forging` 图标（`Hammer`）

### 9.2 `PerkSelectDialog.vue`

- `level` prop 扩展为 `5 | 10 | 15 | 20`
- 标题：「{技能} 达到 {n} 级！」

### 9.3 `CharInfoView.vue`

- 同步专精展示与 PERK 名称表

### 9.4 技能页导航

- 无需新路由；`forging` 经验在锻造界面获得后自动反映

---

## 10. 测试要求

| 文件 | 覆盖 |
|------|------|
| `src/data/skills.test.ts` | 每技能 16 条路径 `getPerkOptions` 不空；分支父级匹配 |
| `src/stores/useSkillStore.test.ts` | 升至 20；15/20 专精门槛；EXP_TABLE |
| `src/stores/useSkillStore.migrate.test.ts` | `blacksmith`→`metal_merchant`；forging 补全 |
| 回归 | 现有 `cookingPerks.test.ts`、酒肆 simulate 读 perk 不变 |

---

## 11. 实现阶段（供 implementation plan 拆分）

| Phase | 内容 |
|-------|------|
| **P1 数据层** | types、`skills.ts`、EXP_TABLE、store CRUD、迁移 |
| **P2 专精 UI** | Dialog + SkillView + CharInfo |
| **P3 效果接入** | 按技能分批 `grep perk10` 扩展 perk15/20；`metal_merchant` 重命名 |
| **P4 品质/任务** | 品质门槛 5/10/15；系统任务 15/20；知识库 kb 技能条目 |
| **P5 forging 占位** | 第 7 技能 UI 可见；经验源关闭直至锻造 spec |

---

## 12. 不在本文范围

- 亲手锻造配方、品质、词条、锻造台 UI
- NPC 请教 / 烹饪·锻造任务线（锻造 spec）
- 知识库武器店归属（**已单独修正**）

---

## 13. 待决（实现前可微调）

| # | 项 | 默认 |
|---|-----|------|
| 1 | `bulk_artisan` 加工批量 | 挂钩 `processing.ts` 的 `maxInputQuantity`，P3 与加工坊对齐 |
| 2 | `furnace_king`「燃料」 | 若加工机无燃料字段则改为「熔炉类配方时间 -25%」 |
| 3 | forging Lv15/20 最终数值 | 锻造 spec 定稿后回填本文 §8.7 |
| 4 | 中毒/解毒机制 | **不在技能树 v1 引用**；若未来实装，在锻造/药铺 spec 单列专精补丁 |

---

**请审阅本文**。确认后我将撰写：

1. `design/superpowers/plans/2026-06-10-skill-tree-implementation.md`（实现计划）  
2. `design/superpowers/specs/2026-06-10-forging-design.md`（锻造玩法 spec，独立文档）
