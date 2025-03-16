import {Tank} from '../models/tank/tanks-response.model';

export function calculateGeneralStats(tank: Tank): { name: string; value: string | number }[] {
  return [
    {name: 'TANK_STATS.BATTLES_PLAYED', value: tank.all.battles},
    {name: 'TANK_STATS.WINS', value: `${tank.all.wins} (${((tank.all.wins / tank.all.battles) * 100).toFixed(2)}%)`},
    {name: 'TANK_STATS.LOSSES', value: `${tank.all.losses} (${((tank.all.losses / tank.all.battles) * 100).toFixed(2)}%)`},
    {
      name: 'TANK_STATS.SURVIVED',
      value: `${tank.all.survived_battles} (${((tank.all.survived_battles / tank.all.battles) * 100).toFixed(2)}%)`
    },
    {name: 'TANK_STATS.KILL_RATIO', value: `${(tank.all.frags / (tank.all.battles - tank.all.survived_battles)).toFixed(2)}`},
    {name: 'TANK_STATS.DAMAGE_RECEIVED', value: `${(tank.all.damage_dealt / Math.max(1, tank.all.damage_received)).toFixed(2)}`},
    {name: 'TANK_STATS.ACCURACY', value: `${((tank.all.hits / Math.max(1, tank.all.shots)) * 100).toFixed(2)}%`},
    {name: 'TANK_STATS.MARK_OF_MASTERY', value: tank.mark_of_mastery === 4 ? '✅' : '❌'}
  ];
}

export function calculateAverageStats(tank: Tank): { name: string; value: string | number }[] {
  return [
    {name: 'TANK_STATS.AVG_XP', value: (tank.all.xp / tank.all.battles).toFixed(0)},
    {name: 'TANK_STATS.AVG_DAMAGE', value: (tank.all.damage_dealt / tank.all.battles).toFixed(0)},
    {name: 'TANK_STATS.AVG_DAMAGE_RECEIVED', value: (tank.all.damage_received / tank.all.battles).toFixed(0)},
    {name: 'TANK_STATS.SPOTTED', value: (tank.all.spotted / tank.all.battles).toFixed(2)},
    {name: 'TANK_STATS.AVG_FRAGS', value: (tank.all.frags / tank.all.battles).toFixed(2)},
    {name: 'TANK_STATS.MAX_KILLS', value: tank.all.max_frags},
    {name: 'TANK_STATS.MAX_XP', value: tank.all.max_xp},
  ];
}
