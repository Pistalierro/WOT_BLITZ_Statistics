import {Component, inject} from '@angular/core';
import {PlayerService} from '../../../../services/player.service';
import {AuthService} from '../../../../services/auth.service';
import {toObservable} from '@angular/core/rxjs-interop';
import {filter, tap} from 'rxjs/operators';
import {DatePipe, DecimalPipe, NgIf} from '@angular/common';

@Component({
  selector: 'app-player-stat',
  standalone: true,
  templateUrl: './player-stat.component.html',
  imports: [
    DatePipe,
    DecimalPipe,
    NgIf
  ],
  styleUrls: ['./player-stat.component.scss']
})
export class PlayerStatComponent {
  protected authService = inject(AuthService);
  protected playerService = inject(PlayerService);

  constructor() {
    toObservable(this.authService.nicknameSignal)
      .pipe(
        filter((nickname): nickname is string => !!nickname),
        tap((nickname) => this.playerService.fetchPlayerData(nickname))
      )
      .subscribe();
  }
}
