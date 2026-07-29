# 30 – Poker Logic

This document defines how poker hands are evaluated and compared for the ANTE MVP.

The poker system is the core of combat: both sides commit cards, form a hand, and we convert that to a `PokerHandResult` used for damage and effects.

---

## 1. Supported Hands (MVP)

We use standard 5-card poker hand rankings:

From lowest to highest:

1. **High Card**
2. **Pair**
3. **Two Pair**
4. **Three of a Kind**
5. **Straight**
6. **Flush**
7. **Full House**
8. **Four of a Kind**
9. **Straight Flush**

Optional: treat **Royal Flush** as a `StraightFlush` (A-high straight flush) with higher primary value; no separate enum needed for MVP.

---

## 2. Data Structures

### 2.1 Enums & Interfaces

**PokerHandRank:**

- `HighCard`
- `Pair`
- `TwoPair`
- `ThreeOfAKind`
- `Straight`
- `Flush`
- `FullHouse`
- `FourOfAKind`
- `StraightFlush`

**PokerHandResult:**

- `rank: PokerHandRank`
- `primaryValue: number`  
  - Main rank value used for comparisons (e.g., rank of trips in a full house).
- `kickerValues: number[]`  
  - Remaining ranks ordered for tie-breaking.
- `isFlush: boolean`
- `isStraight: boolean`

All ranks use numeric values: 2–14 (11=J, 12=Q, 13=K, 14=A).

---

## 3. Evaluation Rules

### 3.1 Input Constraints

- MVP: evaluate exactly **5 committed cards** per hand.
- If fewer than 5 cards are committed:
  - For MVP, **still evaluate** the hand using standard rules on however many cards exist, but we must define behavior:
    - Recommendation: treat fewer than 5 as a 5-card-equivalent with missing cards counted as rank 0 for tie-breaking. However, since MVP likely commits 5 whenever possible, this is a rare case.

Implementation: `evaluatePokerHand(cards: Card[]): PokerHandResult`.

### 3.2 Ace Handling in Straights

MVP rule:

- **Aces are high only**:
  - A straight can be 10-J-Q-K-A.
  - No 5-high straight using Ace as 1 (A-2-3-4-5) in MVP.

This simplifies evaluation.

### 3.3 Hand Detection Order

When evaluating a 5-card hand:

1. **Sort ranks descending**.
2. Count occurrences of each rank.
3. Check if flush:
   - All cards share same suit → `isFlush = true`.
4. Check if straight:
   - 5 unique ranks forming a sequence with step 1 → `isStraight = true`.

Then determine rank:

1. If `isStraight && isFlush` → `StraightFlush`.
2. Else if any rank count = 4 → `FourOfAKind`.
3. Else if counts are 3 and 2 → `FullHouse`.
4. Else if `isFlush` → `Flush`.
5. Else if `isStraight` → `Straight`.
6. Else if any rank count = 3 → `ThreeOfAKind`.
7. Else if there are two rank pairs → `TwoPair`.
8. Else if there is one rank pair → `Pair`.
9. Else → `HighCard`.

### 3.4 primaryValue & kickerValues

We need deterministic comparison. For each rank:

- **High Card**:
  - `primaryValue`: highest card rank.
  - `kickerValues`: remaining ranks in descending order.
- **Pair**:
  - `primaryValue`: rank of the pair.
  - `kickerValues`: remaining 3 ranks in descending order.
- **Two Pair**:
  - `primaryValue`: higher of the two pair ranks.
  - `kickerValues`: [lower pair rank, fifth card rank].
- **Three of a Kind**:
  - `primaryValue`: trip rank.
  - `kickerValues`: remaining two ranks descending.
- **Straight**:
  - `primaryValue`: highest rank in the straight.
  - `kickerValues`: empty or [highest, then others] if desired.
- **Flush**:
  - `primaryValue`: highest rank.
  - `kickerValues`: remaining ranks descending.
- **Full House**:
  - `primaryValue`: trip rank.
  - `kickerValues`: [pair rank].
- **Four of a Kind**:
  - `primaryValue`: quad rank.
  - `kickerValues`: [kicker rank].
- **Straight Flush**:
  - Same as Straight: `primaryValue` = highest rank.

This structure supports standard poker hand comparisons.

---

## 4. Hand Comparison

Implement helper:

```ts
// returns 1 if a > b, -1 if a < b, 0 if equal
function compareHands(a: PokerHandResult, b: PokerHandResult): number
```

### 4.1 Comparison Steps

1. Compare `rank` (enum order):
   - Higher rank wins.
2. If `rank` equal:
   - Compare `primaryValue`:
     - Higher value wins.
3. If still equal:
   - Compare `kickerValues` lexicographically:
     - For i from 0 to `kickerValues.length - 1`:
       - If `a.kickerValues[i] > b.kickerValues[i]`: a wins.
       - If `<`: b wins.
4. If all equal:
   - Return 0 (tie).

### 4.2 Ties in Game Logic

For MVP:

- If both player and enemy get identical `PokerHandResult` (rank + primary + kicker equal):
  - They still each deal their independently computed damage.
  - Hand comparison is not currently used as a tiebreaker for damage; it can be used later for winner bonuses.

---

## 5. Integration with Damage & Effects

The poker logic should be **pure** and not know about:
- Suit effects.
- Card abilities.
- Damage numbers.

Combat uses `PokerHandResult` as input to:
- Damage calculator (hand rank → base damage).
- Ability triggers (e.g., "On Three of a Kind").

---

## 6. Testing Guidelines

- Each hand type should have multiple test cases.
- Include edge cases:
  - Multiple possible hand interpretations (e.g., 4-of-a-kind vs full house).
  - Straight vs not-straight near Ace boundaries.
  - Ties across multiple levels (rank and kickers).

`pokerEvaluator.ts` and `handComparison.ts` should be among the most thoroughly tested modules.