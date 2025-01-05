import {Component, inject} from '@angular/core';
import {PlayerService} from '../../../../services/player.service';
import {AuthService} from '../../../../services/auth.service';
import {ClanService} from '../../../../services/clan.service';
import {DatePipe, DecimalPipe, NgIf} from '@angular/common';
import {toObservable} from '@angular/core/rxjs-interop';
import {filter, tap} from 'rxjs';

@Component({
  selector: 'app-player-stat',
  standalone: true,
  imports: [
    NgIf,
    DecimalPipe,
    DatePipe
  ],
  templateUrl: './player-stat.component.html',
  styleUrl: './player-stat.component.scss'
})
export class PlayerStatComponent {
  protected authService = inject(AuthService);
  protected playerService = inject(PlayerService);
  protected clanService = inject(ClanService);

  constructor() {
    // Превращаем сигнал в поток и вызываем getPlayerData при изменении никнейма
    toObservable(this.authService.nicknameSignal)
      .pipe(
        filter((nickname): nickname is string => !!nickname),
        tap((nickname) => this.playerService.getPlayerData(nickname))
      )
      .subscribe();
  }

}
