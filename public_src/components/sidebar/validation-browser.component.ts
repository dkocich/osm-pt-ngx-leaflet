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

  public errorList: object[] = [];
  public refErrorsO;
  public nameErrorsO;
  public dataDownloaded: boolean = false;
  constructor(private modalService: BsModalService,
              private mapSrv: MapService,
              private errorHighlightSrv: ErrorHighlightService,
              public appActions: AppActions,
              private overpassSrv: OverpassService,
              public storageSrv: StorageService) {


    this.storageSrv.refreshErrorObjects.subscribe((data) =>{
      if (data === 'missing name') {
        this.nameErrorsO = this.storageSrv.nameErrorsO;
      }
      if (data === 'missing ref') {
        this.refErrorsO = this.storageSrv.refErrorsO;
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
      this.appActions.actSetErrorCorrectionMode('general');
      this.overpassSrv.requestNewOverpassData();
    } else {
      alert('Not sufficient zoom level');
    }
  }



  /***
   * Starts name correction mode
   * @returns {void}
   */
  startNameCorrection(): void {
      // let inBounds = this.errorHighlightSrv.getAllStopsInCurrentBounds(this.storageSrv.listOfStops);
      // this.overpassSrv.download(inBounds);
      this.appActions.actSetErrorCorrectionMode('missing name tag');
      this.errorHighlightSrv.missingTagError('name');
  }

  /***
   * Starts ref correction mode
   * @returns {any}
   */
  startRefCorrection(): any {
    this.appActions.actSetErrorCorrectionMode('missing ref tag');
    this.errorHighlightSrv.missingTagError('ref');
  }

  checkMapCenter(latlng: any): boolean {
    if (JSON.stringify(latlng) === JSON.stringify(this.mapSrv.map.getCenter())) {
      console.log('true');
      return true;
    } else {
      console.log('false');
      return false;
    }
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
   }

  private missingNameTag(): any {

   }

  // startNameCorrection2(): void {
  //   if (this.mapSrv.map.getZoom() > 11) {
  //     let inBounds = this.errorHighlightSrv.getAllStopsInCurrentBounds(this.storageSrv.listOfStops);
  //     this.overpassSrv.download(inBounds);
  //     this.appActions.actSetErrorCorrectionMode('missing name tag');
  //     this.errorHighlightSrv.startCorrection('name');
  //   } else {
  //     alert('Not sufficient zoom level');
  //   }
  //  }

  jumpToLocation(index: number): void {
    console.log('sad');
    this.errorHighlightSrv.jumpToLocation(index);
  }
  }
