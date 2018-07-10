import { EventEmitter, Injectable } from '@angular/core';
import * as L from 'leaflet';

import { MapService } from './map.service';
import { ProcessService } from './process.service';
import { StorageService } from './storage.service';

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
  public currentIndex                            = 0;
  public currentMode: string;
  public isDataDownloaded: EventEmitter<boolean> = new EventEmitter();

  constructor(public mapSrv: MapService,
              public appActions: AppActions,
              public storageSrv: StorageService,
              private ngRedux: NgRedux<IAppState>,
              private modalService: BsModalService,
              private processSrv: ProcessService,
  ) {
    this.isDataDownloaded.subscribe((data) => {
      if (data) {
        this.countErrors();
      }
    });

    this.storageSrv.refreshErrorObjects.subscribe((data) => {
      if (data === 'missing name') {
        this.currentIndex =  this.storageSrv.currentIndex;
        this.nameErrorsO = this.storageSrv.nameErrorsO;
      }
      if (data === 'missing ref') {
        this.currentIndex =  this.storageSrv.currentIndex;
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
    console.log('emitted' + 'missing ' + tag);
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
          let arr    = this.getNearbyNodeNames(latlng);
          let suggestedNames   = this.getMostUsedName(arr);
          this.openModalWithComponent(stop, suggestedNames);
        }
        if ((this.ngRedux.getState()['app']['errorCorrectionMode'] === 'missing ref tag')) {
          console.log('got value', this.isMobileDevice());


          // get suggestions

          if (this.isMobileDevice()) {
            // data was not completely download
            this.openModalWithComponent(stop);
          } else {
            this.openModalWithComponent(stop);
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
  public openModalWithComponent(stop: any, suggestedNames?: string): void {
    // name is suggested name
    if ((this.ngRedux.getState()['app']['errorCorrectionMode'] === 'missing name tag')) {

      if (suggestedNames) {
        const initialState = {
          error      : 'missing name tag',
          suggestedNames,
          errorObject: stop,
        };
        this.modalRef      = this.modalService.show(ModalComponent, {initialState});
      }
      else {
        const initialState = {
          error      : 'missing name tag',
          errorObject: stop,
        };
        this.modalRef      = this.modalService.show(ModalComponent, {initialState});
      }
    } else
    {
      const initialState = {
        error      : 'missing ref tag',
        errorObject: stop,
      };
      this.modalRef      = this.modalService.show(ModalComponent, {initialState});
    }
  }

  /***
   * Counts errors
   */
  public countErrors(): void {
    console.log('count errors called');
    this.refErrorsO = [];
    this.nameErrorsO = [];
    let count = 0;
    this.storageSrv.elementsMap.forEach((stop) => {
      // console.log('next stop', stop);

      // if (this.mapSrv.map.getBounds().contains(stop)){
      //   count++;
      // }

      if (stop.type === 'node' && (stop.tags.bus === 'yes' || stop.tags.public_transport)) {
        count ++;
        let errorObj = { stop, isCorrected: false };
        if (!stop.tags['name'] && this.mapSrv.map.getBounds().contains(stop)) {
          // console.log('no name');
          this.nameErrorsO.push(errorObj);
        }

        if (this.mapSrv.map.getBounds().contains(stop)) {

          if (this.isMobileDevice()) {
            let refErrorObj          = { stop, isCorrected: false };

            if (!stop.tags['route_ref']) {
              this.refErrorsO.push(refErrorObj);
            }
          } else {

            if (stop.tags['route_ref']) {
              console.log('stop', stop);
              let parentRels = this.getParentRelations(stop.id);
              console.log('parents', parentRels);
              let addedRefs = this.getAlreadyAddedRefsInTag(stop.tags['route_ref']);
              let missingRefs = this.compareRefs(parentRels, addedRefs);
              // get missing refs
              // and send them as suggestions
              let refErrorObj          = { stop, isCorrected: false, missingRefs };

              if (missingRefs.length !== 0) {
                this.refErrorsO.push(refErrorObj);
              }

              this.getNearbyRefs()

            } else {
              let refErrorObj          = { stop, isCorrected: false };
              this.refErrorsO.push(refErrorObj);
            }
          }
          // if (stop.tags['route_ref']){
          //   console.log('stop', stop);
          //
          //   let parentRels = this.getParentRelations(stop.id);
          //   console.log('parents', parentRels);
          //   let addedRefs = this.getAlreadyAddedRefsInTag(stop.tags['route_ref']);
          //   let bool = this.compareRefs(parentRels, addedRefs);
          //   if (!bool) {
          //     this.refErrorsO.push(refErrorObj);
          //   }
          // } else {
          //   this.refErrorsO.push(refErrorObj);
          // }
        }
      }

      // console.log('stop', stop);
    });

   //  console.log('ref errors', this.refErrorsO);
   // console.log('in bounds', count);
    // for (let stop of this.storageSrv.listOfStops) {
    //   let stopObj2 = { stop, isCorrected: false };
    //   let stopObj          = { lat: stop.lat, lng: stop.lon, id: stop.id, isCorrected : false };
    //   if (!(this.storageSrv.elementsMap.get(stop.id).tags['ref']) &&
    //     this.mapSrv.map.getBounds().contains(stopObj)) {
    //
    //     // let refs = this.getAlreadyAddedRefsInTag(this.storageSrv.elementsMap.get(stop.id).tags['route_ref']);
    //     // download everything
    //     // this.overpassSrv.download()
    //     this.refErrorsO.push(stopObj);
    //
    //   }
    // }
    this.storageSrv.refErrorsO = this.refErrorsO;
    this.storageSrv.nameErrorsO =  this.nameErrorsO;
    this.storageSrv.refreshErrorObjects.emit('missing name');
    this.storageSrv.refreshErrorObjects.emit('missing ref');
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
    } else {
      console.log('run' , this.currentMode);
      if (this.currentMode === 'name') {
        this.addSinglePopUp(this.nameErrorsO[0]);
        this.mapSrv.map.setView(this.nameErrorsO[0]['stop'], 15);
      }
      if (this.currentMode === 'ref') {
        this.addSinglePopUp(this.refErrorsO[0]);
        this.mapSrv.map.setView(this.refErrorsO[0]['stop'], 15);
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
        this.storageSrv.currentIndex ++;
        this.storageSrv.refreshErrorObjects.emit('missing name');
        this.addSinglePopUp(this.nameErrorsO[this.currentIndex]);
        this.mapSrv.map.setView(this.nameErrorsO[this.currentIndex]['stop'], 15);
        document.getElementById(this.nameErrorsO[this.currentIndex - 1 ]['stop'].id).style.backgroundColor = 'white';
        document.getElementById(this.nameErrorsO[this.currentIndex ]['stop'].id).style.backgroundColor = 'lightblue';
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

        this.storageSrv.currentIndex ++;
        this.storageSrv.refreshErrorObjects.emit('missing ref');
        this.addSinglePopUp(this.refErrorsO[this.currentIndex]);
        this.mapSrv.map.setView(this.refErrorsO[this.currentIndex]['stop'], 15);
        document.getElementById(this.refErrorsO[this.currentIndex - 1 ]['stop'].id).style.backgroundColor = 'white';
        document.getElementById(this.refErrorsO[this.currentIndex ]['stop'].id).style.backgroundColor = 'lightblue';
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
        // console.log('index',this.refErrorsO[this.currentIndex]);
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

   console.log('wholearr', array);
    const arr = [];
    arr[0] = modeMap;
    let sorted = Object.keys(arr[0]).sort((a, b) => arr[0][b] - arr[0][a]);
    sorted.forEach((x) => console.log(x + ': ' + arr[0][x]));

    if (sorted.length > 5){
      sorted =  sorted.slice(0, 5);
    }

    return sorted;
    // return maxEl;
  }

  /***
   * Adds popup
   * @param stop
   * @returns {any}
   */
  addSinglePopUp(errorObj: any): any {
     let stop =  errorObj['stop'];
     // console.log('sd', errorObj['stop']);
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
         if (m.getLatLng().distanceTo(latlngm) < 500) {
           let id = this.mapSrv.getFeatureIdFromMarker(layer.feature);
           nearbyStopArr.push(id);
         }
       }
     });
    // can use async await here
    // this.overpassSrv.download(nearbyStopArr);

    }

  public getAlreadyAddedRefsInTag(routeRefTag: string): string[] {
    console.log('tag',routeRefTag);
    return  routeRefTag.split(';');
  }

  /***
   * Returns all stops in current map bounds and which are not downloaded
   * @param listOfStops
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
    console.log('in bounds', inBounds.length);
    return inBounds;
  }
  //
  // public missingRefTag(): any {
  //    // download all data
  //   this.overpassSrv.download();
  //
  // }

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

  getParentRelations(id: any): any {
    let parentRels = [];

    this.storageSrv.elementsMap.forEach((element) => {
      if ((element.type === 'relation') && !(element.tags.public_transport === 'stop_area')) {

        if (element.members) {
          for (let member of element.members) {
            if(member.ref === id){
              parentRels.push(element);
            }
          }
        }
      }
    });
    return parentRels;
  }


  compareRefs(parentRels: any, addedRefs: any): any {
    let parentRefs = [];
    let missingRefs = [];
    for (let parent of parentRels) {
      parentRefs.push(parent.tags.ref);
    }

    parentRefs = parentRefs.filter((val, ind) => { return parentRefs.indexOf(val) === ind; });

    let flag = true;
    for(let ref of parentRefs){

      if (!addedRefs.includes(ref)){
        flag = false;
        missingRefs.push(ref);
      }
    }

    return missingRefs;

  }

  getNearbyRefs(latlngm: any): any {
    this.storageSrv.elementsMap.forEach((element) => {
      if (element.type === 'node' && (element.tags.bus === 'yes' || element.tags.public_transport)) {

      }
    });
  }
}
