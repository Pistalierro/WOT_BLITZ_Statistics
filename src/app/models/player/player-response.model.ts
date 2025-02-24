export interface PlayerSearchResponse {
  status: 'ok' | 'error';
  data: Array<{
    account_id: number;
    nickname: string;
  }>;
}

export interface PlayerInfoResponse {
  status: 'ok' | 'error';
  data: {
    [accountId: string]: {
      rating: {
        battles: number;
        capture_points?: number | undefined;
      };
      account_id: number;
      created_at: number;
      nickname: string;
      statistics: {
        all: {
          battles: number;
          wins: number;
          damage_dealt: number;
          hits: number;
          shots: number;
          max_damage?: number;
          max_frags: number;
        };
      };
    };
  };
}

export interface ClanAccountInfoResponse {
  status: 'ok' | 'error';
  data: {
    [accountId: string]: {
      clan_id?: number;
    };
  };
}

export interface ClanInfoResponse {
  status: 'ok' | 'error';
  data: {
    [clanId: string]: {
      name: string;
      tag: string;
      members_count?: number;
      motto?: string;
      description?: string;
    };
  };
}

export interface PlayerData {
  playerId: number;
  created_at: number;
  nickname: string;
  last_battle_time: number;
  statistics: {
    all: {
      battles: number;
      wins: number;
      damage_dealt: number;
      hits: number;
      shots: number;
      max_damage?: number;
      max_frags: number;
    };
  };
  clan?: {
    name: string;
    tag: string;
  };
}
