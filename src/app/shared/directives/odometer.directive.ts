import {Directive, ElementRef, inject, Input, OnChanges, SimpleChanges} from '@angular/core';
import {DecimalPipe} from '@angular/common';

@Directive({
  selector: '[appOdometer]',
  standalone: true,
  providers: [DecimalPipe]
})
export class OdometerDirective implements OnChanges {
  @Input('appOdometer') value: number = 0;
  @Input() format: string = '1.0-0';

  private el = inject(ElementRef);
  private decimalPipe = inject(DecimalPipe);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value']) {
      const newValue = changes['value'].currentValue;
      const dynamicFormat = Number.isInteger(newValue) ? '1.0-0' : '1.2-2';

      this.animateValue(changes['value'].previousValue || 0, newValue, dynamicFormat);
    }
  }

  private animateValue(start: number, end: number, format: string): void {
    const duration = 1000;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      const currentValue = start + (end - start) * progress;

      this.el.nativeElement.textContent = this.decimalPipe.transform(currentValue, format);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }
}
