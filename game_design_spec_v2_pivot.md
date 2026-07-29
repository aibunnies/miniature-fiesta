# GAME DESIGN SPEC v2 — "Poker Auto-Battler" Pivot

**Genre:** Auto-Battler Roguelite (Super Auto Pets structure)
**Combat Resolution:** Poker Hand Showdown
**Perspective:** Single-player, Player vs. Computer
**Status:** v2 — replaces v1. Deliberately simplified: this spec mirrors Super Auto Pets' exact game loop, with poker cards standing in for pets.

---

## 1. High Concept

You have **5 hand slots**. Each round you get gold, **roll a shop** to see available cards, **buy cards into your slots**, and **combine duplicates to level them up** — exactly like Super Auto Pets. The difference: instead of building a synergistic pet team, your goal is to arrange your 5 slots into **the strongest possible poker hand**. Each round, your 5-card hand is compared against a computer-controlled hand in a showdown; the better hand wins, and the loser takes damage. Survive rounds, climb floors, don't run out of health.

---

## 2. Core Loop (directly mirrors Super Auto Pets)

Each round has two phases:

### Phase A — Shop Phase
- You're given gold (fixed amount per round, e.g. 10).
- The shop shows a set number of cards for sale (e.g. 5 slots).
- You can, in any order, spending gold as you go:
  - **Buy** a card from the shop into one of your 5 board slots (cost e.g. 3 gold)
  - **Sell** a card from your board back for gold
  - **Reroll** the shop for a new set of offerings (cost e.g. 1 gold)
  - **Freeze** a shop card so it's still there after a reroll
  - **Combine** two copies of the identical card (same rank + suit) sitting across your board/shop into one leveled-up card
- Phase ends when you choose "Ready" or run out of gold/actions.

### Phase B — Combat Phase
- Your 5 board slots = your poker hand.
- The computer opponent (this round's enemy) reveals its own 5-card hand.
- Both hands are scored using standard poker rankings (High Card → Royal Flush).
- **Higher-ranked hand wins the round.** The loser takes damage (see Section 5).
- Both players/opponent keep their boards between rounds (persistent, like SAP) — you're continuing to build the same hand across the whole run, not starting fresh each round.

Repeat: Shop Phase → Combat Phase → Shop Phase → ... until you or the run ends.

---

## 3. The Board = 5 Slots

- You always have exactly 5 slots (no more, no less — matches "always aiming for a 5-card poker hand").
- A slot is either empty or holds one card.
- Cards can be reordered/rearranged for free at any time (order doesn't matter for poker scoring, but may matter if we add positional abilities later — see Section 7).

---

## 4. Shop, Rerolling, Combining (the SAP economy, unchanged)

- **Gold per round:** fixed base amount, increasing slightly as the run progresses (e.g. round 1 = 10 gold, +1 per round, similar to SAP's gold curve).
- **Reroll cost:** small flat cost (e.g. 1 gold), unlimited rerolls per turn as long as you can pay.
- **Freeze:** lets you lock a specific shop card so it doesn't disappear on reroll — critical for hunting duplicates.
- **Buy cost:** flat cost per card (e.g. 3 gold), independent of rank/suit, so there's no "pay more for a better card" — the game skill is in reroll-and-freeze discipline, exactly like SAP.
- **Combining/Leveling:**
  - 2 copies of the same card (same rank + same suit) → combine into **Level 2** (bigger contribution to the poker hand's power — see Section 6).
  - 2 Level-2s (i.e. 4 total copies) or a Level 2 + a matching copy → combine into **Level 3** (max level).
  - Combining frees up a board slot, since two cards become one — this is the main incentive to combine rather than just buy more distinct cards.
- **Selling:** sell any board card back for partial gold refund, to fund rerolls or free up a slot.

---

## 5. Combat Resolution

- Standard poker hand rankings decide the winner each round: High Card < Pair < Two Pair < Three of a Kind < Straight < Flush < Full House < Four of a Kind < Straight Flush < Royal Flush.
- **The computer's hand is hidden** until the showdown — no scouting the opponent's board during the shop phase. It is auto-generated each round (scaled to difficulty), not built through a simulated shop.
- **Damage Table** — the loser takes damage based on the tier of the *winning* hand. Damage escalates faster at the top end, since those hands are rarer and should feel devastating when they land:

| Hand | Damage |
|---|---|
| High Card | 1 |
| Pair | 2 |
| Two Pair | 3 |
| Three of a Kind | 4 |
| Straight | 6 |
| Flush | 7 |
| Full House | 9 |
| Four of a Kind | 12 |
| Straight Flush | 16 |
| Royal Flush | 20 |

- **Ties:** if both hands land on the same tier (e.g. both have a Pair), break it with standard poker tiebreak rules (higher pair, then kickers). If still tied after full tiebreak, the round is a draw — no damage either way.
- **Win/lose either way, you advance:** whether you win or lose the round, you proceed to the next round's shop phase and next opponent — a loss just costs HP, it doesn't repeat the fight. This matches SAP's "every round happens regardless" flow.

### Health Plan

- **Player starts each run with 30 HP.** The run ends when this hits 0.
- Opponents don't carry their own persistent HP — each is a single showdown per round. Winning clears that opponent; losing costs you HP from the table above.
- **Difficulty curve is expressed through opponent hand strength, not opponent HP:**
  - Early rounds: opponents typically produce Pair/Two Pair-level hands (1–3 dmg on a loss) — forgiving.
  - Mid rounds: opponents shift toward Straight/Flush/Full House-level hands (6–9 dmg on a loss) — losses start to really hurt.
  - Late/boss rounds: opponents can produce Four of a Kind or better (12–20 dmg) — a single bad round here can be close to lethal.
- At 30 HP, a player who's consistently losing small (High Card/Pair losses) can absorb roughly 10–15 early losses, but only 2–3 late-game blowout losses — this alone creates a natural difficulty ramp without needing extra systems.

---

## 6. Card Anatomy & Leveling

Each card has:
- **Rank** (2–A)
- **Suit** (Hearts/Diamonds/Clubs/Spades — standard, no reflavoring needed for this simpler version)
- **Level** (1–3, from combining)

What leveling does (pick one approach to prototype first, simplest listed first):
- **Option A (simplest):** Leveling is purely a slot-efficiency tool — a Level 2 card just represents "this card, but it now only takes 1 slot instead of needing 2 copies to matter," with no extra combat effect. All the power comes purely from the poker hand you've assembled.
- **Option B (SAP-flavored):** Leveled cards get a small bonus, e.g. a Level 2/3 card counts as an extra "wild" card that can also match an adjacent rank or suit for straight/flush purposes, or adds a small flat bonus to that round's damage tier.
- Recommend prototyping Option A first — it's the true MVP and keeps the game exactly as simple as SAP. Option B can be a stretch-goal layer once the core loop feels good.

---

## 7. Dungeon-Crawler / Roguelite Layer

- The run is structured as a **sequence of computer opponents**, increasing in difficulty (bigger boards, better cards, higher levels) as you progress — this is the "floor" structure from the dungeon-crawler idea, just simplified to "opponent N of the run."
- Optionally group opponents into **floors** (e.g. opponents 1–3 = Floor 1, then a tougher "floor boss" opponent, then opponents continue on Floor 2, etc.) if you want the dungeon-crawler framing to be visible to the player. This is a presentation layer on top of the same core loop — doesn't change the mechanics above.
- Meta-progression between runs (permanent unlocks, new cards added to the shop pool, etc.) can be added later as a stretch goal — not needed for MVP.

---

## 8. MVP Feature Checklist

**Must-have:**
- [ ] 5-slot board
- [ ] Shop phase: roll, freeze, buy, sell, reroll-for-gold
- [ ] Combine matching cards into Level 2 / Level 3
- [ ] Poker hand evaluator (High Card → Royal Flush, with tiebreakers)
- [ ] Combat phase: compare player hand vs. computer hand, apply damage
- [ ] Persistent player health across rounds; run ends at 0 HP
- [ ] A sequence of increasingly strong computer opponents (even if just a simple difficulty curve, no full "floor" UI needed for MVP)

**Stretch (post-MVP):**
- [ ] Card abilities (Option B leveling bonuses, or unique per-card effects)
- [ ] Visible floor/map structure with bosses
- [ ] Meta-progression/unlocks between runs
- [ ] Suit-based synergy relics or modifiers

---

## 9. Open Questions
1. Should there be a bonus for narrowly losing (e.g., a close Two Pair vs. Three of a Kind) so a near-miss doesn't feel identical to a total blowout, or is the flat tier-based table enough?
2. Does the player ever gain HP back (e.g., a "rest" option in the shop), or is 30 HP a hard, depleting-only budget for the whole run?
3. How many rounds/opponents should a full run last, roughly — this determines how fast opponent hand-strength should ramp from Pair-level to Four-of-a-Kind-level.

---

*This spec intentionally strips out the suit-elemental-effects table, the separate "creature ability" layer, and the branching node map from v1 — those can come back later as optional depth once the core reroll-and-combine-toward-a-poker-hand loop is fun on its own.*
