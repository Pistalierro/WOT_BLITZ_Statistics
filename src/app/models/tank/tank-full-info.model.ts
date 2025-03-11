export interface TankProfile {
  name: string; // Название танка
  tank_id: number; // ID танка
  tier: number; // Уровень танка
  type: string; // Тип танка (ЛТ, СТ, ТТ, ПТ, САУ)
  nation: string; // Нация танка
  is_premium?: boolean; // Является ли танк премиумным
  is_collectible?: boolean; // Является ли танк коллекционным
  images: {
    preview: string; // Превью-изображение танка
    normal: string; // Обычное изображение танка
  };
  weight: number; // Масса танка
  profile_id: string; // Уникальный ID профиля танка
  firepower: number; // Огневая мощь
  shot_efficiency: number; // 🆕 Эффективность стрельбы
  gun_id: number; // ID орудия
  armor: {
    turret: ArmorSection; // Броня башни
    hull: ArmorSection; // Броня корпуса
  };
  battle_level_range_max: number; // Максимальный уровень боёв
  battle_level_range_min: number; // Минимальный уровень боёв
  engine: Engine; // Двигатель
  engine_id: number; // ID двигателя
  gun: Gun; // Орудие
  hp: number; // Очки прочности
  hull_hp: number; // Прочность корпуса
  hull_weight: number; // Масса корпуса
  is_default: boolean; // Является ли базовой конфигурацией
  maneuverability: number; // Манёвренность
  max_ammo: number; // Максимальный боезапас
  max_weight: number; // Максимальная масса
  protection: number; // Защищённость
  shells: Shell[]; // Доступные снаряды
  signal_range: number | null; // Дальность связи (может отсутствовать)
  speed_backward: number; // Скорость задним ходом
  speed_forward: number; // Скорость вперёд
  suspension: Suspension; // Ходовая часть
  suspension_id: number; // ID ходовой части
  turret: Turret | null; // 🆕 Башня (может отсутствовать)
  turret_id: number | null; // 🆕 ID башни (может быть `null`)
}

export interface ArmorSection {
  front?: number; // Лобовая броня
  sides?: number; // Боковая броня
  rear?: number; // Кормовая броня
  traverse_speed?: number; // 🆕 Скорость поворота корпуса (если есть в API)
}

export interface Engine {
  tier: number; // Уровень двигателя
  fire_chance: number; // Шанс возгорания
  power: number; // Мощность (л.с.)
  name: string; // Название двигателя
  weight: number; // Масса двигателя
}

export interface Gun {
  move_down_arc: number; // Угол склонения орудия вниз
  caliber: number; // Калибр (мм)
  name: string; // Название орудия
  weight: number; // Масса орудия
  move_up_arc: number; // Угол возвышения орудия вверх
  reload_time?: number; // Время перезарядки (если доступно)
  aim_time?: number; // Время сведения
  dispersion?: number; // Разброс
  fire_rate: number; // Скорострельность (выстрелов в минуту)
  clip_reload_time: number; // Время перезарядки барабана
  clip_capacity: number; // Количество снарядов в барабане
  traverse_speed: number; // 🆕 Скорость поворота орудия (если ПТ-САУ без башни)
  traverse_left_arc?: number; // 🆕 УГН влево для ПТ-САУ без башни
  traverse_right_arc?: number; // 🆕 УГН вправо для ПТ-САУ без башни
  tier: number; // Уровень орудия
  is_default?: boolean; // Является ли базовым орудием
}

export interface Shell {
  type: string; // Тип снаряда (ББ, подкалиберный и т. д.)
  damage: number; // Урон
  penetration: number; // Бронепробитие
  speed?: number; // Скорость полёта (может отсутствовать)
}

export interface Suspension {
  tier: number; // Уровень ходовой
  load_limit: number; // Максимальная нагрузка
  traverse_speed: number; // Скорость поворота
  name: string; // Название ходовой
  weight: number; // Масса ходовой
}

export interface Turret {
  name: string; // Название башни
  weight: number; // Масса башни
  view_range: number; // Обзор (м)
  traverse_left_arc?: number; // 🆕 УГН влево
  traverse_right_arc?: number; // 🆕 УГН вправо
  hp: number; // Прочность башни
  traverse_speed: number; // Скорость поворота башни
  tier: number; // Уровень башни
}

export interface ApiResponse<T> {
  status: 'ok' | 'error'; // Статус ответа
  data: Record<number, T>; // Данные с ID как ключами
}

export interface TankInfo {
  default_profile: {
    hp: number; // Прочность
    speed_forward: number; // Скорость
    firepower: number; // Огневая мощь
    signal_range: number | null; // Дальность связи
    shells: {
      type: string;
      damage: number; // Урон
      penetration: number; // Пробитие
    }[]; // ❗ `shells` напрямую в `default_profile`, а не в `gun`
    gun: {
      fire_rate: number; // Скорострельность
    };
    suspension: {
      traverse_speed: number; // Вращение
    };
  };
}


// Описание ответа от API с множеством танков
export type TankValues = Record<number, TankInfo>;


