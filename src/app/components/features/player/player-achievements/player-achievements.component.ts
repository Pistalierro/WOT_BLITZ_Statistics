import {Component, inject} from '@angular/core';
import {AchievementsService} from '../../../../services/achievements.service';
import {NgForOf, NgIf} from '@angular/common';
import {getAchievementIcon, translateAchievementName} from '../../../../shared/helpers/achievements-utils';
import {MATERIAL_MODULES} from '../../../../shared/helpers/material-providers';

@Component({
  selector: 'app-player-achievements',
  standalone: true,
  imports: [
    NgIf,
    NgForOf,
    ...MATERIAL_MODULES
  ],
  templateUrl: './player-achievements.component.html',
  styleUrl: './player-achievements.component.scss'
})
export class PlayerAchievementsComponent {

  protected achievementsService = inject(AchievementsService);
  protected readonly translateAchievementName = translateAchievementName;
  protected readonly getAchievementIcon = getAchievementIcon;
}
