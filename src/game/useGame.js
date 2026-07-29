// Game state management via useReducer — implements the full SAP-style loop with multi-hand durability system.

import { useReducer, useCallback } from 'react';
import { makeCard, fullDeck, shuffle, isSameCard, combineCards } from './cards.js';
import { evaluateHand, TIER_DAMAGE, HAND_TIERS } from './poker.js';
import { generateOpponentHand, opponentName } from './opponent.js';

const NUM_HANDS = 5;
const HAND_DURABILITY = 3; // Each hand can be used 3 times before discarding
const CARDS_PER_HAND = 5;
const SHOP_SIZE = 5;
const BASE_GOLD = 15;
const BUY_COST = 3;
const REROLL_COST = 1;
const SELL_VALUE = 1;
const STICKER_COST = 2;
const START_HP = 30;

// Sticker definitions
export const STICKERS = {
  HEAL: { id: 'heal', name: 'Heal', icon: '💚', description: 'Heals for the card\'s rank value' },
  DEFEND: { id: 'defend', name: 'Defend', icon: '🛡️', description: 'Reduces next damage by card\'s rank value' },
  SHIELD: { id: 'shield', name: 'Shield', icon: '🔰', description: 'Blocks all damage once' },
  BERSERK: { id: 'berserk', name: 'Berserk', icon: '⚔️', description: 'Deals +card rank bonus damage' },
  LUCK: { id: 'luck', name: 'Luck', icon: '🍀', description: 'Rerolls shop for free once' },
};

// Economy constants exported for UI display
export const ECON = { NUM_HANDS, HAND_DURABILITY, CARDS_PER_HAND, SHOP_SIZE, BASE_GOLD, BUY_COST, REROLL_COST, SELL_VALUE, START_HP };

function goldForRound(round) {
  return BASE_GOLD + (round - 1); // +1 per round, SAP-style curve
}

function rollShop() {
  const deck = fullDeck();
  shuffle(deck);
  const cards = deck.slice(0, SHOP_SIZE).map((card) => ({ ...card, frozen: false }));
  // Generate random stickers for shop
  const stickers = [];
  const stickerTypes = Object.keys(STICKERS);
  for (let i = 0; i < 3; i++) {
    const randomType = stickerTypes[Math.floor(Math.random() * stickerTypes.length)];
    stickers.push({ ...STICKERS[randomType], id: `sticker-${i}-${Date.now()}` });
  }
  return { cards, stickers };
}

function createEmptyHand() {
  return {
    id: `hand-${Math.random().toString(36).slice(2, 9)}`,
    cards: Array(CARDS_PER_HAND).fill(null),
    durability: HAND_DURABILITY,
    maxDurability: HAND_DURABILITY,
  };
}

function createSticker(type, cardRank) {
  const stickerDef = Object.values(STICKERS).find(s => s.id === type) || STICKERS.HEAL;
  return {
    type: stickerDef.id,
    name: stickerDef.name,
    icon: stickerDef.icon,
    value: RANK_VALUE[cardRank] || 1, // Use card rank as the power value
  };
}

function initialState() {
  const hands = Array(NUM_HANDS).fill(null).map(() => createEmptyHand());
  return {
    screen: 'home',        // home | shop | combat | gameover | victory
    round: 1,
    hp: START_HP,
    gold: goldForRound(1),
    hands,
    cardPool: [],          // Cards bought from shop but not yet assigned to a hand
    stickerPool: [],       // Stickers bought from shop but not yet assigned
    shop: rollShop(),
    opponentHand: null,
    opponentName: opponentName(1),
    lastResult: null,      // { player, opponent, winner, damage }
    combatResolved: false,
    log: [],
    selectedHandIndex: null,
    selectedCardPoolIndex: null,
    selectedShopIndex: null,
    selectedStickerIndex: null,
    message: '',
  };
}

function pushLog(state, entry) {
  return [entry, ...state.log].slice(0, 30);
}

function reducer(state, action) {
  switch (action.type) {
    case 'START_RUN': {
      return { ...initialState(), screen: 'shop', log: pushLog(state, '🃏 A new run begins! Build your hands.') };
    }

    case 'REROLL': {
      if (state.gold < REROLL_COST) return { ...state, message: 'Not enough gold to reroll.' };
      const kept = state.shop.cards.filter((c) => c && c.frozen);
      const need = SHOP_SIZE - kept.length;
      const fresh = rollShop().cards.slice(0, need);
      const newCards = [...kept, ...fresh];
      while (newCards.length < SHOP_SIZE) newCards.push(null);
      
      // Reroll stickers too
      const stickerTypes = Object.keys(STICKERS);
      const newStickers = [];
      for (let i = 0; i < 3; i++) {
        const randomType = stickerTypes[Math.floor(Math.random() * stickerTypes.length)];
        newStickers.push({ ...STICKERS[randomType], id: `sticker-${i}-${Date.now()}` });
      }
      
      return {
        ...state,
        gold: state.gold - REROLL_COST,
        shop: { cards: newCards, stickers: newStickers },
        message: '',
        log: pushLog({ ...state }, '🎲 Rerolled the shop.'),
      };
    }

    case 'TOGGLE_FREEZE': {
      const { index } = action;
      const cards = state.shop.cards.map((c, i) =>
        i === index && c ? { ...c, frozen: !c.frozen } : c
      );
      return { ...state, shop: { ...state.shop, cards }, message: '' };
    }

    case 'BUY': {
      const { shopIndex } = action;
      const card = state.shop.cards[shopIndex];
      if (!card) return { ...state, message: 'No card there.' };
      if (state.gold < BUY_COST) return { ...state, message: 'Not enough gold to buy.' };
      
      const cards = state.shop.cards.slice();
      cards[shopIndex] = null;
      const cardPool = [...state.cardPool, { ...card, frozen: false }];
      return {
        ...state,
        gold: state.gold - BUY_COST,
        cardPool,
        shop: { ...state.shop, cards },
        message: '',
        selectedShopIndex: null,
        log: pushLog({ ...state }, `💰 Bought ${card.rank}${card.suit} to card pool.`),
      };
    }

    case 'BUY_STICKER': {
      const { stickerIndex } = action;
      const sticker = state.shop.stickers[stickerIndex];
      if (!sticker) return { ...state, message: 'No sticker there.' };
      if (state.gold < STICKER_COST) return { ...state, message: 'Not enough gold to buy sticker.' };
      
      const stickers = state.shop.stickers.filter((_, i) => i !== stickerIndex);
      const stickerPool = [...state.stickerPool, sticker];
      return {
        ...state,
        gold: state.gold - STICKER_COST,
        stickerPool,
        shop: { ...state.shop, stickers },
        message: '',
        log: pushLog({ ...state }, `✨ Bought ${sticker.name} sticker!`),
      };
    }

    case 'SELL_FROM_POOL': {
      const { poolIndex } = action;
      const card = state.cardPool[poolIndex];
      if (!card) return { ...state, message: 'No card in pool to sell.' };
      const cardPool = state.cardPool.filter((_, i) => i !== poolIndex);
      return {
        ...state,
        gold: state.gold + SELL_VALUE,
        cardPool,
        message: '',
        log: pushLog({ ...state }, `🪙 Sold ${card.rank}${card.suit} for ${SELL_VALUE}g.`),
      };
    }

    case 'ASSIGN_TO_HAND': {
      const { handIndex, poolIndex, slotIndex } = action;
      const hand = state.hands[handIndex];
      const card = state.cardPool[poolIndex];
      
      if (!card) return { ...state, message: 'No card in pool to assign.' };
      if (!hand) return { ...state, message: 'Invalid hand.' };
      if (hand.cards[slotIndex] !== null) {
        return { ...state, message: 'That slot is occupied. Remove a card first.' };
      }
      
      const hands = state.hands.map((h, i) => 
        i === handIndex ? { ...h, cards: h.cards.map((c, si) => si === slotIndex ? { ...card } : c) } : h
      );
      const cardPool = state.cardPool.filter((_, i) => i !== poolIndex);
      
      return {
        ...state,
        hands,
        cardPool,
        message: '',
        selectedCardPoolIndex: null,
        log: pushLog({ ...state }, `📝 Assigned ${card.rank}${card.suit} to Hand ${handIndex + 1}, Slot ${slotIndex + 1}.`),
      };
    }

    case 'ADD_STICKER_TO_CARD': {
      const { handIndex, slotIndex, stickerIndex } = action;
      const hand = state.hands[handIndex];
      if (!hand) return { ...state, message: 'Invalid hand.' };
      const card = hand.cards[slotIndex];
      if (!card) return { ...state, message: 'No card in that slot.' };
      if (card.sticker) return { ...state, message: 'Card already has a sticker.' };
      
      const sticker = state.stickerPool[stickerIndex];
      if (!sticker) return { ...state, message: 'No sticker in pool.' };
      
      const hands = state.hands.map((h, i) => {
        if (i !== handIndex) return h;
        return {
          ...h,
          cards: h.cards.map((c, si) => si === slotIndex ? { ...c, sticker } : c)
        };
      });
      const stickerPool = state.stickerPool.filter((_, i) => i !== stickerIndex);
      
      return {
        ...state,
        hands,
        stickerPool,
        message: '',
        log: pushLog({ ...state }, `✨ Applied ${sticker.name} sticker to ${card.rank}${card.suit}!`),
      };
    }

    case 'REMOVE_STICKER': {
      const { handIndex, slotIndex } = action;
      const hand = state.hands[handIndex];
      if (!hand) return { ...state, message: 'Invalid hand.' };
      const card = hand.cards[slotIndex];
      if (!card || !card.sticker) return { ...state, message: 'No sticker on that card.' };
      
      const stickerPool = [...state.stickerPool, card.sticker];
      const hands = state.hands.map((h, i) => {
        if (i !== handIndex) return h;
        return {
          ...h,
          cards: h.cards.map((c, si) => si === slotIndex ? { ...c, sticker: null } : c)
        };
      });
      
      return {
        ...state,
        hands,
        stickerPool,
        message: '',
        log: pushLog({ ...state }, `🔄 Removed ${card.sticker.name} sticker from ${card.rank}${card.suit}.`),
      };
    }

    case 'REMOVE_FROM_HAND': {
      const { handIndex, slotIndex } = action;
      const hand = state.hands[handIndex];
      if (!hand) return { ...state, message: 'Invalid hand.' };
      const card = hand.cards[slotIndex];
      if (!card) return { ...state, message: 'No card in that slot.' };
      
      const hands = state.hands.map((h, i) => 
        i === handIndex ? { ...h, cards: h.cards.map((c, si) => si === slotIndex ? null : c) } : h
      );
      const cardPool = [...state.cardPool, { ...card }];
      
      return {
        ...state,
        hands,
        cardPool,
        message: '',
        log: pushLog({ ...state }, `↩️ Removed ${card.rank}${card.suit} from Hand ${handIndex + 1}.`),
      };
    }

    case 'COMBINE_IN_POOL': {
      const { from, to } = action;
      const a = state.cardPool[from];
      const b = state.cardPool[to];
      if (!a || !b) return { ...state, message: 'Need two cards to combine.' };
      if (!isSameCard(a, b)) return { ...state, message: 'Cards must be identical (same rank + suit) to combine.' };
      if (a.level >= 3 && b.level >= 3) return { ...state, message: 'Both cards are already max level.' };

      const combined = combineCards(a, b);
      if (!combined) return { ...state, message: 'Cannot combine those cards.' };
      const cardPool = state.cardPool.filter((_, i) => i !== from && i !== to);
      cardPool.push(combined);
      
      return {
        ...state,
        cardPool,
        message: '',
        log: pushLog({ ...state }, `⭐ Combined into a Level ${combined.level} ${combined.rank}${combined.suit}!`),
      };
    }

    case 'COMBINE_IN_HAND': {
      const { handIndex, fromSlot, toSlot } = action;
      const hand = state.hands[handIndex];
      if (!hand) return { ...state, message: 'Invalid hand.' };
      const a = hand.cards[fromSlot];
      const b = hand.cards[toSlot];
      if (!a || !b) return { ...state, message: 'Need two cards to combine.' };
      if (!isSameCard(a, b)) return { ...state, message: 'Cards must be identical (same rank + suit) to combine.' };
      if (a.level >= 3 && b.level >= 3) return { ...state, message: 'Both cards are already max level.' };

      const combined = combineCards(a, b);
      if (!combined) return { ...state, message: 'Cannot combine those cards.' };
      const hands = state.hands.map((h, i) => {
        if (i !== handIndex) return h;
        const newCards = h.cards.map((c, si) => si === toSlot ? combined : (si === fromSlot ? null : c));
        return { ...h, cards: newCards };
      });
      
      return {
        ...state,
        hands,
        message: '',
        log: pushLog({ ...state }, `⭐ Combined into a Level ${combined.level} ${combined.rank}${combined.suit} in Hand ${handIndex + 1}!`),
      };
    }

    case 'SELECT_HAND': {
      return { ...state, selectedHandIndex: action.index, selectedCardPoolIndex: null, selectedShopIndex: null, message: '' };
    }

    case 'SELECT_CARD_POOL': {
      return { ...state, selectedCardPoolIndex: action.index, selectedHandIndex: null, selectedShopIndex: null, message: '' };
    }

    case 'SELECT_SHOP': {
      return { ...state, selectedShopIndex: action.index, selectedHandIndex: null, selectedCardPoolIndex: null, message: '' };
    }

    case 'CLEAR_SELECTION': {
      return { ...state, selectedHandIndex: null, selectedCardPoolIndex: null, selectedShopIndex: null, message: '' };
    }

    case 'READY': {
      // Check if player has at least one hand with at least 1 card
      const hasPlayableHand = state.hands.some(h => h.cards.some(c => c !== null));
      if (!hasPlayableHand) {
        return { ...state, message: 'You need at least one card in a hand to fight!' };
      }
      
      const opponentHand = generateOpponentHand(state.round);
      return {
        ...state,
        screen: 'combat',
        opponentHand,
        opponentName: opponentName(state.round),
        message: '',
        log: pushLog({ ...state }, `⚔️ Showdown vs ${opponentName(state.round)}!`),
      };
    }

    case 'RESOLVE_COMBAT': {
      // Player selects which hand to use (use first hand with at least 1 card)
      const playerHand = state.hands.find(h => h.cards.some(c => c !== null));
      
      if (!playerHand) {
        const result = {
          player: { tier: 'High Card', tiebreak: [0], name: 'High Card' },
          opponent: { tier: 'High Card', tiebreak: [14], name: 'High Card' },
          winner: 'opponent',
          damage: 1,
        };
        const newHp = state.hp - result.damage;
        return {
          ...state,
          lastResult: result,
          hp: newHp,
          screen: newHp <= 0 ? 'gameover' : 'shop',
          round: state.round + 1,
          gold: newHp > 0 ? goldForRound(state.round + 1) : state.gold,
          shop: newHp > 0 ? rollShop() : state.shop,
          message: newHp <= 0 ? 'You have been defeated. Run over.' : '',
          log: pushLog({ ...state }, `💀 No hand played — took ${result.damage} damage.`),
        };
      }

      // Evaluate only the cards that exist (1-5 cards)
      const playerCards = playerHand.cards.filter(c => c !== null);
      const result = playerCards.length > 0 ? evaluateHand(playerCards) : { tier: 'High Card', tiebreak: [0], name: 'High Card' };
      const opponentEval = evaluateHand(state.opponentHand);
      
      // Calculate sticker effects
      let bonusDamage = 0;
      let healAmount = 0;
      let damageReduction = 0;
      let shieldActive = false;
      
      playerHand.cards.forEach(card => {
        if (card.sticker) {
          const stickerValue = card.sticker.value;
          switch (card.sticker.type) {
            case 'heal':
              healAmount += stickerValue;
              break;
            case 'defend':
              damageReduction += stickerValue;
              break;
            case 'shield':
              shieldActive = true;
              break;
            case 'berserk':
              bonusDamage += stickerValue;
              break;
          }
        }
      });
      
      // Simple comparison using tier value
      const playerTierVal = HAND_TIERS.indexOf(result.tier);
      const opponentTierVal = HAND_TIERS.indexOf(opponentEval.tier);
      const winner = playerTierVal > opponentTierVal ? 'player' : playerTierVal < opponentTierVal ? 'opponent' : 'draw';
      
      let damage = 0;
      if (winner === 'player') {
        damage = TIER_DAMAGE[result.tier] + bonusDamage;
      } else if (winner === 'opponent') {
        damage = TIER_DAMAGE[opponentEval.tier];
        if (shieldActive) {
          damage = 0; // Shield blocks all damage
        } else {
          damage = Math.max(0, damage - damageReduction);
        }
      }
      
      const newHp = Math.max(0, Math.min(START_HP, state.hp + healAmount - damage));
      
      // Decrease durability of used hand
      const hands = state.hands.map((h, i) => {
        if (i !== state.hands.indexOf(playerHand)) return h;
        const newDurability = h.durability - 1;
        if (newDurability <= 0) {
          // Hand is destroyed, return empty hand
          return createEmptyHand();
        }
        return { ...h, durability: newDurability };
      });

      let screen = 'shop';
      let message = '';
      if (newHp <= 0) {
        screen = 'gameover';
        message = 'You have been defeated. Run over.';
      } else if (winner === 'player') {
        message = `You win! ${result.tier} beats ${opponentEval.tier} (−${damage} opponent HP).${healAmount > 0 ? ` Healed ${healAmount} HP!` : ''}`;
      } else if (winner === 'opponent') {
        message = `You lose — took ${damage} damage.${healAmount > 0 ? ` Healed ${healAmount} HP!` : ''}${shieldActive && damage === 0 ? ' Shield blocked damage!' : ''}`;
      } else {
        message = 'Draw — no damage either way.';
      }

      return {
        ...state,
        hands,
        lastResult: { player: result, opponent: opponentEval, winner, damage },
        hp: newHp,
        screen,
        round: state.round + 1,
        gold: newHp > 0 ? goldForRound(state.round + 1) : state.gold,
        shop: newHp > 0 ? rollShop() : state.shop,
        opponentHand: null,
        message,
        log: pushLog(
          { ...state },
          winner === 'player'
            ? `🏆 Win vs ${state.opponentName} (${result.tier} beats ${opponentEval.tier}).${healAmount > 0 ? ` Healed ${healAmount} HP.` : ''}`
            : winner === 'opponent'
            ? `💢 Loss vs ${state.opponentName} (-${damage} HP). ${result.tier} vs ${opponentEval.tier}.${shieldActive && damage === 0 ? ' Shield blocked!' : ''}`
            : `🤝 Draw vs ${state.opponentName} (${result.tier}).`
        ),
      };
    }

    case 'CONTINUE_AFTER_COMBAT': {
      return {
        ...state,
        screen: 'shop',
        round: state.round + 1,
        gold: goldForRound(state.round + 1),
        shop: rollShop(),
        opponentHand: null,
        message: '',
      };
    }

    case 'RESTART': {
      return initialState();
    }

    case 'GO_HOME': {
      return { ...initialState() };
    }

    default:
      return state;
  }
}

export function useGame() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);

  const actions = {
    startRun: useCallback(() => dispatch({ type: 'START_RUN' }), []),
    reroll: useCallback(() => dispatch({ type: 'REROLL' }), []),
    toggleFreeze: useCallback((index) => dispatch({ type: 'TOGGLE_FREEZE', index }), []),
    buy: useCallback((shopIndex) => dispatch({ type: 'BUY', shopIndex }), []),
    buySticker: useCallback((stickerIndex) => dispatch({ type: 'BUY_STICKER', stickerIndex }), []),
    sellFromPool: useCallback((poolIndex) => dispatch({ type: 'SELL_FROM_POOL', poolIndex }), []),
    assignToHand: useCallback((handIndex, poolIndex, slotIndex) => dispatch({ type: 'ASSIGN_TO_HAND', handIndex, poolIndex, slotIndex }), []),
    removeFromHand: useCallback((handIndex, slotIndex) => dispatch({ type: 'REMOVE_FROM_HAND', handIndex, slotIndex }), []),
    combineInPool: useCallback((from, to) => dispatch({ type: 'COMBINE_IN_POOL', from, to }), []),
    combineInHand: useCallback((handIndex, fromSlot, toSlot) => dispatch({ type: 'COMBINE_IN_HAND', handIndex, fromSlot, toSlot }), []),
    addStickerToCard: useCallback((handIndex, slotIndex, stickerIndex) => dispatch({ type: 'ADD_STICKER_TO_CARD', handIndex, slotIndex, stickerIndex }), []),
    removeSticker: useCallback((handIndex, slotIndex) => dispatch({ type: 'REMOVE_STICKER', handIndex, slotIndex }), []),
    selectHand: useCallback((index) => dispatch({ type: 'SELECT_HAND', index }), []),
    selectCardPool: useCallback((index) => dispatch({ type: 'SELECT_CARD_POOL', index }), []),
    selectShop: useCallback((index) => dispatch({ type: 'SELECT_SHOP', index }), []),
    selectSticker: useCallback((index) => dispatch({ type: 'SELECT_STICKER', index }), []),
    clearSelection: useCallback(() => dispatch({ type: 'CLEAR_SELECTION' }), []),
    ready: useCallback(() => dispatch({ type: 'READY' }), []),
    resolveCombat: useCallback(() => dispatch({ type: 'RESOLVE_COMBAT' }), []),
    continueAfterCombat: useCallback(() => dispatch({ type: 'CONTINUE_AFTER_COMBAT' }), []),
    restart: useCallback(() => dispatch({ type: 'RESTART' }), []),
    goHome: useCallback(() => dispatch({ type: 'GO_HOME' }), []),
  };

  return { state, actions };
}
