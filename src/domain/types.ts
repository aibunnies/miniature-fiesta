// Core domain types for ANTE MVP

export type Suit = 'Blades' | 'Coins' | 'Cups' | 'Wings'

export type PokerHandRank =
  | 'HighCard'
  | 'Pair'
  | 'TwoPair'
  | 'ThreeOfAKind'
  | 'Straight'
  | 'Flush'
  | 'FullHouse'
  | 'FourOfAKind'
  | 'StraightFlush'

export type BattleState =
  | 'Idle'
  | 'DrawPhase'
  | 'SelectionPhase'
  | 'ResolutionPhase'
  | 'Finished'

// --- Card & abilities ---

export interface AbilityEffectAddDamage {
  type: 'AddDamage'
  amount: number
}

export interface AbilityEffectHeal {
  type: 'Heal'
  amount: number
}

export type StatusType = 'Bleed' | 'Poison' | 'Shield' | 'Weaken'

export interface AbilityEffectApplyStatus {
  type: 'ApplyStatus'
  statusType: StatusType
  value: number
  duration: number
}

export type AbilityEffect =
  | AbilityEffectAddDamage
  | AbilityEffectHeal
  | AbilityEffectApplyStatus

export type CardAbilityType = 'OnHandRank' | 'OnSuitMajority' | 'Passive'

export interface CardAbility {
  type: CardAbilityType
  handRankCondition?: PokerHandRank
  effect: AbilityEffect
}

export interface Card {
  id: string
  name: string
  rank: number // 2–14 (11=J, 12=Q, 13=K, 14=A)
  suit: Suit
  level: 1 | 2 | 3
  basePower: number
  ability: CardAbility
}

// --- Deck & hands ---

export interface Deck {
  drawPile: Card[]
  discardPile: Card[]
  hand: Card[]
}

export interface Hand {
  cards: Card[]
}

// --- Poker result ---

export interface PokerHandResult {
  rank: PokerHandRank
  primaryValue: number
  kickerValues: number[]
  isFlush: boolean
  isStraight: boolean
}

// --- Status effects & combatants ---

export interface StatusEffect {
  type: StatusType
  value: number
  duration: number // rounds remaining
}

export interface BaseCombatant {
  id: string
  name: string
  hpCurrent: number
  hpMax: number
  deck: Deck
  statusEffects: StatusEffect[]
}

export interface Player extends BaseCombatant {
  gold: number
}

export type EnemyAIProfile = 'Grinder' | 'Gambler' | 'SuitSpecialist' | 'Boss'

export interface EnemyBehaviorConfig {
  prefersSuit?: Suit
  aggression?: 'Low' | 'Medium' | 'High'
}

export interface Enemy extends BaseCombatant {
  aiProfile: EnemyAIProfile
  behaviorConfig: EnemyBehaviorConfig
}

// --- Battle & run ---

export interface BattleEvent {
  round: number
  description: string
}

export interface BattleOutcome {
  playerHand: PokerHandResult
  enemyHand: PokerHandResult
  playerDamageDealt: number
  enemyDamageDealt: number
  playerHPAfter: number
  enemyHPAfter: number
}

export interface Battle {
  id: string
  player: Player
  enemy: Enemy
  roundNumber: number
  state: BattleState
  log: BattleEvent[]
}

export type RunStatus = 'InProgress' | 'Won' | 'Lost'

export type BattleType = 'Standard' | 'Boss'

export interface BattleConfig {
  id: string
  enemyId: string
  type: BattleType
}

export interface Run {
  id: string
  battles: BattleConfig[]
  currentBattleIndex: number
  status: RunStatus
}