import { Injectable } from '@angular/core';
import * as L from 'leaflet';
import { ConfService } from './conf.service';
import { StorageService } from './storage.service';
import { HttpClient } from '@angular/common/http';
import { MapService } from './map.service';
// import * as filter from 'leaflet.locationfilter';
// import * as  Draw from 'leaflet-draw';
// import * as shades from 'leaflet-shades';
// import * as editable from 'leaflet-editable';
// import 'leaflet-editable';

// var shades = require('leaflet-shades');
@Injectable()
export class ErrorHighlight2Service {
  constructor(
    private confSrv: ConfService,
    private httpClient: HttpClient,
    private storageSrv: StorageService,
    private mapSrv: MapService,
  ) {
    // Draw.drawLocal.draw.toolbar.buttons.polygon = 'Draw a sexy polygon!';
    // Start drawing rectangle
// Enable edit on already existing rectangle
//     const rect = L.rectangle([[54.559322, -5.767822], [56.1210604, -3.021240]]).addTo(map);
//     rect.enableEdit();
    this.mapSrv.markerClick.subscribe(
      /**
       * @param data - string containing ID of clicked marker
       */
      (data) => {
        // this.mapSrv.map.editable = true;
        // var polyline = L.polyline([[43.1, 1.2], [43.2, 1.3],[43.3, 1.2]]).addTo(this.mapSrv.map);
        // polyline.enableEdit();
        // this.mapSrv.map.editTools.startPolyline();

        // this.mapSrv.map.editTools.startPolyline();
        console.log('ooo');
        const featureId = Number(data);
        // console.log('fid '+  featureId);

        this.mapSrv.map.eachLayer((layer) => {
          if (layer instanceof L.Marker) {
            let layerm : L.Marker = layer;
            // console.log('to be compared' + layerm.feature.id);
            // console.log( typeof  layerm.feature.id);
            let featureTypeId: string[] = layerm.feature.id.toString().split('/');
            let tocfeautureid =  Number(featureTypeId[1]);
            if (tocfeautureid === featureId) {
              let isthere: boolean = this.search(layer.getLatLng(), layer.feature.properties.name);
            }
          }
        });
      });
  }
  public search(latlngm: any, name : string): boolean {
    let inRangeArray = [];
    this.mapSrv.map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        let marker: L.Marker = layer;
        marker.getLatLng();
        console.log(marker.getLatLng());
        if (marker.getLatLng().distanceTo(latlngm) < 200.4672 &&
          marker.feature.properties.public_transport === 'platform' &&
          marker.feature.properties.name  === name
        ) {
       inRangeArray.push(marker);
          // let popup = L.popup({ autoClose: false }).setContent(':P');
          // marker.bindPopup(popup).openPopup();
        }
      }
    });
    if (inRangeArray.length === 0) {
      return false;

    } else {
      return true;
    }

  }


  private jumplocations(): any {
    // this.mapSrv.
  }
}
