export interface ApiResponse<T> {
  status: string;
  meta?: {
    count: number;
    total?: number;
  };
  data: T[] | Record<number, T>; // ✅ Поддержка массивов и объектов
}


export interface ClanListEntry {
  clan_id: number; // ID клана
  name: string; // Название клана
  tag: string; // Тег клана
  members_count: number; // Количество участников
  created_at: number; // Дата создания клана (epoch time)
}

export interface ClanListResponse {
  status: string; // Статус ответа (например, "ok")
  meta: {
    count: number; // Количество записей на странице
    total: number; // Общее количество записей
  };
  data: ClanListEntry[]; // Список кланов в виде массива
}

export interface ClanDetails {
  clan_id: number; // ID клана
  name: string; // Название клана
  tag: string; // Тег клана
  members_count?: number; // Количество участников
  creator_name?: string; // Имя создателя клана
  created_at?: number; // Дата создания клана (UNIX timestamp)
  description?: string; // Описание клана
  leader_name: string; // Имя лидера клана
  recruiting_options: {
    vehicles_level: number; // Уровень техники для вступления
    wins_ratio: number; // Процент побед для вступления
    average_battles_per_day: number; // Среднее количество боёв в день
    battles: number; // Общее количество боёв
    average_damage: number; // Средний урон
  };
  members_ids: number[]; // Список ID участников
  recruiting_policy: string; // Политика набора (например, "restricted")
  is_clan_disbanded: boolean; // Распущен ли клан
  emblem_set_id: number; // ID эмблемы клана
  creator_id: number; // ID создателя клана
  motto: string; // Девиз клана
  renamed_at?: number; // Дата переименования клана (UNIX timestamp)
  old_name?: string | null; // Старое название клана
  old_tag?: string | null; // Старый тег клана
  leader_id: number; // ID лидера клана
}

export interface ExtendedClanDetails extends ClanDetails {
  winRate: number | null;
  avgDamage: number | null;
  zeroBattlesCount?: number | null;
}

export interface ClanInfoResponse {
  status: string; // Статус ответа
  meta: {
    count: number; // Количество записей
    total: number;
  };
  data: {
    [clanId: number]: ClanDetails; // Данные о клане по его ID
  };
}

export interface BasicClanData {
  clan_id: number;
  name: string;
  tag: string;
  members_count: number;
  created_at: number;
}

export interface KeyValueRecord {
  key: string;       // уникальный ключ, по которому будем искать
  data: any;         // любые сериализуемые данные (массив, объект, строка, etc.)
  timestamp: number; // время сохранения
}
