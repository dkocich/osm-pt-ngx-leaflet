import { EventEmitter, Injectable } from '@angular/core';
import { IPtStop } from '../core/ptStop.interface';
import { MapService } from './map.service';
import * as L from 'leaflet';
import {NgRedux} from '@angular-redux/store';
import {IAppState} from '../store/model';
import {AppActions} from '../store/app/actions';
import {ErrorHighlightService} from './error-highlight.service';
// import { LatLngExpression} from 'leaflet';

@Injectable()
export class SwitchLocationService {
  constructor(private mapSrv: MapService,    private ngRedux: NgRedux<IAppState>, private appActions: AppActions) {}
  // public arr: L.LatLngExpression[] = [
  //   L.latLng(28.632986, 77.219374),
  //   L.latLng(28.634097, 77.221573),
  //   L.latLng(28.634216, 77.212558),
  // ];
  public arr: L.LatLngExpression[] = [];
  public currentLoc: L.LatLngExpression;
  public currentIndex = 0;
  public modeon: boolean = false;

  isMobileDevice(): any {
    return (typeof window.orientation !== 'undefined') || (navigator.userAgent.indexOf('IEMobile') !== -1);
  }

  switchlocationModeOn(bool: boolean, arr?: L.LatLngExpression[]): any {
    if (this.ngRedux.getState().switchMode) {
      console.log('yes');
      document.getElementById('map').style.width = '65%' ;
      document.getElementById('sidebar').style.width = '35%' ;

      this.appActions.actToggleSwitchMode(bool);
    }
    else {
      console.log('not');
      document.getElementById('map').style.width = '100%' ;
      document.getElementById('sidebar').style.width = '0%' ;

      this.arr = arr;
      this.appActions.actToggleSwitchMode(bool);
    }
    this.mapSrv.map.invalidateSize();
  }
  nextLocation(): any {
    console.log('arr', this.arr);
    if (this.currentIndex === (this.arr.length - 1))  {
      this.currentIndex = 0;
      // this.mapSrv.map.panTo(this.arr[this.currentIndex]);
      // this.mapSrv.map.fitBounds([this.arr[this.currentIndex]]);
      L.marker(this.arr[this.currentIndex]).addTo(this.mapSrv.map).bindPopup(this.currentIndex.toString()).openPopup();
     // this.errorHighlightSrv.addPopUps([]);
    }
    else {
      // this.mapSrv.map.panTo(this.arr[this.currentIndex + 1]);
      let pop = this.currentIndex + 1 ;
      L.marker(this.arr[this.currentIndex + 1]).addTo(this.mapSrv.map).bindPopup(pop.toString()).openPopup();
      this.currentIndex++;
    }


  }
  previousLocation(): any {
    if (this.currentIndex === 0) {
      this.currentIndex = this.arr.length - 1;
      this.mapSrv.map.panTo(this.arr[this.currentIndex]);
      L.marker(this.arr[this.currentIndex]).addTo(this.mapSrv.map).bindPopup(this.currentIndex.toString()).openPopup();
    } else {
      this.mapSrv.map.panTo(this.arr[this.currentIndex - 1]);
      let pop =  this.currentIndex - 1;
      L.marker(this.arr[this.currentIndex - 1 ]).addTo(this.mapSrv.map).bindPopup(pop.toString()).openPopup();
      this.currentIndex --;
    }
  }
}
