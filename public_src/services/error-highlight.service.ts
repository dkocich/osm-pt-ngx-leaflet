import { Injectable } from '@angular/core';

import * as L from 'leaflet';
import * as MobileDetect from 'mobile-detect';

import { MapService } from './map.service';
import { ProcessService } from './process.service';
import { StorageService } from './storage.service';
import { EditService } from './edit.service';

import { AppActions } from '../store/app/actions';
import { IAppState } from '../store/model';

import { NgRedux } from '@angular-redux/store';

import { BsModalRef, BsModalService } from 'ngx-bootstrap';

import { ModalComponent } from '../components/modal/modal.component';

import { INameErrorObject, IPTvErrorObject, IRefErrorObject, IWayErrorObject, IPTPairErrorObject } from '../core/errorObject.interface';
import { ISuggestionsBrowserOptions } from '../core/editingOptions.interface';
import { IPtStop } from '../core/ptStop.interface';

@Injectable()
export class ErrorHighlightService {
  modalRef: BsModalRef;
  public nameErrorsObj: INameErrorObject[]     = [];
  public refErrorsObj: IRefErrorObject[]       = [];
  public wayErrorsObj: IWayErrorObject[]       = [];
  public PTvErrorsObj: IPTvErrorObject[]       = [];
  public ptPairErrorsObj: IPTPairErrorObject[] = [];

  public currentIndex = 0;
  public currentMode: 'missing name tags' | 'pt-pair' | 'missing refs' | 'way as parent' | 'PTv correction';

  public errorCorrectionMode: ISuggestionsBrowserOptions;
  public errorCorrectionModeSubscription;
  constructor(
    private modalService: BsModalService,
    private ngRedux: NgRedux<IAppState>,
    private processSrv: ProcessService,
    public appActions: AppActions,
    public mapSrv: MapService,
    public storageSrv: StorageService,
    private editSrv: EditService,
  ) {

    this.storageSrv.refreshErrorObjects.subscribe((data) => {
      const { typeOfErrorObject } = data;
      this.currentIndex = this.storageSrv.currentIndex;
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
    this.errorCorrectionModeSubscription = ngRedux.select<ISuggestionsBrowserOptions>(['app', 'errorCorrectionMode'])
      .subscribe((data) => this.errorCorrectionMode = data);
  }

  /***
   * Turns off marker click and starts switch location mode on
   * @param {string} errorName
   * @returns {void}
   */
  public startCorrection(errorName: 'missing name tags' | 'missing refs' | 'way as parent' | 'PTv correction' | 'pt-pair'): void {
    this.storageSrv.currentIndex = 0;
    this.storageSrv.refreshErrorObjects.emit({ typeOfErrorObject: errorName });
    this.currentMode = errorName;
    this.mapSrv.popUpLayerGroup = null;
    this.mapSrv.popUpArr = [];
    let stop;
    this.mapSrv.map.eachLayer((layer) => {
      if (layer['_latlng'] && layer['feature']) {
        layer.off('click');
      }
    });
    this.appActions.actToggleSwitchMode(true);
    if (this.currentMode === 'missing name tags') {
      stop = this.nameErrorsObj[0]['stop'];
      this.addSinglePopUp(this.nameErrorsObj[0]);
      this.mapSrv.map.setView({ lat: stop.lat, lng: stop.lon }, 15);
    }

    if (this.currentMode === 'missing refs') {
      this.addSinglePopUp(this.refErrorsObj[0]);
      stop = this.refErrorsObj[0]['stop'];
      this.mapSrv.map.setView({ lat: stop.lat, lng: stop.lon }, 15);
    }

    if (this.currentMode === 'way as parent') {
      this.addSinglePopUp(this.wayErrorsObj[0]);
      stop = this.wayErrorsObj[0]['stop'];
      this.mapSrv.map.setView({ lat: stop.lat, lng: stop.lon }, 15);
    }

    if (this.currentMode === 'PTv correction') {
      this.addSinglePopUp(this.PTvErrorsObj[0]);
      stop = this.PTvErrorsObj[0]['stop'];
      this.mapSrv.map.setView({ lat: stop.lat, lng: stop.lon }, 15);
    }

    if (this.currentMode === 'pt-pair') {
      this.startPTPairCorrection(this.ptPairErrorsObj[0]);
      stop = this.ptPairErrorsObj[0]['stop'];
      this.mapSrv.map.setView({ lat: stop.lat, lng: stop.lon }, 17);
    }
  }

  /**
   * Generates the popup content
   * @param {string} isCorrected
   * @returns {HTMLElement}
   */
  private static makePopUpContent(isCorrected: string): HTMLElement {
    let popupContent       = L.DomUtil.create('div', 'content');
    popupContent.innerHTML = '<i class="fa fa-exclamation-triangle" aria-hidden="true">';
    switch (isCorrected) {
      case 'true':
        popupContent           = L.DomUtil.create('div', 'content');
        popupContent.innerHTML = '<i class="fa fa-check" aria-hidden="true"></i>';
        break;
      case 'partial' :
        popupContent           = L.DomUtil.create('div', 'content');
        popupContent.innerHTML = '<i class="fa fa-question" aria-hidden="true"></i>';
        break;
      case 'false' :
        popupContent           = L.DomUtil.create('div', 'content');
        popupContent.innerHTML = '<i class="fa fa-exclamation-triangle" aria-hidden="true">';
        break;
    }
    return popupContent;
  }

  /***
   * Handles click events for popup
   * @param popUp
   * @param errorObj
   */

  private addClickListenerToPopUp(popUp: any, errorObj: any): void {
    let stop = errorObj['stop'];
    let popUpElement = popUp.getElement();
    let popUpId = popUp['_leaflet_id'];
    let errorCorrectionMode = this.ngRedux.getState()['app']['errorCorrectionMode'];

    L.DomEvent.addListener(popUpElement, 'click', (e) => {
      const featureId = Number(stop.id);
      const element   = this.processSrv.getElementById(featureId, this.storageSrv.elementsMap);
      if (element) {

        if ((errorCorrectionMode.nameSuggestions.startCorrection)) {
          this.openModalWithComponentForName(errorObj);
        }

        if ((errorCorrectionMode.refSuggestions && errorCorrectionMode.refSuggestions.startCorrection)) {
          this.openModalWithComponentForRef(errorObj);
        }

        if ((errorCorrectionMode.waySuggestions && errorCorrectionMode.waySuggestions.startCorrection)) {
          this.openModalWithComponentForWay(errorObj);
        }

        if ((errorCorrectionMode.PTvSuggestions && errorCorrectionMode.PTvSuggestions.startCorrection)) {
          this.openModalWithComponentForPTv(errorObj);
        }
        this.storageSrv.currentElementsChange.emit(
          JSON.parse(JSON.stringify(element)),
        );
      }
      if (this.mapSrv.currentPopUpFeatureId && this.mapSrv.currentPopUpFeatureId !== popUpId &&
        this.mapSrv.getPopUpFromArray(this.mapSrv.currentPopUpFeatureId)) {
        let previousPopUpElement = this.mapSrv.getPopUpFromArray(this.mapSrv.currentPopUpFeatureId);
        MapService.colorPopUpByColorName('white', previousPopUpElement);
        MapService.addHoverListenersToPopUp(previousPopUpElement);
      }
      this.mapSrv.currentPopUpFeatureId = popUpId;
      MapService.removeHoverListenersToPopUp(popUpElement);
      MapService.colorPopUpByEvent(e);

    });
  }

  /***
   * Opens up modal
   * @returns {void}
   */
  public openModalWithComponentForName(errorObject: INameErrorObject): void {
    const featureId = Number(errorObject.stop.id);
    const element   = this.processSrv.getElementById(featureId, this.storageSrv.elementsMap);
    const latlng = { lat: element.lat, lng: element.lon };

    let nearbyNodes = this.getNearbyNodeNames(latlng);
    let suggestedNames = this.getMostUsedName(nearbyNodes);

    const initialState = {
          error      : 'missing name tags',
          suggestedNames,
          nameErrorObject: errorObject,
        };
    this.modalRef = this.modalService.show(ModalComponent, { initialState });
  }

  /***
   * Opens up modal for ref
   * @returns {void}
   */
  public openModalWithComponentForRef(errorObject: IRefErrorObject): void {
    const featureId = Number(errorObject.stop.id);
    const element   = this.processSrv.getElementById(featureId, this.storageSrv.elementsMap);
    const latlng = { lat: element.lat, lng: element.lon };
    const parentRels       = this.getParentRelations(errorObject.stop.id);

    let missingRefRels: any = [];
    let initialState;

    if (parentRels.length !== 0) {
      if (errorObject.stop.tags['route_ref']) {
        let addedRefs  = this.getAlreadyAddedRefsInTag(errorObject.stop.tags['route_ref']);
        missingRefRels = this.compareRefs(parentRels, addedRefs);
      } else {
        for (let parent of parentRels) {
          missingRefRels.push(parent);
        }
      }
    }

    if (this.isMobileDevice()) {
      initialState = {
        error      : 'missing refs',
        missingRefRels,
        refErrorObject: errorObject,
      };
    } else {
      let nearbyRels = this.getNearbyRoutesSuggestions(latlng, missingRefRels);
      initialState = {
        error      : 'missing refs',
        missingRefRels,
        refErrorObject: errorObject,
        nearbyRels,
      };
    }
    this.modalRef = this.modalService.show(ModalComponent, { initialState });
  }

  /**
   * Opens modal for way as parent error
   * @param {IWayErrorObject} errorObject
   */
  public openModalWithComponentForWay(errorObject: IWayErrorObject): void {
    if (errorObject.corrected === 'false') {
      let initialState;
      initialState = {
        error      : 'way as parent',
        wayErrorObject: errorObject,
      };

      this.modalRef = this.modalService.show(ModalComponent, { initialState });
    }

  }

  /**
   * Opens modal for PTv errors
   * @param {IWayErrorObject} errorObject
   */
  public openModalWithComponentForPTv(errorObject: IWayErrorObject): void {
    if (errorObject.corrected === 'false') {
      let initialState;
      initialState = {
        error      : 'PTv',
        PTvErrorObject: errorObject,
      };

      this.modalRef = this.modalService.show(ModalComponent, { initialState });
    }

  }
  /***
   * Counts and forms name error objects
   */
  public countNameErrors(): void {
    this.storageSrv.currentIndex = 0;
    this.nameErrorsObj = [];
    this.storageSrv.nameErrorsObj = [];

    this.storageSrv.elementsMap.forEach((stop) => {
      if (stop.type === 'node' && (stop.tags.bus === 'yes' || stop.tags.public_transport)) {
        let errorObj: INameErrorObject = { stop, corrected: 'false' };
        if (!stop.tags['name'] && this.mapSrv.map.getBounds().contains(stop)) {
          this.nameErrorsObj.push(errorObj);
        }
      }
    });
    this.storageSrv.nameErrorsObj = this.nameErrorsObj;
    this.storageSrv.refreshErrorObjects.emit({ typeOfErrorObject: 'missing name tags' });

  }

  /***
   * Counts and forms ref error objects
   */
  public countRefErrors(): void {
    this.storageSrv.currentIndex = 0;
    this.refErrorsObj = [];
    this.storageSrv.refErrorsObj = [];
    let addedRefs   =  [];
    let missingRefRels = [];
    this.storageSrv.elementsMap.forEach((stop) => {
      if (stop.type === 'node' && (stop.tags.bus === 'yes' || stop.tags.public_transport)) {
        let errorObj: IRefErrorObject = { stop, corrected: 'false', missingConnectedRefs: undefined, totalConnectedRefs: undefined };
        if (this.mapSrv.map.getBounds().contains(stop)) {
          if (this.isMobileDevice()) {
            if (!stop.tags['route_ref']) {
              this.refErrorsObj.push(errorObj); }
          } else {
            let parentRels = this.getParentRelations(stop.id);
            if (parentRels.length !== 0) {
              if (stop.tags['route_ref']) {
                addedRefs   = this.getAlreadyAddedRefsInTag(stop.tags['route_ref']);
                missingRefRels = this.compareRefs(parentRels, addedRefs);
              } else {
                 missingRefRels = parentRels;
              }
              errorObj.totalConnectedRefs = parentRels.length;
              errorObj.missingConnectedRefs = missingRefRels.length;
              if (missingRefRels.length !== 0) {
                this.refErrorsObj.push(errorObj);
              }
            }
          }
        }
      }
    });
    this.storageSrv.refErrorsObj = this.refErrorsObj;
    this.storageSrv.refreshErrorObjects.emit({ typeOfErrorObject : 'missing refs' });
  }

  /***
   * Counts way errors
   * @returns {void}
   */
  public countWayErrors(): void {
    this.storageSrv.currentIndex = 0;
    this.wayErrorsObj = [];
    this.storageSrv.wayErrorsObj = [];

    this.storageSrv.elementsMap.forEach((stop) => {
        if (stop.type === 'node' && (stop.tags.public_transport === 'platform')) {
          let errorObj: IWayErrorObject = { stop, corrected: 'false', wayIDs: undefined };
          if (this.mapSrv.map.getBounds().contains(stop)) {
            let parentWaysIDs = [];
            this.storageSrv.elementsMap.forEach((ele) => {
              if (ele.type === 'way' && ele.tags.highway && ele.nodes.includes(stop.id)) {
                parentWaysIDs.push(ele.id);
              }
            });
            if (parentWaysIDs.length !== 0) {
              errorObj.wayIDs = parentWaysIDs;
              this.wayErrorsObj.push(errorObj);
            }
          }
      }
    });
    this.storageSrv.wayErrorsObj = this.wayErrorsObj;
    this.storageSrv.refreshErrorObjects.emit({ typeOfErrorObject : 'way as parent' });
  }

  public countPTvErrors(): void {
    this.storageSrv.currentIndex = 0;
    this.PTvErrorsObj = [];
    this.storageSrv.PTvErrorsObj = [];

    this.storageSrv.elementsMap.forEach((stop) => {
      if (stop.type === 'node' && (stop.tags.highway && stop.tags.highway === 'bus_stop')) {
        let errorObj: IPTvErrorObject = { stop, corrected: 'false' };
        if (this.mapSrv.map.getBounds().contains(stop)) {
            this.PTvErrorsObj.push(errorObj);
        }
      }
    });
    this.storageSrv.PTvErrorsObj = this.PTvErrorsObj;
    this.storageSrv.refreshErrorObjects.emit({ typeOfErrorObject : 'PTv correction' });
  }

  /***
   * Checks whether on Mobile/Desktop
   * @returns {boolean}
   */
  public isMobileDevice(): boolean {
    let md = new MobileDetect(window.navigator.userAgent);
    return !!md.mobile();
  }

  /***
   * Moves to next location
   * @returns {any}
   */
  nextLocation(): any {
    let errorsObj;
    let typeOfErrorObject;
    let appendStringID;
    switch (this.currentMode) {
      case 'missing name tags':
        errorsObj         = this.nameErrorsObj;
        typeOfErrorObject = this.currentMode;
        appendStringID    = '-name-error-list-id';
        break;
      case 'missing refs':
        errorsObj         = this.refErrorsObj;
        typeOfErrorObject = this.currentMode;
        appendStringID    = '-ref-error-list-id';
        break;
      case 'way as parent':
        errorsObj         = this.wayErrorsObj;
        typeOfErrorObject = this.currentMode;
        appendStringID    = '-way-error-list-id';
        break;
      case 'PTv correction':
        errorsObj         = this.PTvErrorsObj;
        typeOfErrorObject = this.currentMode;
        appendStringID    = '-PTv-error-list-id';
        break;
      case 'pt-pair':
        errorsObj         = this.ptPairErrorsObj;
        typeOfErrorObject = 'pt-pair';
        appendStringID    = '-pt-pair-error-list-id';
        break;
    }
    if (this.currentIndex === (errorsObj.length - 1)) {
      this.currentIndex            = 0;
      this.storageSrv.currentIndex = 0;
      this.storageSrv.refreshErrorObjects.emit({ typeOfErrorObject });
      let stop = errorsObj[this.currentIndex].stop;
      document.getElementById(errorsObj[errorsObj.length - 1].stop.id.toString() + appendStringID)
        .style.backgroundColor = 'white';
      document.getElementById(errorsObj[this.currentIndex]['stop'].id.toString() + appendStringID)
        .style.backgroundColor = 'lightblue';
     if (typeOfErrorObject !== 'pt-pair') {
       this.addSinglePopUp(errorsObj[this.currentIndex]);
       this.mapSrv.map.setView({ lat: stop.lat, lng: stop.lon }, 15);
     } else {
       this.startPTPairCorrection(errorsObj[this.currentIndex]);
       this.mapSrv.map.setView({ lat: stop.lat, lng: stop.lon }, 17);
     }
    } else {
      this.currentIndex++;
      this.storageSrv.currentIndex++;
      this.storageSrv.refreshErrorObjects.emit({ typeOfErrorObject });
      let stop = errorsObj[this.currentIndex].stop;

      document.getElementById(errorsObj[this.currentIndex - 1].stop.id.toString() + appendStringID)
        .style.backgroundColor = 'white';
      document.getElementById(errorsObj[this.currentIndex].stop.id.toString() + appendStringID)
        .style.backgroundColor = 'lightblue';

      if (typeOfErrorObject !== 'pt-pair') {
        this.addSinglePopUp(errorsObj[this.currentIndex]);
        this.mapSrv.map.setView({ lat: stop.lat, lng: stop.lon }, 15);
      } else {
        this.startPTPairCorrection(errorsObj[this.currentIndex]);
        this.mapSrv.map.setView({ lat: stop.lat, lng: stop.lon }, 17);
      }
    }
  }

  /***
   * Moves to previous location
   * @returns {void}
   */
  previousLocation(): void {

    let errorsObj;
    let typeOfErrorObject;
    let appendStringID;
    switch (this.currentMode) {
      case 'missing name tags':
        errorsObj         = this.nameErrorsObj;
        typeOfErrorObject = this.currentMode;
        appendStringID    = '-name-error-list-id';
        break;
      case 'missing refs':
        errorsObj         = this.refErrorsObj;
        typeOfErrorObject = this.currentMode;
        appendStringID    = '-ref-error-list-id';
        break;
      case 'way as parent':
        errorsObj         = this.wayErrorsObj;
        typeOfErrorObject = this.currentMode;
        appendStringID    = '-way-error-list-id';
        break;
      case 'PTv correction':
        errorsObj         = this.PTvErrorsObj;
        typeOfErrorObject = this.currentMode;
        appendStringID    = '-PTv-error-list-id';
        break;
      case 'pt-pair':
        errorsObj         = this.ptPairErrorsObj;
        typeOfErrorObject = 'pt-pair';
        appendStringID    = '-pt-pair-error-list-id';
        break;
    }

    if (this.currentIndex === 0) {
      this.currentIndex            = errorsObj.length - 1;
      this.storageSrv.currentIndex = errorsObj.length - 1;
      this.storageSrv.refreshErrorObjects.emit({ typeOfErrorObject });
      let stop = errorsObj[this.currentIndex].stop;
      document.getElementById(errorsObj[0].stop.id.toString() + appendStringID)
        .style.backgroundColor = 'white';
      document.getElementById(errorsObj[errorsObj.length - 1].stop.id.toString() + appendStringID)
        .style.backgroundColor = 'lightblue';

      if (typeOfErrorObject !== 'pt-pair') {
        this.addSinglePopUp(errorsObj[this.currentIndex]);
        this.mapSrv.map.setView({ lat: stop.lat, lng: stop.lon }, 15);
      } else {
        this.startPTPairCorrection(errorsObj[this.currentIndex]);
        this.mapSrv.map.setView({ lat: stop.lat, lng: stop.lon }, 17);
      }
    } else {
      this.currentIndex--;
      this.storageSrv.currentIndex--;
      this.storageSrv.refreshErrorObjects.emit({ typeOfErrorObject });
      let stop = errorsObj[this.currentIndex].stop;
      document.getElementById(errorsObj[this.currentIndex + 1].stop.id.toString() + appendStringID)
        .style.backgroundColor = 'white';
      document.getElementById(errorsObj[this.currentIndex].stop.id.toString() + appendStringID)
        .style.backgroundColor = 'lightblue';

      if (typeOfErrorObject !== 'pt-pair') {
        this.addSinglePopUp(errorsObj[this.currentIndex]);
        this.mapSrv.map.setView({ lat: stop.lat, lng: stop.lon }, 15);
      } else {
        this.startPTPairCorrection(errorsObj[this.currentIndex]);
        this.mapSrv.map.setView({ lat: stop.lat, lng: stop.lon }, 17);
      }
    }
  }

  /***
   * Quits specific correction mode
   */
  public quit(): void {
    let errorCorrectionMode: ISuggestionsBrowserOptions = this.ngRedux.getState()['app']['errorCorrectionMode'];
    if (errorCorrectionMode) {
      if (errorCorrectionMode.refSuggestions && errorCorrectionMode.refSuggestions.startCorrection) {
        this.appActions.actSetErrorCorrectionMode({
          nameSuggestions  : errorCorrectionMode.nameSuggestions,
          refSuggestions   : {
            found          : true,
            startCorrection: false,
          },
          waySuggestions   : errorCorrectionMode.waySuggestions,
          PTvSuggestions   : errorCorrectionMode.PTvSuggestions,
          ptPairSuggestions: errorCorrectionMode.ptPairSuggestions,
        });
      }
      if (errorCorrectionMode.nameSuggestions.startCorrection) {
        this.appActions.actSetErrorCorrectionMode({
          nameSuggestions  : {
            found          : true,
            startCorrection: false,
          },
          refSuggestions   : errorCorrectionMode.refSuggestions,
          waySuggestions   : errorCorrectionMode.waySuggestions,
          PTvSuggestions   : errorCorrectionMode.PTvSuggestions,
          ptPairSuggestions: errorCorrectionMode.ptPairSuggestions,
        });
      }
      if (errorCorrectionMode.waySuggestions && errorCorrectionMode.waySuggestions.startCorrection) {
        this.appActions.actSetErrorCorrectionMode({
          nameSuggestions  : errorCorrectionMode.nameSuggestions,
          refSuggestions   : errorCorrectionMode.refSuggestions,
          PTvSuggestions   : errorCorrectionMode.PTvSuggestions,
          ptPairSuggestions: errorCorrectionMode.ptPairSuggestions,
          waySuggestions   : {
            found          : true,
            startCorrection: false,
          },
        });
      }
      if (errorCorrectionMode.PTvSuggestions && errorCorrectionMode.PTvSuggestions.startCorrection) {
        this.appActions.actSetErrorCorrectionMode({
          nameSuggestions  : errorCorrectionMode.nameSuggestions,
          refSuggestions   : errorCorrectionMode.refSuggestions,
          waySuggestions   : errorCorrectionMode.waySuggestions,
          ptPairSuggestions: errorCorrectionMode.ptPairSuggestions,
          PTvSuggestions   : {
            found          : true,
            startCorrection: false,
          },
        });
      }
      if (errorCorrectionMode.ptPairSuggestions && errorCorrectionMode.ptPairSuggestions.startCorrection) {
        this.appActions.actSetErrorCorrectionMode({
          nameSuggestions  : errorCorrectionMode.nameSuggestions,
          refSuggestions   : errorCorrectionMode.refSuggestions,
          waySuggestions   : errorCorrectionMode.waySuggestions,
          PTvSuggestions   : errorCorrectionMode.PTvSuggestions,
          ptPairSuggestions: {
            found          : true,
            startCorrection: false,
          },
        });
      }

      this.appActions.actToggleSwitchMode(false);
      this.processSrv.refreshSidebarView('cancel selection');
      this.mapSrv.removePopUps();
      if (this.currentMode) {
        this.mapSrv.map.eachLayer((layer) => {
          if (layer['_latlng'] && layer['feature']) {
            this.mapSrv.enableDrag(layer['feature'], layer);
          }
        });
      }
      this.storageSrv.currentElement = null;
      this.storageSrv.currentElementsChange.emit(
        JSON.parse(JSON.stringify(null)),
      );
    }
  }

  /***
   * returns names of nearby nodes
   * @param latlngm
   * @returns {any[]}
   */
  public getNearbyNodeNames(latlngm: any): any[] {

    let inRangeNameArray = [];
    this.mapSrv.map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        let m: L.Marker = layer;
        m.getLatLng();
        if (m.getLatLng().distanceTo(latlngm) < 1000 && m.feature.properties.name) {
          inRangeNameArray.push(m.feature.properties.name);
        }
      }
    });
    return inRangeNameArray;
  }

  /***
   * Nearby route suggestions
   * @param latlngm
   * @param missingRefRels
   * @returns {any[]}
   */
  public getNearbyRoutesSuggestions(latlngm: any, missingRefRels: any): any[] {

    let inRange = [];
    let nearbyRels = [];
    this.mapSrv.map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        let m: L.Marker = layer;
        m.getLatLng();
        if (m.getLatLng().distanceTo(latlngm) < 500 && m.feature.properties.name) {
          let idTypestring: any =  layer.feature.id;
          let featureTypeId = idTypestring.split('/');
          inRange.push(this.storageSrv.elementsMap.get(Number(featureTypeId[1])));
        }
      }
    });

    for (let stop of inRange) {
      let rels = this.getParentRelations(stop.id);
      nearbyRels = nearbyRels.concat(rels);
    }
    let values = {};
    nearbyRels = nearbyRels.filter((item) => {
      let val     = item['id'];
      let exists  = values[val];
      values[val] = true;
      return !exists ;
    });

    nearbyRels = nearbyRels.filter((item) => {
      for (let rel of missingRefRels) {
        if (rel.id ===  item.id) {
          return false;
        }
      }
      return true;
    });
    return nearbyRels;
  }

  /***
   * Returns most occurred name (top 5 most used names)
   * @param {any[]} array
   * @returns {any}
   */
  public getMostUsedName(array: any[]): any {
    if (array.length === 0) {
      return null;
    }
    let modeMap  = {};
    let maxEl    = array[0];
    let maxCount = 1;
    for (let item of  array) {
      let el = item;
      if (modeMap[el] === null) {
        modeMap[el] = 1;
      }
      else {
        modeMap[el]++;
      }
      if (modeMap[el] > maxCount) {
        maxEl    = el;
        maxCount = modeMap[el];
      }
    }
    const arr = [];
    arr[0] = modeMap;
    let sorted = Object.keys(arr[0]).sort((a, b) => arr[0][b] - arr[0][a]);

    if (sorted.length > 5) {
      sorted = sorted.slice(0, 5);
    }
    return sorted;
  }

  /***
   * Adds popup
   * @param errorObj
   * @returns {void}
   */
  public addSinglePopUp(errorObj: INameErrorObject | IRefErrorObject | IWayErrorObject | IPTvErrorObject): void {
    let stop = errorObj['stop'];
    this.mapSrv.removePopUps();
    this.mapSrv.map.eachLayer((layer) => {
      if (layer['_latlng']  && layer['feature']) {
        this.mapSrv.enableDrag(layer['feature'], layer);
      }
    });
    let latlng = { lat: stop.lat, lng: stop.lon };
    let popupContent = ErrorHighlightService.makePopUpContent(errorObj.corrected);
    let popup =     L.popup({
      closeOnClick: false,
      closeButton : false,
      autoPan     : false,
      minWidth    : 4,
    }).setLatLng(latlng)
      .setContent(popupContent).openOn(this.mapSrv.map);
    this.mapSrv.popUpArr.push(popup);
    this.addClickListenerToPopUp(popup, errorObj);
    MapService.addHoverListenersToPopUp(popup.getElement());
    this.mapSrv.popUpLayerGroup = L.layerGroup().addTo(this.mapSrv.map);
    this.mapSrv.popUpLayerGroup.addLayer(popup);
  }

  /***
   * Returns all stops in current map bounds and which are not downloaded
   * @returns {any[]}
   */
  public getAllStopsInCurrentBounds(): any[] {
    let inBounds = [];
    let inBounds2 = [];
    this.storageSrv.elementsMap.forEach((element) => {
      if (element.type === 'node' &&
        (element.tags.bus === 'yes' || element.tags.public_transport) &&
        this.mapSrv.map.getBounds().contains(element) &&
        !this.storageSrv.elementsDownloaded.has(element.id)) {
        inBounds.push(element.id);
      }
    });

    this.storageSrv.elementsMap.forEach((element) => {
      if (element.type === 'node' &&
        (element.tags.bus === 'yes' || element.tags.public_transport) && !this.storageSrv.elementsDownloaded.has(element.id)) {
        inBounds2.push(element.id);
      }
    });

    return inBounds;
  }

  /***
   * Jumps to error
   * @param {number} index
   * @returns {void}
   */
  public jumpToLocation(index: number): void {
    let errorCorrectionMode = this.ngRedux.getState()['app']['errorCorrectionMode'];
    if (errorCorrectionMode.nameSuggestions.startCorrection) {
      document.getElementById(this.nameErrorsObj[this.currentIndex].stop.id.toString() + '-name-error-list-id')
        .style.backgroundColor = 'white';
      this.currentIndex = index;
      this.storageSrv.currentIndex = index;
      this.storageSrv.refreshErrorObjects.emit({ typeOfErrorObject: 'missing name tags' });
      this.addSinglePopUp(this.nameErrorsObj[this.currentIndex]);
      let stop = this.nameErrorsObj[this.currentIndex].stop;
      this.mapSrv.map.setView({ lat: stop.lat, lng: stop.lon }, 15);
      document.getElementById(this.nameErrorsObj[this.currentIndex].stop.id.toString() + '-name-error-list-id')
        .style.backgroundColor = 'lightblue';
    }

    if (errorCorrectionMode.refSuggestions && errorCorrectionMode.refSuggestions.startCorrection) {
      document.getElementById(this.refErrorsObj[this.currentIndex].stop.id.toString() + '-ref-error-list-id')
        .style.backgroundColor = 'white';
      this.currentIndex = index;
      this.storageSrv.currentIndex = index;
      this.storageSrv.refreshErrorObjects.emit({ typeOfErrorObject : 'missing refs' });
      this.addSinglePopUp(this.refErrorsObj[this.currentIndex]);
      let stop = this.refErrorsObj[this.currentIndex].stop;
      this.mapSrv.map.setView({ lat: stop.lat, lng: stop.lon }, 15);
      document.getElementById(this.refErrorsObj[this.currentIndex]
        .stop.id.toString() + '-ref-error-list-id')
        .style.backgroundColor = 'lightblue';
    }

    if (errorCorrectionMode.waySuggestions && errorCorrectionMode.waySuggestions.startCorrection) {
      document.getElementById(this.wayErrorsObj[this.currentIndex].stop.id.toString() + '-way-error-list-id')
        .style.backgroundColor = 'white';
      this.currentIndex = index;
      this.storageSrv.currentIndex = index;
      this.storageSrv.refreshErrorObjects.emit({ typeOfErrorObject : 'way as parent' });
      this.addSinglePopUp(this.wayErrorsObj[this.currentIndex]);
      let stop = this.wayErrorsObj[this.currentIndex].stop;
      this.mapSrv.map.setView({ lat: stop.lat, lng: stop.lon }, 15);
      document.getElementById(this.wayErrorsObj[this.currentIndex]
        .stop.id.toString() + '-way-error-list-id')
        .style.backgroundColor = 'lightblue';
    }

    if (errorCorrectionMode.PTvSuggestions && errorCorrectionMode.PTvSuggestions.startCorrection) {
      document.getElementById(this.PTvErrorsObj[this.currentIndex].stop.id.toString() + '-PTv-error-list-id')
        .style.backgroundColor = 'white';
      this.currentIndex = index;
      this.storageSrv.currentIndex = index;
      this.storageSrv.refreshErrorObjects.emit({ typeOfErrorObject : 'PTv Correction' });
      this.addSinglePopUp(this.PTvErrorsObj[this.currentIndex]);
      let stop = this.PTvErrorsObj[this.currentIndex].stop;
      this.mapSrv.map.setView({ lat: stop.lat, lng: stop.lon }, 15);
      document.getElementById(this.PTvErrorsObj[this.currentIndex]
        .stop.id.toString() + '-PTv-error-list-id')
        .style.backgroundColor = 'lightblue';
    }

    if (errorCorrectionMode.waySuggestions && errorCorrectionMode.waySuggestions.startCorrection) {
      document.getElementById(this.ptPairErrorsObj[this.currentIndex].stop.id.toString() + '-pt-pair-error-list-id')
        .style.backgroundColor = 'white';
      this.currentIndex = index;
      this.storageSrv.currentIndex = index;
      this.storageSrv.refreshErrorObjects.emit({ typeOfErrorObject : 'pt-pair' });
      this.addSinglePopUp(this.ptPairErrorsObj[this.currentIndex]);
      let stop = this.ptPairErrorsObj[this.currentIndex].stop;
      this.mapSrv.map.setView({ lat: stop.lat, lng: stop.lon }, 15);
      document.getElementById(this.ptPairErrorsObj[this.currentIndex]
        .stop.id.toString() + '-pt-pair-error-list-id')
        .style.backgroundColor = 'lightblue';
    }
  }

  /***
   * Returns all stops in current map bounds and which are not downloaded
   * @returns {any[]}
   */
  public getNotDownloadedStopsInBounds(): any[] {
    let inBounds = [];
    this.storageSrv.elementsMap.forEach((element) => {
      if (element.type === 'node' &&
        (element.tags.bus === 'yes' || element.tags.public_transport) &&
        this.mapSrv.map.getBounds().contains(element) &&
        !this.storageSrv.elementsDownloaded.has(element.id)) {
        inBounds.push(element.id);

      }
    });
    return inBounds;
  }

  /***
   * Gets all parent relations for id
   * @param id
   * @returns {any}
   */
  private getParentRelations(id: any): any {
    let parentRels = [];

    this.storageSrv.elementsMap.forEach((element) => {
      if ((element.type === 'relation') && !(element.tags.public_transport === 'stop_area') && (element.members)) {
          for (let member of element.members) {
            if (member.ref === id && element.tags.ref) {
              parentRels.push(element);
            }
          }
      }
    });
    return parentRels;
  }

  /***
   * Splits route_ref tag into individual refs
   * @param {string} routeRefTag
   * @returns {string[]}
   */
  private getAlreadyAddedRefsInTag(routeRefTag: string): string[] {
    return routeRefTag.split(';');
  }

  /***
   * Compares refs of parent relations with added refs of node
   * @param parentRels
   * @param addedRefs
   * @returns {any}
   */
  private compareRefs(parentRels: any, addedRefs: any): any {
    let parentRefs  = [];
    let missingRefs = [];
    for (let parent of parentRels) {
      parentRefs.push(parent.tags.ref);
    }
    let flag = true;
    for (let parent of parentRels) {

      if (!addedRefs.includes(parent.tags.ref)) {
        flag = false;
        missingRefs.push(parent);
      }
    }

    return missingRefs;
  }

  public startPTPairCorrection(ptPairErrorObj: IPTPairErrorObject): any {
    let circle;
    if (ptPairErrorObj.corrected === 'false') {
      circle = new L.Circle([ptPairErrorObj.stop.lat, ptPairErrorObj.stop.lon], {
        radius: 100,
        color: '#9838ff',
        opacity: 0.75,
      }).addTo(this.mapSrv.map);
    }
    let circleBounds = circle.getBounds();
    let stopId = ptPairErrorObj.stop.id;
    let stopLayer = null;
    this.mapSrv.map.eachLayer((layer) => {
      if (layer['feature'] && layer['_latlng']) {
        let featureID = this.mapSrv.getFeatureIdFromMarker(layer['feature']);
        if (featureID === stopId) {
          stopLayer = layer;
        }
      }
    });
    stopLayer.bindPopup('Add a platform near me', { closeOnClick: false, closeButton : false }).openPopup();
    this.mapSrv.map.on('click', (event) => {
      if (ptPairErrorObj.corrected === 'false' && this.errorCorrectionMode.ptPairSuggestions &&
        this.errorCorrectionMode.ptPairSuggestions.startCorrection) {
        if (circleBounds.contains(event['latlng']) && ptPairErrorObj.corrected === 'false') {
          this.openModalWithComponentForPTPair(ptPairErrorObj, event, circle);
        } else {
          alert('not within bounds');
        }
      }
    });
  }

  public openModalWithComponentForPTPair(errorObject: IPTPairErrorObject, event: any, circleLayer: any): void {
    if (errorObject.corrected === 'false') {
      let initialState;
      initialState = {
        error      : 'pt-pair',
        ptPairErrorObject : errorObject,
        newPlatformEvent: event,
        circleLayer,
      };
      this.modalRef = this.modalService.show(ModalComponent, { initialState });
    }
  }

  public checkDistance(stop: IPtStop, platform: IPtStop): boolean {
    let stopLayer = null;
    let platformLayer = null;
    this.mapSrv.map.eachLayer((layer) => {
      if (layer['feature'] && layer['_latlng']) {
        let featureID = this.mapSrv.getFeatureIdFromMarker(layer['feature']);
        if (featureID === stop.id) {
          stopLayer = layer;
        }
        if (featureID === platform.id) {
          platformLayer = layer;
        }
      }
    });
    return (stopLayer.getLatLng().distanceTo(platformLayer.getLatLng()) < 100);
  }
  public countPTPairErrors(): void {
    this.storageSrv.currentIndex       = 0;
    this.ptPairErrorsObj               = [];
    this.storageSrv.ptPairErrorsObject = [];
    this.storageSrv.elementsMap.forEach((stop) => {
      if (stop.type === 'node' && (stop.tags.public_transport &&
        stop.tags.public_transport === 'stop_position' || (stop.tags.highway && stop.tags.highway === 'bus_stop')) &&
        this.mapSrv.map.getBounds().contains(stop)) {
        let flag = false;
        this.storageSrv.elementsMap.forEach((platform) => {
          if (platform.type === 'node' && (platform.tags.public_transport === 'platform') &&
            (this.checkDistance(stop, platform))) {
            flag = true;
          }
        });
        if (!flag) {
          let errorObj: IPTPairErrorObject = { stop, corrected: 'false' };
          this.ptPairErrorsObj.push(errorObj);
        }

      }
    });
    this.storageSrv.ptPairErrorsObject = this.ptPairErrorsObj;
    this.storageSrv.refreshErrorObjects.emit({ typeOfErrorObject: 'pt-pair' });

  }
}
