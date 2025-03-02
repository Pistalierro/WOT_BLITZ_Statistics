import {inject, Injectable, signal} from '@angular/core';
import {Auth} from '@angular/fire/auth';
import {Firestore} from '@angular/fire/firestore';
import {SessionDeltaInterface, StatsInterface} from '../../models/session/battle-session.model';
import {Tank} from '../../models/tank/tanks-response.model';

@Injectable({
  providedIn: 'root'
})
export class SessionStateService {
  sessionId = signal<string | null>(null);
  sessionActive = signal<boolean>(false);
  sessionError = signal<string | null>(null);
  startStats = signal<StatsInterface | null>(null);
  intermediateStats = signal<any>(null);
  sessionStats = signal<SessionDeltaInterface | null>(null);
  startsTanksStats = signal<Tank[] | null>(null); // Начальные данные по танкам
  loadingSignal = signal<boolean | null>(null);

  unsubscribeSnapshot: (() => void) | null = null;

  auth = inject(Auth);
  firestore = inject(Firestore);
}
