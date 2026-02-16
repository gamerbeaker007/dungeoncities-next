import monsterData from "@/data/monster-details.json";
import type { MonsterRecord } from "@/types/monter";

const monsters = (monsterData.monsters ?? []) as MonsterRecord[];
const totalMonstersInGame = monsterData.totalMonsters ?? 0;

export function getMonsters() {
  return monsters;
}

export function getTotalMonstersInGame() {
  return totalMonstersInGame;
}
