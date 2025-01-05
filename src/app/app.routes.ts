import {Routes} from '@angular/router';
import {HomeComponent} from './components/features/home/home.component';


export const routes: Routes = [
  {path: 'home', component: HomeComponent},
  {path: '', redirectTo: 'home', pathMatch: 'full'},
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
];
