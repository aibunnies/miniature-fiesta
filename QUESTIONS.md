# Open Questions — Miniature Fiesta

These are design decisions I made assumptions on while building the MVP. Answer them whenever you like and I'll adjust the game accordingly.

## Gameplay / Balance

1. **Near-miss bonus?** Should there be a bonus for narrowly losing (e.g. Two Pair vs Three of a Kind) so a close loss feels different from a total blowout, or is the flat tier-based damage table enough?
   - *Current implementation:* Flat tier-based damage, no near-miss bonus.

2. **HP recovery?** Does the player ever gain HP back (e.g. a "rest" option in the shop, or heal on a win), or is 30 HP a hard, depleting-only budget for the whole run?
   - *Current implementation:* HP is depleting-only. No healing.

3. **Run length?** How many rounds/opponents should a full run last? This determines how fast opponent hand-strength ramps from Pair-level to Four-of-a-Kind-level.
   - *Current implementation:* Endless run — difficulty ramps continuously via `targetTierForRound()`. No fixed run length or victory screen yet.

4. **Victory condition?** Should there be a win state (e.g. survive 20 rounds = victory), or is it purely "survive as long as possible"?
   - *Current implementation:* Endless, no victory screen.

## Leveling

5. **Leveling effect (Option A vs B)?** The spec recommends prototyping Option A (leveling = slot efficiency only, no combat bonus) first. Should we stick with A, or move to Option B (leveled cards get a wild-card/bonus effect)?
   - *Current implementation:* Option A — leveling only frees slots; no combat effect. A Level 2 card is just "this card, one slot."

6. **Combine rules edge case?** The spec says "2 Level-2s (4 copies) or a Level 2 + a matching copy → Level 3." My current `combineCards` does `max(level) + 1`, so Level 1 + Level 1 = Level 2, Level 2 + Level 1 = Level 3, Level 2 + Level 2 = Level 3. Is that the intended behavior, or should Level 2 + Level 2 produce something special?
   - *Current implementation:* `newLevel = min(3, max(a.level, b.level) + 1)`.

## Economy

7. **Gold curve?** I used 10 base +1 per round (SAP-style). Good, or do you want a different curve (e.g. flat 10, or +2 per round)?
   - *Current implementation:* `gold = 10 + (round - 1)`.

8. **Sell value?** I set sell = 1 gold (flat). SAP uses 1 for most pets. Keep flat, or scale with card level?
   - *Current implementation:* Flat 1 gold regardless of level.

9. **Buy cost?** Flat 3 gold per card, independent of rank/suit (per spec). Confirm?
   - *Current implementation:* Flat 3 gold.

## Opponent / Difficulty

10. **Opponent generation method?** I generate the opponent hand by random-drawing until it lands at/above a target tier for the round. Should opponents instead be "built" more deliberately (e.g. guaranteed a pair of a specific rank), or is the random-retry approach fine?
    - *Current implementation:* Random draw with up to 60 retries, picking closest to target tier.

11. **Opponent leveling?** Should opponents ever show leveled cards (visually), or always plain Level 1 cards since they're single-showdown?
    - *Current implementation:* Opponent cards are always Level 1 (no leveling shown).

## UI / Presentation

12. **ASCII hand art?** I drew a stylized ASCII hand (fingers + palm + wrist cuff) beneath the player's cards. Do you like this style, or want a different hand design (e.g. more detailed, card-back fan, etc.)?
    - *Current implementation:* Simple block fingers + solid palm + striped wrist.

13. **Card coloring?** Cards are currently monochrome ASCII with a per-suit color tint on the wrapper. Want full per-character suit coloring (hearts pink, diamonds orange, etc. inline), or keep the monochrome terminal look?
    - *Current implementation:* Monochrome ASCII, suit-colored wrapper div.

14. **Floors/bosses UI?** The spec mentions optional floor/boss framing. Want a visible floor counter or boss indicator for MVP, or leave it as plain "Round N"?
    - *Current implementation:* Plain "Round N" with a themed opponent name.

## Stretch Goals (not yet implemented)

15. **Card abilities (Option B)?** When should we add leveled-card bonuses or unique per-card effects?
16. **Meta-progression?** Permanent unlocks between runs — priority?
17. **Suit-synergy relics/modifiers?**
18. **Sound/music?**

---

*Edit this file with your answers and I'll update the game to match.*