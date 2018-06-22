import { Injectable } from '@angular/core';
import * as L from 'leaflet';

import { MapService } from './map.service';
import { ProcessService } from './process.service';
import { StorageService } from './storage.service';

import { AppActions } from '../store/app/actions';
import { IAppState } from '../store/model';

import { NgRedux } from '@angular-redux/store';

import { BsModalService, BsModalRef } from 'ngx-bootstrap';

import { ModalComponent } from '../components/modal/modal.component';
import { SwitchLocationService } from './switch-location.service';
import {marker} from 'leaflet';
// import { LatLngExpression } from 'leaflet';

@Injectable()
export class ErrorHighlightService {
  modalRef: BsModalRef;
  public nameErrors: number = 0;
  public refErrors: number = 0;
  public nameErrorsO: object[] = [];
  public refErrorsO: object[] = [];
  public nameErrorsOwithoutId: L.LatLngExpression[] = [];
  public refErrorsOwithoutId: L.LatLngExpression[] = [];
  public arr: L.LatLngExpression[] = [];
  public currentLoc: L.LatLngExpression;
  public currentIndex = 0;
  public modeon: boolean = false;
  errorList = [];
  constructor(public mapSrv: MapService,
              public appActions: AppActions,
              public storageSrv: StorageService,
              private ngRedux: NgRedux<IAppState>,
              private modalService: BsModalService,
              private processSrv: ProcessService,
              private switchLocationSrv: SwitchLocationService,
              ) {}

  /***
   * Adds new layer of popups for missing tag
   * @param {string} tag
   * @returns {void}
   */
  public missingTagError(tag: string): void {

    this.mapSrv.map.eachLayer((layer) => {
      if (layer['_latlng'] && layer['feature']) {
        layer.off('click');
      }
    });
    console.log('error,object', this.nameErrorsOwithoutId);
    this.addPopUps(this.nameErrorsO);
    if (tag === 'name') {
      this.switchlocationModeOn(true, this.nameErrorsOwithoutId);
    } else {
      this.switchlocationModeOn(true, this.refErrorsOwithoutId);

    }
  }

  /***
   * Generates the popup content
   * @returns {object}
   */

  private static makePopUpContent(): HTMLElement {
    let popupContent = L.DomUtil.create('div', 'content');
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

  private addClickListenerToPopUp(popUpElement: HTMLElement, markerFeatureid: number, popUpId: number): void {

    L.DomEvent.addListener(popUpElement, 'click', (e) => {
      this.openModalWithComponent();
      console.log(markerFeatureid);
      const featureId = Number(markerFeatureid);
      const element = this.processSrv.getElementById(featureId);
      console.log('element', element);
      if (element) {
        console.log('sent data', element);
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
  private openModalWithComponent(): void {
    this.modalRef = this.modalService.show(ModalComponent);
  }

  public countErrors(): void  {
    for (let stop of this.storageSrv.listOfStops) {
      let stopObj = { lat: stop.lat, lng: stop.lon, id: stop.id };
      let stopObjwithoutId = { lat: stop.lat, lng: stop.lon };
      if (!(this.storageSrv.elementsMap.get(stop.id).tags['name']) &&
        !this.mapSrv.checkIfAlreadyAdded(stopObj) &&
        this.mapSrv.map.getBounds().contains(stopObj)) {
        this.nameErrors++;
        this.nameErrorsO.push(stopObj);
        this.nameErrorsOwithoutId.push(stopObjwithoutId);
      }

      if (!(this.storageSrv.elementsMap.get(stop.id).tags['ref']) &&
        !this.mapSrv.checkIfAlreadyAdded(stopObj)
        && this.mapSrv.map.getBounds().contains(stopObj)) {
        this.refErrors++;
        this.refErrorsO.push(stopObj);
        this.refErrorsOwithoutId.push(stopObjwithoutId);
      }
    }
    this.errorList.push({ ref: this.refErrors, name: this.nameErrors });
  }

  isMobileDevice(): any {
    return (typeof window.orientation !== 'undefined') || (navigator.userAgent.indexOf('IEMobile') !== -1);
  }

  public startCorrection(tag: string): any {

    if (!this.isMobileDevice) {
      console.log('not mobile');
      this.missingTagError(tag);
    } else {
      console.log('mobile');
      this.missingTagError(tag);
    }
  }

  addPopUps(stopArray: any[]): any {
    this.mapSrv.removePopUps();
    for (let stop of stopArray) {
      console.log(stop);
      let latlng = { lat : stop.lat , lng: stop.lng };
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
      this.addClickListenerToPopUp(popup.getElement(), stop.id, popup['_leaflet_id']);
      MapService.addHoverListenersToPopUp(popup.getElement());
    }
    this.mapSrv.popUpLayerGroup = L.layerGroup(this.mapSrv.popUpArr).addTo(this.mapSrv.map);
  }

  switchlocationModeOn(bool: boolean, arr?: L.LatLngExpression[]): any {
    if (this.ngRedux.getState().switchMode) {
      console.log('yes');
      document.getElementById('map').style.width = '65%' ;
      document.getElementById('sidebar').style.width = '35%' ;

      this.appActions.actToggleSwitchMode(bool);
    }
    else {
      console.log('not');
      document.getElementById('map').style.width = '100%' ;
      document.getElementById('sidebar').style.width = '0%' ;

      this.arr = arr;
      this.appActions.actToggleSwitchMode(bool);
    }
    this.mapSrv.map.invalidateSize();
  }

  nextLocation(): any {
    console.log('arr', this.arr);
    if (this.currentIndex === (this.arr.length - 1))  {
      this.currentIndex = 0;
      let ltlngarr =  [this.arr[this.currentIndex]];
      // this.mapSrv.map.panTo(this.arr[this.currentIndex]);
      let markerBounds = L.latLngBounds(ltlngarr);
      this.mapSrv.map.fitBounds(markerBounds);
    }
    else {
      this.mapSrv.map.panTo(this.arr[this.currentIndex + 1]);
      let ltlngarr =  [this.arr[this.currentIndex + 1]];
      let markerBounds = L.latLngBounds(ltlngarr);
      this.mapSrv.map.fitBounds(markerBounds);
      // this.mapSrv.map.setZoom(20);
      // this.mapSrv.map.invalidateSize();
      let pop = this.currentIndex + 1 ;
      // L.marker(this.arr[this.currentIndex + 1]).addTo(this.mapSrv.map).bindPopup(pop.toString()).openPopup();
      this.currentIndex++;
    }
  }

  previousLocation(): any {
    if (this.currentIndex === 0) {
      this.currentIndex = this.arr.length - 1;
      this.mapSrv.map.panTo(this.arr[this.currentIndex]);
      // L.marker(this.arr[this.currentIndex]).addTo(this.mapSrv.map).bindPopup(this.currentIndex.toString()).openPopup();
    } else {
      this.mapSrv.map.panTo(this.arr[this.currentIndex - 1]);
      let pop =  this.currentIndex - 1;
      // L.marker(this.arr[this.currentIndex - 1 ]).addTo(this.mapSrv.map).bindPopup(pop.toString()).openPopup();
      this.currentIndex --;
    }
  }

  public quit(): void {
    document.getElementById('map').style.width = '65%';
    document.getElementById('sidebar').style.width = '35%';
    this.mapSrv.map.invalidateSize();
    this.appActions.actSetErrorCorrectionMode(null);
    this.appActions.actToggleSwitchMode(false);
    this.processSrv.refreshSidebarView('cancel selection');
    this.mapSrv.removePopUps();
  }
}
