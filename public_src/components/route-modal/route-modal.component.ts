import { Component, Input, ViewChild } from '@angular/core';

import { StorageService } from '../../services/storage.service';
import { MapService } from '../../services/map.service';
import { WarnService } from '../../services/warn.service';
import { OverpassService } from '../../services/overpass.service';
import { ModalMapService } from '../../services/auto-route-creation/modal-map.service';
import { ProcessService } from '../../services/process.service';
import { EditService } from '../../services/edit.service';

import * as L from 'leaflet';
import { BsModalRef, TabsetComponent } from 'ngx-bootstrap';

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
  public newRoutesRefs                 = [];
  public osmtogeojson: any             = require('osmtogeojson');
  private startEventProcessing         = new Subject<L.LeafletEvent>();
  public newRoute: any                 = {};
  public newRouteMembersSuggestions    = [];
  public addedNewRouteMembers          = [];
  public addedTags;

  @Input() public tagKey: string   = '';
  @Input() public tagValue: string = '';

  public canStopsConnect     = false;
  public canPlatformsConnect = false;

  @ViewChild('stepTabs') stepTabs: TabsetComponent;

  constructor(private storageSrv: StorageService,
              private mapSrv: MapService,
              private warnSrv: WarnService,
              private overpassSrv: OverpassService,
              private modalMapSrv: ModalMapService,
              private processSrv: ProcessService,
              private editSrv: EditService,
              public bsModalRef: BsModalRef,
              ) {

    this.modalMapSrv.routesRecieved.subscribe((routesMap) => {
      if (routesMap === null) {
        alert('No suggestions available for the chosen map bounds. Please select again.');
      } else {
        this.modalMapSrv.routesMap = new Map();
        this.newRoutesRefs         = [];
        // also assign modalservice' s var
        this.modalMapSrv.filterRoutesMap(routesMap);
        this.modalMapSrv.highlightFirstRoute(this.canStopsConnect, this.canPlatformsConnect);
        this.modalMapSrv.routesMap.forEach((value, key) => {
          this.newRoutesRefs.push(key);
        });
        this.selectTab(2);
      }

    });

    this.modalMapSrv.autoRouteMapNodeClick.subscribe((featureId) => {
      this.handleModalMapMarkerClick(featureId);
    });

    this.modalMapSrv.refreshAvailableConnectivity.subscribe((data) => {
      this.canStopsConnect = data.canStopsConnect;
      this.canPlatformsConnect = data.canPlatformsConnect;
    });
  }

  public ngOnInit(): void {
    this.selectTab(1);
    this.modalMapSrv.elementsRenderedModalMap = new Set();
    this.map                                 = L.map('auto-route-modal-map', {
      center       : this.mapSrv.map.getCenter(),
      layers       : [L.tileLayer(
        'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
        {
          attribution  : `&copy; <a href='https://www.openstreetmap.org/copyright' target='_blank'
            rel='noopener'>OpenStreetMap</a>&nbsp;&copy;&nbsp;<a href='https://cartodb.com/attributions'
            target='_blank' rel='noopener'>CartoDB</a>`,
          maxNativeZoom: 19,
          maxZoom      : 22,
        },
      )],
      maxZoom      : 22,
      minZoom      : 4,
      zoom         : 14,
      zoomAnimation: false,
      zoomControl  : false,
    });
    L.control.zoom({ position: 'topright' }).addTo(this.map);
    L.control.scale().addTo(this.map);
    this.modalMapSrv.map = this.map;
    this.modalMapSrv.renderAlreadyDownloadedData();
    this.modalMapSrv.modalMapElementsMap = new Map<any, any>(this.storageSrv.elementsMap);
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

  public useRef(ref: string): any {
    this.mapSrv.clearHighlight(this.modalMapSrv.map);
    this.modalMapSrv.clearMembersHighlight();
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
    this.newRouteMembersSuggestions = this.modalMapSrv.routesMap.get(ref);
    this.addedNewRouteMembers       = this.modalMapSrv.routesMap.get(ref);
    this.selectTab(3);
    let countObj = this.modalMapSrv.countNodeType(this.addedNewRouteMembers);
    this.modalMapSrv.useAndSetAvailableConnectivity(countObj.stopsCount, countObj.platformsCount, this.canStopsConnect, this.canPlatformsConnect);
    this.modalMapSrv.highlightRoute(this.addedNewRouteMembers);
    this.modalMapSrv.highlightMembers(this.addedNewRouteMembers);
  }

  private selectTab(step: number): void {
    this.stepTabs.tabs[step - 1].disabled = false;
    this.stepTabs.tabs[step - 1].active   = true;
    for (let i = step + 1; i < 5; i++) {
      this.stepTabs.tabs[i - 1].disabled = true;
    }
  }

  private handleModalMapMarkerClick(featureId: number): any {
    if (this.stepTabs.tabs[2].active) {
      let newMember = this.processSrv.getElementById(featureId, this.modalMapSrv.modalMapElementsMap);
      this.addNewMemberToRoute(newMember);
    }
  }

  private addNewMemberToRoute(newMember: any): void {
    this.addedNewRouteMembers = this.modalMapSrv.addNewMemberToRoute(newMember, this.addedNewRouteMembers);
  }

  private removeMember(toRemoveMemberID: string): void {
    this.addedNewRouteMembers = this.modalMapSrv.removeMember(toRemoveMemberID, this.addedNewRouteMembers);
  }

  private viewSuggestedRoute(ref: any): any {
  this.modalMapSrv.viewSuggestedRoute(ref, this.canStopsConnect, this.canPlatformsConnect);
  }

  private reorderMembers(members: any): any {
    this.mapSrv.clearHighlight(this.modalMapSrv.map);
    this.modalMapSrv.highlightRoute(this.addedNewRouteMembers);
  }

  private saveStep3(): any {
   this.selectTab(4);
  }

  private createChangeTag(action: string, key: any, event: any): any {
    this.newRoute = this.modalMapSrv.createChangeTag(action, key, event, this.newRoute);
    if (action === 'add tag') {
      this.tagKey             = '';
      this.tagValue           = '';
    }

  }

  public saveStep4(): any {
    this.modalMapSrv.assignRolesToMembers(this.addedNewRouteMembers);
    this.newRoute.members = this.modalMapSrv.formRelMembers(this.addedNewRouteMembers);
    this.newRoute.tags    = this.modalMapSrv.filterEmptyTags(this.newRoute);
    let change            = {from: undefined, to: this.newRoute};
    this.modalMapSrv.modalMapElementsMap.set(this.newRoute.id, this.newRoute);
    this.editSrv.addChange(this.newRoute, 'add route', change);
    this.bsModalRef.hide();
  }

  private jumpToStep(step: string): any {
    switch (step) {
      case '1':
        this.modalMapSrv.clearMembersHighlight();
        this.mapSrv.clearHighlight(this.modalMapSrv.map);
        break;
      case '2':
        this.modalMapSrv.clearMembersHighlight();
        this.mapSrv.clearHighlight(this.modalMapSrv.map);
        this.viewSuggestedRoute(this.newRoutesRefs[0]);
        break;
      case '3':
        this.modalMapSrv.highlightRoute(this.addedNewRouteMembers);
        this.modalMapSrv.highlightMembers(this.addedNewRouteMembers);
        break;
    }
  }

 public showConnectivity(type: string): any {
      this.modalMapSrv.showConnectivity(type, this.canStopsConnect, this.canPlatformsConnect, this.addedNewRouteMembers);
      }
}
