import {animate, state, style, transition, trigger} from '@angular/animations';

export const ANIMATIONS = {
  buttonState: [
    trigger('buttonState', [
      state(
        'default',
        style({
          backgroundColor: '#6f6f6f',
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
  ],
  slideIn: [
    trigger('slideUp', [
      // Начальное состояние: блок скрыт и сдвинут вниз
      state('void', style({
        opacity: 0,
        transform: 'translateY(20px)'
      })),
      // Конечное состояние: блок виден и на своем месте
      state('*', style({
        opacity: 1,
        transform: 'translateY(0)'
      })),
      // Переход от скрытого к видимому состоянию
      transition('void => *', animate('500ms ease-out')),
      // Переход от видимого к скрытому состоянию
      transition('* => void', animate('500ms ease-in'))
    ])
  ],

  fadeIn: [
    trigger('fadeScale', [
      transition(':enter', [
        style({opacity: 0, transform: 'scale(0.9)'}),
        animate('300ms ease-out', style({opacity: 1, transform: 'scale(1)'}))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({opacity: 0, transform: 'scale(0.9)'}))
      ])
    ])
  ],
};

