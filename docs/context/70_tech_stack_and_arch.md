
# 70 – Tech Stack & Architecture (2D Browser Game)

This document defines the tech stack and high-level architecture for the ANTE MVP as a **2D browser game with simple graphics**, not a text-only prototype.

The goals are:
- Visual, interactive 2D presentation (cards, HP bars, simple effects).
- Text-based, AI-friendly code and assets (no heavy binary scene files).
- Clear separation between domain logic and UI.

---

## 1. Tech Stack

### 1.1 Platform

- **Target**: Web browser (desktop, latest Chrome/Firefox/Edge).
- **Rendering**: HTML/CSS layout + simple SVG/Canvas where helpful.
- **Resolution**: Fixed logical resolution for UI layout (e.g., 1280×720), responsive scaling optional but not required for MVP.

### 1.2 Core Tools

- **Language**: TypeScript
- **Bundler/Dev Server**: Vite
- **UI Layer**: React (or minimal component abstraction) – recommended for:
  - Reusable card components.
  - Screen/state management.
- **Styling**: CSS modules or simple CSS-in-JS (keep it lightweight).

> If you prefer no React, plain TypeScript + Vite + DOM APIs also works; the architecture below still applies.

### 1.3 Testing

- **Test runner**: Vitest (or Jest).
- **Focus**: domain/logic modules (poker, combat, deck handling).

---

## 2. High-Level Architecture

Organize `src/` to separate pure game logic from rendering:

```text
src/
  domain/
    card.ts
    deck.ts
    player.ts
    enemy.ts
    battle.ts
    run.ts
    types.ts
  logic/
    pokerEvaluator.ts
    handComparison.ts
    damageCalculator.ts
    combatLoop.ts
    enemyAI.ts
    suitEffects.ts
  content/
    cards.ts
    enemies.ts
    runs.ts
  ui/
    components/
      BattleScreen.tsx
      HandView.tsx
      CardView.tsx
      HPBar.tsx
      RewardScreen.tsx
      MainMenu.tsx
      RunSummaryScreen.tsx
    hooks/
      useGameState.ts
  state/
    gameState.ts
    battleState.ts
    runState.ts
  assets/
    cards/
    icons/
  main.tsx
```

### 2.1 Domain Layer (`src/domain`)

- Contains **pure data models** and basic operations:
  - Card, Deck, Player, Enemy, Battle, Run types.
- No references to React, DOM, or browser APIs.
- All combat rules should be invocable via functions that operate on these types.

### 2.2 Logic Layer (`src/logic`)

- Implements core game rules:
  - Poker hand evaluation and comparison.
  - Damage calculation.
  - Turn/round combat loop.
  - Enemy AI selection.
  - Suit/element effects.
- All logic functions should be pure or side-effect minimal:
  - Inputs: domain types and simple parameters.
  - Outputs: new domain state or computed results.

This layer is highly testable and does not know about UI.

### 2.3 Content Layer (`src/content`)

- Static/data-driven definitions:
  - Card list for MVP (15–20 cards).
  - Enemy templates (3 standard + 1 boss).
  - Run configuration (sequence of battles).
- Represented as plain data structures (arrays/objects), not hard-coded in logic.

---

## 3. UI / 2D Presentation

The game is a **2D card battler** displayed using standard web layout.

### 3.1 Screen Structure

- **Main Menu**
  - Simple background, title text, “Start Run” button.
- **Battle Screen**
  - Player area:
    - Row of card “slots” for current hand.
    - Clickable cards: clicking toggles selection (committed vs uncommitted).
    - Separate row (or highlight) for committed cards.
  - Enemy area:
    - Enemy name and icon/sprite.
    - Enemy HP bar.
    - Optional face-down card backs; reveal moment during resolution.
  - Center info:
    - Round number.
    - Hand rank summaries after resolution (e.g., “You: Full House – Enemy: Straight”).
  - Controls:
    - “Confirm Hand” button to resolve round.
- **Reward Screen**
  - Three large card panels laid out horizontally.
  - Click one to add to deck; “Continue” advances to next battle.
- **Run Summary**
  - Victory/Defeat message.
  - Simple stats (battles cleared).
  - Buttons: “Play Again”, “Main Menu”.

### 3.2 Graphics / Assets

- **Cards**
  - Render as rectangles with:
    - Rank and suit text (e.g., “7 of Blades”).
    - Suit icon (simple SVG or emoji-like).
    - Name (e.g., “Goblin Skirmisher”).
    - Background color per suit (e.g., blue for Blades, gold for Coins).
- **Enemy**
  - Simple static sprite or icon per enemy.
  - Can be placeholder PNG/SVG rectangles for MVP.
- **Effects**
  - CSS transitions for:
    - Card selection highlight.
    - Damage feedback:
      - HP bar shake or color flash.
      - Simple text: “-5 HP” floating briefly.

The emphasis is on **clarity** over heavy art; visuals should communicate state at a glance.

---

## 4. State Management

### 4.1 Global Game State

- Use a single top-level React component (or simple store) for:
  - `currentScreen: 'MainMenu' | 'Battle' | 'Reward' | 'Summary'`
  - `runState: RunState`
  - `battleState: BattleState`
- Provide hooks:
  - `useGameState` to access and modify state from screens.
- Keep state mutations centralized:
  - For example, a `gameReducer` or explicit functions like:
    - `startRun()`
    - `startNextBattle()`
    - `applyBattleOutcome()`
    - `generateRewards()`
    - `applyRewardSelection()`

### 4.2 Separation of Concerns

- UI components:
  - Should **not** re-implement game rules.
  - Call domain/logic functions to:
    - Evaluate hands.
    - Resolve rounds.
    - Progress runs.
- Domain/logic:
  - Should not import UI components or depend on React.

---

## 5. Event Flow (End-to-End)

This ties together domain logic, UI, and state:

1. **Main Menu**
   - User clicks “Start Run”.
   - `startRun()` initializes `runState`, `battleState`, and player deck (starting deck).
   - Navigate to Battle screen.

2. **Battle Screen**
   - On load:
     - Uses combat loop to draw initial hands.
   - Player:
     - Clicks cards to commit for the round.
     - Clicks “Confirm Hand”.
   - Code path:
     - UI collects selected card IDs.
     - Calls `nextRound(battleState, selectedCards)` from `logic/combatLoop`.
     - Receives `BattleOutcome`, updates `battleState` and `runState`.
   - UI:
     - Animates damage.
     - Updates HP bars.
     - If battle finished:
       - If last battle: navigate to Summary.
       - Else: navigate to Reward screen.

3. **Reward Screen**
   - On entry:
     - Calls `generateCardRewards()`.
     - Displays 3 cards.
   - Player:
     - Clicks one; handler calls `addCardToDeck()` in domain/logic.
     - Moves back to Battle screen with next enemy.

4. **Run Summary**
   - Display result and simple stats.
   - Buttons:
     - “Play Again”: re-run `startRun()`.
     - “Main Menu”: reset state and go back.

---

## 6. Dev & Build Workflow

### 6.1 Dev Commands (suggested)

- `npm run dev` – start Vite dev server.
- `npm run test` – run unit tests (Vitest).
- `npm run build` – production build.
- `npm run preview` – preview production build.

### 6.2 Coding Conventions

- Domain & logic modules:
  - Prefer pure functions.
  - Avoid global mutable state.
- UI:
  - Small, focused components.
  - Prop-driven, minimal local state that mirrors domain state.
- File naming:
  - `PascalCase` for components, `camelCase` for functions.
  - Group related logic (e.g., `pokerEvaluator.ts` with `evaluatePokerHand`, `compareHands`).

---

## 7. Future Extensions (Post-MVP)

Design the architecture so these can be added later without major changes:

- **Relics/Jokers**
  - Additional content modules and modifiers that hook into damage calculation or hand evaluation.
- **Map / Node-based Floors**
  - Separate `mapState` and UI screen; keep combat loop unchanged.
- **Animations & Juice**
  - Replace simple CSS transitions with more polished animation libraries if desired.

---

This document should be updated if:
- The stack changes (e.g., dropping React).
- Major structural decisions are made (new state library, different rendering approach).

For now, it defines the baseline: **2D browser game with simple graphics**, TypeScript + Vite, clean separation of domain logic and UI.