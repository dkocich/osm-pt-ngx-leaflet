import { Component } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap';
import { EditService } from '../../services/edit.service';
import { StorageService } from '../../services/storage.service';
import { MapService } from '../../services/map.service';
import { WarnService } from '../../services/warn.service';

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
              private warnSrv: WarnService) {}

  /***
   * Handles adding missing name
   * @param {string} name
   */
  private createChange(name: string): void {
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
   * Executed on click of save button
   * @param {string} name
   * @returns {void}
   */
  private save(name: string): void {
    this.createChange(name);
    this.bsModalRef.hide();
    let popUpElement = this.mapSrv.getPopUpFromArray(this.mapSrv.currentPopUpFeatureId);
    MapService.addHoverListenersToPopUp(popUpElement);
    this.mapSrv.popUpArr = this.mapSrv.popUpArr.filter((popup) => popup['_leaflet_id'] !== this.mapSrv.currentPopUpFeatureId);
    this.mapSrv.popUpLayerGroup.removeLayer(this.mapSrv.currentPopUpFeatureId);
    this.warnSrv.showGenericSuccess();
  }

  /***
   * Closes the currently opened modal
   * @returns {void}
   */
  private close(): void {
    this.bsModalRef.hide();
  }

}
