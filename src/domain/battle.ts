import type {
  Battle,
  BattleConfig,
  BattleOutcome,
  BattleState,
  Card,
  Enemy,
  Player,
} from './types'
import { drawCards, discardCards } from './deck'
import { resolveCombatRound, updateStatusEffectsAfterRound } from './combat'

/**
 * Start a new battle from config and existing player/enemy state.
 *
 * Caller is responsible for providing player/enemy with decks and HP.
 */
export function startBattle(
  battleConfig: BattleConfig,
  player: Player,
  enemy: Enemy,
): Battle {
  return {
    id: battleConfig.id,
    player,
    enemy,
    roundNumber: 0,
    state: 'Idle',
    log: [],
  }
}

/**
 * Simple enemy AI for MVP: always commit all cards in hand (up to 5).
 */
function chooseEnemyCommittedCards(enemyHand: Card[]): Card[] {
  return enemyHand.slice(0, 5)
}

/**
 * Perform the full round loop:
 *  - Draw phase: both sides draw up to 5.
 *  - Selection phase: playerCommitted is provided; enemy commits all 5.
 *  - Resolution phase: resolve combat, update HP, decks, statuses and battle state.
 */
export function nextRound(
  battle: Battle,
  playerSelection: Card[],
): { battle: Battle; outcome: BattleOutcome } {
  // Draw phase: draw up to 5 cards for player and enemy
  const playerCardsNeeded = Math.max(0, 5 - battle.player.deck.hand.length)
  const enemyCardsNeeded = Math.max(0, 5 - battle.enemy.deck.hand.length)

  let playerDeck = battle.player.deck
  let enemyDeck = battle.enemy.deck

  if (playerCardsNeeded > 0) {
    const drawResult = drawCards(playerDeck, playerCardsNeeded)
    playerDeck = drawResult.deck
  }

  if (enemyCardsNeeded > 0) {
    const drawResult = drawCards(enemyDeck, enemyCardsNeeded)
    enemyDeck = drawResult.deck
  }

  // Selection phase
  // Player committed cards: trust UI to only send cards currently in hand.
  const playerCommitted = playerSelection.slice(0, 5)
  const enemyCommitted = chooseEnemyCommittedCards(enemyDeck.hand)

  // Resolution phase: combat round
  const outcome = resolveCombatRound({
    player: { ...battle.player, deck: playerDeck },
    enemy: { ...battle.enemy, deck: enemyDeck },
    playerCommitted,
    enemyCommitted,
  })

  // Update decks: discard committed cards
  playerDeck = discardCards(playerDeck, playerCommitted)
  enemyDeck = discardCards(enemyDeck, enemyCommitted)

  // Tick existing status effects
  const playerStatuses = updateStatusEffectsAfterRound(
    battle.player.statusEffects,
  )
  const enemyStatuses = updateStatusEffectsAfterRound(battle.enemy.statusEffects)

  // Build updated combatants
  const updatedPlayer: Player = {
    ...battle.player,
    hpCurrent: outcome.playerHPAfter,
    deck: playerDeck,
    statusEffects: playerStatuses,
  }

  const updatedEnemy: Enemy = {
    ...battle.enemy,
    hpCurrent: outcome.enemyHPAfter,
    deck: enemyDeck,
    statusEffects: enemyStatuses,
  }

  // Determine battle state
  let nextState: BattleState = 'DrawPhase'
  if (updatedPlayer.hpCurrent <= 0 || updatedEnemy.hpCurrent <= 0) {
    nextState = 'Finished'
  } else {
    nextState = 'DrawPhase'
  }

  const nextRoundNumber = battle.roundNumber + 1

  const newBattle: Battle = {
    ...battle,
    player: updatedPlayer,
    enemy: updatedEnemy,
    roundNumber: nextRoundNumber,
    state: nextState,
    log: [
      ...battle.log,
      {
        round: nextRoundNumber,
        description: `Round ${nextRoundNumber}: player dealt ${outcome.playerDamageDealt}, enemy dealt ${outcome.enemyDamageDealt}.`,
      },
    ],
  }

  return { battle: newBattle, outcome }
}
