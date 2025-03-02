import {Injectable} from '@angular/core';
import {MatPaginatorIntl} from '@angular/material/paginator';
import {TranslateService} from '@ngx-translate/core';

@Injectable()
export class CustomPaginatorIntl extends MatPaginatorIntl {
  constructor(private translate: TranslateService) {
    super();
    this.translate.onLangChange.subscribe(() => {
      this.setTranslations();
    });
    this.setTranslations();
  }

  override getRangeLabel = (page: number, pageSize: number, length: number): string => {
    if (length === 0) {
      return this.translate.instant('PAGINATOR.RANGE_LABEL_EMPTY', {length});
    }
    const startIndex = page * pageSize;
    const endIndex = Math.min(startIndex + pageSize, length);
    return this.translate.instant('PAGINATOR.RANGE_LABEL', {start: startIndex + 1, end: endIndex, length});
  };

  private setTranslations() {
    this.translate.get([
      'PAGINATOR.ITEMS_PER_PAGE',
      'PAGINATOR.NEXT_PAGE',
      'PAGINATOR.PREVIOUS_PAGE',
      'PAGINATOR.FIRST_PAGE',
      'PAGINATOR.LAST_PAGE'
    ]).subscribe(translations => {
      this.itemsPerPageLabel = translations['PAGINATOR.ITEMS_PER_PAGE'];
      this.nextPageLabel = translations['PAGINATOR.NEXT_PAGE'];
      this.previousPageLabel = translations['PAGINATOR.PREVIOUS_PAGE'];
      this.firstPageLabel = translations['PAGINATOR.FIRST_PAGE'];
      this.lastPageLabel = translations['PAGINATOR.LAST_PAGE'];

      this.changes.next(); // Обновляем пагинатор
    });
  }
}
