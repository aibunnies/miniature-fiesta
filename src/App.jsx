import { useState, useEffect } from 'react';
import { useGame, ECON } from './game/useGame.js';
import { evaluateHand, TIER_DAMAGE, HAND_TIERS } from './game/poker.js';
import { SUIT_COLOR, makeCard } from './game/cards.js';
import { AsciiCard, AsciiCardRow, cardLines } from './components/AsciiCard.jsx';
import ASCIIText from './components/ASCIIText.jsx';
import GradientBlinds from './components/GradientBlinds.jsx';

const SUIT_CLASS = {
  '♥': 'card-wrap-heart',
  '♦': 'card-wrap-diamond',
  '♣': 'card-wrap-club',
  '♠': 'card-wrap-spade',
};

function suitClass(card) {
  return card ? SUIT_CLASS[card.suit] || '' : '';
}

// ---------- Top Bar ----------
function TopBar({ state, onHome }) {
  const hpPct = Math.max(0, (state.hp / ECON.START_HP) * 100);
  return (
    <div className="topbar">
      <div className="brand">
        <span className="logo">🃏</span>
        <span>Miniature Fiesta</span>
        <span className="muted small">· Poker Auto-Battler</span>
      </div>
      <div className="stats">
        <div className="stat round">
          <span className="label">Round</span>
          <span className="value">{state.round}</span>
        </div>
        <div className="stat hp">
          <span className="label">HP</span>
          <span className="value">{state.hp}</span>
          <div className="hp-bar"><div className="fill" style={{ width: `${hpPct}%` }} /></div>
        </div>
        <div className="stat gold">
          <span className="label">Gold</span>
          <span className="value">{state.gold}</span>
        </div>
        {state.screen !== 'home' && (
          <button className="btn btn-sm btn-ghost" onClick={onHome}>Home</button>
        )}
      </div>
    </div>
  );
}

// ---------- Home Screen ----------
function HomeScreen({ onStart }) {
  // Preview cards for the hero
  const previewCards = [
    makeCard('A', '♥', 1),
    makeCard('K', '♥', 1),
    makeCard('Q', '♥', 1),
    makeCard('J', '♥', 1),
    makeCard('10', '♥', 1),
  ];

  return (
    <div className="home">
      <div className="home-hero">
        <div style={{ position: 'relative', margin: '0 auto' }}>
          <GradientBlinds
            gradientColors={['#FF9FFC', '#5227FF']}
            angle={0}
            noise={0.3}
            blindCount={16}
            blindMinWidth={50}
            mouseDampening={0.15}
            mirrorGradient={false}
            spotlightRadius={0.5}
            spotlightSoftness={1}
            spotlightOpacity={1}
            distortAmount={0}
            shineDirection="left"
          />
          <ASCIIText text="P0KeR?" enableWaves={true} asciiFontSize={5} textFontSize={200} />
        </div>
      </div>
      <h1 className="home-title">P0KeR?</h1>
      <p className="home-sub">
        A poker auto-battler roguelite. Build a 5-card hand across rounds: roll the shop,
        buy cards, freeze duplicates, and combine them into leveled powerhouses. Each round
        your hand faces a computer opponent in a poker showdown — the better hand wins, the
        loser takes damage. Survive as long as you can.
      </p>

      <div className="row center">
        <button className="btn btn-primary btn-lg" onClick={onStart}>
          ▶ Start Run
        </button>
      </div>

      <div className="panel" style={{ maxWidth: 720, margin: '28px auto 0' }}>
        <h2>How to Play</h2>
        <ul className="muted small" style={{ lineHeight: 1.8, textAlign: 'left', maxWidth: 640, margin: '0 auto' }}>
          <li><b style={{ color: 'var(--yellow)' }}>Buy</b> cards from the shop into your 5 board slots (3 gold each).</li>
          <li><b style={{ color: 'var(--cyan)' }}>Reroll</b> the shop for new offerings (1 gold). <b style={{ color: 'var(--cyan)' }}>Freeze</b> cards to keep them across rerolls.</li>
          <li><b style={{ color: 'var(--green)' }}>Combine</b> two identical cards (same rank + suit) to level them up and free a slot.</li>
          <li><b style={{ color: 'var(--pink)' }}>Sell</b> board cards for a partial refund.</li>
          <li>When ready, hit <b style={{ color: 'var(--yellow)' }}>Showdown</b> — your 5-card hand is scored vs the opponent's.</li>
          <li>Higher poker hand wins. Loser takes damage based on the winner's hand tier. Don't hit 0 HP.</li>
        </ul>
      </div>
    </div>
  );
}

// ---------- Shop Screen ----------
function ShopScreen({ state, actions }) {
  const { board, shop, gold, selectedShopIndex, selectedBoardSlot, message } = state;

  const filledSlots = board.filter(Boolean).length;
  const playerCards = board.filter(Boolean);
  const currentEval = playerCards.length === 5 ? evaluateHand(playerCards) : null;

  function handleShopClick(index) {
    const card = shop[index];
    if (!card) return;
    if (selectedShopIndex === index) {
      actions.clearSelection();
    } else {
      actions.selectShop(index);
    }
  }

  function handleBoardClick(slot) {
    // If a shop card is selected and this slot is empty, buy into it
    if (selectedShopIndex !== null && board[slot] === null) {
      actions.buy(selectedShopIndex, slot);
      return;
    }
    // If a board card is selected, either swap or combine
    if (selectedBoardSlot !== null && selectedBoardSlot !== slot) {
      const a = board[selectedBoardSlot];
      const b = board[slot];
      if (a && b) {
        // Try combine first if identical, else swap
        if (a.rank === b.rank && a.suit === b.suit) {
          actions.combine(selectedBoardSlot, slot);
        } else {
          actions.swap(selectedBoardSlot, slot);
        }
        return;
      }
    }
    if (selectedBoardSlot === slot) {
      actions.clearSelection();
    } else {
      actions.selectBoard(slot);
    }
  }

  return (
    <>
      <div className="panel">
        <h2>Your Hand — 5 Slots {currentEval && <span style={{ color: 'var(--green)' }}>· {currentEval.tier}</span>}</h2>
        <div className="board-wrap">
          <div className="board-slots">
            {board.map((card, i) => (
              <div
                key={i}
                className={`board-slot ${card ? '' : 'empty'} ${selectedBoardSlot === i ? 'selected' : ''}`}
                onClick={() => handleBoardClick(i)}
              >
                <div className="slot-label">Slot {i + 1}</div>
                <div className={suitClass(card)}>
                  <AsciiCard card={card} selected={selectedBoardSlot === i} />
                </div>
                {card && (
                  <div className="slot-actions">
                    <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); actions.sell(i); }}>
                      Sell (+{ECON.SELL_VALUE}g)
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          {currentEval && (
            <div className="muted small">
              Current hand: <b style={{ color: 'var(--green)' }}>{currentEval.tier}</b>
              {filledSlots < 5 && <span> — fill all 5 slots for a complete hand</span>}
            </div>
          )}
        </div>
      </div>

      <div className="panel">
        <h2>Shop</h2>
        <div className="shop-grid">
          {shop.map((card, i) => (
            <div
              key={i}
              className={`shop-slot ${card ? '' : 'empty'} ${selectedShopIndex === i ? 'selected' : ''} ${card && card.frozen ? 'frozen' : ''}`}
              onClick={() => handleShopClick(i)}
            >
              <div className={suitClass(card)}>
                <AsciiCard card={card} faded={!card} />
              </div>
              {card ? (
                <>
                  <div className="price">{ECON.BUY_COST} gold</div>
                  <div className="row">
                    <button
                      className="btn btn-sm btn-primary"
                      disabled={gold < ECON.BUY_COST || filledSlots >= 5}
                      onClick={(e) => {
                        e.stopPropagation();
                        // Find first empty slot
                        const empty = board.findIndex((b) => b === null);
                        if (empty !== -1) actions.buy(i, empty);
                      }}
                    >
                      Buy
                    </button>
                    <button
                      className="btn btn-sm"
                      onClick={(e) => { e.stopPropagation(); actions.toggleFreeze(i); }}
                    >
                      {card.frozen ? '❄ Unfreeze' : '❄ Freeze'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="muted small">sold</div>
              )}
            </div>
          ))}
        </div>
        <div className="panel-actions center">
          <button className="btn btn-gold" onClick={actions.reroll} disabled={gold < ECON.REROLL_COST}>
            🎲 Reroll ({ECON.REROLL_COST}g)
          </button>
          <button className="btn btn-primary btn-lg" onClick={actions.ready}>
            ⚔️ Ready for Showdown
          </button>
        </div>
        <div className="message">{message}</div>
        {selectedShopIndex !== null && (
          <div className="muted small center">
            Shop card selected — click an empty board slot to buy it into that slot.
          </div>
        )}
        {selectedBoardSlot !== null && (
          <div className="muted small center">
            Board card selected — click another board card to <b>combine</b> (if identical) or <b>swap</b>.
          </div>
        )}
      </div>

      <DamageTable />
      <Log log={state.log} />
    </>
  );
}

// ---------- Combat Screen ----------
function CombatScreen({ state, actions }) {
  const { board, opponentHand, opponentName, lastResult } = state;
  const [revealed, setRevealed] = useState(false);
  const [resolved, setResolved] = useState(false);

  // Auto-reveal opponent after a beat
  useEffect(() => {
    setRevealed(false);
    setResolved(false);
    const t = setTimeout(() => setRevealed(true), 600);
    return () => clearTimeout(t);
  }, [state.round]);

  const playerCards = board.filter(Boolean);
  const playerEval = playerCards.length > 0 ? evaluateHand(playerCards) : null;
  const opponentEval = revealed && opponentHand ? evaluateHand(opponentHand) : null;

  function handleResolve() {
    actions.resolveCombat();
    setResolved(true);
  }

  const winner = lastResult?.winner;

  return (
    <div className="combat-arena">
      <div className="panel" style={{ width: '100%', maxWidth: 900 }}>
        <div className="hand-label">Opponent — {opponentName}</div>
        <div style={{ height: 8 }} />
        <div className={revealed ? '' : 'card-wrap-heart'} style={{ opacity: revealed ? 1 : 0.5 }}>
          {revealed ? (
            <AsciiCardRow cards={opponentHand} showHand={false} highlight={winner === 'opponent'} />
          ) : (
            <AsciiCardRow cards={[null, null, null, null, null]} showHand={false} />
          )}
        </div>
        {opponentEval && (
          <div className={`hand-tier ${winner === 'opponent' ? 'win' : winner === 'player' ? 'lose' : 'draw'}`}>
            {opponentEval.tier}
          </div>
        )}
        {!revealed && <div className="muted small">Opponent's hand is hidden...</div>}
      </div>

      <div className="vs-divider">V S</div>

      <div className="panel" style={{ width: '100%', maxWidth: 900 }}>
        <div className="hand-label">Your Hand</div>
        <div style={{ height: 8 }} />
        <AsciiCardRow cards={playerCards} showHand={true} highlight={winner === 'player'} />
        {playerEval && (
          <div className={`hand-tier ${winner === 'player' ? 'win' : winner === 'opponent' ? 'lose' : 'draw'}`}>
            {playerEval.tier}
          </div>
        )}
      </div>

      {!resolved ? (
        <button className="btn btn-primary btn-lg" onClick={handleResolve} disabled={!revealed}>
          {revealed ? '🃏 Reveal & Resolve' : '...'}
        </button>
      ) : (
        <>
          {lastResult && (
            <div className={`result-banner ${winner}`}>
              {winner === 'player' && `🏆 You Win! ${lastResult.player.tier} beats ${lastResult.opponent.tier}`}
              {winner === 'opponent' && `💢 You Lose — ${lastResult.opponent.tier} beats ${lastResult.player.tier} (−${lastResult.damage} HP)`}
              {winner === 'draw' && `🤝 Draw — both ${lastResult.player.tier}`}
            </div>
          )}
          {state.hp > 0 ? (
            <button className="btn btn-primary btn-lg" onClick={actions.continueAfterCombat}>
              ▶ Next Round
            </button>
          ) : null}
        </>
      )}
    </div>
  );
}

// ---------- Game Over ----------
function GameOverScreen({ state, onRestart, onHome }) {
  return (
    <div className="gameover">
      <h1>💀 Game Over</h1>
      <p>You survived <b style={{ color: 'var(--cyan)' }}>{state.round - 1}</b> rounds.</p>
      {state.lastResult && (
        <div className="muted small">
          Final showdown: {state.lastResult.player.tier} vs {state.lastResult.opponent.tier}
        </div>
      )}
      <div className="row center" style={{ marginTop: 24 }}>
        <button className="btn btn-primary btn-lg" onClick={onRestart}>↻ New Run</button>
        <button className="btn btn-lg" onClick={onHome}>Home</button>
      </div>
    </div>
  );
}

// ---------- Damage Table ----------
function DamageTable() {
  return (
    <div className="panel">
      <h2>Damage Table</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
        {HAND_TIERS.slice().reverse().map((tier) => (
          <div key={tier} className="stat" style={{ justifyContent: 'space-between' }}>
            <span className="label">{tier}</span>
            <span className="value" style={{ color: 'var(--pink)' }}>{TIER_DAMAGE[tier]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Log ----------
function Log({ log }) {
  return (
    <div className="panel">
      <h2>Battle Log</h2>
      <div className="log">
        {log.map((entry, i) => (
          <div key={i} className="entry">{entry}</div>
        ))}
      </div>
    </div>
  );
}

// ---------- App ----------
export default function App() {
  const { state, actions } = useGame();

  return (
    <div className="app">
      <TopBar state={state} onHome={actions.goHome} />
      {state.screen === 'home' && <HomeScreen onStart={actions.startRun} />}
      {state.screen === 'shop' && <ShopScreen state={state} actions={actions} />}
      {state.screen === 'combat' && <CombatScreen state={state} actions={actions} />}
      {state.screen === 'gameover' && (
        <GameOverScreen state={state} onRestart={actions.restart} onHome={actions.goHome} />
      )}
    </div>
  );
}