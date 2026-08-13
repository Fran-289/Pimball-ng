import { Pipe, PipeTransform, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { TranslationService } from '../../core/services/translation.service';
import { Subscription } from 'rxjs';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false // Updates automatically on language change
})
export class TranslatePipe implements PipeTransform, OnDestroy {
  private lastValue: string = '';
  private lastKey: string = '';
  private langSub: Subscription;

  constructor(private translationService: TranslationService, private cdr: ChangeDetectorRef) {
    this.langSub = this.translationService.currentLanguage$.subscribe(() => {
      this.lastValue = ''; // Force re-evaluation
      this.cdr.markForCheck();
    });
  }

  transform(key: string): string {
    if (this.lastKey === key && this.lastValue !== '') {
      return this.lastValue;
    }
    
    this.lastKey = key;
    this.lastValue = this.translationService.translate(key);
    return this.lastValue;
  }

  ngOnDestroy() {
    if (this.langSub) {
      this.langSub.unsubscribe();
    }
  }
}
