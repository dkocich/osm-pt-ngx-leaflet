
import {distinctUntilChanged, debounceTime} from 'rxjs/operators';
import { Component, Input, ViewChild } from '@angular/core';

import { StorageService } from '../../services/storage.service';
import { MapService } from '../../services/map.service';
import { WarnService } from '../../services/warn.service';
import { OverpassService } from '../../services/overpass.service';
import { RouteWizardService } from '../../services/route-wizard.service';
import { ProcessService } from '../../services/process.service';
import { EditService } from '../../services/edit.service';
import { ConfService } from '../../services/conf.service';

import * as L from 'leaflet';
import { BsModalRef, TabsetComponent } from 'ngx-bootstrap';

import { Subject } from 'rxjs';
import { AppActions } from '../../store/app/actions';

@Component({
  selector: 'route-wizard',
  styleUrls: [
    './route-wizard.component.less',
    '../../styles/main.less',
  ],
  templateUrl: './route-wizard.component.html',
})

export class RouteWizardComponent {

  map: L.Map;
  newRoutesRefs              = [];
  osmtogeojson: any          = require('osmtogeojson');
  private startEventProcessing      = new Subject<L.LeafletEvent>();
  newRoute: any              = {};
  newRouteMembersSuggestions = [];
  addedNewRouteMembers       = [];

  @Input() tagKey: string   = '';
  @Input() tagValue: string = '';

  canStopsConnect     = false;
  canPlatformsConnect = false;
  currentlyViewedRef  = null;

  @ViewChild('stepTabs') stepTabs: TabsetComponent;

  constructor(private storageSrv: StorageService,
              public mapSrv: MapService,
              private warnSrv: WarnService,
              private overpassSrv: OverpassService,
              private routeWizardSrv: RouteWizardService,
              private processSrv: ProcessService,
              private editSrv: EditService,
              public  modalRefRouteWiz: BsModalRef,
              public appActions: AppActions,

  ) {

    this.routeWizardSrv.routesReceived.subscribe((routesMap) => {
      if (routesMap === null) {
        alert('No suggestions available for the chosen map bounds. Please select again.');
      } else {
        this.routeWizardSrv.routesMap = new Map();
        this.newRoutesRefs            = [];
        this.routeWizardSrv.filterRoutesMap(routesMap);
        if (this.routeWizardSrv.routesMap.size !== 0) {
          this.routeWizardSrv.highlightFirstRoute(
            {
              canStopsConnect    : this.canStopsConnect,
              canPlatformsConnect: this.canPlatformsConnect,
            });
          this.routeWizardSrv.routesMap.forEach((value, key) => {
            this.newRoutesRefs.push(key);
          });
          this.currentlyViewedRef = this.newRoutesRefs[0];
          this.selectTab(2);
        } else {
          alert('No suggestions available for the chosen map bounds. Please select again.');
        }
      }
    });

    this.routeWizardSrv.autoRouteMapNodeClick.subscribe((featureId) => {
      this.handleModalMapMarkerClick(featureId);
    });

    this.routeWizardSrv.refreshAvailableConnectivity.subscribe((data) => {
      this.canStopsConnect     = data.canStopsConnect;
      this.canPlatformsConnect = data.canPlatformsConnect;
    });
  }

  ngOnInit(): void {
    this.selectTab(1);
    this.routeWizardSrv.elementsRenderedModalMap = new Set();
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
    this.routeWizardSrv.map = this.map;
    this.routeWizardSrv.renderAlreadyDownloadedData();
    this.routeWizardSrv.modalMapElementsMap = new Map<any, any>(this.storageSrv.elementsMap);
    this.routeWizardSrv.map.on('zoomend moveend', (event: L.LeafletEvent) => {
      this.startEventProcessing.next(event);
    });
    this.startEventProcessing.pipe(
        debounceTime(500),
        distinctUntilChanged(),
      )
      .subscribe(() => {
        this.overpassSrv.initDownloaderForModalMap(this.routeWizardSrv.map);
      });
  }

  /**
   * Finds suggestions in current bounds
   */
  findMissingRoutes(): void {
    if (this.mapSrv.map.getZoom() > ConfService.minDownloadZoomForRouteWizard) {
      this.overpassSrv.requestNewOverpassDataForWizard(true);
    } else {
      alert('Not sufficient zoom level');
    }
  }

  /**
   * Uses selected suggested ref
   */
  useRef(ref: string): void {
    this.mapSrv.clearHighlight(this.routeWizardSrv.map);
    this.routeWizardSrv.clearMembersHighlight();
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
    this.newRouteMembersSuggestions = this.routeWizardSrv.routesMap.get(ref);
    this.addedNewRouteMembers       = this.routeWizardSrv.routesMap.get(ref);
    this.selectTab(3);
    let countObj = RouteWizardService.countNodeType(this.addedNewRouteMembers);
    this.routeWizardSrv.useAndSetAvailableConnectivity(countObj);
    this.routeWizardSrv.highlightRoute(this.addedNewRouteMembers, true);
    this.routeWizardSrv.highlightMembers(this.addedNewRouteMembers);
  }

  /**
   * Changes selected tab
   */
  private selectTab(step: number): void {
    this.stepTabs.tabs[step - 1].disabled = false;
    this.stepTabs.tabs[step - 1].active   = true;
    for (let i = step + 1; i < 5 && i !== 0 ; i++) {
      this.stepTabs.tabs[i - 1].disabled = true;
    }
  }

  /**
   * Handles marker click
   */
  private handleModalMapMarkerClick(featureId: number): void {
    if (this.stepTabs.tabs[2].active) {
      let newMember = this.processSrv.getElementById(featureId, this.routeWizardSrv.modalMapElementsMap);
      this.addNewMemberToRoute(newMember);
    }
  }

  /**
   * Adds new member to route
   */
  private addNewMemberToRoute(newMember: any): void {
    this.addedNewRouteMembers = this.routeWizardSrv.addNewMemberToRoute(newMember, this.addedNewRouteMembers);
  }

  /**
   * Removes member from route
   */
  removeMember(toRemoveMemberID: string): void {
    this.addedNewRouteMembers = this.routeWizardSrv.removeMember(toRemoveMemberID, this.addedNewRouteMembers);
  }

  /**
   * View suggested route on map
   */
  viewSuggestedRoute(ref: string): void {
  this.currentlyViewedRef = ref;
  this.routeWizardSrv.viewSuggestedRoute(ref, { canStopsConnect : this.canStopsConnect, canPlatformsConnect: this.canPlatformsConnect });
  }

  /**
   * Changes route highlight on map on reordering members from list
   */
  reorderMembers(): void {
    this.mapSrv.clearHighlight(this.routeWizardSrv.map);
    this.routeWizardSrv.highlightRoute(this.addedNewRouteMembers, false);
  }

  /**
   * Saves step 3 of adding members
   */
  saveStep3(): void {
   this.selectTab(4);
  }

  /**
   * Handles when tags for route are updated
   */
  createChangeTag(action: string, key: any, event: any): void {
    this.newRoute = RouteWizardService.modifiesTags(action, key, event, this.newRoute);
    if (action === 'add tag') {
      this.tagKey             = '';
      this.tagValue           = '';
    }
  }

  /**
   * Saves final step
   */
  saveStep4(): void {
    RouteWizardService.assignRolesToMembers(this.addedNewRouteMembers);
    this.newRoute.members = RouteWizardService.formRelMembers(this.addedNewRouteMembers);
    this.newRoute.tags    = RouteWizardService.filterEmptyTags(this.newRoute);
    let change            = { from: undefined, to: this.newRoute };
    this.routeWizardSrv.modalMapElementsMap.set(this.newRoute.id, this.newRoute);
    this.editSrv.addChange(this.newRoute, 'add route', change);
    this.modalRefRouteWiz.hide();
    this.appActions.actSetWizardMode(null);
  }

  /**
   * Jumps to step when tab directly clicked
   */
  jumpToStep(step: string): void {
    switch (step) {
      case '1':
        this.routeWizardSrv.clearMembersHighlight();
        this.mapSrv.clearHighlight(this.routeWizardSrv.map);
        break;
      case '2':
        this.routeWizardSrv.clearMembersHighlight();
        this.mapSrv.clearHighlight(this.routeWizardSrv.map);
        this.viewSuggestedRoute(this.newRoutesRefs[0]);
        break;
      case '3':
        let countObj = RouteWizardService.countNodeType(this.addedNewRouteMembers);
        this.routeWizardSrv.useAndSetAvailableConnectivity(countObj);
        this.routeWizardSrv.highlightRoute(this.addedNewRouteMembers, true);
        this.routeWizardSrv.highlightMembers(this.addedNewRouteMembers);
        break;
    }
  }

  /**
   * Changes connectivity of route on map
   */
  showConnectivity(type: string): void {
    this.routeWizardSrv.showConnectivity(type, {
      canStopsConnect    : this.canStopsConnect,
      canPlatformsConnect: this.canPlatformsConnect,
    }, this.addedNewRouteMembers);
  }

  /**
   * Determines the color by which the text should be highlighted for suggested new routes
   */
  getTextColorForSuggestedRoutes(ref: string): string {
    let color = '';
    this.routeWizardSrv.routesMap.forEach((members, suggestedRef) => {
      if (suggestedRef === ref) {
        let membersLength = members.length;
        if (membersLength > 10) {
          color = 'green';
        } else if (membersLength < 10 && membersLength > 5) {
          color = 'orange';
        } else {
          color = 'red';
        }
      }
    });
    return color;
  }

}
