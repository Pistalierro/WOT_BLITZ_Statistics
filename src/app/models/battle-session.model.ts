export interface StatsInterface {
  battles: number;
  wins: number;
  damage_dealt: number;
}

export interface SessionDeltaInterface {
  battles: number;
  wins: number; // Добавьте это поле, если его нет
  damageDealt: number;
  winRate: number;
  avgDamage: number;
}
