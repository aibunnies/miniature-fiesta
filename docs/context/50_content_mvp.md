# 50 – Content: MVP Cards & Enemies

This document defines the **minimum content** needed for the ANTE MVP:
- 15–20 cards
- 3 standard enemies
- 1 boss
- 1 starting deck

Content here is a **specification**, not final balance. Values can be tuned during implementation.

---

## 1. Suits & Theme

We use 4 suits mapped to elements/effects:

- **Blades (Spades)** – direct damage / bleed
- **Coins (Diamonds)** – shields / gold (MVP: shields only)
- **Cups (Hearts)** – healing
- **Wings (Clubs)** – debuffs (e.g., weaken)

Cards are creatures themed around these elements.

---

## 2. MVP Card List (Draft)

Each card: `Name – Rank – Suit – Ability (Level 1)`.

### 2.1 Common Cards

1. **Goblin Skirmisher** – Rank 3 – Blades
   - Ability: *On Pair or better, +1 damage.*

2. **Blade Recruit** – Rank 4 – Blades
   - Ability: *On any hand, +1 damage if this card is committed.*

3. **Coin Sentry** – Rank 3 – Coins
   - Ability: *On Pair or better, gain 1 shield this round.*

4. **Camp Healer** – Rank 3 – Cups
   - Ability: *On Flush or better, heal 2 HP.*

5. **Winged Scout** – Rank 4 – Wings
   - Ability: *On Straight or better, apply Weaken (−1 enemy damage next round).* 

6. **Shielded Acolyte** – Rank 5 – Coins
   - Ability: *When committed, gain 1 shield (stackable).* 

7. **Battle Cleric** – Rank 5 – Cups
   - Ability: *On Pair or better, heal 1 HP.*

8. **Poison Imp** – Rank 5 – Wings
   - Ability: *On Three of a Kind or better, apply Bleed 1 for 2 rounds.*

9. **Blade Adept** – Rank 6 – Blades
   - Ability: *On straight or better, +2 damage.*

10. **Coin Hoarder** – Rank 2 – Coins
    - Ability: *On any hand, gain 1 temporary shield (MVP: no gold yet).* 

### 2.2 Uncommon / Stronger Cards

11. **Veteran Duelist** – Rank 7 – Blades
    - Ability: *On any hand, +2 damage if this card is committed.*

12. **Guardian Statue** – Rank 7 – Coins
    - Ability: *On Flush, gain 3 shield.*

13. **Chalice Priest** – Rank 8 – Cups
    - Ability: *On Pair or better, heal 2 HP.*

14. **Storm Harpy** – Rank 8 – Wings
    - Ability: *On Flush, apply Weaken 2 (−2 damage next round).* 

15. **Royal Champion** – Rank 10 – Blades
    - Ability: *On Full House or better, +4 damage.*

16. **Golden Knight** – Rank 9 – Coins
    - Ability: *On Straight or better, gain 2 shield.*

17. **Sainted Guardian** – Rank 9 – Cups
    - Ability: *On any hand, heal 1 HP (stackable).* 

18. **Skymarch General** – Rank 9 – Wings
    - Ability: *On Four of a Kind or better, apply Bleed 2.*

MVP can implement a subset (15–18 cards). Additional cards can be added later as balance requires.

---

## 3. Starting Deck (MVP)

Goal: simple, slightly weak deck that can still form Pairs and occasional Straights/Flushes.

**Suggested 10-card starting deck:**

- 2 × Goblin Skirmisher (Rank 3, Blades)
- 2 × Coin Sentry (Rank 3, Coins)
- 2 × Camp Healer (Rank 3, Cups)
- 2 × Winged Scout (Rank 4, Wings)
- 1 × Blade Recruit (Rank 4, Blades)
- 1 × Battle Cleric (Rank 5, Cups)

This mix:
- Provides duplicates for early Pairs.
- Spreads suits fairly evenly.
- Has simple abilities that showcase suit and hand interactions.

`createStartingDeck()` should assemble this deck by card IDs.

---

## 4. Enemies (MVP)

We need:
- 3 standard enemies.
- 1 boss.

### 4.1 Enemy 1 – Training Dummy (Grinder)

- **Profile**: Grinder
- **HP**: 20
- **Deck (example):**
  - 2 × Goblin Skirmisher (3, Blades)
  - 2 × Coin Sentry (3, Coins)
  - 2 × Camp Healer (3, Cups)
  - 2 × Winged Scout (4, Wings)
  - 1 × Blade Recruit (4, Blades)
  - 1 × Battle Cleric (5, Cups)

Purpose: Intro fight, similar power to starting deck.

### 4.2 Enemy 2 – Coin Collector (SuitSpecialist: Coins)

- **Profile**: SuitSpecialist
- **HP**: 25
- **Deck (example):**
  - 3 × Coin Sentry (3, Coins)
  - 2 × Shielded Acolyte (5, Coins)
  - 2 × Golden Knight (9, Coins)
  - 1 × Camp Healer (3, Cups)
  - 1 × Battle Cleric (5, Cups)
  - 1 × Goblin Skirmisher (3, Blades)

Purpose: Teaches player about suit-stacking and shields.

### 4.3 Enemy 3 – Wild Gambler (Gambler)

- **Profile**: Gambler
- **HP**: 28
- **Deck (example):**
  - 2 × Poison Imp (5, Wings)
  - 2 × Battle Cleric (5, Cups)
  - 2 × Blade Adept (6, Blades)
  - 2 × Golden Knight (9, Coins)
  - 2 × Storm Harpy (8, Wings)

Purpose: Shows higher-variance hands and stronger abilities.

### 4.4 Boss – Arena Champion

- **Profile**: Boss
- **HP**: 35
- **Deck (example):**
  - 2 × Veteran Duelist (7, Blades)
  - 2 × Golden Knight (9, Coins)
  - 2 × Chalice Priest (8, Cups)
  - 2 × Storm Harpy (8, Wings)
  - 1 × Royal Champion (10, Blades)
  - 1 × Skymarch General (9, Wings)

Boss behavior is still the same AI, but:
- Higher ranks.
- Stronger abilities.
- More HP.

---

## 5. Run Configuration (MVP)

Define a single floor as a **linear sequence**:

1. Battle vs Training Dummy
2. Battle vs Coin Collector
3. Battle vs Wild Gambler
4. Boss battle vs Arena Champion

`runs.ts` should provide a `defaultRunConfig` listing these enemies by ID.

---

## 6. Implementation Notes

- Card and enemy definitions should live in `src/content/cards.ts` and `src/content/enemies.ts`.
- Use IDs for referencing cards/enemies (e.g., `"goblin_skirmisher"`, `"arena_champion"`).
- Keep numbers easy to tweak; expect a balance pass after first playable build.

This file should be updated when cards or enemies are added/removed or significantly rebalanced.