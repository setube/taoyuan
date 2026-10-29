import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import {
  HANHAI_FIXED_ITEMS,
  getWeeklyRotatingItems,
  MAX_DAILY_BETS,
  HANHAI_UNLOCK_COST,
  spinRoulette,
  rollDice,
  ROULETTE_BET_TIERS,
  DICE_BET_AMOUNT,
  CUP_BET_AMOUNT,
  CUP_WIN_MULTIPLIER,
  playCupRound,
  CRICKET_BET_AMOUNT,
  CRICKET_WIN_MULTIPLIER,
  fightCricket,
  CARD_BET_AMOUNT,
  CARD_WIN_MULTIPLIER,
  dealCards,
  getTexasTier,
  dealTexas,
  BUCKSHOT_BET_AMOUNT,
  BUCKSHOT_WIN_MULTIPLIER,
  BUCKSHOT_PLAYER_HP,
  BUCKSHOT_DEALER_HP,
  loadShotgun,
  TRADE_SHOP_UPGRADES,
  TRADE_EXCHANGE_ITEMS,
  calcTradePoints
} from '@/data/hanhai'
import { getItemById } from '@/data/items'
import { usePlayerStore } from './usePlayerStore'
import { useInventoryStore } from './useInventoryStore'
import { useGameStore } from './useGameStore'
import { useWalletStore } from './useWalletStore'
import { useAnimalStore } from './useAnimalStore'
import { getCombinedItemCount, removeCombinedItem } from '@/composables/useCombinedInventory'
import { addLog } from '@/composables/useGameLog'
import type { TexasSetup, TexasTierId, BuckshotSetup, HanhaiShopItemDef, TradeSlot, Quality } from '@/types'

export const useHanhaiStore = defineStore('hanhai', () => {
  /** 是否已解锁瀚海 */
  const unlocked = ref(false)
  /** 今日赌博次数 */
  const casinoBetsToday = ref(0)
  /** 本周商店购买计数 { itemId: count } */
  const weeklyPurchases = ref<Record<string, number>>({})

  // === 通商系统 ===
  /** 通商积分 */
  const tradePoints = ref(0)
  /** 通商店铺等级 */
  const tradeShopLevel = ref(1)
  /** 售货槽位 */
  const tradeSlots = ref<TradeSlot[]>([])
  /** 本周轮换商品 */
  const weeklyRotatingStock = ref<HanhaiShopItemDef[]>([])
  /** 积分兑换购买记录 { itemId: count }（每周限购） */
  const weeklyExchangePurchases = ref<Record<string, number>>({})
  /** 积分兑换购买记录 { itemId: count }（总限购） */
  const totalExchangePurchases = ref<Record<string, number>>({})

  /** 当前店铺升级配置 */
  const tradeShopConfig = computed(() => TRADE_SHOP_UPGRADES.find(u => u.level === tradeShopLevel.value) ?? TRADE_SHOP_UPGRADES[0]!)
  /** 下一级店铺升级配置 */
  const nextTradeShopUpgrade = computed(() => TRADE_SHOP_UPGRADES.find(u => u.level === tradeShopLevel.value + 1))

  const canBet = computed(() => casinoBetsToday.value < MAX_DAILY_BETS)
  const betsRemaining = computed(() => MAX_DAILY_BETS - casinoBetsToday.value)

  /** 解锁瀚海 */
  const unlockHanhai = (): { success: boolean; message: string } => {
    if (unlocked.value) return { success: false, message: '瀚海已经解锁。' }
    const playerStore = usePlayerStore()
    if (!playerStore.spendMoney(HANHAI_UNLOCK_COST)) {
      return {
        success: false,
        message: `金钱不足（需要${HANHAI_UNLOCK_COST}文）。`
      }
    }
    unlocked.value = true
    addLog('修通了前往瀚海的商路！新的冒险等待着你。')
    return { success: true, message: '瀚海商路已开通！' }
  }

  /** 查询某商品本周剩余可购买数量 */
  const getWeeklyRemaining = (itemId: string): number => {
    const allAvailable = [...HANHAI_FIXED_ITEMS, ...weeklyRotatingStock.value]
    const item = allAvailable.find(i => i.itemId === itemId)
    if (!item?.weeklyLimit) return Infinity
    return Math.max(0, item.weeklyLimit - (weeklyPurchases.value[itemId] ?? 0))
  }

  /** 购买驿站商品（固定+轮换） */
  const buyShopItem = (itemId: string): { success: boolean; message: string } => {
    // 从固定商品和当前轮换商品中查找
    const allAvailable = [...HANHAI_FIXED_ITEMS, ...weeklyRotatingStock.value]
    const item = allAvailable.find(i => i.itemId === itemId)
    if (!item) return { success: false, message: '商品不存在。' }
    if (item.weeklyLimit && (weeklyPurchases.value[itemId] ?? 0) >= item.weeklyLimit) {
      return { success: false, message: `${item.name}本周限购已达上限。` }
    }
    const playerStore = usePlayerStore()
    if (!playerStore.spendMoney(item.price)) {
      return { success: false, message: '金钱不足。' }
    }
    const inventoryStore = useInventoryStore()
    if (!inventoryStore.addItem(item.itemId, 1)) {
      playerStore.earnMoney(item.price)
      return { success: false, message: '背包已满，无法购买。' }
    }
    weeklyPurchases.value[itemId] = (weeklyPurchases.value[itemId] ?? 0) + 1
    return { success: true, message: `购买了${item.name}。` }
  }

  /** 使用藏宝图寻宝 */
  const useTreasureMap = (): {
    success: boolean
    message: string
    rewards: { name: string; quantity: number }[]
  } => {
    const inventoryStore = useInventoryStore()
    if (!inventoryStore.removeItem('hanhai_map')) {
      return { success: false, message: '没有藏宝图。', rewards: [] }
    }
    const playerStore = usePlayerStore()
    // 随机奖励池
    const roll = Math.random()
    const rewards: { itemId: string; name: string; quantity: number }[] = []
    if (roll < 0.05) {
      // 5% 大奖：金钱+稀有物品
      playerStore.earnMoney(5000)
      rewards.push({ itemId: '', name: '5000文', quantity: 1 })
      rewards.push({ itemId: 'hanhai_turquoise', name: '绿松石', quantity: 2 })
      inventoryStore.addItem('hanhai_turquoise', 2)
    } else if (roll < 0.2) {
      // 15% 中奖：金钱+材料
      playerStore.earnMoney(2000)
      rewards.push({ itemId: '', name: '2000文', quantity: 1 })
      rewards.push({ itemId: 'hanhai_spice', name: '西域香料', quantity: 3 })
      inventoryStore.addItem('hanhai_spice', 3)
    } else if (roll < 0.45) {
      // 25% 小奖：金钱
      playerStore.earnMoney(1000)
      rewards.push({ itemId: '', name: '1000文', quantity: 1 })
      rewards.push({ itemId: 'hanhai_silk', name: '丝绸', quantity: 1 })
      inventoryStore.addItem('hanhai_silk', 1)
    } else {
      // 55% 安慰奖
      playerStore.earnMoney(500)
      rewards.push({ itemId: '', name: '500文', quantity: 1 })
    }
    const rewardText = rewards.map(r => r.name + (r.quantity > 1 ? `×${r.quantity}` : '')).join('、')
    addLog(`使用藏宝图寻宝，发现了：${rewardText}！`)
    return { success: true, message: `寻宝成功！获得：${rewardText}`, rewards }
  }

  /** 玩幸运轮盘 */
  const playRoulette = (
    betTier: number
  ): {
    success: boolean
    message: string
    multiplier: number
    winnings: number
  } => {
    if (!canBet.value)
      return {
        success: false,
        message: '今天的赌博次数已用完。',
        multiplier: 0,
        winnings: 0
      }
    if (!ROULETTE_BET_TIERS.includes(betTier as (typeof ROULETTE_BET_TIERS)[number])) {
      return {
        success: false,
        message: '无效的投注金额。',
        multiplier: 0,
        winnings: 0
      }
    }
    const playerStore = usePlayerStore()
    if (!playerStore.spendMoney(betTier)) {
      return {
        success: false,
        message: '金钱不足。',
        multiplier: 0,
        winnings: 0
      }
    }
    casinoBetsToday.value++
    const outcome = spinRoulette()
    const winnings = Math.floor(betTier * outcome.multiplier)
    if (winnings > 0) {
      playerStore.earnMoney(winnings)
    }
    if (outcome.multiplier === 0) {
      addLog(`轮盘停在了"${outcome.label}"，损失了${betTier}文。`)
    } else {
      addLog(`轮盘停在了"${outcome.label}"！赢得${winnings}文！`)
    }
    return {
      success: true,
      message: `轮盘停在了"${outcome.label}"`,
      multiplier: outcome.multiplier,
      winnings
    }
  }

  /** 玩骰子（猜大小） */
  const playDice = (
    guessBig: boolean
  ): {
    success: boolean
    message: string
    dice1: number
    dice2: number
    won: boolean
    winnings: number
  } => {
    if (!canBet.value)
      return {
        success: false,
        message: '今天的赌博次数已用完。',
        dice1: 0,
        dice2: 0,
        won: false,
        winnings: 0
      }
    const playerStore = usePlayerStore()
    if (!playerStore.spendMoney(DICE_BET_AMOUNT)) {
      return {
        success: false,
        message: '金钱不足。',
        dice1: 0,
        dice2: 0,
        won: false,
        winnings: 0
      }
    }
    casinoBetsToday.value++
    const result = rollDice()
    const won = guessBig === result.isBig
    const winnings = won ? DICE_BET_AMOUNT * 2 : 0
    if (won) {
      playerStore.earnMoney(winnings)
    }
    const guessText = guessBig ? '大' : '小'
    const resultText = result.isBig ? '大' : '小'
    if (won) {
      addLog(`骰子${result.dice1}+${result.dice2}=${result.total}（${resultText}），你猜${guessText}——赢了${winnings}文！`)
    } else {
      addLog(`骰子${result.dice1}+${result.dice2}=${result.total}（${resultText}），你猜${guessText}——输了${DICE_BET_AMOUNT}文。`)
    }
    return {
      success: true,
      message: won ? '赢了！' : '输了…',
      dice1: result.dice1,
      dice2: result.dice2,
      won,
      winnings
    }
  }

  /** 玩猜杯 */
  const playCup = (
    guess: number
  ): {
    success: boolean
    message: string
    correctCup: number
    won: boolean
    winnings: number
  } => {
    if (!canBet.value)
      return {
        success: false,
        message: '今天的赌博次数已用完。',
        correctCup: 0,
        won: false,
        winnings: 0
      }
    const playerStore = usePlayerStore()
    if (!playerStore.spendMoney(CUP_BET_AMOUNT)) {
      return {
        success: false,
        message: '金钱不足。',
        correctCup: 0,
        won: false,
        winnings: 0
      }
    }
    casinoBetsToday.value++
    const result = playCupRound()
    const won = guess === result.correctCup
    const winnings = won ? Math.floor(CUP_BET_AMOUNT * CUP_WIN_MULTIPLIER) : 0
    if (won) {
      playerStore.earnMoney(winnings)
      addLog(`猜杯猜中了第${guess + 1}号杯！赢得${winnings}文！`)
    } else {
      addLog(`猜杯猜错了，球在第${result.correctCup + 1}号杯下，损失了${CUP_BET_AMOUNT}文。`)
    }
    return {
      success: true,
      message: won ? '猜中了！' : '猜错了…',
      correctCup: result.correctCup,
      won,
      winnings
    }
  }

  /** 玩斗蛐蛐 */
  const playCricketFight = (
    cricketId: string
  ): {
    success: boolean
    message: string
    playerPower: number
    opponentPower: number
    won: boolean
    draw: boolean
    winnings: number
  } => {
    if (!canBet.value)
      return {
        success: false,
        message: '今天的赌博次数已用完。',
        playerPower: 0,
        opponentPower: 0,
        won: false,
        draw: false,
        winnings: 0
      }
    const playerStore = usePlayerStore()
    if (!playerStore.spendMoney(CRICKET_BET_AMOUNT)) {
      return {
        success: false,
        message: '金钱不足。',
        playerPower: 0,
        opponentPower: 0,
        won: false,
        draw: false,
        winnings: 0
      }
    }
    casinoBetsToday.value++
    const result = fightCricket()
    const won = result.playerPower > result.opponentPower
    const draw = result.playerPower === result.opponentPower
    const winnings = won ? Math.floor(CRICKET_BET_AMOUNT * CRICKET_WIN_MULTIPLIER) : draw ? CRICKET_BET_AMOUNT : 0
    if (won || draw) {
      playerStore.earnMoney(winnings)
    }
    if (won) {
      addLog(`斗蛐蛐（${cricketId}）：力量${result.playerPower}对${result.opponentPower}，大获全胜！赢得${winnings}文！`)
    } else if (draw) {
      addLog(`斗蛐蛐（${cricketId}）：力量${result.playerPower}对${result.opponentPower}，平局，退还${CRICKET_BET_AMOUNT}文。`)
    } else {
      addLog(`斗蛐蛐（${cricketId}）：力量${result.playerPower}对${result.opponentPower}，败下阵来，损失${CRICKET_BET_AMOUNT}文。`)
    }
    return {
      success: true,
      message: won ? '赢了！' : draw ? '平局' : '输了…',
      playerPower: result.playerPower,
      opponentPower: result.opponentPower,
      won,
      draw,
      winnings
    }
  }

  /** 玩翻牌寻宝 */
  const playCardFlip = (
    pick: number
  ): {
    success: boolean
    message: string
    treasures: number[]
    won: boolean
    winnings: number
  } => {
    if (!canBet.value)
      return {
        success: false,
        message: '今天的赌博次数已用完。',
        treasures: [],
        won: false,
        winnings: 0
      }
    const playerStore = usePlayerStore()
    if (!playerStore.spendMoney(CARD_BET_AMOUNT)) {
      return {
        success: false,
        message: '金钱不足。',
        treasures: [],
        won: false,
        winnings: 0
      }
    }
    casinoBetsToday.value++
    const result = dealCards()
    const won = result.treasures.includes(pick)
    const winnings = won ? Math.floor(CARD_BET_AMOUNT * CARD_WIN_MULTIPLIER) : 0
    if (won) {
      playerStore.earnMoney(winnings)
      addLog(`翻牌寻宝翻到了宝牌！赢得${winnings}文！`)
    } else {
      addLog(`翻牌寻宝翻到了空牌，损失了${CARD_BET_AMOUNT}文。`)
    }
    return {
      success: true,
      message: won ? '翻到宝了！' : '空牌…',
      treasures: result.treasures,
      won,
      winnings
    }
  }

  /** 开始瀚海扑克（扣入场费+抽水，发牌） */
  const startTexas = (tierId: TexasTierId): { success: boolean; message: string } & Partial<TexasSetup> => {
    if (!canBet.value) return { success: false, message: '今天的赌博次数已用完。' }
    const tier = getTexasTier(tierId)
    const playerStore = usePlayerStore()
    if (playerStore.money < tier.minMoney) {
      return {
        success: false,
        message: `需要至少持有${tier.minMoney}文才能入场。`
      }
    }
    const totalCost = tier.entryFee + tier.rake
    if (!playerStore.spendMoney(totalCost)) {
      return { success: false, message: '金钱不足。' }
    }
    casinoBetsToday.value++
    const deal = dealTexas()
    return {
      success: true,
      message: `${tier.name}开始！`,
      playerHole: deal.playerHole,
      dealerHole: deal.dealerHole,
      community: deal.community,
      tier
    }
  }

  /** 结束瀚海扑克（结算：返还剩余筹码） */
  const endTexas = (finalChips: number, tierName: string) => {
    const playerStore = usePlayerStore()
    if (finalChips > 0) {
      playerStore.earnMoney(finalChips)
    }
    addLog(`瀚海扑克（${tierName}）结束，收回筹码${finalChips}文。`)
  }

  /** 开始恶魔轮盘（下注+生成初始状态） */
  const startBuckshot = (): {
    success: boolean
    message: string
  } & Partial<BuckshotSetup> => {
    if (!canBet.value) return { success: false, message: '今天的赌博次数已用完。' }
    const playerStore = usePlayerStore()
    if (!playerStore.spendMoney(BUCKSHOT_BET_AMOUNT)) {
      return { success: false, message: '金钱不足。' }
    }
    casinoBetsToday.value++
    return {
      success: true,
      message: '恶魔轮盘开始！',
      shells: loadShotgun(),
      playerHP: BUCKSHOT_PLAYER_HP,
      dealerHP: BUCKSHOT_DEALER_HP
    }
  }

  /** 恶魔轮盘结算 */
  const endBuckshot = (won: boolean, draw: boolean) => {
    const playerStore = usePlayerStore()
    if (won) {
      playerStore.earnMoney(BUCKSHOT_BET_AMOUNT * BUCKSHOT_WIN_MULTIPLIER)
      addLog(`恶魔轮盘胜利！赢得${BUCKSHOT_BET_AMOUNT * BUCKSHOT_WIN_MULTIPLIER}文！`)
    } else if (draw) {
      playerStore.earnMoney(BUCKSHOT_BET_AMOUNT)
      addLog(`恶魔轮盘平局，退还${BUCKSHOT_BET_AMOUNT}文。`)
    } else {
      addLog(`恶魔轮盘落败，损失了${BUCKSHOT_BET_AMOUNT}文。`)
    }
  }

  // === 通商系统方法 ===

  /** 刷新本周轮换商品 */
  const refreshRotatingStock = () => {
    const gameStore = useGameStore()
    weeklyRotatingStock.value = getWeeklyRotatingItems(gameStore.year, gameStore.seasonIndex, gameStore.day)
  }

  /** 放入物品到通商售货槽 */
  const addTradeSlot = (itemId: string, quality: string, quantity: number): { success: boolean; message: string } => {
    if (quantity <= 0) return { success: false, message: '数量必须为正整数。' }
    const config = tradeShopConfig.value
    if (tradeSlots.value.length >= config.maxSlots) {
      return { success: false, message: '售货槽位已满。' }
    }
    const itemDef = getItemById(itemId)
    if (!itemDef) return { success: false, message: '物品不存在。' }
    const inventoryStore = useInventoryStore()
    if (!inventoryStore.removeItem(itemId, quantity, quality as Quality)) {
      return { success: false, message: '物品不足。' }
    }
    // 计算积分奖励
    const basePoints = calcTradePoints(itemDef.sellPrice * quantity, quality)
    // 通商金印加成
    const walletStore = useWalletStore()
    const bonus = walletStore.getTradeBonus()
    const pointsReward = Math.ceil(basePoints * (1 + bonus))

    tradeSlots.value.push({
      itemId,
      quality,
      quantity,
      daysRemaining: config.sellDays,
      pointsReward
    })
    addLog(`在通商摊位上架了${itemDef.name}×${quantity}，预计${config.sellDays}天后获得${pointsReward}积分。`)
    return { success: true, message: `已上架${itemDef.name}×${quantity}。` }
  }

  /** 每日通商结算：减少剩余天数，到期的发放积分 */
  const dailyTradeUpdate = (): {
    completed: { itemId: string; points: number }[]
  } => {
    const completed: { itemId: string; points: number }[] = []
    const remaining: TradeSlot[] = []
    for (const slot of tradeSlots.value) {
      slot.daysRemaining--
      if (slot.daysRemaining <= 0) {
        tradePoints.value += slot.pointsReward
        completed.push({ itemId: slot.itemId, points: slot.pointsReward })
        const itemDef = getItemById(slot.itemId)
        addLog(`通商售出${itemDef?.name ?? slot.itemId}×${slot.quantity}，获得${slot.pointsReward}通商积分。`)
      } else {
        remaining.push(slot)
      }
    }
    tradeSlots.value = remaining
    return { completed }
  }

  /** 升级通商店铺 */
  const upgradeTradeShop = (): { success: boolean; message: string } => {
    const next = nextTradeShopUpgrade.value
    if (!next) return { success: false, message: '店铺已满级。' }
    const playerStore = usePlayerStore()
    if (playerStore.money < next.cost) {
      return { success: false, message: `金钱不足（需要${next.cost}文）。` }
    }
    // 检查材料
    for (const mat of next.materialCost) {
      const count = getCombinedItemCount(mat.itemId)
      if (count < mat.quantity) {
        const itemDef = getItemById(mat.itemId)
        return {
          success: false,
          message: `材料不足：${itemDef?.name ?? mat.itemId} 需要${mat.quantity}个。`
        }
      }
    }
    // 扣除
    playerStore.spendMoney(next.cost)
    for (const mat of next.materialCost) {
      removeCombinedItem(mat.itemId, mat.quantity)
    }
    tradeShopLevel.value = next.level
    addLog(`通商店铺升级为「${next.name}」！槽位${next.maxSlots}个，售卖周期${next.sellDays}天。`)
    return { success: true, message: `店铺升级为「${next.name}」！` }
  }

  /** 积分兑换物品 */
  const exchangeItem = (itemId: string): { success: boolean; message: string } => {
    const exchangeDef = TRADE_EXCHANGE_ITEMS.find(e => e.itemId === itemId)
    if (!exchangeDef) return { success: false, message: '兑换物品不存在。' }
    // 检查周限购
    if (exchangeDef.weeklyLimit) {
      const weeklyCount = weeklyExchangePurchases.value[itemId] ?? 0
      if (weeklyCount >= exchangeDef.weeklyLimit) {
        return {
          success: false,
          message: `${exchangeDef.name}本周兑换已达上限。`
        }
      }
    }
    // 检查总限购
    if (exchangeDef.totalLimit) {
      const totalCount = totalExchangePurchases.value[itemId] ?? 0
      if (totalCount >= exchangeDef.totalLimit) {
        return { success: false, message: `${exchangeDef.name}已达兑换上限。` }
      }
    }
    // 检查积分
    if (tradePoints.value < exchangeDef.pointsCost) {
      return {
        success: false,
        message: `积分不足（需要${exchangeDef.pointsCost}积分）。`
      }
    }
    // 扣除积分
    tradePoints.value -= exchangeDef.pointsCost
    // 更新购买记录
    if (exchangeDef.weeklyLimit) {
      weeklyExchangePurchases.value[itemId] = (weeklyExchangePurchases.value[itemId] ?? 0) + 1
    }
    if (exchangeDef.totalLimit) {
      totalExchangePurchases.value[itemId] = (totalExchangePurchases.value[itemId] ?? 0) + 1
    }
    // 钱袋物品直接解锁
    if (exchangeDef.isWalletItem) {
      const walletStore = useWalletStore()
      walletStore.unlock(itemId)
      addLog(`兑换了${exchangeDef.name}，已加入钱袋！`)
      return {
        success: true,
        message: `兑换了${exchangeDef.name}，已加入钱袋！`
      }
    }
    // 香料礼包特殊处理：直接给5个西域香料
    if (itemId === 'trade_spice_bundle') {
      const inventoryStore = useInventoryStore()
      if (!inventoryStore.addItem('hanhai_spice', 5)) {
        tradePoints.value += exchangeDef.pointsCost
        if (exchangeDef.weeklyLimit) {
          weeklyExchangePurchases.value[itemId] = (weeklyExchangePurchases.value[itemId] ?? 0) - 1
        }
        return { success: false, message: '背包已满，无法兑换。' }
      }
      addLog(`用${exchangeDef.pointsCost}积分兑换了${exchangeDef.name}，获得西域香料×5。`)
      return { success: true, message: '获得西域香料×5！' }
    }
    // 马匹品种：记入已获得品种（卖马、换品种不丢），比现有的马好就直接换上
    if (exchangeDef.isHorseUpgrade) {
      const animalStore = useAnimalStore()
      const result = animalStore.unlockHorseBreed(exchangeDef.isHorseUpgrade)
      if (!result.success) {
        // 条件不满足则退还积分与次数
        tradePoints.value += exchangeDef.pointsCost
        if (exchangeDef.weeklyLimit) {
          weeklyExchangePurchases.value[itemId] = (weeklyExchangePurchases.value[itemId] ?? 0) - 1
        }
        if (exchangeDef.totalLimit) {
          totalExchangePurchases.value[itemId] = (totalExchangePurchases.value[itemId] ?? 0) - 1
        }
        return { success: false, message: result.message }
      }
      addLog(result.message)
      return { success: true, message: result.message }
    }

    // 装备类兑换品：直接进装备栏。
    // 这些物品在 weapons/rings/hats/shoes 里都有完整定义，塞进背包格子既占位又无法装备。
    if (exchangeDef.equipType) {
      const inventoryStore = useInventoryStore()
      const added = (() => {
        switch (exchangeDef.equipType) {
          case 'weapon':
            return inventoryStore.addWeapon(itemId)
          case 'ring':
            return inventoryStore.addRing(itemId)
          case 'hat':
            return inventoryStore.addHat(itemId)
          case 'shoe':
            return inventoryStore.addShoe(itemId)
          default:
            return false
        }
      })()

      if (!added) {
        // 兑换失败则退还积分与次数
        tradePoints.value += exchangeDef.pointsCost
        if (exchangeDef.weeklyLimit) {
          weeklyExchangePurchases.value[itemId] = (weeklyExchangePurchases.value[itemId] ?? 0) - 1
        }
        if (exchangeDef.totalLimit) {
          totalExchangePurchases.value[itemId] = (totalExchangePurchases.value[itemId] ?? 0) - 1
        }
        return { success: false, message: '兑换失败，请稍后再试。' }
      }

      addLog(`用${exchangeDef.pointsCost}积分兑换了${exchangeDef.name}，已放入装备栏。`)
      return {
        success: true,
        message: `兑换了${exchangeDef.name}，可在背包的「装备」页签中装备。`
      }
    }

    // 普通物品加入背包
    const inventoryStore = useInventoryStore()
    if (!inventoryStore.addItem(itemId, 1)) {
      // 退还积分
      tradePoints.value += exchangeDef.pointsCost
      if (exchangeDef.weeklyLimit) {
        weeklyExchangePurchases.value[itemId] = (weeklyExchangePurchases.value[itemId] ?? 0) - 1
      }
      if (exchangeDef.totalLimit) {
        totalExchangePurchases.value[itemId] = (totalExchangePurchases.value[itemId] ?? 0) - 1
      }
      return { success: false, message: '背包已满，无法兑换。' }
    }
    addLog(`用${exchangeDef.pointsCost}积分兑换了${exchangeDef.name}。`)
    return { success: true, message: `兑换了${exchangeDef.name}！` }
  }

  /** 每日重置赌博次数，每周重置商店限购 */
  const resetDailyBets = () => {
    casinoBetsToday.value = 0
    // 每周重置商店限购 (day 7, 14, 21, 28)
    const gameStore = useGameStore()
    if (gameStore.day % 7 === 0) {
      weeklyPurchases.value = {}
      weeklyExchangePurchases.value = {}
    }
  }

  const serialize = () => ({
    unlocked: unlocked.value,
    casinoBetsToday: casinoBetsToday.value,
    weeklyPurchases: weeklyPurchases.value,
    tradePoints: tradePoints.value,
    tradeShopLevel: tradeShopLevel.value,
    tradeSlots: tradeSlots.value,
    weeklyExchangePurchases: weeklyExchangePurchases.value,
    totalExchangePurchases: totalExchangePurchases.value
  })

  const deserialize = (data: any) => {
    unlocked.value = data.unlocked ?? false
    casinoBetsToday.value = data.casinoBetsToday ?? 0
    weeklyPurchases.value = data.weeklyPurchases ?? {}
    tradePoints.value = data.tradePoints ?? 0
    tradeShopLevel.value = data.tradeShopLevel ?? 1
    tradeSlots.value = data.tradeSlots ?? []
    weeklyExchangePurchases.value = data.weeklyExchangePurchases ?? {}
    totalExchangePurchases.value = data.totalExchangePurchases ?? {}
    // 反序列化后刷新轮换商品
    if (unlocked.value) {
      refreshRotatingStock()
    }
  }

  return {
    unlocked,
    casinoBetsToday,
    weeklyPurchases,
    canBet,
    betsRemaining,
    // 通商系统
    tradePoints,
    tradeShopLevel,
    tradeSlots,
    weeklyRotatingStock,
    weeklyExchangePurchases,
    totalExchangePurchases,
    tradeShopConfig,
    nextTradeShopUpgrade,
    // 方法
    unlockHanhai,
    getWeeklyRemaining,
    buyShopItem,
    useTreasureMap,
    playRoulette,
    playDice,
    playCup,
    playCricketFight,
    playCardFlip,
    startTexas,
    endTexas,
    startBuckshot,
    endBuckshot,
    refreshRotatingStock,
    addTradeSlot,
    dailyTradeUpdate,
    upgradeTradeShop,
    exchangeItem,
    resetDailyBets,
    serialize,
    deserialize
  }
})
