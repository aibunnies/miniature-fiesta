# 10 – Domain Model

This document defines the core domain entities for the ANTE MVP. These types should exist in the domain layer (not tied to UI) and be usable from tests and AI agents.

---

## 1. Card

Cards are both creatures and playing cards.

**Fields (MVP):**

- `id: string`
- `name: string`
- `rank: number`  
  - 2–14 (where 11=J, 12=Q, 13=K, 14=A)
- `suit: Suit`
- `level: 1 | 2 | 3`
- `basePower: number`  
  - Base contribution to damage.
- `ability: CardAbility`  
  - Simple, structured ability description.

**Suit enum:**

- `Suit = 'Blades' | 'Coins' | 'Cups' | 'Wings'`

**Ability (MVP scope):**

- `type: 'OnHandRank' | 'OnSuitMajority' | 'Passive'`
- `handRankCondition?: PokerHandRank`  
  - e.g., triggers on Pair or better.
- `effect: AbilityEffect`  
  - e.g., `+damage`, `heal`, `applyStatus`.

We keep abilities simple and data-driven for MVP.

---

## 2. Deck & Piles

We model deck and piles as lists of card IDs (or Card instances) with clear ownership.

**Deck:**

- `drawPile: Card[]`
- `discardPile: Card[]`
- `hand: Card[]`

**Operations:**

- `draw(n): Card[]`
  - Draw up to `n` from `drawPile`, refilling from `discardPile` when needed.
- `discard(cards: Card[])`
  - Move cards from hand (or table) to `discardPile`.
- `shuffle()`
  - Randomizes `drawPile`.

MVP rule: draw 5 cards at start of each round (or fewer if deck is small).

---

## 3. Hand & Poker Result

**Hand:**

- `cards: Card[]`  
  - The committed cards for this round (subset of hand).

**PokerHandResult:**

- `rank: PokerHandRank`
- `primaryValue: number`
  - Main comparison value (e.g., rank of trips in a full house).
- `kickerValues: number[]`
  - Secondary comparison values for tie-breaking.
- `isFlush: boolean`
- `isStraight: boolean`

**PokerHandRank enum (MVP):**

- `HighCard`
- `Pair`
- `TwoPair`
- `ThreeOfAKind`
- `Straight`
- `Flush`
- `FullHouse`
- `FourOfAKind`
- `StraightFlush`
- (Optionally) `RoyalFlush` as a special StraightFlush.

---

## 4. Combatants: Player & Enemy

**Base interface:**

- `id: string`
- `name: string`
- `hpCurrent: number`
- `hpMax: number`
- `deck: Deck`
- `statusEffects: StatusEffect[]` (MVP can keep this minimal)

**Player:**

- Extends base combatant.
- `gold: number` (stubbed for MVP; more important post-MVP).
- `deck` starts from a fixed starting list.

**Enemy:**

- Extends base combatant.
- `aiProfile: EnemyAIProfile`
  - e.g., `'Grinder' | 'Gambler' | 'SuitSpecialist' | 'Boss'`
- `behaviorConfig: EnemyBehaviorConfig`
  - Simple configuration used by AI for MVP.

---

## 5. Battle

Represents a single fight between a player and an enemy.

**Fields:**

- `id: string`
- `player: Player`
- `enemy: Enemy`
- `roundNumber: number`
- `state: BattleState`
- `log: BattleEvent[]` (optional log for debugging/testing)

**BattleState enum:**

- `Idle` – before first round.
- `DrawPhase`
- `SelectionPhase`
- `ResolutionPhase`
- `Finished`

**BattleOutcome (per round):**

- `playerHand: PokerHandResult`
- `enemyHand: PokerHandResult`
- `playerDamageDealt: number`
- `enemyDamageDealt: number`
- `playerHPAfter: number`
- `enemyHPAfter: number`

This should be computed by pure functions (no UI dependencies).

---

## 6. Run / Floor (MVP)

For MVP, we simplify to a linear floor: 3 standard battles + 1 boss.

**Run:**

- `id: string`
- `battles: BattleConfig[]`
- `currentBattleIndex: number`
- `status: 'InProgress' | 'Won' | 'Lost'`

**BattleConfig:**

- `id: string`
- `enemyId: string`
- `type: 'Standard' | 'Boss'`

**Flow:**

- Start at `currentBattleIndex = 0`.
- On win:
  - If not last battle:
    - Show reward screen (add card to deck).
    - Increment `currentBattleIndex`.
  - If last battle:
    - `status = 'Won'`.
- On loss:
  - `status = 'Lost'`.

---

## 7. Status Effects (MVP-lite)

We keep status effects minimal for now.

**StatusEffect:**

- `type: 'Bleed' | 'Poison' | 'Shield' | 'Weaken'`
- `value: number`
- `duration: number` (rounds remaining)

MVP simplification: we can start with **none** or just one (e.g., Bleed) and expand later. The domain model allows extension without refactors.

---

## 8. Design Principles

- **Pure domain:** All game rules (deck handling, poker evaluation, combat resolution) live in pure functions operating on these domain types.
- **UI-agnostic:** These models must not depend on any UI or framework.
- **Extensible:** New features like relics or multi-floor runs should extend these types rather than replace them.

This file is the reference for any data structure changes. Tickets that alter core types should update this document accordingly.