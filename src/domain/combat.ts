import type {
  BattleOutcome,
  Card,
  Enemy,
  Player,
  PokerHandRank,
  PokerHandResult,
  StatusEffect,
} from './types'
import { evaluatePokerHand } from './poker'

/**
 * Base damage per poker hand rank.
 * These values are intentionally simple and can be tuned for balance.
 */
const BASE_DAMAGE_TABLE: Record<PokerHandRank, number> = {
  HighCard: 4,
  Pair: 8,
  TwoPair: 12,
  ThreeOfAKind: 18,
  Straight: 24,
  Flush: 24,
  FullHouse: 32,
  FourOfAKind: 40,
  StraightFlush: 50,
}

/**
 * Rank-based modifier:
 * For now we use the average of committed card ranks, rounded down.
 * This makes higher-rank cards meaningfully stronger without exploding numbers.
 */
export function computeRankModifier(committedCards: Card[]): number {
  if (committedCards.length === 0) return 0
  const total = committedCards.reduce((sum, c) => sum + c.rank, 0)
  const avg = total / committedCards.length
  return Math.floor(avg)
}

/**
 * Determine majority suit among committed cards.
 * Returns the suit when there is a clear majority, otherwise null.
 */
function getMajoritySuit(cards: Card[]): string | null {
  if (cards.length === 0) return null
  const counts = new Map<string, number>()
  for (const c of cards) {
    counts.set(c.suit, (counts.get(c.suit) ?? 0) + 1)
  }
  let bestSuit: string | null = null
  let bestCount = 0
  for (const [suit, count] of counts.entries()) {
    if (count > bestCount) {
      bestCount = count
      bestSuit = suit
    } else if (count === bestCount) {
      // tie: no majority
      bestSuit = null
    }
  }
  return bestSuit
}

/**
 * Suit-based effects (applied to the attacker and/or defender).
 *
 * - Blades (Spades analogue): extra damage.
 * - Coins (Diamonds analogue): shield / reduced incoming damage.
 * - Cups (Hearts analogue): heal.
 * - Wings (Clubs analogue): apply Weaken status.
 *
 * This function is pure and does not mutate inputs. It returns:
 *  - adjustedDamage: final outgoing damage after offensive suit effects
 *  - selfHPDelta: HP change for the attacker (e.g., Cups heal)
 *  - targetStatusToApply: optional status effect to apply to the defender (e.g., Weaken)
 *  - defensiveReduction: multiplicative reduction factor to apply when this
 *    combatant is hit (for Coins suit; computed separately for each side).
 */
export interface SuitEffectResult {
  adjustedDamage: number
  selfHPDelta: number
  targetStatusToApply?: StatusEffect
  defensiveReduction: number // e.g., 0.8 => 20% reduction to incoming damage
}

export function applySuitEffects(params: {
  committedCards: Card[]
  baseDamage: number
}): SuitEffectResult {
  const { committedCards, baseDamage } = params
  const majoritySuit = getMajoritySuit(committedCards)

  // Default: no changes
  let damage = baseDamage
  let selfHPDelta = 0
  let defensiveReduction = 1
  let targetStatusToApply: StatusEffect | undefined

  switch (majoritySuit) {
    case 'Blades':
      // Offensive: extra damage
      damage = Math.round(baseDamage * 1.25)
      break
    case 'Coins':
      // Defensive: reduced incoming damage for this round
      defensiveReduction = 0.75 // 25% less incoming damage
      break
    case 'Cups':
      // Support: heal the attacker relative to base damage
      selfHPDelta = Math.round(baseDamage * 0.4)
      break
    case 'Wings':
      // Debuff: apply Weaken to the opponent
      targetStatusToApply = {
        type: 'Weaken',
        value: 20, // percent reduction to next attacks; actual handling is MVP-simple
        duration: 1,
      }
      break
    default:
      break
  }

  return {
    adjustedDamage: damage,
    selfHPDelta,
    targetStatusToApply,
    defensiveReduction,
  }
}

/**
 * Compute raw (pre-suit) damage from a poker result + committed cards.
 */
export function computeBaseDamage(
  pokerResult: PokerHandResult,
  committedCards: Card[],
): number {
  const base = BASE_DAMAGE_TABLE[pokerResult.rank]
  const rankMod = computeRankModifier(committedCards)
  return base + rankMod
}

/**
 * Very simple weaken handling: given a list of status effects,
 * compute a multiplicative damage factor. For MVP we treat 'Weaken'
 * as a % reduction to outgoing damage.
 */
function computeWeakenFactor(statusEffects: StatusEffect[]): number {
  const weakenEffects = statusEffects.filter((s) => s.type === 'Weaken')
  if (weakenEffects.length === 0) return 1
  // Combine weaken effects multiplicatively.
  // value is treated as percentage (e.g., 20 => 20% reduction).
  let factor = 1
  for (const w of weakenEffects) {
    const f = Math.max(0, 1 - w.value / 100)
    factor *= f
  }
  return factor
}

/**
 * Apply damage to a combatant's HP, clamped to [0, hpMax].
 */
function applyDamage(
  hpCurrent: number,
  hpMax: number,
  damage: number,
): number {
  const next = hpCurrent - damage
  if (next < 0) return 0
  if (next > hpMax) return hpMax
  return next
}

/**
 * Tick status durations by 1 round and remove expired effects.
 */
function tickStatusEffects(statusEffects: StatusEffect[]): StatusEffect[] {
  return statusEffects
    .map((s) => ({ ...s, duration: s.duration - 1 }))
    .filter((s) => s.duration > 0)
}

/**
 * Resolve a single side's offensive output (damage + self heal + debuff application),
 * given their committed cards, current status, and their evaluated poker hand.
 *
 * Returns the effective damage (after Weaken on attacker and suit effects) and
 * any changes to status for next round.
 */
function resolveSideAttack(params: {
  committedCards: Card[]
  pokerResult: PokerHandResult
  attackerStatus: StatusEffect[]
}): {
  outgoingDamage: number
  selfHPDelta: number
  targetStatusToApply?: StatusEffect
  defensiveReduction: number
} {
  const { committedCards, pokerResult, attackerStatus } = params

  const baseDamage = computeBaseDamage(pokerResult, committedCards)

  // Offensive debuffs on the attacker (e.g., Weaken) reduce outgoing damage.
  const weakenFactor = computeWeakenFactor(attackerStatus)
  const weakenedDamage = Math.round(baseDamage * weakenFactor)

  const suitEffect = applySuitEffects({
    committedCards,
    baseDamage: weakenedDamage,
  })

  return {
    outgoingDamage: suitEffect.adjustedDamage,
    selfHPDelta: suitEffect.selfHPDelta,
    targetStatusToApply: suitEffect.targetStatusToApply,
    defensiveReduction: suitEffect.defensiveReduction,
  }
}

/**
 * Resolve a single combat round for both sides.
 *
 * Both sides:
 *  - Commit cards (playerCommitted, enemyCommitted).
 *  - Evaluate poker hands.
 *  - Compute base damage + rank modifier.
 *  - Apply suit effects (Blades/Coins/Cups/Wings) and Weaken.
 *  - Deal damage simultaneously.
 *
 * Suit/Status rules in this MVP:
 *  - Blades majority: +25% outgoing damage.
 *  - Coins majority: 25% less incoming damage this round.
 *  - Cups majority: heal the attacker for 40% of their base damage.
 *  - Wings majority: apply Weaken (20% reduction) to the defender's next attacks (1 round).
 *  - Weaken: multiplicative reduction to outgoing damage; durations tick down each round.
 *
 * NOTE: This function does not modify the Player / Enemy objects in-place;
 * instead, it returns HP values and status snapshots so the caller (battle loop)
 * can construct updated combatants.
 */
export function resolveCombatRound(params: {
  player: Player
  enemy: Enemy
  playerCommitted: Card[]
  enemyCommitted: Card[]
}): BattleOutcome {
  const { player, enemy, playerCommitted, enemyCommitted } = params

  // Evaluate hands (assumes committed length 5 as per MVP; validation left to caller)
  const playerHand = evaluatePokerHand(playerCommitted)
  const enemyHand = evaluatePokerHand(enemyCommitted)

  const playerAttack = resolveSideAttack({
    committedCards: playerCommitted,
    pokerResult: playerHand,
    attackerStatus: player.statusEffects,
  })

  const enemyAttack = resolveSideAttack({
    committedCards: enemyCommitted,
    pokerResult: enemyHand,
    attackerStatus: enemy.statusEffects,
  })

  // Defensive (Coins) effects reduce incoming damage.
  const playerIncomingReduction = playerAttack.defensiveReduction
  const enemyIncomingReduction = enemyAttack.defensiveReduction

  let playerDamageDealt = Math.round(
    playerAttack.outgoingDamage * enemyIncomingReduction,
  )
  let enemyDamageDealt = Math.round(
    enemyAttack.outgoingDamage * playerIncomingReduction,
  )

  // Ensure non-negative
  if (playerDamageDealt < 0) playerDamageDealt = 0
  if (enemyDamageDealt < 0) enemyDamageDealt = 0

  // Apply simultaneous damage
  let playerHPAfter = applyDamage(
    player.hpCurrent,
    player.hpMax,
    enemyDamageDealt,
  )
  let enemyHPAfter = applyDamage(
    enemy.hpCurrent,
    enemy.hpMax,
    playerDamageDealt,
  )

  // Apply self-heal (Cups) after damage.
  if (playerAttack.selfHPDelta !== 0) {
    const healed = playerHPAfter + playerAttack.selfHPDelta
    playerHPAfter = healed > player.hpMax ? player.hpMax : healed
  }
  if (enemyAttack.selfHPDelta !== 0) {
    const healed = enemyHPAfter + enemyAttack.selfHPDelta
    enemyHPAfter = healed > enemy.hpMax ? enemy.hpMax : healed
  }

  // NOTE: Status updates (Weaken application, duration ticking) are NOT applied
  // here; the battle loop should:
  //  - tick existing statuses via tickStatusEffects()
  //  - add targetStatusToApply (if any) to defender's status list
  // This keeps combat resolution pure and focused on damage numbers.

  return {
    playerHand,
    enemyHand,
    playerDamageDealt,
    enemyDamageDealt,
    playerHPAfter,
    enemyHPAfter,
  }
}

/**
 * Helper to advance status effects after a round.
 * Exported so the battle domain can use the same logic.
 */
export function updateStatusEffectsAfterRound(
  current: StatusEffect[],
): StatusEffect[] {
  return tickStatusEffects(current)
}