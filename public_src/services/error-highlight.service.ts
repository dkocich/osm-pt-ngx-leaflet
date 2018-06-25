import { Injectable } from '@angular/core';
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
@Injectable()
export class ErrorHighlightService {
  modalRef: BsModalRef;
  public nameErrorsO: any[]                      = [];
  public refErrorsO: any[]                       = [];
  public currentIndex                               = 0;
  public currentMode: string;

  constructor(public mapSrv: MapService,
              public appActions: AppActions,
              public storageSrv: StorageService,
              private ngRedux: NgRedux<IAppState>,
              private modalService: BsModalService,
              private processSrv: ProcessService,
              private switchLocationSrv: SwitchLocationService,
              private overpassSrv: OverpassService,
  ) {
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
        if ((this.ngRedux.getState()['app']['errorCorrectionMode'] === 'missing name tag')) {
          let latlng = { lat: element.lat, lng: element.lon };
          let arr    = this.getNearbyNodeNames(latlng);
          let name   = this.getMostUsedName(arr);
          this.openModalWithComponent(stop, name);
        }
        if ((this.ngRedux.getState()['app']['errorCorrectionMode'] === 'missing ref tag')) {
          console.log('got value', this.isMobileDevice());
          if (this.isMobileDevice()) {
            this.openModalWithComponent(stop);
          } else {
            this.overpassSrv.downloadNodeDataForError(featureId);
          }
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
    // this.nameErrors = 0;
    // this.refErrors  = 0;
    this.refErrorsO = [];
    this.nameErrorsO = [];
    for (let stop of this.storageSrv.listOfStops) {
      let stopObj          = { lat: stop.lat, lng: stop.lon, id: stop.id, isCorrected : false };
      // let stopObjwithoutId = { lat: stop.lat, lng: stop.lon };
      if (!(this.storageSrv.elementsMap.get(stop.id).tags['name']) &&
        !this.mapSrv.checkIfAlreadyAdded(stopObj) &&
        this.mapSrv.map.getBounds().contains(stopObj)) {
        // this.nameErrors++;
        this.nameErrorsO.push(stopObj);
        // this.nameErrorsOwithoutId.push(stopObjwithoutId);
      }
      if (!(this.storageSrv.elementsMap.get(stop.id).tags['ref']) &&
        !this.mapSrv.checkIfAlreadyAdded(stopObj)
        && this.mapSrv.map.getBounds().contains(stopObj)) {
        // this.refErrors++;
        this.refErrorsO.push(stopObj);
        // this.refErrorsOwithoutId.push(stopObjwithoutId);
      }
    }
    // this.errorList = [];
    // this.errorList.push({ ref: this.refErrors, name: this.nameErrors });
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
      // document.getElementById('map').style.width     = '100%';
      // document.getElementById('sidebar').style.width = '0%';
      console.log('run' ,this.currentMode );
      if (this.currentMode === 'name') {
        console.log('name error' ,this.nameErrorsO[0]);
        this.addSinglePopUp(this.nameErrorsO[0]);
        // setTimeout(() => {
        //   document.getElementById(this.nameErrorsO[0].id).style.backgroundColor = 'red';
        // }, 1000);
      }
      if (this.currentMode === 'ref') {
        console.log('ref');

        this.addSinglePopUp(this.refErrorsO[0]);
        // document.getElementById(this.refErrorsO[0].id).style.backgroundColor = 'red';
        // setTimeout(() => {
        //   document.getElementById(this.refErrorsO[0].id).style.backgroundColor = 'red';
        // }, 1000);
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
    // console.log('whole', this.nameErrorsO, 'current index', this.currentIndex, 'prev', this.nameErrorsO[this.currentIndex - 1]);
    // console.log('arr object', this.mapSrv.errorLocations[this.currentIndex]);
    if (this.currentMode === 'name') {
      if (this.currentIndex === (this.nameErrorsO.length - 1)) {
          this.currentIndex = 0;
          this.addSinglePopUp(this.nameErrorsO[this.currentIndex]);
          this.mapSrv.map.setView(this.nameErrorsO[this.currentIndex], 15);
          document.getElementById(this.nameErrorsO[this.nameErrorsO.length - 1].id).style.backgroundColor = 'white';
          document.getElementById(this.nameErrorsO[this.currentIndex].id).style.backgroundColor = 'lightblue';

      } else {
        this.addSinglePopUp(this.nameErrorsO[this.currentIndex + 1]);
        this.mapSrv.map.setView(this.nameErrorsO[this.currentIndex + 1], 15);
        document.getElementById(this.nameErrorsO[this.currentIndex].id).style.backgroundColor = 'white';
        document.getElementById(this.nameErrorsO[this.currentIndex + 1].id).style.backgroundColor = 'lightblue';

        this.currentIndex++;

        // what is this?
        // this.mapSrv.popUpLayerGroup.getLayers().forEach((layer) => {
        //   if (layer['_latlng'].lat === this.nameErrorsO[this.currentIndex]['lat'] &&
        //     layer['_latlng'].lng === this.nameErrorsO[this.currentIndex]['lng']
        //   ) {
        //     this.mapSrv.map.addLayer(layer);
        //   }
        // });
    }

    }
    if (this.currentMode === 'ref') {
      if (this.currentIndex === (this.refErrorsO.length - 1)) {
          this.currentIndex = 0;
          this.addSinglePopUp(this.refErrorsO[this.currentIndex]);
          this.mapSrv.map.setView(this.refErrorsO[this.currentIndex], 15);
        document.getElementById(this.refErrorsO[this.refErrorsO.length - 1].id).style.backgroundColor = 'white';
        document.getElementById(this.refErrorsO[this.currentIndex].id).style.backgroundColor = 'lightblue';
        } else {
          this.addSinglePopUp(this.refErrorsO[this.currentIndex + 1]);
          this.mapSrv.map.setView(this.refErrorsO[this.currentIndex + 1], 15);
          this.currentIndex++;
        document.getElementById(this.refErrorsO[this.currentIndex - 1 ].id).style.backgroundColor = 'white';
        document.getElementById(this.refErrorsO[this.currentIndex].id).style.backgroundColor = 'lightblue';
        //   this.mapSrv.popUpLayerGroup.getLayers().forEach((layer) => {
        //    if (layer['_latlng'].lat === this.refErrorsO[this.currentIndex]['lat'] &&
        //     layer['_latlng'].lng === this.refErrorsO[this.currentIndex]['lng']
        //   ) {
        //     this.mapSrv.map.addLayer(layer);
        //   }
        // });
      }

      }
    }
    // if (this.currentIndex === (this.mapSrv.errorLocations.length - 1)) {
    //   this.currentIndex = 0;
    //   if (this.currentMode === 'name') {
    //     this.addSinglePopUp(this.nameErrorsO[this.currentIndex]);
    //     this.mapSrv.map.setView(this.nameErrorsO[this.currentIndex], 15);
    //   } else {
    //     this.addSinglePopUp(this.refErrorsO[this.currentIndex]);
    //     this.mapSrv.map.setView(this.refErrorsO[this.currentIndex], 15);
    //   }
    //
    // }
    // else {
    //   if (this.currentMode === 'name') {
    //     this.addSinglePopUp(this.nameErrorsO[this.currentIndex + 1]);
    //   } else {
    //     this.addSinglePopUp(this.refErrorsO[this.currentIndex + 1]);
    //   }
    //   this.mapSrv.map.setView(this.mapSrv.errorLocations[this.currentIndex + 1], 15);
    //   this.currentIndex++;
    //   this.mapSrv.popUpLayerGroup.getLayers().forEach((layer) => {
    //     if (layer['_latlng'].lat === this.mapSrv.errorLocations[this.currentIndex]['lat'] &&
    //       layer['_latlng'].lng === this.mapSrv.errorLocations[this.currentIndex]['lng']
    //     ) {
    //       this.mapSrv.map.addLayer(layer);
    //     }
    //   });
    // }
  // }

  /***
   * Moves to previous location
   * @returns {any}
   */
  previousLocation(): any {
    // console.log('whole', this.nameErrorsO, 'current index', this.currentIndex);

    if (this.currentMode === 'name') {
      if (this.currentIndex === 0) {
          this.currentIndex = this.nameErrorsO.length - 1;
          this.addSinglePopUp(this.nameErrorsO[this.currentIndex]);
          this.mapSrv.map.panTo(this.nameErrorsO[this.currentIndex]);

          document.getElementById(this.nameErrorsO[0].id).style.backgroundColor = 'white';
          document.getElementById(this.nameErrorsO[this.nameErrorsO.length - 1].id).style.backgroundColor = 'lightblue';
      } else {
        this.addSinglePopUp(this.nameErrorsO[this.currentIndex - 1]);
        this.mapSrv.map.panTo(this.nameErrorsO[this.currentIndex - 1]);
        document.getElementById(this.nameErrorsO[this.currentIndex].id).style.backgroundColor = 'white';
        document.getElementById(this.nameErrorsO[this.currentIndex - 1].id).style.backgroundColor = 'lightblue';
        this.currentIndex--;
      }
    }
    if (this.currentMode === 'ref') {
      if (this.currentIndex === 0) {
        this.currentIndex = this.refErrorsO.length - 1;
        this.addSinglePopUp(this.refErrorsO[this.currentIndex]);
        this.mapSrv.map.panTo(this.refErrorsO[this.currentIndex]);
        document.getElementById(this.refErrorsO[0].id).style.backgroundColor = 'white';
        document.getElementById(this.refErrorsO[this.currentIndex].id).style.backgroundColor = 'lightblue';
      } else {
        this.addSinglePopUp(this.refErrorsO[this.currentIndex - 1]);
        this.mapSrv.map.panTo(this.refErrorsO[this.currentIndex - 1]);
        this.currentIndex--;
        console.log( 'this is it element',document.getElementById(this.refErrorsO[this.currentIndex + 1 ].id));
        document.getElementById(this.refErrorsO[this.currentIndex + 1].id).style.backgroundColor = 'white';
        document.getElementById(this.refErrorsO[this.currentIndex].id).style.backgroundColor = 'lightblue';
      }
    }
    // if (this.currentIndex === 0) {
    //   this.currentIndex = this.mapSrv.errorLocations.length - 1;
    //   if (this.currentMode === 'name') {
    //     this.addSinglePopUp(this.nameErrorsO[this.currentIndex]);
    //   } else {
    //     this.addSinglePopUp(this.refErrorsO[this.currentIndex]);
    //   }
    //   this.mapSrv.map.panTo(this.mapSrv.errorLocations[this.currentIndex]);
    // } else {
    //   if (this.currentMode === 'name') {
    //     this.addSinglePopUp(this.nameErrorsO[this.currentIndex - 1]);
    //   } else {
    //     this.addSinglePopUp(this.refErrorsO[this.currentIndex - 1]);
    //   }
    //   this.mapSrv.map.panTo(this.mapSrv.errorLocations[this.currentIndex - 1]);
    //   this.currentIndex--;
    // }
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
  addSinglePopUp(stop: any): any {

    this.mapSrv.removePopUps();
    let latlng = { lat: stop.lat, lng: stop.lng };
    // if (!this.mapSrv.checkIfAlreadyAdded(latlng)) {
      let popupContent = ErrorHighlightService.makePopUpContent();
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
}
