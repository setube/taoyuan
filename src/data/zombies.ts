import type { MonsterDef } from "@/types/skill";

/** 末日生存：僵尸定义（复用 MonsterDef） */
export const ZOMBIES: MonsterDef[] = [
  {
    id: "zombie_walker",
    name: "普通丧尸",
    hp: 15,
    attack: 4,
    defense: 0,
    expReward: 5,
    drops: [{ itemId: "scrap_fabric", chance: 0.3 }],
    description: "行动迟缓的丧尸。",
  },
  {
    id: "zombie_runner",
    name: "奔跑者",
    hp: 10,
    attack: 6,
    defense: 0,
    expReward: 8,
    drops: [
      { itemId: "scrap_fabric", chance: 0.4 },
      { itemId: "bandage_simple", chance: 0.1 },
    ],
    description: "速度较快的丧尸。",
  },
  {
    id: "zombie_brute",
    name: "壮尸",
    hp: 25,
    attack: 8,
    defense: 2,
    expReward: 15,
    drops: [
      { itemId: "scrap_metal", chance: 0.3 },
      { itemId: "bandage_simple", chance: 0.15 },
    ],
    description: "体型巨大、力量较强的丧尸。",
  },
];

export function getZombieById(id: string): MonsterDef | undefined {
  return ZOMBIES.find((z) => z.id === id);
}

export function getRandomZombie(): MonsterDef {
  return ZOMBIES[Math.floor(Math.random() * ZOMBIES.length)]!;
}
