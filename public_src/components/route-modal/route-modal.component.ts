import { Component } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap';

import { StorageService } from '../../services/storage.service';
import { MapService } from '../../services/map.service';
import { WarnService } from '../../services/warn.service';
import { OverpassService } from '../../services/overpass.service';
import { AutoTasksService } from '../../services/auto-tasks.service';

import * as L from 'leaflet';


import { Subject } from 'rxjs/Rx';

@Component({
  selector: 'route-modal',
  styleUrls: [
    './route-modal.component.less',
    '../../styles/main.less',
  ],
  templateUrl: './route-modal.component.html',
})

export class RouteModalComponent {

  public map: L.Map;
  public routesMap;
  public newRoutesRefs = [];
  public osmtogeojson: any = require('osmtogeojson');
  private startEventProcessing = new Subject<L.LeafletEvent>();


  constructor(private storageSrv: StorageService,
              private mapSrv: MapService,
              private warnSrv: WarnService,
              private overpassSrv: OverpassService,
              private autoTaskSrv: AutoTasksService) {

    this.autoTaskSrv.routesRec.subscribe((routes) => {
      this.routesMap = routes;
      console.log('first',routes.keys().next().value);
      this.highlightRoute2(routes.keys().next().value);
      routes.forEach((value, key) => {
        console.log('key', key, 'value', value);
        this.newRoutesRefs.push(key);
      });
    });

    console.log('arr to display', this.newRoutesRefs);
  }


  public ngOnInit(): void {
    this.map = L.map('auto-route-modal-map', {
      center: this.mapSrv.map.getCenter(),
      layers: [this.autoTaskSrv.baseMaps.CartoDB_light],
      maxZoom: 22,
      minZoom: 4,
      zoom: 14,
      zoomAnimation: false,
      zoomControl: false,
    });

    L.control.zoom({ position: 'topright' }).addTo(this.map);
    L.control.scale().addTo(this.map);

    this.autoTaskSrv.map = this.map;
    this.autoTaskSrv.renderAlreadyDownloadedData();

    this.autoTaskSrv.map.on('zoomend moveend', (event: L.LeafletEvent) => {
      this.startEventProcessing.next(event);
    });
    this.startEventProcessing
      .debounceTime(500)
      .distinctUntilChanged()
      .subscribe((event: L.LeafletEvent) => {
        this.overpassSrv.initDownloaderForModalMap(this.autoTaskSrv.map);
      });
  }

  private close(): any {

  }

  private findMissingRoutes(): any {
    if (this.mapSrv.map.getZoom() > 8) {
      this.overpassSrv.requestNewOverpassDataForModalMap(true);
    } else {
      alert('Not sufficient zoom level');
    }
  }

  private highlightRoute(routesMap: any): any{
    console.log('this map', this.routesMap);
    routesMap.forEach((key, value) => {
      this.newRoutesRefs.push(key);
      for (let member of value) {
        if (member.tags.public_transport === 'stop_position'){
          member.role = 'stop';
        }
        if (member.tags.public_transport === 'platform'){
          member.role = 'platform';
        }
      }
      let rel = {
        members: value,
        tags : { name : 'unnammed' },
      };
      this.mapSrv.showRoute(rel, this.autoTaskSrv.map);
    });

   //  for(let member of stops){
   //    if(member.tags.public_transport === 'stop_position'){
   //      member.role = 'stop';
   //    }
   //    if(member.tags.public_transport === 'platform'){
   //      member.role = 'platform';
   //    }
   //  }
   // let rel = {
   //   members: stops,
   //   tags : { name : 'unnammed' },
   //  };
   // this.mapSrv.showRoute(rel, this.autoTaskSrv.map);
  }

  private highlightRoute2(refKey: any): void{
    console.log('refkey', typeof refKey);
    // console.log()
    let members = this.routesMap.get(refKey);
    console.log('route map', this.routesMap, 'members', members);
      for (let member of members) {
        if (member.tags.public_transport === 'stop_position'){
          member.role = 'stop';
        }
        if (member.tags.public_transport === 'platform'){
          member.role = 'platform';
        }
      }
      let rel = {
        members,
        tags : { name : 'unnammed' },
      };
      this.mapSrv.showRoute(rel, this.autoTaskSrv.map);
      this.autoTaskSrv.map.setView(this.mapSrv.findCoordinates(members[0].id), 15);

  }
}

