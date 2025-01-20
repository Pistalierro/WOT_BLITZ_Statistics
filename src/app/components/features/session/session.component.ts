import {Component, inject} from '@angular/core';
import {SessionStoreService} from '../../../services/session-store.service';
import {MATERIAL_MODULES} from '../../../mock/material-providers';
import {DecimalPipe, NgIf} from '@angular/common';

@Component({
  selector: 'app-session',
  standalone: true,
  imports: [...MATERIAL_MODULES, NgIf, DecimalPipe],
  templateUrl: './session.component.html',
  styleUrl: './session.component.scss'
})
export class SessionComponent {

  sessionStore = inject(SessionStoreService);

  async startSession() {
    await this.sessionStore.startSession();
  }

  async updateSession() {
    await this.sessionStore.updateSession();
  }

  async endSession() {
    await this.sessionStore.endSession();
  }
}
