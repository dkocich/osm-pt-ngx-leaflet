import { Component, ViewChildren } from '@angular/core';

import { BsModalRef } from 'ngx-bootstrap';

import { EditService } from '../../services/edit.service';
import { StorageService } from '../../services/storage.service';
import { MapService } from '../../services/map.service';
import { WarnService } from '../../services/warn.service';

import * as L from 'leaflet';

@Component({
  selector: 'modal-content',
  styleUrls: [
    './modal.component.less',
    '../../styles/main.less',
  ],
  templateUrl: './modal.component.html',
})

export class ModalComponent {
  constructor(public bsModalRef: BsModalRef,
              private editSrv: EditService,
              private storageSrv: StorageService,
              private mapSrv: MapService,
              private warnSrv: WarnService,
              ) { }

  public suggestedNames: string[];
  public error: string;
  @ViewChildren('chosenRef') chosenRefS ;
  @ViewChildren('newlyAddedValue') newlyAddedValue ;
  public errorObject: any;

  public refArr: Map <any, any>;
  public missingRefsDisplay = [];

  public newAddedRefs: any[] = [];

  public removedSuggestions: any[] = [];
  public removedNearbySuggestions: any[] = [];
  public removedMissingSuggestions: any[] = [];

  public addedMissingSuggestionsRefs: any[] = [];
  public addedFromNearbySuggestionsRefs: any[] = [];

  public newValue: any;

  //
  public missingRefs: any[];
  public nearbyRels: any[];

  /***
   * Executed on click of save button for adding new name tag
   * @param {string} name
   * @returns {void}
   */
  public saveNameTag(name: string): void {
    if (name.length !== 0) {
      this.createChangeForNameTag(name);
      this.bsModalRef.hide();
      let popUpElement = this.mapSrv.getPopUpFromArray(this.mapSrv.currentPopUpFeatureId);
      MapService.addHoverListenersToPopUp(popUpElement);
      this.mapSrv.popUpArr   = this.mapSrv.popUpArr.filter((popup) => popup['_leaflet_id'] !== this.mapSrv.currentPopUpFeatureId);
      let popupContent       = L.DomUtil.create('div', 'content');
      popupContent.innerHTML = '<i class="fa fa-check" aria-hidden="true"></i>';
      let popupArr: any      = this.mapSrv.popUpLayerGroup.getLayers();
      popupArr[0].setContent(popupContent);
      this.errorObject.isCorrected                                          = true;
      this.storageSrv.nameErrorsO[this.storageSrv.currentIndex].isCorrected = true;
      this.storageSrv.refreshErrorObjects.emit('missing name');
      this.warnSrv.showGenericSuccess();
    } else {
      alert('Entered name cannot be empty');
    }
  }

  /***
   * Closes the currently opened modal
   * @returns {void}
   */
  public close(): void {
    this.bsModalRef.hide();
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
   * Adds suggested ref value to ref list
   * @param ref
   * @returns {void}
   */
  private addMissingSuggestedRefValue(rel: any): void {
    this.addedMissingSuggestionsRefs.push(rel);
    this.missingRefs.forEach((item, ind) => {
      if (item.id === rel.id) {
        this.removedMissingSuggestions = this.removedMissingSuggestions.concat(this.missingRefs.splice(ind, 1));
      }
    });
  }


  /***
   * Remove the added ref value (added from suggestions (missing) by user)
   * @param ref
   */
  private removeMissingSuggestedRefValue(toRemoveRel: any): void {

    console.log('to emove', toRemoveRel);
    let index ;
    for (let rel of  this.addedMissingSuggestionsRefs){
      if(rel.id === toRemoveRel.id){
        index = this.addedMissingSuggestionsRefs.indexOf(rel);
      }
    }

    if (index > -1) {
      this.addedMissingSuggestionsRefs.splice(index, 1);
    }


    for (let key of this.removedMissingSuggestions) {
      console.log('removed', this.removedMissingSuggestions);
      if (key.id === toRemoveRel.id) {
        console.log('matched', key,toRemoveRel );
        console.log('ids', key.tags.id, toRemoveRel.tags.id, (key.tags.id === toRemoveRel.tags.id));
        this.missingRefs.push(key);
        break;
      }
    }
  }


  /***
   * Remove the added ref value (added from suggestions (nearby) by user)
   * @param ref
   */
  private removeNearbySuggestedRefValue(ref: any): void {
    let index = this.addedMissingSuggestionsRefs.indexOf(ref);
    if (index > -1) {
      this.addedMissingSuggestionsRefs.splice(index, 1);
    }
    for (let key of this.removedSuggestions) {
      if (key[0] === ref) {
        this.missingRefs.push(key);
        break;
      }
    }
  }

  /***
   * Remove the added ref value (newly added by user)
   * @param ref
   */
  private removeNewRefValue(ref: any): void {
    let index = this.newAddedRefs.indexOf(ref);
    if (index > -1) {
      this.newAddedRefs.splice(index, 1);
    }
  }

  /***
   * Adds new ref value
   * @param ref
   */
  private addNewRefValue(ref: string): void {
    if (ref !== '') {
      this.newAddedRefs.push(ref);
    } else {
      alert('Please enter a numeric value');
    }
    this.newlyAddedValue.first.nativeElement.value = '';
  }

  private addNearbySuggestedRefValue(rel: any): any{
    this.addedFromNearbySuggestionsRefs.push(rel.tags.ref);
    this.nearbyRels.forEach((item, ind) => {
      if (item === rel.tags.ref) {
        this.removedNearbySuggestions = this.removedNearbySuggestions.concat(this.nearbyRels.splice(ind, 1));
      }
    });

  }

  //
  // private saveRefTag(): void {
  //   let resultArr = this.addedSuggestions.concat(this.addedRef);
  //   let refString: string = '';
  //   resultArr.forEach((item, index) => {
  //     refString = (index !== resultArr.length - 1) ? refString + item + ', ' : refString + item;
  //   });
  //   this.createChangeForRefTag(refString);
  //   this.bsModalRef.hide();
  //   let popUpElement = this.mapSrv.getPopUpFromArray(this.mapSrv.currentPopUpFeatureId);
  //   MapService.addHoverListenersToPopUp(popUpElement);
  //   this.mapSrv.popUpArr = this.mapSrv.popUpArr.filter((popup) => popup['_leaflet_id'] !== this.mapSrv.currentPopUpFeatureId);
  //   this.mapSrv.popUpLayerGroup.removeLayer(this.mapSrv.currentPopUpFeatureId);
  //   // this.mapSrv.map.remove(this.mapSrv.currentPopUpFeatureId);
  //   this.warnSrv.showGenericSuccess();
  // }
}


