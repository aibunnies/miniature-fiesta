import type { Card, PokerHandResult, PokerHandRank, Suit } from './types'

function sortRanksDesc(ranks: number[]): number[] {
  return [...ranks].sort((a, b) => b - a)
}

function isStraight(sortedRanksDesc: number[]): { isStraight: boolean; high: number } {
  const ranks = [...new Set(sortedRanksDesc)].sort((a, b) => a - b) // ascending unique
  if (ranks.length !== 5) {
    return { isStraight: false, high: 0 }
  }

  // MVP: A-high only, no A-5 wheel
  const first = ranks[0]
  for (let i = 1; i < ranks.length; i += 1) {
    if (ranks[i] !== first + i) {
      return { isStraight: false, high: 0 }
    }
  }
  return { isStraight: true, high: ranks[4] }
}

function isFlush(suits: Suit[]): boolean {
  return new Set(suits).size === 1
}

function countByRank(ranks: number[]): Map<number, number> {
  const map = new Map<number, number>()
  for (const r of ranks) {
    map.set(r, (map.get(r) ?? 0) + 1)
  }
  return map
}

function determineHandRank(
  ranksDesc: number[],
  suits: Suit[],
): { rank: PokerHandRank; primaryValue: number; kickerValues: number[]; isFlush: boolean; isStraight: boolean } {
  const flush = isFlush(suits)
  const straightInfo = isStraight(ranksDesc)
  const straight = straightInfo.isStraight

  const rankCounts = countByRank(ranksDesc)
  const groups = Array.from(rankCounts.entries()).sort((a, b) => {
    // Sort by count desc, then rank desc
    if (b[1] !== a[1]) return b[1] - a[1]
    return b[0] - a[0]
  })

  if (straight && flush) {
    return {
      rank: 'StraightFlush',
      primaryValue: straightInfo.high,
      kickerValues: [],
      isFlush: true,
      isStraight: true,
    }
  }

  const [topRank, topCount] = groups[0]

  if (topCount === 4) {
    // Four of a kind
    const kicker = groups[1][0]
    return {
      rank: 'FourOfAKind',
      primaryValue: topRank,
      kickerValues: [kicker],
      isFlush: flush,
      isStraight: false,
    }
  }

  if (topCount === 3 && groups.length === 2) {
    // Full house: 3 + 2
    const [pairRank] = groups[1]
    return {
      rank: 'FullHouse',
      primaryValue: topRank, // trips rank
      kickerValues: [pairRank],
      isFlush: flush,
      isStraight: false,
    }
  }

  if (flush) {
    return {
      rank: 'Flush',
      primaryValue: ranksDesc[0],
      kickerValues: ranksDesc.slice(1),
      isFlush: true,
      isStraight: false,
    }
  }

  if (straight) {
    return {
      rank: 'Straight',
      primaryValue: straightInfo.high,
      kickerValues: [],
      isFlush: false,
      isStraight: true,
    }
  }

  if (topCount === 3) {
    // Three of a kind
    const kickers = groups
      .filter(([, count]) => count === 1)
      .map(([r]) => r)
      .sort((a, b) => b - a)
    return {
      rank: 'ThreeOfAKind',
      primaryValue: topRank,
      kickerValues: kickers,
      isFlush: false,
      isStraight: false,
    }
  }

  if (topCount === 2 && groups.length === 3) {
    // Two pair: 2,2,1
    const pairRanks = groups
      .filter(([, count]) => count === 2)
      .map(([r]) => r)
      .sort((a, b) => b - a)
    const kicker = groups.find(([, count]) => count === 1)![0]
    return {
      rank: 'TwoPair',
      primaryValue: pairRanks[0],
      kickerValues: [pairRanks[1], kicker],
      isFlush: false,
      isStraight: false,
    }
  }

  if (topCount === 2) {
    // One pair
    const pairRank = topRank
    const kickers = groups
      .filter(([, count]) => count === 1)
      .map(([r]) => r)
      .sort((a, b) => b - a)
    return {
      rank: 'Pair',
      primaryValue: pairRank,
      kickerValues: kickers,
      isFlush: false,
      isStraight: false,
    }
  }

  // High card
  return {
    rank: 'HighCard',
    primaryValue: ranksDesc[0],
    kickerValues: ranksDesc.slice(1),
    isFlush: false,
    isStraight: false,
  }
}

export function evaluatePokerHand(cards: Card[]): PokerHandResult {
  if (cards.length !== 5) {
    throw new Error(`evaluatePokerHand expects 5 cards, got ${cards.length}`)
  }

  const ranksDesc = sortRanksDesc(cards.map((c) => c.rank))
  const suits = cards.map((c) => c.suit)

  const { rank, primaryValue, kickerValues, isFlush, isStraight } = determineHandRank(
    ranksDesc,
    suits,
  )

  return {
    rank,
    primaryValue,
    kickerValues,
    isFlush,
    isStraight,
  }
}

const HAND_RANK_ORDER: PokerHandRank[] = [
  'HighCard',
  'Pair',
  'TwoPair',
  'ThreeOfAKind',
  'Straight',
  'Flush',
  'FullHouse',
  'FourOfAKind',
  'StraightFlush',
]

function rankValue(rank: PokerHandRank): number {
  return HAND_RANK_ORDER.indexOf(rank)
}

/**
 * Compare two evaluated poker hands.
 * Returns 1 if a > b, -1 if b > a, 0 if tie.
 */
export function compareHands(a: PokerHandResult, b: PokerHandResult): number {
  const aRankVal = rankValue(a.rank)
  const bRankVal = rankValue(b.rank)
  if (aRankVal !== bRankVal) {
    return aRankVal > bRankVal ? 1 : -1
  }

  if (a.primaryValue !== b.primaryValue) {
    return a.primaryValue > b.primaryValue ? 1 : -1
  }

  const maxLen = Math.max(a.kickerValues.length, b.kickerValues.length)
  for (let i = 0; i < maxLen; i += 1) {
    const aKick = a.kickerValues[i] ?? 0
    const bKick = b.kickerValues[i] ?? 0
    if (aKick !== bKick) {
      return aKick > bKick ? 1 : -1
    }
  }

  return 0
}
