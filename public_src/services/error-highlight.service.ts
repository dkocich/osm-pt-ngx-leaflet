import { Injectable } from '@angular/core';
import * as L from 'leaflet';
import { MapService } from './map.service';
import { AppActions } from '../store/app/actions';
import {StorageService} from './storage.service';
import {ProcessService} from './process.service';
@Injectable()
export class ErrorHighlightService {

  private popUpArr = [];
  private popUpLayerGroup: any;
  private currentPopUpFeatureId: any;
  constructor(public mapSrv: MapService, public appActions: AppActions, private storageSrv: StorageService,
              private processSrv: ProcessService ) {}

  public missingTagError(tag: string): any {
    this.mapSrv.map.eachLayer((layer) => {
      if (layer['_latlng'] && layer['feature']) {
        layer.off('click');
      }
    });
    this.mapSrv.map.eachLayer((layer) => {
    if (layer['_latlng'] && layer['feature'] && !(layer['feature'].properties[tag]) && !(this.checkIfAreadyAdded(layer))) {
          let popupContent = this.makePopUpContent();
          let popup = L.popup({ autoClose: false, closeOnClick: false, closeButton: false,
                                       autoPan: false, minWidth: 4, className: 'myPopUp' })
            .setLatLng(layer['_latlng'])
            .setContent(popupContent).openOn(this.mapSrv.map);
          this.popUpArr.push(popup);
          this.addListenersToPopUp(popupContent['parentElement'], layer['feature'], popup['_leaflet_id']);
    }
});
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

  private checkIfAreadyAdded(layer: any): any {
    for (let i = 0;  i < this.popUpArr.length ; i++) {
      if (layer['_latlng'] === this.popUpArr[i].getLatLng()) {
        return true;
      }
    }
    return false;
  }
  public removeCurrentlyClickedPopUp(): any {
    this.popUpLayerGroup.removeLayer(this.currentPopUpFeatureId);
  }

  private makePopUpContent(): any{
    let popupContent = L.DomUtil.create('div', 'content');
    popupContent.innerHTML = '<i class="fa fa-exclamation-triangle" aria-hidden="true"> ';
    return popupContent;
  }
  private addListenersToPopUp(popUpElement: any, feature: any, popUpId: any): any {
    L.DomEvent.addListener(popUpElement.parentElement, 'click', () => {
      this.mapSrv.handlePopUpClick(feature);
      // this.processSrv.exploreStop(
      //   this.storageSrv.elementsMap.get(feature['_leaflet_id']),
      //   false,
      //   false,
      //   false,
      // );
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
    // L.DomEvent.addListener(popUpElement.parentElement, 'mouseout', this.colorPopUp('white', popUpElement.parentElement), this);
  }
  // private colorPopUp(colorname: string, popUp: any): any{
  //   popUp.style.backgroundColor = colorname;
  //   popUp.parentElement.childNodes[1].childNodes[0].style.backgroundColor = colorname;
  // }
}
