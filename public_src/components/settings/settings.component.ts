import { Component } from '@angular/core';
import { select } from '@angular-redux/store';
import { Observable } from 'rxjs';
import { AppActions } from '../../store/app/actions';

import { ErrorHighlightService } from '../../services/error-highlight.service';

@Component({
  selector: 'settings',
  styleUrls: [
    './settings.component.less',
    '../../styles/main.less',
  ],
  templateUrl: './settings.component.html',
})
export class SettingsComponent {
  @select(['app', 'advancedExpMode']) public readonly advancedExpMode$: Observable<boolean>;
  @select(['app', 'goodConnectMode']) public readonly goodConnectMode$: Observable<boolean>;
  @select(['app', 'editing']) public readonly editing$: Observable<boolean>;

  constructor(
    public appActions: AppActions,
    private errorHighlightSrv: ErrorHighlightService,
  ) {
    //
  }

  public changeConnMode(goodConnectMode: boolean): void {
    this.appActions.actSetGoodConnectMode(goodConnectMode);
    localStorage.setItem('goodConnectMode', JSON.stringify(goodConnectMode));
  }

  public changeExpMode(advancedExpMode: boolean): void {
    this.appActions.actToggleSwitchMode(false);
    this.errorHighlightSrv.quit();
    this.appActions.actSetAdvancedExpMode(advancedExpMode);
    localStorage.setItem('advancedMode', JSON.stringify(advancedExpMode));
  }
}
