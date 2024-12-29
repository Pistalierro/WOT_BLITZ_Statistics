import {Routes} from '@angular/router';
import {HomeComponent} from './components/features/home/home.component';


export const routes: Routes = [
  {path: 'home', component: HomeComponent},
  {path: '', redirectTo: 'home', pathMatch: 'full'},
  {
    path: 'players',
    loadComponent: () =>
      import('./components/features/player/player-host/player-host.component').then(
        (m) => m.PlayerHostComponent
      ),
    title: 'WOT Blitz Statistics',
    children: [
      {
        path: 'statistics',
        loadComponent: () => import('./components/features/player/player-statistics/player-statistics.component')
          .then(m => m.PlayerStatisticsComponent)
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
  }
];
