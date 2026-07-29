import type {
  Battle,
  BattleConfig,
  BattleType,
  Deck,
  Player,
  Run,
} from './types'
import { createShuffledDeck } from './deck'
import { startBattle } from './battle'
import { enemies } from '../content/enemies'
import { basePlayerCards } from '../content/cards'
import { runBattleConfigs } from '../content/runConfigs'

/**
 * Start a new run with a fixed sequence of battles.
 *
 * For MVP we use:
 *  - 3 standard battles
 *  - 1 boss battle
 */
export function startRun(): {
  run: Run
  battle: Battle
  player: Player
} {
  // Create base player deck from content
  const playerDeck: Deck = createShuffledDeck(basePlayerCards)

  const player: Player = {
    id: 'player',
    name: 'Player',
    hpCurrent: 100,
    hpMax: 100,
    deck: playerDeck,
    statusEffects: [],
    gold: 0,
  }

  const battles: BattleConfig[] = runBattleConfigs

  const firstBattleConfig = battles[0]
  const enemyTemplate = enemies.find((e) => e.id === firstBattleConfig.enemyId)
  if (!enemyTemplate) {
    throw new Error(`Enemy not found for battle ${firstBattleConfig.id}`)
  }

  const enemyDeck = createShuffledDeck(enemyTemplate.deck.drawPile)
  const enemy = {
    ...enemyTemplate,
    deck: enemyDeck,
  }

  const battle = startBattle(firstBattleConfig, player, enemy)

  const run: Run = {
    id: 'run-1',
    battles,
    currentBattleIndex: 0,
    status: 'InProgress',
  }

  return { run, battle, player }
}

/**
 * Advance run state after a battle.
 *
 * outcome:
 *  - 'Win'  => move to next battle or mark run as won.
 *  - 'Loss' => mark run as lost.
 */
export function advanceAfterBattle(
  run: Run,
  outcome: 'Win' | 'Loss',
): Run {
  if (run.status !== 'InProgress') return run

  if (outcome === 'Loss') {
    return { ...run, status: 'Lost' }
  }

  const nextIndex = run.currentBattleIndex + 1
  if (nextIndex >= run.battles.length) {
    return { ...run, currentBattleIndex: nextIndex, status: 'Won' }
  }

  return { ...run, currentBattleIndex: nextIndex }
}

/**
 * Generate card rewards for the player.
 *
 * - deck: current player deck (used to avoid exact duplicates if desired).
 * - pool: global card pool to draw from.
 * - count: number of reward options.
 */
export function generateCardRewards(
  deck: Deck,
  pool: { id: string }[],
  count = 3,
): any[] {
  // MVP: simple random selection from the pool.
  const result: any[] = []
  const usedIndices = new Set<number>()

  while (result.length < count && usedIndices.size < pool.length) {
    const idx = Math.floor(Math.random() * pool.length)
    if (usedIndices.has(idx)) continue
    usedIndices.add(idx)
    result.push(pool[idx])
  }

  return result
}
