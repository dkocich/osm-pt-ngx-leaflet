import { Component } from '@angular/core';

import { Observable } from 'rxjs';

import { NgRedux, select } from '@angular-redux/store';
import { AppActions } from '../../store/app/actions';
import { IAppState } from '../../store/model';

import { ErrorHighlightService } from '../../services/error-highlight.service';
import { ProcessService } from '../../services/process.service';
import { StorageService } from '../../services/storage.service';
import { MapService } from '../../services/map.service';
import { TutorialService } from '../../services/tutorial.service';

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
    private processSrv: ProcessService,
    private storageSrv: StorageService,
    private mapSrv: MapService,
    private tutorialSrv: TutorialService,
    private ngRedux: NgRedux<IAppState>,
  ) {
    //
  }

  public changeConnMode(goodConnectMode: boolean): void {
    this.appActions.actSetGoodConnectMode(goodConnectMode);
    localStorage.setItem('goodConnectMode', JSON.stringify(goodConnectMode));
  }

  public changeExpMode(advancedExpMode: boolean): void {
    this.appActions.actToggleSwitchMode(false);
    this.processSrv.refreshSidebarView('cancel selection');
    this.mapSrv.removePopUps();
    this.storageSrv.currentElement = null;
    this.storageSrv.currentElementsChange.emit(
      JSON.parse(JSON.stringify(null)),
    );
    this.appActions.actSetErrorCorrectionMode(null);
    this.appActions.actSetAdvancedExpMode(advancedExpMode);
    localStorage.setItem('advancedMode', JSON.stringify(advancedExpMode));
    if (this.ngRedux.getState()['app']['tutorialMode'] === false && advancedExpMode) {
      this.storageSrv.tutorialStepCompleted.emit();
    }
  }
}
