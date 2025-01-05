import {animate, state, style, transition, trigger} from '@angular/animations';

export const ANIMATIONS = {
  buttonState: [
    trigger('buttonState', [
      state(
        'default',
        style({
          backgroundColor: '#3f51b5',
          transform: 'scale(1)',
        })
      ),
      state(
        'success',
        style({
          backgroundColor: '#4caf50',
          transform: 'scale(1.1)',
        })
      ),
      transition('default => success', [animate('300ms ease-in')]),
      transition('success => default', [animate('300ms ease-out')]),
    ]),
  ]
};
