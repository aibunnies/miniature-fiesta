# 00 – Overview: MVP Definition

This document summarizes the core scope for the **ANTE** MVP, based on `game_design_spec.md`. It defines what “minimum playable prototype” means so that tickets and implementation stay aligned.

---

## 1. MVP Goal

Build a **single-run, single-floor playable prototype** where:

- The player:
  - Starts with a fixed small deck (~10 cards).
  - Fights through **3 standard battles + 1 boss** in a linear sequence.
  - Uses a **poker-hand-based combat system** where each card is both:
    - A **creature** (stats, ability, level), and
    - A **playing card** (rank + suit).
- The combat loop:
  - Per battle:
    - Draws hands for both player and enemy.
    - Lets the player **select a subset** of cards to commit each round.
    - Evaluates the resulting hands as poker hands.
    - Converts hand ranks + card ranks + suits into damage and effects.
  - Repeats rounds until one side’s HP reaches 0.
- The run loop:
  - Consists of:
    - Battle 1 → Reward → Battle 2 → Reward → Battle 3 → Reward → Boss → Run end.
  - After each non-final battle, the player chooses **1 of 3 card rewards** to add to their deck.

There is **no meta-progression**, **no relic system**, and **no multi-floor map** in the MVP.

---

## 2. In-Scope for MVP

### 2.1 Core Systems

- **Card system**
  - Card as both creature and playing card.
  - Rank (2–A), suit (4 suits), level (1–3), simple abilities.
- **Deck system**
  - Draw pile, hand, discard pile.
  - Draw 5 cards each round (or up to remaining size).
  - Reshuffle discard into draw pile when empty.
- **Combat loop**
  - Turn-based, round-based.
  - Player chooses up to 5 cards to commit.
  - Enemy AI auto-selects its hand.
  - Poker evaluation decides hand rank.
  - Damage and simple suit-based effects applied simultaneously.
- **Run/battle flow**
  - Linear sequence of 4 battles (3 normal + boss).
  - Fixed enemy decks and HP per battle.

### 2.2 Content

- **Cards**
  - 15–20 unique cards across 4 suits.
  - Each with a simple, clear ability (mostly triggered by hand type or suit).
- **Enemies**
  - 3 standard enemies (different deck compositions).
  - 1 boss enemy with a slightly special rule or stronger deck.
- **Starting deck**
  - ~10 low-level cards derived from the card list.

### 2.3 UI / UX

- Minimal but functional UI:
  - Main menu (e.g., “Start Run”).
  - Battle screen:
    - Player hand display and selection.
    - Enemy area (simplified; enemy hand can be revealed after resolution).
    - HP bars for player and enemy.
    - Round progression controls (e.g., “Confirm Hand” button).
  - Reward screen:
    - Pick 1 of 3 cards after each non-final battle.
  - Run summary screen (“Victory” / “Defeat”).

---

## 3. Out of Scope for MVP

The following are explicitly **out of scope** for the MVP and should be considered for post-MVP iterations:

- **Map system**
  - No Slay-the-Spire-style node map or branching paths.
  - Battles are in a fixed linear sequence.
- **Relics**
  - No persistent passive modifiers (relics/jokers).
- **Meta-progression**
  - No currency between runs.
  - No unlockable cards, relics, or starting decks.
- **Events / Shops / Rest sites**
  - No shops, campfires, events, or card removal at MVP.
- **Ascension / difficulty modes**
  - Single difficulty setting only.
- **Advanced AI**
  - No complex AI behaviors beyond picking a strong hand.

---

## 4. Definition of “Playable” for MVP

The MVP is considered **playable** if:

1. The game can be launched and a run started from a main menu.
2. The player can:
   - Play through **at least one full battle** using the poker-based combat system.
   - See damage outcomes influenced by hand rank and suits.
   - Receive and select card rewards after battles.
3. A complete run (3 battles + boss) can be:
   - Won: player defeats the boss (enemy HP reaches 0).
   - Lost: player HP reaches 0 in any battle.
4. After the run:
   - The game shows a simple run summary screen.
   - The player can return to main menu or restart.

---

## 5. Implementation Notes

- **Technology**: Target stack should favor text-based, AI-friendly workflows (e.g., TypeScript + Vite + simple DOM/React).
- **Modularity**:
  - Poker evaluation, damage calculation, and AI hand selection should be **pure, testable modules**.
  - UI should act as a thin layer over domain logic.
- **Extensibility**:
  - Design data models and modules so that:
    - Relics can be added later.
    - Multi-floor runs and node maps can be introduced without rewriting core combat.

This document is a guiding reference for all other context files and tickets. All new features should be checked against this overview to ensure they belong in the MVP or are deferred.