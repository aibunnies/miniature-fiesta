// ASCII art rendering for individual cards and a hand holding cards.
// Each card is rendered as a fixed-width block of ASCII lines so they can be
// placed side-by-side. A "hand" of cards is drawn with fingers underneath.

import { SUIT_COLOR } from '../game/cards.js';

// Render a single card as an array of ASCII lines (height = 9 lines).
// Width is 11 chars for the card body. Empty slot renders a placeholder.
const CARD_WIDTH = 11;
const CARD_HEIGHT = 9;

function pad(str, width) {
  str = String(str);
  if (str.length > width) return str.slice(0, width);
  return str + ' '.repeat(width - str.length);
}

// Build the ASCII body of one card
export function cardLines(card) {
  if (!card) {
    // empty slot
    const line = '│' + ' '.repeat(CARD_WIDTH - 2) + '│';
    return [
      '┌─────────┐',
      line,
      line,
      line,
      '│  empty  │',
      line,
      line,
      line,
      '└─────────┘',
    ];
  }

  const { rank, suit, level } = card;
  const color = SUIT_COLOR[suit] || '#fdf9f3';
  const rankStr = rank === '10' ? '10' : rank;
  const cornerTop = `${rankStr}${suit}`;
  const cornerBot = `${suit}${rankStr}`;
  const stars = '★'.repeat(level - 1);
  const center = level > 1 ? `${suit} ${stars}` : suit;

  return [
    '┌─────────┐',
    `│${pad(cornerTop, 9)}│`,
    '│         │',
    '│         │',
    `│${pad(center, 9)}│`,
    '│         │',
    '│         │',
    `│${pad(cornerBot, 9)}│`,
    '└─────────┘',
  ];
}

// The ASCII "hand" — fingers/cuff drawn below the row of cards.
// Returns an array of lines spanning the full width of all cards combined.
export function handLines(numCards) {
  const totalWidth = numCards * CARD_WIDTH;
  // Build a stylized hand: wrist, palm, and fingers reaching up to the cards
  // We center the hand under the cards.
  const lines = [];

  // Fingertips (top of hand, just under cards) — 5 fingers spread across
  const fingerSpacing = Math.floor(totalWidth / 5);
  let fingerLine = '';
  for (let i = 0; i < 5; i++) {
    const pos = i * fingerSpacing + Math.floor(fingerSpacing / 2);
    while (fingerLine.length < pos) fingerLine += ' ';
    fingerLine += '╭─╮';
  }
  fingerLine = pad(fingerLine, totalWidth);
  lines.push(fingerLine);

  // Finger bodies
  let fBody = '';
  for (let i = 0; i < 5; i++) {
    const pos = i * fingerSpacing + Math.floor(fingerSpacing / 2);
    while (fBody.length < pos) fBody += ' ';
    fBody += '│ │';
  }
  fBody = pad(fBody, totalWidth);
  lines.push(fBody);
  lines.push(fBody);

  // Knuckles / palm top — merge fingers into a palm line
  let palm = '';
  const firstPos = Math.floor(fingerSpacing / 2);
  const lastPos = 4 * fingerSpacing + Math.floor(fingerSpacing / 2) + 2;
  for (let x = 0; x < totalWidth; x++) {
    if (x >= firstPos && x <= lastPos) palm += '█';
    else palm += ' ';
  }
  lines.push(palm);
  lines.push(palm);

  // Wrist / cuff
  let wrist = '';
  const cuffStart = Math.floor(totalWidth / 2) - Math.floor(totalWidth / 6);
  const cuffEnd = Math.floor(totalWidth / 2) + Math.floor(totalWidth / 6);
  for (let x = 0; x < totalWidth; x++) {
    if (x >= cuffStart && x <= cuffEnd) wrist += '▓';
    else wrist += ' ';
  }
  lines.push(wrist);
  lines.push(wrist);

  return lines;
}

// React component: renders a row of cards with the ASCII hand beneath.
// Props: cards (array, may contain nulls for empty slots), showHand (bool)
export function AsciiCardRow({ cards = [], showHand = true, highlight = false }) {
  // Always render 5 slots
  const slots = [...cards];
  while (slots.length < 5) slots.push(null);

  const cardRows = slots.map(cardLines);
  const height = CARD_HEIGHT;
  const combined = [];

  for (let r = 0; r < height; r++) {
    let line = '';
    for (let c = 0; c < 5; c++) {
      line += cardRows[c][r];
    }
    combined.push(line);
  }

  if (showHand) {
    const hand = handLines(5);
    for (const h of hand) combined.push(h);
  }

  return (
    <pre
      className={`ascii-card-row${highlight ? ' highlight' : ''}`}
      style={{ margin: 0, lineHeight: '1em', whiteSpace: 'pre' }}
    >
      {combined.join('\n')}
    </pre>
  );
}

// Single card component (for shop display)
export function AsciiCard({ card, selected = false, faded = false }) {
  const lines = cardLines(card);
  return (
    <pre
      className={`ascii-card${selected ? ' selected' : ''}${faded ? ' faded' : ''}`}
      style={{ margin: 0, lineHeight: '1em', whiteSpace: 'pre' }}
    >
      {lines.join('\n')}
    </pre>
  );
}