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
import { Hotkey, HotkeysService } from 'angular2-hotkeys';

@Component({
  selector: 'settings',
  styleUrls: [
    './settings.component.less',
    '../../styles/main.less',
  ],
  templateUrl: './settings.component.html',
})
export class SettingsComponent {
  @select(['app', 'advancedExpMode']) readonly advancedExpMode$: Observable<boolean>;
  @select(['app', 'goodConnectMode']) readonly goodConnectMode$: Observable<boolean>;
  @select(['app', 'editing']) readonly editing$: Observable<boolean>;

  constructor(
    public appActions: AppActions,
    private errorHighlightSrv: ErrorHighlightService,
    private processSrv: ProcessService,
    private storageSrv: StorageService,
    private mapSrv: MapService,
    private tutorialSrv: TutorialService,
    private ngRedux: NgRedux<IAppState>,
    private hotkeysService: HotkeysService,
  ) {
    this.hotkeysService.add([new Hotkey('shift+c', (): boolean => {
      this.toggleConnMode();
      return false;
    }, undefined, 'Toggle connection mode'), new Hotkey('shift+a', (): boolean => {
      this.toggleExpMode();
      return false;
    }, undefined, 'Toggle expert mode')]);
  }

  changeConnMode(goodConnectMode: boolean): void {
    this.appActions.actSetGoodConnectMode(goodConnectMode);
    localStorage.setItem('goodConnectMode', JSON.stringify(goodConnectMode));
  }

  changeExpMode(advancedExpMode: boolean): void {
    this.appActions.actToggleSwitchMode(false);
    this.processSrv.refreshSidebarView('cancel selection');
    this.mapSrv.removePopUps();
    this.storageSrv.currentElement = null;
    this.storageSrv.currentElementsChange.emit(null);
    this.appActions.actSetErrorCorrectionMode(null);
    this.appActions.actSetAdvancedExpMode(advancedExpMode);
    localStorage.setItem('advancedMode', JSON.stringify(advancedExpMode));
    if (this.ngRedux.getState()['app']['tutorialMode'] === false && advancedExpMode) {
      this.storageSrv.tutorialStepCompleted.emit();
    }
  }

  toggleConnMode(): void {
    const connMode = this.ngRedux.getState()['app']['goodConnectMode'];
    this.appActions.actSetGoodConnectMode(!connMode);
    localStorage.setItem('goodConnectMode', JSON.stringify(!connMode));
  }

  toggleExpMode(): void {
    const advancedExpMode = this.ngRedux.getState()['app']['advancedExpMode'];
    this.appActions.actToggleSwitchMode(false);
    this.processSrv.refreshSidebarView('cancel selection');
    this.mapSrv.removePopUps();
    this.storageSrv.currentElement = null;
    this.storageSrv.currentElementsChange.emit(null);
    this.appActions.actSetErrorCorrectionMode(null);
    this.appActions.actSetAdvancedExpMode(!advancedExpMode);
    localStorage.setItem('advancedMode', JSON.stringify(!advancedExpMode));
    if (this.ngRedux.getState()['app']['tutorialMode'] === false && !advancedExpMode) {
      this.storageSrv.tutorialStepCompleted.emit();
    }
  }
}
