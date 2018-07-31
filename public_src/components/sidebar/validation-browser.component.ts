import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { NgRedux, select } from '@angular-redux/store';
import { Observable } from 'rxjs';

import { IAppState } from '../../store/model';
import { AppActions } from '../../store/app/actions';

import { BsModalService } from 'ngx-bootstrap';

import { ErrorHighlightService } from '../../services/error-highlight.service';
import { MapService } from '../../services/map.service';
import { OverpassService } from '../../services/overpass.service';
import { StorageService } from '../../services/storage.service';
import { ConfService } from '../../services/conf.service';

import { IPtStop } from '../../core/ptStop.interface';
import { ISuggestionsBrowserOptions } from '../../core/editingOptions.interface';
import { INameErrorObject, IPTvErrorObject, IRefErrorObject, IWayErrorObject } from '../../core/errorObject.interface';

@Component({
  selector: 'validation-browser',
  templateUrl: './validation-browser.component.html',
  styleUrls: ['./validation-browser.component.less'],
})
export class ValidationBrowserComponent implements OnInit, OnDestroy {
  @select(['app', 'editing']) public readonly editing$: Observable<boolean>;
  @select(['app', 'errorCorrectionMode']) public readonly errorCorrectionMode$: Observable<object>;
  @select(['app', 'switchMode']) public readonly switchMode$: Observable<boolean>;

  public refErrorsObj: IRefErrorObject[];
  public nameErrorsObj: INameErrorObject[];
  public wayErrorsObj: IWayErrorObject[];
  public PTvErrorsObj: IPTvErrorObject[];

  @Input() suggestionsBrowserOptions: ISuggestionsBrowserOptions;
  public errorCorrectionModeSubscription;
  public errorCorrectionMode: ISuggestionsBrowserOptions;

  constructor(
    private errorHighlightSrv: ErrorHighlightService,
    private mapSrv: MapService,
    private modalService: BsModalService,
    private overpassSrv: OverpassService,
    public appActions: AppActions,
    public storageSrv: StorageService,
    private ngRedux: NgRedux<IAppState>,
  ) {

    this.storageSrv.refreshErrorObjects.subscribe((data) => {
      const { typeOfErrorObject } = data;
      if (typeOfErrorObject === 'missing name tags') {
        this.nameErrorsObj = this.storageSrv.nameErrorsObj;
      }

      if (typeOfErrorObject === 'missing refs') {
        this.refErrorsObj = this.storageSrv.refErrorsObj;
      }

      if (typeOfErrorObject === 'way as parent') {
        this.wayErrorsObj = this.storageSrv.wayErrorsObj;
      }

      if (typeOfErrorObject === 'PTv correction') {
        this.PTvErrorsObj = this.storageSrv.PTvErrorsObj;
      }
    });

    this.errorCorrectionModeSubscription = ngRedux.select<ISuggestionsBrowserOptions>(['app', 'errorCorrectionMode'])
      .subscribe((data) => this.errorCorrectionMode = data);

  }
  public ngOnInit(): void {
    this.appActions.actSetErrorCorrectionMode(this.suggestionsBrowserOptions);
  }

  public ngOnDestroy(): void {
    this.errorCorrectionModeSubscription.unsubscribe();
  }

  /**
   * Counts and list all errors
   * @returns {void}
   */
  public startValidation(): void {
    this.nameErrorsObj = [];
    this.refErrorsObj  = [];
    this.wayErrorsObj  = [];
    this.PTvErrorsObj  = [];
    if (this.mapSrv.map.getZoom() > ConfService.minDownloadZoomForErrors) {
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
    if (this.errorCorrectionMode.nameSuggestions) {
      this.appActions.actSetErrorCorrectionMode(
        {
          nameSuggestions: {
            found          : true,
            startCorrection: true,
          },
          refSuggestions : this.errorCorrectionMode.refSuggestions,
          waySuggestions : this.errorCorrectionMode.waySuggestions,
          PTvSuggestions  : this.errorCorrectionMode.PTvSuggestions,
        });
    }
    this.errorHighlightSrv.startCorrection('missing name tags');
  }

  public startWayCorrection(): void {
    if (this.errorCorrectionMode.waySuggestions) {
      this.appActions.actSetErrorCorrectionMode(
        {
          waySuggestions: {
            found          : true,
            startCorrection: true,
          },
          refSuggestions : this.errorCorrectionMode.refSuggestions,
          nameSuggestions : this.errorCorrectionMode.nameSuggestions,
          PTvSuggestions  : this.errorCorrectionMode.PTvSuggestions,
        }); }
    this.errorHighlightSrv.startCorrection('way as parent');
  }

  /**
   * Starts ref correction
   * @returns {void}
   */
  public startRefCorrection(): void {
    if (this.errorCorrectionMode.refSuggestions) {
      this.appActions.actSetErrorCorrectionMode(
        {
          nameSuggestions: this.errorCorrectionMode.nameSuggestions,
          refSuggestions : {
            found          : true,
            startCorrection: true,
          },
          waySuggestions: this.errorCorrectionMode.waySuggestions,
          PTvSuggestions: this.errorCorrectionMode.PTvSuggestions,
        });
    }
    this.errorHighlightSrv.startCorrection('missing refs');
  }

  /**
   * Starts PTv correction
   * @returns {void}
   */
  public startPTvCorrection(): void {
    if (this.errorCorrectionMode.PTvSuggestions) {
      this.appActions.actSetErrorCorrectionMode(
        {
          nameSuggestions: this.errorCorrectionMode.nameSuggestions,
          refSuggestions : this.errorCorrectionMode.refSuggestions,
          waySuggestions: this.errorCorrectionMode.waySuggestions,
          PTvSuggestions:  {
            found          : true,
            startCorrection: true,
          },
        });
    }
    this.errorHighlightSrv.startCorrection('PTv correction');
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
  }

  /**
   * Jumps to different location
   * @param {number} index
   */
  public jumpToLocation(index: number): void {
    this.errorHighlightSrv.jumpToLocation(index);
  }

  /**
   * Determines if given window should bw viewed
   * @param {string} name
   * @returns {boolean}
   */
  public view(name: string): boolean {
    switch (name) {
      case 'name-errors-menu-item':
        return this.errorCorrectionMode &&
          this.errorCorrectionMode.nameSuggestions.found;
      case 'ref-errors-menu-item' :
        return this.errorCorrectionMode &&
          this.errorCorrectionMode.refSuggestions &&
          this.errorCorrectionMode.refSuggestions.found;
      case 'way-errors-menu-item':
        return this.errorCorrectionMode &&
          this.errorCorrectionMode.waySuggestions &&
          this.errorCorrectionMode.waySuggestions.found;
      case 'PTv-errors-menu-item':
        return this.errorCorrectionMode &&
          this.errorCorrectionMode.PTvSuggestions &&
          this.errorCorrectionMode.PTvSuggestions.found;
      case 'name-error-list':
        return this.errorCorrectionMode &&
          this.errorCorrectionMode.nameSuggestions.startCorrection;
      case 'ref-error-list':
        return this.errorCorrectionMode &&
          this.errorCorrectionMode.refSuggestions &&
          this.errorCorrectionMode.refSuggestions.startCorrection;
      case 'way-error-list':
        return this.errorCorrectionMode &&
          this.errorCorrectionMode.waySuggestions &&
          this.errorCorrectionMode.waySuggestions.startCorrection;
      case 'PTv-error-list':
        return this.errorCorrectionMode &&
          this.errorCorrectionMode.PTvSuggestions &&
          this.errorCorrectionMode.PTvSuggestions.startCorrection;
      case 'menu':
        return this.errorCorrectionMode &&
          (this.errorCorrectionMode.refSuggestions ? (!this.errorCorrectionMode.refSuggestions.startCorrection) : true) &&
          (this.errorCorrectionMode.waySuggestions ? (!this.errorCorrectionMode.waySuggestions.startCorrection) : true) &&
          (this.errorCorrectionMode.PTvSuggestions ? (!this.errorCorrectionMode.PTvSuggestions.startCorrection) : true) &&
          !this.errorCorrectionMode.nameSuggestions.startCorrection;
      case 'find-errors-option':
        return this.errorCorrectionMode &&
          !this.errorCorrectionMode.nameSuggestions.startCorrection &&
          ((this.errorCorrectionMode.refSuggestions) ? (!this.errorCorrectionMode.refSuggestions.startCorrection) : true) &&
          ((this.errorCorrectionMode.PTvSuggestions) ? (!this.errorCorrectionMode.PTvSuggestions.startCorrection) : true) &&
          ((this.errorCorrectionMode.waySuggestions) ? (!this.errorCorrectionMode.waySuggestions.startCorrection) : true);
    }
  }

  private getNodeType(stop: IPtStop): string {
    if (stop.tags.public_transport === 'platform') {
      return 'platform';
    }
    if (stop.tags.public_transport === 'stop_position' || stop.tags.highway === 'bus_stop') {
      return 'stop';
    }
  }
}
