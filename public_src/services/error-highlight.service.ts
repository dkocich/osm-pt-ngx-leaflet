import { Injectable } from '@angular/core';
import * as L from 'leaflet';
import { MapService } from './map.service';
import { AppActions } from '../store/app/actions';
@Injectable()
export class ErrorHighlightService {

  private popUpArr = [];
  private popUpLayerGroup: any;
  private currentPopUpFeatureId: any;
  constructor(public mapSrv: MapService, public appActions: AppActions) {}

  public missingTagError(tag: string): any {
    this.mapSrv.map.eachLayer((layer) => {
      if (layer['_latlng'] && layer['feature']) {
        layer.off('click');
      }
    });
    this.mapSrv.map.eachLayer((layer) => {
    if (layer['_latlng'] && layer['feature'] && !(layer['feature'].properties[tag]) && !(this.checkIfAreadyAdded(layer))) {
          let popupc = L.DomUtil.create('div', 'content');
          popupc.innerHTML = 'missing ' + tag;
          let popup = L.popup({ autoClose: false, closeOnClick: false, closeButton: false, autoPan: false })
            .setLatLng(layer['_latlng'])
            .setContent(popupc).openOn(this.mapSrv.map);
          this.popUpArr.push(popup);
          let grandp = popupc['parentElement'];
          L.DomEvent.addListener(grandp.parentElement, 'click', () => {
            this.mapSrv.handlePopUpClick(layer['feature']);
            this.appActions.actSetBeginnerView('tag');
            this.currentPopUpFeatureId = popup['_leaflet_id']; });
          L.DomEvent.addListener(grandp.parentElement, 'mouseover', () => {
          // console.log('xxxxx');
          });
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
  public removeaPopUp(): any {
    this.popUpLayerGroup.removeLayer(this.currentPopUpFeatureId);
  }
}
