import { Component, Input, ViewChild } from '@angular/core';

import * as L from 'leaflet';
import { Subject } from 'rxjs';

import { BsModalRef, TabsetComponent } from 'ngx-bootstrap';

import { EditService } from '../../services/edit.service';
import { ProcessService } from '../../services/process.service';
import { OverpassService } from '../../services/overpass.service';
import { WarnService } from '../../services/warn.service';
import { StorageService } from '../../services/storage.service';
import { RouteMasterWizardService } from '../../services/route-master-wizard.service';
import { MapService } from '../../services/map.service';
import { ConfService } from '../../services/conf.service';

import { AppActions } from '../../store/app/actions';

import { IOsmElement } from '../../core/osmElement.interface';

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
  public osmtogeojson: any     = require('osmtogeojson');
  private startEventProcessing = new Subject<L.LeafletEvent>();
  public usedRM                = [];

  @Input() public tagKey: string   = '';
  @Input() public tagValue: string = '';

  public newRMsMap: Map<string, Array<{ id: number, percentCoverage: number }>> = new Map();

  public RMTags = {
    type                      : 'route_master',
    route_master              : 'bus',
    ref                       : '',
    'public_transport:version': '2',
    name                      : '',
    operator                  : '',
    network                   : '',
    colour                    : '',
  };

  @ViewChild('stepTabs') stepTabs: TabsetComponent;

  constructor(private routeMasterWizardSrv: RouteMasterWizardService,
              private storageSrv: StorageService,
              public mapSrv: MapService,
              private warnSrv: WarnService,
              private overpassSrv: OverpassService,
              public appActions: AppActions,
              private processSrv: ProcessService,
              private editSrv: EditService,
              public modalRefRouteMasterWiz: BsModalRef) {
    this.routeMasterWizardSrv.newRoutesMapReceived.subscribe((newRMsMap) => {
      this.newRMsMap = newRMsMap;
      this.selectTab(2);

    });
  }

  public ngOnInit(): void {
    this.routeMasterWizardSrv.elementsRenderedModalMap = new Set();
    this.map                                           = L.map('master-route-wizard-modal-map', {
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
    this.routeMasterWizardSrv.modalMapElementsMap = new Map<number, IOsmElement>(this.storageSrv.elementsMap);
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
  public findSuggestions(): void {
    if (this.mapSrv.map.getZoom() > ConfService.minDownloadZoomForRouteMasterWizard) {
      this.overpassSrv.requestNewOverpassDataForWizard(true);
    } else {
      alert('Not sufficient zoom level');
    }
  }

  /**
   * Jumps to step when tab directly clicked
   * @param {string} step
   * @returns {void}
   */
  private selectTab(step: number): void {
    this.stepTabs.tabs[step - 1].disabled = false;
    this.stepTabs.tabs[step - 1].active   = true;
    for (let i = step + 1; i < 5; i++) {
      console.log('i-1', i - 1);
      this.stepTabs.tabs[i - 1].disabled = true;
    }
  }

  /**
   * Returns array of keys from map
   * @returns {string[]}
   */
  public getKeys(): string[] {
    let refs = [];
    this.newRMsMap.forEach((value, key) => {
      refs.push(key);
    });
    return refs;
  }

  public getValue(ref: string): Array<{ id: number, percentCoverage: number }> {
    return this.newRMsMap.get(ref);
  }

  /**
   * Highlights the route on map
   * @param routeID
   * @param percentageCoverage
   * @returns {void}
   */
  public viewRoute(routeID: number, percentageCoverage: number): void {
    if (percentageCoverage === 100) {
      this.routeMasterWizardSrv.viewRoute(routeID);
    } else {
      alert('Cannot highlight the route as it has not been downloaded completly');
    }
  }

  /**
   * For moving from step 3 to 4
   * @returns {void}
   */
  public saveStep3(): void {
    this.selectTab(4);
  }

  public useRouteMaster(ref: string): void {
    this.usedRM = this.newRMsMap.get(ref);
    this.mapSrv.clearHighlight(this.routeMasterWizardSrv.map);
    this.selectTab(3);
  }

  public getWholeRoute(id: number): IOsmElement {
    return this.routeMasterWizardSrv.modalMapElementsMap.get(id);
  }

  public removeRoute(id: number): void {
    let newRM = [];
    newRM          = [ ...newRM, ...this.usedRM ];
    newRM.forEach((rel, i) => {
      if (rel.id === id) {
        newRM.splice(i, 1);
      }
    });
    this.usedRM = newRM;
  }

  public modifiesTags(action: string, key: string, event: FocusEvent, tags: object): any {
    switch (action) {
      case 'change tag':
        tags[key] = (event.target as HTMLInputElement).value;
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

  public createChangeTag(action: string, key: string, event?: FocusEvent): void {
    this.RMTags = this.modifiesTags(action, key, event, this.RMTags);
    if (action === 'add tag') {
      this.tagKey   = '';
      this.tagValue = '';
    }
  }

  /**
   * Final step for saving the route master
   * @returns {void}
   */
  public saveStep4(): void {
    let newRM  = {
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
    let change = { from: undefined, to: newRM };
    this.routeMasterWizardSrv.modalMapElementsMap.set(newRM.id, newRM);
    this.editSrv.addChange(newRM, 'add route', change);
    this.modalRefRouteMasterWiz.hide();
    this.appActions.actSetWizardMode(null);
  }

  /**
   * returns colors for the list items according to percentage coverage area
   * @param percentageCoverage
   * @returns {string}
   */
  public getListItemColor(percentageCoverage: number): string {
    switch (true) {
      case percentageCoverage === 100:
        return 'lightgreen';
      case (percentageCoverage < 50):
        return 'lightcoral';
      case (percentageCoverage < 100 && percentageCoverage > 50):
        return 'lightsalmon';
      default:
        return '';
    }
  }
}
