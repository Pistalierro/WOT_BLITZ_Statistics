import {Component, inject} from '@angular/core';
import {AchievementsService} from '../../../../services/achievements.service';
import {KeyValuePipe, NgForOf, NgIf} from '@angular/common';
import {getAchievementIcon, translateAchievementName} from '../../../../mock/achievements-utils';
import {MATERIAL_MODULES} from '../../../../mock/material-providers';

@Component({
  selector: 'app-player-achievements',
  standalone: true,
  imports: [
    NgIf,
    NgForOf,
    ...MATERIAL_MODULES,
    KeyValuePipe
  ],
  templateUrl: './player-achievements.component.html',
  styleUrl: './player-achievements.component.scss'
})
export class PlayerAchievementsComponent {

  protected achievementsService = inject(AchievementsService);
  protected readonly translateAchievementName = translateAchievementName;
  protected readonly getAchievementIcon = getAchievementIcon;
}
