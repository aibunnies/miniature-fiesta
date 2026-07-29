# 80 – Task Breakdown: MVP

This document enumerates concrete tasks (tickets) required to build the ANTE MVP, based on the game design spec and context docs.

Each bullet can be turned into a separate GitHub issue. Groupings (A, B, C…) are thematic, not priority order.

---

## A. Domain & Core Utilities

### A1 – Core Domain Models

**Goal:** Implement the core domain types described in `10_domain_model.md`.

**Tasks:**
- Define `Suit`, `PokerHandRank` enums.
- Implement `Card`, `Deck`, `Player`, `Enemy`, `Battle`, `Run` interfaces/types.
- Ensure these live in a UI-agnostic domain layer (e.g., `src/domain`).

**Done when:**
- Types compile.
- Simple unit tests can create sample cards, decks, players, enemies.

---

### A2 – Deck and Draw/Discard Logic

**Goal:** Implement deterministic deck behavior.

**Tasks:**
- Implement functions:
  - `createShuffledDeck(cards: Card[]): Deck`
  - `drawCards(deck: Deck, count: number): { deck: Deck; drawn: Card[] }`
  - `discardCards(deck: Deck, cards: Card[]): Deck`
- Implement reshuffling:
  - When `drawPile` is empty and there are cards in `discardPile`, reshuffle discard into draw.

**Done when:**
- Tests cover:
  - Drawing fewer than, equal to, and more than remaining cards.
  - Discard and reshuffle behavior.

---

## B. Poker Logic

### B1 – Poker Hand Evaluator

**Goal:** Evaluate 5-card hands into a `PokerHandResult`.

**Tasks:**
- Implement `evaluatePokerHand(cards: Card[]): PokerHandResult`.
- Support at least:
  - High Card
  - Pair
  - Two Pair
  - Three of a Kind
  - Straight
  - Flush
  - Full House
  - Four of a Kind
  - Straight Flush (optionally Royal Flush as special case)
- Implement tie-breaking via `primaryValue` and `kickerValues`.
- Decide and implement straight rules for Aces (A-high only for MVP is acceptable).

**Done when:**
- Unit tests cover each hand type with multiple examples.
- Edge cases (e.g., multiple possible hands) are deterministic and documented.

---

### B2 – Hand Comparison Helper

**Goal:** Compare two `PokerHandResult`s consistently.

**Tasks:**
- Implement `compareHands(a: PokerHandResult, b: PokerHandResult): number`:
  - Return `1` if `a` is better, `-1` if `b` is better, `0` if tie.
- Use `rank`, `primaryValue`, and `kickerValues` for comparison.

**Done when:**
- Tests verify correct ordering for representative pairs of hands.

---

## C. Combat Loop & Damage

### C1 – Round-Based Combat Loop

**Goal:** Implement a pure combat loop that advances a battle one round.

**Tasks:**
- Implement `startBattle(battleConfig, player, enemy): Battle`.
- Implement `nextRound(battle: Battle, playerSelection: Card[]): BattleOutcome`:
  - Draw phase: draw up to 5 cards for player and enemy.
  - Selection phase: accept player committed cards; AI selects enemy committed cards (hook to AI module).
  - Resolution phase:
    - Evaluate both hands.
    - Compute damage for both sides.
    - Update HP and battle state.
- Respect `BattleState` transitions.

**Done when:**
- A test can simulate a full battle by repeatedly calling `nextRound` with predetermined selections.
- Battle ends when either HP reaches 0.

---

### C2 – Damage Calculator

**Goal:** Convert hand ranks and card ranks into damage values.

**Tasks:**
- Implement base damage table (e.g., config or constant map):
  - High Card → low damage
  - Pair → higher
  - … up to Straight Flush → highest
- Add rank-based modifier:
  - Use average or total rank of committed cards to tweak damage.
- Decide MVP rule for round “winner”:
  - For MVP, recommend: both sides deal their computed damage each round (simpler), with the option to later add bonus damage for the higher-ranked hand.

**Done when:**
- Given known hands, damage output matches a documented table.
- Tests cover each hand rank and a few rank combinations.

---

### C3 – Suit / Element Effects (MVP)

**Goal:** Implement simple elemental bonuses based on suit majority.

**Tasks:**
- Define simple effects (MVP version), e.g.:
  - **Blades (Spades)**: +X direct damage.
  - **Coins (Diamonds)**: temporary shield (reduce incoming damage by Y).
  - **Cups (Hearts)**: heal player HP by Z.
  - **Wings (Clubs)**: apply a simple status (e.g., Weaken: reduce enemy next-round damage).
- Implement a function:
  - `applySuitEffects(hand: Hand, baseOutcome: DamageContext): DamageContext`
- For MVP, only apply one major effect per hand (based on suit majority).

**Done when:**
- Tests verify that majority suit triggers expected effect.
- Suit tie cases are defined and documented (e.g., no suit effect or first suit wins).

---

## D. Enemy AI

### D1 – Basic AI Hand Selection

**Goal:** Given an enemy hand (5 cards), choose a strong committed hand.

**Tasks:**
- For MVP, assume enemy draws 5 cards and commits all 5.
- Implement simple strategy:
  - Use all 5 cards; evaluation happens purely in poker logic.
  - (Optional later): consider subsets for more strategic AI.
- Implement `selectEnemyHand(handCards: Card[], aiProfile: EnemyAIProfile): Card[]`.

**Done when:**
- Enemy consistently uses all available cards.
- Later enhancements can plug into this function.

---

### D2 – Enemy Definitions

**Goal:** Define initial enemy content.

**Tasks:**
- Implement 3 standard enemies:
  - Different deck compositions (e.g., Grinder, Gambler, Suit Specialist).
- Implement 1 boss:
  - Larger deck.
  - Slight rule twist (e.g., more Blades, higher average ranks).
- Store definitions in a content module (e.g., `content/enemies.ts`).

**Done when:**
- Enemies can be looked up by ID from a run config.
- Tests ensure decks are valid and non-empty.

---

## E. Content: Cards and Starting Deck

### E1 – MVP Card Set

**Goal:** Define 15–20 unique cards.

**Tasks:**
- Create a card list in `content/cards.ts` aligned with `50_content_mvp.md`.
- Include for each:
  - `id`, `name`, `rank`, `suit`, `level=1`, `basePower`, `ability`.
- Ensure a mix of:
  - Low-rank commons.
  - A few stronger rares (even if rarity is not enforced yet).

**Done when:**
- Cards are suitable for starting deck and enemy decks.
- No duplicate IDs; all cards have valid fields.

---

### E2 – Starting Deck

**Goal:** Provide a reasonable starting experience.

**Tasks:**
- Define a starter deck of ~10 cards from the MVP card set:
  - Balanced suits.
  - Mostly low ranks and simple abilities.
- Implement a helper:
  - `createStartingDeck(): Card[]`.

**Done when:**
- A new run uses this deck by default.
- Tests ensure starting deck length and composition.

---

## F. Run / Floor Flow

### F1 – Linear Run Controller

**Goal:** Implement a simple run through 3 battles + 1 boss.

**Tasks:**
- Define `Run` and `BattleConfig` structures (see `10_domain_model.md`).
- Implement:
  - `startRun(): Run`
  - `advanceAfterBattle(run: Run, outcome: 'Win' | 'Loss'): Run`
- Hard-code battle sequence for MVP:
  - Enemy1 → Enemy2 → Enemy3 → Boss.

**Done when:**
- A full run can be simulated programmatically:
  - Start run.
  - Simulate 4 battles.
  - Run status transitions to Won or Lost.

---

### F2 – Reward Flow (Card Draft)

**Goal:** Let the player pick 1 of 3 cards after each non-final battle.

**Tasks:**
- Implement a function to generate reward options:
  - `generateCardRewards(deck: Deck, pool: Card[], count=3): Card[]`.
- Implement logic to:
  - Present 3 options.
  - Add chosen card to player deck (discard pile or draw pile as defined).

**Done when:**
- Reward generation is deterministic with a seeded RNG (if possible).
- Tests verify reward count and that chosen cards are added.

---

## G. UI

### G1 – Battle Screen UI

**Goal:** Provide an interactive battle screen.

**Tasks:**
- Layout:
  - Player hand display.
  - Area to indicate selected/committed cards.
  - Enemy representation (HP, name).
  - Player and enemy HP bars.
  - “Confirm Hand” button to resolve round.
- Hook UI up to combat logic:
  - On “Confirm Hand,” call combat loop and update state.

**Done when:**
- User can:
  - Select cards.
  - Confirm hand.
  - See damage and HP updates per round.
  - Complete or lose a battle.

---

### G2 – Main Menu & Run Summary

**Goal:** Basic shell around the game.

**Tasks:**
- Main menu:
  - “Start Run” button.
- Run summary:
  - On run end:
    - Show Victory/Defeat.
    - Show simple stats (battles cleared, final HP).
    - Buttons: “Return to Main Menu”, “Play Again”.

**Done when:**
- Flow: Main menu → Run → Summary → Back to main menu works.

---

### G3 – Reward Screen UI

**Goal:** Visualize and select card rewards.

**Tasks:**
- After each non-final battle:
  - Show 3 card options.
  - Allow clicking one to add it to deck.
  - Proceed to next battle.
- Display basic card info:
  - Name, rank, suit, short ability text.

**Done when:**
- Reward selection integrates with run controller and deck.

---

## H. Integration & Polish

### H1 – End-to-End Wiring

**Goal:** Connect all modules into a single playable loop.

**Tasks:**
- Initialize run and first battle when starting a run.
- Transition between:
  - Battle screen ↔ Reward screen ↔ Next battle ↔ Run summary.
- Handle restart/reset of state cleanly.

**Done when:**
- A full MVP run is playable via UI without manual intervention.

---

### H2 – Basic Logging / Debug Tools

**Goal:** Make it easier to debug and test.

**Tasks:**
- Add simple logging (console or in-game panel) for:
  - Drawn hands.
  - Evaluated poker hands.
  - Damage per round.
- Provide a toggle for debug info.

**Done when:**
- Developers can inspect round-by-round state for troubleshooting.

---

### H3 – Initial Balance Pass

**Goal:** Ensure the game is neither trivially easy nor impossible.

**Tasks:**
- Adjust:
  - HP values for player/enemy.
  - Base damage table.
  - Starting deck composition.
- Play a few runs and tweak until runs feel winnable but not guaranteed.

**Done when:**
- It is possible but non-trivial to beat the boss with reasonable play.

---

This file should be updated as tasks are added, removed, or reprioritized. When creating GitHub issues, reference the section IDs (e.g., “Task B1 – Poker Hand Evaluator”) for traceability.