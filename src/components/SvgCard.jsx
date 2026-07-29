// SVG card rendering component
import { SUIT_COLOR } from '../game/cards.js';

// Map rank to SVG filename prefix
const RANK_PREFIX = {
  '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9', '10': 'T',
  'J': 'J', 'Q': 'Q', 'K': 'K', 'A': 'A'
};

// Map suit to SVG filename suffix
const SUIT_SUFFIX = {
  '♥': 'H', '♦': 'D', '♣': 'C', '♠': 'S'
};

export function SvgCard({ card, selected = false, faded = false, showSticker = true }) {
  if (!card) {
    return (
      <div className={`svg-card empty ${selected ? 'selected' : ''} ${faded ? 'faded' : ''}`}>
        <div className="svg-card-placeholder">Empty</div>
      </div>
    );
  }

  const prefix = RANK_PREFIX[card.rank] || 'T';
  const suffix = SUIT_SUFFIX[card.suit] || 'H';
  const svgPath = `/cards/${prefix}${suffix}.svg`;
  const color = SUIT_COLOR[card.suit] || '#fdf9f3';
  const stars = '★'.repeat(card.level - 1);

  return (
    <div className={`svg-card ${selected ? 'selected' : ''} ${faded ? 'faded' : ''}`} style={{ borderColor: color }}>
      <div className="svg-card-image">
        <img src={svgPath} alt={`${card.rank}${card.suit}`} />
      </div>
      {card.level > 1 && (
        <div className="svg-card-level">★ {stars}</div>
      )}
      {card.sticker && showSticker && (
        <div className="svg-card-sticker" title={card.sticker.name}>
          {card.sticker.icon}
        </div>
      )}
    </div>
  );
}

export function SvgCardRow({ cards = [], showHand = true, highlight = false }) {
  const slots = [...cards];
  while (slots.length < 5) slots.push(null);

  return (
    <div className={`svg-card-row ${highlight ? 'highlight' : ''}`}>
      {slots.map((card, i) => (
        <SvgCard key={i} card={card} showSticker={true} />
      ))}
    </div>
  );
}