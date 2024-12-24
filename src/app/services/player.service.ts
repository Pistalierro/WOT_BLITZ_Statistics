import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PlayerService {

  private apiUrl = 'https://api.wotblitz.eu/wotb';

  constructor() {
  }
}
