import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {
  getWinRateColor(winRate: number): string {
    if (winRate >= 70) {
      return 'winRate-purple';
    } else if (winRate >= 60) {
      return 'winRate-blue';
    } else if (winRate >= 50) {
      return 'winRate-green';
    } else return 'winRate-white';
  }

  initTierPercentMap(tiers: any[]): Record<number, number> {
    const result: Record<number, number> = {};
    tiers.forEach(tier => {
      result[tier] = 0;
    });
    return result;
  }

  calculateScaledPercentages(
    battlesByTier: Record<number, number>,
    maxPercent = 90,
    minPercent = 0.01
  ): Record<number, number> {
    const result: Record<number, number> = {};
    const maxBattles = Math.max(...Object.values(battlesByTier));

    if (maxBattles === 0) {
      for (const tier in battlesByTier) {
        result[tier] = minPercent;
      }
    } else {
      for (const tier in battlesByTier) {
        const battles = battlesByTier[tier];
        result[tier] = Math.max((battles / maxBattles) * maxPercent, minPercent);
      }
    }
    return result;
  }

  calculatePercentageDirectly(
    winRateByTier: Record<number, number>,
    minPercent = 0.01
  ): Record<number, number> {
    const result: Record<number, number> = {};

    for (const tier in winRateByTier) {
      const winRate = winRateByTier[tier] || 0;
      result[tier] = Math.max(Math.min(winRate, 100), minPercent);
    }

    return result;
  }
}
