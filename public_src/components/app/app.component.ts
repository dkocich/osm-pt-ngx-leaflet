import { Component, isDevMode, OnInit, ViewChild } from '@angular/core';
import { NgRedux, select } from '@angular-redux/store';
import { CarouselConfig, ModalDirective } from 'ngx-bootstrap';

import * as L from 'leaflet';

import { Spinkit } from 'ng-http-loader/spinkits';

import { Observable } from 'rxjs';

import { EditService } from '../../services/edit.service';
import { GeocodeService } from '../../services/geocode.service';
import { MapService } from '../../services/map.service';
import { ProcessService } from '../../services/process.service';

import { AuthComponent } from '../auth/auth.component';
import { ToolbarComponent } from '../toolbar/toolbar.component';

import { IAppState } from '../../store/model';
import { AppActions } from '../../store/app/actions';
import { DataService } from '../../services/data.service';
import { StorageService } from '../../services/storage.service';

@Component({
  providers: [{ provide: CarouselConfig, useValue: { noPause: false } }],
  selector: 'app',
  styleUrls: [
    './app.component.less',
  ],
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  public spinkit = Spinkit;
  public advancedMode: boolean = Boolean(localStorage.getItem('advancedMode'));

  @ViewChild(ToolbarComponent) public toolbarComponent: ToolbarComponent;
  @ViewChild(AuthComponent) public authComponent: AuthComponent;
  @ViewChild('helpModal') public helpModal: ModalDirective;

  @select(['app', 'editing']) public readonly editing$: Observable<boolean>;

  constructor(
    public appActions: AppActions,
    private ngRedux: NgRedux<IAppState>,
    private editSrv: EditService,
    private geocodeSrv: GeocodeService,
    private mapSrv: MapService,
    private processSrv: ProcessService,
    private dataSrv: DataService,
    private storageSrv: StorageService,
  ) {
    if (isDevMode()) {
      console.log('WARNING: Ang. development mode is ', isDevMode());
    }
  }

  public ngOnInit(): any {
    this.dataSrv.getIdsPlatformsIDB().then((keys) => {
      this.storageSrv.platformsIDB  = new Set(keys.map((item) => item));
      console.log('(app component) ids of platforms in IDB');
      console.log(this.storageSrv.platformsIDB);
    }).catch((err) => {
      console.log('Could not get ids of platforms stored in IDB');
      console.log(err);
    });
    this.dataSrv.getIdsStopsIDB().then((keys) => {
      this.storageSrv.stopsIDB  = new Set(keys.map((item) => item));
      console.log('(app component) ids of stops in IDB');
      console.log(this.storageSrv.stopsIDB);
    }).catch((err) => {
      console.log('Could not get ids of stops stored in IDB');
      console.log(err);
    });
    this.dataSrv.getIdsRoutesIDB().then((keys) => {
      this.storageSrv.routesIDB  = new Set(keys.map((item) => item));
      console.log('(app component) ids of routes in IDB');
      console.log(this.storageSrv.routesIDB);
    }).catch((err) => {
      console.log('Could not get ids of routes stored in IDB');
      console.log(err);
    });
    this.dataSrv.getIdsMasterRoutesIDB().then((keys) => {
      this.storageSrv.routeMastersIDB  = new Set(keys.map((item) => item));
      console.log('(app component) ids of routes in IDB');
      console.log(this.storageSrv.routeMastersIDB);
    }).catch((err) => {
      console.log('Could not get ids of route masters stored in IDB');
      console.log(err);
    });
    this.dataSrv.getIdsWaysIDB().then((keys) => {
      this.storageSrv.waysIDB  = new Set(keys.map((item) => item));
      console.log('(app component) ids of ways in IDB');
      console.log(this.storageSrv.waysIDB);
    }).catch((err) => {
      console.log('Could not get ids of ways stored in IDB');
      console.log(err);
    });
    this.dataSrv.getIdsCompletelyDownloadedStops().then((keys) => {
      this.storageSrv.completelyDownloadedStopsIDB  = new Set(keys.map((item) => item));
      console.log('(app component) ids of completely downloaded  stops in IDB');
      console.log(this.storageSrv.platformsIDB);
    }).catch((err) => {
      console.log('Could not get ids of completely downloaded stops stored in IDB');
      console.log(err);
    });
    this.dataSrv.getIdsCompletelyDownloadedPlatforms().then((keys) => {
      this.storageSrv.completelyDownloadedPlatformsIDB  = new Set(keys.map((item) => item));
      console.log('(app component) ids of completely downloaded  platforms in IDB');
      console.log(this.storageSrv.completelyDownloadedPlatformsIDB);
    }).catch((err) => {
      console.log('Could not get ids of completely downloaded platforms stored in IDB');
      console.log(err);
    });
    this.dataSrv.getIdsCompletelyDownloadedRoutes().then((keys) => {
      this.storageSrv.completelyDownloadedRoutesIDB  = new Set(keys.map((item) => item));
      console.log('(app component) ids of completely downloaded  routes in IDB');
      console.log(this.storageSrv.routesIDB);
    }).catch((err) => {
      console.log('Could not get ids of completely downloaded routes stored in IDB');
      console.log(err);
    });


    const map = L.map('map', {
      center: L.latLng(49.686, 18.351),
      layers: [this.mapSrv.baseMaps.CartoDB_light],
      maxZoom: 22,
      minZoom: 4,
      zoom: 14,
      zoomAnimation: false,
      zoomControl: false,
    });

    L.control.zoom({ position: 'topright' }).addTo(map);
    L.control.layers(this.mapSrv.baseMaps).addTo(map);
    L.control.scale().addTo(map);

    this.mapSrv.map = map;
    this.mapSrv.map.on('zoomend moveend', () => {
      this.processSrv.filterDataInBounds();
      this.processSrv.addPositionToUrlHash();
    });
    if (
      window.location.hash !== '' && this.processSrv.hashIsValidPosition()
    ) {
      this.mapSrv.zoomToHashedPosition();
    } else {
      this.geocodeSrv.getCurrentLocation();
    }
    this.toolbarComponent.Initialize();
  }

  public hideHelpModal(): void {
    this.helpModal.hide();
  }

  private showHelpModal(): void {
    this.helpModal.show();
  }
}
