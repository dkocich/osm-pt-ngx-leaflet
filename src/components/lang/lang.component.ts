import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

// import { BsDropdownModule } from "ngx-bootstrap/dropdown";

@Component({
  providers: [],
  selector: 'lang',
  styleUrls: ['./lang.component.less', '../../styles/main.less'],
  templateUrl: './lang.component.html',
})
export class LangComponent {
  constructor(public translate: TranslateService) {
    translate.setDefaultLang('en');
    this.switchLanguage(translate.defaultLang);
  }

  switchLanguage(language: string): void {
    this.translate.use(language);
  }
}
