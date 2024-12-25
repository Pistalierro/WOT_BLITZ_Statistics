export interface PlayerResponseInterface {
  account_id: number;
  nickname: string;
  created_at: number; // Временная метка создания аккаунта
  statistics: {
    all: {
      battles: number; // Всего боёв
      wins: number; // Побед
    };
  };
}
