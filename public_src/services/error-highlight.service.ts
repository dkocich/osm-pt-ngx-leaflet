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
  public refErrorsO: any[] = [];
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
      if (data === 'missing ref') {
        this.currentIndex = this.storageSrv.currentIndex;
        this.refErrorsO = this.storageSrv.refErrorsO;
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

    this.switchLocationModeOn();

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

        if ((this.ngRedux.getState()['app']['errorCorrectionMode'] === 'missing ref tag')) {
          let parentRels       = this.getParentRelations(stop.id);
          let missingRefs: any = [];
          if (parentRels.length !== 0) {
            if (stop.tags['route_ref']) {
              let addedRefs = this.getAlreadyAddedRefsInTag(stop.tags['route_ref']);
              missingRefs   = this.compareRefs(parentRels, addedRefs);
            } else {
              for (let parent of parentRels) {
                missingRefs.push(parent);
              }
            }
          }
          if (this.isMobileDevice()) {
            this.openModalWithComponentForRef(stop, missingRefs);

          } else {
            let nearbyRels = this.getNearbyRoutesSuggestions(latlng, missingRefs);
            this.openModalWithComponentForRef(stop, missingRefs, nearbyRels);
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
  public openModalWithComponent(stop: any, suggestedNames: string): void {
    if ((this.ngRedux.getState()['app']['errorCorrectionMode'] === 'missing name tag')) {
        const initialState = {
          error      : 'missing name tag',
          suggestedNames,
          errorObject: stop,
        };
        this.modalRef = this.modalService.show(ModalComponent, { initialState });
    }
  }

  /***
   * Opens up modal for ref
   * @returns {void}
   */
  public openModalWithComponentForRef(stop: any, suggestedRefs: any, nearbyRels?: any): void {
    let initialState;
    if (nearbyRels) {
       initialState = {
             error      : 'missing ref tag',
             missingRefs : suggestedRefs,
             errorObject: stop,
             nearbyRels,
    };
    } else {
      initialState = {
        error      : 'missing ref tag',
        missingRefs : suggestedRefs,
        errorObject: stop,
      };
    }
    this.modalRef = this.modalService.show(ModalComponent, { initialState });
  }

  /***
   * Counts errors
   */
  public countErrors(): void {
    this.storageSrv.currentIndex = 0;
    this.nameErrorsO = [];
    this.refErrorsO = [];
    this.storageSrv.nameErrorsO = [];
    this.storageSrv.refErrorsO = [];

    let count = 0;
    let withtag = 0;
    let withouttag = 0;
    this.storageSrv.elementsMap.forEach((stop) => {

      if (stop.type === 'node' && (stop.tags.bus === 'yes' || stop.tags.public_transport)) {
        count++;

        let errorObj = { stop, isCorrected: false };
        if (!stop.tags['name'] && this.mapSrv.map.getBounds().contains(stop)) {
          // let errorObj = {stop, isCorrected: false};
          this.nameErrorsO.push(errorObj);
        }

        if (this.mapSrv.map.getBounds().contains(stop)) {
          let parentRels  = this.getParentRelations(stop.id);
          if (parentRels.length !== 0) {
          if (stop.tags['route_ref']) {
            let addedRefs   = this.getAlreadyAddedRefsInTag(stop.tags['route_ref']);
            let missingRefs = this.compareRefs(parentRels, addedRefs);
            if (missingRefs.length !== 0) {
              this.refErrorsO.push(errorObj);
              withtag++;
            }
          } else {
            this.refErrorsO.push(errorObj);
            withouttag ++;
          }
          }

        }
      }
    });
    this.storageSrv.refErrorsO = this.refErrorsO;
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
  switchLocationModeOn(): any {
    this.appActions.actToggleSwitchMode(true);
    if (this.currentMode === 'name') {
        this.addSinglePopUp(this.nameErrorsO[0]);
        this.mapSrv.map.setView(this.nameErrorsO[0]['stop'], 15);
      }

    if (this.currentMode === 'ref') {
        this.addSinglePopUp(this.refErrorsO[0]);
        this.mapSrv.map.setView(this.refErrorsO[0]['stop'], 15);
      }
      // this.appActions.actToggleSwitchMode(bool);
    // }
    // this.mapSrv.map.invalidateSize();
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

    if (this.currentMode === 'ref') {
      if (this.currentIndex === (this.refErrorsO.length - 1)) {
        this.currentIndex = 0;
        this.storageSrv.currentIndex = 0;
        this.storageSrv.refreshErrorObjects.emit('missing ref');
        this.addSinglePopUp(this.refErrorsO[this.currentIndex]);
        this.mapSrv.map.setView(this.refErrorsO[this.currentIndex]['stop'], 15);
        document.getElementById(this.refErrorsO[this.refErrorsO.length - 1]['stop'].id).style.backgroundColor = 'white';
        document.getElementById(this.refErrorsO[this.currentIndex]['stop'].id).style.backgroundColor = 'lightblue';

      } else {
        this.currentIndex++;
        this.storageSrv.currentIndex++;
        this.storageSrv.refreshErrorObjects.emit('missing ref');
        this.addSinglePopUp(this.refErrorsO[this.currentIndex]);
        this.mapSrv.map.setView(this.refErrorsO[this.currentIndex]['stop'], 15);
        document.getElementById(this.refErrorsO[this.currentIndex - 1]['stop'].id).style.backgroundColor = 'white';
        document.getElementById(this.refErrorsO[this.currentIndex]['stop'].id).style.backgroundColor = 'lightblue';
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
        this.mapSrv.map.panTo(this.nameErrorsO[this.currentIndex]['stop']);
        document.getElementById(this.nameErrorsO[this.currentIndex + 1]['stop'].id).style.backgroundColor = 'white';
        document.getElementById(this.nameErrorsO[this.currentIndex]['stop'].id).style.backgroundColor = 'lightblue';

      }
    }

    if (this.currentMode === 'ref') {
      if (this.currentIndex === 0) {

        this.currentIndex = this.refErrorsO.length - 1;

        this.storageSrv.currentIndex = this.refErrorsO.length - 1;
        this.storageSrv.refreshErrorObjects.emit('missing ref');
        this.addSinglePopUp(this.refErrorsO[this.currentIndex]);
        this.mapSrv.map.panTo(this.refErrorsO[this.currentIndex]['stop']);

        document.getElementById(this.refErrorsO[0]['stop'].id).style.backgroundColor = 'white';
        document.getElementById(this.refErrorsO[this.refErrorsO.length - 1]['stop'].id).style.backgroundColor = 'lightblue';
      } else {
        this.currentIndex--;

        this.storageSrv.currentIndex--;

        this.storageSrv.refreshErrorObjects.emit('missing ref');

        this.addSinglePopUp(this.refErrorsO[this.currentIndex]);
        this.mapSrv.map.panTo(this.refErrorsO[this.currentIndex]['stop']);
        document.getElementById(this.refErrorsO[this.currentIndex + 1]['stop'].id).style.backgroundColor = 'white';
        document.getElementById(this.refErrorsO[this.currentIndex]['stop'].id).style.backgroundColor = 'lightblue';

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
    this.appActions.actSetErrorCorrectionMode('menu');
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
   * returns names of nearby nodes
   * @param latlngm
   * @returns {any[]}
   */
  public getNearbyRoutesSuggestions(latlngm: any, missingRefs: any): any[] {

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
      for (let rel of missingRefs) {
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

  public jumpToLocation(index: number): any {
    if ((this.ngRedux.getState()['app']['errorCorrectionMode'] === 'missing name tag')) {
      document.getElementById(this.nameErrorsO[this.currentIndex]['stop'].id).style.backgroundColor = 'white';
      this.currentIndex = index;
      this.storageSrv.currentIndex = index;
      this.storageSrv.refreshErrorObjects.emit('missing name');
      this.addSinglePopUp(this.nameErrorsO[this.currentIndex]);
      this.mapSrv.map.setView(this.nameErrorsO[this.currentIndex]['stop'], 15);
      document.getElementById(this.nameErrorsO[this.currentIndex]['stop'].id).style.backgroundColor = 'lightblue';
    }

    if ((this.ngRedux.getState()['app']['errorCorrectionMode'] === 'missing ref tag')) {
      document.getElementById(this.refErrorsO[this.currentIndex]['stop'].id).style.backgroundColor = 'white';
      this.currentIndex = index;
      this.storageSrv.currentIndex = index;
      this.storageSrv.refreshErrorObjects.emit('missing ref');
      this.addSinglePopUp(this.refErrorsO[this.currentIndex]);
      this.mapSrv.map.setView(this.refErrorsO[this.currentIndex]['stop'], 15);
      document.getElementById(this.refErrorsO[this.currentIndex]['stop'].id).style.backgroundColor = 'lightblue';
    }
  }

  /***
   * Returns all stops in current map bounds and which are not downloaded
   * @param listOfStops
   * @returns {any[]}
   */
  public getNotDownloadedStopsInBounds(): any[] {
    let inBounds = [];
    let inBounds2 = [];
    let inBounds3 = [];
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

    this.storageSrv.elementsMap.forEach((element) => {
      if (element.type === 'node' &&
        (element.tags.bus === 'yes' || element.tags.public_transport) &&
        this.mapSrv.map.getBounds().contains(element)) {
        inBounds3.push(element.id);

      }
    });

    return inBounds;
  }

  private getParentRelations(id: any): any {
    let parentRels = [];

    this.storageSrv.elementsMap.forEach((element) => {
      if ((element.type === 'relation') && !(element.tags.public_transport === 'stop_area') && (element.members)) {
          for (let member of element.members) {
            if (member.ref === id && element.tags.ref && /^\d+$/.test(element.tags.ref)) {
              parentRels.push(element);
            }
          }
      }
    });
    return parentRels;
  }

  private getAlreadyAddedRefsInTag(routeRefTag: string): string[] {
    let tags = routeRefTag.split(';');
    tags = tags.filter((tag) => {
    return  /^\d+$/.test(tag);
    });
    return  tags;
  }

  private compareRefs(parentRels: any, addedRefs: any): any {
    let parentRefs = [];
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
}
