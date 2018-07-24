import { Component } from '@angular/core';
import { select } from '@angular-redux/store';
import { Observable } from 'rxjs';
import { AppActions } from '../../store/app/actions';

import { ErrorHighlightService } from '../../services/error-highlight.service';
import { BsModalRef, BsModalService } from 'ngx-bootstrap';

import { RouteWizardComponent } from '../route-wizard/route-wizard.component';
import { RouteMasterWizardComponent } from '../route-master-wizard/route-master-wizard.component';

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
  modalRef: BsModalRef;

  constructor(
    public appActions: AppActions,
    private errorHighlightSrv: ErrorHighlightService,
    private modalService: BsModalService,
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

  public createAutomaticRoute(): any {
    this.modalRef = this.modalService.show(RouteWizardComponent, { class: 'modal-lg', ignoreBackdropClick: true });
  }

  public createAutomaticRouteMaster(): any {
    this.modalRef = this.modalService.show(RouteMasterWizardComponent, { class: 'modal-lg', ignoreBackdropClick: true });
  }
}
