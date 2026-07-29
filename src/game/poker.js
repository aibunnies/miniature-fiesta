// Poker hand evaluator with tiebreakers
// Ranks: High Card < Pair < Two Pair < Three of a Kind < Straight < Flush < Full House < Four of a Kind < Straight Flush < Royal Flush

import { RANK_VALUE } from './cards.js';

export const HAND_TIERS = [
  'High Card',
  'Pair',
  'Two Pair',
  'Three of a Kind',
  'Straight',
  'Flush',
  'Full House',
  'Four of a Kind',
  'Straight Flush',
  'Royal Flush',
];

export const TIER_VALUE = Object.fromEntries(HAND_TIERS.map((t, i) => [t, i]));

// Damage table from the spec (damage dealt by the winning hand's tier)
export const TIER_DAMAGE = {
  'High Card': 1,
  'Pair': 2,
  'Two Pair': 3,
  'Three of a Kind': 4,
  'Straight': 6,
  'Flush': 7,
  'Full House': 9,
  'Four of a Kind': 12,
  'Straight Flush': 16,
  'Royal Flush': 20,
};

// Count occurrences of each rank
function rankCounts(cards) {
  const counts = {};
  for (const c of cards) {
    counts[c.rank] = (counts[c.rank] || 0) + 1;
  }
  return counts;
}

// Check if all cards share the same suit
function isFlush(cards) {
  return cards.every((c) => c.suit === cards[0].suit);
}

// Check for a straight; returns the high card value of the straight or 0
// Handles A-2-3-4-5 (wheel) as a 5-high straight
function straightHigh(cards) {
  const vals = [...new Set(cards.map((c) => RANK_VALUE[c.rank]))].sort((a, b) => a - b);
  if (vals.length < 5) return 0;

  // Normal straight: 5 consecutive
  for (let i = 0; i <= vals.length - 5; i++) {
    if (vals[i + 4] - vals[i] === 4) {
      // ensure consecutive
      let ok = true;
      for (let j = 0; j < 4; j++) {
        if (vals[i + j + 1] - vals[i + j] !== 1) {
          ok = false;
          break;
        }
      }
      if (ok) return vals[i + 4];
    }
  }

  // Wheel: A-2-3-4-5 (14,2,3,4,5)
  if (vals.includes(14) && vals.includes(2) && vals.includes(3) && vals.includes(4) && vals.includes(5)) {
    return 5;
  }

  return 0;
}

// Group ranks by count, sorted by count desc then rank value desc
function groupedRanks(cards) {
  const counts = rankCounts(cards);
  return Object.entries(counts)
    .map(([rank, count]) => ({ rank, count, value: RANK_VALUE[rank] }))
    .sort((a, b) => (b.count - a.count) || (b.value - a.value));
}

// Evaluate a 5-card hand. Returns { tier, tiebreak: number[], name }
export function evaluateHand(cards) {
  const hand = cards.slice(0, 5);
  const flush = isFlush(hand);
  const high = straightHigh(hand);
  const groups = groupedRanks(hand);

  const counts = groups.map((g) => g.count).join('');
  const tieVals = groups.map((g) => g.value);

  // Royal Flush: A-K-Q-J-10 same suit
  if (flush && high === 14) {
    return { tier: 'Royal Flush', tiebreak: [14], name: 'Royal Flush' };
  }

  // Straight Flush
  if (flush && high > 0) {
    return { tier: 'Straight Flush', tiebreak: [high], name: 'Straight Flush' };
  }

  // Four of a Kind
  if (counts.startsWith('4')) {
    return { tier: 'Four of a Kind', tiebreak: tieVals, name: 'Four of a Kind' };
  }

  // Full House (3 + 2)
  if (counts.startsWith('32')) {
    return { tier: 'Full House', tiebreak: tieVals, name: 'Full House' };
  }

  // Flush
  if (flush) {
    return { tier: 'Flush', tiebreak: tieVals, name: 'Flush' };
  }

  // Straight
  if (high > 0) {
    return { tier: 'Straight', tiebreak: [high], name: 'Straight' };
  }

  // Three of a Kind
  if (counts.startsWith('3')) {
    return { tier: 'Three of a Kind', tiebreak: tieVals, name: 'Three of a Kind' };
  }

  // Two Pair
  if (counts.startsWith('22')) {
    return { tier: 'Two Pair', tiebreak: tieVals, name: 'Two Pair' };
  }

  // Pair
  if (counts.startsWith('2')) {
    return { tier: 'Pair', tiebreak: tieVals, name: 'Pair' };
  }

  // High Card
  return { tier: 'High Card', tiebreak: tieVals, name: 'High Card' };
}

// Compare two evaluations. Returns positive if a wins, negative if b wins, 0 if draw
export function compareHands(a, b) {
  const ta = TIER_VALUE[a.tier];
  const tb = TIER_VALUE[b.tier];
  if (ta !== tb) return ta - tb;

  const len = Math.max(a.tiebreak.length, b.tiebreak.length);
  for (let i = 0; i < len; i++) {
    const av = a.tiebreak[i] ?? 0;
    const bv = b.tiebreak[i] ?? 0;
    if (av !== bv) return av - bv;
  }
  return 0;
}

// Convenience: evaluate and compare two arrays of cards
export function showdown(playerCards, opponentCards) {
  const pe = evaluateHand(playerCards);
  const oe = evaluateHand(opponentCards);
  const cmp = compareHands(pe, oe);
  return {
    player: pe,
    opponent: oe,
    winner: cmp > 0 ? 'player' : cmp < 0 ? 'opponent' : 'draw',
    damage: cmp > 0 ? TIER_DAMAGE[pe.tier] : cmp < 0 ? TIER_DAMAGE[oe.tier] : 0,
  };
}