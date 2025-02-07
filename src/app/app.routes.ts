import {Routes} from '@angular/router';
import {HomeComponent} from './components/features/home/home.component';
import {authGuard} from './guards/auth.guard';

export const routes: Routes = [
  {path: 'home', component: HomeComponent},
  {path: '', component: HomeComponent},
  {
    path: 'players',
    loadComponent: () => import('./components/features/player/player-host/player-host.component')
      .then(m => m.PlayerHostComponent),
    canActivate: [authGuard],
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
    loadComponent: () => import('./components/features/clans/clans.component')
      .then(m => m.ClansComponent),
  }
];
