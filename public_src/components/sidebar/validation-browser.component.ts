import { Component } from '@angular/core';

import { BsModalService } from 'ngx-bootstrap';
import { MapService } from '../../services/map.service';

import { ErrorHighlightService } from '../../services/error-highlight.service';
import { Observable } from 'rxjs';
import { select } from '@angular-redux/store';
import { AppActions } from '../../store/app/actions';

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
  constructor(private modalService: BsModalService,
              private mapSrv: MapService,
              private errorHighlightSrv: ErrorHighlightService,
              public appActions: AppActions,
              private overpassSrv: OverpassService,
              public storageSrv: StorageService) {

    this.storageSrv.refreshErrorObjects.subscribe((data) => {
      if (data === 'missing name') {
        this.nameErrorsO = this.storageSrv.nameErrorsO;
      }
    });

  }

  /***
   * Counts and list all errors
   * @returns {void}
   */
  private startValidation(): void {
    this.refErrorsO = [];
    this.nameErrorsO = [];
    if (this.mapSrv.map.getZoom() > 11) {
      this.appActions.actSetErrorCorrectionMode('menu');
      this.overpassSrv.requestNewOverpassData();
    } else {
      alert('Not sufficient zoom level');
    }
  }

  /***
   * Starts name correction mode
   * @returns {void}
   */
  private startNameCorrection(): void {
      this.appActions.actSetErrorCorrectionMode('missing name tag');
      this.errorHighlightSrv.missingTagError('name');
  }

  /***
   * Moves to next location
   */
  private nextLocation(): void {
    this.errorHighlightSrv.nextLocation();
  }

  /***
   * Moves to prev location
   */
  private previousLocation(): void {
    this.errorHighlightSrv.previousLocation();
  }

  /***
   * Quits mode
   */
  private quit(): void {
    this.errorHighlightSrv.quit();
    this.storageSrv.currentElement = null;
    this.storageSrv.currentElementsChange.emit(
      JSON.parse(JSON.stringify(null)),
    );
   }

  /***
   * Jumps to different location
   * @param {number} index
   */

  private jumpToLocation(index: number): void {
    console.log('sad');
    this.errorHighlightSrv.jumpToLocation(index);
  }
  }
