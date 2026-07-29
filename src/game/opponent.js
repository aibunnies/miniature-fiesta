// Opponent hand generator — scales difficulty by round number
// Early rounds: Pair/Two Pair level. Mid: Straight/Flush/Full House. Late/boss: Four of a Kind+.

import { RANKS, SUITS, makeCard, shuffle, fullDeck } from './cards.js';
import { evaluateHand, TIER_VALUE } from './poker.js';

// Target tier for a given round (1-indexed)
function targetTierForRound(round) {
  if (round <= 3) return 'Pair';        // early, forgiving
  if (round <= 6) return 'Two Pair';
  if (round <= 9) return 'Three of a Kind';
  if (round <= 12) return 'Straight';
  if (round <= 15) return 'Flush';
  if (round <= 18) return 'Full House';
  if (round <= 21) return 'Four of a Kind';
  return 'Straight Flush';              // very late / boss
}

// Build a random 5-card hand, retrying until it's at or near the target tier
export function generateOpponentHand(round) {
  const target = targetTierForRound(round);
  const targetVal = TIER_VALUE[target];
  const deck = fullDeck();

  let best = null;
  let bestDist = Infinity;

  // Try a number of random draws, pick the one closest to (but not far above) target
  for (let attempt = 0; attempt < 60; attempt++) {
    const hand = shuffle([...deck]).slice(0, 5);
    const ev = evaluateHand(hand);
    const dist = Math.abs(TIER_VALUE[ev.tier] - targetVal);

    // Prefer hands at or slightly above target (so player must keep improving)
    if (TIER_VALUE[ev.tier] >= targetVal && dist <= 2) {
      return hand;
    }
    if (dist < bestDist) {
      best = hand;
      bestDist = dist;
    }
  }

  return best;
}

// Opponent display name for a round
export function opponentName(round) {
  const names = [
    'Card Shark',
    'River Rat',
    'Bluffmaster',
    'The Hustler',
    'Lady Luck',
    'Dead Man\'s Hand',
    'The Gambler',
    'Royal Rogue',
    'Ace of Shadows',
    'The House',
  ];
  return names[(round - 1) % names.length];
}