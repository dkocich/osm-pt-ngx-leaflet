import { Component, ViewChildren } from '@angular/core';
import * as L from 'leaflet';
import { BsModalRef } from 'ngx-bootstrap';
import {
  INameErrorObject,
  IPTPairErrorObject,
  IPTvErrorObject,
  IRefErrorObject,
  IWayErrorObject,
} from '../../core/errorObject.interface';
import { IPtRelation } from '../../core/ptRelation.interface';
import { IPtStop } from '../../core/ptStop.interface';
import { PtTags } from '../../core/ptTags.class';
import { EditService } from '../../services/edit.service';
import { MapService } from '../../services/map.service';
import { StorageService } from '../../services/storage.service';
import { WarnService } from '../../services/warn.service';

@Component({
  selector: 'modal-content',
  styleUrls: ['./modal.component.less', '../../styles/main.less'],
  templateUrl: './modal.component.html',
})
export class ModalComponent {
  tagKey;
  suggestedNames: string[];
  error: string;

  @ViewChildren('chosenRef') chosenRefS;
  @ViewChildren('newlyAddedValue') newlyAddedValue;

  nameErrorObject: INameErrorObject;
  refErrorObject: IRefErrorObject;
  wayErrorObject: IWayErrorObject;
  PTvErrorObject: IPTvErrorObject;
  ptPairErrorObject: IPTPairErrorObject;

  removedNearbySuggestions = [];
  removedMissingSuggestions = [];

  addedMissingSuggestionsRefs = [];
  addedFromNearbySuggestionsRefs = [];
  newAddedRefs = [];

  missingRefRels;
  nearbyRels;

  platformTags = PtTags.expectedKeys;
  addedPlatformTagsValues = [];
  newAddedTagsForPlatform = new Map();
  newPlatformEvent;
  circleLayer = null;

  osmtogeojson = require('osmtogeojson');

  constructor(
    public bsModalRef: BsModalRef,
    private editSrv: EditService,
    private storageSrv: StorageService,
    private mapSrv: MapService,
    private warnSrv: WarnService
  ) {}

  /**
   * Executed on click of save button for adding new name tag
   */

  saveNameTag(name: string): void {
    if (name.length !== 0) {
      this.createChangeForNameTag(name);
      this.bsModalRef.hide();
      const popUpElement = this.mapSrv.getPopUpFromArray(
        this.mapSrv.currentPopUpFeatureId
      );
      MapService.addHoverListenersToPopUp(popUpElement);
      this.mapSrv.popUpArr = this.mapSrv.popUpArr.filter(
        (popup) => popup['_leaflet_id'] !== this.mapSrv.currentPopUpFeatureId
      );
      const popupContent = L.DomUtil.create('div', 'content');
      popupContent.innerHTML = '<i class="fa fa-check" aria-hidden="true"></i>';
      const popupArr = this.mapSrv.popUpLayerGroup.getLayers();
      popupArr[0].setContent(popupContent);
      this.nameErrorObject.corrected = 'true';
      this.storageSrv.nameErrorsObj[this.storageSrv.currentIndex].corrected =
        'true';
      this.storageSrv.refreshErrorObjects.emit({
        typeOfErrorObject: 'missing name tags',
      });
      this.warnSrv.showGenericSuccess();
    } else {
      alert('Entered name cannot be empty');
    }
  }

  /**
   * Saves ref correction
   */
  saveRefTag(): void {
    let refsForTag = [];
    let refString = '';

    for (const rel of this.addedMissingSuggestionsRefs) {
      refsForTag.push(rel.tags.ref);
    }
    for (const rel of this.addedFromNearbySuggestionsRefs) {
      refsForTag.push(rel.tags.ref);
    }
    refsForTag = refsForTag.concat(this.newAddedRefs);
    refsForTag = refsForTag.filter((v, i, a) => {
      return a.indexOf(v) === i;
    });
    refsForTag.sort();
    if (refsForTag.length !== 0) {
      refsForTag.forEach((item, index) => {
        refString =
          index !== refsForTag.length - 1
            ? refString + item + ';'
            : refString + item;
      });

      if (this.refErrorObject.stop.tags.route_ref) {
        refString = this.refErrorObject.stop.tags.route_ref + ';' + refString;
      }

      this.createChangeForRefTag(refString);
      this.addToMembers(this.addedFromNearbySuggestionsRefs);
      this.bsModalRef.hide();
      const popUpElement = this.mapSrv.getPopUpFromArray(
        this.mapSrv.currentPopUpFeatureId
      );
      MapService.addHoverListenersToPopUp(popUpElement);
      this.mapSrv.popUpArr = this.mapSrv.popUpArr.filter((popup) => {
        return popup['_leaflet_id'] !== this.mapSrv.currentPopUpFeatureId;
      });
      this.checkErrorIfCorrected();
      this.refErrorObject.missingConnectedRefs = this.missingRefRels.length;
      this.storageSrv.refreshErrorObjects.emit({
        typeOfErrorObject: 'missing refs',
      });
      this.warnSrv.showGenericSuccess();
    } else {
      alert('Nothing to save');
    }
  }

  saveWayError(): void {
    this.createChangeForWayError();
    const popUpElement = this.mapSrv.getPopUpFromArray(
      this.mapSrv.currentPopUpFeatureId
    );
    MapService.addHoverListenersToPopUp(popUpElement);
    this.mapSrv.popUpArr = this.mapSrv.popUpArr.filter(
      (popup) => popup['_leaflet_id'] !== this.mapSrv.currentPopUpFeatureId
    );
    const popupContent = L.DomUtil.create('div', 'content');
    popupContent.innerHTML = '<i class="fa fa-check" aria-hidden="true"></i>';
    const popupArr = this.mapSrv.popUpLayerGroup.getLayers();
    popupArr[0].setContent(popupContent);
    this.wayErrorObject.corrected = 'true';
    this.storageSrv.wayErrorsObj[this.storageSrv.currentIndex].corrected =
      'true';
    this.storageSrv.refreshErrorObjects.emit({
      typeOfErrorObject: 'way as parent',
    });
    this.rerenderPlatformAsStop();
    this.warnSrv.showGenericSuccess();
    this.bsModalRef.hide();
  }

  savePTvError(): void {
    this.createChangeForPTvError();
    const popUpElement = this.mapSrv.getPopUpFromArray(
      this.mapSrv.currentPopUpFeatureId
    );
    MapService.addHoverListenersToPopUp(popUpElement);
    this.mapSrv.popUpArr = this.mapSrv.popUpArr.filter(
      (popup) => popup['_leaflet_id'] !== this.mapSrv.currentPopUpFeatureId
    );
    const popupContent = L.DomUtil.create('div', 'content');
    popupContent.innerHTML = '<i class="fa fa-check" aria-hidden="true"></i>';
    const popupArr = this.mapSrv.popUpLayerGroup.getLayers();
    popupArr[0].setContent(popupContent);
    this.PTvErrorObject.corrected = 'true';
    this.storageSrv.PTvErrorsObj[this.storageSrv.currentIndex].corrected =
      'true';
    this.storageSrv.refreshErrorObjects.emit({
      typeOfErrorObject: 'PTv correction',
    });
    this.warnSrv.showGenericSuccess();
    this.bsModalRef.hide();
  }

  /**
   * Re-renders platform as stop
   */
  private rerenderPlatformAsStop(): void {
    this.mapSrv.map.removeLayer(
      this.getLayerFromMap(this.wayErrorObject.stop.id)
    );
    this.storageSrv.elementsRendered.delete(
      'node/' + this.wayErrorObject.stop.id
    );
    const obj = {};
    const elements = [];
    elements.push(this.storageSrv.elementsMap.get(this.wayErrorObject.stop.id));
    obj.elements = elements;
    const transformed = this.osmtogeojson(obj);
    this.mapSrv.renderTransformedGeojsonData(transformed, this.mapSrv.map);
  }

  /**
   * Closes the currently opened modal
   */
  close(): void {
    this.bsModalRef.hide();
  }

  /**
   * Handles adding missing name
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
    const change = {
      from: {
        key: 'public_transport',
        value: this.wayErrorObject.stop.tags['public_transport'],
      },
      to: {
        key: 'public_transport',
        value: 'stop_position',
      },
    };

    this.editSrv.addChange(this.wayErrorObject.stop, 'change tag', change);
  }

  private createChangeForPTvError(): void {
    this.storageSrv.currentElement.tags['public_transport'] = 'platform';
    const change = {
      key: 'public_transport',
      value: 'platform',
    };
    this.editSrv.addChange(this.storageSrv.currentElement, 'add tag', change);
  }

  /**
   * Adds suggested ref value to ref list
   */
  addMissingSuggestedRefValue(rel: IPtRelation): void {
    this.addedMissingSuggestionsRefs.push(rel);
    this.missingRefRels.forEach((item, ind) => {
      if (item.id === rel.id) {
        this.removedMissingSuggestions = this.removedMissingSuggestions.concat(
          this.missingRefRels.splice(ind, 1)
        );
      }
    });
  }

  /**
   * adds selected nearby suggestion
   */
  addNearbySuggestedRefValue(rel): void {
    this.addedFromNearbySuggestionsRefs.push(rel);
    this.nearbyRels.forEach((item, ind) => {
      if (item.id === rel.id) {
        this.removedNearbySuggestions = this.removedNearbySuggestions.concat(
          this.nearbyRels.splice(ind, 1)
        );
      }
    });
  }

  /**
   * Remove the added ref value (added from suggestions (missing) by user)
   */
  removeMissingSuggestedRefValue(toRemoveRel): void {
    let index;
    for (const rel of this.addedMissingSuggestionsRefs) {
      if (rel.id === toRemoveRel.id) {
        index = this.addedMissingSuggestionsRefs.indexOf(rel);
      }
    }

    if (index > -1) {
      this.addedMissingSuggestionsRefs.splice(index, 1);
    }

    for (const key of this.removedMissingSuggestions) {
      if (key.id === toRemoveRel.id) {
        this.missingRefRels.push(key);
        break;
      }
    }
  }

  /**
   * Remove the added ref value (added from suggestions (nearby) by user)
   */
  removeNearbySuggestedRefValue(toRemoveRel): void {
    let index;
    for (const rel of this.addedFromNearbySuggestionsRefs) {
      if (rel.id === toRemoveRel.id) {
        index = this.addedFromNearbySuggestionsRefs.indexOf(rel);
      }
    }

    if (index > -1) {
      this.addedFromNearbySuggestionsRefs.splice(index, 1);
    }

    for (const key of this.removedNearbySuggestions) {
      if (key.id === toRemoveRel.id) {
        this.nearbyRels.push(key);
        break;
      }
    }
  }

  /**
   * Remove the added ref value (newly added by user)
   */
  removeNewRefValue(ref): void {
    const index = this.newAddedRefs.indexOf(ref);
    if (index > -1) {
      this.newAddedRefs.splice(index, 1);
    }
  }

  /**
   * Adds new ref value
   */
  addNewRefValue(ref: string): void {
    if (ref !== '') {
      this.newAddedRefs.push(ref);
    } else {
      alert('Please enter a numeric value');
    }
    this.newlyAddedValue.first.nativeElement.value = '';
  }

  /**
   *  Handles adding missing refs
   */
  private createChangeForRefTag(ref: string): void {
    let change;
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
   */
  private addToMembers(addedFromNearbySuggestionsRefs): void {
    if (addedFromNearbySuggestionsRefs.length !== 0) {
      for (const relation of addedFromNearbySuggestionsRefs) {
        const rel = JSON.parse(
          JSON.stringify(this.storageSrv.elementsMap.get(relation.id))
        );

        if (!rel || rel.type !== 'relation') {
          return alert(
            'Relation was not found ' +
              JSON.stringify(this.storageSrv.currentElement)
          );
        }

        const change = { from: JSON.parse(JSON.stringify(rel)), to: undefined }; // string to not influence toggle edits
        let probableRole = '';
        switch (this.refErrorObject.stop.tags.public_transport) {
          case 'platform':
          case 'station':
            probableRole = 'platform';
            break;
          case 'stop_position':
            probableRole = 'stop';
            break;
          default:
            alert(
              'FIXME: suspicious role - ' +
                this.refErrorObject.stop.tags.public_transport
            );
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
    const popupContent = L.DomUtil.create('div', 'content');
    if (this.missingRefRels.length === 0) {
      val = 'true';
      popupContent.innerHTML = '<i class="fa fa-check" aria-hidden="true"></i>';
    } else if (this.addedMissingSuggestionsRefs.length !== 0) {
      val = 'partial';
      popupContent.innerHTML =
        '<i class="fa fa-question" aria-hidden="true"></i>';
    } else {
      val = 'false';
      popupContent.innerHTML =
        '<i class="fa fa-exclamation-triangle" aria-hidden="true"></i>';
    }
    this.refErrorObject.corrected = val;
    this.storageSrv.refErrorsObj[this.storageSrv.currentIndex].corrected = val;
    const popupArr = this.mapSrv.popUpLayerGroup.getLayers();
    popupArr[0].setContent(popupContent);
  }

  /**
   * Determines if new refs were added
   */
  viewAddedRefs(): boolean {
    return (
      this.newAddedRefs.length !== 0 ||
      this.addedMissingSuggestionsRefs.length !== 0 ||
      this.addedFromNearbySuggestionsRefs.length !== 0
    );
  }

  /**
   * Returns tool tip text
   */
  getTooltipText(name: string): string {
    switch (name) {
      case 'nearby rels':
        return (
          'List of nearby routes (within 1/2 km) which ' +
          'do not have the given stop/platform as a member.' +
          'Select from the list to add the node as a member.' +
          'Please note that route_ref of the node tag will also be updated accordingly.'
        );
      case 'added refs':
        return 'Added References';
      case 'add new ref':
        return 'Enter new reference';
      case 'missing refs':
        return (
          'List of routes which have the stop/platform as a member but reference is not added in route_ref tag of the stop/platform.' +
          'Select from the list to add to the route_ref tag'
        );
    }
  }

  /**
   * Get layer from map from given stop ID
   */
  private getLayerFromMap(stopID: number) {
    let matchedLayer = null;
    this.mapSrv.map.eachLayer((layer) => {
      if (layer['_latlng'] && layer['feature']) {
        if (this.mapSrv.getFeatureIdFromMarker(layer['feature']) === stopID) {
          matchedLayer = layer;
        }
      }
    });
    return matchedLayer;
  }

  addTagToPlatform(key: string, value: string): void {
    this.newAddedTagsForPlatform.set(key, value);
  }

  savePTPairError(): void {
    const tags = {};
    this.newAddedTagsForPlatform.forEach((tagValue, tagKey) => {
      tags['tagKey'] = tagValue;
    });
    this.addedPlatformTagsValues.forEach((val, i) => {
      tags[this.platformTags[i]] = val;
    });
    const newId: number = this.editSrv.findNewId();
    const marker = this.editSrv.initializeNewMarker(
      'platform',
      this.newPlatformEvent,
      newId
    );
    this.editSrv.createNewMarkerEvents(marker);
    this.storageSrv.markersMap.set(newId, marker);
    marker.addTo(this.mapSrv.map);
    const latlng = marker.getLatLng();
    const newElement: IPtStop = {
      changeset: -999,
      id: newId,
      lat: latlng.lat,
      lon: latlng.lng,
      tags,
      timestamp: new Date().toISOString().split('.')[0] + 'Z',
      type: 'node',
      uid: Number(localStorage.getItem('id')),
      user: localStorage.getItem('display_name'),
      version: 1,
    };
    newElement.tags.public_transport = 'platform';
    const change = { from: undefined, to: newElement };
    this.editSrv.addChange(newElement, 'add element', change);
    let stopLayer = null;
    const stopId = this.ptPairErrorObject.stop.id;
    this.mapSrv.map.eachLayer((layer) => {
      if (layer['feature'] && layer['_latlng']) {
        const featureID = this.mapSrv.getFeatureIdFromMarker(layer['feature']);
        if (featureID === stopId) {
          stopLayer = layer;
        }
      }
    });
    stopLayer.closePopup();
    this.circleLayer.removeFrom(this.mapSrv.map);
    this.ptPairErrorObject.corrected = 'true';
    this.storageSrv.ptPairErrorsObject[this.storageSrv.currentIndex].corrected =
      'true';
    this.storageSrv.refreshErrorObjects.emit({ typeOfErrorObject: 'pt-pair' });
    this.warnSrv.showGenericSuccess();
    this.bsModalRef.hide();
  }
}
