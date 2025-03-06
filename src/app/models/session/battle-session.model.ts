import {Tank, TankDeltaInterface} from '../tank/tanks-response.model';

export interface StatsInterface {
  battles: number;
  wins: number;
  damage_dealt: number;
}

export interface SessionDeltaInterface {
  battles: number;
  wins: number;
  damageDealt: number;
  winRate: number;
  avgDamage: number;
  tanksDelta?: TankDeltaInterface[];
  tanksList?: TankDeltaInterface[];
  is_premium?: boolean;
  is_collectible?: boolean;
}

export interface SessionDataInterface {
  userId: string;
  nickname: string;
  startStats: StatsInterface;
  startTimestamp: number;
  isActive: boolean;
  updatedStats?: StatsInterface;
  updatedDelta?: SessionDeltaInterface;
  endStats?: StatsInterface;
  updatedTimestamp?: number;
  endTimestamp?: number;
  sessionDelta?: SessionDeltaInterface;
  tanksDelta?: TankDeltaInterface[];
  startTanksList: Tank[];
}
