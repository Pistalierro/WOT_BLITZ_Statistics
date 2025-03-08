export interface TankProfile {
  weight: number;
  profile_id: string;
  firepower: number;
  shot_efficiency: number;
  gun_id: number;
  armor: {
    turret: ArmorSection;
    hull: ArmorSection;
  };
  battle_level_range_max: number;
  battle_level_range_min: number;
  engine: Engine;
  engine_id: number;
  gun: Gun;
  hp: number;
  hull_hp: number;
  hull_weight: number;
  is_default: boolean;
  maneuverability: number;
  max_ammo: number;
  max_weight: number;
  protection: number;
  shells: Shell[];
  signal_range: number | null;
  speed_backward: number;
  speed_forward: number;
  suspension: Suspension;
  suspension_id: number;
  turret: Turret;
  turret_id: number;
}

export interface ArmorSection {
  front?: number;
  sides?: number;
  rear?: number;
}

export interface Engine {
  tier: number;
  fire_chance: number;
  power: number;
  name: string;
  weight: number;
}

export interface Gun {
  move_down_arc: number;
  caliber: number;
  name: string;
  weight: number;
  move_up_arc: number;
  reload_time?: number;
  aim_time?: number;
  dispersion?: number;
}

export interface Shell {
  type: string;
  damage: number;
  penetration: number;
  speed: number;
}

export interface Suspension {
  tier: number;
  load_limit: number;
  traverse_speed: number;
  name: string;
  weight: number;
}

export interface Turret {
  name: string;
  weight: number;
  view_range: number;
  traverse_left_arc: number;
  traverse_right_arc?: number;
  hp: number;
}

export interface ApiResponse<T> {
  status: 'ok' | 'error';
  data: Record<number, T>;
}
