export interface PlayerSearchResponse {
  status: 'ok' | 'error';
  data: Array<{
    account_id: number;
    nickname: string;
  }>;
}

export interface PlayerInfoResponse {
  status: 'ok' | 'error'; // Статус API-ответа
  data: {
    [accountId: number]: { // 🔹 Меняем string → number
      account_id: number; // ID игрока
      created_at: number; // Дата создания аккаунта (timestamp)
      last_battle_time?: number; // Время последнего боя (timestamp, опционально)
      nickname: string; // Никнейм игрока
      rating: { // Рейтинг игрока
        battles: number; // Количество боёв
        capture_points?: number; // Очки захвата базы (опционально)
      };
      statistics: { // Общая статистика
        all: {
          battles: number; // Всего боёв
          wins: number; // Побед
          damage_dealt: number; // Нанесённый урон
          hits: number; // Попадания
          shots: number; // Всего выстрелов
          max_damage?: number; // Максимальный урон за бой (опционально)
          max_frags: number; // Максимум уничтоженных за бой
        };
      };
    };
  };
}


export interface ClanAccountInfoResponse {
  status: 'ok' | 'error'; // Статус API-ответа
  data: {
    [accountId: number]: { // 🔹 Было string → стало number
      clan_id?: number; // ID клана (может отсутствовать)
    };
  };
}


export interface ClanInfoResponse {
  status: 'ok' | 'error'; // Статус API-ответа
  data: {
    [clanId: number]: { // 🔹 Было string → стало number
      name: string; // Название клана
      tag: string; // Тэг клана (например, [WG])
      members_count?: number; // Количество участников (опционально)
      motto?: string; // Девиз клана (опционально)
      description?: string; // Описание клана (опционально)
    };
  };
}


export interface PlayerData {
  account_id: number;
  created_at: number;
  last_battle_time?: number;
  nickname: string;
  statistics: {
    all: {
      wn8?: number;
      battles: number;
      wins: number;
      losses?: number;
      damage_dealt: number;
      hits: number;
      shots: number;
      max_damage?: number;
      max_frags: number;
      max_xp?: number;
    };
  };
  clan?: {
    name: string;
    tag: string;
  };
}

