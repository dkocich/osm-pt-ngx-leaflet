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
  @ViewChildren('v') newlyAddedValue ;
  public errorObject: any;

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
   * Executed on click of save button for adding new name tag
   * @param {string} name
   * @returns {void}
   */
  private saveNameTag(name: string): void {
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
  private close(): void {
    this.bsModalRef.hide();
  }
}
