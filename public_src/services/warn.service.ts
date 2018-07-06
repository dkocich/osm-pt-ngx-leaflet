import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { TranslateService, TranslationChangeEvent } from '@ngx-translate/core';

@Injectable()
export class WarnService {
  private successMessage = 'Data fetched successfully';
  private errorMessage = 'Error in fetching data';
  private genericSuccessMessage = 'Success!';

  constructor(
    private toastrSrv: ToastrService,
    private translateSrv: TranslateService,
  ) {
    /***
     * Listens to language change event and translates error and success messages
     */
    this.translateSrv.onLangChange.subscribe((event: TranslationChangeEvent) => {
      this.successMessage = event.translations[this.successMessage];
      this.errorMessage = event.translations[this.errorMessage];
      this.genericSuccessMessage = event.translations[this.genericSuccessMessage];
    });
  }

  public showError(): void {
    this.toastrSrv.error(this.errorMessage);
  }

  public showSuccess(): void {
    this.toastrSrv.success(this.successMessage);
  }

  public showGenericSuccess(): void {
    this.toastrSrv.success(this.genericSuccessMessage);
  }

}
