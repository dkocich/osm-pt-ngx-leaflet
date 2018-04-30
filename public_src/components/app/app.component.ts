import { Component, isDevMode, ViewChild } from '@angular/core';
import { CarouselConfig, ModalDirective } from 'ngx-bootstrap';

import * as L from 'leaflet';

import { GeocodeService } from '../../services/geocode.service';
import { LoadService } from '../../services/load.service';
import { MapService } from '../../services/map.service';
import { ProcessService } from '../../services/process.service';

import { AuthComponent } from '../auth/auth.component';
import { ToolbarComponent } from '../toolbar/toolbar.component';
import { EditService } from '../../services/edit.service';

import { IAppState } from '../../store/model';
import { NgRedux, select } from '@angular-redux/store';
import { Observable } from 'rxjs/Observable';

@Component({
  providers: [{ provide: CarouselConfig, useValue: { noPause: false } }],
  selector: 'app',
  styleUrls: [
    './app.component.less',
  ],
  templateUrl: './app.component.html',
})
export class AppComponent {
  public advancedMode: boolean = Boolean(localStorage.getItem('advancedMode'));

  @ViewChild(ToolbarComponent) public toolbarComponent: ToolbarComponent;
  @ViewChild(AuthComponent) public authComponent: AuthComponent;
  @ViewChild('helpModal') public helpModal: ModalDirective;

  @select(['app', 'editing']) public readonly editing$: Observable<boolean>;

  constructor(
    private ngRedux: NgRedux<IAppState>,
    private editSrv: EditService,
    private geocodeSrv: GeocodeService,
    private loadSrv: LoadService,
    private mapSrv: MapService,
    private processSrv: ProcessService,
  ) {
    if (isDevMode()) {
      console.log('WARNING: Ang. development mode is ', isDevMode());
    }
  }

  public ngOnInit(): any {
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
      this.geocodeSrv
        .getCurrentLocation()
        .subscribe(
          (location) => map.panTo([location.latitude, location.longitude]),
          (err) => console.error(err),
        );
    }
    this.toolbarComponent.Initialize();
  }

  public isLoading(): boolean {
    return this.loadSrv.isLoading();
  }

  public hideHelpModal(): void {
    this.helpModal.hide();
  }

  private showHelpModal(): void {
    this.helpModal.show();
  }

  private changeMode(): void {
    localStorage.setItem('advancedMode', JSON.stringify(this.advancedMode));
  }
}
