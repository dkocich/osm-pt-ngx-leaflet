import { NgRedux, select } from '@angular-redux/store';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Hotkey, HotkeysService } from 'angular2-hotkeys';
import { BsModalService } from 'ngx-bootstrap';
import { Observable } from 'rxjs';
import { ISuggestionsBrowserOptions } from '../../core/editingOptions.interface';
import {
  INameErrorObject,
  IPTPairErrorObject,
  IPTvErrorObject,
  IRefErrorObject,
  IWayErrorObject,
} from '../../core/errorObject.interface';
import { IPtStop } from '../../core/ptStop.interface';
import { ConfService } from '../../services/conf.service';
import { ErrorHighlightService } from '../../services/error-highlight.service';
import { MapService } from '../../services/map.service';
import { OverpassService } from '../../services/overpass.service';
import { StorageService } from '../../services/storage.service';
import { AppActions } from '../../store/app/actions';
import { IAppState } from '../../store/model';

@Component({
  selector: 'validation-browser',
  templateUrl: './validation-browser.component.html',
  styleUrls: ['./validation-browser.component.less'],
})
export class ValidationBrowserComponent implements OnInit, OnDestroy {
  @select(['app', 'editing']) readonly editing$: Observable<boolean>;
  @select(['app', 'errorCorrectionMode'])
  readonly errorCorrectionMode$: Observable<object>;
  @select(['app', 'switchMode']) readonly switchMode$: Observable<boolean>;

  refErrorsObj: IRefErrorObject[];
  nameErrorsObj: INameErrorObject[];
  wayErrorsObj: IWayErrorObject[];
  PTvErrorsObj: IPTvErrorObject[];
  ptPairErrorsObj: IPTPairErrorObject[];

  @Input() suggestionsBrowserOptions: ISuggestionsBrowserOptions;
  errorCorrectionModeSubscription;
  errorCorrectionMode: ISuggestionsBrowserOptions;

  constructor(
    private errorHighlightSrv: ErrorHighlightService,
    private mapSrv: MapService,
    private modalService: BsModalService,
    private overpassSrv: OverpassService,
    public appActions: AppActions,
    public storageSrv: StorageService,
    private ngRedux: NgRedux<IAppState>,
    private hotkeysService: HotkeysService
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

      if (typeOfErrorObject === 'pt-pair') {
        this.ptPairErrorsObj = this.storageSrv.ptPairErrorsObject;
      }
    });

    this.errorCorrectionModeSubscription = ngRedux
      .select<ISuggestionsBrowserOptions>(['app', 'errorCorrectionMode'])
      .subscribe((data) => {
        this.errorCorrectionMode = data;
      });

    this.hotkeysService.add([
      new Hotkey(
        'alt+1',
        (): boolean => {
          this.quit();
          this.startNameCorrection();
          return false;
        },
        undefined,
        'Start missing name correction'
      ),
      new Hotkey(
        'alt+2',
        (): boolean => {
          this.quit();
          this.startRefCorrection();
          return false;
        },
        undefined,
        'Start references correction'
      ),
      new Hotkey(
        'alt+3',
        (): boolean => {
          this.quit();
          this.startWayCorrection();
          return false;
        },
        undefined,
        'Start way as parent correction'
      ),
      new Hotkey(
        'alt+4',
        (): boolean => {
          this.quit();
          this.startPTvCorrection();
          return false;
        },
        undefined,
        'Start PTv2 correction'
      ),
      new Hotkey(
        'alt+5',
        (): boolean => {
          this.quit();
          this.startPTPairCorrection();
          return false;
        },
        undefined,
        'Find suggestions'
      ),
      new Hotkey(
        'f',
        (): boolean => {
          this.quit();
          this.startValidation();
          return false;
        },
        undefined,
        'Start missing name correction'
      ),
    ]);
  }
  ngOnInit(): void {
    this.appActions.actSetErrorCorrectionMode(this.suggestionsBrowserOptions);
  }

  ngOnDestroy(): void {
    this.errorCorrectionModeSubscription.unsubscribe();
  }

  /**
   * Counts and list all errors
   */
  startValidation(): void {
    this.nameErrorsObj = [];
    this.refErrorsObj = [];
    this.wayErrorsObj = [];
    this.PTvErrorsObj = [];
    this.ptPairErrorsObj = [];
    if (this.mapSrv.map.getZoom() > ConfService.minDownloadZoomForErrors) {
      this.overpassSrv.requestNewOverpassData();
    } else {
      alert('Not sufficient zoom level');
    }
  }

  /**
   * Starts name correction mode
   */
  startNameCorrection(): void {
    if (this.errorCorrectionMode.nameSuggestions) {
      this.appActions.actSetErrorCorrectionMode({
        nameSuggestions: {
          found: true,
          startCorrection: true,
        },
        refSuggestions: this.errorCorrectionMode.refSuggestions,
        waySuggestions: this.errorCorrectionMode.waySuggestions,
        PTvSuggestions: this.errorCorrectionMode.PTvSuggestions,
        ptPairSuggestions: this.errorCorrectionMode.ptPairSuggestions,
      });
    }
    this.errorHighlightSrv.startCorrection('missing name tags');
  }

  startWayCorrection(): void {
    if (this.errorCorrectionMode.waySuggestions) {
      this.appActions.actSetErrorCorrectionMode({
        waySuggestions: {
          found: true,
          startCorrection: true,
        },
        refSuggestions: this.errorCorrectionMode.refSuggestions,
        nameSuggestions: this.errorCorrectionMode.nameSuggestions,
        PTvSuggestions: this.errorCorrectionMode.PTvSuggestions,
        ptPairSuggestions: this.errorCorrectionMode.ptPairSuggestions,
      });
    }
    this.errorHighlightSrv.startCorrection('way as parent');
  }

  /**
   * Starts ref correction
   */
  startRefCorrection(): void {
    if (this.errorCorrectionMode.refSuggestions) {
      this.appActions.actSetErrorCorrectionMode({
        nameSuggestions: this.errorCorrectionMode.nameSuggestions,
        refSuggestions: {
          found: true,
          startCorrection: true,
        },
        waySuggestions: this.errorCorrectionMode.waySuggestions,
        PTvSuggestions: this.errorCorrectionMode.PTvSuggestions,
        ptPairSuggestions: this.errorCorrectionMode.ptPairSuggestions,
      });
    }
    this.errorHighlightSrv.startCorrection('missing refs');
  }

  /**
   * Starts PTv correction
   */
  startPTvCorrection(): void {
    if (this.errorCorrectionMode.PTvSuggestions) {
      this.appActions.actSetErrorCorrectionMode({
        nameSuggestions: this.errorCorrectionMode.nameSuggestions,
        refSuggestions: this.errorCorrectionMode.refSuggestions,
        waySuggestions: this.errorCorrectionMode.waySuggestions,
        PTvSuggestions: {
          found: true,
          startCorrection: true,
        },
        ptPairSuggestions: this.errorCorrectionMode.ptPairSuggestions,
      });
    }
    this.errorHighlightSrv.startCorrection('PTv correction');
  }

  startPTPairCorrection(): void {
    if (this.errorCorrectionMode.ptPairSuggestions) {
      this.appActions.actSetErrorCorrectionMode({
        nameSuggestions: this.errorCorrectionMode.nameSuggestions,
        refSuggestions: this.errorCorrectionMode.refSuggestions,
        waySuggestions: this.errorCorrectionMode.waySuggestions,
        PTvSuggestions: this.errorCorrectionMode.PTvSuggestions,
        ptPairSuggestions: {
          found: true,
          startCorrection: true,
        },
      });
    }
    this.errorHighlightSrv.startCorrection('pt-pair');
  }

  /**
   * Moves to the next location
   */
  nextLocation(): void {
    this.errorHighlightSrv.nextLocation();
  }

  /**
   * Moves to the previous location
   */
  previousLocation(): void {
    this.errorHighlightSrv.previousLocation();
  }

  /**
   * Quits mode
   */
  quit(): void {
    this.errorHighlightSrv.quit();
  }

  /**
   * Jumps to different location
   */
  jumpToLocation(index: number): void {
    this.errorHighlightSrv.jumpToLocation(index);
  }

  /**
   * Determines if given window should bw viewed
   */
  view(name: string): boolean {
    switch (name) {
      case 'name-errors-menu-item':
        return (
          this.errorCorrectionMode &&
          this.errorCorrectionMode.nameSuggestions.found
        );
      case 'ref-errors-menu-item':
        return (
          this.errorCorrectionMode &&
          this.errorCorrectionMode.refSuggestions &&
          this.errorCorrectionMode.refSuggestions.found
        );
      case 'way-errors-menu-item':
        return (
          this.errorCorrectionMode &&
          this.errorCorrectionMode.waySuggestions &&
          this.errorCorrectionMode.waySuggestions.found
        );
      case 'PTv-errors-menu-item':
        return (
          this.errorCorrectionMode &&
          this.errorCorrectionMode.PTvSuggestions &&
          this.errorCorrectionMode.PTvSuggestions.found
        );
      case 'pt-pair-errors-menu-item':
        return (
          this.errorCorrectionMode &&
          this.errorCorrectionMode.ptPairSuggestions &&
          this.errorCorrectionMode.ptPairSuggestions.found
        );
      case 'name-error-list':
        return (
          this.errorCorrectionMode &&
          this.errorCorrectionMode.nameSuggestions.startCorrection
        );
      case 'ref-error-list':
        return (
          this.errorCorrectionMode &&
          this.errorCorrectionMode.refSuggestions &&
          this.errorCorrectionMode.refSuggestions.startCorrection
        );
      case 'way-error-list':
        return (
          this.errorCorrectionMode &&
          this.errorCorrectionMode.waySuggestions &&
          this.errorCorrectionMode.waySuggestions.startCorrection
        );
      case 'PTv-error-list':
        return (
          this.errorCorrectionMode &&
          this.errorCorrectionMode.PTvSuggestions &&
          this.errorCorrectionMode.PTvSuggestions.startCorrection
        );
      case 'pt-pair-error-list':
        return (
          this.errorCorrectionMode &&
          this.errorCorrectionMode.ptPairSuggestions &&
          this.errorCorrectionMode.ptPairSuggestions.startCorrection
        );
      case 'menu':
        return (
          this.errorCorrectionMode &&
          (this.errorCorrectionMode.refSuggestions
            ? !this.errorCorrectionMode.refSuggestions.startCorrection
            : true) &&
          (this.errorCorrectionMode.waySuggestions
            ? !this.errorCorrectionMode.waySuggestions.startCorrection
            : true) &&
          (this.errorCorrectionMode.PTvSuggestions
            ? !this.errorCorrectionMode.PTvSuggestions.startCorrection
            : true) &&
          (this.errorCorrectionMode.ptPairSuggestions
            ? !this.errorCorrectionMode.ptPairSuggestions.startCorrection
            : true) &&
          !this.errorCorrectionMode.nameSuggestions.startCorrection
        );
      case 'find-errors-option':
        return (
          this.errorCorrectionMode &&
          !this.errorCorrectionMode.nameSuggestions.startCorrection &&
          (this.errorCorrectionMode.refSuggestions
            ? !this.errorCorrectionMode.refSuggestions.startCorrection
            : true) &&
          (this.errorCorrectionMode.PTvSuggestions
            ? !this.errorCorrectionMode.PTvSuggestions.startCorrection
            : true) &&
          (this.errorCorrectionMode.ptPairSuggestions
            ? !this.errorCorrectionMode.ptPairSuggestions.startCorrection
            : true) &&
          (this.errorCorrectionMode.waySuggestions
            ? !this.errorCorrectionMode.waySuggestions.startCorrection
            : true)
        );
    }
  }

  getNodeType(stop: IPtStop): string {
    if (stop.tags.public_transport === 'platform') {
      return 'platform';
    }
    if (
      stop.tags.public_transport === 'stop_position' ||
      stop.tags.highway === 'bus_stop'
    ) {
      return 'stop';
    }
  }
}
