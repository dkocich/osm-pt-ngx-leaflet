import { Component } from '@angular/core';

import { StorageService } from '../../services/storage.service';
import { MapService } from '../../services/map.service';
import { WarnService } from '../../services/warn.service';
import { OverpassService } from '../../services/overpass.service';

import * as L from 'leaflet';

import { Subject } from 'rxjs/Rx';
import {ModalMapService} from '../../services/auto-route-creation/modal-map.service';
import {ProcessService} from '../../services/process.service';
import {IPtRelationNew} from '../../core/ptRelationNew.interface';
import {IPtTags} from '../../core/ptTags.class';
import {EditService} from '../../services/edit.service';

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
  public currentView = 'routes-menu';
  public newRoute: IPtRelationNew;
  public newRouteMembersSuggestions = [];
  public addedNewRouteMembers = [];
  constructor(private storageSrv: StorageService,
              private mapSrv: MapService,
              private warnSrv: WarnService,
              private overpassSrv: OverpassService,
              private modalMapSrv: ModalMapService,
              private processSrv: ProcessService,
              private editSrv: EditService) {

    this.processSrv.routesRecieved.subscribe((routesMap) => {
      this.routesMap = routesMap;
      this.highlightFirstRoute(routesMap);
      routesMap.forEach((value, key) => {
        // prevent single members appearing in list
        if (this.checkMemberCount(value)) {
          this.newRoutesRefs.push(key);
        }
      });
    });
  }

  public ngOnInit(): void {
    this.map = L.map('auto-route-modal-map', {
      center: this.mapSrv.map.getCenter(),
      layers: [this.modalMapSrv.baseMaps.CartoDB_light],
      maxZoom: 22,
      minZoom: 4,
      zoom: 14,
      zoomAnimation: false,
      zoomControl: false,
    });

    L.control.zoom({ position: 'topright' }).addTo(this.map);
    L.control.scale().addTo(this.map);

    this.modalMapSrv.map = this.map;
    this.modalMapSrv.renderAlreadyDownloadedData();

    this.modalMapSrv.map.on('zoomend moveend', (event: L.LeafletEvent) => {
      this.startEventProcessing.next(event);
    });
    this.startEventProcessing
      .debounceTime(500)
      .distinctUntilChanged()
      .subscribe(() => {
        this.overpassSrv.initDownloaderForModalMap(this.modalMapSrv.map);
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
    let members = this.routesMap.get(refKey);
    if (this.checkMemberCount(members)) {
      for (let member of members) {
        if (member.tags.public_transport === 'stop_position') {
          member.role = 'stop';
        }
        if (member.tags.public_transport === 'platform') {
          member.role = 'platform';
        }
      }
      let rel = {
        members,
        tags: { name: 'nil' },
      };
      this.mapSrv.showRoute(rel, this.modalMapSrv.map);
      this.adjustZoomForRoute(members);
    } else {
      this.message = 'no routes found/members length less or equal to 1';
    }
  }
// TODO change to more than 3? not needed anymore?
  private checkMemberCount(members: any): any{
    console.log('members length', members.length, members);
    return members.length !== 1;
  }

  private highlightFirstRoute(routesMap: any): any{
    if (this.checkMemberCount(routesMap.values().next().value)) {
      this.highlightRoute(routesMap.keys().next().value);
    }
  }

  private adjustZoomForRoute(members: any) : any{
    let latlngs: L.LatLng[] = [];
    for (let member of members) {
      latlngs.push(L.latLng(member.lat, member.lon));
    }
    this.modalMapSrv.map.fitBounds(L.latLngBounds(latlngs));
  }

  private useRef(ref: string): any {
    const newId                    = this.editSrv.findNewId();
    this.newRoute = {
      id       : newId,
      timestamp: new Date().toISOString().split('.')[0] + 'Z',
      version  : 1,
      changeset: -999,
      uid      : Number(localStorage.getItem('id')),
      user     : localStorage.getItem('display_name'),
      type     : 'relation',
      members  : [],
      tags     : {
        type                      : 'route',
        route                     : 'bus',
        ref                       : '',
        network                   : '',
        operator                  : '',
        name                      : '',
        from                      : '',
        to                        : '',
        wheelchair                : '',
        colour                    : '',
        'public_transport:version': '2',
      },
    };
    this.newRouteMembersSuggestions = this.routesMap.get(ref);
    this.addedNewRouteMembers = this.routesMap.get(ref);
    this.currentView = 'selected-route';
  }

  private selectSuggestedRoute(ref: string){

  }
}
