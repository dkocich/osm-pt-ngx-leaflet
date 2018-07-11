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



  // public removedSuggestions: any[] = [];
  public removedNearbySuggestions: any[] = [];
  public removedMissingSuggestions: any[] = [];

  public addedMissingSuggestionsRefs: any[] = [];
  public addedFromNearbySuggestionsRefs: any[] = [];
  public newAddedRefs: any[] = [];

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


  private addNearbySuggestedRefValue(rel: any): any {
    this.addedFromNearbySuggestionsRefs.push(rel);
    this.nearbyRels.forEach((item, ind) => {
      if (item.id === rel.id){
        this.removedNearbySuggestions = this.removedNearbySuggestions.concat(this.nearbyRels.splice(ind, 1));
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
  private removeNearbySuggestedRefValue(toRemoveRel: any): void {

    console.log('to emove', toRemoveRel);
    let index ;
    for (let rel of  this.addedFromNearbySuggestionsRefs){
      if(rel.id === toRemoveRel.id){
        index = this.addedFromNearbySuggestionsRefs.indexOf(rel);
      }
    }

    if (index > -1) {
      this.addedFromNearbySuggestionsRefs.splice(index, 1);
    }


    for (let key of this.removedNearbySuggestions) {
      console.log('removed', this.removedNearbySuggestions);
      if (key.id === toRemoveRel.id) {
        console.log('matched', key,toRemoveRel );
        console.log('ids', key.tags.id, toRemoveRel.tags.id, (key.tags.id === toRemoveRel.tags.id));
        this.nearbyRels.push(key);
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



  private saveRefTag(): void {



    let refsForTag = [];
    for(let rel of this.addedMissingSuggestionsRefs){
      refsForTag.push(rel.tags.ref);
    }


    for (let rel of this.addedFromNearbySuggestionsRefs){
      refsForTag.push(rel.tags.ref);
    }

    refsForTag = refsForTag.concat(this.newAddedRefs);
    let refString: string = '';
    refsForTag.forEach((item, index) => {
      refString = (index !== refsForTag.length - 1) ? refString + item + ', ' : refString + item;
    });
    refString = this.errorObject.tags.route_ref + refString;
    console.log('ohh yaha tk');

    this.createChangeForRefTag(refString);
    console.log('yaha tk');
    this.addToMembers(this.addedFromNearbySuggestionsRefs);
    this.bsModalRef.hide();
    let popUpElement = this.mapSrv.getPopUpFromArray(this.mapSrv.currentPopUpFeatureId);
    MapService.addHoverListenersToPopUp(popUpElement);
    this.mapSrv.popUpArr = this.mapSrv.popUpArr.filter((popup) => popup['_leaflet_id'] !== this.mapSrv.currentPopUpFeatureId);
    this.mapSrv.popUpLayerGroup.removeLayer(this.mapSrv.currentPopUpFeatureId);
    this.warnSrv.showGenericSuccess();
  }



  /***
   *  Handles adding missing refs
   * @param {string} ref
   */
  private createChangeForRefTag(ref: string): void {
    let change: any;
    if (ref !== '') {
      change = {
        from: this.storageSrv.currentElement,
        to: undefined,
      };
      this.storageSrv.currentElement.tags['route_ref'] = ref;
      change.to = this.storageSrv.currentElement;
      this.editSrv.addChange(this.storageSrv.currentElement, 'change tag', change);
    }
  }

  private addToMembers(addedFromNearbySuggestionsRefs: any): any{

    console.log('start');

    if (addedFromNearbySuggestionsRefs.length !== 0) {
      for(let relation of addedFromNearbySuggestionsRefs){
        const rel = JSON.parse(
          JSON.stringify(
            this.storageSrv.elementsMap.get(
              relation.id,
            ),
          ),
        ); // string to not influence new route edit

        console.log('found', rel, 'es', relation);
        if (!rel || rel.type !== 'relation') {
          return alert(
            'Relation was not found ' +
            JSON.stringify(this.storageSrv.currentElement),
          );
        }

        let change = { from: JSON.parse(JSON.stringify(rel)), to: undefined }; // string to not influence toggle edits
        let probableRole: string = '';
        switch (this.errorObject.tags.public_transport) {
          case 'platform':
          case 'station':
            probableRole = 'platform';
            break;
          case 'stop_position':
            probableRole = 'stop';
            break;
          default:
            alert('FIXME: suspicious role - ' + this.errorObject.tags.public_transport);
            probableRole = 'stop';
        }
        const memberToToggle = {
          type: 'node',
          ref: this.errorObject.id,
          role: probableRole,
        };
        rel.members.push(memberToToggle);

        change.to = rel;

        this.editSrv.addChange(rel, 'toggle members', change);

      }
    }

  }

  private showStopInfo(): any {
    alert(JSON.stringify(this.errorObject));
  }

}


