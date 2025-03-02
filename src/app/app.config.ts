import {ApplicationConfig, provideZoneChangeDetection} from '@angular/core';
import {provideRouter} from '@angular/router';

import {routes} from './app.routes';
import {initializeApp, provideFirebaseApp} from '@angular/fire/app';
import {getFirestore, provideFirestore} from '@angular/fire/firestore';
import {provideHttpClient} from '@angular/common/http';
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';
import {getAuth, provideAuth} from '@angular/fire/auth';
import {MatPaginatorIntl} from '@angular/material/paginator';
import {CustomPaginatorIntl} from './shared/services/custom-paginator-intl.service';
import {provideTranslate} from '../core/translate.provider';

const firebaseConfig = {
  apiKey: 'AIzaSyDW5NiM16RpmnaXpuK3LSVhIToNW-EigyM',
  authDomain: 'wot-blitz-statistics.firebaseapp.com',
  projectId: 'wot-blitz-statistics',
  storageBucket: 'wot-blitz-statistics.appspot.com',
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
    provideAuth(() => getAuth()),
    provideHttpClient(),
    provideAnimationsAsync(),
    ...provideTranslate().providers,
    {provide: MatPaginatorIntl, useClass: CustomPaginatorIntl}
  ]
};
