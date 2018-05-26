import { Component, OnInit } from '@angular/core';

import { Map } from 'leaflet';

import { GeocodeService } from '../../services/geocode.service';
import { MapService } from '../../services/map.service';

@Component({
  providers: [],
  selector: 'navigator',
  styleUrls: [
    './navigator.component.less',
    '../../styles/main.less',
  ],
  templateUrl: './navigator.component.html',
})
export class NavigatorComponent implements OnInit {
  public address: string;

  private map: Map;

  constructor(
    private geocodeSrv: GeocodeService,
    private mapSrv: MapService,
  ) {
    this.address = '';
  }

  public ngOnInit(): void {
    this.mapSrv.disableMouseEvent('goto');
    this.mapSrv.disableMouseEvent('place-input');
    this.map = this.mapSrv.map;
  }

  public goto(): any {
    if (!this.address) {
      return;
    }
    this.geocodeSrv.geocode(this.address);
  }
}
