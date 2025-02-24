import {Routes} from '@angular/router';
import {HomeComponent} from './components/features/home/home.component';
import {authGuard} from './guards/auth.guard';
import {clanResolver} from './resolvers/clan.resolver';

export const routes: Routes = [
  {path: 'home', component: HomeComponent},
  {path: '', component: HomeComponent},
  {
    path: 'players',
    loadComponent: () => import('./components/features/player/player-host/player-host.component')
      .then(m => m.PlayerHostComponent),
    children: [
      {path: '', redirectTo: 'stat', pathMatch: 'full'},
      {
        path: 'stat',
        loadComponent: () => import('./components/features/player/player-stat/player-stat.component')
          .then(m => m.PlayerStatComponent)
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
