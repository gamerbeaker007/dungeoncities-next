export type StaminaCostRow = {
  action: string;
  cost: number;
};

export type CounterAttackRow = {
  rank: string;
  min: number;
  max: number;
};

export type TravelCostRow = {
  fromCity: number;
  toCity: number;
  cost: number;
};

export const STAMINA_COSTS: StaminaCostRow[] = [
  { action: "START_BATTLE", cost: 2 },
  { action: "USE_SKILL", cost: 0 },
  { action: "PERFORM_TURN", cost: 0 },
  { action: "PERFORM_BATTLE_SEGMENT", cost: 0 },
  { action: "RUN", cost: 5 },
  { action: "MOVE_LEFT", cost: 1 },
  { action: "MOVE_RIGHT", cost: 1 },
  { action: "MOVE_STRAIGHT", cost: 1 },
  { action: "ENTER_DUNGEON", cost: 1 },
  { action: "EXIT_DUNGEON", cost: 2 },
  { action: "ENTER_SHOP", cost: 0 },
  { action: "EXIT_SHOP", cost: 0 },
  { action: "ENTER_FORGE", cost: 0 },
  { action: "EXIT_FORGE", cost: 0 },
  { action: "ENTER_GUILD_HALL", cost: 0 },
  { action: "EXIT_GUILD_HALL", cost: 0 },
  { action: "ENTER_NEXT_FLOOR", cost: 1 },
  { action: "COLLECT_ITEM", cost: 0 },
  { action: "OPEN_CHEST", cost: 0 },
  { action: "ENTER_ARENA", cost: 0 },
  { action: "EXIT_ARENA", cost: 0 },
];

export const COUNTER_ATTACK_RATES: CounterAttackRow[] = [
  { rank: "F", min: 5, max: 10 },
  { rank: "E", min: 7, max: 14 },
  { rank: "D", min: 10, max: 20 },
  { rank: "C", min: 14, max: 28 },
  { rank: "B", min: 19, max: 38 },
  { rank: "A", min: 25, max: 50 },
  { rank: "S", min: 30, max: 60 },
  { rank: "SS", min: 35, max: 70 },
  { rank: "SSS", min: 40, max: 80 },
  { rank: "R", min: 50, max: 100 },
];

export const CITY_NAMES: Record<number, string> = {
  1: "Aldoria",
  2: "Brighthollow",
  3: "Caelum",
  4: "Druantia",
  5: "Eria",
};

export const TRAVEL_COSTS: TravelCostRow[] = [
  { fromCity: 1, toCity: 2, cost: 2000 },
  { fromCity: 1, toCity: 3, cost: 2000 },
  { fromCity: 1, toCity: 4, cost: 2000 },
  { fromCity: 1, toCity: 5, cost: 2000 },
  { fromCity: 2, toCity: 3, cost: 2000 },
  { fromCity: 2, toCity: 4, cost: 2000 },
  { fromCity: 2, toCity: 5, cost: 2000 },
  { fromCity: 3, toCity: 4, cost: 2000 },
  { fromCity: 3, toCity: 5, cost: 2000 },
  { fromCity: 4, toCity: 5, cost: 2000 },
];
