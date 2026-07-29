# 40 – Enemy AI (MVP)

This document specifies the MVP enemy AI behavior for ANTE.

The goal is a simple, predictable AI that:
- Draws from its deck like the player.
- Chooses a committed hand each round.
- Feels distinct across different enemy archetypes.

---

## 1. MVP AI Philosophy

- **Simplicity first**: prioritize correctness and readability over sophisticated strategy.
- **Determinism where possible**: make AI choices predictable for testing and debugging.
- **Profile-based**: different archetypes (Grinder, Gambler, etc.) share logic but use different parameters.

---

## 2. AI Profiles

`EnemyAIProfile` (MVP set):

- `Grinder`
  - Small decks, low variance, favors consistent hands (Pairs / Two Pair).
- `Gambler`
  - Larger decks, higher variance, occasionally hits big (Full House / Straight).
- `SuitSpecialist`
  - Deck biased towards one suit, wants Flushes / strong suit effects.
- `Boss`
  - Stronger stats, larger deck, may combine traits above.

Profiles can be encoded as enums plus a configuration object.

---

## 3. Hand Selection Strategy

The main AI function:

```ts
// Given enemy hand and profile, choose committed cards
function selectEnemyHand(
  handCards: Card[],
  profile: EnemyAIProfile
): Card[]
```

### 3.1 MVP Baseline

For MVP, we keep it simple:

- Enemy always commits **all cards in hand** (up to 5 cards).
- If future versions allow drawing more than 5, commit the best 5.

This is enough to:
- Use the same poker evaluator as the player.
- Keep behavior predictable.

### 3.2 Future (optional, post-MVP) Extension

For later versions, AI can:
- Enumerate all combinations of 5 cards from `handCards` when `handCards.length > 5`.
- Evaluate each combination via `evaluatePokerHand`.
- Pick the combination with the best `PokerHandResult` (by `compareHands`).

But **MVP** does not need this; it can be documented as a potential upgrade.

---

## 4. Profile-Specific Behavior (MVP)

Even with the baseline strategy (commit all cards), profiles differ via deck construction.

### 4.1 Grinder

- Deck:
  - Small (e.g., 10–12 cards).
  - Many duplicates of low/mid ranks.
- Behavior:
  - High chance of Pairs / Two Pair.
  - Rare strong hands.

### 4.2 Gambler

- Deck:
  - Larger (e.g., 15–20 cards).
  - Wider rank spread, some high cards.
- Behavior:
  - High variance; some weak, some very strong hands.

### 4.3 SuitSpecialist

- Deck:
  - Strong bias toward one suit.
- Behavior:
  - High Flush / strong suit-effect frequency.

### 4.4 Boss

- Deck:
  - Larger, stronger ranks, maybe more abilities.
- Behavior:
  - Same selection strategy; challenge comes from deck stats and HP.

---

## 5. Integration Points

AI plugs into the combat loop during **Selection Phase**:

- Combat loop calls:
  - `selectEnemyHand(enemy.hand, enemy.aiProfile)`
- Returns `enemyCommittedCards`.
- Rest of combat process is identical to player.

AI **does not**:
- Modify core rules.
- Directly manipulate HP or damage.

---

## 6. Testing

- Provide deterministic test cases:
  - Given a specific `handCards` and `profile`, ensure selection is predictable.
- For MVP baseline (commit all hand cards), tests mainly ensure no cards are omitted.

This file should be updated if enemy decision-making becomes more complex (e.g., discards, risk/reward strategies).