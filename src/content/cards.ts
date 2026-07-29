import type { Card } from '../domain/types'

// Base player deck for MVP
export const basePlayerCards: Card[] = [
  {
    id: 'p-2-blades',
    name: 'Training Slash',
    rank: 2,
    suit: 'Blades',
    level: 1,
    basePower: 1,
    ability: {
      type: 'OnHandRank',
      handRankCondition: 'Pair',
      effect: { type: 'AddDamage', amount: 2 },
    },
  },
  {
    id: 'p-3-blades',
    name: 'Quick Cut',
    rank: 3,
    suit: 'Blades',
    level: 1,
    basePower: 1,
    ability: {
      type: 'OnSuitMajority',
      effect: { type: 'AddDamage', amount: 3 },
    },
  },
  {
    id: 'p-4-coins',
    name: 'Guarded Step',
    rank: 4,
    suit: 'Coins',
    level: 1,
    basePower: 1,
    ability: {
      type: 'Passive',
      effect: { type: 'ApplyStatus', statusType: 'Shield', value: 2, duration: 1 },
    },
  },
  {
    id: 'p-5-coins',
    name: 'Lucky Coin',
    rank: 5,
    suit: 'Coins',
    level: 1,
    basePower: 1,
    ability: {
      type: 'OnHandRank',
      handRankCondition: 'TwoPair',
      effect: { type: 'AddDamage', amount: 4 },
    },
  },
  {
    id: 'p-6-cups',
    name: 'Soothe',
    rank: 6,
    suit: 'Cups',
    level: 1,
    basePower: 1,
    ability: {
      type: 'OnSuitMajority',
      effect: { type: 'Heal', amount: 5 },
    },
  },
  {
    id: 'p-7-cups',
    name: 'Comfort',
    rank: 7,
    suit: 'Cups',
    level: 1,
    basePower: 1,
    ability: {
      type: 'Passive',
      effect: { type: 'Heal', amount: 3 },
    },
  },
  {
    id: 'p-8-wings',
    name: 'Feather Jab',
    rank: 8,
    suit: 'Wings',
    level: 1,
    basePower: 1,
    ability: {
      type: 'OnSuitMajority',
      effect: { type: 'ApplyStatus', statusType: 'Weaken', value: 10, duration: 1 },
    },
  },
  {
    id: 'p-9-wings',
    name: 'Gust Strike',
    rank: 9,
    suit: 'Wings',
    level: 1,
    basePower: 1,
    ability: {
      type: 'OnHandRank',
      handRankCondition: 'Straight',
      effect: { type: 'AddDamage', amount: 6 },
    },
  },
]

// Global card pool for rewards / enemy decks (includes base deck + extras)
export const cardPool: Card[] = [
  ...basePlayerCards,
  {
    id: 'c-10-blades',
    name: 'Edge Dance',
    rank: 10,
    suit: 'Blades',
    level: 2,
    basePower: 2,
    ability: {
      type: 'OnHandRank',
      handRankCondition: 'ThreeOfAKind',
      effect: { type: 'AddDamage', amount: 8 },
    },
  },
  {
    id: 'c-j-blades',
    name: 'Duelist',
    rank: 11,
    suit: 'Blades',
    level: 2,
    basePower: 2,
    ability: {
      type: 'Passive',
      effect: { type: 'AddDamage', amount: 3 },
    },
  },
  {
    id: 'c-q-coins',
    name: 'Golden Guard',
    rank: 12,
    suit: 'Coins',
    level: 2,
    basePower: 2,
    ability: {
      type: 'Passive',
      effect: { type: 'ApplyStatus', statusType: 'Shield', value: 4, duration: 1 },
    },
  },
  {
    id: 'c-k-cups',
    name: 'Warm Chalice',
    rank: 13,
    suit: 'Cups',
    level: 2,
    basePower: 2,
    ability: {
      type: 'OnSuitMajority',
      effect: { type: 'Heal', amount: 8 },
    },
  },
  {
    id: 'c-a-wings',
    name: 'Skyfall',
    rank: 14,
    suit: 'Wings',
    level: 3,
    basePower: 3,
    ability: {
      type: 'OnHandRank',
      handRankCondition: 'StraightFlush',
      effect: { type: 'AddDamage', amount: 15 },
    },
  },
]
