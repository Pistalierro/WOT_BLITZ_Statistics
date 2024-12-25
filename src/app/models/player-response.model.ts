export interface PlayerStatisticsInterface {
  all: {
    battles: number; // Общее количество боёв
    wins: number; // Количество побед
    max_frags: number; // Максимальное количество уничтоженных танков за бой
    max_xp: number; // Максимальное количество опыта за бой
    hits: number; // Количество попаданий
    shots: number; // Общее количество выстрелов
    survived_battles: number; // Количество выживших боёв
  };
}

export interface PlayerInfoInterface {
  account_id: number; // Уникальный идентификатор игрока
  nickname: string; // Никнейм игрока
  created_at: number; // Временная метка создания аккаунта
  statistics: PlayerStatisticsInterface; // Статистика игрока
}

export interface PlayerApiResponse {
  status: string; // Статус ответа
  meta: {
    count: number; // Количество записей
  };
  data: {
    [accountId: number]: PlayerInfoInterface; // Данные игрока по его account_id
  };
}

export interface AccountListResponse {
  status: string; // Статус ответа
  meta: {
    count: number; // Количество найденных игроков
  };
  data: {
    [accountId: number]: {
      nickname: string; // Никнейм игрока
      account_id: string | number; // ID игрока
    };
  };
}
