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
