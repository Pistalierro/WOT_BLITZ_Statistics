import {inject, Injectable, signal} from '@angular/core';
import {Auth} from '@angular/fire/auth';
import {Firestore} from '@angular/fire/firestore';
import {PlayerStoreService} from '../player-store.service';
import {SessionDeltaInterface, StatsInterface} from '../../models/battle-session.model';

@Injectable({
  providedIn: 'root'
})
export class SessionStateService {
  sessionId = signal<string | null>(null);
  sessionActive = signal<boolean>(false);
  sessionError = signal<string | null>(null);
  startStats = signal<StatsInterface | null>(null);
  endStats = signal<StatsInterface | null>(null);
  sessionStats = signal<SessionDeltaInterface | null>(null);
  intermediateStats = signal<any>(null);

  unsubscribeSnapshot: (() => void) | null = null;

  auth = inject(Auth);
  firestore = inject(Firestore);
  playerStore = inject(PlayerStoreService);
}
