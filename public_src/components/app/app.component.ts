import { Component, isDevMode, OnInit, ViewChild } from '@angular/core';
import { NgRedux, select } from '@angular-redux/store';
import { CarouselConfig, ModalDirective } from 'ngx-bootstrap';

import * as L from 'leaflet';

import { Spinkit } from 'ng-http-loader/spinkits';

import { Observable } from 'rxjs';

import { DbService } from '../../services/db.service';
import { EditService } from '../../services/edit.service';
import { GeocodeService } from '../../services/geocode.service';
import { MapService } from '../../services/map.service';
import { OverpassService } from '../../services/overpass.service';
import { ProcessService } from '../../services/process.service';

import { AuthComponent } from '../auth/auth.component';
import { ToolbarComponent } from '../toolbar/toolbar.component';

import { IAppState } from '../../store/model';
import { AppActions } from '../../store/app/actions';

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
  @select(['app', 'advancedExpMode']) public readonly advancedExpMode$: Observable<string>;

  constructor(
    public appActions: AppActions,
    private ngRedux: NgRedux<IAppState>,
    private dbSrv: DbService,
    private editSrv: EditService,
    private geocodeSrv: GeocodeService,
    private mapSrv: MapService,
    private overpassSrv: OverpassService,
    private processSrv: ProcessService,
  ) {
    if (isDevMode()) {
      console.log('WARNING: Ang. development mode is ', isDevMode());
    }
  }

  public ngOnInit(): any {
    this.dbSrv.deleteExpiredDataIDB();
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
      this.processSrv.addPositionToUrlHash();
      this.overpassSrv.initDownloader();
      this.processSrv.filterDataInBounds();
    });
    if (
      window.location.hash !== '' && this.processSrv.hashIsValidPosition()
    ) {
      this.mapSrv.zoomToHashedPosition();
    } else {
      this.geocodeSrv.getCurrentLocation();
    }
  }

  public hideHelpModal(): void {
    this.helpModal.hide();
  }

  private showHelpModal(): void {
    this.helpModal.show();
  }
}
