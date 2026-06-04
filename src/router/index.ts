import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'menu', component: () => import('@/views/MainMenu.vue') },
    {
      path: '/game',
      component: () => import('@/views/GameLayout.vue'),
      redirect: '/game/farm',
      children: [
        { path: 'farm', name: 'farm', component: () => import('@/views/game/FarmView.vue') },
        { path: 'animal', name: 'animal', component: () => import('@/views/game/AnimalView.vue') },
        { path: 'home', name: 'home', component: () => import('@/views/game/HomeView.vue') },
        { path: 'cottage', name: 'cottage', component: () => import('@/views/game/CottageView.vue') },
        { path: 'village', name: 'village', component: () => import('@/views/game/NpcView.vue') },
        { path: 'shop', name: 'shop', component: () => import('@/views/game/ShopView.vue') },
        { path: 'bank', name: 'bank', component: () => import('@/views/game/BankView.vue') },
        { path: 'forage', name: 'forage', component: () => import('@/views/game/ForageView.vue') },
        { path: 'fishing', name: 'fishing', component: () => import('@/views/game/FishingView.vue') },
        { path: 'mining', name: 'mining', component: () => import('@/views/game/MiningView.vue') },
        { path: 'cooking', name: 'cooking', component: () => import('@/views/game/CookingView.vue') },
        { path: 'workshop', name: 'workshop', component: () => import('@/views/game/ProcessingView.vue') },
        { path: 'upgrade', name: 'upgrade', component: () => import('@/views/game/ToolUpgradeView.vue') },
        { path: 'inventory', name: 'inventory', component: () => import('@/views/game/InventoryView.vue') },
        { path: 'skills', name: 'skills', component: () => import('@/views/game/SkillView.vue') },
        { path: 'achievement', name: 'achievement', component: () => import('@/views/game/AchievementView.vue') },
        { path: 'wallet', name: 'wallet', component: () => import('@/views/game/WalletView.vue') },
        { path: 'quest', name: 'quest', component: () => import('@/views/game/QuestView.vue') },
        { path: 'charinfo', name: 'charinfo', component: () => import('@/views/game/CharInfoView.vue') },
        { path: 'breeding', name: 'breeding', component: () => import('@/views/game/BreedingView.vue') },
        { path: 'museum', name: 'museum', component: () => import('@/views/game/MuseumView.vue') },
        { path: 'guild', name: 'guild', component: () => import('@/views/game/GuildView.vue') },
        { path: 'hanhai', name: 'hanhai', component: () => import('@/views/game/HanhaiView.vue') },
        { path: 'fishpond', name: 'fishpond', component: () => import('@/views/game/FishPondView.vue') }
      ]
    }
  ]
})

export default router
