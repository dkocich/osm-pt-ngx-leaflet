import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Observable } from 'rxjs';

import { NgRedux, select } from '@angular-redux/store';
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
import { IErrorObject, IRefErrorObject } from '../../core/errorObject.interface';

@Component({
  selector: 'validation-browser',
  templateUrl: './validation-browser.component.html',
  styleUrls: ['./validation-browser.component.less'],
})
export class ValidationBrowserComponent implements OnInit, OnDestroy {
  @select(['app', 'editing']) public readonly editing$: Observable<boolean>;
  @select(['app', 'errorCorrectionMode']) public readonly errorCorrectionMode$: Observable<object>;
  @select(['app', 'switchMode']) public readonly switchMode$: Observable<boolean>;

  // name start correction
  // ref suggestions
  // ref start correction
  //
  //
  //


  public refErrorsObj: IRefErrorObject[];
  public nameErrorsObj: IErrorObject[];
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
      if (typeOfErrorObject === 'missing name') {
        this.nameErrorsObj = this.storageSrv.nameErrorsObj;
      }

      if (typeOfErrorObject === 'missing ref') {
        this.refErrorsObj = this.storageSrv.refErrorsObj;
      }
    });

    this.errorCorrectionModeSubscription = ngRedux.select<ISuggestionsBrowserOptions>(['app', 'errorCorrectionMode'])
      .subscribe((data) => this.errorCorrectionMode = data);

  }
  public ngOnInit(): void {
    this.appActions.actSetErrorCorrectionMode(this.suggestionsBrowserOptions);
  }

  /**
   * Counts and list all errors
   * @returns {void}
   */
  public startValidation(): void {
    this.nameErrorsObj = [];
    this.refErrorsObj = [];

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
    if (this.errorCorrectionMode.refSuggestions) {
    this.appActions.actSetErrorCorrectionMode(
      {
        nameSuggestions: {
          found          : true,
          startCorrection: true,
        },
        refSuggestions : this.errorCorrectionMode.refSuggestions,
      }); }
      else {
      this.appActions.actSetErrorCorrectionMode(
        {
          nameSuggestions: {
            found          : true,
            startCorrection: true,
          },
          refSuggestions : this.errorCorrectionMode.refSuggestions,
        });
    }
    this.errorHighlightSrv.missingTagError('name');
  }

  /***
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
        });
    } else {
      this.appActions.actSetErrorCorrectionMode(
        {
          nameSuggestions: {
            found          : true,
            startCorrection: false,
          },
          refSuggestions : this.errorCorrectionMode.refSuggestions,
        });
    }
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
  }

  /**
   * Jumps to different location
   * @param {number} index
   */
  public jumpToLocation(index: number): void {
    this.errorHighlightSrv.jumpToLocation(index);
  }

  private getNodeType(stop: IPtStop): string {
    if (stop.tags.public_transport === 'platform') {
      return 'platform';
    }
    if (stop.tags.public_transport === 'stop_position' || stop.tags.highway === 'bus_stop') {
      return 'stop';
    }
  }

  ngOnDestroy(): void {
    this.errorCorrectionModeSubscription.unsubscribe();
  }

  /***
   * Determines if given window should bw viewed
   * @param {string} name
   * @returns {boolean}
   */
  view(name: string): boolean {
    switch (name) {
      case 'name-error-list':
        return this.errorCorrectionMode &&
          this.errorCorrectionMode.nameSuggestions.startCorrection;
      case 'name-errors-menu-item':
        return this.errorCorrectionMode &&
          this.errorCorrectionMode.nameSuggestions.found;
      case 'ref-error-list':
        return this.errorCorrectionMode &&
          this.errorCorrectionMode.refSuggestions &&
          this.errorCorrectionMode.refSuggestions.startCorrection;
      case 'ref-errors-menu-item' :
        return this.errorCorrectionMode &&
          this.errorCorrectionMode.refSuggestions &&
          this.errorCorrectionMode.refSuggestions.found;
      case 'menu':
        return this.errorCorrectionMode &&
          (this.errorCorrectionMode.refSuggestions ? (!this.errorCorrectionMode.refSuggestions.startCorrection) : true) &&
          !this.errorCorrectionMode.nameSuggestions.startCorrection;
      case 'find-errors-option':
        return this.errorCorrectionMode &&
          !this.errorCorrectionMode.nameSuggestions.startCorrection &&
          ((this.errorCorrectionMode.refSuggestions) ? (!this.errorCorrectionMode.refSuggestions.startCorrection) : true);
      default:
        alert('fix me');
        return false;
    }
  }

}
