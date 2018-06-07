import { Injectable } from '@angular/core';
import * as L from 'leaflet';

import { MapService } from './map.service';
import { ProcessService } from './process.service';
import { StorageService } from './storage.service';

import { AppActions } from '../store/app/actions';
import { IAppState } from '../store/model';

import { NgRedux } from '@angular-redux/store';

import { BsModalService, BsModalRef } from 'ngx-bootstrap';

import { ModalComponent } from '../components/modal/modal.component';

@Injectable()
export class ErrorHighlightService {
  modalRef: BsModalRef;
  constructor(public mapSrv: MapService,
              public appActions: AppActions,
              public storageSrv: StorageService,
              private ngRedux: NgRedux<IAppState>,
              private modalService: BsModalService,
              private processSrv: ProcessService,
              ) {}

  /***
   * Adds new layer of popups for missing tag
   * @param {string} tag
   * @returns {void}
   */
  public missingTagError(tag: string): void {

    this.mapSrv.map.eachLayer((layer) => {
      if (layer['_latlng'] && layer['feature']) {
        layer.off('click');
      }
    });

    for (let stop of this.storageSrv.listOfStops) {
      let latLongObj = { lat: stop.lat, lng: stop.lon };

      if (!(this.storageSrv.elementsMap.get(stop.id).tags[tag]) &&
          !this.mapSrv.checkIfAlreadyAdded(latLongObj)) {

        let popupContent = ErrorHighlightService.makePopUpContent();
        let popup = L.popup({
          autoClose: false,
          closeOnClick: false,
          closeButton: false,
          autoPan: false,
          minWidth: 4,
        }).setLatLng(latLongObj)
          .setContent(popupContent)
          .openOn(this.mapSrv.map);

        this.mapSrv.popUpArr.push(popup);
        this.addClickListenerToPopUp(popup.getElement(), stop.id, popup['_leaflet_id']);
        MapService.addHoverListenersToPopUp(popup.getElement());
      }
    }
    this.mapSrv.popUpLayerGroup = L.layerGroup(this.mapSrv.popUpArr).addTo(this.mapSrv.map);
  }

  /***
   * Generates the popup content
   * @returns {object}
   */

  private static makePopUpContent(): HTMLElement {
    let popupContent = L.DomUtil.create('div', 'content');
    popupContent.innerHTML = '<i class="fa fa-exclamation-triangle" aria-hidden="true">';
    return popupContent;
  }

  /***
   * Handles click of popup
   * @param popUpElement
   * @param markerFeatureid
   * @param popUpId
   * @returns {void}
   */

  private addClickListenerToPopUp(popUpElement: HTMLElement, markerFeatureid: number, popUpId: number): void {

    L.DomEvent.addListener(popUpElement, 'click', (e) => {
      this.openModalWithComponent();

      const featureId = Number(markerFeatureid);
      const element = this.processSrv.getElementById(featureId);
      if (element) {
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
  private openModalWithComponent(): void {
    this.modalRef = this.modalService.show(ModalComponent);
  }
}
