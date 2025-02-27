export interface TankStatsResponse {
  status: 'ok' | 'error';
  data: {
    [accountId: string]: Array<TankStats>;
  };
}

export interface TankStats {
  tank_id: number;
  all: {
    battles: number;
    wins: number;
    damage_dealt: number;
    max_frags: number;
  };
}

export interface Tank {
  tank_id: number;
  name: string;
  nation: string;
  tier: number;
  type: string;
  images: {
    preview: string;
    normal: string;
  };
  all: {
    battles: number;
    wins: number;
    damage_dealt: number;
    max_frags: number;
  };
}

export interface TankDeltaInterface {
  tank_id: number;
  tier: number;
  nation: string;
  type: string;
  images?: { preview: string, normal: string };
  name?: string;
  battles: number;
  wins: number;
  damageDealt: number;
  avgDamage: number;
  winRate: number;
  totalBattles?: number;
  totalWins?: number;
  totalWinRate?: number;
  totalAvgDamage?: number;
}

export type BattlesByTier = Record<number, number>;
export type BattlesByType = Record<string, number>;


