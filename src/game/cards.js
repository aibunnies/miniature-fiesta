// Card model and deck utilities for Miniature Fiesta

export const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
export const SUITS = ['♥', '♦', '♣', '♠'];

// Numeric value for comparison (2 => 2 ... A => 14)
export const RANK_VALUE = Object.fromEntries(RANKS.map((r, i) => [r, i + 2]));

// Suit colors for rendering
export const SUIT_COLOR = {
  '♥': '#ff6188',
  '♦': '#fc9867',
  '♣': '#78dce8',
  '♠': '#a9dc76',
};

// Create a single card object
export function makeCard(rank, suit, level = 1) {
  return {
    id: `${rank}${suit}-${Math.random().toString(36).slice(2, 9)}`,
    rank,
    suit,
    level,
  };
}

// Full 52-card deck (level 1)
export function fullDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push(makeCard(rank, suit, 1));
    }
  }
  return deck;
}

// Shuffle in place (Fisher-Yates) and return
export function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Draw n random cards from a pool (returns new array, doesn't mutate pool)
export function drawCards(pool, n) {
  const copy = [...pool];
  shuffle(copy);
  return copy.slice(0, n);
}

// Two cards are "identical" (same rank + suit) for combining
export function isSameCard(a, b) {
  return a.rank === b.rank && a.suit === b.suit;
}

// Combine two identical cards into a leveled-up card
export function combineCards(a, b) {
  if (!isSameCard(a, b)) return null;
  const newLevel = Math.min(3, Math.max(a.level, b.level) + 1);
  return makeCard(a.rank, a.suit, newLevel);
}

// Pretty label for a card
export function cardLabel(card) {
  const stars = '★'.repeat(card.level - 1);
  return `${card.rank}${card.suit}${stars ? ' ' + stars : ''}`;
}