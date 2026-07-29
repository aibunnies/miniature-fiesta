# 20 – Combat Loop (Round & Battle Flow)

This document specifies the step-by-step combat loop for the ANTE MVP, aligning implementation with the design spec.

The combat loop is **round-based** and symmetric: both player and enemy draw cards, commit a hand, and deal damage simultaneously.

---

## 1. High-Level Battle Flow

A **Battle** is a sequence of rounds between one Player and one Enemy.

### 1.1 Battle Lifecycle

1. **Initialize Battle**
   - Inputs:
     - `player`: Player with deck and HP.
     - `enemy`: Enemy with deck and HP.
   - Outputs:
     - `Battle` object with:
       - `roundNumber = 0`.
       - `state = 'Idle'`.

2. **Start Round**
   - Increment `roundNumber`.
   - Set `state = 'DrawPhase'`.

3. **Draw Phase**
   - For Player and Enemy:
     - Draw up to 5 cards from their deck into `hand`.
     - If not enough cards in `drawPile`, reshuffle `discardPile` into `drawPile`.
   - Transition to `SelectionPhase`.

4. **Selection Phase**
   - Player:
     - Chooses up to 5 cards from `hand` to commit (UI handles selection).
   - Enemy:
     - AI chooses committed cards based on its hand (see `40_enemy_ai.md`).
   - Store committed cards for both sides.
   - Transition to `ResolutionPhase`.

5. **Resolution Phase**
   - Evaluate committed hands (see `30_poker_logic.md`).
   - Compute base damage and apply suit effects (see damage/suit logic).
   - Apply damage simultaneously:
     - Subtract damage from opponent HP.
     - Apply healing/shields/status as needed.
   - Move all drawn cards (committed and uncommitted) to discard piles.
   - Check for battle end:
     - If both `hpCurrent > 0`: start next round.
     - If one or both `hpCurrent <= 0`: set `state = 'Finished'` and record winner.

6. **Battle End**
   - Determine `BattleResult`:
     - `Winner: 'Player' | 'Enemy' | 'Draw'` (MVP can treat mutual KO as loss or special case).
   - Return result to run controller.

---

## 2. Detailed Round Steps

We define a pure function for resolving one round:

```ts
// Pseudocode signature
function playRound(
  battle: Battle,
  playerSelection: CardID[],
  enemySelectionStrategy: EnemySelectionFn
): {
  battle: Battle;
  outcome: RoundOutcome;
}
```

### 2.1 Draw Hands

For each combatant (Player and Enemy):

1. **Ensure hand is empty** (or clear previous round state).
2. **Draw up to 5 cards**:
   - While `hand.length < 5` and `drawPile` not empty:
     - Move top card from `drawPile` to `hand`.
   - If `drawPile` empty and `discardPile` not empty:
     - Shuffle `discardPile` into new `drawPile` and continue drawing.
3. If both piles empty and hand < 5, stop; hand is whatever was drawn.

### 2.2 Player Selection

- UI presents player's `hand`.
- Player selects up to 5 cards to commit:
  - MVP rule: allow 1–5 cards; must select at least 1.
- `playerCommittedCards` is the list of selected cards.

### 2.3 Enemy Selection

- AI receives enemy `hand` and `aiProfile`.
- For MVP, simplest behavior:
  - Enemy commits **all** cards in its hand (or up to 5 if more).
- Returns `enemyCommittedCards`.

### 2.4 Hand Evaluation

For both player and enemy committed cards:

- Call `evaluatePokerHand(committedCards)` → `PokerHandResult`.
- Store results in `RoundOutcome`.

### 2.5 Damage Calculation

- Inputs:
  - `playerHandResult`, `enemyHandResult`.
  - `playerCommittedCards`, `enemyCommittedCards`.
  - Card ranks, suits, levels.
- Steps:
  1. Compute **base damage** per side via hand rank.
  2. Apply **rank-based modifier** (e.g., average rank).
  3. Apply **suit effects** based on suit majority.
  4. Apply **card abilities** (MVP subset) that trigger on:
     - Hand rank (e.g., "On Pair or better, +2 damage").
     - Suit (e.g., "On Flush, heal 3 HP").

- For MVP, both sides apply their full computed damage each round (no extra bonus for higher-ranked hand yet, unless explicitly configured).

### 2.6 Apply Effects & Update HP

- For each side:
  - Apply outgoing damage to opponent HP, considering shields or mitigation.
  - Apply healing/status effects to self or opponent.
- Clamp HP:
  - `hpCurrent = max(0, min(hpCurrent, hpMax))`.

### 2.7 Discard & Cleanup

- Move **all** cards that were in `hand` (committed and uncommitted) to `discardPile`.
- Clear `hand` for next round.
- Update `roundNumber++`.

### 2.8 Check End Conditions

- If both `player.hpCurrent > 0` and `enemy.hpCurrent > 0`:
  - Continue to next round.
- If one or both HP ≤ 0:
  - Set `state = 'Finished'`.
  - Determine winner:
    - If `player.hpCurrent > 0` and `enemy.hpCurrent <= 0`: Player wins.
    - If `enemy.hpCurrent > 0` and `player.hpCurrent <= 0`: Enemy wins.
    - If both ≤ 0: decide rule (MVP: treat as player loss or draw).

---

## 3. Data Structures for Round Outcome

Define a struct to capture all relevant info for UI and debugging.

**RoundOutcome:**

- `roundNumber: number`
- `playerCommittedCards: Card[]`
- `enemyCommittedCards: Card[]`
- `playerHandResult: PokerHandResult`
- `enemyHandResult: PokerHandResult`
- `playerDamageDealt: number`
- `enemyDamageDealt: number`
- `playerHPBefore: number`
- `enemyHPBefore: number`
- `playerHPAfter: number`
- `enemyHPAfter: number`
- `suitEffectsApplied: SuitEffectLog[]`
- `cardAbilitiesTriggered: AbilityTriggerLog[]`

This object feeds both:
- UI (to display hand ranks and damage).
- Debug logs (for tests and dev tooling).

---

## 4. Open Tunables (MVP Defaults)

These are configurable parameters with suggested MVP defaults:

- **Hand size**: 5 cards.
- **Minimum committed cards**: 1.
- **Round winner bonus**: None for MVP (both deal full damage). Can be added later.
- **Card redraw**: No discards/redraws per round for MVP (Balatro-like discards can be added later).

These parameters should live in a configuration module so they can be adjusted without refactoring logic.

---

This file should be consulted whenever combat flow changes are proposed. Implementation in `logic/combatLoop.ts` should closely mirror these steps.