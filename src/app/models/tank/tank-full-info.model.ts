export interface TankProfile {
  name: string;
  tank_id: number;
  tier: number;
  type: string;
  nation: string;
  is_premium?: boolean;
  is_collectible?: boolean;
  images: {
    preview: string;
    normal: string;
  };
  weight: number;
  profile_id: string;
  firepower: number;
  shot_efficiency: number; // 🆕 **Эффективность стрельбы**
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
  turret: Turret | null; // 🆕 **Турель может отсутствовать**
  turret_id: number | null; // 🆕 **ID может быть `null`**
}

export interface ArmorSection {
  front?: number;
  sides?: number;
  rear?: number;
  traverse_speed?: number; // 🆕 **Добавлена скорость поворота корпуса (если появится в API)**
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
  fire_rate: number; // Скорострельность
  clip_reload_time: number; // Время перезарядки барабана
  clip_capacity: number; // Количество снарядов в барабане
  traverse_speed: number; // 🆕 Скорость поворота орудия (если ПТ-САУ без башни)
  traverse_left_arc?: number; // 🆕 УГН влево для ПТ-САУ без башни
  traverse_right_arc?: number; // 🆕 УГН вправо для ПТ-САУ без башни
  tier: number;
  is_default?: boolean;
}


export interface Shell {
  type: string;
  damage: number;
  penetration: number;
  speed?: number; // У некоторых снарядов скорость может отсутствовать
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
  traverse_left_arc?: number; // 🆕 Добавили для УГН
  traverse_right_arc?: number; // 🆕 Добавили для УГН
  hp: number;
  traverse_speed: number;
  tier: number;
}


export interface ApiResponse<T> {
  status: 'ok' | 'error';
  data: Record<number, T>;
}
