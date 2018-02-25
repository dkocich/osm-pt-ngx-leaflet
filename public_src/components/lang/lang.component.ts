import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

// import { BsDropdownModule } from "ngx-bootstrap/dropdown";

@Component({
  providers: [],
  selector: 'lang',
  styles: [require<any>('./lang.component.less')],
  templateUrl: './lang.component.html',
})
export class LangComponent {
  constructor(
    private translate: TranslateService,
  ) {
    translate.setDefaultLang('en');
    this.switchLanguage(translate.defaultLang);
  }

  public switchLanguage(language: string): void {
    this.translate.use(language);
  }
}
