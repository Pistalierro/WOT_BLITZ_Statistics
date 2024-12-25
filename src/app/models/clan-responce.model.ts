export interface ClanResponseInterface {
  clan_id: number;
  tag: string;
  name: string;
  description?: string;
  members_count: number;
  created_at: number; // Временная метка
}
