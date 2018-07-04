import {EventEmitter, Injectable} from '@angular/core';
import * as L from 'leaflet';

import { MapService } from './map.service';
import { ProcessService } from './process.service';
import { StorageService } from './storage.service';
import { SwitchLocationService } from './switch-location.service';
import { OverpassService } from './overpass.service';

import { AppActions } from '../store/app/actions';
import { IAppState } from '../store/model';

import { NgRedux } from '@angular-redux/store';

import { BsModalService, BsModalRef } from 'ngx-bootstrap';

import { ModalComponent } from '../components/modal/modal.component';
import * as MobileDetect from 'mobile-detect';
import {element} from 'protractor';
@Injectable()
export class ErrorHighlightService {
  modalRef: BsModalRef;
  public nameErrorsO: any[]                      = [];
  public refErrorsO: any[]                       = [];
  public currentIndex                            = 0;
  public currentMode: string;
  public isDataDownloaded: EventEmitter<boolean> = new EventEmitter();
  public refreshErrorObjects: EventEmitter<string> = new EventEmitter();

  constructor(public mapSrv: MapService,
              public appActions: AppActions,
              public storageSrv: StorageService,
              private ngRedux: NgRedux<IAppState>,
              private modalService: BsModalService,
              private processSrv: ProcessService,
              private switchLocationSrv: SwitchLocationService,
              // private overpassSrv: OverpassService,
  ) {
    this.isDataDownloaded.subscribe((data) => {
      if (data) {
        this.countErrors();
      }
    });
  }

  /***
   * Turns of marker click and starts switch location mode on
   * @param {string} tag
   * @returns {void}
   */
  public missingTagError(tag: string): void {
    this.mapSrv.map.eachLayer((layer) => {
      if (layer['_latlng'] && layer['feature']) {
        layer.off('click');
      }
    });
    if (tag === 'name') {
      this.switchlocationModeOn(true, this.nameErrorsO);
    } else {
      this.switchlocationModeOn(true, this.refErrorsO);
    }
  }

  /***
   * Generates the popup content
   * @returns {object}
   */
  private static makePopUpContent(): HTMLElement {
    let popupContent       = L.DomUtil.create('div', 'content');
    popupContent.innerHTML = '<i class="fa fa-exclamation-triangle" aria-hidden="true">';
    return popupContent;
  }

  /***
   * Handles click of popup
   * @param popUpElement
   * @param markerFeatureid
   * @param popUpId
   * @returns {void}
   */

  private addClickListenerToPopUp(popUpElement: HTMLElement, markerFeatureid: number, popUpId: number, stop: any): void {
    L.DomEvent.addListener(popUpElement, 'click', (e) => {
      const featureId = Number(markerFeatureid);
      const element   = this.processSrv.getElementById(featureId);
      if (element) {
        let latlng = { lat: element.lat, lng: element.lon };
        if ((this.ngRedux.getState()['app']['errorCorrectionMode'] === 'missing name tag')) {
          let arr    = this.getNearbyNodeNames(latlng);
          let suggestedName   = this.getMostUsedName(arr);
          this.openModalWithComponent(stop, suggestedName);
        }
        if ((this.ngRedux.getState()['app']['errorCorrectionMode'] === 'missing ref tag')) {
          console.log('got value', this.isMobileDevice());
          if (this.isMobileDevice()) {
            this.openModalWithComponent(stop);
          } else {
            // this.overpassSrv.downloadNodeDataForError(featureId);
          }
        }
        // changing current element
        this.storageSrv.currentElementsChange.emit(
          JSON.parse(JSON.stringify(element)),
        );

        this.refSuggestions2(latlng);
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
  public openModalWithComponent(stop: any, name?: string): void {
    // name is suggested name
    if (name) {
      const initialState = {
        error: 'missing name tag',
        name,
        errorObject: stop,
      };
      this.modalRef      = this.modalService.show(ModalComponent, { initialState });
    }
    else {
      const initialState = {
        error: 'missing name tag',
        errorObject: stop,
      };
      this.modalRef      = this.modalService.show(ModalComponent, { initialState });
    }
  }

  /***
   * Counts errors
   */
  public countErrors(): void {
    console.log('count errors called');
    // this.nameErrors = 0;
    // this.refErrors  = 0;
    this.refErrorsO = [];
    this.nameErrorsO = [];
    //
    // let stopsInBounds = this.getAllStopsInCurrentBounds(this.storageSrv.listOfStops);
    //
    //
    //
    //
    // for (let stop of stopsInBounds) {
    //   let stopObj = { stop, isCorrected: false };
    //
    //   // check for missing name tag
    //
    //   if (!(this.storageSrv.elementsMap.get(stop.id).tags['name'])) {
    //     this.nameErrorsO.push(stopObj);
    //   }
    //
    //   // check for missing route_ref tag, suggestions need complete downloading of node
    //   if (stop.tags.route_ref) {
    //     let refs = this.getAlreadyAddedRefsInTag(stop.tags.route_ref);
    //   }
    //
    //   // check for incomplete route_ref tag (suggestions needs downloading,
    //   // check needs downloading, )
    //
    // }

    // download first


    // for (let elementID in this.storageSrv.elementsMap) {
    //   if (this.storageSrv.elementsMap.hasOwnProperty(elementID)) {
    //     let stop = this.storageSrv.elementsMap.get(elementID);
    //     if (stop.tags.bus === 'yes' || stop.tags.public_transport) {
    //       if (!stop.tags['name'] && this.mapSrv.map.getBounds().contains(stop)) {
    //         let errorObj          = { stop, isCorrected: false };
    //         this.nameErrorsO.push(errorObj);
    //       }
    //     }
    //   }
    // }


    for (let stop of this.storageSrv.listOfStops) {
      let stopObj2 = { stop, isCorrected: false };
      let stopObj          = { lat: stop.lat, lng: stop.lon, id: stop.id, isCorrected : false };

      // find all in bounds

      // console.log('stop', stop);
      // if (!(this.storageSrv.elementsMap.get(stop.id).tags['name']) &&
      //   this.mapSrv.map.getBounds().contains(stopObj)) {
      //   this.nameErrorsO.push(stopObj2);
      // }


      if (!(this.storageSrv.elementsMap.get(stop.id).tags['ref']) &&
        this.mapSrv.map.getBounds().contains(stopObj)) {

        // let refs = this.getAlreadyAddedRefsInTag(this.storageSrv.elementsMap.get(stop.id).tags['route_ref']);
        // download everything
        // this.overpassSrv.download()
        this.refErrorsO.push(stopObj);


      }
    }
    this.refreshErrorObjects.emit('missing name');
    console.log('name e', this.nameErrorsO);
    // this.errorList = [];
  }

  /***
   * Checks whether on Mobile/Desktop
   * @returns {boolean}
   */
  isMobileDevice(): boolean {
    let md = new MobileDetect(window.navigator.userAgent);
    if (md.mobile()) {
      return true;
    } else {
      return false;
    }
    // return (typeof window.orientation !== 'undefined') || (navigator.userAgent.indexOf('IEMobile') !== -1);
  }

  /***
   * Starts correction based on error correction mode
   * @param {string} tag
   * @returns {void}
   */
  public startCorrection(tag: string): void {
    this.currentIndex = 0;
    this.currentMode = tag;
    this.mapSrv.popUpLayerGroup = null;
    this.mapSrv.popUpArr = [];
    this.missingTagError(tag);
    console.log('start correction mode set', this.currentMode);
  }

  /***
   * Adds all popups at once
   * @param {any[]} stopArray
   * @returns {any}
   */
  addPopUps(stopArray: any[]): any {
    this.mapSrv.removePopUps();
    for (let stop of stopArray) {
      let latlng       = { lat: stop.lat, lng: stop.lng };
      let popupContent = ErrorHighlightService.makePopUpContent();
      let popup        = L.popup({
        autoClose   : false,
        closeOnClick: false,
        closeButton : false,
        autoPan     : false,
        minWidth    : 4,
      }).setLatLng(latlng)
        .setContent(popupContent)
        .openOn(this.mapSrv.map);

      this.mapSrv.popUpArr.push(popup);
      // this.addClickListenerToPopUp(popup.getElement(), stop.id, popup['_leaflet_id']);
      MapService.addHoverListenersToPopUp(popup.getElement());
    }
    this.mapSrv.popUpLayerGroup = L.layerGroup(this.mapSrv.popUpArr).addTo(this.mapSrv.map);
  }

  /***
   * Turns on error location mode
   * @param {boolean} bool
   * @param arr
   * @returns {any}
   */
  switchlocationModeOn(bool: boolean, arr?: any): any {

    if (this.ngRedux.getState().switchMode) {
      document.getElementById('map').style.width     = '65%';
      document.getElementById('sidebar').style.width = '35%';
      this.appActions.actToggleSwitchMode(bool);
    }
    else {
      console.log('run' , this.currentMode);
      if (this.currentMode === 'name') {
        this.addSinglePopUp(this.nameErrorsO[0]);
        this.mapSrv.map.setView(this.nameErrorsO[0]['stop'], 15);
      }
      if (this.currentMode === 'ref') {
        this.addSinglePopUp(this.refErrorsO[0]);
        this.mapSrv.map.setView(this.nameErrorsO[0]['stop'], 15);
      }
      this.appActions.actToggleSwitchMode(bool);
    }
    this.mapSrv.map.invalidateSize();
  }

  /***
   * Moves to next location
   * @returns {any}
   */
  nextLocation(): any {
    if (this.currentMode === 'name') {
      if (this.currentIndex === (this.nameErrorsO.length - 1)) {
          this.currentIndex = 0;
          this.addSinglePopUp(this.nameErrorsO[this.currentIndex]);
          this.mapSrv.map.setView(this.nameErrorsO[this.currentIndex]['stop'], 15);
          document.getElementById(this.nameErrorsO[this.nameErrorsO.length - 1]['stop'].id).style.backgroundColor = 'white';
          document.getElementById(this.nameErrorsO[this.currentIndex]['stop'].id).style.backgroundColor = 'lightblue';

      } else {
        this.addSinglePopUp(this.nameErrorsO[this.currentIndex + 1]);
        this.mapSrv.map.setView(this.nameErrorsO[this.currentIndex + 1]['stop'], 15);
        document.getElementById(this.nameErrorsO[this.currentIndex]['stop'].id).style.backgroundColor = 'white';
        document.getElementById(this.nameErrorsO[this.currentIndex + 1]['stop'].id).style.backgroundColor = 'lightblue';
        this.currentIndex++;
      }
    }
    if (this.currentMode === 'ref') {
      if (this.currentIndex === (this.refErrorsO.length - 1)) {
        this.currentIndex = 0;
        this.addSinglePopUp(this.refErrorsO[this.currentIndex]['stop']);
        this.mapSrv.map.setView(this.refErrorsO[this.currentIndex]['stop'], 15);
        document.getElementById(this.refErrorsO[this.refErrorsO.length - 1]['stop'].id).style.backgroundColor = 'white';
        document.getElementById(this.refErrorsO[this.currentIndex]['stop'].id).style.backgroundColor = 'lightblue';

      } else {
        this.addSinglePopUp(this.refErrorsO[this.currentIndex + 1]);
        this.mapSrv.map.setView(this.refErrorsO[this.currentIndex + 1]['stop'], 15);
        document.getElementById(this.refErrorsO[this.currentIndex]['stop'].id).style.backgroundColor = 'white';
        document.getElementById(this.refErrorsO[this.currentIndex + 1]['stop'].id).style.backgroundColor = 'lightblue';
        this.currentIndex++;
      }
     }
    }

  /***
   * Moves to previous location
   * @returns {any}
   */
  previousLocation(): any {

    if (this.currentMode === 'name') {
      if (this.currentIndex === 0) {
          this.currentIndex = this.nameErrorsO.length - 1;
          this.addSinglePopUp(this.nameErrorsO[this.currentIndex]);
          this.mapSrv.map.panTo(this.nameErrorsO[this.currentIndex]['stop']);

          document.getElementById(this.nameErrorsO[0]['stop'].id).style.backgroundColor = 'white';
          document.getElementById(this.nameErrorsO[this.nameErrorsO.length - 1]['stop'].id).style.backgroundColor = 'lightblue';
      } else {
        this.addSinglePopUp(this.nameErrorsO[this.currentIndex - 1]);
        this.mapSrv.map.panTo(this.nameErrorsO[this.currentIndex - 1]['stop']);
        document.getElementById(this.nameErrorsO[this.currentIndex]['stop'].id).style.backgroundColor = 'white';
        document.getElementById(this.nameErrorsO[this.currentIndex - 1]['stop'].id).style.backgroundColor = 'lightblue';
        this.currentIndex--;
      }
    }
    if (this.currentMode === 'ref') {
      if (this.currentIndex === 0) {
        this.currentIndex = this.refErrorsO.length - 1;
        this.addSinglePopUp(this.refErrorsO[this.currentIndex]['stop']);
        this.mapSrv.map.panTo(this.refErrorsO[this.currentIndex]['stop']);
        document.getElementById(this.refErrorsO[0]['stop'].id).style.backgroundColor = 'white';
        document.getElementById(this.refErrorsO[this.currentIndex]['stop'].id).style.backgroundColor = 'lightblue';
      } else {
        this.addSinglePopUp(this.refErrorsO[this.currentIndex - 1]['stop']);
        this.mapSrv.map.panTo(this.refErrorsO[this.currentIndex - 1]['stop']);
        this.currentIndex--;
        console.log('this is it element', document.getElementById(this.refErrorsO[this.currentIndex + 1 ]['stop'].id));
        document.getElementById(this.refErrorsO[this.currentIndex + 1]['stop'].id).style.backgroundColor = 'white';
        document.getElementById(this.refErrorsO[this.currentIndex]['stop'].id).style.backgroundColor = 'lightblue';
      }
    }
  }

  /***
   * Quits correction mode
   */
  public quit(): void {
    // this.nameErrorsO = null;
    // this.refErrorsO = null;
    document.getElementById('map').style.width     = '65%';
    document.getElementById('sidebar').style.width = '35%';
    this.mapSrv.map.invalidateSize();
    this.appActions.actSetErrorCorrectionMode(null);
    this.appActions.actToggleSwitchMode(false);
    this.processSrv.refreshSidebarView('cancel selection');
    this.mapSrv.removePopUps();
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
        if (m.getLatLng().distanceTo(latlngm) < 200 && m.feature.properties.name) {
          inRangeNameArray.push(m.feature.properties.name);
        }
      }
    });
    return inRangeNameArray;
  }

  /***
   * Returns most occurred name
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
      if (modeMap[el] == null) {
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
    return maxEl;
  }

  /***
   * Adds popup
   * @param stop
   * @returns {any}
   */
  addSinglePopUp(errorObj: any): any {
     let stop =  errorObj['stop'];
     console.log('sd', errorObj['stop']);
     this.mapSrv.removePopUps();
     let latlng = { lat: stop.lat, lng: stop.lon };
     let popupContent;
     if (errorObj.isCorrected) {
      console.log('true');
      popupContent    = L.DomUtil.create('div', 'content');
      popupContent.innerHTML = '<i class="fa fa-check" aria-hidden="true"></i>';
      } else {
      popupContent = ErrorHighlightService.makePopUpContent();
      }
     let popup        = L.popup({
        closeOnClick: false,
        closeButton : false,
        autoPan     : false,
        minWidth    : 4,
      }).setLatLng(latlng)
        .setContent(popupContent).openOn(this.mapSrv.map);

     this.mapSrv.popUpArr.push(popup);
     this.addClickListenerToPopUp(popup.getElement(), stop.id, popup['_leaflet_id'], stop);
     MapService.addHoverListenersToPopUp(popup.getElement());
     this.mapSrv.popUpLayerGroup = L.layerGroup().addTo(this.mapSrv.map);
     this.mapSrv.popUpLayerGroup.addLayer(popup);
  }

  // suggest rout refs from nearby route
  // get a nearby stop/platform, check it's parent routes and
  // compare with already added route ref and add it to that
  // take a route and suggest nearby stops
  // suggestions based on stop’s nearby routes
  // - user can quickly add other routes which can be connected)
  public refSuggestions2 (latlngm: any): any {
    console.log('latlng', latlngm);
    let nearbyStopArr = [];
    this.mapSrv.map.eachLayer((layer) => {
       if (layer instanceof L.Marker) {
         let m: L.Marker = layer;
         console.log('m ltltng', m.getLatLng());
         if (m.getLatLng().distanceTo(latlngm) < 500) {
           console.log(layer);
           let id = this.mapSrv.getFeatureIdFromMarker(layer.feature);
           nearbyStopArr.push(id);
         }
       }
     });
    // can use async await here
    // this.overpassSrv.download(nearbyStopArr);

    }

  public getAlreadyAddedRefsInTag(routeRefTag: string): string[] {
    return  routeRefTag.split(';');
  }

  /***
   * Returns all stops in current map bounds
   * @param listOfStops
   * @returns {any[]}
   */
  public getAllStopsInCurrentBounds(listOfStops: any[]): any[] {
    let inBounds = [];
    for (let stopObj of listOfStops) {
      if (this.mapSrv.map.getBounds().contains(stopObj)) {
      inBounds.push(stopObj.id);
      }
    }
    return inBounds;
  }
  //
  // public missingRefTag(): any {
  //    // download all data
  //   this.overpassSrv.download();
  //
  // }
}

