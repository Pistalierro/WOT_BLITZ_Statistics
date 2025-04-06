import {APP_INITIALIZER, ApplicationConfig, importProvidersFrom} from '@angular/core';
import {TranslateLoader, TranslateModule, TranslateService, TranslateStore} from '@ngx-translate/core';
import {HttpClient} from '@angular/common/http';
import {TranslateHttpLoader} from '@ngx-translate/http-loader';

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, '/assets/i18n/', '.json');
}

export function initTranslate(translate: TranslateService) {
  return () => {
    const availableLangs: string[] = ['ru', 'ua', 'en', 'es', 'de'];
    translate.addLangs(availableLangs);
    translate.setDefaultLang('en');
    const browserLang = localStorage.getItem('lang') || translate.getBrowserLang() || 'en';

    if (!availableLangs.includes(browserLang)) {
      translate.use('ru');
    } else {
      translate.use(browserLang);
    }
  };
}

export function provideTranslate(): ApplicationConfig {
  return {
    providers: [
      importProvidersFrom(
        TranslateModule.forRoot({
          loader: {provide: TranslateLoader, useFactory: createTranslateLoader, deps: [HttpClient],},
        })
      ),
      TranslateStore,
      {provide: APP_INITIALIZER, useFactory: initTranslate, deps: [TranslateService], multi: true,},
    ],
  };
}
