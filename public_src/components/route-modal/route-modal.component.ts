import { Component, Input, ViewChild } from '@angular/core';

import { StorageService } from '../../services/storage.service';
import { MapService } from '../../services/map.service';
import { WarnService } from '../../services/warn.service';
import { OverpassService } from '../../services/overpass.service';
import { ModalMapService } from '../../services/auto-route-creation/modal-map.service';
import { ProcessService } from '../../services/process.service';
import { EditService } from '../../services/edit.service';

import * as L from 'leaflet';
import { TabsetComponent } from 'ngx-bootstrap';

import { Subject } from 'rxjs/Subject';

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
  public routesMap: Map<string, any[]> = new Map();
  public newRoutesRefs = [];
  public osmtogeojson: any = require('osmtogeojson');
  private startEventProcessing = new Subject<L.LeafletEvent>();
  public message = '';
  public currentView = 'routes-menu';
  public newRoute: any = {};
  public newRouteMembersSuggestions = [];
  public addedNewRouteMembers = [];
  public addedTags;

  @Input() public tagKey: string = '';
  @Input() public tagValue: string = '';

  public canStopsConnect = false;
  public canPlatformsConnect = false;

  @ViewChild('stepTabs') stepTabs: TabsetComponent;

  constructor(private storageSrv: StorageService,
              private mapSrv: MapService,
              private warnSrv: WarnService,
              private overpassSrv: OverpassService,
              private modalMapSrv: ModalMapService,
              private processSrv: ProcessService,
              private editSrv: EditService) {

    this.processSrv.routesRecieved.subscribe((routesMap) => {
      console.log('route map rec' , routesMap);
      this.filterRoutesMap(routesMap);
      this.highlightFirstRoute(this.routesMap);
      this.routesMap.forEach((value, key) => {
      this.newRoutesRefs.push(key);
      });
    });

    this.mapSrv.autoRouteMapNodeClick.subscribe((featureId) => {
      this.handleModalMapMarkerClick(featureId);
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

  private findMissingRoutes(): any {
    if (this.mapSrv.map.getZoom() > 8) {
      this.overpassSrv.requestNewOverpassDataForModalMap(true);
    } else {
      alert('Not sufficient zoom level');
    }
  }

  private highlightRoute(members: any): void {
    let routeMembers = members;
    this.assignRolesToMembers(routeMembers);
    let rel = {
      members: routeMembers,
      tags: { name: 'nil' },
    };
    console.log('new temp rel to highlight: ', rel);
    this.storageSrv.stopsForRoute     = [];
    this.storageSrv.platformsForRoute = [];
    this.mapSrv.showRoute(rel, this.modalMapSrv.map);
    this.adjustZoomForRoute(routeMembers);
  }
// TODO change to more than 3?
  private checkMemberCount(members: any): any {
    console.log('members length', members.length, members);
    return members.length !== 1;
  }

  private highlightFirstRoute(routesMap: any): any {
    let members        = this.routesMap.get(this.routesMap.keys().next().value);
    console.log('first ref key members', members);
    let countObj = this.countNodeType(members);
    console.log('countobj', JSON.parse(JSON.stringify(countObj)));
    this.useAndSetAvailableConnectivity(countObj.stopsCount, countObj.platformsCount);
    console.log(' first connecty highlight', this.mapSrv.highlightType);
    this.highlightRoute(members);
    console.log(' first after highlight connecty highlight', this.mapSrv.highlightType);

  }
  private adjustZoomForRoute(members: any): any {
    let latlngs: L.LatLng[] = [];
    for (let member of members) {
      latlngs.push(L.latLng(member.lat, member.lon));
    }
    this.modalMapSrv.map.fitBounds(L.latLngBounds(latlngs));
  }

  public useRef(ref: string): any {
    this.mapSrv.clearHighlight(this.modalMapSrv.map);
    const newId                     = this.editSrv.findNewId();
    this.newRoute                   = {
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
        ref,
        'public_transport:version': '2',
        network                   : '',
        operator                  : '',
        name                      : '',
        from                      : '',
        to                        : '',
        wheelchair                : '',
        colour                    : '',

      },
    };
    this.newRouteMembersSuggestions = this.routesMap.get(ref);
    this.addedNewRouteMembers       = this.routesMap.get(ref);
    this.selectTab(2);
    let countObj = this.countNodeType(this.addedNewRouteMembers);
    this.useAndSetAvailableConnectivity(countObj.stopsCount, countObj.platformsCount);
    this.highlightRoute(this.addedNewRouteMembers);
    this.currentView = 'selected-route';
  }

  private selectTab(step: number): void {
    this.stepTabs.tabs[step - 1].active = true;
  }

  private handleModalMapMarkerClick(featureId: number): any {
   let newMember = this.processSrv.getElementById(featureId);
   this.addNewMemberToRoute(newMember);
  }

  private addNewMemberToRoute(newMember: any): void {
    let members = [];
    members.push(newMember);
    this.addedNewRouteMembers = this.addedNewRouteMembers.concat(members);
    let countObj = this.countNodeType(this.addedNewRouteMembers);
    console.log('add new', this.mapSrv.highlightType);
    this.resetAvailableConnectivity(countObj.stopsCount, countObj.platformsCount);
    console.log(' after reset, add new', this.mapSrv.highlightType);
    console.log('highlight type in add new members before highlighting', JSON.parse(JSON.stringify(this.mapSrv.highlightType)));
    this.mapSrv.clearHighlight(this.modalMapSrv.map);
    this.highlightRoute(this.addedNewRouteMembers);
  }

  private removeMember(toRemoveMemberID: string): void {
    let members = [];
    let index;
    for (let member of this.addedNewRouteMembers) {
      if (member.id === toRemoveMemberID) {
        members.push(member);
        index = this.addedNewRouteMembers.indexOf(member);
      }
    }
    let countObj = this.countNodeType(this.addedNewRouteMembers);
    console.log('add new', this.mapSrv.highlightType);
    this.resetAvailableConnectivity(countObj.stopsCount, countObj.platformsCount);
    if (index > -1) {
      this.addedNewRouteMembers.splice(index, 1);
    }

    this.mapSrv.clearHighlight(this.modalMapSrv.map);
    this.highlightRoute(this.addedNewRouteMembers);
  }

  public showConnectivity(type: string): any {
    this.mapSrv.clearHighlight(this.modalMapSrv.map);
    let countObj = this.countNodeType(this.addedNewRouteMembers);
    this.resetAvailableConnectivity(countObj.stopsCount, countObj.platformsCount);
    this.setHighlightType(type);
    console.log('show connectivity', JSON.parse(JSON.stringify(this.mapSrv.highlightType)));
    this.highlightRoute(this.addedNewRouteMembers);
    document.getElementById(type).style.backgroundColor = 'blue';
    this.styleButtons(type);
  }

  private setHighlightType(type: string): boolean {
    switch (type) {
      case 'Stops':
        if (this.canStopsConnect) {
          this.mapSrv.highlightType = 'Stops';
          return true;
        }
        break;
      case 'Platforms':
        if (this.canPlatformsConnect) {
          this.mapSrv.highlightType = 'Platforms';
          return true;
        }
        break;
      default:
        return false;
    }
  }

  private resetAvailableConnectivity(stopsCount: number, platformsCount: number): any {
    if (stopsCount > 1) {
      this.canStopsConnect = true;
    } else {
      this.canStopsConnect = false;
    }
    if (platformsCount > 1) {
      this.canPlatformsConnect = true;
    } else {
      this.canPlatformsConnect = false;
    }
    console.log('stops can cnnect', this.canStopsConnect, 'platforms can conn', this.canPlatformsConnect);
  }

  private viewSuggestedRoute(ref: any): any {
    let members = this.routesMap.get(ref);
    let countObj = this.countNodeType(members);
    this.useAndSetAvailableConnectivity(countObj.stopsCount, countObj.platformsCount);
    this.highlightRoute(members);
  }

  /***
   * checks if stops connectivity is available, else uses platforms for highlighting
   * @param {number} stopsCount
   * @param {number} platformsCount
   * @returns {any}
   */
  private useAndSetAvailableConnectivity(stopsCount: number, platformsCount: number): any {
    this.resetAvailableConnectivity(stopsCount, platformsCount);
    if (this.canStopsConnect) {
      this.setHighlightType('Stops');
    } else if (this.canPlatformsConnect) {
      this.setHighlightType('Platforms');
    }
  }

  private filterRoutesMap(routesMap: any): any {
    routesMap.forEach((value, key) => {
      if (this.checkMemberCount(value)) {
        this.routesMap.set(key, value);
      }
    });
    console.log('after filter and assign', this.routesMap);
  }

  private countNodeType(members: any): any {
    let stopsCount     = 0;
    let platformsCount = 0;
    for (let member of members) {
      if (member.tags.public_transport === 'stop_position') {
        stopsCount++;
      }
      if (member.tags.public_transport === 'platform') {
        platformsCount++;
      }
    }
    return { stopsCount, platformsCount };
  }

  private styleButtons(type: string): any {
    switch (type) {
      case 'Stops':
        document.getElementById(type).style.backgroundColor = 'blue';
        document.getElementById('Platforms').style.backgroundColor = 'white';
        break;
      case 'Platforms':
        document.getElementById(type).style.backgroundColor = 'blue';
        document.getElementById('Stops').style.backgroundColor = 'white';
        break;
    }
  }

  private reorderMembers(members: any): any {

    this.mapSrv.clearHighlight(this.modalMapSrv.map);
    this.highlightRoute(this.addedNewRouteMembers);

  }

  private saveStep2(): any {
   // this.addedTags = this.newRoute.tags;
   this.selectTab(3);
  }

  private createChange(action: string, key: any, event: any): any {
    console.log('key', key);
    switch (action) {
      case 'change tag':
       this.newRoute.tags[key] = event.target.value;
       console.log('after change tag', this.addedTags);
       break;
      case 'remove tag':
        delete this.newRoute.tags[key];
        // this.addedTags = { ...this.addedTags };
        break;
      case 'add tag':
        this.newRoute.tags[key] = event;
        this.tagKey = '';
        this.tagValue = '';
        break;
    }
    this.newRoute.tags = { ...this.newRoute.tags };
  }

  public saveStep3(): any {
    this.assignRolesToMembers(this.addedNewRouteMembers);
    let relMembers = this.formRelMembers(this.addedNewRouteMembers);
    this.newRoute.members = relMembers;
    let change                     = { from: undefined, to: this.newRoute };
    this.editSrv.addChange(this.newRoute, 'add route', change);
  }

  private assignRolesToMembers(members: any): any{
    let probableRole: string = '';
    for (let member of members) {
      switch (member.tags.public_transport) {
        case 'platform':
        case 'station':
          probableRole = 'platform';
          break;
        case 'stop_position':
          probableRole = 'stop';
          break;
        default:
          alert('FIXME: suspicious role - ');
          probableRole = 'stop';
      }
      member.role = probableRole;
    }
  }
  private formRelMembers(toAddNodes: any): any {
    let relMembers = [];
    for (let node of toAddNodes) {
      relMembers.push({
        type: 'node',
        ref : node.id,
        role: node.role,
      });
    }
    return relMembers;
  }
}
