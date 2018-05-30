import { Injectable } from '@angular/core';
import * as L from 'leaflet';
import { MapService } from './map.service';
import { AppActions } from '../store/app/actions';
import { StorageService } from './storage.service';

@Injectable()
export class ErrorHighlightService {

  private popUpArr = [];
  private popUpLayerGroup: any;
  private currentPopUpFeatureId: any;
  constructor(public mapSrv: MapService,
              public appActions: AppActions,
              public storageSrv: StorageService) {}

  public missingTagError(tag: string): any {
    this.mapSrv.map.eachLayer((layer) => {
      if (layer['_latlng'] && layer['feature']) {
        layer.off('click');
      }
    });

    for (let stop of this.storageSrv.listOfStops) {
      let latlongObj = { lat: stop.lat, lng: stop.lon };
      if (!(this.storageSrv.elementsMap.get(stop.id).tags[tag]) && !this.checkIfAlreadyAdded(latlongObj)) {
        let popupContent = this.makePopUpContent();
        let popup = L.popup({
          autoClose: false, closeOnClick: false, closeButton: false,
          autoPan: false, minWidth: 4,
        })
          .setLatLng(latlongObj)
          .setContent(popupContent).openOn(this.mapSrv.map);
        this.popUpArr.push(popup);
        this.addListenersToPopUp(popupContent['parentElement'], stop.id, popup['_leaflet_id']);
      }}
    this.popUpLayerGroup = L.layerGroup(this.popUpArr).addTo(this.mapSrv.map);
  }

  public removePopUps(): any {
    if (this.popUpLayerGroup) {
      this.popUpLayerGroup.remove();
    }
    this.mapSrv.map.eachLayer((layer) => {
      if (layer['_latlng']  && layer['feature']) {
        this.mapSrv.enableDrag(layer['feature'], layer);
      }});
  }

  private checkIfAlreadyAdded(latlongObj: any): any {
    for (let i = 0;  i < this.popUpArr.length ; i++) {
      if (JSON.stringify(latlongObj) === JSON.stringify(this.popUpArr[i].getLatLng())) {
        return true;
      }
    }
    return false;
  }

  public removeCurrentlyClickedPopUp(): any {
    this.popUpArr = this.popUpArr.filter((popup) => popup['_leaflet_id'] !== this.currentPopUpFeatureId);
    this.popUpLayerGroup.removeLayer(this.currentPopUpFeatureId);
  }

  private makePopUpContent(): any {
    let popupContent = L.DomUtil.create('div', 'content');
    popupContent.innerHTML = '<i class="fa fa-exclamation-triangle" aria-hidden="true"> ';
    return popupContent;
  }

  private addListenersToPopUp(popUpElement: any, markerFeatureid: any, popUpId: any): any {
    L.DomEvent.addListener(popUpElement.parentElement, 'click', () => {
      this.mapSrv.handlePopUpClick(markerFeatureid);
      this.appActions.actSetBeginnerView('tag');
      this.currentPopUpFeatureId = popUpId;
    });
    L.DomEvent.addListener(popUpElement.parentElement, 'mouseover', () => {
      popUpElement.parentElement.style.backgroundColor = 'lightblue';
      popUpElement.parentElement.parentElement.childNodes[1].childNodes[0].style.backgroundColor = 'lightblue';
    });
    L.DomEvent.addListener(popUpElement.parentElement, 'mouseout', () => {
      popUpElement.parentElement.style.backgroundColor = 'white';
      popUpElement.parentElement.parentElement.childNodes[1].childNodes[0].style.backgroundColor = 'white';
    });
  }
}
