import { useState, useEffect } from 'react';
import { useGame, ECON, STICKERS } from './game/useGame.js';
import { evaluateHand, TIER_DAMAGE, HAND_TIERS } from './game/poker.js';
import { SUIT_COLOR, makeCard } from './game/cards.js';
import { SvgCard, SvgCardRow } from './components/SvgCard.jsx';
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

// Sticker Peel Modal Component
function StickerPeelModal({ card, handIndex, slotIndex, onSelect, onClose }) {
  const [isPeeling, setIsPeeling] = useState(false);
  const [selectedSticker, setSelectedSticker] = useState(null);

  const stickerTypes = Object.values(STICKERS);

  function handleStickerClick(sticker) {
    setSelectedSticker(sticker);
    setIsPeeling(true);
    setTimeout(() => {
      onSelect(handIndex, slotIndex, sticker.id);
      onClose();
    }, 800);
  }

  return (
    <div className="sticker-modal-overlay" onClick={onClose}>
      <div className="sticker-modal" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 16px', color: 'var(--yellow)' }}>Choose a Sticker</h3>
        <div className="sticker-grid">
          {stickerTypes.map((sticker) => (
            <div
              key={sticker.id}
              className={`sticker-option ${selectedSticker?.id === sticker.id ? 'selected' : ''}`}
              onClick={() => handleStickerClick(sticker)}
            >
              <div className="sticker-icon">{sticker.icon}</div>
              <div className="sticker-name">{sticker.name}</div>
              <div className="sticker-desc">{sticker.description}</div>
            </div>
          ))}
        </div>
        <button className="btn btn-sm" onClick={onClose} style={{ marginTop: 16 }}>
          Cancel
        </button>
      </div>
    </div>
  );
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
        A poker auto-battler roguelite. Build up to 5 hands across rounds: roll the shop,
        buy cards into your pool, assign them to hands, and combine duplicates to level them up.
        Each hand has limited uses — when it breaks, you'll need to build a new one. Each round
        your best hand faces a computer opponent in a poker showdown — the better hand wins, the
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
          <li><b style={{ color: 'var(--yellow)' }}>Buy</b> cards from the shop into your card pool (3 gold each).</li>
          <li><b style={{ color: 'var(--cyan)' }}>Reroll</b> the shop for new offerings (1 gold). <b style={{ color: 'var(--cyan)' }}>Freeze</b> cards to keep them across rerolls.</li>
          <li><b style={{ color: 'var(--green)' }}>Assign</b> cards from your pool to hand slots. Click a hand, then click a pool card.</li>
          <li><b style={{ color: 'var(--purple)' }}>Combine</b> two identical cards (same rank + suit) to level them up.</li>
          <li><b style={{ color: 'var(--pink)' }}>Remove</b> cards from hands back to pool, or <b style={{ color: 'var(--pink)' }}>Sell</b> pool cards for gold.</li>
          <li>Hands have <b style={{ color: 'var(--pink)' }}>3 uses</b> before breaking. Build multiple hands to last the run.</li>
          <li>When ready, hit <b style={{ color: 'var(--yellow)' }}>Showdown</b> — your best 5-card hand is scored vs the opponent's.</li>
          <li>Higher poker hand wins. Loser takes damage based on the winner's hand tier. Don't hit 0 HP.</li>
        </ul>
      </div>
    </div>
  );
}

// ---------- Shop Screen ----------
function ShopScreen({ state, actions }) {
  const { hands, cardPool, shop, gold, selectedHandIndex, selectedCardPoolIndex, selectedShopIndex, message } = state;

  function handleShopClick(index) {
    const card = state.shop.cards[index];
    if (!card) return;
    if (selectedShopIndex === index) {
      actions.clearSelection();
    } else {
      actions.selectShop(index);
    }
  }

  function handleHandClick(handIndex) {
    if (selectedHandIndex === handIndex) {
      actions.clearSelection();
    } else {
      actions.selectHand(handIndex);
    }
  }

  const [stickerModal, setStickerModal] = useState(null); // { handIndex, slotIndex }

  function handleHandSlotClick(handIndex, slotIndex) {
    const hand = hands[handIndex];
    const card = hand.cards[slotIndex];
    
    // If card pool card selected, assign to this slot
    if (selectedCardPoolIndex !== null && card === null) {
      actions.assignToHand(handIndex, selectedCardPoolIndex, slotIndex);
      return;
    }
    
    // If sticker selected and clicking a card without sticker, apply it
    if (selectedStickerIndex !== null && card !== null && !card.sticker) {
      actions.addStickerToCard(handIndex, slotIndex, selectedStickerIndex);
      actions.clearSelection();
      return;
    }
    
    // If clicking a card in hand with sticker, remove it
    if (card !== null && card.sticker) {
      actions.removeSticker(handIndex, slotIndex);
    }
  }

  function handleStickerSelect(handIndex, slotIndex, stickerType) {
    actions.addSticker(handIndex, slotIndex, stickerType);
  }

  function handleCardPoolClick(index) {
    if (selectedCardPoolIndex === index) {
      actions.clearSelection();
    } else {
      actions.selectCardPool(index);
    }
  }

  function handleCardPoolCardClick(poolIndex) {
    // If hand selected, assign card to first empty slot in that hand
    if (selectedHandIndex !== null) {
      const hand = hands[selectedHandIndex];
      const emptySlot = hand.cards.findIndex(c => c === null);
      if (emptySlot !== -1) {
        actions.assignToHand(selectedHandIndex, poolIndex, emptySlot);
      } else {
        actions.clearSelection();
      }
    } else {
      handleCardPoolClick(poolIndex);
    }
  }

  return (
    <>
      <div className="panel">
        <h2>Your Hands — {hands.length} Hands</h2>
        <div className="hands-grid">
          {hands.map((hand, handIndex) => {
            const filledSlots = hand.cards.filter(Boolean).length;
            const isComplete = filledSlots === 5;
            const handEval = isComplete ? evaluateHand(hand.cards) : null;
            
            return (
              <div
                key={hand.id}
                className={`hand-card ${isComplete ? 'complete' : ''} ${selectedHandIndex === handIndex ? 'selected' : ''}`}
                onClick={() => handleHandClick(handIndex)}
              >
                <div className="hand-header">
                  <span className="hand-label">Hand {handIndex + 1}</span>
                  <span className="hand-durability">
                    {'♥'.repeat(hand.durability)}{'♡'.repeat(hand.maxDurability - hand.durability)}
                    <span className="muted small"> ({hand.durability}/{hand.maxDurability})</span>
                  </span>
                </div>
                <div className="hand-slots">
                  {hand.cards.map((card, slotIndex) => (
                    <div
                      key={slotIndex}
                      className={`hand-slot ${card ? '' : 'empty'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleHandSlotClick(handIndex, slotIndex);
                      }}
                    >
                      <SvgCard card={card} showSticker={true} />
                    </div>
                  ))}
                </div>
                {handEval && (
                  <div className="hand-eval" style={{ color: 'var(--green)' }}>
                    {handEval.tier}
                  </div>
                )}
                {!isComplete && filledSlots > 0 && (
                  <div className="muted small">{filledSlots}/5 cards</div>
                )}
              </div>
            );
          })}
        </div>
        <div className="muted small" style={{ marginTop: 12 }}>
          Click a hand to select it, then click cards in the pool to add them. Click cards in hands to remove them.
          Hands have {ECON.HAND_DURABILITY} uses before breaking. Complete hands (5 cards) can be used in combat.
        </div>
      </div>

      {cardPool.length > 0 && (
        <div className="panel">
          <h2>Card Pool ({cardPool.length} cards)</h2>
          <div className="card-pool-grid">
            {cardPool.map((card, index) => (
              <div
                key={index}
                className={`pool-card ${selectedCardPoolIndex === index ? 'selected' : ''}`}
                onClick={() => handleCardPoolCardClick(index)}
              >
                <SvgCard card={card} showSticker={true} />
                <div className="pool-card-actions">
                  <button
                    className="btn btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      actions.sellFromPool(index);
                    }}
                  >
                    Sell (+{ECON.SELL_VALUE}g)
                  </button>
                </div>
              </div>
            ))}
          </div>
          {selectedCardPoolIndex !== null && (
            <div className="muted small center">
              Card selected — click a hand to add it to the first empty slot.
            </div>
          )}
        </div>
      )}

      {state.stickerPool.length > 0 && (
        <div className="panel">
          <h2>Sticker Pool ({state.stickerPool.length} stickers)</h2>
          <div className="sticker-pool-grid">
            {state.stickerPool.map((sticker, index) => (
              <div
                key={index}
                className={`sticker-pool-item ${selectedStickerIndex === index ? 'selected' : ''}`}
                onClick={() => actions.selectSticker(index)}
              >
                <div className="sticker-icon-large">{sticker.icon}</div>
                <div className="sticker-name">{sticker.name}</div>
                <div className="sticker-desc">{sticker.description}</div>
              </div>
            ))}
          </div>
          {selectedStickerIndex !== null && (
            <div className="muted small center">
              Sticker selected — click a card in a hand to apply it.
            </div>
          )}
        </div>
      )}

      <div className="panel">
        <h2>Shop</h2>
        <div className="shop-section">
          <h3 style={{ margin: '0 0 12px', fontSize: '14px', color: 'var(--cyan)' }}>Cards</h3>
          <div className="shop-grid">
            {state.shop.cards.map((card, i) => (
              <div
                key={i}
                className={`shop-slot ${card ? '' : 'empty'} ${selectedShopIndex === i ? 'selected' : ''} ${card && card.frozen ? 'frozen' : ''}`}
                onClick={() => handleShopClick(i)}
              >
                <SvgCard card={card} faded={!card} showSticker={false} />
                {card ? (
                  <>
                    <div className="price">{ECON.BUY_COST} gold</div>
                    <div className="row">
                      <button
                        className="btn btn-sm btn-primary"
                        disabled={gold < ECON.BUY_COST}
                        onClick={(e) => {
                          e.stopPropagation();
                          actions.buy(i);
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
        </div>
        
        <div className="shop-section" style={{ marginTop: 20 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '14px', color: 'var(--purple)' }}>Stickers ({ECON.STICKER_COST}g each)</h3>
          <div className="sticker-shop-grid">
            {state.shop.stickers.map((sticker, i) => (
              <div
                key={i}
                className={`sticker-shop-item ${selectedStickerIndex === i ? 'selected' : ''}`}
                onClick={() => actions.selectSticker(i)}
              >
                <div className="sticker-icon-large">{sticker.icon}</div>
                <div className="sticker-name">{sticker.name}</div>
                <div className="sticker-desc">{sticker.description}</div>
                <button
                  className="btn btn-sm btn-primary"
                  disabled={gold < ECON.STICKER_COST}
                  onClick={(e) => {
                    e.stopPropagation();
                    actions.buySticker(i);
                  }}
                >
                  Buy ({ECON.STICKER_COST}g)
                </button>
              </div>
            ))}
          </div>
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
      </div>

      <DamageTable />
      <Log log={state.log} />
      {stickerModal && (
        <StickerPeelModal
          card={hands[stickerModal.handIndex].cards[stickerModal.slotIndex]}
          handIndex={stickerModal.handIndex}
          slotIndex={stickerModal.slotIndex}
          onSelect={handleStickerSelect}
          onClose={() => setStickerModal(null)}
        />
      )}
    </>
  );
}

// ---------- Combat Screen ----------
function CombatScreen({ state, actions }) {
  const { hands, opponentHand, opponentName, lastResult } = state;
  const [revealed, setRevealed] = useState(false);
  const [resolved, setResolved] = useState(false);

  // Auto-reveal opponent after a beat
  useEffect(() => {
    setRevealed(false);
    setResolved(false);
    const t = setTimeout(() => setRevealed(true), 600);
    return () => clearTimeout(t);
  }, [state.round]);

  // Find the first complete hand for display
  const playerHand = hands.find(h => h.cards.every(c => c !== null));
  const playerCards = playerHand ? playerHand.cards.filter(Boolean) : [];
  const playerEval = playerCards.length === 5 ? evaluateHand(playerCards) : null;
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
            <SvgCardRow cards={opponentHand} showHand={false} highlight={winner === 'opponent'} />
          ) : (
            <SvgCardRow cards={[null, null, null, null, null]} showHand={false} />
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
        <div className="hand-label">
          Your Hand {playerHand && <span className="muted small">— Hand {hands.indexOf(playerHand) + 1} ({playerHand.durability} uses left)</span>}
        </div>
        <div style={{ height: 8 }} />
        <SvgCardRow cards={playerCards} showHand={true} highlight={winner === 'player'} />
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