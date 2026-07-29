// Game state management via useReducer — implements the full SAP-style loop.

import { useReducer, useCallback } from 'react';
import { makeCard, fullDeck, shuffle, isSameCard, combineCards } from './cards.js';
import { showdown } from './poker.js';
import { generateOpponentHand, opponentName } from './opponent.js';

const BOARD_SIZE = 5;
const SHOP_SIZE = 5;
const BASE_GOLD = 10;
const BUY_COST = 3;
const REROLL_COST = 1;
const SELL_VALUE = 1;
const START_HP = 30;

// Economy constants exported for UI display
export const ECON = { BOARD_SIZE, SHOP_SIZE, BASE_GOLD, BUY_COST, REROLL_COST, SELL_VALUE, START_HP };

function goldForRound(round) {
  return BASE_GOLD + (round - 1); // +1 per round, SAP-style curve
}

function rollShop() {
  const deck = fullDeck();
  shuffle(deck);
  return deck.slice(0, SHOP_SIZE).map((card) => ({ ...card, frozen: false }));
}

function initialState() {
  return {
    screen: 'home',        // home | shop | combat | gameover | victory
    round: 1,
    hp: START_HP,
    gold: goldForRound(1),
    board: Array(BOARD_SIZE).fill(null),
    shop: rollShop(),
    opponentHand: null,
    opponentName: opponentName(1),
    lastResult: null,      // { player, opponent, winner, damage }
    combatResolved: false, // true once showdown has been resolved (stay on combat screen)
    log: [],
    selectedBoardSlot: null,
    selectedShopIndex: null,
    message: '',
  };
}

function pushLog(state, entry) {
  return [entry, ...state.log].slice(0, 30);
}

function reducer(state, action) {
  switch (action.type) {
    case 'START_RUN': {
      return { ...initialState(), screen: 'shop', log: pushLog(state, '🃏 A new run begins! Build your hand.') };
    }

    case 'REROLL': {
      if (state.gold < REROLL_COST) return { ...state, message: 'Not enough gold to reroll.' };
      // Keep frozen cards, reroll the rest
      const kept = state.shop.filter((c) => c && c.frozen);
      const need = SHOP_SIZE - kept.length;
      const fresh = rollShop().slice(0, need);
      const newShop = [...kept, ...fresh];
      while (newShop.length < SHOP_SIZE) newShop.push(null);
      return {
        ...state,
        gold: state.gold - REROLL_COST,
        shop: newShop,
        message: '',
        log: pushLog({ ...state }, '🎲 Rerolled the shop.'),
      };
    }

    case 'TOGGLE_FREEZE': {
      const { index } = action;
      const shop = state.shop.map((c, i) =>
        i === index && c ? { ...c, frozen: !c.frozen } : c
      );
      return { ...state, shop, message: '' };
    }

    case 'BUY': {
      const { shopIndex, boardSlot } = action;
      const card = state.shop[shopIndex];
      if (!card) return { ...state, message: 'No card there.' };
      if (state.gold < BUY_COST) return { ...state, message: 'Not enough gold to buy.' };
      if (state.board[boardSlot] !== null) {
        return { ...state, message: 'That board slot is occupied. Sell or pick an empty slot.' };
      }
      const board = state.board.slice();
      board[boardSlot] = { ...card, frozen: false };
      const shop = state.shop.slice();
      shop[shopIndex] = null;
      return {
        ...state,
        gold: state.gold - BUY_COST,
        board,
        shop,
        message: '',
        selectedShopIndex: null,
        log: pushLog({ ...state }, `💰 Bought ${card.rank}${card.suit} into slot ${boardSlot + 1}.`),
      };
    }

    case 'SELL': {
      const { boardSlot } = action;
      const card = state.board[boardSlot];
      if (!card) return { ...state, message: 'Nothing to sell in that slot.' };
      const board = state.board.slice();
      board[boardSlot] = null;
      return {
        ...state,
        gold: state.gold + SELL_VALUE,
        board,
        message: '',
        log: pushLog({ ...state }, `🪙 Sold ${card.rank}${card.suit} for ${SELL_VALUE}g.`),
      };
    }

    case 'SWAP': {
      // Free rearrange of two board slots
      const { from, to } = action;
      const board = state.board.slice();
      [board[from], board[to]] = [board[to], board[from]];
      return { ...state, board, message: '' };
    }

    case 'COMBINE': {
      // Combine two identical cards on the board into one leveled card in `to` slot
      const { from, to } = action;
      const a = state.board[from];
      const b = state.board[to];
      if (!a || !b) return { ...state, message: 'Need two cards to combine.' };
      if (!isSameCard(a, b)) return { ...state, message: 'Cards must be identical (same rank + suit) to combine.' };
      if (a.level >= 3 && b.level >= 3) return { ...state, message: 'Both cards are already max level.' };

      const combined = combineCards(a, b);
      if (!combined) return { ...state, message: 'Cannot combine those cards.' };
      const board = state.board.slice();
      board[to] = combined;
      board[from] = null;
      return {
        ...state,
        board,
        message: '',
        log: pushLog({ ...state }, `⭐ Combined into a Level ${combined.level} ${combined.rank}${combined.suit}!`),
      };
    }

    case 'SELECT_SHOP': {
      return { ...state, selectedShopIndex: action.index, message: '' };
    }

    case 'SELECT_BOARD': {
      return { ...state, selectedBoardSlot: action.slot, message: '' };
    }

    case 'CLEAR_SELECTION': {
      return { ...state, selectedShopIndex: null, selectedBoardSlot: null, message: '' };
    }

    case 'READY': {
      // Move to combat phase
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
      const playerCards = state.board.filter(Boolean);
      if (playerCards.length === 0) {
        // No cards = auto-loss, high card damage
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
          log: pushLog({ ...state }, `💀 No cards played — took ${result.damage} damage.`),
        };
      }

      const result = showdown(playerCards, state.opponentHand);
      const newHp = state.hp - (result.winner === 'opponent' ? result.damage : 0);

      let screen = 'shop';
      let message = '';
      if (newHp <= 0) {
        screen = 'gameover';
        message = 'You have been defeated. Run over.';
      } else if (result.winner === 'player') {
        message = `You win! Opponent takes ${result.damage} (no effect on their HP).`;
      } else if (result.winner === 'opponent') {
        message = `You lose — took ${result.damage} damage.`;
      } else {
        message = 'Draw — no damage either way.';
      }

      return {
        ...state,
        lastResult: result,
        hp: Math.max(0, newHp),
        screen,
        round: state.round + 1,
        gold: newHp > 0 ? goldForRound(state.round + 1) : state.gold,
        shop: newHp > 0 ? rollShop() : state.shop,
        opponentHand: null,
        message,
        log: pushLog(
          { ...state },
          result.winner === 'player'
            ? `🏆 Win vs ${state.opponentName} (${result.player.tier} beats ${result.opponent.tier}).`
            : result.winner === 'opponent'
            ? `💢 Loss vs ${state.opponentName} (-${result.damage} HP). ${result.player.tier} vs ${result.opponent.tier}.`
            : `🤝 Draw vs ${state.opponentName} (${result.player.tier}).`
        ),
      };
    }

    case 'CONTINUE_AFTER_COMBAT': {
      // Advance to next shop round (used if we want a separate "continue" button)
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
    buy: useCallback((shopIndex, boardSlot) => dispatch({ type: 'BUY', shopIndex, boardSlot }), []),
    sell: useCallback((boardSlot) => dispatch({ type: 'SELL', boardSlot }), []),
    swap: useCallback((from, to) => dispatch({ type: 'SWAP', from, to }), []),
    combine: useCallback((from, to) => dispatch({ type: 'COMBINE', from, to }), []),
    selectShop: useCallback((index) => dispatch({ type: 'SELECT_SHOP', index }), []),
    selectBoard: useCallback((slot) => dispatch({ type: 'SELECT_BOARD', slot }), []),
    clearSelection: useCallback(() => dispatch({ type: 'CLEAR_SELECTION' }), []),
    ready: useCallback(() => dispatch({ type: 'READY' }), []),
    resolveCombat: useCallback(() => dispatch({ type: 'RESOLVE_COMBAT' }), []),
    continueAfterCombat: useCallback(() => dispatch({ type: 'CONTINUE_AFTER_COMBAT' }), []),
    restart: useCallback(() => dispatch({ type: 'RESTART' }), []),
    goHome: useCallback(() => dispatch({ type: 'GO_HOME' }), []),
  };

  return { state, actions };
}