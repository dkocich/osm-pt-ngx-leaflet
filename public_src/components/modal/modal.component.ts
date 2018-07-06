import { Component, OnInit, ViewChildren } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap';
import { EditService } from '../../services/edit.service';
import { StorageService } from '../../services/storage.service';
import { MapService } from '../../services/map.service';
import { WarnService } from '../../services/warn.service';
import * as L from "leaflet";
import {ErrorHighlightService} from '../../services/error-highlight.service';
import {OverpassService} from '../../services/overpass.service';

@Component({
  selector: 'modal-content',
  styleUrls: [
    './modal.component.less',
    '../../styles/main.less',
  ],
  templateUrl: './modal.component.html',
})

export class ModalComponent implements OnInit {
  constructor(public bsModalRef: BsModalRef,
              private editSrv: EditService,
              private storageSrv: StorageService,
              private mapSrv: MapService,
              private warnSrv: WarnService,
              // private errorHighlightSrv: ErrorHighlightService
              // private overpassSrv: OverpassService,
              ) {

    // this.errorHighlightSrv.refreshErrorObjects.subscribe((data) =>{
    //   if(data === 'missing name') {
    //     console.log('s');
    //     this.nameErrorsO = this.errorHighlightSrv.nameErrorsO;
    //   }
    // });

  }

  public suggestedNames: string[] ;
  public refArr: Map <any, any>;
  public arr = [];
  public error: string;
  public addedRef: any[] = [];
  public removedSuggestions: any[] = [];
  public addedSuggestions: any[] = [];
  public newValue: any;
  @ViewChildren('chosenRef') chosenRefS ;
  @ViewChildren('v') newlyAddedValue ;

  public errorObject: any;
  public nearbyRouteSuggestions = [];
  public ngOnInit(): void {
    if (this.error === 'missing ref tag') {
      this.arr = Array.from(this.refArr);
    }
    console.log('current error object');
  }

   /***
   * Handles adding missing name
   * @param {string} name
   */
  private createChangeForNameTag(name: string): void {
    let change: object;
    if (name !== '') {
      this.storageSrv.currentElement.tags['name'] = name;
      change = {
        key: 'name',
        value: name,
      };
      this.editSrv.addChange(this.storageSrv.currentElement, 'add tag', change);
    }
  }

  /***
   *  Handles adding missing refs
   * @param {string} ref
   */
  private createChangeForRefTag(ref: string): void {
    let change: object;
    if (ref !== '') {
      this.storageSrv.currentElement.tags['ref'] = ref;
      change = {
        key: 'ref',
        value: ref,
      };
      this.editSrv.addChange(this.storageSrv.currentElement, 'add tag', change);
    }
  }

  /***
   * Executed on click of save button for adding new name tag
   * @param {string} name
   * @returns {void}
   */
  private saveNameTag(name: string): void {
    this.createChangeForNameTag(name);
    this.bsModalRef.hide();
    // add hover listener
    let popUpElement = this.mapSrv.getPopUpFromArray(this.mapSrv.currentPopUpFeatureId);
    MapService.addHoverListenersToPopUp(popUpElement);
    this.mapSrv.popUpArr = this.mapSrv.popUpArr.filter((popup) => popup['_leaflet_id'] !== this.mapSrv.currentPopUpFeatureId);
    let popupContent       = L.DomUtil.create('div', 'content');
    popupContent.innerHTML = '<i class="fa fa-check" aria-hidden="true"></i>';
    let popupArr: any = this.mapSrv.popUpLayerGroup.getLayers();
    let popUp = popupArr[0];
    popupArr[0].setContent(popupContent);
    this.errorObject.isCorrected = true;
    console.log('name', this.storageSrv.nameErrorsO[this.storageSrv.currentIndex]);
    this.storageSrv.nameErrorsO[this.storageSrv.currentIndex].isCorrected = true;
    console.log('after name', this.storageSrv.nameErrorsO[this.storageSrv.currentIndex]);

    this.storageSrv.refreshErrorObjects.emit('missing name');
    this.warnSrv.showGenericSuccess();
  }

  /***
   * Closes the currently opened modal
   * @returns {void}
   */
  private close(): void {
    this.bsModalRef.hide();
  }

  /***
   * Executed on click of save button for adding ref
   * @returns {void}
   */
  private saveRefTag(): void {
   let resultArr = this.addedSuggestions.concat(this.addedRef);
   let refString: string = '';
   resultArr.forEach((item, index) => {
   refString = (index !== resultArr.length - 1) ? refString + item + ', ' : refString + item;
   });
   this.createChangeForRefTag(refString);
   this.bsModalRef.hide();
   let popUpElement = this.mapSrv.getPopUpFromArray(this.mapSrv.currentPopUpFeatureId);
   MapService.addHoverListenersToPopUp(popUpElement);
   this.mapSrv.popUpArr = this.mapSrv.popUpArr.filter((popup) => popup['_leaflet_id'] !== this.mapSrv.currentPopUpFeatureId);
   this.mapSrv.popUpLayerGroup.removeLayer(this.mapSrv.currentPopUpFeatureId);
   // this.mapSrv.map.remove(this.mapSrv.currentPopUpFeatureId);
   this.warnSrv.showGenericSuccess();
  }

  /***
   * Adds new ref value
   * @param ref
   */
  private addNewRefValue(ref: string): void {
   if (ref !== '') {
     this.addedRef.push(ref);
   } else {
     alert('Please enter a numeric value');
   }
   this.newlyAddedValue.first.nativeElement.value = '';
  }

  /***
   * Adds suggested ref value to ref list
   * @param ref
   * @returns {void}
   */
  private addSuggestedRefValue(ref: any): void {
      this.addedSuggestions.push(ref);
      this.arr.forEach((item, ind) => {
        if (item[0] === ref) {
          this.removedSuggestions = this.removedSuggestions.concat(this.arr.splice(ind, 1));
        }
    });
  }

  /***
   * Remove the added ref value (newly added by user)
   * @param ref
   */
  private removeAddedNewRefValue(ref: any): void {
    let index = this.addedRef.indexOf(ref);
    if (index > -1) {
      this.addedRef.splice(index, 1);
    }
  }

  /***
   * Remove the added ref value (added from suggestions by user)
   * @param ref
   */
  private removeAddedSuggestedRefValue(ref: any): void {
    let index = this.addedSuggestions.indexOf(ref);
    if (index > -1) {
      this.addedSuggestions.splice(index, 1);
    }
    for (let key of this.removedSuggestions) {
      if (key[0] === ref) {
        this.arr.push(key);
        break;
      }
    }
  }

  private showNearbyRouteSuggestions(latlngm: any): any {

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

}
