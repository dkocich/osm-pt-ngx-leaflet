import { EventEmitter, Injectable } from '@angular/core';
import * as L from 'leaflet';

import { MapService } from './map.service';
import { ProcessService } from './process.service';
import { StorageService } from './storage.service';

import { AppActions } from '../store/app/actions';
import { IAppState } from '../store/model';

import { NgRedux } from '@angular-redux/store';

import { BsModalRef, BsModalService } from 'ngx-bootstrap';

import { ModalComponent } from '../components/modal/modal.component';

import * as MobileDetect from 'mobile-detect';

@Injectable()
export class ErrorHighlightService {
  modalRef: BsModalRef;
  public nameErrorsO: any[] = [];
  public currentIndex = 0;
  public currentMode: string;
  public isDataDownloaded: EventEmitter<boolean> = new EventEmitter();

  constructor(
    private modalService: BsModalService,
    private ngRedux: NgRedux<IAppState>,
    private processSrv: ProcessService,
    public appActions: AppActions,
    public mapSrv: MapService,
    public storageSrv: StorageService,
  ) {
    this.isDataDownloaded.subscribe((data) => {
      if (data) {
        this.countErrors();
      }
    });

    this.storageSrv.refreshErrorObjects.subscribe((data) => {
      if (data === 'missing name') {
        this.currentIndex = this.storageSrv.currentIndex;
        this.nameErrorsO = this.storageSrv.nameErrorsO;
      }
    });
  }

  /***
   * Turns of marker click and starts switch location mode on
   * @param {string} tag
   * @returns {void}
   */
  public missingTagError(tag: string): void {
    this.storageSrv.currentIndex = 0;
    this.storageSrv.refreshErrorObjects.emit('missing ' + tag);
    this.currentMode = tag;
    this.mapSrv.popUpLayerGroup = null;
    this.mapSrv.popUpArr = [];
    this.mapSrv.map.eachLayer((layer) => {
      if (layer['_latlng'] && layer['feature']) {
        layer.off('click');
      }
    });
    if (tag === 'name') {
      this.switchlocationModeOn(true, this.nameErrorsO);
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
   * @param stop
   * @returns {void}
   */

  private addClickListenerToPopUp(popUpElement: HTMLElement, markerFeatureid: number, popUpId: number, stop: any): void {
    L.DomEvent.addListener(popUpElement, 'click', (e) => {
      const featureId = Number(markerFeatureid);
      const element   = this.processSrv.getElementById(featureId);
      if (element) {
        let latlng = { lat: element.lat, lng: element.lon };
        if ((this.ngRedux.getState()['app']['errorCorrectionMode'] === 'missing name tag')) {
          let arr = this.getNearbyNodeNames(latlng);
          let suggestedNames = this.getMostUsedName(arr);
          this.openModalWithComponent(stop, suggestedNames);
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
  public openModalWithComponent(stop: any, suggestedNames?: string): void {
    if ((this.ngRedux.getState()['app']['errorCorrectionMode'] === 'missing name tag')) {

      if (suggestedNames) {
        const initialState = {
          error      : 'missing name tag',
          suggestedNames,
          errorObject: stop,
        };
        this.modalRef = this.modalService.show(ModalComponent, { initialState });
      }
      else {
        const initialState = {
          error      : 'missing name tag',
          errorObject: stop,
        };
        this.modalRef = this.modalService.show(ModalComponent, { initialState });
      }
    }
  }

  /***
   * Counts errors
   */
  public countErrors(): void {
    this.nameErrorsO = [];
    let count = 0;
    this.storageSrv.elementsMap.forEach((stop) => {
      if (stop.type === 'node' && (stop.tags.bus === 'yes' || stop.tags.public_transport)) {
        count++;
        let errorObj = { stop, isCorrected: false };
        if (!stop.tags['name'] && this.mapSrv.map.getBounds().contains(stop)) {
          this.nameErrorsO.push(errorObj);
        }
      }
    });
    this.storageSrv.nameErrorsO = this.nameErrorsO;
    this.storageSrv.refreshErrorObjects.emit('missing name');
    this.storageSrv.refreshErrorObjects.emit('missing ref');
  }

  /***
   * Checks whether on Mobile/Desktop
   * @returns {boolean}
   */
  private isMobileDevice(): boolean {
    let md = new MobileDetect(window.navigator.userAgent);
    if (md.mobile()) {
      return true;
    } else {
      return false;
    }
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
    } else {
      console.log('run', this.currentMode);
      if (this.currentMode === 'name') {
        this.addSinglePopUp(this.nameErrorsO[0]);
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
        this.storageSrv.currentIndex = 0;
        this.storageSrv.refreshErrorObjects.emit('missing name');
        this.addSinglePopUp(this.nameErrorsO[this.currentIndex]);
        this.mapSrv.map.setView(this.nameErrorsO[this.currentIndex]['stop'], 15);
        document.getElementById(this.nameErrorsO[this.nameErrorsO.length - 1]['stop'].id).style.backgroundColor = 'white';
        document.getElementById(this.nameErrorsO[this.currentIndex]['stop'].id).style.backgroundColor = 'lightblue';

      } else {
        this.currentIndex++;
        this.storageSrv.currentIndex++;
        this.storageSrv.refreshErrorObjects.emit('missing name');
        this.addSinglePopUp(this.nameErrorsO[this.currentIndex]);
        this.mapSrv.map.setView(this.nameErrorsO[this.currentIndex]['stop'], 15);
        document.getElementById(this.nameErrorsO[this.currentIndex - 1]['stop'].id).style.backgroundColor = 'white';
        document.getElementById(this.nameErrorsO[this.currentIndex]['stop'].id).style.backgroundColor = 'lightblue';
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

        this.storageSrv.currentIndex = this.nameErrorsO.length - 1;
        this.storageSrv.refreshErrorObjects.emit('missing name');
        this.addSinglePopUp(this.nameErrorsO[this.currentIndex]);
        this.mapSrv.map.panTo(this.nameErrorsO[this.currentIndex]['stop']);

        document.getElementById(this.nameErrorsO[0]['stop'].id).style.backgroundColor = 'white';
        document.getElementById(this.nameErrorsO[this.nameErrorsO.length - 1]['stop'].id).style.backgroundColor = 'lightblue';
      } else {
        this.currentIndex--;

        this.storageSrv.currentIndex--;

        this.storageSrv.refreshErrorObjects.emit('missing name');

        this.addSinglePopUp(this.nameErrorsO[this.currentIndex]);
        console.log('index', this.nameErrorsO[this.currentIndex]);
        this.mapSrv.map.panTo(this.nameErrorsO[this.currentIndex]['stop']);
        document.getElementById(this.nameErrorsO[this.currentIndex + 1]['stop'].id).style.backgroundColor = 'white';
        document.getElementById(this.nameErrorsO[this.currentIndex]['stop'].id).style.backgroundColor = 'lightblue';

      }
    }
  }

  /***
   * Quits correction mode
   */
  public quit(): void {
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
        if (m.getLatLng().distanceTo(latlngm) < 1000 && m.feature.properties.name) {
          inRangeNameArray.push(m.feature.properties.name);
        }
      }
    });
    return inRangeNameArray;
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
    const arr = [];
    arr[0] = modeMap;
    let sorted = Object.keys(arr[0]).sort((a, b) => arr[0][b] - arr[0][a]);
    sorted.forEach((x) => console.log(x + ': ' + arr[0][x]));

    if (sorted.length > 5) {
      sorted = sorted.slice(0, 5);
    }
    return sorted;
  }

  /***
   * Adds popup
   * @param errorObj
   * @returns {any}
   */
  public addSinglePopUp(errorObj: any): any {
    let stop = errorObj['stop'];
    this.mapSrv.removePopUps();
    let latlng = { lat: stop.lat, lng: stop.lon };
    let popupContent;
    if (errorObj.isCorrected) {
      console.log('true');
      popupContent = L.DomUtil.create('div', 'content');
      popupContent.innerHTML = '<i class="fa fa-check" aria-hidden="true"></i>';
    } else {
      popupContent = ErrorHighlightService.makePopUpContent();
    }
    let popup =     L.popup({
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

  /***
   * Returns all stops in current map bounds and which are not downloaded
   * @returns {any[]}
   */
  public getAllStopsInCurrentBounds(): any[] {
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

  jumpToLocation(index: number): any {
    if ((this.ngRedux.getState()['app']['errorCorrectionMode'] === 'missing name tag')) {
      document.getElementById(this.nameErrorsO[this.currentIndex]['stop'].id).style.backgroundColor = 'white';
      this.currentIndex = index;
      this.storageSrv.currentIndex = index;
      this.storageSrv.refreshErrorObjects.emit('missing name');
      this.addSinglePopUp(this.nameErrorsO[this.currentIndex]);
      this.mapSrv.map.setView(this.nameErrorsO[this.currentIndex]['stop'], 15);
      document.getElementById(this.nameErrorsO[this.currentIndex]['stop'].id).style.backgroundColor = 'lightblue';
    }
  }
}
