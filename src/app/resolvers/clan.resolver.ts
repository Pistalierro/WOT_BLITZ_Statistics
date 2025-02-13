import {ResolveFn} from '@angular/router';
import {inject} from '@angular/core';
import {ClanService} from '../services/clan/clan.service';

export const clanResolver: ResolveFn<void> = async (route) => {
  const clanService = inject(ClanService);
  const clanId = Number(route.paramMap.get('id'));

  if (isNaN(clanId)) {
    console.warn('⚠ Некорректный ID клана:', route.paramMap.get('id'));
    return;
  }

  await clanService.getClanDetailsById(clanId);
};
