import { Component, Input } from '@angular/core';
import * as L from 'leaflet';
import { RouteMasterWizardService } from '../../services/route-master-wizard.service';
import { MapService } from '../../services/map.service';
import { BsModalRef } from 'ngx-bootstrap';
import { EditService } from '../../services/edit.service';
import { ProcessService } from '../../services/process.service';
import { OverpassService } from '../../services/overpass.service';
import { WarnService } from '../../services/warn.service';
import { StorageService } from '../../services/storage.service';

import { Subject } from 'rxjs/Subject';

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
  public newRoutesRefs              = [];
  public osmtogeojson: any          = require('osmtogeojson');
  private startEventProcessing      = new Subject<L.LeafletEvent>();
  public newRoute: any              = {};
  public newRouteMembersSuggestions = [];
  public addedNewRouteMembers       = [];

  @Input() public tagKey: string   = '';
  @Input() public tagValue: string = '';

  public canStopsConnect     = false;
  public canPlatformsConnect = false;
  public currentlyViewedRef  = null;

  // @ViewChild('stepTabs') stepTabs: TabsetComponent;

  constructor(private routeMasterWizardSrv: RouteMasterWizardService,
              private storageSrv: StorageService,
              public mapSrv: MapService,
              private warnSrv: WarnService,
              private overpassSrv: OverpassService,
              // private routeWizardSrv: RouteWizardService,
              private processSrv: ProcessService,
              private editSrv: EditService,
              public bsModalRef: BsModalRef) {

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
        this.overpassSrv.initDownloaderForModalMap(this.routeMasterWizardSrv.map);
      });
  }
}
