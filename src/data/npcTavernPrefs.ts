export interface NpcTavernPref {
  npcId: string
  favoriteDrink?: string
  favoriteDish?: string
  favoriteFruit?: string
  feastUnlockHearts?: number
}

export const NPC_TAVERN_PREFS: NpcTavernPref[] = [
  { npcId: 'chen_bo', favoriteDish: 'radish_soup', favoriteDrink: 'corn_wine', feastUnlockHearts: 4 },
  { npcId: 'liu_niang', favoriteDish: 'stir_fried_cabbage', favoriteFruit: 'peach', feastUnlockHearts: 4 },
  { npcId: 'qiu_yue', favoriteDish: 'braised_carp', favoriteDrink: 'osmanthus_wine', feastUnlockHearts: 4 },
  { npcId: 'lin_lao', favoriteDish: 'herbal_porridge', feastUnlockHearts: 4 },
  { npcId: 'he_zhanggui', favoriteDrink: 'peach_wine', favoriteDish: 'osmanthus_cake', feastUnlockHearts: 4 },
  { npcId: 'li_yu', favoriteDish: 'braised_carp', favoriteDrink: 'watermelon_wine', feastUnlockHearts: 4 },
  { npcId: 'zhang_popo', favoriteFruit: 'jujube', favoriteDish: 'stir_fried_cabbage', feastUnlockHearts: 4 },
  { npcId: 'zhou_xiucai', favoriteDrink: 'osmanthus_wine', favoriteFruit: 'lychee', feastUnlockHearts: 8 }
]

export function getNpcTavernPref(npcId: string): NpcTavernPref | undefined {
  return NPC_TAVERN_PREFS.find(p => p.npcId === npcId)
}
