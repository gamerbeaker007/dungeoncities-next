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

export type CityFloorsRow = {
  cityId: number;
  floors: number;
};

export type AltarLocationRow = {
  cityId: number;
  floor: number;
  description: string;
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
  5: "Elaria",
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

export const CITY_FLOORS: CityFloorsRow[] = [
  { cityId: 1, floors: 20 },
  { cityId: 2, floors: 21 },
  { cityId: 3, floors: 5 },
  { cityId: 4, floors: 20 },
  { cityId: 5, floors: 20 },
];

export const KNOWN_ALTAR_LOCATIONS: AltarLocationRow[] = [
  {
    cityId: 1,
    floor: 1,
    description: "Ascend to D class Blessed Health Core",
  },
  {
    cityId: 1,
    floor: 3,
    description: "Ascend to D class Blessed Attack Core",
  },
  {
    cityId: 1,
    floor: 5,
    description: "Ascend to D class Blessed Defense Core",
  },
  {
    cityId: 1,
    floor: 7,
    description: "Ascend to D class Blessed Defense Penetration Core",
  },
  {
    cityId: 1,
    floor: 9,
    description: "Ascend to D class Blessed Critical Core",
  },
  {
    cityId: 1,
    floor: 11,
    description: "Ascend to D class Blessed Damage Neutralisation Core",
  },
  {
    cityId: 1,
    floor: 13,
    description: "Ascend to D class Blessed Stun Core",
  },
  {
    cityId: 1,
    floor: 15,
    description: "Ascend to D class Blessed Reduced Counter Core",
  },
  {
    cityId: 1,
    floor: 17,
    description: "Ascend to D class Blessed Dodge Counter Core",
  },
  {
    cityId: 1,
    floor: 19,
    description: "Ascend to C class Blessed Health Core",
  },
  {
    cityId: 2,
    floor: 1,
    description: "Ascend to C class Blessed Attack Core",
  },
  {
    cityId: 2,
    floor: 3,
    description: "Ascend to C class Blessed Defense Core",
  },

  {
    cityId: 2,
    floor: 5,
    description: "Ascend to C class Blessed Defense Penetration Core",
  },

  {
    cityId: 2,
    floor: 7,
    description: "Ascend to C class Blessed Critical Core",
  },

  {
    cityId: 2,
    floor: 9,
    description: "Ascend to C class Blessed Damage Neutralisation Core",
  },
  {
    cityId: 2,
    floor: 11,
    description: "Ascend to C class Blessed Stun Core",
  },
  {
    cityId: 3,
    floor: 2,
    description: "Ascend to B class Blessed Defense Penetration Core",
  },
  {
    cityId: 3,
    floor: 4,
    description: "Ascend to B class Blessed Critical Core",
  },
  {
    cityId: 4,
    floor: 7,
    description: "Ascend to B class Blessed Dodge Counter Core",
  },
  {
    cityId: 4,
    floor: 9,
    description: "Ascend to B class Blessed Health Core",
  },
  {
    cityId: 4,
    floor: 13,
    description: "Ascend to B class Blessed Defense Core",
  },
  {
    cityId: 4,
    floor: 15,
    description: "Ascend to B class Blessed Defense Penetration Core",
  },
  {
    cityId: 4,
    floor: 17,
    description: "Ascend to A class Blessed Critical Core",
  },
  {
    cityId: 4,
    floor: 19,
    description: "Ascend to A class Blessed Damage Neutralisation Core",
  },
];
