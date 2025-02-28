import {Routes} from '@angular/router';
import {HomeComponent} from './components/features/home/home.component';
import {authGuard} from './guards/auth.guard';
import {clanResolver} from './resolvers/clan.resolver';

export const routes: Routes = [
  {path: '', redirectTo: 'home', pathMatch: 'full'},
  {path: 'home', component: HomeComponent},
  {
    path: 'players',
    loadComponent: () => import('./components/features/player/player-host/player-host.component')
      .then(m => m.PlayerHostComponent),
    children: [
      {path: '', redirectTo: 'stat/stats-tier', pathMatch: 'full'},
      {
        path: 'stat',
        loadComponent: () => import('./components/features/player/player-stats/player-stats-host/player-stats-host.component')
          .then(m => m.PlayerStatsHostComponent),
        children: [
          {path: '', redirectTo: 'stats-tier', pathMatch: 'full'},
          {
            path: 'stats-tier',
            loadComponent: () => import('./components/features/player/player-stats/player-stats-by-tier/player-stats-by-tier.component')
              .then(m => m.PlayerStatsByTierComponent)
          },
          {
            path: 'stats-type',
            loadComponent: () => import('./components/features/player/player-stats/player-stats-by-type/player-stats-by-type.component')
              .then(m => m.PlayerStatsByTypeComponent)
          },
          {
            path: 'stats-winRate',
            loadComponent: () => import('./components/features/player/player-stats/player-stats-by-win-rate/player-stats-by-win-rate.component')
              .then(m => m.PlayerStatsByWinRateComponent)
          },
          {
            path: 'stats-damage',
            loadComponent: () => import('./components/features/player/player-stats/player-stats-by-damage/player-stats-by-damage.component')
              .then(m => m.PlayerStatsByDamageComponent)
          }
        ]
      },
      {
        path: 'vehicles',
        loadComponent: () => import('./components/features/player/player-vehicles/player-vehicles.component')
          .then(m => m.PlayerVehiclesComponent)
      },
      {
        path: 'achievements',
        loadComponent: () => import('./components/features/player/player-achievements/player-achievements.component')
          .then(m => m.PlayerAchievementsComponent)
      }
    ]
  },
  {
    path: 'session',
    loadComponent: () => import('./components/features/session/session.component')
      .then(m => m.SessionComponent),
    canActivate: [authGuard],
  },
  {
    path: 'clans',
    loadComponent: () => import('./components/features/clans/clan-list/clan-list.component')
      .then(m => m.ClanListComponent),
  },
  {
    path: 'clans/:id',
    loadComponent: () => import('./components/features/clans/clan-details/clan-details.component')
      .then(m => m.ClanDetailsComponent),
    resolve: {clan: clanResolver}
  }
];
