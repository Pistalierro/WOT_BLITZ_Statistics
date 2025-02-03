import {Directive, ElementRef, Input, OnChanges, SimpleChanges} from '@angular/core';

@Directive({
  selector: '[appOdometer]',
  standalone: true
})
export class OdometerDirective implements OnChanges {
  @Input('appOdometer') value: number = 0;

  constructor(private el: ElementRef) {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value']) {
      this.animateValue(
        changes['value'].previousValue || 0,
        changes['value'].currentValue
      );
    }
  }

  private animateValue(start: number, end: number): void {
    const duration = 1000;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      const currentValue = start + (end - start) * progress;

      // Форматирование для целых и дробных чисел
      this.el.nativeElement.textContent =
        Number.isInteger(end) ? Math.floor(currentValue) : currentValue.toFixed(0);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }
}
