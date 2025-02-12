import {Injectable} from '@angular/core';
import {MatPaginatorIntl} from '@angular/material/paginator';

@Injectable()
export class CustomPaginatorIntl extends MatPaginatorIntl {
  override itemsPerPageLabel = 'Элементов на странице:'; // ✅ Новый текст
  override nextPageLabel = 'Следующая страница';
  override previousPageLabel = 'Предыдущая страница';
  override firstPageLabel = 'Первая страница';
  override lastPageLabel = 'Последняя страница';

  override getRangeLabel = (page: number, pageSize: number, length: number): string => {
    if (length === 0) {
      return `0 из ${length}`;
    }
    const startIndex = page * pageSize;
    const endIndex = Math.min(startIndex + pageSize, length);
    return `${startIndex + 1} – ${endIndex} из ${length}`;
  };
}
