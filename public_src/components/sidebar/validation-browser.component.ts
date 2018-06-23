import { Component, TemplateRef } from '@angular/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap';
import { MapService } from '../../services/map.service';
import { ErrorHighlightService } from '../../services/error-highlight.service';
import { Observable } from 'rxjs';
import {  select } from '@angular-redux/store';
import { AppActions } from '../../store/app/actions';

@Component({
  selector: 'validation-browser',
  templateUrl: './validation-browser.component.html',
  styleUrls: ['./validation-browser.component.less'],
})
export class ValidationBrowserComponent {
  @select(['app', 'editing']) public readonly editing$: Observable<boolean>;
  @select(['app', 'errorCorrectionMode']) public readonly errorCorrectionMode$: Observable<string>;
  public errorList: object[] = [];
  constructor(private modalService: BsModalService,
              private mapSrv: MapService,
              private errorHighlightSrv: ErrorHighlightService,
              public appActions: AppActions) { }

  /***
   * Counts and list all  errors
   * @returns {void}
   */
  startValidation(): void {
    if (this.mapSrv.map.getZoom() > 11) {
    this.errorHighlightSrv.countErrors();
    this.errorList = this.errorHighlightSrv.errorList;
    } else {
      alert('Not sufficient zoom level');
    }
  }

  /***
   * Starts name correction mode
   * @returns {void}
   */
  startNameCorrection(): void {
    this.appActions.actSetErrorCorrectionMode('missing name tag');
    this.errorHighlightSrv.startCorrection('name');
  }

  /***
   * Starts ref correction mode
   * @returns {any}
   */
  startRefCorrection(): any {
    this.appActions.actSetErrorCorrectionMode('missing ref tag');
    this.errorHighlightSrv.startCorrection('ref');
  }
}
