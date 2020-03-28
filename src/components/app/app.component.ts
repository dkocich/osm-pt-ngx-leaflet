import { NgRedux, select } from '@angular-redux/store';
import { Component, isDevMode, OnInit, ViewChild } from '@angular/core';
import * as L from 'leaflet';
import { Spinkit } from 'ng-http-loader';
import { CarouselConfig, ModalDirective } from 'ngx-bootstrap';
import { Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { DbService } from '../../services/db.service';
import { EditService } from '../../services/edit.service';
import { GeocodeService } from '../../services/geocode.service';
import { MapService } from '../../services/map.service';
import { OverpassService } from '../../services/overpass.service';
import { ProcessService } from '../../services/process.service';
import { AppActions } from '../../store/app/actions';
import { IAppState } from '../../store/model';
import { AuthComponent } from '../auth/auth.component';
import { ToolbarComponent } from '../toolbar/toolbar.component';

@Component({
  providers: [{ provide: CarouselConfig, useValue: { noPause: false } }],
  selector: 'app',
  styleUrls: [
    './app.component.less',
  ],
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  spinkit = Spinkit;
  advancedMode: boolean = Boolean(localStorage.getItem('advancedMode'));

  @ViewChild(ToolbarComponent) toolbarComponent: ToolbarComponent;
  @ViewChild(AuthComponent) authComponent: AuthComponent;
  @ViewChild('helpModal') helpModal: ModalDirective;

  @select(['app', 'editing']) readonly editing$: Observable<boolean>;
  @select(['app', 'advancedExpMode']) readonly advancedExpMode$: Observable<boolean>;
  @select(['app', 'tutorialMode']) readonly tutorialMode$: Observable<boolean>;
  private startEventProcessing = new Subject<L.LeafletEvent>();

  constructor(
    public appActions: AppActions,
    private ngRedux: NgRedux<IAppState>,
    private dbSrv: DbService,
    private editSrv: EditService,
    private geocodeSrv: GeocodeService,
    private mapSrv: MapService,
    private overpassSrv: OverpassService,
    private processSrv: ProcessService,
    private authSrv: AuthService,
  ) {
    if (isDevMode()) {
      console.log('WARNING: Ang. development mode is ', isDevMode());
    }
  }

  ngOnInit(): any {
    this.dbSrv.deleteExpiredDataIDB();
    this.dbSrv.deleteExpiredPTDataIDB().then(() => {
      console.log('LOG (app component) Successfully checked and deleted old items from IDB');
    }).catch((err) => {
      console.log('LOG (app component) Error in deleting old items from IDB');
      console.log(err);
    });
    this.dbSrv.getCompletelyDownloadedElementsId();
    this.dbSrv.getIdsQueriedRoutesForMaster();
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
    this.mapSrv.map.on('zoomend moveend', (event: L.LeafletEvent) => {
      this.startEventProcessing.next(event);
    });
    this.startEventProcessing.pipe(
        debounceTime(500),
        distinctUntilChanged()
      )
      .subscribe((event: L.LeafletEvent) => {
        this.processSrv.addPositionToUrlHash();
        this.overpassSrv.initDownloader(this.mapSrv.map);
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

  hideHelpModal(): void {
    this.helpModal.hide();
  }

  private showHelpModal(): void {
    this.helpModal.show();
  }

  startTutorials(): void {
    this.appActions.actToggleTutorialMode(true);
  }

  isAuthenticated(): void {
    return this.authSrv.oauth.authenticated();
  }
}
