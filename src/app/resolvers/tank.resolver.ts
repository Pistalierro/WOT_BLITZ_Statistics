import {inject} from '@angular/core';
import {ResolveFn, Router} from '@angular/router';
import {TanksService} from '../services/tanks/tanks.service';
import {TankProfile} from '../models/tank/tank-full-info.model';
import {catchError, from, of, switchMap} from 'rxjs';

export const tankResolver: ResolveFn<TankProfile | null> = (route) => {
  const tanksService = inject(TanksService);
  const router = inject(Router);
  const tankId = Number(route.paramMap.get('id'));

  return from(tanksService.getTanksProps(tankId)).pipe(
    switchMap((tank) => {
      if (tank) {
        return of(tank); // Если танк найден — передаем в компонент
      } else {
        console.warn(`❌ Танка с ID ${tankId} не существует. Редирект на /players/tanks`);
        router.navigate(['/players/tanks']); // Редиректим в правильный путь
        return of(null); // Чтобы не было ошибки в компоненте
      }
    }),
    catchError(() => {
      console.error(`❌ Ошибка загрузки танка ${tankId}. Редирект на /players/tanks`);
      router.navigate(['/players/tanks']); // Ошибка — тоже редирект
      return of(null);
    })
  );
};
