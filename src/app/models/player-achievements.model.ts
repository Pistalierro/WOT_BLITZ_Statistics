export interface AchievementStatsInterface {
  [medalId: string]: number;
}

export interface MaxSeriesStatsInterface {
  [seriesId: string]: number;
}

export interface PlayerAchievementsInterface {
  achievements: AchievementStatsInterface;
  max_series: MaxSeriesStatsInterface;
}

export interface PlayerAchievementsResponseInterface {
  status: string;
  meta: {
    count: number;
  };
  data: {
    [playerId: string]: PlayerAchievementsInterface;
  };
}
