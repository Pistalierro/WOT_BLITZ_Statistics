import { ResolveFn } from '@angular/router';

export const clanResolver: ResolveFn<boolean> = (route, state) => {
  return true;
};
