export interface ClanAccountInterface {
  role: string; // Роль игрока в клане (например, "private")
  clan_id?: number; // ID клана (опционально, если игрок не состоит в клане)
  joined_at?: number; // Дата вступления в клан (UNIX timestamp)
  account_id: number; // ID игрока
  account_name: string; // Никнейм игрока
}

export interface ClanAccountInfoResponseInterface {
  status: string; // Статус ответа
  meta: {
    count: number; // Количество записей
  };
  data: {
    [accountId: number]: ClanAccountInterface; // Данные для каждого игрока по его account_id
  };
}

export interface ClanInfoInterface {
  name: string; // Название клана
  tag: string; // Тег клана
  members_count: number; // Количество участников
  creator_name: string; // Имя создателя клана
  created_at: number; // Дата создания клана (UNIX timestamp)
  description: string; // Описание клана
  leader_name: string; // Имя лидера клана
}

export interface ClanInfoResponseInterface {
  status: string; // Статус ответа
  meta: {
    count: number; // Количество записей
  };
  data: {
    [clanId: number]: ClanInfoInterface; // Данные о клане по его clan_id
  };
}
