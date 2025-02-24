import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {

  getWinRateColor(winRate: number): string {
    if (winRate >= 70) {
      return 'winRate-purple';
    } else if (winRate >= 60) {
      return 'winRate-blue';
    } else if (winRate >= 50) {
      return 'winRate-green';
    } else return 'winRate-white';
  }
}
