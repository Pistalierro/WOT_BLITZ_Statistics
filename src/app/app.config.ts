import {ApplicationConfig, provideZoneChangeDetection} from '@angular/core';
import {provideRouter} from '@angular/router';

import {routes} from './app.routes';
import {initializeApp, provideFirebaseApp} from '@angular/fire/app';

import {getFirestore, provideFirestore} from '@angular/fire/firestore';
import {provideHttpClient} from '@angular/common/http';
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';

const firebaseConfig = {
  apiKey: 'AIzaSyDW5NiM16RpmnaXpuK3LSVhIToNW-EigyM',
  authDomain: 'wot-blitz-statistics.firebaseapp.com',
  projectId: 'wot-blitz-statistics',
  storageBucket: 'wot-blitz-statistics.firebasestorage.app',
  messagingSenderId: '16894861011',
  appId: '1:16894861011:web:484ef3fa5e7d5ab5e73e26'
};

export const apiConfig = {
  baseUrl: 'https://api.wotblitz.eu/wotb',
  applicationId: '8b707eb789d2bbc368fd873f5406b32d',
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideZoneChangeDetection({eventCoalescing: true}),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideFirestore(() => getFirestore()),
    provideHttpClient(), provideAnimationsAsync(),
  ]
};
