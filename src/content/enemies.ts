import type { Enemy } from '../domain/types'
import { createShuffledDeck } from '../domain/deck'
import { cardPool } from './cards'

// Helper to pick some cards from the pool by id
function pickCards(ids: string[]) {
  return ids
    .map((id) => cardPool.find((c) => c.id === id))
    .filter((c): c is typeof cardPool[number] => !!c)
}

// For enemies we predefine decks as draw piles; Battle/startRun will reshuffle.
export const enemies: Enemy[] = [
  {
    id: 'enemy-grinder-1',
    name: 'Arena Grinder',
    hpCurrent: 60,
    hpMax: 60,
    deck: createShuffledDeck(
      pickCards([
        'p-2-blades',
        'p-3-blades',
        'p-4-coins',
        'p-5-coins',
        'p-6-cups',
        'p-7-cups',
      ]),
    ),
    statusEffects: [],
    aiProfile: 'Grinder',
    behaviorConfig: { aggression: 'Low' },
  },
  {
    id: 'enemy-gambler-1',
    name: 'Lucky Gambler',
    hpCurrent: 70,
    hpMax: 70,
    deck: createShuffledDeck(
      pickCards([
        'p-3-blades',
        'p-4-coins',
        'p-5-coins',
        'p-8-wings',
        'c-10-blades',
        'c-q-coins',
      ]),
    ),
    statusEffects: [],
    aiProfile: 'Gambler',
    behaviorConfig: { aggression: 'Medium' },
  },
  {
    id: 'enemy-suit-1',
    name: 'Suit Specialist',
    hpCurrent: 80,
    hpMax: 80,
    deck: createShuffledDeck(
      pickCards([
        'p-6-cups',
        'p-7-cups',
        'c-k-cups',
        'p-8-wings',
        'p-9-wings',
        'c-a-wings',
      ]),
    ),
    statusEffects: [],
    aiProfile: 'SuitSpecialist',
    behaviorConfig: { prefersSuit: 'Cups', aggression: 'Medium' },
  },
  {
    id: 'enemy-boss-1',
    name: 'House Champion',
    hpCurrent: 120,
    hpMax: 120,
    deck: createShuffledDeck(
      pickCards([
        'p-2-blades',
        'p-3-blades',
        'p-4-coins',
        'p-5-coins',
        'p-6-cups',
        'p-7-cups',
        'c-10-blades',
        'c-j-blades',
        'c-q-coins',
        'c-k-cups',
        'c-a-wings',
      ]),
    ),
    statusEffects: [],
    aiProfile: 'Boss',
    behaviorConfig: { prefersSuit: 'Blades', aggression: 'High' },
  },
]