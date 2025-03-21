export interface TankStatsResponse {
  status: 'ok' | 'error';
  data: {
    [accountId: string]: Array<TankStats>;
  };
}

export interface TankStats {
  dropped_capture_points: number;
  last_battle_time: number;
  mark_of_mastery: number;
  tank_id: number;
  all: {
    dropped_capture_points: number;
    max_xp: number;
    spotted: number;
    frags: number;
    losses: number;
    xp: number;
    battles: number;
    wins: number;
    damage_dealt: number;
    max_frags: number;
    survived_battles: number;
    damage_received: number;
    shots: number;
    hits: number;
  };
}

export interface Tank {
  last_battle_time: number;
  avg_damage?: number;
  accuracy?: number;
  winRate?: number;
  tank_id: number;
  name: string;
  nation: string;
  tier: number;
  type: string;
  mark_of_mastery: number;
  images?: {
    preview: string;
    normal: string;
  };
  is_premium: boolean;
  is_collectible: boolean;
  all: {
    wn8?: number;
    dropped_capture_points: number;
    max_xp: number;
    spotted: number;
    hits: number;
    shots: number;
    frags: number;
    survived_battles: number;
    losses: number;
    xp: number;
    battles: number;
    wins: number;
    damage_dealt: number;
    max_frags: number;
    damage_received: number;
  };
}

export interface TankDeltaInterface {
  tank_id: number;
  tier: number;
  nation: string;
  type: string;
  images?: {
    preview?: string,
    normal?: string
  };
  is_premium?: boolean;
  is_collectible?: boolean;
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

export interface TanksJsonResponse {
  data: Record<string, TankData>;
}

export interface TankData {
  tank_id: number;
  name: string;
  nation: string;
  tier: number;
  type: string;
  description?: string | null;
  all: { battles: number, wins: number, damageDealt: number };
  cost?: {
    price_credit?: number;
    price_gold?: number;
  } | null;
  images?: {
    preview?: string;
    normal?: string;
  };
  creditCoeff?: number;
  is_premium?: boolean;
  is_collectible?: boolean;
}

export interface ExpTankStats {
  IDNum: number;
  expDef: number;
  expFrag: number;
  expSpot: number;
  expDamage: number;
  expWinRate: number;
}


export interface AggregatedStats {
  battles: number;
  totalDmg: number;
  totalSpot: number;
  totalFrags: number;
  totalDef: number;
  totalWins: number;

  sumExpDamage: number;
  sumExpSpot: number;
  sumExpFrag: number;
  sumExpDef: number;
  sumExpWins: number;
}

export type BattlesByTier = Record<number, number>;
export type BattlesByType = Record<string, number>;
export type BattlesByWinRate = Record<number, number>;
export type BattlesByWinAvgDamage = Record<number, number>;
