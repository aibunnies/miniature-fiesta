# GAME DESIGN SPEC (Working Title: "ANTE" — rename freely)

**Genre:** Roguelite Deckbuilder / Auto-Battler Hybrid
**Combat Resolution:** Poker Hands
**Perspective:** Single-player, Player vs. Computer
**Status:** Draft v1 — design doc only (no engine/architecture decisions locked in)

---

## 1. High Concept

You build a deck of creature-cards. Every card is simultaneously **a creature** (with stats and an ability) **and a playing card** (rank + suit). Each combat round, you draw a hand, choose which cards to commit to battle, and the **poker hand you form** (pair, straight, flush, full house, etc.) determines the strength and elemental effect of your attack. The enemy does the same from its own deck. Between fights, you draft new cards, spend gold in shops, and merge duplicate cards to level them up (Super Auto Pets–style). Die, and you start a new run with some permanent meta-progression unlocked.

**The pitch in one line:** *Balatro's hand-scoring tension, meets Super Auto Pets' merge-and-level economy, meets a dungeon-crawler's floor-by-floor escalation.*

---

## 2. Inspirations & What We're Borrowing

| Inspiration | What we take from it |
|---|---|
| **Balatro** | Poker hands as the core scoring/combat mechanic; hand-modifying jokers/relics; escalating stakes |
| **Super Auto Pets** | Merging duplicate units to level them up; creatures with passive triggered abilities; simple drag-and-position board |
| **Slay the Spire** | Node-based floor map, elites, bosses, run-based roguelite structure, relics |
| **Dice of Kalma** (as I understand it — flag if this is wrong) | Escalating-stakes combat where committing more resources raises risk/reward; I'm treating this as "you can push your luck by drawing more or holding weaker cards for a bigger hand." Correct me if you meant something more specific and I'll adjust Section 4. |

---

## 3. Core Gameplay Loop

**Meta-loop (one full run):**

1. Start a run with a small starting deck (~10 cards).
2. Descend through a **map of floors**. Each floor is a branching node map (like Slay the Spire) with:
   - Standard Battles
   - 1 Elite Battle (optional, higher risk/reward)
   - Shop
   - Rest/Camp (heal or upgrade)
   - Event (random narrative choice)
   - Floor Boss (mandatory, ends the floor)
3. After each battle: choose a card reward (draft 1 of 3), gain gold.
4. In shops: buy new cards, remove unwanted cards, buy relics, **merge duplicate cards to level them up**.
5. Reach the boss, beat it, descend to the next floor. Enemies get stronger and new enemy types appear.
6. Run ends on death (permadeath) or on clearing the final floor.
7. On run end: earn meta-currency to unlock new cards/relics/starting options for future runs.

**Battle-loop (one fight):**

1. Both sides start at full HP for the fight (or carry HP between fights within a floor — decide during playtesting).
2. Each round: both player and enemy draw a hand of cards from their own deck.
3. Player chooses which cards to commit as their "played hand" (see Section 4).
4. Enemy AI does the same automatically.
5. Hands are revealed and resolved simultaneously — damage, healing, and status effects apply based on hand rank + suit.
6. Repeat rounds until one side's HP hits 0.

---

## 4. Combat System (the core mechanic)

### 4.1 Cards are creatures AND playing cards
Every card has:
- **Name & art** (e.g., "Goblin Skirmisher")
- **Rank** (2–A) — determines base power contribution
- **Suit** (one of 4) — determines elemental/status effect
- **Ability** — a passive or triggered effect (Auto Pets–style), e.g. "When played in a Pair or better, deal +2 damage" or "On Flush, heal 3 HP to your whole hand"
- **Level** (1–3) — gained by merging duplicates, boosts stats and can add a bonus clause to the ability

Suggested suit-to-effect mapping (placeholder, tune freely):
| Suit | Element/Effect |
|---|---|
| Blades (Spades) | Direct damage / bleed |
| Coins (Diamonds) | Gold generation / shield |
| Cups (Hearts) | Healing / regeneration |
| Wings (Clubs) | Status effects (poison, stun, weaken) |

### 4.2 Turn structure
1. **Draw:** Both sides draw 5 cards from their deck (deck reshuffles from discard when empty).
2. **Build:** Player selects up to 5 cards from hand to commit as their "played hand" this round. (Optionally allow choosing fewer than 5 — a smaller, cleaner hand vs. a bigger, riskier one — this is where the "push your luck" tension lives.)
3. **Reveal:** Both hands are revealed simultaneously.
4. **Score:** Each hand is evaluated using standard poker hand rankings, low to high:
   - High Card → Pair → Two Pair → Three of a Kind → Straight → Flush → Full House → Four of a Kind → Straight Flush → Royal Flush
5. **Resolve:** Hand rank determines base damage dealt (a fixed damage table, tunable), modified by:
   - Sum/average of committed cards' rank (higher cards = more base power)
   - Suit majority in the hand (triggers the elemental effect at a strength based on how many cards share that suit)
   - Any individual card abilities that trigger on hand type (e.g., "on Three of a Kind, apply Poison")
6. **Discard:** Uncommitted and played cards go to discard pile; redraw next round.

### 4.3 Enemy AI
Enemies also draw from and play from a defined deck (usually smaller/simpler than the player's), and an AI routine selects the best available hand from its draw each round — so fights are a genuine "whose hand is better" duel, not just a damage race. Early enemies can have small, predictable decks (easy to read); later enemies get bigger decks and smarter hand-selection to feel more threatening.

### 4.4 Open combat questions to resolve during prototyping
- Does a higher-ranked hand simply deal more damage, or does the *loser* of the round take extra damage / get no effect (a true "duel")?
- Can players discard and redraw once per round (like Balatro's discards)?
- Is HP shared across the whole floor, or refreshed each battle?

---

## 5. Deckbuilding System

- **Starting deck:** ~10 low-rank, low-ability cards across all 4 suits — enough variety to form basic hands (pairs, occasional straights).
- **Card rewards:** After each battle, draft 1 of 3 randomly offered cards (rarity-weighted).
- **Card rarities:** Common / Uncommon / Rare / Boss-exclusive — rarer cards have stronger abilities or synergize with specific hand types.
- **Deck thinning:** Shops let you pay gold to remove a card — critical in a poker-hand game, since a bloated deck makes it harder to draw the ranks/suits you need.
- **Card upgrades:** Shops (or a rest-site option) let you upgrade a single copy of a card directly, separate from merging duplicates.

---

## 6. Leveling / Merge System (Super Auto Pets–style)

- Owning **two copies of the exact same card** (same name, rank, suit) lets you **merge them into one Level 2 copy** — stronger stats, and often an upgraded/added ability clause.
- Merging three total copies (or a Lv2 + a new copy) → **Level 3**, the max, with a further stat/ability boost.
- This creates a resource-management layer: do you draft a new, different card for variety, or hope for a duplicate to level up a card you already love?
- Leveled cards keep their original rank and suit for poker-hand purposes — a Lv2 "7 of Blades" is still a 7 of the Blades suit — but hits harder and its ability may trigger more often or more strongly.

---

## 7. Floors & Enemies

- Each floor = a branching node map with **X standard battles** (suggest 3–4), **1 optional Elite**, and **1 mandatory Boss**.
- Each floor introduces **new enemy archetypes** and increases baseline enemy stats/deck size.
- Suggested enemy archetype categories:
  - **Grinders** — small decks, low variance, reliably form Pairs/Two Pair.
  - **Gamblers** — big decks, wild swings, occasionally slam a Full House or better.
  - **Suit-specialists** — heavily weighted toward one suit, so they reliably trigger one elemental effect (predictable but strong).
  - **Bosses** — unique decks, unique abilities that break the normal rules (e.g., "This boss's hand always counts Straights as Flushes").
- Floor bosses should teach or test a specific combat idea (e.g., a boss that punishes over-committing to a hand, forcing you to learn the "smaller, safer hand" option).

---

## 8. Roguelite Meta-Progression

- **Permadeath:** losing a run ends it; you restart from the beginning of the map.
- **Meta-currency:** earned per run (based on floor reached, bosses beaten, etc.), spent between runs to:
  - Unlock new cards into the draft pool
  - Unlock new relics
  - Unlock new starting-deck options / starting classes (if you want build-defining starts)
  - Unlock harder difficulty tiers (see below)
- **Ascension/ordeal system (optional, post-launch):** once a player beats the game once, unlock stacking modifiers that raise difficulty for a bigger meta-currency payout, à la Slay the Spire's Ascension.

---

## 9. Economy & Relics

- **Gold:** earned from battles and events; spent on card drafts (bonus buys), card removal, upgrades, and relics.
- **Relics:** passive, run-long modifiers, e.g.:
  - "Two Pair hands deal +50% damage"
  - "Your Cups-suit cards heal 1 extra HP"
  - "Once per battle, redraw your entire hand for free"
- Relics are the main lever for build diversity/synergy across a run, separate from the deck itself.

---

## 10. MVP Feature Checklist

**Must-have for a playable prototype:**
- [ ] Core hand-draw → commit → reveal → resolve combat loop, player vs. one enemy
- [ ] Poker hand evaluator (pair through straight flush at minimum)
- [ ] 15–20 unique cards across 4 suits
- [ ] Basic enemy AI that picks its best available hand
- [ ] 1 floor, 3 battles + 1 boss
- [ ] Card reward screen after battles
- [ ] Basic merge/level-up for duplicate cards

**Nice-to-have (post-MVP):**
- [ ] Full node map with shops, rest sites, events
- [ ] Relic system
- [ ] Meta-progression/unlocks between runs
- [ ] Multiple floors with scaling difficulty
- [ ] Elite battles

**Stretch:**
- [ ] Ascension/difficulty modifiers
- [ ] Multiple starting "classes"/decks
- [ ] Daily challenge runs / seeded runs

---

## 11. Open Design Questions
1. Does hand rank alone decide the winner of a round, or does raw damage also scale with card ranks/level?
2. Is HP per-battle or shared across a whole floor?
3. How many cards can be committed to a hand — always aiming for 5, or can you play fewer for a smaller/safer hand?
4. Should losing a round have a penalty beyond "you dealt less damage" (e.g., you also take some damage back)?
5. What's the intended run length — 15 minutes, 45 minutes, longer?

---

## 12. Appendix: Recommended Toolkit (VS Code, agentic-AI-friendly)

Since you're building this with agentic AI in VS Code, the biggest factor isn't engine power — it's how well the codebase is something an AI agent can read, edit, and reason about via text. That favors **plain code over binary editor/scene files**.

**Recommendation: TypeScript + Vite, rendered with HTML/CSS/DOM (or a lightweight canvas library like Pixi.js if you want more visual flair).**
- Everything is plain text — cards, decks, combat logic, and UI are all readable/editable by an AI agent without opening a GUI editor.
- A card game like this is mostly UI/state management, not physics or 3D rendering, so you don't need Unity/Godot's engine overhead.
- Runs in the browser, easy to test/share builds instantly.
- Great git diffs, easy for an AI agent to make small, targeted, reviewable changes.

**Alternative: Godot (GDScript).** A legitimate second choice if you want "a real game engine" with a scene/node system, native builds, and more built-in animation/audio tooling. The tradeoff: scenes are stored in `.tscn` files that are only semi-human/AI-editable, so agentic changes are a bit clunkier than a pure-code stack. Still very workable, and Godot has good VS Code integration via extension.

*Not recommending Unity here* — C# + Unity's scene/prefab system is heavier for a small solo/AI-assisted project and doesn't buy you much a browser-based 2D card game needs.

---

*This is a v1 draft. Happy to expand any section (e.g., a full damage-table spreadsheet, a sample enemy roster, or wireframes for the battle screen) — just point at what you want deepened next.*
