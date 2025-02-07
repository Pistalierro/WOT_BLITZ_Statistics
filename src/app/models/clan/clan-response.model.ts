export interface ClanListEntry {
  clan_id: number; // ID клана
  name: string; // Название клана
  tag: string; // Тег клана
  members_count: number; // Количество участников
}

export interface ClanListResponse {
  status: string; // Статус ответа
  meta: {
    count: number; // Количество записей
    total: number;
  };
  data: ClanListEntry[]; // Список кланов
}

export interface ClanDetails {
  clan_id: number; // ID клана
  name: string; // Название клана
  tag: string; // Тег клана
  members_count: number; // Количество участников
  creator_name: string; // Имя создателя клана
  created_at: number; // Дата создания клана (UNIX timestamp)
  description: string; // Описание клана
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
  renamed_at: number; // Дата переименования клана (UNIX timestamp)
  old_name: string | null; // Старое название клана
  old_tag: string | null; // Старый тег клана
  leader_id: number; // ID лидера клана
}

export interface ClanDetailsResponse {
  status: string; // Статус ответа
  meta: {
    count: number; // Количество записей
  };
  data: {
    [clanId: number]: ClanDetails; // Данные о клане по его ID
  };
}
