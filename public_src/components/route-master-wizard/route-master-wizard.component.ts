import { Component, Input, ViewChild } from '@angular/core';
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
import { ConfService } from '../../services/conf.service';
import { RouteWizardService } from '../../services/route-wizard.service';
import { AppActions } from '../../store/app/actions';

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
  // key = ref, value array of routes which have those refs
  public newRMsMap = new Map();

  public usedRM =  [];

  public addedRoutes = [];
  public suggestedRoutes = [];

  public RMTags = {
      type                      : 'route_master',
      route_master                    : 'bus',
      ref                         : '',
      'public_transport:version': '2',
      network                   : '',
      operator                  : '',
      name                      : '',
      from                      : '',
      to                        : '',
      wheelchair                : '',
      colour                    : '' ,
  };

  @ViewChild('stepTabs') stepTabs: TabsetComponent;

  constructor(private routeMasterWizardSrv: RouteMasterWizardService,
              private storageSrv: StorageService,
              public mapSrv: MapService,
              private warnSrv: WarnService,
              private overpassSrv: OverpassService,
              public appActions: AppActions,
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

  public getKeys(map: any): any {
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
    // this.selectRM(ref);

    if (percentageCoverage === 100) {
      this.routeMasterWizardSrv.viewRoute(routeID,
        { canStopsConnect : this.canStopsConnect, canPlatformsConnect: this.canPlatformsConnect });
    }
  }

  private selectRM(ref: string): any {
   // this.usedRM = this.newRMsMap.get(ref);
  }

  private getRoutesOfUsedRM(): any {
    this.selectTab(3);
  }

  private removeRouteMember(): any {

  }

  private saveStep3(): any {
    this.selectTab(4);
  }

  private useRouteMaster(ref: any): any {
    this.usedRM = this.newRMsMap.get(ref);
    console.log('userd rm', this.usedRM);
    this.mapSrv.clearHighlight(this.routeMasterWizardSrv.map);
    this.selectTab(3);
  }

  public getWholeRoute(id: any): any {
    return this.routeMasterWizardSrv.modalMapElementsMap.get(id);
  }

  public removeRoute(id: any): any {
    // for(let rel of this.usedRM){
    //   if(rel.id === id){
    //     this.usedRM.splice()
    //   }
    // }
    console.log('delete', id);
    console.log('delete before', this.usedRM);
    let newRM: any = [];
    newRM = newRM.concat(this.usedRM);
    newRM.forEach((rel, i) => {
      if (rel.id === id) {
        newRM.splice(i, 1);
      }
    });
    this.usedRM = newRM;
    console.log('delete after', this.usedRM);
  }

  public  modifiesTags(action: string, key: any, event: any, tags: any): any {
    switch (action) {
      case 'change tag':
        tags[key] = event.target.value;
        break;
      case 'remove tag':
        delete tags[key];
        break;
      case 'add tag':
        tags[key] = event;
        break;
    }
    tags = { ...tags };
    return tags;
  }

  public createChangeTag(action: string, key: any, event: any): any {
    this.RMTags = this.modifiesTags(action, key, event, this.RMTags);
    if (action === 'add tag') {
      this.tagKey             = '';
      this.tagValue           = '';
    }
  }

  public saveStep4(): any {
    let newRM = {
      id       : this.editSrv.findNewId(),
      timestamp: new Date().toISOString().split('.')[0] + 'Z',
      version  : 1,
      changeset: -999,
      uid      : Number(localStorage.getItem('id')),
      user     : localStorage.getItem('display_name'),
      type     : 'relation',
      members  : this.usedRM,
      tags     : this.RMTags,
    };
    let change            = { from: undefined, to: newRM };
    this.routeMasterWizardSrv.modalMapElementsMap.set(newRM.id, newRM);
    this.editSrv.addChange(newRM, 'add route', change);
    this.modalRefRouteMasterWiz.hide();
    this.appActions.actSetWizardMode(null);
  }
}
