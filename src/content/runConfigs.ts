import type { BattleConfig } from '../domain/types'

export const runBattleConfigs: BattleConfig[] = [
  {
    id: 'battle-1',
    enemyId: 'enemy-grinder-1',
    type: 'Standard',
  },
  {
    id: 'battle-2',
    enemyId: 'enemy-gambler-1',
    type: 'Standard',
  },
  {
    id: 'battle-3',
    enemyId: 'enemy-suit-1',
    type: 'Standard',
  },
  {
    id: 'battle-4',
    enemyId: 'enemy-boss-1',
    type: 'Boss',
  },
]