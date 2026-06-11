# AI 系统未实装清单 & 任务系统实施计划

> **日期**：2026-06-09  
> **设计基准**：`design/superpowers/specs/2026-06-08-ai-system-design.md`  
> **优先级**：P0 任务系统全量实装 → P1 功勋商店购买 → P2 其余 AI 系统能力

---

## 一、总览：设计 vs 现状

| 模块 | 设计章节 | 现状 | 优先级 |
|------|----------|------|--------|
| 任务系统 | §2E | 骨架已有，派发/验收/过期/议价未接入 | **P0（本次）** |
| 功勋商店 | §2E.5 | UI 展示商品，购买逻辑未实装 | P1 |
| 动态 buff 兑换 | §2E.6 | 未实装 | P1 |
| 亲和度专属加减 | §2B.2 | ✅ `systemAffinityEngine` + 行为钩子 | P2 完成 |
| 长期记忆 / 时间线 | §3A | ✅ 里程碑/7日摘要/缺席感知/晚安 | P2 完成 |
| 离线知识库 | §3.3 | ✅ 合并 kb_part1~8（300+ 条） | P2 完成 |
| 在线 Persona Skill | §2D.2 | ✅ 后端 embed personas/*.md | P2 完成 |
| 云端存档备份 | §3.5 | ✅ 自动上传 + 冲突检测/解决 | P3 完成 |
| 触发事件清单 | §5.2 | ✅ 13 类事件主动搭话 | P3 完成 |
| 冷却与频率控制 | §5.4 | ✅ 15 分钟冷却 + 日上限 10 次 | P3 完成 |

---

## 二、P0：任务系统实施任务分解

### Task 1：数据模型扩展

**文件**：`src/types/system.ts`

- 增加 `expired`、`assignedDay`、`templateId`、`title`、`description`、`progress`、`swappedType`
- `serialize` / `deserialize` 持久化 `lastQuestDay`

### Task 2：模板池

**文件**：`src/data/systemQuestTemplates.ts`

- 主池 35 条 + 备用池 20 条，覆盖 7 类型 × 4 难度
- 每季（28 天）轮换约 1/3 模板（哈希禁用，无需额外存档）

### Task 3：任务引擎（纯函数）

**文件**：`src/composables/systemQuestEngine.ts`

| 函数 | 职责 |
|------|------|
| `pickQuestTemplate` | 按季轮换 + 去重已持有同模板 |
| `createQuestFromTemplate` | 生成 `SystemQuest`，亲和度宽限 |
| `describeQuest` | 人类可读描述 |
| `isQuestComplete` | 跨 Store 验收（注入 context） |
| `applyNegotiation` | 延期 / 降目标 / 换类型 |
| `processExpiredQuests` | 过期罚金 50% |
| `reconcileQuestsOnLoad` | 读档：过期、无效物品/NPC、去重、超 3 条 |
| `getQuestAnnouncement` | 按人格发任务语气 |

### Task 4：Store 接入

**文件**：`src/stores/useSystemStore.ts`

- 移除内联 `generateQuest` / 写死青鸾公告
- 导出 `acceptQuest`、`negotiateQuest`、`validateQuests`、`recordTavernRevenue`、`recordFeastCompleted`

### Task 5：日结与读档钩子

| 文件 | 改动 |
|------|------|
| `src/composables/useEndDay.ts` | `nextDay` 后：`processExpired` → `checkQuestAssignment` → `validateQuests`；酒肆营收回调 |
| `src/stores/useSaveStore.ts` | `loadFromSlot` 后 `reconcileQuestsOnLoad` + `validateQuests` |
| `src/stores/useTavernStore.ts` | 宴席完成时 `recordFeastCompleted` |

### Task 6：UI

**文件**：`src/components/game/SystemPanel.vue`

- 展示标题、描述、进度、状态（待接受 / 进行中 / 已完成 / 已过期）
- 议价三按钮 + 接受；移除「标记完成（调试用）」

### Task 7：知识库

| 文件 | 内容 |
|------|------|
| `src/data/systemKnowledge.ts` | 任务机制、功勋、议价、7 类任务说明 |
| `backend/internal/knowledge/kb_part8_system_quest.json` | 同上，供在线 AI 检索 |

### Task 8：测试

**文件**：`src/composables/systemQuestEngine.test.ts`

- 验收逻辑、议价、过期罚金、读档去重

---

## 三、P1：功勋商店（已完成 2026-06-09）

- [x] `meritShop.ts` 目录商品 + `purchaseMeritShopItem` 购买逻辑
- [x] 永久 / 限时 buff 接入出售价、钓鱼、技能经验等
- [x] AI 许愿评估：`/api/v1/merit/evaluate` + 离线规则引擎
- [x] `customShopOffers` 随存档序列化（各存档互不干扰）

---

## 四、P2：AI 陪伴与知识库（已完成 2026-06-09）

- [x] `systemKnowledge.ts` 合并 `kb_part1~8`（300+ 条）+ 系统机制本地条目
- [x] `systemAffinityEngine.ts`：每日开面板/对话/接受任务 + 四人格行为加减
- [x] `systemMemoryEngine.ts` + `systemCompanionEngine.ts`：里程碑、7 日摘要、晚安、缺席问候、主动关心
- [x] `useSystemStore` 序列化 `memoryState` / `affinityDaily`；在线 context 附带亲和与时间线
- [x] 后端 `buildPlayerContextText` 输出亲和度与人格记忆
- [x] 单元测试：`systemAffinityEngine.test.ts`、`systemMemoryEngine.test.ts`（11 项）
- [x] 已部署 http://47.108.84.163:8005/

---

## 五、P3：触发与云端（已完成 2026-06-09）

- [x] `systemTriggerEngine.ts`：13 类事件 + 四人格离线模板文案
- [x] §5.4 冷却：同类型 0.25 游戏小时（15 分钟）+ 每日上限 10 次 + 离线 50% 降频
- [x] 钩子：换季/节日/天气/体力/技能升级/加工完成/矿层/BOSS/安全点/NPC 升心/生日/背包 80%
- [x] 云端：存档/自动存档时后台上传；`compareCloudWithLocal` 冲突检测
- [x] `SaveManager`：云端较新/本地较新标签 + 一键覆盖解决
- [x] 单测 `systemTriggerEngine.test.ts`（4 项）
- [x] 已部署 http://47.108.84.163:8005/

---

## 六、验收标准（P0）

- [x] 觉醒后每 2~3 游戏日可收到新任务（活跃任务 < 3）
- [x] 7 类任务均可从模板池抽到且描述正确（55 条模板，季轮换）
- [x] 背包/矿洞/NPC/技能/钓鱼/酒肆达标后自动完成并加功勋
- [x] 超期扣 50% 功勋罚金，任务标 `expired`
- [x] 议价 3 轮 + 人格化公告
- [x] 读档不丢任务、去重/校验、不超 3 条活跃
- [x] 离线知识库可问答「系统任务」「功勋」（`systemKnowledge.ts` + `kb_part8`）
- [x] `systemQuestEngine.test.ts` 通过（8 tests）
