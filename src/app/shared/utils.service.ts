import {Injectable} from '@angular/core';
import {MaxValues, TankInfo} from '../models/tank/tank-full-info.model';

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

  getTankColor(row: any): string {
    if (row.is_collectible) {
      return '#71D1FF';
    } else if (row.is_premium) {
      return 'gold';
    } else {
      return '#c8c8c8';
    }
  }

  initTierPercentMap(tiers: any[]): Record<number, number> {
    const result: Record<number, number> = {};
    tiers.forEach(tier => {
      result[tier] = 0;
    });
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

  calculateScaledPercentages(
    values: Record<number, number>,
    maxPercent = 100,
    minPercent = 0.01
  ): Record<number, number> {
    const result: Record<number, number> = {};
    const maxValue = Math.max(...Object.values(values));

    if (maxValue === 0) {
      for (const key in values) {
        result[key as any] = minPercent; // 🔥 Оставляем ключ в исходном виде
      }
    } else {
      for (const key in values) {
        const value = values[key]; // 🔥 Не изменяем ключ, чтобы не сломать вызовы
        result[key as any] = Math.max((value / maxValue) * maxPercent, minPercent);
      }
    }
    return result;
  }

  calculateMaxValues(tanks: TankInfo[]): MaxValues {
    return {
      hp: Math.max(...tanks.map(tank => tank.default_profile?.hp || 0)),
      damage: Math.max(...tanks.map(tank => tank.default_profile.shells[0].damage || 0)),
      fire_rate: Math.max(...tanks.map(tank => tank.default_profile.gun.fire_rate || 0)),
      penetration: Math.max(...tanks.map(tank => tank.default_profile.shells[0].penetration || 0)),
      speed: Math.max(...tanks.map(tank => tank.default_profile.speed_forward || 0)),
      traverse: Math.max(...tanks.map(tank => tank.default_profile.suspension.traverse_speed || 0)),
    };
  }


  calculateStatPercentages(maxValues: MaxValues): Record<string, Record<number, number>> {
    return {
      hp: this.calculateScaledPercentages({1: maxValues['hp'] || 1}, 100),
      damage: this.calculateScaledPercentages({1: maxValues['damage'] || 1}, 100),
      fire_rate: this.calculateScaledPercentages({1: maxValues['fire_rate'] || 1}, 100),
      penetration: this.calculateScaledPercentages({1: maxValues['penetration'] || 1}, 100),
      speed: this.calculateScaledPercentages({1: maxValues['speed'] || 1}, 100),
      traverse: this.calculateScaledPercentages({1: maxValues['traverse'] || 1}, 100),
    };
  }
}
