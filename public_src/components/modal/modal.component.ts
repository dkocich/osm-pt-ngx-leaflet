import { Component, ViewChildren } from '@angular/core';

import { BsModalRef } from 'ngx-bootstrap';

import { EditService } from '../../services/edit.service';
import { StorageService } from '../../services/storage.service';
import { MapService } from '../../services/map.service';
import { WarnService } from '../../services/warn.service';

import * as L from 'leaflet';

import { IPtRelation } from '../../core/ptRelation.interface';
import { INameErrorObject, IPTvErrorObject, IRefErrorObject, IWayErrorObject } from '../../core/errorObject.interface';

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

  @ViewChildren('chosenRef') chosenRefS;
  @ViewChildren('newlyAddedValue') newlyAddedValue;

  public nameErrorObject: INameErrorObject;
  public refErrorObject: IRefErrorObject;
  public wayErrorObject: IWayErrorObject;
  public PTvErrorObject: IPTvErrorObject;

  public removedNearbySuggestions: any[]  = [];
  public removedMissingSuggestions: any[] = [];

  public addedMissingSuggestionsRefs: any[]    = [];
  public addedFromNearbySuggestionsRefs: any[] = [];
  public newAddedRefs: any[]                   = [];

  public missingRefRels: any[];
  public nearbyRels: any[];

  public osmtogeojson: any = require('osmtogeojson');

  constructor(public bsModalRef: BsModalRef,
              private editSrv: EditService,
              private storageSrv: StorageService,
              private mapSrv: MapService,
              private warnSrv: WarnService,
  ) {
  }

  /**
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
      this.nameErrorObject.corrected                                        = 'true';
      this.storageSrv.nameErrorsObj[this.storageSrv.currentIndex].corrected = 'true';
      this.storageSrv.refreshErrorObjects.emit({ typeOfErrorObject: 'missing name tags' });
      this.warnSrv.showGenericSuccess();
    } else {
      alert('Entered name cannot be empty');
    }
  }

  /**
   * Saves ref correction
   */
  public saveRefTag(): void {
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
    });
    refsForTag.sort();
    if (refsForTag.length !== 0) {
      refsForTag.forEach((item, index) => {
        refString = (index !== refsForTag.length - 1) ? refString + item + ';' : refString + item;
      });

      if (this.refErrorObject.stop.tags.route_ref) {
        refString = this.refErrorObject.stop.tags.route_ref + ';' + refString;
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
      this.refErrorObject.missingConnectedRefs = this.missingRefRels.length;
      this.storageSrv.refreshErrorObjects.emit({ typeOfErrorObject: 'missing refs' });
      this.warnSrv.showGenericSuccess();
    } else {
      alert('Nothing to save');
    }
  }

  public saveWayError(): void {
    this.createChangeForWayError();
    let popUpElement = this.mapSrv.getPopUpFromArray(this.mapSrv.currentPopUpFeatureId);
    MapService.addHoverListenersToPopUp(popUpElement);
    this.mapSrv.popUpArr   = this.mapSrv.popUpArr.filter((popup) => popup['_leaflet_id'] !== this.mapSrv.currentPopUpFeatureId);
    let popupContent       = L.DomUtil.create('div', 'content');
    popupContent.innerHTML = '<i class="fa fa-check" aria-hidden="true"></i>';
    let popupArr: any      = this.mapSrv.popUpLayerGroup.getLayers();
    popupArr[0].setContent(popupContent);
    this.wayErrorObject.corrected                                        = 'true';
    this.storageSrv.wayErrorsObj[this.storageSrv.currentIndex].corrected = 'true';
    this.storageSrv.refreshErrorObjects.emit({ typeOfErrorObject: 'way as parent' });
    this.rerenderPlatformAsStop();
    this.warnSrv.showGenericSuccess();
    this.bsModalRef.hide();
  }

  public savePTvError(): void {
    this.createChangeForPTvError();
    let popUpElement = this.mapSrv.getPopUpFromArray(this.mapSrv.currentPopUpFeatureId);
    MapService.addHoverListenersToPopUp(popUpElement);
    this.mapSrv.popUpArr   = this.mapSrv.popUpArr.filter((popup) => popup['_leaflet_id'] !== this.mapSrv.currentPopUpFeatureId);
    let popupContent       = L.DomUtil.create('div', 'content');
    popupContent.innerHTML = '<i class="fa fa-check" aria-hidden="true"></i>';
    let popupArr: any      = this.mapSrv.popUpLayerGroup.getLayers();
    popupArr[0].setContent(popupContent);
    this.PTvErrorObject.corrected                                        = 'true';
    this.storageSrv.PTvErrorsObj[this.storageSrv.currentIndex].corrected = 'true';
    this.storageSrv.refreshErrorObjects.emit({ typeOfErrorObject: 'PTv correction' });
    this.warnSrv.showGenericSuccess();
    this.bsModalRef.hide();
  }

  /**
   * Re-renders platform as stop
   * @returns {any}
   */
  private rerenderPlatformAsStop(): any {
    this.mapSrv.map.removeLayer(this.getLayerFromMap(this.wayErrorObject.stop.id));
    this.storageSrv.elementsRendered.delete('node/' + this.wayErrorObject.stop.id);
    let obj: any = {};
    let elements = [];
    elements.push(this.storageSrv.elementsMap.get(this.wayErrorObject.stop.id));
    obj.elements    = elements;
    let transformed = this.osmtogeojson(obj);
    this.mapSrv.renderTransformedGeojsonData(transformed, this.mapSrv.map);
  }

  /**
   * Closes the currently opened modal
   * @returns {void}
   */
  public close(): void {
    this.bsModalRef.hide();
  }

  /**
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

  private createChangeForWayError(): void {
    let change: any;
    change = {
      from: {
        key  : 'public_transport',
        value: this.wayErrorObject.stop.tags['public_transport'],
      },
      to  : {
        key  : 'public_transport',
        value: 'stop_position',
      },
    };

    this.editSrv.addChange(this.wayErrorObject.stop, 'change tag', change);
  }

  private createChangeForPTvError(): void {
    let change: object;
    this.storageSrv.currentElement.tags['public_transport'] = 'platform';
    change                                      = {
      key  : 'public_transport',
      value: 'platform',
    };
    this.editSrv.addChange(this.storageSrv.currentElement, 'add tag', change);
  }

  /**
   * Adds suggested ref value to ref list
   * @param rel
   * @returns {void}
   */
  public addMissingSuggestedRefValue(rel: IPtRelation): void {
    this.addedMissingSuggestionsRefs.push(rel);
    this.missingRefRels.forEach((item, ind) => {
      if (item.id === rel.id) {
        this.removedMissingSuggestions = this.removedMissingSuggestions.concat(this.missingRefRels.splice(ind, 1));
      }
    });
  }

  /**
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

  /**
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
        this.missingRefRels.push(key);
        break;
      }
    }
  }

  /**
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

  /**
   * Remove the added ref value (newly added by user)
   * @param ref
   */
  private removeNewRefValue(ref: any): void {
    let index = this.newAddedRefs.indexOf(ref);
    if (index > -1) {
      this.newAddedRefs.splice(index, 1);
    }
  }

  /**
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

  /**
   *  Handles adding missing refs
   * @param {string} ref
   */
  private createChangeForRefTag(ref: string): void {
    let change: any;
    if (ref !== '') {
      change = {
        from: {
          key: 'route_ref',
          value: this.refErrorObject.stop.tags['route_ref'],
        },
        to: {
          key: 'route_ref',
          value: ref,
        },
      };

      this.editSrv.addChange(this.refErrorObject.stop, 'change tag', change);
    }
  }

  /**
   * adds given node as child member of routes
   * @param addedFromNearbySuggestionsRefs
   * @returns {void}
   */
  private addToMembers(addedFromNearbySuggestionsRefs: any): void {

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
        switch (this.refErrorObject.stop.tags.public_transport) {
          case 'platform':
          case 'station':
            probableRole = 'platform';
            break;
          case 'stop_position':
            probableRole = 'stop';
            break;
          default:
            alert('FIXME: suspicious role - ' + this.refErrorObject.stop.tags.public_transport);
            probableRole = 'stop';
        }
        const memberToToggle = {
          type: 'node',
          ref: this.refErrorObject.stop.id,
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
    if (this.missingRefRels.length === 0) {
      val = 'true';
      popupContent.innerHTML = '<i class="fa fa-check" aria-hidden="true"></i>';
    } else if (this.addedMissingSuggestionsRefs.length !== 0) {
      val = 'partial';
      popupContent.innerHTML = '<i class="fa fa-question" aria-hidden="true"></i>';
    } else {
      val = 'false';
      popupContent.innerHTML = '<i class="fa fa-exclamation-triangle" aria-hidden="true"></i>';
    }
    this.refErrorObject.corrected = val;
    this.storageSrv.refErrorsObj[this.storageSrv.currentIndex].corrected = val;
    let popupArr: any      = this.mapSrv.popUpLayerGroup.getLayers();
    popupArr[0].setContent(popupContent);
  }

  /**
   * Determines if new refs were added
   * @returns {boolean}
   */
  viewAddedRefs(): boolean {
    return this.newAddedRefs.length !== 0 ||
      this.addedMissingSuggestionsRefs.length !== 0 ||
      this.addedFromNearbySuggestionsRefs.length !== 0;
  }

  /**
   * Returns tool tip text
   * @param {string} name
   * @returns {string}
   */
  getTooltipText(name: string): string {
    switch (name) {
      case  'nearby rels':
        return 'List of nearby routes (within 1/2 km) which ' +
          'do not have the given stop/platform as a member.' +
          'Select from the list to add the node as a member.' +
          'Please note that route_ref of the node tag will also be updated accordingly.';
      case 'added refs':
        return 'Added References';
      case 'add new ref':
        return 'Enter new reference';
      case 'missing refs':
        return 'List of routes which have the stop/platform as a member but reference is not added in route_ref tag of the stop/platform.' +
          'Select from the list to add to the route_ref tag';
    }
  }

  /**
   * Get layer from map from given stop ID
   * @param {number} stopID
   * @returns {any}
   */
  private getLayerFromMap(stopID: number): any {
    let matchedLayer = null;
    this.mapSrv.map.eachLayer((layer) => {
      if (layer['_latlng']  && layer['feature']) {
        if (this.mapSrv.getFeatureIdFromMarker(layer['feature']) === stopID) {
          matchedLayer = layer;
        }
      }
    });
    return matchedLayer;
  }
}
