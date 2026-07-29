import type { Card, Deck } from './types'

function shuffle<T>(items: T[]): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function createShuffledDeck(cards: Card[]): Deck {
  return {
    drawPile: shuffle(cards),
    discardPile: [],
    hand: [],
  }
}

/**
 * Draw up to `count` cards from the deck's drawPile, reshuffling discardPile into drawPile if needed.
 * Does not mutate the input deck; returns a new deck plus the drawn cards.
 */
export function drawCards(
  deck: Deck,
  count: number,
): { deck: Deck; drawn: Card[] } {
  let remainingToDraw = count
  let drawPile = [...deck.drawPile]
  let discardPile = [...deck.discardPile]
  const drawn: Card[] = []

  while (remainingToDraw > 0) {
    if (drawPile.length === 0) {
      if (discardPile.length === 0) {
        // No more cards to draw.
        break
      }
      // Reshuffle discard into new draw pile.
      drawPile = shuffle(discardPile)
      discardPile = []
    }

    const card = drawPile.shift()!
    drawn.push(card)
    remainingToDraw -= 1
  }

  const newDeck: Deck = {
    drawPile,
    discardPile,
    hand: [...deck.hand, ...drawn],
  }

  return { deck: newDeck, drawn }
}

/**
 * Move the given cards from hand into discardPile. Cards are matched by id.
 */
export function discardCards(deck: Deck, cards: Card[]): Deck {
  const discardIds = new Set(cards.map((c) => c.id))

  const remainingHand: Card[] = []
  const discardedNow: Card[] = []

  for (const card of deck.hand) {
    if (discardIds.has(card.id)) {
      discardedNow.push(card)
    } else {
      remainingHand.push(card)
    }
  }

  return {
    drawPile: [...deck.drawPile],
    discardPile: [...deck.discardPile, ...discardedNow],
    hand: remainingHand,
  }
}
