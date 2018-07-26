import {Component, Input, ViewChild} from '@angular/core';
import * as L from 'leaflet';
import { RouteMasterWizardService } from '../../services/route-master-wizard.service';
import { MapService } from '../../services/map.service';
import { BsModalRef, TabsetComponent } from 'ngx-bootstrap';
import { EditService } from '../../services/edit.service';
import { ProcessService } from '../../services/process.service';
import { OverpassService } from '../../services/overpass.service';
import { WarnService } from '../../services/warn.service';
import { StorageService } from '../../services/storage.service';

import { Subject } from 'rxjs';
import {ConfService} from '../../services/conf.service';

@Component({
  selector: 'route-master-wizard',
  styleUrls: [
    './route-master-wizard.component.less',
    '../../styles/main.less',
  ],
  templateUrl: './route-master-wizard.component.html',
})

export class RouteMasterWizardComponent {

  public map: L.Map;
  public osmtogeojson: any          = require('osmtogeojson');
  private startEventProcessing      = new Subject<L.LeafletEvent>();

  @Input() public tagKey: string   = '';
  @Input() public tagValue: string = '';

  public canStopsConnect     = false;
  public canPlatformsConnect = false;

  // public currentlyViewedRouteRef  = null;

  public selectedRM = null;
  public newRMsMap = new Map();

  public usedRM =  [];

  public addedRoutes = [];
  public suggestedRoutes = [];

  @ViewChild('stepTabs') stepTabs: TabsetComponent;

  constructor(private routeMasterWizardSrv: RouteMasterWizardService,
              private storageSrv: StorageService,
              public mapSrv: MapService,
              private warnSrv: WarnService,
              private overpassSrv: OverpassService,
              // private routeWizardSrv: RouteWizardService,
              private processSrv: ProcessService,
              private editSrv: EditService,
              public modalRefRouteMasterWiz: BsModalRef) {
this.routeMasterWizardSrv.newRoutesMapReceived.subscribe((newRMsMap) => {
  this.newRMsMap = newRMsMap;
  this.selectTab(2);

});
  }

  public ngOnInit(): void {
    // this.selectTab(1);
    this.routeMasterWizardSrv.elementsRenderedModalMap = new Set();
    this.map                                 = L.map('master-route-wizard-modal-map', {
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
    this.routeMasterWizardSrv.map = this.map;
    this.routeMasterWizardSrv.renderAlreadyDownloadedData();
    this.routeMasterWizardSrv.modalMapElementsMap = new Map<any, any>(this.storageSrv.elementsMap);
    this.routeMasterWizardSrv.map.on('zoomend moveend', (event: L.LeafletEvent) => {
      this.startEventProcessing.next(event);
    });
    this.startEventProcessing
      .debounceTime(500)
      .distinctUntilChanged()
      .subscribe(() => {
        this.overpassSrv.initDownloaderForModalMapRMW(this.routeMasterWizardSrv.map);
      });
  }

  /**
   * Finds suggestions in current bounds
   * @returns {void}
   */
  public findMissingRouteMasters(): void {
    if (this.mapSrv.map.getZoom() > ConfService.minDownloadZoomForRouteMasterWizard) {
      this.overpassSrv.requestNewOverpassDataForWizard(true);
    } else {
      alert('Not sufficient zoom level');
    }
  }

  /***
   * Jumps to step when tab directly clicked
   * @param {string} step
   * @returns {void}
   */
  // public jumpToStep(step: string): void {
  //   switch (step) {
  //     case '1':
  //       // this.routeMasterWizardSrv.clearMembersHighlight();
  //       this.mapSrv.clearHighlight(this.routeMasterWizardSrv.map);
  //       break;
  //     case '2':
  //       this.routeMasterWizardSrv.clearMembersHighlight();
  //       this.mapSrv.clearHighlight(this.routeMasterWizardSrv.map);
  //       // this.viewSuggestedRouteMaster(this.newSuggestedRMs[0]);
  //       break;
  //   }
  // }

  private selectTab(step: number): void {
    this.stepTabs.tabs[step - 1].disabled = false;
    this.stepTabs.tabs[step - 1].active   = true;
    for (let i = step + 1; i < 5; i++) {
      console.log('i-1', i - 1);
      this.stepTabs.tabs[i - 1].disabled = true;
    }
  }

  public getKeys(map: any): any{
    let refs = [];
    this.newRMsMap.forEach((value, key) => {
      refs.push(key);
    });
    return refs;
  }

  public getValue(ref: string): any {
    return this.newRMsMap.get(ref);
  }

  private viewRoute(routeID: any, percentageCoverage: any, ref: any): any {
    this.selectRM(ref);
    if (percentageCoverage === 100) {
      this.routeMasterWizardSrv.viewRoute(routeID,
        { canStopsConnect : this.canStopsConnect, canPlatformsConnect: this.canPlatformsConnect });
    }
  }

  private selectRM(ref: string): any {
   this.usedRM = this.newRMsMap.get(ref);
  }

  private getRoutesOfUsedRM(): any {
    this.selectTab(3);
  }

  private removeRouteMember(): any{

  }

  private saveStep3(): any{

  }

}
