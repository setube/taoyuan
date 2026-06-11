import { useGameStore } from '@/stores/useGameStore'
import { usePlayerStore } from '@/stores/usePlayerStore'
import { useSkillStore } from '@/stores/useSkillStore'
import { useHomeStore } from '@/stores/useHomeStore'
import { useTavernStore } from '@/stores/useTavernStore'
import { useInventoryStore } from '@/stores/useInventoryStore'
import { useSystemStore } from '@/stores/useSystemStore'
import { useWarehouseStore } from '@/stores/useWarehouseStore'
import { useAnimalStore } from '@/stores/useAnimalStore'
import { useFishPondStore } from '@/stores/useFishPondStore'
import { useBreedingStore } from '@/stores/useBreedingStore'
import { useFarmStore } from '@/stores/useFarmStore'
import { useAchievementStore } from '@/stores/useAchievementStore'
import { useNpcStore } from '@/stores/useNpcStore'
import { getNpcById } from '@/data/npcs'
import { getItemById } from '@/data/items'
import { getAnimalDef } from '@/data/animals'
import { POND_CAPACITY, isPondableFish } from '@/data/fishPond'

function topInventorySummary(
  items: { itemId: string; quantity: number }[],
  limit = 12
): string[] {
  const map = new Map<string, number>()
  for (const item of items) {
    const def = getItemById(item.itemId)
    if (!def || def.sellPrice <= 0) continue
    map.set(item.itemId, (map.get(item.itemId) ?? 0) + item.quantity)
  }
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id, qty]) => `${getItemById(id)?.name ?? id}×${qty}`)
}

/** 构建玩家游戏状态上下文，随 chat 请求发送给后端 */
export function buildGameContext(): Record<string, unknown> {
  try {
    const game = useGameStore()
    const player = usePlayerStore()
    const skill = useSkillStore()
    const home = useHomeStore()
    const tavern = useTavernStore()
    const inv = useInventoryStore()
    const warehouse = useWarehouseStore()
    const animal = useAnimalStore()
    const fishPond = useFishPondStore()
    const breeding = useBreedingStore()
    const farm = useFarmStore()
    const achievement = useAchievementStore()

    const topItems = topInventorySummary(inv.items, 12)

    let pondableFishCount = 0
    const pondableFishNames: string[] = []
    for (const item of inv.items) {
      if (!isPondableFish(item.itemId)) continue
      pondableFishCount += item.quantity
      const name = getItemById(item.itemId)?.name ?? item.itemId
      if (!pondableFishNames.includes(name)) pondableFishNames.push(name)
    }
    const standardBait = inv.items.find(i => i.itemId === 'standard_bait')?.quantity ?? 0

    const warehouseItems: string[] = []
    if (warehouse.unlocked) {
      const allChestItems = warehouse.chests.flatMap(c => c.items)
      warehouseItems.push(...topInventorySummary(allChestItems, 12))
    }

    const system = useSystemStore()
    const npc = useNpcStore()
    const recentTimeline = system.timeline.slice(-5).map(t => `第${t.day}日：${t.summary}`)

    const npcFriendshipTop = npc.npcStates
      .map(st => ({ name: getNpcById(st.npcId)?.name ?? st.npcId, friendship: st.friendship }))
      .filter(n => n.friendship > 0)
      .sort((a, b) => b.friendship - a.friendship)
      .slice(0, 5)
      .map(n => `${n.name}${n.friendship}`)

    const seasonNames: Record<string, string> = { spring: '春', summer: '夏', autumn: '秋', winter: '冬' }
    const seasonLabel = seasonNames[game.season] ?? game.season
    const statusSummary = `${seasonLabel}第${game.day}天 ${game.hour}时 · ${player.money}文 · 体力${player.stamina}/${player.maxStamina} · 生命${player.hp}/${player.getMaxHp()}`

    const activeQuests = system.quests
      .filter(q => !q.completed)
      .slice(0, 5)
      .map(q => {
        let status = '待接受'
        if (q.expired) status = '已过期'
        else if (q.accepted) status = '进行中'
        return {
          title: q.title ?? q.type,
          type: q.type,
          status,
          deadline: q.deadline,
          reward: q.reward,
          progress: q.progress ?? 0
        }
      })

    const animalBuildingSummary = animal.buildings
      .filter(b => b.built)
      .map(b => {
        const count = animal.animals.filter(a => getAnimalDef(a.type)?.building === b.type).length
        const names: Record<string, string> = { coop: '鸡舍', barn: '牲口棚', stable: '马厩' }
        return `${names[b.type] ?? b.type}Lv${b.level}(${count}只)`
      })

    return {
      season: game.season,
      day: game.day,
      year: game.year,
      hour: game.hour,
      statusSummary,
      playerName: player.playerName,
      gender: player.gender,
      money: player.money,
      stamina: player.stamina,
      maxStamina: player.maxStamina,
      hp: player.hp,
      maxHp: player.getMaxHp(),
      affinity: system.affinity,
      systemAffinity: system.affinity,
      personaId: system.personaId,
      npcFriendshipTop,
      systemAwakened: system.awakened,
      systemMerit: system.merit,
      systemQuests: activeQuests,
      meritBuffs: system.activeBuffs.map(b => b.name),
      customShopCount: system.customShopOffers.filter(o => !o.purchased).length,
      skills: {
        farming: skill.farmingLevel,
        mining: skill.miningLevel,
        fishing: skill.fishingLevel,
        foraging: skill.foragingLevel,
        combat: skill.combatLevel,
        cooking: skill.cookingLevel
      },
      farmhouseLevel: home.farmhouseLevel,
      tavernLevel: tavern.tavernLevel,
      topItems,
      warehouseItems,
      warehouseUnlocked: warehouse.unlocked,
      warehouseChests: warehouse.unlocked ? `${warehouse.chests.length}/${warehouse.maxChests}箱` : '未解锁',
      homeState: {
        farmhouse: home.farmhouseName,
        cellarLevel: home.cellarLevel,
        cellarSlots: `${home.cellarSlots.length}/${home.cellarMaxSlots}`,
        greenhouse: home.greenhouseUnlocked ? '已建' : '未建',
        cave: home.caveUnlocked
          ? `${home.caveName}(${home.caveChoice === 'mushroom' ? '蘑菇' : home.caveChoice === 'fruit_bat' ? '果蝠' : '未选'})`
          : '未解锁',
        caveLevel: home.caveLevel
      },
      ranchState: {
        buildings: animalBuildingSummary.length ? animalBuildingSummary : ['无畜舍'],
        totalAnimals: animal.animals.length,
        pet: animal.pet ? `${animal.pet.type === 'cat' ? '猫' : '狗'}·${animal.pet.name}` : null
      },
      fishPondState: fishPond.pond.built
        ? `鱼塘Lv${fishPond.pond.level}·塘中${fishPond.pond.fish.length}/${POND_CAPACITY[fishPond.pond.level]}尾`
        : '未建',
      pondableFishInBag: pondableFishCount,
      pondableFishTypes: pondableFishNames.slice(0, 6),
      fishBaitCount: standardBait,
      fishFryRule:
        '鱼苗不可购买；请至清溪钓鱼，背包中可养殖鱼在鱼塘面板「放入」。钓鱼NPC李渔翁在清溪，不卖鱼苗。不存在沈伯或溪边渔舍。',
      breedingStations: breeding.stationCount,
      farmSize: `${farm.farmSize}×${farm.farmSize}`,
      highestMineFloor: achievement.stats.highestMineFloor,
      memoryMilestones: {
        firstCrop: system.memoryState.firstCrop,
        firstFish: system.memoryState.firstFish,
        firstDeathFloor: system.memoryState.firstDeathFloor,
        firstMaxFriendNpc: system.memoryState.firstMaxFriendNpc
      },
      timeline: recentTimeline
    }
  } catch {
    return {}
  }
}
