import { Component } from '@angular/core';

import { select, NgRedux } from '@angular-redux/store';

import { Observable } from 'rxjs';

import { ErrorHighlightService } from '../../services/error-highlight.service';
import { MapService } from '../../services/map.service';
import { ProcessService } from '../../services/process.service';

import { IAppState } from '../../store/model';
import { AppActions } from '../../store/app/actions';

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
  @select(['app', 'errorCorrectionMode']) public readonly errorCorrectionMode$: Observable<string>;

  private subscription: any;
  private isErrorMode: boolean = false;
  constructor(
    public appActions: AppActions,
    public errorHighlightSrv: ErrorHighlightService,
    private ngRedux: NgRedux<IAppState>,
    private mapSrv: MapService,
    private processSrv: ProcessService,
    ) {
    //
    this.subscription = ngRedux.select<string>(['app', 'errorCorrectionMode'])
      .subscribe((data) => {
        if (data === 'missing tag') {
          this.errorHighlightSrv.missingTagError('name');
        }
      });
  }

  public changeConnMode(goodConnectMode: boolean): void {
    this.appActions.actSetGoodConnectMode(goodConnectMode);
    localStorage.setItem('goodConnectMode', JSON.stringify(goodConnectMode));
  }

  public changeExpMode(advancedExpMode: boolean): void {
    this.appActions.actSetAdvancedExpMode(advancedExpMode);
    localStorage.setItem('advancedMode', JSON.stringify(advancedExpMode));
  }

  /***
   * Toggles on/off of error highlight mode
   * @param {string} errorHighlightModeMode
   */
  public toggleErrorMode(errorHighlightModeMode: string): void {

    if (this.isErrorMode) {
      document.getElementById('map').style.width = '65%';
      this.mapSrv.map.invalidateSize();
      this.appActions.actSetErrorCorrectionMode(null);
      this.processSrv.refreshSidebarView('cancel selection');
      this.mapSrv.removePopUps();
      this.isErrorMode =  false;
    } else {
      this.mapSrv.clearHighlight();
      document.getElementById('map').style.width = '100%';
      this.mapSrv.map.invalidateSize();
      this.appActions.actSetErrorCorrectionMode(errorHighlightModeMode);
      this.isErrorMode = true;
    }

  }
}
