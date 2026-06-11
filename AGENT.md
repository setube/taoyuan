# 桃源乡（taoyuan）— Agent 工作手册

> **执行者**：在 Cursor / 自动化流程中修改本仓库或部署定制版的 Agent。  
> **硬性约束**：所有功能改动与优化 **必须兼容旧存档**，不得破坏、覆盖或篡改玩家已有进度。

相关文档：

| 文档 | 用途 |
|------|------|
| 本文 `AGENT.md` | 存档兼容、改代码规范、热更部署 |
| [README.md](./README.md) | 项目介绍与本地开发 |
| [../taoyuan-deploy/DEPLOY-ALIYUN.md](../taoyuan-deploy/DEPLOY-ALIYUN.md) | 阿里云 ECS 生产部署 |

---

## 1. 存档机制（必读）

| 项 | 说明 |
|----|------|
| 存储位置 | 玩家浏览器 **`localStorage`**（不在服务器） |
| 键名 | `taoyuanxiang_save_0` / `_1` / `_2`（**3 槽位**，勿改） |
| 加密 | AES，密钥常量 `ENCRYPTION_KEY`（`useSaveStore.ts`，**勿改**） |
| 读写入口 | `src/stores/useSaveStore.ts` → 各 store 的 `serialize` / `deserialize` |
| 自动存档 | 游戏内 **每日结算**（`useEndDay.ts` → `saveStore.autoSave()`），非实时 |
| 云同步 | 可选 WebDAV（`useWebdav.ts`），默认关闭 |

**服务器重启、Docker 热更前端** 不影响玩家存档；换浏览器、清缓存会导致丢档。

---

## 2. 旧存档兼容 — 强制规则

### 2.1 必须遵守

1. **只增不删**  
   - 新功能用 **新字段**、新 `tutorial.flags` 键。  
   - **禁止** 修改已有字段含义、删除已有 JSON 字段、重命名已持久化字段。

2. **`deserialize` 必须兜底**  
   - 缺字段用 `??`、`?.` 或显式判断，给 **安全默认值**（0、空数组、`false`）。  
   - 参考：`useTutorialStore`、`usePlayerStore`、`useWarehouseStore`。

3. **禁止在加载时改写旧进度**  
   - 不得在 `loadFromSlot` / `deserialize` 中无条件重置金钱、背包、好感、日期等。  
   - 「迁移」仅用于 **补全缺失结构**（如旧档无 `chests` 但有 `items`），且 **不得删除或替换** 已有数据。

4. **新系统对旧档透明**  
   - 新玩法默认：未解锁 / 空列表 / 0 进度，等同从未玩过该功能。

5. **常量不可变**  
   - `SAVE_KEY_PREFIX`、`MAX_SLOTS`、`ENCRYPTION_KEY`、存档文件扩展名 `.tyx` — 变更会导致旧档无法读取。

6. **彩蛋 / 标记类**  
   - 每条口令、每个奖励用 **独立** `tutorial.flags` 键。  
   - 若曾用过旧 flag 名，须保留读取逻辑（示例见 `src/data/wishWellCodes.ts` 中 `WISH_WELL_LEGACY_HAOXIANG_FLAG`）。

### 2.2 明确禁止

- 修改 `serialize` 输出结构导致旧 JSON 无法 `deserialize`
- 在加载后批量 `reset` 各 store（除非明确是「新游戏」流程，且未写入旧槽位）
- 将默认值从「空」改为「赠送资源」，使旧档加载后凭空获得物品或金钱
- 更换加密算法或密钥而不提供旧档迁移工具

### 2.3 推荐模式（与现有代码一致）

```typescript
// deserialize 示例
const deserialize = (data: Record<string, unknown>) => {
  newField.value = (data.newField as number) ?? 0
  list.value = (data.list as Item[]) ?? []
  flags.value = data?.flags ?? {}
}

// 新 NPC / 新条目：合并而非覆盖
const savedIds = new Set(saved.map(s => s.id))
const merged = [...saved, ...defaults.filter(d => !savedIds.has(d.id))]
```

```typescript
// 新 flag：旧档无键则 getFlag 为 false
tutorialStore.getFlag('wishWell_newFeature') // 未领取
```

### 2.4 禁止直接使用 `crypto.randomUUID()`（前端）

生产环境以 **HTTP** 访问（如 `http://47.108.84.163:8005`），非 HTTPS **安全上下文** 下 `crypto.randomUUID()` 在多数浏览器中不可用或调用即抛错，会导致依赖它的逻辑（如会话统计 `startAnalytics`）整段中断且请求发不出去。

| 规则 | 说明 |
|------|------|
| **禁止** | 业务代码中直接写 `crypto.randomUUID()` |
| **必须** | 使用 `src/utils/id.ts` 导出的 `createId()` |
| **原因** | `createId()` 在 HTTPS 下优先用 `randomUUID`，HTTP 下自动降级为时间戳 + 随机串 |

```typescript
import { createId } from '@/utils/id'

const sessionId = createId() // ✅
// const sessionId = crypto.randomUUID() // ❌ 禁止
```

新增需要唯一 ID 的场景（会话、消息、临时键等）一律走 `createId()`；仅 `id.ts` 与 `id.test.ts` 内部可触及 `crypto.randomUUID`。

### 2.5 改完必测（Agent 自检）

- [ ] 使用 **改代码前** 导出的 `.tyx` 或浏览器已有槽位 **读档成功**
- [ ] 金钱、季节/天数、背包、NPC 好感与改前一致
- [ ] 已领取的许愿井 / 教程 flag 仍视为已领取，**不重复发奖**
- [ ] 日结后 `autoSave` 再读档，数据仍正确
- [ ] `npx vue-tsc -b` 通过；发布前 `npx vite build` 成功

---

## 3. 告示栏 vs Agent 记录（强制分工）

用户要求的功能改动，**写完代码后必须同步文档**，按类型分流：

### 3.0 知识库同步（游戏机制改动 — 强制）

凡改动**玩家可感知的游戏规则、数值、建造条件、社交流程、商店/节日/任务机制**等，除按 §3.1 更新告示栏外，**必须同步更新 AI 知识库**，否则系统助手会按旧条目胡编。

| 项 | 说明 |
|----|------|
| 知识库位置 | `backend/internal/knowledge/kb_part*.json`（纯 JSON 数组，按 `id` 唯一） |
| 加载方式 | 后端 `knowledge.LoadDir` 自动合并所有 `kb_part*.json` |
| 权威来源 | 以 `src/data/*.ts`、`src/stores/*.ts` 实装为准，**禁止**写入其他游戏（如星露谷）机制 |
| 更新方式 | **优先改已有条目**（按 `id` 或 `keywords` 检索）；无条目则追加到新文件 `kb_part{N}_*.json` |
| 必写内容 | 费用/材料/门槛/流程/限制条件等**可核对数值**；机制说明条目末尾保留 `【品质】` 段（若同类条目已有） |
| 禁止写入 | 许愿井有效口令、未实装节日、社区中心献祭等已废弃/外来内容 |
| 自检 | 改完后用 Python 校验 JSON 合法、**`id` 无重复**；条目数应与改动预期一致 |

**典型必须同步 KB 的改动**：农舍/畜舍/酒肆/山洞/仓库/背包扩格价格；好感约会求婚流程；祠堂任务包物品清单；工具升级费用；钱庄借款规则；新增加工机器建造成本；节日日期与玩法变更。

**不必写 KB 的改动**：纯 UI 样式、部署脚本、serialize 兜底、性能优化（记 §7/§8 即可）。

| 类型 | 写到哪里 | 玩家是否可见 |
|------|----------|--------------|
| **玩法 / 功能**（新系统、新交互、规则变更、平衡对玩家可见） | `src/data/gameAnnouncements.ts` → `LATEST_GAME_ANNOUNCEMENT.lines` | 是（任务页「告示栏」） |
| **UI 优化**（布局、样式、文案微调、弹窗层级） | 本文 **§8 变更记录** 或 **§7 技术/UX 优化** | 否 |
| **技术层面**（重构、类型、构建、热更、兼容兜底实现细节） | 本文 **§7 / §8** + 必要时 **§6 定制索引** | 否 |

### 3.1 更新公告（`gameAnnouncements.ts`）

- 文件：`src/data/gameAnnouncements.ts`，展示于 `src/views/game/QuestView.vue` 告示栏。
- **每完成一项用户要求的玩法功能**，在 `lines` 中 **追加一行** 简洁说明（建议「模块：一句话」），放在口令行之前的空行上方。
- **不要** 把纯 UI/技术优化写进告示栏。
- **口令** `rewardCode` / `rewardFlag` / `rewardAmount`：仅在用户明确要求发奖或换口令时修改；`lines` 末尾口令说明须与 `rewardCode` 一致。
- 换一批更新内容时：可换新 `rewardFlag`（保证每存档仍能领一次），旧 flag 保留不删。

### 3.2 仅记入 AGENT（不写告示栏）

- 组件样式、按钮位置、加载性能、代码结构、部署步骤、serialize 兜底等。
- 在 **§7 技术/UX** 或 **§8 变更记录** 用一行记录日期与摘要即可。

---

## 4. 常见改动场景指引

| 场景 | 兼容做法 |
|------|----------|
| 游戏机制 / 数值 / 建造需求变更 | 改代码 + **同步 `kb_part*.json` 对应条目**（§3.0）+ 玩家可见则告示栏 `lines` 追加 |
| 新增口令 / 彩蛋 | 新 `flag` 键 + 新奖励；旧 flag 名保留判断 |
| 新增物品 / 作物 | 仅在新玩法逻辑中出现；旧档无该 ID 时不处理 |
| 平衡数值调整 | 只影响 **之后** 的行为；不 retroactive 改存档内数量 |
| UI / 文案 / 性能 | 一般不触及 serialize，通常无存档风险；**不写告示栏**，记 AGENT |
| 新增 store | `useSaveStore` 的 save/load 中 **可选** 序列化；`deserialize` 缺省跳过 |
| 修复 bug | 确认修复不会在读档时批量改写历史数据 |
| 用户要求的新功能 | 改代码 + **告示栏 `lines` 追加一行** |

---

## 5. 生产部署与热更（阿里云）

与 [taoyuan-deploy/DEPLOY-ALIYUN.md](../taoyuan-deploy/DEPLOY-ALIYUN.md) 一致。定制版 **不** 使用官方 `ghcr.io` 镜像时，采用静态资源热更：

```powershell
# 本机
cd taoyuan
npx vite build   # 产物在 docs/

cd docs
tar -czf ../taoyuan-dist.tar.gz .

$KEY = "C:\Users\Administrator\Downloads\cursor.pem"
$SSH = "root@47.108.84.163"
scp -i $KEY ..\taoyuan-dist.tar.gz "${SSH}:/tmp/taoyuan-dist.tar.gz"
ssh -i $KEY $SSH "mkdir -p /tmp/taoyuan-hot && rm -rf /tmp/taoyuan-hot/* && tar -xzf /tmp/taoyuan-dist.tar.gz -C /tmp/taoyuan-hot && docker cp /tmp/taoyuan-hot/. taoyuan:/usr/share/nginx/html/ && curl -s -o /dev/null -w 'taoyuan:%{http_code}\n' http://127.0.0.1:8081/"
```

**注意**：热更只更新前端静态文件，**不涉及** 玩家存档（存档仍在各自浏览器）。

---

## 5.1 酒肆 v1（已实现）

规格 [design/superpowers/specs/2026-06-04-tavern-design.md](design/superpowers/specs/2026-06-04-tavern-design.md) · 计划 [design/superpowers/plans/2026-06-04-tavern-implementation.md](design/superpowers/plans/2026-06-04-tavern-implementation.md)

## 5.2 锻造系统 v1（已实现）

规格 [design/superpowers/specs/2026-06-10-forging-design.md](design/superpowers/specs/2026-06-10-forging-design.md) · 计划 [design/superpowers/plans/2026-06-10-forging-implementation.md](design/superpowers/plans/2026-06-10-forging-implementation.md)

- 知识库：`backend/internal/knowledge/kb_part11_forging.json` + 更新 `kb_part3`/`kb_part4` 铁匠/套装/工具条目
- 存档：`useSaveStore` → `forge` 字段；旧档 `pendingUpgrade` 读档当场结算；`defeatedBosses` 迁移 Boss 图纸
- 入口：商圈铁匠铺「锻造工坊」；工坊导航仍可用 `ToolForgePanel`

---

## 6. 定制功能索引（fork 维护）

本仓库相对上游 [setube/taoyuan](https://github.com/setube/taoyuan) 的已知定制：

| 功能 | 文件 |
|------|------|
| 告示栏更新公告与奖励口令 | `src/data/gameAnnouncements.ts`、`src/views/game/QuestView.vue` |
| 华熙小王许愿井（地图底部） | `src/components/game/MobileMapMenu.vue` |
| 许愿井弹窗与口令 | `src/components/game/WishWellDialog.vue`、`src/data/wishWellCodes.ts` |
| 钱庄借款 | `src/views/game/BankView.vue`、`src/stores/useBankStore.ts`、`src/data/bank.ts` |
| 矿洞安全点解锁弹窗 | `src/views/game/MiningView.vue`、`src/stores/useMiningStore.ts` |
| 牧场一键喂食 | `src/views/game/AnimalView.vue` |
| 商圈连原材料购买 | `src/stores/useShopStore.ts`、`src/views/game/ShopView.vue` |
| 熔炉 1～5 同类矿石批量冶炼 | `src/data/processing.ts`、`src/stores/useProcessingStore.ts`、`src/views/game/ProcessingView.vue` |
| 山洞/果林待拾取（同溪流鱼获） | `src/stores/useGameStore.ts`、`src/views/game/FarmView.vue`、`src/composables/useEndDay.ts` |
| 仓库分类绑定、一键放入、箱子扩容 | `src/stores/useWarehouseStore.ts`、`src/views/game/HomeView.vue`、`src/data/warehouse.ts` |
| 烹饪技能与专精（备料手/市厨/肆尊等） | `src/types/skill.ts`、`src/stores/useSkillStore.ts`、`src/stores/useCookingStore.ts` |
| 酒坊 1～3 批批量酿造 | `src/data/processing.ts`、`src/stores/useProcessingStore.ts`、`src/views/game/ProcessingView.vue` |
| 前厅酒肆经营（菜单/日结/亲自值班/员工/NPC 宴席） | `src/stores/useTavernStore.ts`、`src/composables/tavernSimulate.ts`、`src/views/game/TavernView.vue`、`src/data/tavern.ts` |
| 收贮归置（收获自动入出货箱/仓库） | `src/stores/useSettingsStore.ts`（`itemCollectRoutes`）、`src/stores/useInventoryStore.ts`、`src/components/game/ItemCollectRouteModal.vue`、`src/views/game/FarmView.vue`、`src/views/game/HomeView.vue`；KB `mechanic_collect_route` |
| 锻造系统（当场打造/图纸/套装/工具升级） | `src/stores/useForgeStore.ts`、`src/components/game/ForgeView.vue`、`src/data/forge*.ts`、`src/composables/forgeRoll.ts`；KB `kb_part11_forging.json` |

新增定制时在本表追加一行，便于后续 Agent 排查兼容性。

---

## 7. 技术 / UX 优化（不写告示栏）

| 日期 | 说明 |
|------|------|
| 2026-06-04 | 仓库单元测试：`vitest` + `src/**/*.test.ts`（`pnpm test`） |
| 2026-06-04 | 仓库：初始 5 槽位、扩建 +3；箱子容量 18/36/64/128/64；分类绑定与一键放入、箱子材质扩容（`useWarehouseStore`、`HomeView`、`warehouse.ts`） |
| 2026-06-04 | 仓库解锁改为 500 文、取消解锁材料（`useWarehouseStore`、`buildings.ts`） |
| 2026-06-04 | iOS Safari/Chrome：`app.css` 触控媒体查询 `touch-action: manipulation`、禁用 callout/高亮；移动端 `input` 字号 16px 防聚焦缩放；`index.html` 首屏同步 |
| 2026-06-03 | 熔炉槽位 `inputAmount`、旧档加工中默认按 5 个结算；待拾取 `pendingCaveLoot` / `pendingFruitLoot` deserialize 默认 `[]` |

---

## 8. 变更记录

| 日期 | 说明 |
|------|------|
| 2026-06-09 | 系统任务按进程过滤+新任务弹窗；AI 上下文扩展仓库/小屋/牧场；灵识在线/云备移至状态栏左上角 |
| 2026-06-09 | 知识库全面核实：修正好感/结婚/知己/钱庄/仓库/工具升级等错项；删除 part7 无实装节日；新增 `kb_part10_buildings_social.json`（建造总表+祠堂26包+社交流程）；AGENT §3.0 强制机制改动同步 KB |
| 2026-06-10 | AGENT §2.4：禁止前端直接使用 `crypto.randomUUID()`，统一 `createId()`（HTTP 生产环境兼容） |
| 2026-06-03 | 告示栏分工：玩法进 `gameAnnouncements.ts`，UI/技术仅记 AGENT |
| 2026-06 | 初版：旧存档兼容强制规则、热更流程、许愿井定制索引 |
