# 60 – UI Flows (2D Game)

This document describes the user-facing screens, interactions, and navigation flow for the ANTE MVP as a 2D browser game with simple graphics.

It is the bridge between domain/logic and the visual layer.

---

## 1. Screens Overview

MVP screens:

1. **Main Menu**
2. **Battle Screen**
3. **Reward Screen**
4. **Run Summary Screen**

Each screen is a React (or equivalent) component driven by game state.

---

## 2. Main Menu

### 2.1 Layout

- Centered title: `ANTE` (or working title).
- Subtitle: short description (e.g., "Roguelite poker battler").
- Buttons:
  - `Start Run`
  - (Optional) `How to Play` (can be a simple overlay/modal).

### 2.2 Behavior

- Clicking **Start Run**:
  - Calls `startRun()` in game state:
    - Initializes player with starting deck and HP.
    - Initializes run config (sequence of enemies).
    - Creates first battle.
  - Switches `currentScreen` to `Battle`.

---

## 3. Battle Screen

The Battle Screen is the core 2D view where rounds are played.

### 3.1 Layout

**Top Area (Enemy):**
- Enemy name text (e.g., "Arena Champion").
- Enemy icon/sprite (simple image).
- Enemy HP bar:
  - Visual bar + numeric (e.g., `28 / 35`).

**Middle Area (Round Info):**
- Round number display: `Round N`.
- Last round result summary (optional):
  - e.g., `You: Full House (20 dmg) | Enemy: Straight (16 dmg)`.
- Status/effect icons (e.g., shield, bleed) with simple tooltips.

**Bottom Area (Player):**

- **Player HP bar** (left):
  - Bar + numeric (e.g., `22 / 25`).

- **Player Hand** (center):
  - Row of card slots showing current `hand`.
  - Each card rendered with:
    - Rank + suit icon.
    - Card name.
    - Small ability icon or short text.
  - Cards are **clickable**:
    - Clicking toggles between `unselected` and `selected` (committed).
    - Selected cards are visually highlighted (e.g., raised position, border).

- **Committed Hand Indicator** (optional separate row):
  - Either:
    - Separate row where selected cards appear, or
    - Visual style difference on selected cards in the hand row.

- **Controls** (bottom right):
  - `Confirm Hand` button:
    - Enabled if at least 1 card is selected.
    - Disabled otherwise.
  - (Optional) `End Run` or `Quit` for debug/testing.

### 3.2 Interaction Flow (Round)

1. **Round Start**
   - Battle state triggers draw phase.
   - UI displays the new hand; all cards start unselected.

2. **Card Selection**
   - Player clicks cards to select up to 5 committed cards.
   - Selected cards show highlight.
   - UI shows small text like `Selected: 3/5`.

3. **Confirm Hand**
   - Player clicks `Confirm Hand`.
   - UI:
     - Disables further selection until resolution completes.
   - Logic:
     - Calls `playRound(battleState, selectedCardIDs)`.
     - Receives `RoundOutcome`.

4. **Resolution Visualization**
   - Show both hands' ranks:
     - e.g., `You: Pair of 7s`, `Enemy: Straight to 9`.
   - Apply visual feedback:
     - Enemy HP bar decreases with a brief animation.
     - Player HP bar decreases if enemy dealt damage.
     - Floating text (e.g., `-7 HP`, `+2 HP`) near bars.
     - Suit effects:
       - Shield: small shield icon appears.
       - Heal: green HP bar flash.
       - Weaken/Bleed: icon near enemy.

5. **Post-Round**
   - If both sides still alive:
     - Brief pause, then next round starts (back to card selection with new hand).
   - If battle ended:
     - If player wins and this is not the final battle:
       - Transition to **Reward Screen**.
     - If player wins and this is the final battle:
       - Transition to **Run Summary** (Victory).
     - If player loses:
       - Transition to **Run Summary** (Defeat).

---

## 4. Reward Screen

### 4.1 Layout

- Title: `Choose Your Reward`.
- Three card panels displayed horizontally, each showing:
  - Card name.
  - Rank & suit.
  - Ability summary.
  - Suit color/icon background.
- Brief text: `Pick 1 of 3 cards to add to your deck.`
- Button: `Skip` (optional; MVP may force a choice).

### 4.2 Behavior

- On entry:
  - Game state generates 3 candidate cards (via `generateCardRewards`).
  - UI renders them.

- Interaction:
  - Player clicks one card:
    - Selected card is visually highlighted.
    - Confirmation either:
      - Immediate (on click): adds card to deck and proceeds, or
      - Two-step: click to select, then click `Continue`.

- On confirmation:
  - Logic:
    - Adds chosen card to player deck (e.g., discard pile).
    - Advances `runState` to next battle.
  - UI:
    - Transition back to **Battle Screen** with new enemy.

---

## 5. Run Summary Screen

### 5.1 Layout

- Large result text:
  - `Victory!` (if player beat boss), or
  - `Defeat` (if player died).
- Summary details:
  - Floors/Battles cleared (e.g., `Battles cleared: 3/4`).
  - Optional: final deck size, number of rounds played.

- Buttons:
  - `Play Again` (starts a fresh run immediately).
  - `Main Menu` (returns to main menu screen).

### 5.2 Behavior

- **Play Again**:
  - Resets run and player/battle state.
  - Starts a new run (equivalent to Main Menu → Start Run).

- **Main Menu**:
  - Resets state to title screen.

---

## 6. Global Navigation Flow

State machine for `currentScreen`:

1. `MainMenu`
   - `Start Run` → `Battle`

2. `Battle`
   - Win & not final battle → `Reward`
   - Win & final battle → `RunSummary`
   - Loss → `RunSummary`

3. `Reward`
   - After selecting reward → `Battle` (next enemy)

4. `RunSummary`
   - `Play Again` → `Battle` (via new run init)
   - `Main Menu` → `MainMenu`

All transitions should be done via a centralized state/update function or reducer, not arbitrary component-level navigation.

---

## 7. Visual Style Guidelines (MVP)

- **Cards**:
  - Rectangular, minimal design.
  - Background color per suit:
    - Blades: dark/blue.
    - Coins: gold/yellow.
    - Cups: red.
    - Wings: green.
  - Rank and suit text prominent; name and ability in smaller text.

- **Feedback**:
  - Use color and simple animations to communicate:
    - Damage: HP bar shrinks + red flash.
    - Heal: HP bar grows + green flash.
    - Shield: overlay a small shield icon.

- **Accessibility**:
  - Use both color and icons for suits (avoid color-only differentiation).

---

## 8. Error / Edge Cases

- If deck runs out of cards:
  - Ensure reshuffle logic has run before UI tries to render empty hands.
- If player tries to confirm with 0 cards selected:
  - Button stays disabled and optional tooltip explains: `Select at least 1 card.`
- If any state desync occurs (e.g., unexpected null battle):
  - MVP may show a simple error overlay; for dev use only.

---

This document should guide front-end implementation of the 2D UI. Any significant UX changes (new screens, different flows) should be reflected here.