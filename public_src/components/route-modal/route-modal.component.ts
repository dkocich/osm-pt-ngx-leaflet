import { AfterContentInit, AfterViewInit, Component, OnInit, ViewChildren} from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap';
import { EditService } from '../../services/edit.service';
import { StorageService } from '../../services/storage.service';
import { MapService } from '../../services/map.service';
import { WarnService } from '../../services/warn.service';
import * as L from 'leaflet';
import { OverpassService } from '../../services/overpass.service';
import {AutoTasksService} from '../../services/auto-tasks.service';

@Component({
  selector: 'route-modal',
  styleUrls: [
    './route-modal.component.less',
    '../../styles/main.less',
  ],
  templateUrl: './route-modal.component.html',
})

export class RouteModalComponent {

  public map ;
  public routesMap;
  public routesarr;
  constructor(public bsModalRef: BsModalRef,
              // private editSrv: EditService,
              private storageSrv: StorageService,
              private mapSrv: MapService,
              private warnSrv: WarnService,
              private overpassSrv: OverpassService,
              private autoTaskSrv: AutoTasksService) {

    this.autoTaskSrv.routesRec.subscribe((routes) => {
      this.routesMap =  routes;
      Array.from(this.routesMap).map(([key, value]) => { this.routesarr.concat(value); });
    });
  }


  public ngOnInit(): void {
    // let x = this.mapSrv.map.getContainer();
    // document.getElementById('map2').appendChild(x);
    this.map = L.map('map2', {
      center: this.mapSrv.map.getCenter(),
      layers: [this.autoTaskSrv.baseMaps.CartoDB_light],
      maxZoom: 22,
      minZoom: 4,
      zoom: 14,
      zoomAnimation: false,
      zoomControl: false,
    });

    L.control.zoom({ position: 'topright' }).addTo(this.map);
    L.control.layers(this.autoTaskSrv.baseMaps).addTo(this.map);
    L.control.scale().addTo(this.map);
    //
    // L.control.zoom({ position: 'topright' }).addTo(map);
    // L.control.layers(this.mapSrv.baseMaps).addTo(map);
    // L.control.scale().addTo(map);

    // let map = L.map('map2').setView([51.505, -0.09], 13);
    // // this.mapSrv.map.eachLayer((layer) => {
    // //   layer.addTo(map);
    // // });
    //
    // L.tileLayer(
    //   'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    //   {
    //     attribution: `&copy; <a href='https://www.openstreetmap.org/copyright'
    //         target='_blank' rel='noopener'>
    //         OpenStreetMap</a>, Tiles courtesy of <a href='https://openstreetmap.org/'
    //         target='_blank' rel='noopener'>OpenStreetMap Team</a>`,
    //     maxNativeZoom: 19,
    //     maxZoom: 22,
    //   }).addTo(this.map);
    // this.map.invalidateSize();
    // L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    //   attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    //   maxZoom: 18,
    //   id: 'mapbox.streets',
    //   accessToken: 'your.mapbox.access.token'
    // }).addTo(map);

    this.autoTaskSrv.map = this.map;
  }

  private close(): any {
  // this.bsModalRef.hide();
  // let x = this.mapSrv.map.getContainer();
  // document.getElementById('map-c').appendChild(x);





  }

  private findMissingRoutes(): any {
    // this.map.invalidateSize();
    if (this.mapSrv.map.getZoom() > 8) {
      this.overpassSrv.requestNewOverpassData2();
    } else {
      alert('Not sufficient zoom level');
    }
  }

  // public ngAfterViewInit(): void{
  //   this.map.invalidateSize();
  // }
  //
  // public ngAfterContentInit(): void {
  //   this.map.invalidateSize();
  // }
  //
  // public invalidate(): void {
  //    console.log('on sh');
  //   this.map.invalidateSize();
  // }
}

