export interface TankStatsInterface {
  battles: number;
  wins: number;
}

export interface TankInterface {
  tank_id: number;
  all: TankStatsInterface;
}

export interface TanksResponseInterface {
  status: string;
  meta: {
    count: number;
  };
  data: {
    [accountId: number]: TankInterface[];
  };
}

export interface TankDetailsInterface {
  is_premium: boolean;
  name: string;
  nation: string;
}

export interface TankDetailsResponseInterface {
  status: string;
  meta: {
    count: number;
  };
  data: {
    [tankId: string]: TankDetailsInterface;
  };
}

export interface MergedTankInterface extends TankInterface, TankDetailsInterface {
}

