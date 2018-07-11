import { AppActions } from '../../store/app/actions';
import { BsModalService } from 'ngx-bootstrap';
import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { select } from '@angular-redux/store';

import { ErrorHighlightService } from '../../services/error-highlight.service';
import { MapService } from '../../services/map.service';
import { OverpassService } from '../../services/overpass.service';
import { StorageService } from '../../services/storage.service';

@Component({
  selector: 'validation-browser',
  templateUrl: './validation-browser.component.html',
  styleUrls: ['./validation-browser.component.less'],
})
export class ValidationBrowserComponent {
  @select(['app', 'editing']) public readonly editing$: Observable<boolean>;
  @select(['app', 'errorCorrectionMode']) public readonly errorCorrectionMode$: Observable<string>;
  @select(['app', 'switchMode']) public readonly switchMode$: Observable<boolean>;

  public refErrorsO;
  public nameErrorsO;

  constructor(
    private errorHighlightSrv: ErrorHighlightService,
    private mapSrv: MapService,
    private modalService: BsModalService,
    private overpassSrv: OverpassService,
    public appActions: AppActions,
    public storageSrv: StorageService,
  ) {

    this.storageSrv.refreshErrorObjects.subscribe((data) => {
      if (data === 'missing name') {
        this.nameErrorsO = this.storageSrv.nameErrorsO;
      }

      if (data === 'missing ref') {
        this.refErrorsO = this.storageSrv.refErrorsO;
      }
    });

  }

  /**
   * Counts and list all errors
   * @returns {void}
   */
  public startValidation(): void {
    this.refErrorsO = [];
    this.nameErrorsO = [];
    if (this.mapSrv.map.getZoom() > 11) {
      this.appActions.actSetErrorCorrectionMode('find errors');
      this.overpassSrv.requestNewOverpassData();
    } else {
      alert('Not sufficient zoom level');
    }
  }

  /**
   * Starts name correction mode
   * @returns {void}
   */
  public startNameCorrection(): void {
    this.appActions.actSetErrorCorrectionMode('missing name tag');
    this.errorHighlightSrv.missingTagError('name');
  }

  public startRefCorrection(): any {
    this.appActions.actSetErrorCorrectionMode('missing ref tag');
    this.errorHighlightSrv.missingTagError('ref');
  }
  /**
   * Moves to the next location
   */
  public nextLocation(): void {
    this.errorHighlightSrv.nextLocation();
  }

  /**
   * Moves to the previous location
   */
  public previousLocation(): void {
    this.errorHighlightSrv.previousLocation();
  }

  /**
   * Quits mode
   */
  public quit(): void {
    this.errorHighlightSrv.quit();
    this.storageSrv.currentElement = null;
    this.storageSrv.currentElementsChange.emit(
      JSON.parse(JSON.stringify(null)),
    );
  }

  /**
   * Jumps to different location
   * @param {number} index
   */
  public jumpToLocation(index: number): void {
    this.errorHighlightSrv.jumpToLocation(index);
  }
}
