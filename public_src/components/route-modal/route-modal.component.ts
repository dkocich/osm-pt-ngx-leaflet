import { Component } from '@angular/core';

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
  public message = '';

  constructor(private storageSrv: StorageService,
              private mapSrv: MapService,
              private warnSrv: WarnService,
              private overpassSrv: OverpassService,
              private autoTaskSrv: AutoTasksService) {

    this.autoTaskSrv.routesRec.subscribe((routes) => {
      this.routesMap = routes;
      if (this.autoTaskSrv.checkMemberCount(routes.values().next().value)) {
        this.highlightRoute(routes.keys().next().value);
      }
      routes.forEach((value, key) => {
        this.newRoutesRefs.push(key);
      });
    });
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
      .subscribe(() => {
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

  private highlightRoute(refKey: any): void {
    this.autoTaskSrv.highlightRoute(refKey);
  }

  private save(): void{

  }

  private cancel(): void{

  }

}
