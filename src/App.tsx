import { useState } from 'react'
import type { Battle, Card, Run } from './domain/types'
import { startRun, advanceAfterBattle, generateCardRewards } from './domain/run'
import { nextRound } from './domain/battle'
import { cardPool } from './content/cards'

type Screen = 'MainMenu' | 'Battle' | 'Reward' | 'Summary'

interface LastRoundInfo {
  playerDamage: number
  enemyDamage: number
  playerHPAfter: number
  enemyHPAfter: number
  playerHandRank: string
  enemyHandRank: string
}

function App() {
  const [screen, setScreen] = useState<Screen>('MainMenu')
  const [run, setRun] = useState<Run | null>(null)
  const [battle, setBattle] = useState<Battle | null>(null)
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([])
  const [lastRound, setLastRound] = useState<LastRoundInfo | null>(null)
  const [rewards, setRewards] = useState<Card[]>([])
  const [runResult, setRunResult] = useState<'Won' | 'Lost' | null>(null)

  const startNewRun = () => {
    const { run: newRun, battle: newBattle } = startRun()
    setRun(newRun)
    setBattle(newBattle)
    setSelectedCardIds([])
    setLastRound(null)
    setRewards([])
    setRunResult(null)
    setScreen('Battle')
  }

  const currentPlayerHand: Card[] =
    battle?.player.deck.hand ?? []

  const toggleCardSelection = (cardId: string) => {
    setSelectedCardIds((prev) => {
      if (prev.includes(cardId)) {
        return prev.filter((id) => id !== cardId)
      }
      if (prev.length >= 5) return prev
      return [...prev, cardId]
    })
  }

  const handleConfirmHand = () => {
    if (!battle || !run) return
    const committed = currentPlayerHand.filter((c) =>
      selectedCardIds.includes(c.id),
    )
    if (committed.length === 0) return

    const { battle: updatedBattle, outcome } = nextRound(
      battle,
      committed,
    )

    setBattle(updatedBattle)
    setSelectedCardIds([])
    setLastRound({
      playerDamage: outcome.playerDamageDealt,
      enemyDamage: outcome.enemyDamageDealt,
      playerHPAfter: outcome.playerHPAfter,
      enemyHPAfter: outcome.enemyHPAfter,
      playerHandRank: outcome.playerHand.rank,
      enemyHandRank: outcome.enemyHand.rank,
    })

    // Check battle end
    const playerDead = outcome.playerHPAfter <= 0
    const enemyDead = outcome.enemyHPAfter <= 0

    if (!playerDead && !enemyDead) {
      return
    }

    // Battle over
    const didPlayerWin = !playerDead && enemyDead
    const updatedRun = advanceAfterBattle(run, didPlayerWin ? 'Win' : 'Loss')
    setRun(updatedRun)

    if (!didPlayerWin) {
      setRunResult('Lost')
      setScreen('Summary')
      return
    }

    // Player won this battle
    const isLastBattle =
      updatedRun.currentBattleIndex >= updatedRun.battles.length

    if (isLastBattle) {
      setRunResult('Won')
      setScreen('Summary')
    } else {
      // Generate rewards
      const newRewards = generateCardRewards(
        updatedBattle.player.deck,
        cardPool,
        3,
      ) as Card[]
      setRewards(newRewards)
      setScreen('Reward')
    }
  }

  const handlePickReward = (card: Card) => {
    if (!battle) return
    // Add card to player's draw pile
    const newDrawPile = [...battle.player.deck.drawPile, card]
    const updatedPlayer = {
      ...battle.player,
      deck: {
        ...battle.player.deck,
        drawPile: newDrawPile,
      },
    }
    const updatedBattle: Battle = { ...battle, player: updatedPlayer }
    setBattle(updatedBattle)
    setScreen('Battle')
  }

  const goToMainMenu = () => {
    setScreen('MainMenu')
    setRun(null)
    setBattle(null)
    setSelectedCardIds([])
    setLastRound(null)
    setRewards([])
    setRunResult(null)
  }

  return (
    <div style={{ padding: '1rem', fontFamily: 'sans-serif' }}>
      {screen === 'MainMenu' && (
        <div>
          <h1>ANTE (MVP)</h1>
          <button onClick={startNewRun}>Start Run</button>
        </div>
      )}

      {screen === 'Battle' && battle && run && (
        <div>
          <h2>
            Battle {run.currentBattleIndex + 1} / {run.battles.length}
          </h2>
          <div style={{ display: 'flex', gap: '2rem' }}>
            <div>
              <h3>Player</h3>
              <p>
                HP: {battle.player.hpCurrent} / {battle.player.hpMax}
              </p>
            </div>
            <div>
              <h3>Enemy: {battle.enemy.name}</h3>
              <p>
                HP: {battle.enemy.hpCurrent} / {battle.enemy.hpMax}
              </p>
            </div>
          </div>

          <h3>Your Hand</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {currentPlayerHand.map((card) => {
              const selected = selectedCardIds.includes(card.id)
              return (
                <button
                  key={card.id}
                  onClick={() => toggleCardSelection(card.id)}
                  style={{
                    border: selected ? '2px solid #0f0' : '1px solid #ccc',
                    padding: '0.5rem',
                    minWidth: '6rem',
                  }}
                >
                  <div>{card.name}</div>
                  <div>
                    {card.rank} of {card.suit}
                  </div>
                </button>
              )
            })}
          </div>

          <button
            onClick={handleConfirmHand}
            disabled={selectedCardIds.length === 0}
            style={{ marginTop: '1rem' }}
          >
            Confirm Hand
          </button>

          {lastRound && (
            <div style={{ marginTop: '1rem' }}>
              <h3>Last Round</h3>
              <p>
                Player hand: {lastRound.playerHandRank}, dealt{' '}
                {lastRound.playerDamage} damage
              </p>
              <p>
                Enemy hand: {lastRound.enemyHandRank}, dealt{' '}
                {lastRound.enemyDamage} damage
              </p>
              <p>
                Player HP: {lastRound.playerHPAfter} /{' '}
                {battle.player.hpMax}
              </p>
              <p>
                Enemy HP: {lastRound.enemyHPAfter} / {battle.enemy.hpMax}
              </p>
            </div>
          )}
        </div>
      )}

      {screen === 'Reward' && rewards.length > 0 && (
        <div>
          <h2>Choose a Reward</h2>
          <div style={{ display: 'flex', gap: '1rem' }}>
            {rewards.map((card) => (
              <button
                key={card.id}
                onClick={() => handlePickReward(card)}
                style={{ padding: '0.5rem', minWidth: '6rem' }}
              >
                <div>{card.name}</div>
                <div>
                  {card.rank} of {card.suit}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {screen === 'Summary' && (
        <div>
          <h2>Run Summary</h2>
          <p>
            Result:{' '}
            {runResult === 'Won'
              ? 'Victory'
              : runResult === 'Lost'
              ? 'Defeat'
              : 'Unknown'}
          </p>
          <button onClick={goToMainMenu}>Back to Main Menu</button>
          <button onClick={startNewRun} style={{ marginLeft: '0.5rem' }}>
            Play Again
          </button>
        </div>
      )}
    </div>
  )
}

export default App