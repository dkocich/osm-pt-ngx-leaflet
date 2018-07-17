import { Component, ViewChildren } from '@angular/core';

import { BsModalRef } from 'ngx-bootstrap';

import { EditService } from '../../services/edit.service';
import { StorageService } from '../../services/storage.service';
import { MapService } from '../../services/map.service';
import { WarnService } from '../../services/warn.service';

import * as L from 'leaflet';

import { IPtRelation } from '../../core/ptRelation.interface';
import { IErrorObject } from '../../core/errorObject.interface';

@Component({
  selector: 'modal-content',
  styleUrls: [
    './modal.component.less',
    '../../styles/main.less',
  ],
  templateUrl: './modal.component.html',
})

export class ModalComponent {
  public suggestedNames: string[];
  public error: string;

  @ViewChildren('chosenRef') chosenRefS ;
  @ViewChildren('newlyAddedValue') newlyAddedValue ;

  public errorObject: IErrorObject;

  public removedNearbySuggestions: any[] = [];
  public removedMissingSuggestions: any[] = [];

  public addedMissingSuggestionsRefs: any[] = [];
  public addedFromNearbySuggestionsRefs: any[] = [];
  public newAddedRefs: any[] = [];

  public missingRefs: any[];
  public nearbyRels: any[];

  constructor(public bsModalRef: BsModalRef,
              private editSrv: EditService,
              private storageSrv: StorageService,
              private mapSrv: MapService,
              private warnSrv: WarnService,
              ) { }
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
      this.errorObject.corrected                                          = 'true';
      this.storageSrv.nameErrorsO[this.storageSrv.currentIndex].corrected = 'true';
      this.storageSrv.refreshErrorObjects.emit({ typeOfErrorObject: 'missing name' });
      this.warnSrv.showGenericSuccess();
    } else {
      alert('Entered name cannot be empty');
    }
  }

  /**
   * Saves ref correction
   */
  private saveRefTag(): void {
    let refsForTag        = [];
    let refString: string = '';

    for (let rel of this.addedMissingSuggestionsRefs) {
      refsForTag.push(rel.tags.ref);
    }
    for (let rel of this.addedFromNearbySuggestionsRefs) {
      refsForTag.push(rel.tags.ref);
    }
    refsForTag = refsForTag.concat(this.newAddedRefs);
    refsForTag = refsForTag.filter((v, i, a) => {
      return a.indexOf(v) === i;
    }) ;
    console.log('ref tag', refsForTag);
    refsForTag.sort();
    if (refsForTag.length !== 0) {
      refsForTag.forEach((item, index) => {
        refString = (index !== refsForTag.length - 1) ? refString + item + ';' : refString + item;
      });

      if (this.errorObject.stop.tags.route_ref) {
        refString = this.errorObject.stop.tags.route_ref + ';' + refString;
      }

      this.createChangeForRefTag(refString);
      this.addToMembers(this.addedFromNearbySuggestionsRefs);
      this.bsModalRef.hide();
      let popUpElement = this.mapSrv.getPopUpFromArray(this.mapSrv.currentPopUpFeatureId);
      MapService.addHoverListenersToPopUp(popUpElement);
      this.mapSrv.popUpArr = this.mapSrv.popUpArr.filter((popup) => {
        return popup['_leaflet_id'] !== this.mapSrv.currentPopUpFeatureId;
      });
      this.checkErrorIfCorrected();
      this.storageSrv.refreshErrorObjects.emit({ typeOfErrorObject: 'missing ref' });
      this.warnSrv.showGenericSuccess();
    } else {
      alert('Nothing to save');
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
   * @param rel
   * @returns {void}
   */
  private addMissingSuggestedRefValue(rel: IPtRelation): void {
    this.addedMissingSuggestionsRefs.push(rel);
    this.missingRefs.forEach((item, ind) => {
      if (item.id === rel.id) {
        this.removedMissingSuggestions = this.removedMissingSuggestions.concat(this.missingRefs.splice(ind, 1));
      }
    });
  }

  /***
   * adds selected nearby suggestion
   * @param rel
   * @returns {any}
   */
  private addNearbySuggestedRefValue(rel: any): void {
    this.addedFromNearbySuggestionsRefs.push(rel);
    this.nearbyRels.forEach((item, ind) => {
      if (item.id === rel.id) {
        this.removedNearbySuggestions = this.removedNearbySuggestions.concat(this.nearbyRels.splice(ind, 1));
      }
    });
  }

  /***
   * Remove the added ref value (added from suggestions (missing) by user)
   * @param toRemoveRel
   */
  private removeMissingSuggestedRefValue(toRemoveRel: any): void {
    let index ;
    for (let rel of  this.addedMissingSuggestionsRefs) {
      if (rel.id === toRemoveRel.id) {
        index = this.addedMissingSuggestionsRefs.indexOf(rel);
      }
    }

    if (index > -1) {
      this.addedMissingSuggestionsRefs.splice(index, 1);
    }

    for (let key of this.removedMissingSuggestions) {
      if (key.id === toRemoveRel.id) {
        this.missingRefs.push(key);
        break;
      }
    }
  }

  /***
   * Remove the added ref value (added from suggestions (nearby) by user)
   * @param toRemoveRel
   */
  private removeNearbySuggestedRefValue(toRemoveRel: any): void {

    let index ;
    for (let rel of  this.addedFromNearbySuggestionsRefs) {
      if (rel.id === toRemoveRel.id) {
        index = this.addedFromNearbySuggestionsRefs.indexOf(rel);
      }
    }

    if (index > -1) {
      this.addedFromNearbySuggestionsRefs.splice(index, 1);
    }

    for (let key of this.removedNearbySuggestions) {
      if (key.id === toRemoveRel.id) {
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

  /***
   * adds given node as child member of routes
   * @param addedFromNearbySuggestionsRefs
   * @returns {any}
   */
  private addToMembers(addedFromNearbySuggestionsRefs: any): any {

    if (addedFromNearbySuggestionsRefs.length !== 0) {
      for (let relation of addedFromNearbySuggestionsRefs) {
        const rel = JSON.parse(
          JSON.stringify(
            this.storageSrv.elementsMap.get(
              relation.id,
            ),
          ),
        );

        if (!rel || rel.type !== 'relation') {
          return alert(
            'Relation was not found ' +
            JSON.stringify(this.storageSrv.currentElement),
          );
        }

        let change = { from: JSON.parse(JSON.stringify(rel)), to: undefined }; // string to not influence toggle edits
        let probableRole: string = '';
        switch (this.errorObject.stop.tags.public_transport) {
          case 'platform':
          case 'station':
            probableRole = 'platform';
            break;
          case 'stop_position':
            probableRole = 'stop';
            break;
          default:
            alert('FIXME: suspicious role - ' + this.errorObject.stop.tags.public_transport);
            probableRole = 'stop';
        }
        const memberToToggle = {
          type: 'node',
          ref: this.errorObject.stop.id,
          role: probableRole,
        };
        rel.members.push(memberToToggle);

        change.to = rel;

        this.editSrv.addChange(rel, 'toggle members', change);

      }
    }

  }

  private checkErrorIfCorrected(): void {
    let val;
    let popupContent       = L.DomUtil.create('div', 'content');
    if (this.missingRefs.length === 0) {
      val = 'true';
      popupContent.innerHTML = '<i class="fa fa-check" aria-hidden="true"></i>';
    } else if (this.addedMissingSuggestionsRefs.length !== 0) {
      val = 'partial';
      popupContent.innerHTML = '<i class="fa fa-question" aria-hidden="true"></i>';
    } else {
      val = 'false';
      popupContent.innerHTML = '<i class="fa fa-exclamation-triangle" aria-hidden="true"></i>';
    }
    this.errorObject.corrected = val;
    this.storageSrv.refErrorsO[this.storageSrv.currentIndex].corrected = val;
    let popupArr: any      = this.mapSrv.popUpLayerGroup.getLayers();
    popupArr[0].setContent(popupContent);
  }
}
