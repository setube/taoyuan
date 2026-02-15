<div align="center">
  <img src="images/logo.png" alt="桃源乡" width="128" style="image-rendering: pixelated;" />
</div>

# 桃源乡

> 传说在群山深处，有一处与世隔绝的村落——桃源乡。
> 这里四季分明，民风淳朴，但近年来年轻人纷纷离去，村庄日渐冷清。
> 你收到一封来自已故祖父的信，信中附有一把铜钥匙和一张泛黄的地契……

**桃源乡**是一款文字版田园模拟经营游戏，灵感来自《星露谷物语》，采用像素 + 中国风视觉设计。纯客户端运行，无需后端服务器；支持浏览器（GitHub Pages）与 Electron 桌面端。

---

## 游戏特色

**角色创建** — 输入名字、选择性别，NPC 会根据你的身份使用不同称呼，只能与异性 NPC 求婚

**六种田庄** — 桃源田庄、溪流田庄、竹林田庄、山丘田庄、荒野田庄、草甸田庄，各有独特加成

**四季轮回** — 春耕夏种秋收冬藏，28 天一季，天气影响农事（晴/雨/雷雨/雪/大风）

**田庄经营** — 开垦荒地、种植作物、安装洒水器、施肥提质、建造温室，从 4×4 小田扩建至 8×8 大庄园

**畜牧养殖** — 建造鸡舍和畜棚，饲养鸡、鸭、牛、羊，喂食抚摸提升好感，收获蛋奶羊毛

**果树种植** — 购买树苗，28 天成熟，当季产出水果

**技能成长** — 农耕、采集、钓鱼、挖矿四大技能，等级 5 和 10 可选择专精方向

**乡里社交** — 6 位性格各异的村民（陈伯、柳娘、阿石、秋月、林老、小满），送礼、聊天、触发心事件，还可以求婚成家生子

**文字博弈钓鱼** — 抛竿、观察鱼的状态（挣扎/平静/猛冲），选择拉线、放线或等待

**矿洞探险** — 云隐矿洞 30 层，三大区域（浅矿/深矿/熔岩），回合制战斗，采集矿石与宝石

**烹饪系统** — 收集食谱，烹饪料理恢复体力并获得当日增益

**加工制造** — 酿酒、腌制、磨粉，将作物加工为高价值商品

**任务成就** — 完成任务获取奖励，解锁成就记录你的田园生涯

**8-bit 音乐** — 中国风五声音阶 BGM（四季+节日+战斗），随天气和时段动态变化；20+ 种芯片音效

---

## 游戏截图

![游戏截图1](images/1.png)

![游戏截图2](images/2.png)

---

## 快速开始

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本（输出到 docs/，可用于 GitHub Pages）
pnpm build

# 预览构建结果
pnpm preview

# 构建 Electron 桌面版（Windows zip 输出到 pkg/）
pnpm run build:electron
```

---

## 技术栈

| 技术            | 版本  | 用途                             |
| --------------- | ----- | -------------------------------- |
| Vue 3           | 3.5   | 组合式 API + `<script setup>`    |
| TypeScript      | 5.9   | 严格类型检查                     |
| Vite            | 7     | 构建与开发服务器                 |
| Pinia           | 3     | 状态管理（24 个 store）          |
| TailwindCSS     | 4     | 原子化样式 + `@theme` 自定义主题 |
| Vue Router      | 5     | 客户端路由（主菜单 + 21 个游戏面板） |
| Tone.js         | 15    | 程序化音频合成（BGM + SFX）      |
| lucide-vue-next | 0.563 | 图标库                           |
| VueUse          | 14    | 组合式工具函数                   |
| CryptoJS        | 4     | 存档 AES 加密                    |
| Electron        | 39    | 桌面客户端（可选）               |

---

## 项目结构说明

### 整体架构

- **入口**：`index.html` → `src/main.ts` 挂载 Vue 应用，注册 Pinia 与 Vue Router。
- **路由**：Hash 模式。`/` 为主菜单（MainMenu），`/game` 为游戏主界面（GameLayout），子路由对应 21 个游戏面板。
- **状态**：所有游戏数据与进度由 Pinia stores 管理，与 `src/data` 中的静态配置分离。
- **部署**：  
  - **网页版**：`pnpm build` 生成 `docs/`，由 GitHub Actions 部署到 GitHub Pages。  
  - **桌面版**：`pnpm run build:electron` 打包 Electron，产物在 `pkg/`，CI 会发布到 GitHub Release。

### 目录与文件职责

```
taoyuan/
├── index.html              # 单页入口，meta、兼容性检测、统计脚本
├── vite.config.ts          # Vite 配置（base: './', 输出 docs/, @ 别名, Tailwind）
├── tsconfig*.json          # TypeScript 配置（app / node）
├── package.json            # 依赖与脚本（dev / build / build:electron）
├── go.mod                  # Go 模块占位（当前未使用）
│
├── electron/
│   ├── main.js             # Electron 主进程：窗口、托盘、设置读写、加载 docs/ 或 dev URL
│   └── preload.js         # 预加载脚本：暴露 getSettings / setSettings / restartWindow / quitApp
│
├── src/
│   ├── main.ts             # 创建 Vue 应用，挂载 Pinia、Router，引入 app.css
│   ├── App.vue             # 根组件，仅渲染 <RouterView />，生产环境禁止选中
│   ├── app.css             # 全局样式：zpix 字体、@theme 中国色、品质色、no-select、游戏面板等
│   ├── env.d.ts            # 环境类型声明
│   │
│   ├── router/
│   │   └── index.ts        # 路由定义：/ → MainMenu；/game → GameLayout，children 为 21 个面板
│   │
│   ├── views/              # 页面级视图
│   │   ├── MainMenu.vue    # 主菜单：新游戏、存档槽位（加载/删除/导出/导入）、关于、隐私/角色创建
│   │   ├── GameLayout.vue  # 游戏外壳：状态栏、睡眠确认、季节/心事件/节日/专精/宠物弹窗、移动端地图与设置
│   │   └── game/           # 21 个游戏面板（与路由一一对应）
│   │       ├── FarmView.vue        # 田庄：地块、种植、浇水、收获、洒水器、温室
│   │       ├── AnimalView.vue      # 畜牧：鸡舍/畜棚、喂养、抚摸、收获
│   │       ├── HomeView.vue        # 自家：升级、仓库、宠物
│   │       ├── NpcView.vue         # 乡里：村民列表、送礼、对话、心事件
│   │       ├── ShopView.vue        # 商店：季节商品、购买/出售
│   │       ├── ForageView.vue      # 采集：野外采集、果树
│   │       ├── FishingView.vue     # 钓鱼：抛竿、文字博弈钓鱼
│   │       ├── MiningView.vue      # 矿洞：层数、战斗、矿石
│   │       ├── CookingView.vue     # 烹饪：食谱、料理、增益
│   │       ├── ProcessingView.vue  # 加工坊：酿酒、腌制、磨粉等
│   │       ├── ToolUpgradeView.vue # 工具升级：水壶/锄头/镐/鱼竿
│   │       ├── InventoryView.vue   # 背包与工具栏
│   │       ├── SkillView.vue        # 技能：农耕/采集/钓鱼/挖矿、专精
│   │       ├── AchievementView.vue # 成就
│   │       ├── WalletView.vue      # 钱包与收支
│   │       ├── QuestView.vue       # 任务
│   │       ├── CharInfoView.vue    # 角色信息
│   │       ├── BreedingView.vue    # 养殖（育种）
│   │       ├── MuseumView.vue      # 博物馆
│   │       ├── GuildView.vue       # 公会
│   │       └── HanhaiView.vue      # 瀚海（扩展玩法）
│   │
│   ├── components/game/    # 游戏内共用组件与弹窗
│   │   ├── StatusBar.vue       # 顶部状态栏：时间、天气、体力、金钱、睡眠按钮
│   │   ├── SettingsDialog.vue  # 设置：音量、存档管理、Electron 下关闭到托盘等
│   │   ├── SaveManager.vue     # 存档槽位管理（保存/加载/删除/导出/导入）
│   │   ├── MobileMapMenu.vue   # 移动端底部地图：快速跳转各面板
│   │   ├── EventDialog.vue     # 季节事件弹窗
│   │   ├── HeartEventDialog.vue # 心事件弹窗
│   │   ├── PerkSelectDialog.vue # 技能 5/10 级专精选择
│   │   ├── FishingMiniGame.vue # 钓鱼小游戏 UI
│   │   ├── HarvestFairView.vue  # 丰收节
│   │   ├── DragonBoatView.vue   # 端午龙舟
│   │   ├── LanternRiddleView.vue # 灯谜
│   │   ├── PotThrowingView.vue   # 投壶
│   │   ├── DumplingMakingView.vue # 包饺子
│   │   ├── FireworkShowView.vue   # 烟火大会
│   │   ├── TeaContestView.vue     # 茶艺比赛
│   │   ├── KiteFlyingView.vue     # 放风筝
│   │   ├── FishingContestView.vue # 钓鱼比赛
│   │   ├── TexasHoldemGame.vue    # 德州扑克小游戏
│   │   ├── BuckshotRouletteGame.vue # 赌命轮盘小游戏
│   │   └── …（其余节日/小游戏视图）
│   │
│   ├── stores/             # Pinia 状态（24 个）
│   │   ├── index.ts            # 统一导出
│   │   ├── useGameStore.ts     # 时间、季节、天气、地点、存档槽、田庄类型等
│   │   ├── usePlayerStore.ts   # 姓名、性别、体力、金钱、工具等级等
│   │   ├── useInventoryStore.ts   # 背包、工具栏
│   │   ├── useFarmStore.ts     # 地块、作物、洒水器、温室等
│   │   ├── useShopStore.ts     # 商店状态
│   │   ├── useSaveStore.ts     # 存档读写、加密、槽位
│   │   ├── useSkillStore.ts    # 四大技能等级与专精
│   │   ├── useNpcStore.ts      # 村民好感、心事件、婚姻
│   │   ├── useFishingStore.ts  # 钓鱼进度与记录
│   │   ├── useMiningStore.ts   # 矿洞层数、战斗、矿石
│   │   ├── useCookingStore.ts  # 已学食谱、当日增益
│   │   ├── useProcessingStore.ts # 加工队列与机器
│   │   ├── useAchievementStore.ts # 已达成成就
│   │   ├── useAnimalStore.ts   # 动物、鸡舍/畜棚
│   │   ├── useHomeStore.ts     # 房屋升级、仓库、宠物
│   │   ├── useWalletStore.ts   # 收支记录
│   │   ├── useQuestStore.ts    # 任务接取与进度
│   │   ├── useSettingsStore.ts # 音量等设置
│   │   ├── useWarehouseStore.ts # 仓库
│   │   ├── useBreedingStore.ts # 育种
│   │   ├── useMuseumStore.ts   # 博物馆捐赠
│   │   ├── useGuildStore.ts    # 公会
│   │   ├── useSecretNoteStore.ts # 秘密笔记
│   │   └── useHanhaiStore.ts   # 瀚海
│   │
│   ├── composables/        # 可复用逻辑
│   │   ├── useNavigation.ts  # 面板 key、TABS 配置、navigateToPanel（路由跳转）
│   │   ├── useGameLog.ts     # 游戏日志、浮动提示、专精检查
│   │   ├── useGameClock.ts   # 游戏内时钟推进
│   │   ├── useFarmActions.ts # 田庄操作：耕地、播种、浇水、收获、施肥、除虫除草、批量操作
│   │   ├── useEndDay.ts      # 日结算：体力恢复、作物生长、动物、天气、事件、节日、存档
│   │   ├── useDialogs.ts     # 季节事件、心事件、婚礼、节日、专精选择、宠物领养
│   │   └── useAudio.ts       # BGM 与 20+ 种 SFX（Tone.js 程序化）
│   │
│   ├── data/               # 静态游戏数据（由 data/index.ts 统一导出）
│   │   ├── crops.ts         # 作物定义与生长
│   │   ├── items.ts         # 物品
│   │   ├── fish.ts          # 鱼类与钓鱼
│   │   ├── npcs.ts          # 村民
│   │   ├── mine.ts          # 矿洞与怪物
│   │   ├── recipes.ts       # 烹饪食谱
│   │   ├── events.ts        # 季节事件
│   │   ├── forage.ts        # 采集物
│   │   ├── upgrades.ts      # 工具升级
│   │   ├── processing.ts    # 加工配方
│   │   ├── achievements.ts  # 成就
│   │   ├── heartEvents.ts   # 心事件
│   │   ├── timeConstants.ts # 时间常量、时段、地点分组、行程
│   │   ├── animals.ts       # 动物
│   │   ├── fruitTrees.ts    # 果树
│   │   ├── buildings.ts     # 建筑（鸡舍、畜棚、温室等）
│   │   ├── farmMaps.ts      # 六种田庄地图配置
│   │   ├── quests.ts        # 任务
│   │   ├── weapons.ts       # 武器
│   │   ├── travelingMerchant.ts # 旅行商人
│   │   ├── shops.ts         # 商店配置
│   │   ├── storyQuests.ts   # 主线/剧情任务
│   │   ├── rings.ts / hats.ts / shoes.ts # 装备
│   │   ├── themes.ts        # 主题
│   │   ├── breeding.ts      # 育种
│   │   ├── market.ts        # 市场
│   │   ├── museum.ts        # 博物馆
│   │   ├── guild.ts         # 公会
│   │   ├── npcTips.ts       # NPC 提示
│   │   ├── secretNotes.ts   # 秘密笔记
│   │   ├── hanhai.ts        # 瀚海
│   │   ├── wallet.ts        # 钱包相关
│   │   └── wildTrees.ts    # 野外树木
│   │
│   ├── types/              # TypeScript 类型（与 data / stores 对应）
│   │   └── index.ts 以及 game, item, farm, npc, skill, processing, achievement,
│   │       animal, quest, mine, ring, equipment, breeding, museum, guild,
│   │       secretNote, hanhai 等
│   │
│   └── assets/             # 静态资源（如 fonts/zpix.woff2）
│
├── public/                 # 无需构建的静态文件（如 favicon.ico）
├── docs/                   # 构建输出（GitHub Pages 部署此目录）
├── pkg/                    # Electron 打包输出（zip 等）
├── .github/
│   ├── workflows/
│   │   ├── build.yml       # 主分支 push：构建 Electron → 上传 artifact → 创建/更新 Release
│   │   └── github-pages.yml # 主分支 push：构建 Vite → 部署 docs/ 到 GitHub Pages
│   ├── ISSUE_TEMPLATE/     # 问题模板（BUG、功能请求、反馈、文档改进）
│   └── FUNDING.yml        # 赞助信息
├── images/                 # README 用图（logo、截图）
├── LICENSE
├── CODE_OF_CONDUCT.md
└── README.md               # 本文件
```

---

## 游戏系统一览

| 系统     | 说明                                                                |
| -------- | ------------------------------------------------------------------- |
| 时间     | 年 → 季（春夏秋冬）→ 天（28天/季）→ 时段，天气系统                  |
| 体力     | 初始 120，所有操作消耗体力，可通过药膳提升上限至 180                |
| 农场     | 地块网格，种植→浇水→生长→收获，洒水器自动浇水，肥料提升品质         |
| 温室     | 不受季节限制，全年种植                                              |
| 畜牧     | 鸡舍（鸡/鸭）和畜棚（牛/羊），好感度影响产出品质                    |
| 品质     | 普通/优良/精品/极品，影响售价（×1.0/×1.25/×1.5/×2.0）和送礼效果     |
| 背包     | 20-36 格，单格堆叠上限 99，工具栏独立                               |
| 工具     | 水壶/锄头/镐/鱼竿，三级升级（基础→铁制→精钢），降低体力消耗         |
| 商店     | 按季节更新商品，可出售背包物品，物品品质可视化标识                  |
| 存档     | 3 个存档槽位（localStorage + AES 加密），每日自动保存，支持导入导出 |
| 音乐音效 | 五声音阶程序化 BGM + 20 余种 8-bit 芯片音效                         |

---

## 设计规范

- **配色**：传统中国色系（墨色背景 #1a1a1a、赤金强调 #c8a45c、朱红警告 #c34043、竹青成功 #5a9e6f）
- **字体**：zpix 像素字体，关闭字体平滑
- **UI 风格**：扁平硬边按钮、1px 细边框、最大 2px 圆角、4px 倍数间距
- **响应式**：移动端底部导航 + 桌面端侧边栏，768px 断点

---

## 交流

- QQ 群：920930589
- GitHub：[https://github.com/setube/taoyuan](https://github.com/setube/taoyuan)

---

## 许可证

本项目采用 [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/deed.zh-hans) 许可协议。

允许自由共享和演绎，但 **未经作者书面授权，禁止用于任何商业目的**。详见 [LICENSE](LICENSE) 文件。
