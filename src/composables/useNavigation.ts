import type { Component } from 'vue'
import router from '@/router'
import { useGameStore } from '@/stores/useGameStore'
import { isShopOpen, TAB_TO_LOCATION_GROUP } from '@/data/timeConstants'
import { addLog, showFloat } from './useGameLog'
import { handleEndDay } from './useEndDay'
import { sfxClick, useAudio } from './useAudio'
import { useGameClock } from './useGameClock'
import { useTutorialStore } from '@/stores/useTutorialStore'
import {
  Wheat,
  Egg,
  Home,
  Heart,
  Building,
  Users,
  Store,
  TreePine,
  Fish,
  Pickaxe,
  Flame,
  Cog,
  Wrench,
  Package,
  Star,
  BookOpen,
  Wallet,
  ScrollText,
  User,
  FlaskConical,
  Landmark,
  Swords,
  Tent,
  Waves
} from 'lucide-vue-next'
import { useNpcStore } from '@/stores/useNpcStore'

export type PanelKey =
  | 'farm'
  | 'shop'
  | 'inventory'
  | 'fishing'
  | 'mining'
  | 'village'
  | 'cooking'
  | 'forage'
  | 'upgrade'
  | 'skills'
  | 'workshop'
  | 'achievement'
  | 'animal'
  | 'home'
  | 'wallet'
  | 'quest'
  | 'charinfo'
  | 'breeding'
  | 'museum'
  | 'guild'
  | 'hanhai'
  | 'fishpond'
  | 'cottage'
  | 'bank'

export const TABS: { key: PanelKey; label: string; icon: Component; getIcon?: () => Component }[] = [
  { key: 'farm', label: '农场', icon: Wheat },
  { key: 'animal', label: '牧场', icon: Egg },
  { key: 'cottage', label: '小屋', icon: Home, getIcon: () => (useNpcStore().getSpouse() ? Heart : Home) },
  { key: 'home', label: '设施', icon: Building },
  { key: 'breeding', label: '育种', icon: FlaskConical },
  { key: 'fishpond', label: '鱼塘', icon: Waves },
  { key: 'village', label: '桃源村', icon: Users },
  { key: 'shop', label: '商圈', icon: Store },
  { key: 'bank', label: '钱庄', icon: Landmark },
  { key: 'forage', label: '竹林', icon: TreePine },
  { key: 'fishing', label: '清溪', icon: Fish },
  { key: 'mining', label: '矿洞', icon: Pickaxe },
  { key: 'cooking', label: '灶台', icon: Flame },
  { key: 'workshop', label: '加工坊', icon: Cog },
  { key: 'upgrade', label: '工坊', icon: Wrench },
  { key: 'charinfo', label: '角色', icon: User },
  { key: 'inventory', label: '背包', icon: Package },
  { key: 'skills', label: '技能', icon: Star },
  { key: 'achievement', label: '图鉴', icon: BookOpen },
  { key: 'wallet', label: '钱袋', icon: Wallet },
  { key: 'quest', label: '告示栏', icon: ScrollText },
  { key: 'museum', label: '博物馆', icon: Landmark },
  { key: 'guild', label: '公会', icon: Swords },
  { key: 'hanhai', label: '瀚海', icon: Tent }
]

/** 导航到游戏面板，检查旅行时间、就寝时间和商店营业时间 */
export const navigateToPanel = (panelKey: PanelKey) => {
  const gameStore = useGameStore()
  const { startBgm } = useAudio()

  if (gameStore.isPastBedtime) {
    addLog('已经凌晨2点了，你必须休息。')
    handleEndDay()
    // 确保新一天时钟恢复运转
    const { resumeClock: resumeAfterEnd } = useGameClock()
    resumeAfterEnd()
    return
  }

  // 商店营业检查
  const shopCheck = isShopOpen(panelKey, gameStore.day, gameStore.hour)
  if (!shopCheck.open) {
    showFloat(shopCheck.reason!, 'danger')
    return
  }

  // 旅行时间
  const travelResult = gameStore.travelTo(panelKey)
  if (travelResult.timeCost > 0) {
    addLog(travelResult.message)
  }
  if (travelResult.passedOut) {
    handleEndDay()
    return
  }

  sfxClick()
  startBgm()
  void router.push({ name: panelKey })
  useTutorialStore().markPanelVisited(panelKey)

  // UI 面板（无地点）暂停时钟，游戏面板恢复
  const { pauseClock, resumeClock } = useGameClock()
  const targetGroup = TAB_TO_LOCATION_GROUP[panelKey]
  if (targetGroup === null || targetGroup === undefined) {
    pauseClock()
  } else {
    resumeClock()
  }
}

export const useNavigation = () => {
  return {
    TABS,
    navigateToPanel
  }
}
