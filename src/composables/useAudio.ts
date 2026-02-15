import { ref } from "vue";
import type { Season, Weather, TimePeriod } from "@/types";
import type * as ToneNs from "tone";
import { useGameStore } from "@/stores";
import { getTimePeriod } from "@/data/timeConstants";

// ====== Tone.js 延迟加载（避免模块初始化时创建 AudioContext） ======

type ToneModule = typeof ToneNs;
let T: ToneModule | null = null;

/** 动态加载 Tone.js 并启动 AudioContext（首次调用需在用户手势中） */
const loadTone = async (): Promise<ToneModule> => {
  if (!T) {
    T = await import("tone");
  }
  await T.start();
  return T;
};

// ====== 音量设置 ======

const sfxEnabled = ref(false);
const bgmEnabled = ref(false);
const sfxVolume = 0.3;
const bgmVolume = 0.15;

/** 线性音量 → 分贝 */
const toDb = (v: number): number => (v <= 0 ? -Infinity : 20 * Math.log10(v));

// ====== 音效 (SFX) ======

type WaveType = "sine" | "square" | "triangle" | "sawtooth";

/** 播放简单合成音效（一次性 Synth，播放后自动销毁） */
const playSfx = (
  freq: number,
  duration = 0.1,
  type: WaveType = "square",
  vol = sfxVolume,
) => {
  if (!sfxEnabled.value || !T || document.hidden) return;
  try {
    const synth = new T.Synth({
      oscillator: { type },
      envelope: {
        attack: 0.005,
        decay: duration * 0.6,
        sustain: 0,
        release: duration * 0.3,
      },
      volume: toDb(vol),
    }).toDestination();
    synth.triggerAttackRelease(freq, duration);
    setTimeout(() => safeDispose(synth), (duration + 0.5) * 1000);
  } catch {
    /* AudioContext not ready */
  }
};

// ====== 游戏音效 ======

/** 按钮点击（清脆短促 blip） */
export const sfxClick = () => {
  playSfx(1200, 0.025, "square", 0.12);
  setTimeout(() => playSfx(800, 0.02, "square", 0.08), 20);
};

/** 浇水（水滴下落 + 扩散） */
export const sfxWater = () => {
  playSfx(500, 0.06, "sine", 0.2);
  setTimeout(() => playSfx(350, 0.08, "triangle", 0.18), 50);
  setTimeout(() => playSfx(250, 0.1, "sine", 0.12), 100);
};

/** 种植（轻柔入土两声） */
export const sfxPlant = () => {
  playSfx(400, 0.04, "triangle", 0.2);
  setTimeout(() => playSfx(600, 0.05, "triangle", 0.18), 40);
  setTimeout(() => playSfx(500, 0.03, "sine", 0.12), 80);
};

/** 收获（欢快三连音上行） */
export const sfxHarvest = () => {
  [523, 659, 784].forEach((f, i) =>
    setTimeout(() => playSfx(f, 0.07, "square", 0.22), i * 55),
  );
  setTimeout(() => playSfx(784, 0.12, "square", 0.15), 220);
};

/** 开垦（沉闷锄击 + 碎土） */
export const sfxDig = () => {
  playSfx(120, 0.06, "sawtooth", 0.25);
  setTimeout(() => playSfx(200, 0.04, "square", 0.18), 40);
  setTimeout(() => playSfx(350, 0.03, "triangle", 0.1), 70);
};

/** 购买（清脆双音确认） */
export const sfxBuy = () => {
  playSfx(660, 0.04, "triangle", 0.2);
  setTimeout(() => playSfx(880, 0.06, "triangle", 0.22), 40);
  setTimeout(() => playSfx(880, 0.03, "square", 0.1), 90);
};

/** 出售/获得金币（经典金币弹跳音） */
export const sfxCoin = () => {
  playSfx(988, 0.04, "square", 0.22);
  setTimeout(() => playSfx(1319, 0.08, "square", 0.2), 35);
};

/** 升级（华丽上行 fanfare） */
export const sfxLevelUp = () => {
  if (!sfxEnabled.value) return;
  [523, 659, 784, 880].forEach((f, i) =>
    setTimeout(() => playSfx(f, 0.1, "square", 0.25), i * 80),
  );
  setTimeout(() => playSfx(1047, 0.3, "square", 0.22), 350);
  setTimeout(() => playSfx(1047, 0.15, "triangle", 0.12), 500);
};

/** 战斗攻击（高频下扫 + 冲击，8-bit 打击感） */
export const sfxAttack = () => {
  playSfx(800, 0.04, "sawtooth", 0.3);
  setTimeout(() => playSfx(400, 0.05, "square", 0.25), 30);
  setTimeout(() => playSfx(150, 0.08, "sawtooth", 0.2), 60);
};

/** 受伤（快速高低交替嗡鸣，经典 NES 伤害音） */
export const sfxHurt = () => {
  playSfx(300, 0.04, "square", 0.25);
  setTimeout(() => playSfx(150, 0.04, "square", 0.2), 40);
  setTimeout(() => playSfx(300, 0.04, "square", 0.2), 80);
  setTimeout(() => playSfx(120, 0.06, "square", 0.15), 120);
};

/** 遭遇怪物（紧迫上行，危险警告） */
export const sfxEncounter = () => {
  [200, 300, 400, 600].forEach((f, i) =>
    setTimeout(() => playSfx(f, 0.06, "square", 0.25), i * 50),
  );
};

/** 防御格挡（金属质感短促音） */
export const sfxDefend = () => {
  playSfx(600, 0.03, "triangle", 0.25);
  setTimeout(() => playSfx(800, 0.05, "triangle", 0.2), 30);
};

/** 逃跑（快速下行滑落） */
export const sfxFlee = () => {
  [500, 400, 300, 200].forEach((f, i) =>
    setTimeout(() => playSfx(f, 0.05, "triangle", 0.2), i * 40),
  );
};

/** 击败怪物（短胜利音，上行收束） */
export const sfxVictory = () => {
  [523, 659, 784, 1047].forEach((f, i) =>
    setTimeout(() => playSfx(f, 0.1, "square", 0.25), i * 70),
  );
};

/** 钓鱼拉线（紧张棘轮音，反复勾拉） */
export const sfxReel = () => {
  playSfx(700, 0.03, "triangle", 0.18);
  setTimeout(() => playSfx(600, 0.03, "triangle", 0.15), 35);
  setTimeout(() => playSfx(750, 0.03, "triangle", 0.18), 70);
  setTimeout(() => playSfx(650, 0.03, "triangle", 0.12), 105);
};

/** 钓到鱼（欢快弹跳上行 jingle） */
export const sfxFishCatch = () => {
  [523, 659, 784, 1047].forEach((f, i) =>
    setTimeout(() => playSfx(f, 0.06, "square", 0.22), i * 55),
  );
  setTimeout(() => playSfx(1047, 0.1, "square", 0.15), 280);
};

/** 断线（急促下坠 + 闷响） */
export const sfxLineBroken = () => {
  playSfx(500, 0.04, "sawtooth", 0.25);
  setTimeout(() => playSfx(300, 0.05, "sawtooth", 0.2), 35);
  setTimeout(() => playSfx(120, 0.1, "square", 0.15), 70);
};

/** 挖矿（锐利敲击 + 碎石回弹） */
export const sfxMine = () => {
  playSfx(180, 0.04, "sawtooth", 0.25);
  setTimeout(() => playSfx(400, 0.03, "square", 0.18), 35);
  setTimeout(() => playSfx(300, 0.03, "triangle", 0.12), 65);
};

/** 休息/睡觉（柔和下行摇篮曲） */
export const sfxSleep = () => {
  [523, 440, 392, 330, 262].forEach((f, i) =>
    setTimeout(() => playSfx(f, 0.18, "sine", 0.12), i * 130),
  );
};

/** 错误/失败（短促双嗡） */
export const sfxError = () => {
  playSfx(220, 0.06, "square", 0.2);
  setTimeout(() => playSfx(180, 0.08, "square", 0.18), 70);
};

/** 采集（轻快拨取音） */
export const sfxForage = () => {
  playSfx(500, 0.04, "triangle", 0.2);
  setTimeout(() => playSfx(660, 0.05, "triangle", 0.18), 35);
  setTimeout(() => playSfx(550, 0.03, "sine", 0.1), 75);
};

// ====== 小游戏专属音效 ======

/** 小游戏开始（激昂上行 fanfare，出发！） */
export const sfxGameStart = () => {
  [523, 659, 784].forEach((f, i) =>
    setTimeout(() => playSfx(f, 0.08, "square", 0.22), i * 70),
  );
  setTimeout(() => playSfx(1047, 0.2, "square", 0.2), 240);
  setTimeout(() => playSfx(1047, 0.1, "triangle", 0.1), 380);
};

/** 倒计时滴答（每秒一次，清脆短促） */
export const sfxCountdownTick = () => {
  playSfx(600, 0.04, "triangle", 0.15);
};

/** 倒计时最后3秒（更急促，双音） */
export const sfxCountdownFinal = () => {
  playSfx(800, 0.05, "square", 0.2);
  setTimeout(() => playSfx(1000, 0.04, "square", 0.18), 50);
};

/** 小游戏操作按钮（有质感的反馈音） */
export const sfxGameAction = () => {
  playSfx(500, 0.03, "square", 0.18);
  setTimeout(() => playSfx(700, 0.025, "triangle", 0.14), 30);
};

/** 领取奖励（金币 + 短庆祝） */
export const sfxRewardClaim = () => {
  playSfx(880, 0.06, "square", 0.22);
  setTimeout(() => playSfx(1047, 0.06, "square", 0.2), 60);
  setTimeout(() => playSfx(1319, 0.1, "square", 0.22), 120);
  setTimeout(() => playSfx(1319, 0.06, "triangle", 0.12), 220);
};

// ====== 小游戏结果音效 ======

/** 完美操作（上行四音欢庆） */
export const sfxMiniPerfect = () => {
  [523, 659, 784, 1047].forEach((f, i) =>
    setTimeout(() => playSfx(f, 0.06, "square", 0.22), i * 60),
  );
};

/** 不错的操作（上行双音） */
export const sfxMiniGood = () => {
  playSfx(523, 0.05, "triangle", 0.18);
  setTimeout(() => playSfx(659, 0.05, "triangle", 0.16), 50);
};

/** 较差操作（低沉单音） */
export const sfxMiniPoor = () => {
  playSfx(196, 0.08, "triangle", 0.15);
};

/** 失败/错误（下行双音） */
export const sfxMiniFail = () => {
  playSfx(330, 0.07, "square", 0.2);
  setTimeout(() => playSfx(262, 0.07, "square", 0.18), 70);
};

/** 第1名庆祝（华丽五音 fanfare） */
export const sfxRankFirst = () => {
  [523, 659, 784, 1047].forEach((f, i) =>
    setTimeout(() => playSfx(f, 0.08, "square", 0.22), i * 80),
  );
  setTimeout(() => playSfx(1047, 0.3, "square", 0.2), 320);
  setTimeout(() => playSfx(1047, 0.15, "triangle", 0.1), 520);
};

/** 第2名（上行三音） */
export const sfxRankSecond = () => {
  [523, 659, 784].forEach((f, i) =>
    setTimeout(() => playSfx(f, 0.07, "triangle", 0.18), i * 70),
  );
};

/** 第3名（上行双音，轻柔） */
export const sfxRankThird = () => {
  playSfx(523, 0.06, "triangle", 0.15);
  setTimeout(() => playSfx(659, 0.06, "triangle", 0.13), 60);
};

/** 未获名次（缓慢下行三音） */
export const sfxRankLose = () => {
  [330, 294, 262].forEach((f, i) =>
    setTimeout(() => playSfx(f, 0.1, "sine", 0.12), i * 100),
  );
};

// ====== 防重叠快速操作音效 ======

let lastLightActionTime = 0;
const LIGHT_ACTION_INTERVAL = 80;

/** 快速操作音效（自带80ms节流，适合龙舟划桨等快速点击） */
export const sfxGameActionLight = () => {
  const now = Date.now();
  if (now - lastLightActionTime < LIGHT_ACTION_INTERVAL) return;
  lastLightActionTime = now;
  playSfx(700, 0.015, "square", 0.1);
};

// ====== 游戏专属音效 ======

// --- 钓鱼大赛 ---

/** 鱼上钩急促警示 */
export const sfxFishBite = () => {
  playSfx(880, 0.02, "square", 0.2);
  setTimeout(() => playSfx(1175, 0.025, "square", 0.2), 25);
};

/** 抛竿（下行扫频） */
export const sfxCastLine = () => {
  playSfx(600, 0.04, "triangle", 0.15);
  setTimeout(() => playSfx(400, 0.04, "triangle", 0.12), 40);
  setTimeout(() => playSfx(250, 0.05, "triangle", 0.1), 80);
};

// --- 龙舟赛 ---

/** 划桨（低沉轻量，自带节流） */
let lastPaddleTime = 0;
export const sfxPaddle = () => {
  const now = Date.now();
  if (now - lastPaddleTime < 100) return;
  lastPaddleTime = now;
  playSfx(150, 0.02, "sine", 0.12);
};

/** 终点冲线（上行三音） */
export const sfxRaceFinish = () => {
  [392, 523, 659].forEach((f, i) =>
    setTimeout(() => playSfx(f, 0.06, "square", 0.18), i * 50),
  );
};

// --- 猜灯谜 ---

/** 灯笼亮起 / 答对（上行叮咚） */
export const sfxRiddleReveal = () => {
  playSfx(659, 0.04, "sine", 0.16);
  setTimeout(() => playSfx(880, 0.05, "sine", 0.14), 45);
};

/** 答错（低沉嗡声） */
export const sfxRiddleWrong = () => {
  playSfx(180, 0.1, "square", 0.15);
};

// --- 斗茶大会 ---

/** 注水声（下行滑音） */
export const sfxTeaPour = () => {
  playSfx(400, 0.05, "sine", 0.12);
  setTimeout(() => playSfx(300, 0.04, "sine", 0.1), 50);
  setTimeout(() => playSfx(220, 0.05, "sine", 0.08), 90);
};

/** 完美步骤铃声 */
export const sfxTeaBell = () => {
  playSfx(880, 0.08, "sine", 0.15);
  setTimeout(() => playSfx(1320, 0.06, "sine", 0.13), 60);
};

// --- 农展会 ---

/** 选取物品（快拨音） */
export const sfxItemSelect = () => {
  playSfx(660, 0.03, "triangle", 0.15);
  setTimeout(() => playSfx(880, 0.025, "triangle", 0.13), 30);
};

/** 评审鼓声（4音滚奏） */
export const sfxJudging = () => {
  [262, 330, 392, 523].forEach((f, i) =>
    setTimeout(() => playSfx(f, 0.05, "square", 0.18), i * 50),
  );
};

// --- 投壶 ---

/** 箭矢飞行（上行扫频） */
export const sfxArrowFly = () => {
  playSfx(200, 0.04, "triangle", 0.12);
  setTimeout(() => playSfx(350, 0.04, "triangle", 0.12), 40);
  setTimeout(() => playSfx(500, 0.05, "triangle", 0.1), 80);
};

/** 命中壶（金属碰撞音） */
export const sfxPotClang = () => {
  playSfx(800, 0.02, "sawtooth", 0.2);
  setTimeout(() => playSfx(1200, 0.03, "triangle", 0.18), 20);
};

// --- 风筝会 ---

/** 风向变化（低频呼啸） */
export const sfxWindGust = () => {
  playSfx(220, 0.06, "sine", 0.08);
  setTimeout(() => playSfx(180, 0.08, "sine", 0.06), 50);
};

/** 拉线（短促拨弦，自带节流） */
let lastKitePullTime = 0;
export const sfxKitePull = () => {
  const now = Date.now();
  if (now - lastKitePullTime < 80) return;
  lastKitePullTime = now;
  playSfx(500, 0.015, "triangle", 0.1);
};

// --- 包饺子 ---

/** 擀皮/放馅（柔和闷击） */
export const sfxDoughStep = () => {
  playSfx(200, 0.025, "sine", 0.1);
};

/** 完成一个饺子（欢快双音） */
export const sfxDumplingDone = () => {
  playSfx(660, 0.03, "square", 0.18);
  setTimeout(() => playSfx(880, 0.03, "square", 0.16), 35);
};

// --- 烟花会 ---

/** 烟花升空（上行扫频） */
export const sfxFireworkLaunch = () => {
  playSfx(200, 0.04, "sawtooth", 0.12);
  setTimeout(() => playSfx(400, 0.04, "sawtooth", 0.12), 40);
  setTimeout(() => playSfx(700, 0.05, "sawtooth", 0.1), 80);
};

/** 烟花绽放（爆裂混合音） */
export const sfxFireworkBoom = () => {
  playSfx(400, 0.04, "sawtooth", 0.2);
  setTimeout(() => playSfx(600, 0.06, "square", 0.18), 20);
};

// ====== 赌坊音效 ======

/** 轮盘单次滴答（每格一声，自带节流） */
let lastRouletteTick = 0;
export const sfxRouletteTick = () => {
  const now = Date.now();
  if (now - lastRouletteTick < 40) return;
  lastRouletteTick = now;
  playSfx(700 + Math.random() * 200, 0.015, "square", 0.1);
};

/** 轮盘旋转（快速滴答递减） */
export const sfxRouletteSpin = () => {
  [800, 750, 700, 650, 600].forEach((f, i) =>
    setTimeout(() => playSfx(f, 0.02, "square", 0.12), i * 40),
  );
};

/** 轮盘停止（低沉落定音） */
export const sfxRouletteStop = () => {
  playSfx(300, 0.06, "triangle", 0.2);
  setTimeout(() => playSfx(200, 0.1, "sine", 0.15), 60);
};

/** 骰子单次碰撞（每次变化一声，自带节流） */
let lastDiceTick = 0;
export const sfxDiceTick = () => {
  const now = Date.now();
  if (now - lastDiceTick < 60) return;
  lastDiceTick = now;
  playSfx(600 + Math.random() * 400, 0.012, "square", 0.08);
};

/** 骰子摇动（快速碎响） */
export const sfxDiceRoll = () => {
  [900, 700, 1000, 800, 600].forEach((f, i) =>
    setTimeout(() => playSfx(f, 0.015, "square", 0.1), i * 30),
  );
};

/** 骰子落定（闷击） */
export const sfxDiceLand = () => {
  playSfx(150, 0.05, "sawtooth", 0.2);
  setTimeout(() => playSfx(250, 0.04, "triangle", 0.15), 40);
};

/** 猜杯单次移动（每步一声，自带节流） */
let lastCupTick = 0;
export const sfxCupTick = () => {
  const now = Date.now();
  if (now - lastCupTick < 70) return;
  lastCupTick = now;
  playSfx(350 + Math.random() * 200, 0.018, "triangle", 0.09);
};

/** 猜杯洗牌（快速左右移动音） */
export const sfxCupShuffle = () => {
  [400, 500, 350, 550, 400].forEach((f, i) =>
    setTimeout(() => playSfx(f, 0.02, "triangle", 0.1), i * 50),
  );
};

/** 翻杯揭晓（清脆掀盖） */
export const sfxCupReveal = () => {
  playSfx(600, 0.03, "triangle", 0.18);
  setTimeout(() => playSfx(900, 0.04, "triangle", 0.16), 35);
};

/** 蛐蛐战斗中碰撞（每步一声，自带节流） */
let lastCricketTick = 0;
export const sfxCricketTick = () => {
  const now = Date.now();
  if (now - lastCricketTick < 80) return;
  lastCricketTick = now;
  playSfx(400 + Math.random() * 300, 0.02, "sawtooth", 0.1);
};

/** 蛐蛐出战（虫鸣般颤音） */
export const sfxCricketChirp = () => {
  [1200, 1100, 1200, 1100].forEach((f, i) =>
    setTimeout(() => playSfx(f, 0.015, "square", 0.08), i * 25),
  );
};

/** 蛐蛐碰撞（短促冲击） */
export const sfxCricketClash = () => {
  playSfx(300, 0.03, "sawtooth", 0.2);
  setTimeout(() => playSfx(500, 0.04, "square", 0.18), 30);
};

/** 翻牌（纸牌翻转音） */
export const sfxCardFlip = () => {
  playSfx(800, 0.02, "triangle", 0.12);
  setTimeout(() => playSfx(600, 0.02, "triangle", 0.1), 25);
};

/** 下注/加注（筹码推出） */
export const sfxChipBet = () => {
  playSfx(500, 0.02, "square", 0.15);
  setTimeout(() => playSfx(700, 0.025, "triangle", 0.12), 25);
  setTimeout(() => playSfx(600, 0.02, "square", 0.1), 50);
};

/** 弃牌（低沉丢弃音） */
export const sfxFoldCards = () => {
  playSfx(300, 0.04, "sine", 0.12);
  setTimeout(() => playSfx(200, 0.05, "sine", 0.1), 40);
};

/** 枪击（霰弹枪开火，低频爆裂） */
export const sfxGunshot = () => {
  playSfx(100, 0.06, "sawtooth", 0.3);
  setTimeout(() => playSfx(80, 0.08, "square", 0.25), 30);
  setTimeout(() => playSfx(150, 0.04, "sawtooth", 0.15), 70);
};

/** 空弹（干瘪的咔嗒声） */
export const sfxGunEmpty = () => {
  playSfx(400, 0.02, "triangle", 0.15);
  setTimeout(() => playSfx(300, 0.02, "triangle", 0.1), 25);
};

/** 赌博赢钱（金币雨，比 sfxCoin 更华丽） */
export const sfxCasinoWin = () => {
  [880, 1047, 1319, 1047, 1319].forEach((f, i) =>
    setTimeout(() => playSfx(f, 0.05, "square", 0.2), i * 50),
  );
};

/** 赌博输钱（低沉叹息下行） */
export const sfxCasinoLose = () => {
  [330, 294, 262, 220].forEach((f, i) =>
    setTimeout(() => playSfx(f, 0.08, "sine", 0.12), i * 80),
  );
};

// ====== 背景音乐 (中国风五声音阶) ======

// 五声音阶: 宫(C) 商(D) 角(E) 徵(G) 羽(A)
// C3=131 D3=147 E3=165 G3=196 A3=220
// C4=262 D4=294 E4=330 G4=392 A4=440
// C5=523 D5=587 E5=659 G5=784 A5=880

// ---- BGM 类型定义 ----

type SeasonBgmType = "spring" | "summer" | "autumn" | "winter";
type FestivalBgmType =
  | "festival_spring"
  | "festival_summer"
  | "festival_autumn"
  | "festival_winter";
type MinigameBgmType =
  | "minigame_fishing"
  | "minigame_dragon_boat"
  | "minigame_lantern_riddle"
  | "minigame_tea_contest"
  | "minigame_harvest_fair"
  | "minigame_pot_throwing"
  | "minigame_kite_flying"
  | "minigame_dumpling"
  | "minigame_firework"
  | "hanhai";
type BgmType = SeasonBgmType | FestivalBgmType | MinigameBgmType | "battle";

let currentFestivalOverride: FestivalBgmType | MinigameBgmType | null = null;

// ---- 春季 BGM（明快上行，晨光田园） ----

const SPRING_MELODY: number[] = [
  330, 392, 440, 392, 330, 294, 262, 294, 330, 392, 440, 523, 440, 392, 330, 0,
  523, 440, 392, 330, 392, 440, 523, 587, 523, 440, 392, 440, 392, 330, 294, 0,
  294, 330, 392, 440, 392, 330, 294, 262, 294, 330, 392, 330, 294, 262, 294, 0,
  440, 392, 330, 392, 440, 523, 440, 392, 330, 294, 330, 392, 330, 294, 262, 0,
];

const SPRING_BASS: number[] = [
  131, 147, 165, 196, 220, 196, 165, 131, 147, 165, 196, 131, 220, 196, 165,
  131,
];

// ---- 夏季 BGM（活泼高音域，蝉鸣荷塘） ----

const SUMMER_MELODY: number[] = [
  523, 587, 659, 587, 523, 440, 523, 587, 659, 784, 659, 587, 523, 440, 392, 0,
  440, 523, 587, 523, 440, 392, 440, 523, 587, 523, 440, 392, 330, 392, 440, 0,
  784, 659, 587, 523, 587, 659, 523, 440, 392, 440, 523, 587, 523, 440, 392, 0,
  392, 440, 523, 587, 659, 587, 523, 440, 392, 330, 392, 440, 392, 330, 262, 0,
];

const SUMMER_BASS: number[] = [
  165, 196, 220, 196, 131, 165, 196, 220, 196, 165, 131, 147, 165, 196, 220,
  131,
];

// ---- 秋季 BGM（缓慢下行，落叶忧伤） ----

const AUTUMN_MELODY: number[] = [
  440, 392, 330, 294, 262, 294, 330, 262, 440, 392, 330, 294, 262, 294, 262, 0,
  330, 392, 440, 392, 330, 294, 330, 392, 440, 523, 440, 392, 330, 294, 262, 0,
  523, 440, 392, 330, 262, 294, 330, 294, 262, 294, 330, 392, 330, 294, 262, 0,
  294, 330, 392, 440, 392, 330, 294, 262, 294, 262, 294, 330, 294, 262, 262, 0,
];

const AUTUMN_BASS: number[] = [
  220, 196, 165, 131, 147, 165, 196, 165, 131, 147, 165, 196, 220, 196, 165,
  131,
];

// ---- 冬季 BGM（稀疏空灵，初雪炉火） ----

const WINTER_MELODY: number[] = [
  262, 0, 330, 0, 392, 330, 262, 0, 294, 0, 392, 0, 440, 392, 330, 0, 440, 392,
  330, 262, 330, 392, 330, 0, 262, 294, 330, 294, 262, 0, 262, 0, 330, 392, 440,
  0, 392, 330, 0, 262, 294, 330, 0, 294, 262, 0, 262, 0, 392, 330, 294, 262,
  294, 330, 392, 330, 294, 262, 0, 294, 262, 0, 262, 0,
];

const WINTER_BASS: number[] = [
  131, 0, 165, 0, 196, 0, 131, 0, 147, 0, 165, 131, 196, 165, 131, 0,
];

// ---- 战斗 BGM（快节奏驱动型，魂斗罗/宝可梦风格） ----

const BATTLE_MELODY: number[] = [
  // Phase 1: 急速上行 riff（驱动感）
  330, 392, 440, 523, 330, 392, 440, 523, 587, 659, 587, 523, 440, 392, 330,
  392,
  // Phase 2: 切分冲击（休止符制造打击感）
  523, 0, 523, 587, 0, 659, 587, 523, 440, 0, 440, 523, 0, 392, 440, 0,
  // Phase 3: 高音域紧张段
  659, 587, 523, 587, 659, 784, 659, 587, 523, 440, 392, 440, 523, 587, 659, 0,
  // Phase 4: 跌落 + 回旋（循环点）
  784, 659, 587, 523, 392, 440, 523, 659, 587, 523, 440, 392, 330, 392, 440, 0,
];

const BATTLE_BASS: number[] = [
  131, 196, 131, 196, 220, 196, 165, 196, 131, 220, 196, 165, 131, 165, 196,
  220,
];

// ---- 节日 BGM ----

const FESTIVAL_SPRING_MELODY: number[] = [
  523, 587, 659, 784, 659, 587, 523, 440, 523, 659, 784, 880, 784, 659, 523, 0,
];
const FESTIVAL_SPRING_BASS: number[] = [131, 196, 165, 220];

const FESTIVAL_SUMMER_MELODY: number[] = [
  440, 523, 587, 523, 440, 392, 440, 523, 587, 659, 587, 523, 440, 392, 330, 0,
];
const FESTIVAL_SUMMER_BASS: number[] = [220, 196, 165, 196];

const FESTIVAL_AUTUMN_MELODY: number[] = [
  392, 440, 523, 440, 392, 330, 392, 440, 523, 587, 523, 440, 523, 440, 392, 0,
];
const FESTIVAL_AUTUMN_BASS: number[] = [196, 220, 165, 131];

const FESTIVAL_WINTER_MELODY: number[] = [
  262, 330, 392, 440, 523, 440, 392, 330, 440, 523, 587, 659, 587, 523, 440, 0,
];
const FESTIVAL_WINTER_BASS: number[] = [131, 165, 196, 220];

// ---- 小游戏 BGM ----

// 钓鱼大赛：流水般起伏，耐心等待的感觉
const MINIGAME_FISHING_MELODY: number[] = [
  196, 220, 262, 294, 262, 220, 196, 0, 220, 262, 294, 330, 294, 262, 220, 196,
  262, 294, 330, 392, 330, 294, 262, 0, 294, 330, 392, 440, 392, 330, 294, 262,
  330, 294, 262, 220, 262, 294, 330, 0, 392, 330, 294, 262, 220, 262, 220, 0,
];
const MINIGAME_FISHING_BASS: number[] = [
  131, 196, 165, 220, 131, 196, 165, 131,
];

// 端午赛龙舟：快节奏驱动，鼓点般的急促
const MINIGAME_DRAGON_MELODY: number[] = [
  330, 392, 440, 523, 440, 392, 330, 392, 440, 523, 587, 523, 440, 0, 440, 523,
  330, 392, 440, 523, 587, 659, 587, 523, 440, 392, 330, 392, 440, 523, 440, 0,
  523, 587, 659, 587, 523, 440, 523, 587, 659, 784, 659, 587, 523, 0, 523, 0,
  440, 523, 587, 523, 440, 392, 440, 523, 330, 392, 440, 392, 330, 392, 330, 0,
];
const MINIGAME_DRAGON_BASS: number[] = [131, 196, 131, 220, 165, 196, 131, 196];

// 七夕猜灯谜：灯影摇曳，神秘沉思
const MINIGAME_RIDDLE_MELODY: number[] = [
  330, 0, 440, 392, 330, 0, 294, 262, 330, 392, 440, 0, 392, 330, 0, 262, 294,
  330, 0, 440, 392, 330, 294, 0, 262, 330, 392, 0, 440, 523, 440, 0, 392, 330,
  0, 294, 330, 392, 0, 440, 523, 440, 392, 0, 330, 294, 262, 0,
];
const MINIGAME_RIDDLE_BASS: number[] = [131, 0, 165, 0, 196, 0, 131, 0];

// 斗茶大会：文雅精致，古琴意韵
const MINIGAME_TEA_MELODY: number[] = [
  440, 392, 330, 294, 330, 392, 440, 0, 523, 440, 392, 330, 392, 440, 523, 0,
  440, 523, 587, 523, 440, 392, 330, 392, 440, 392, 330, 294, 262, 294, 330, 0,
  330, 392, 440, 523, 440, 392, 330, 294, 330, 294, 262, 294, 330, 392, 330, 0,
];
const MINIGAME_TEA_BASS: number[] = [220, 196, 165, 131, 220, 196, 165, 131];

// 丰收宴·农展会：喜庆欢快，五谷丰登
const MINIGAME_HARVEST_MELODY: number[] = [
  262, 294, 330, 392, 440, 392, 330, 294, 330, 392, 440, 523, 440, 392, 330, 0,
  523, 587, 659, 587, 523, 440, 392, 440, 523, 440, 392, 330, 294, 330, 392, 0,
  440, 523, 587, 659, 587, 523, 440, 392, 330, 392, 440, 523, 440, 392, 330, 0,
];
const MINIGAME_HARVEST_BASS: number[] = [
  131, 165, 196, 220, 131, 196, 165, 131,
];

// 重阳投壶：沉着聚焦，武道精神
const MINIGAME_POT_MELODY: number[] = [
  294, 330, 392, 330, 294, 0, 262, 294, 330, 392, 440, 392, 330, 0, 294, 330,
  392, 440, 523, 440, 392, 330, 294, 330, 392, 330, 294, 262, 294, 330, 392, 0,
  440, 392, 330, 294, 330, 392, 440, 523, 440, 392, 330, 294, 262, 294, 262, 0,
];
const MINIGAME_POT_BASS: number[] = [147, 196, 131, 165, 147, 196, 165, 131];

// 秋风筝会：轻盈高远，翱翔天际
const MINIGAME_KITE_MELODY: number[] = [
  392, 440, 523, 587, 523, 440, 392, 0, 440, 523, 587, 659, 587, 523, 440, 0,
  523, 587, 659, 784, 659, 587, 523, 440, 392, 440, 523, 440, 392, 0, 330, 392,
  440, 523, 587, 523, 440, 392, 440, 523, 587, 523, 440, 392, 330, 392, 330, 0,
];
const MINIGAME_KITE_BASS: number[] = [196, 220, 196, 165, 131, 196, 165, 196];

// 冬至包饺子：温暖热闹，家常节奏
const MINIGAME_DUMPLING_MELODY: number[] = [
  262, 294, 330, 294, 262, 294, 330, 392, 330, 294, 262, 294, 330, 392, 440, 0,
  330, 392, 440, 392, 330, 294, 330, 392, 440, 523, 440, 392, 330, 294, 262, 0,
  294, 330, 392, 440, 392, 330, 294, 262, 294, 330, 392, 330, 294, 262, 262, 0,
];
const MINIGAME_DUMPLING_BASS: number[] = [
  131, 165, 196, 131, 165, 131, 196, 165,
];

// 年末烟花会：华彩绚烂，跌宕起伏
const MINIGAME_FIREWORK_MELODY: number[] = [
  262, 330, 392, 523, 0, 523, 659, 784, 659, 523, 392, 0, 330, 392, 523, 659,
  784, 880, 784, 659, 523, 392, 330, 0, 523, 659, 784, 0, 880, 784, 659, 523,
  392, 523, 659, 784, 659, 523, 392, 330, 262, 330, 392, 523, 659, 784, 880, 0,
];
const MINIGAME_FIREWORK_BASS: number[] = [
  131, 196, 220, 196, 131, 165, 196, 220,
];

// ---- 瀚海 BGM（西域丝路，神秘赌场） ----

const HANHAI_MELODY: number[] = [
  // Phase 1: 神秘开场，低音域徘徊
  220, 262, 294, 262, 220, 0, 196, 220, 262, 330, 294, 262, 220, 196, 220, 0,
  // Phase 2: 上行探索，紧张感递增
  294, 330, 392, 330, 294, 262, 294, 330, 392, 440, 392, 330, 294, 0, 262, 294,
  // Phase 3: 高潮段，赌场刺激
  440, 392, 330, 392, 440, 523, 440, 392, 330, 294, 262, 294, 330, 392, 440, 0,
  // Phase 4: 回落循环
  330, 294, 262, 220, 262, 294, 330, 262, 220, 196, 220, 262, 294, 262, 220, 0,
];

const HANHAI_BASS: number[] = [
  131, 165, 196, 165, 131, 196, 220, 196, 131, 165, 196, 220, 165, 131, 196,
  165,
];

// ---- BGM 配置表 ----

interface BgmConfig {
  melody: number[];
  bass: number[];
  noteDur: number;
  melodyWave: WaveType;
  bassWave: WaveType;
  /** 低音每隔几拍播放一次（默认 4） */
  bassInterval?: number;
}

const BGM_CONFIG: Record<BgmType, BgmConfig> = {
  spring: {
    melody: SPRING_MELODY,
    bass: SPRING_BASS,
    noteDur: 0.38,
    melodyWave: "triangle",
    bassWave: "sine",
  },
  summer: {
    melody: SUMMER_MELODY,
    bass: SUMMER_BASS,
    noteDur: 0.34,
    melodyWave: "triangle",
    bassWave: "sine",
  },
  autumn: {
    melody: AUTUMN_MELODY,
    bass: AUTUMN_BASS,
    noteDur: 0.42,
    melodyWave: "triangle",
    bassWave: "sine",
  },
  winter: {
    melody: WINTER_MELODY,
    bass: WINTER_BASS,
    noteDur: 0.5,
    melodyWave: "sine",
    bassWave: "sine",
  },
  festival_spring: {
    melody: FESTIVAL_SPRING_MELODY,
    bass: FESTIVAL_SPRING_BASS,
    noteDur: 0.3,
    melodyWave: "square",
    bassWave: "triangle",
  },
  festival_summer: {
    melody: FESTIVAL_SUMMER_MELODY,
    bass: FESTIVAL_SUMMER_BASS,
    noteDur: 0.4,
    melodyWave: "sine",
    bassWave: "sine",
  },
  festival_autumn: {
    melody: FESTIVAL_AUTUMN_MELODY,
    bass: FESTIVAL_AUTUMN_BASS,
    noteDur: 0.28,
    melodyWave: "square",
    bassWave: "triangle",
  },
  festival_winter: {
    melody: FESTIVAL_WINTER_MELODY,
    bass: FESTIVAL_WINTER_BASS,
    noteDur: 0.35,
    melodyWave: "triangle",
    bassWave: "sine",
  },
  battle: {
    melody: BATTLE_MELODY,
    bass: BATTLE_BASS,
    noteDur: 0.15,
    melodyWave: "sawtooth",
    bassWave: "square",
    bassInterval: 2,
  },
  // 小游戏 BGM
  minigame_fishing: {
    melody: MINIGAME_FISHING_MELODY,
    bass: MINIGAME_FISHING_BASS,
    noteDur: 0.4,
    melodyWave: "triangle",
    bassWave: "sine",
  },
  minigame_dragon_boat: {
    melody: MINIGAME_DRAGON_MELODY,
    bass: MINIGAME_DRAGON_BASS,
    noteDur: 0.18,
    melodyWave: "square",
    bassWave: "square",
    bassInterval: 2,
  },
  minigame_lantern_riddle: {
    melody: MINIGAME_RIDDLE_MELODY,
    bass: MINIGAME_RIDDLE_BASS,
    noteDur: 0.45,
    melodyWave: "sine",
    bassWave: "sine",
  },
  minigame_tea_contest: {
    melody: MINIGAME_TEA_MELODY,
    bass: MINIGAME_TEA_BASS,
    noteDur: 0.42,
    melodyWave: "sine",
    bassWave: "triangle",
  },
  minigame_harvest_fair: {
    melody: MINIGAME_HARVEST_MELODY,
    bass: MINIGAME_HARVEST_BASS,
    noteDur: 0.3,
    melodyWave: "square",
    bassWave: "triangle",
  },
  minigame_pot_throwing: {
    melody: MINIGAME_POT_MELODY,
    bass: MINIGAME_POT_BASS,
    noteDur: 0.3,
    melodyWave: "sawtooth",
    bassWave: "square",
  },
  minigame_kite_flying: {
    melody: MINIGAME_KITE_MELODY,
    bass: MINIGAME_KITE_BASS,
    noteDur: 0.28,
    melodyWave: "triangle",
    bassWave: "sine",
  },
  minigame_dumpling: {
    melody: MINIGAME_DUMPLING_MELODY,
    bass: MINIGAME_DUMPLING_BASS,
    noteDur: 0.24,
    melodyWave: "triangle",
    bassWave: "triangle",
  },
  minigame_firework: {
    melody: MINIGAME_FIREWORK_MELODY,
    bass: MINIGAME_FIREWORK_BASS,
    noteDur: 0.22,
    melodyWave: "square",
    bassWave: "sawtooth",
    bassInterval: 2,
  },
  // 瀚海 BGM
  hanhai: {
    melody: HANHAI_MELODY,
    bass: HANHAI_BASS,
    noteDur: 0.32,
    melodyWave: "sawtooth",
    bassWave: "square",
    bassInterval: 2,
  },
};

// ---- 天气修饰器 ----

type NoiseType = "white" | "pink" | "brown";

interface WeatherModifier {
  tempoScale: number;
  volumeScale: number;
  melodyWaveOverride?: WaveType;
  noiseType?: NoiseType;
  noiseVolume?: number;
  noiseFilterFreq?: number;
  noiseFilterType?: BiquadFilterType;
  detuneAmount?: number;
}

const WEATHER_MODIFIERS: Record<Weather, WeatherModifier> = {
  sunny: {
    tempoScale: 1.0,
    volumeScale: 1.0,
  },
  rainy: {
    tempoScale: 1.15,
    volumeScale: 0.85,
    noiseType: "pink",
    noiseVolume: 0.06,
    noiseFilterFreq: 3000,
    noiseFilterType: "lowpass",
    detuneAmount: 5,
  },
  stormy: {
    tempoScale: 0.9,
    volumeScale: 0.75,
    melodyWaveOverride: "sawtooth",
    noiseType: "brown",
    noiseVolume: 0.1,
    noiseFilterFreq: 1500,
    noiseFilterType: "lowpass",
    detuneAmount: 10,
  },
  snowy: {
    tempoScale: 1.25,
    volumeScale: 0.7,
    melodyWaveOverride: "sine",
    noiseType: "white",
    noiseVolume: 0.02,
    noiseFilterFreq: 2000,
    noiseFilterType: "lowpass",
    detuneAmount: 8,
  },
  windy: {
    tempoScale: 0.95,
    volumeScale: 0.9,
    noiseType: "pink",
    noiseVolume: 0.05,
    noiseFilterFreq: 800,
    noiseFilterType: "bandpass",
    detuneAmount: 3,
  },
  green_rain: {
    tempoScale: 1.1,
    volumeScale: 0.8,
    noiseType: "pink",
    noiseVolume: 0.08,
    noiseFilterFreq: 2500,
    noiseFilterType: "lowpass",
    detuneAmount: 6,
  },
};

// ---- 时段修饰器 ----

interface TimeModifier {
  volumeScale: number;
  tempoScale: number;
  detuneOffset: number;
  bassVolumeScale: number;
}

const TIME_MODIFIERS: Record<TimePeriod, TimeModifier> = {
  morning: {
    volumeScale: 1.0,
    tempoScale: 1.0,
    detuneOffset: 0,
    bassVolumeScale: 0.8,
  },
  afternoon: {
    volumeScale: 0.95,
    tempoScale: 1.05,
    detuneOffset: 0,
    bassVolumeScale: 1.0,
  },
  evening: {
    volumeScale: 0.85,
    tempoScale: 1.1,
    detuneOffset: 3,
    bassVolumeScale: 1.1,
  },
  night: {
    volumeScale: 0.7,
    tempoScale: 1.2,
    detuneOffset: 6,
    bassVolumeScale: 1.3,
  },
  late_night: {
    volumeScale: 0.55,
    tempoScale: 1.3,
    detuneOffset: 10,
    bassVolumeScale: 1.5,
  },
};

// ====== BGM 播放核心 ======

let bgmPlaying = false;
let bgmLoopId = 0;
let melodySynth: any = null;
let bassSynth: any = null;
let ambientNoise: any = null;
let ambientFilter: any = null;

/** 安全释放 Tone 节点（已 disposed 则静默忽略） */
const safeDispose = (node: any) => {
  try {
    node?.dispose();
  } catch {
    /* already disposed */
  }
};

/** 停止环境音层 */
const stopAmbient = () => {
  if (ambientNoise?.state === "started") {
    try {
      ambientNoise.stop();
    } catch {
      /* ignore */
    }
  }
  safeDispose(ambientNoise);
  safeDispose(ambientFilter);
  ambientNoise = null;
  ambientFilter = null;
};

/** 清理 BGM 合成器和环境音 */
const cleanupBgm = () => {
  safeDispose(melodySynth);
  safeDispose(bassSynth);
  melodySynth = null;
  bassSynth = null;
  stopAmbient();
};

/** BGM 播放循环 */
const playBgmLoop = async (
  type: BgmType = "spring",
  weather: Weather = "sunny",
) => {
  if (!bgmEnabled.value || bgmPlaying) return;
  bgmPlaying = true;
  const myLoopId = ++bgmLoopId;

  // 动态加载 Tone.js 并启动 AudioContext（首次需在用户手势中）
  let Tone: ToneModule;
  try {
    Tone = await loadTone();
  } catch {
    bgmPlaying = false;
    return;
  }

  // await 后重新检查状态（等待期间可能已被取消）
  if (!bgmEnabled.value || !bgmPlaying || myLoopId !== bgmLoopId) {
    if (myLoopId === bgmLoopId) bgmPlaying = false;
    return;
  }

  const baseConfig = BGM_CONFIG[type];
  const isBattle = type === "battle";
  const weatherMod = isBattle
    ? WEATHER_MODIFIERS.sunny
    : WEATHER_MODIFIERS[weather];

  // 天气修饰（循环期间固定）
  const weatherNoteDur = baseConfig.noteDur * weatherMod.tempoScale;
  const weatherMelodyWave =
    weatherMod.melodyWaveOverride ?? baseConfig.melodyWave;
  const weatherBassWave = baseConfig.bassWave;
  const weatherVolume = bgmVolume * weatherMod.volumeScale;
  const weatherDetune = weatherMod.detuneAmount ?? 0;

  // 创建旋律合成器
  melodySynth = new Tone.Synth({
    oscillator: { type: weatherMelodyWave },
    envelope: { attack: 0.005, decay: 0.15, sustain: 0.08, release: 0.1 },
    volume: toDb(weatherVolume),
  }).toDestination();

  // 创建低音合成器
  bassSynth = new Tone.Synth({
    oscillator: { type: weatherBassWave },
    envelope: { attack: 0.01, decay: 0.3, sustain: 0.1, release: 0.2 },
    volume: toDb(weatherVolume * 0.5),
  }).toDestination();

  if (weatherDetune) {
    melodySynth.detune.value = weatherDetune;
    bassSynth.detune.value = weatherDetune * 0.5;
  }

  // 启动环境噪声层（Tone.Noise + Filter = 雨声/风声/雪声）
  if (weatherMod.noiseVolume && weatherMod.noiseFilterFreq) {
    try {
      ambientFilter = new Tone.Filter({
        frequency: weatherMod.noiseFilterFreq,
        type: weatherMod.noiseFilterType ?? "lowpass",
      }).toDestination();

      ambientNoise = new Tone.Noise({
        type: weatherMod.noiseType ?? "pink",
        volume: toDb(weatherMod.noiseVolume),
        fadeIn: 0.5,
        fadeOut: 0.3,
      });
      ambientNoise.connect(ambientFilter);
      ambientNoise.start();
    } catch {
      /* noise setup failed */
    }
  }

  let noteIndex = 0;

  const playNext = () => {
    // 检查是否应继续播放
    if (!bgmEnabled.value || !bgmPlaying || myLoopId !== bgmLoopId) {
      if (myLoopId === bgmLoopId) {
        bgmPlaying = false;
        cleanupBgm();
      }
      return;
    }

    // 合成器已被清理则退出
    if (!melodySynth || !bassSynth) return;

    // 时段修饰（逐音符动态读取，战斗跳过）
    const gameStore = useGameStore();
    const timeMod = isBattle
      ? TIME_MODIFIERS.morning
      : TIME_MODIFIERS[getTimePeriod(gameStore.hour)];

    // 合成最终参数
    const noteDur = weatherNoteDur * timeMod.tempoScale;
    const volume = weatherVolume * timeMod.volumeScale;
    const detune = weatherDetune + timeMod.detuneOffset;

    const freq = baseConfig.melody[noteIndex % baseConfig.melody.length]!;

    try {
      // 更新旋律音量和失谐
      melodySynth.volume.value = toDb(volume);
      if (detune !== 0) melodySynth.detune.value = detune;

      // 旋律音符（freq=0 为休止符，不播放）
      if (freq > 0) {
        melodySynth.triggerAttackRelease(freq, noteDur * 0.8);
      }

      // 低音 — 每 bassInterval 拍一个根音（默认 4）
      const bassInterval = baseConfig.bassInterval ?? 4;
      if (noteIndex % bassInterval === 0) {
        const bassIndex =
          Math.floor(noteIndex / bassInterval) % baseConfig.bass.length;
        const bassFreq = baseConfig.bass[bassIndex]!;
        if (bassFreq > 0) {
          bassSynth.volume.value = toDb(volume * timeMod.bassVolumeScale * 0.5);
          if (detune !== 0) bassSynth.detune.value = detune * 0.5;
          bassSynth.triggerAttackRelease(bassFreq, noteDur * 3);
        }
      }
    } catch {
      /* synth may be disposed */
    }

    noteIndex++;
    setTimeout(playNext, noteDur * 1000);
  };

  playNext();
};

/** 停止 BGM */
const stopBgm = () => {
  bgmPlaying = false;
  cleanupBgm();
};

/** 解析当前应播放的 BGM 类型和天气 */
const resolveCurrentBgm = (): { type: BgmType; weather: Weather } => {
  const gameStore = useGameStore();
  if (currentFestivalOverride) {
    return { type: currentFestivalOverride, weather: "sunny" };
  }
  return {
    type: gameStore.season as SeasonBgmType,
    weather: gameStore.weather as Weather,
  };
};

// ====== 页面可见性处理（切标签页时停止/恢复音频） ======

let bgmWasPlayingBeforeHidden = false;

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    bgmWasPlayingBeforeHidden = bgmPlaying;
    if (bgmPlaying) stopBgm();
  } else {
    if (bgmWasPlayingBeforeHidden && bgmEnabled.value) {
      const { type, weather } = resolveCurrentBgm();
      void playBgmLoop(type, weather);
    }
    bgmWasPlayingBeforeHidden = false;
  }
});

// ====== 导出 composable ======

export const useAudio = () => {
  const toggleSfx = () => {
    sfxEnabled.value = !sfxEnabled.value;
  };

  const toggleBgm = () => {
    bgmEnabled.value = !bgmEnabled.value;
    if (bgmEnabled.value) {
      const { type, weather } = resolveCurrentBgm();
      void playBgmLoop(type, weather);
    } else {
      stopBgm();
    }
  };

  /** 启动 BGM（自动匹配当前季节+天气） */
  const startBgm = () => {
    if (bgmEnabled.value && !bgmPlaying) {
      const { type, weather } = resolveCurrentBgm();
      void playBgmLoop(type, weather);
    }
  };

  /** 强制切换到当前季节/天气的 BGM（日结算后使用） */
  const switchToSeasonalBgm = () => {
    if (!bgmEnabled.value) return;
    stopBgm();
    const { type, weather } = resolveCurrentBgm();
    void playBgmLoop(type, weather);
  };

  /** 切换到战斗 BGM */
  const startBattleBgm = () => {
    if (!bgmEnabled.value) return;
    stopBgm();
    void playBgmLoop("battle", "sunny");
  };

  /** 恢复战斗前的 BGM（季节/节日） */
  const resumeNormalBgm = () => {
    if (!bgmEnabled.value) return;
    stopBgm();
    const { type, weather } = resolveCurrentBgm();
    void playBgmLoop(type, weather);
  };

  /** 开始播放节日 BGM */
  const startFestivalBgm = (season: Season) => {
    if (!bgmEnabled.value) return;
    const festivalType = `festival_${season}` as FestivalBgmType;
    currentFestivalOverride = festivalType;
    stopBgm();
    void playBgmLoop(festivalType, "sunny");
  };

  /** 开始播放小游戏专属 BGM */
  const startMinigameBgm = (festivalType: string) => {
    if (!bgmEnabled.value) return;
    const MINIGAME_BGM_MAP: Record<string, MinigameBgmType> = {
      fishing_contest: "minigame_fishing",
      dragon_boat: "minigame_dragon_boat",
      lantern_riddle: "minigame_lantern_riddle",
      tea_contest: "minigame_tea_contest",
      harvest_fair: "minigame_harvest_fair",
      pot_throwing: "minigame_pot_throwing",
      kite_flying: "minigame_kite_flying",
      dumpling_making: "minigame_dumpling",
      firework_show: "minigame_firework",
    };
    const bgmType = MINIGAME_BGM_MAP[festivalType];
    if (!bgmType) return;
    currentFestivalOverride = bgmType;
    stopBgm();
    void playBgmLoop(bgmType, "sunny");
  };

  /** 结束节日 BGM，恢复季节 BGM */
  const endFestivalBgm = () => {
    currentFestivalOverride = null;
    if (bgmEnabled.value) {
      switchToSeasonalBgm();
    }
  };

  /** 开始播放瀚海 BGM */
  const startHanhaiBgm = () => {
    if (!bgmEnabled.value) return;
    currentFestivalOverride = "hanhai";
    stopBgm();
    void playBgmLoop("hanhai", "sunny");
  };

  /** 结束瀚海 BGM，恢复季节 BGM */
  const endHanhaiBgm = () => {
    currentFestivalOverride = null;
    if (bgmEnabled.value) {
      switchToSeasonalBgm();
    }
  };

  return {
    sfxEnabled,
    bgmEnabled,
    toggleSfx,
    toggleBgm,
    startBgm,
    stopBgm,
    startBattleBgm,
    resumeNormalBgm,
    switchToSeasonalBgm,
    startFestivalBgm,
    startMinigameBgm,
    endFestivalBgm,
    startHanhaiBgm,
    endHanhaiBgm,
  };
};
