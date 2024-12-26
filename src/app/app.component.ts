import {Component} from '@angular/core';
import {HeaderComponent} from './components/layouts/header/header.component';
import {HomeComponent} from './components/home/home.component';
import {PlayerStatisticsComponent} from './components/statistics/player-statistics/player-statistics.component';
import {RouterOutlet} from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HeaderComponent, HomeComponent, PlayerStatisticsComponent, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
}
