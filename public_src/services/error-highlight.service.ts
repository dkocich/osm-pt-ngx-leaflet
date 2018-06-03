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
        }).setLatLng(latlongObj)
          .setContent(popupContent).openOn(this.mapSrv.map);
        this.popUpArr.push(popup);
        this.addClickListenersToPopUp(popup.getElement(), stop.id, popup['_leaflet_id']);
        this.addHoverListenersToPopUp(popup.getElement());
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
    let popUpElement = this.getPopUpFromArray(this.currentPopUpFeatureId);
    L.DomEvent.addListener(popUpElement, 'mouseover', this.colorPopUpByEvent);
    L.DomEvent.addListener(popUpElement, 'mouseout', this.colorPopUpByEvent);
    this.popUpArr = this.popUpArr.filter((popup) => popup['_leaflet_id'] !== this.currentPopUpFeatureId);
    this.popUpLayerGroup.removeLayer(this.currentPopUpFeatureId);
  }

  private makePopUpContent(): any {
    let popupContent = L.DomUtil.create('div', 'content');
    popupContent.innerHTML = '<i class="fa fa-exclamation-triangle" aria-hidden="true"> ';
    return popupContent;
  }

  private addClickListenersToPopUp(popUpElement: any, markerFeatureid: any, popUpId: any): any {
    L.DomEvent.addListener(popUpElement, 'click', (e) => {
      this.mapSrv.handlePopUpClick(markerFeatureid);
      this.appActions.actSetBeginnerView('tag');
      if (this.currentPopUpFeatureId && this.currentPopUpFeatureId !== popUpId) {
        let previousPopUpElement = this.getPopUpFromArray(this.currentPopUpFeatureId);
        this.colorPopUpByColorName('white', previousPopUpElement);
        this.addHoverListenersToPopUp(previousPopUpElement);
      }
      this.currentPopUpFeatureId = popUpId;
      this.removeHoverListenersToPopUp(popUpElement);
      this.colorPopUpByEvent(e);
    });
  }
  private addHoverListenersToPopUp(popUpElement: any): any{
    L.DomEvent.addListener(popUpElement, 'mouseout', this.colorPopUpByEvent);
    L.DomEvent.addListener(popUpElement, 'mouseover', this.colorPopUpByEvent);
  }
  private removeHoverListenersToPopUp(popUpElement: any): any{
    L.DomEvent.removeListener(popUpElement, 'mouseout', this.colorPopUpByEvent);
    L.DomEvent.removeListener(popUpElement, 'mouseover', this.colorPopUpByEvent);
  }
  private colorPopUpByEvent (e: any): any{
    let colorString = '';
    if (e.type === 'click' || e.type === 'mouseover') {
      colorString = 'lightblue';
    }
    if (e.type === 'mouseout') {
      colorString = 'white';
    }
    if (e.target.className === 'leaflet-popup-content-wrapper') {
      e.target.style.backgroundColor = colorString;
      e.target.parentElement.lastElementChild.lastElementChild.style.backgroundColor = colorString;
    }
  }
  private colorPopUpByColorName(colorName: string, element: any): any {
    element.children[0].style.backgroundColor = colorName;
    element.lastElementChild.lastElementChild.style.backgroundColor = colorName;
  }
  private getPopUpFromArray(popUpId: any): any {
    for (let popUp of this.popUpArr) {
      if (popUp['_leaflet_id'] === popUpId) {
        return popUp.getElement();
      }
    }
  }
}
