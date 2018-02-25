import { Component } from '@angular/core';
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
export class NavigatorComponent {
  public address: string;

  private map: Map;

  constructor(
    private geocodeSrv: GeocodeService,
    private mapSrv: MapService,
  ) {
    this.address = '';
  }

  ngOnInit(): void {
    this.mapSrv.disableMouseEvent('goto');
    this.mapSrv.disableMouseEvent('place-input');
    this.map = this.mapSrv.map;
  }

  public goto(): any {
    if (!this.address) {
      return;
    }

    this.geocodeSrv.geocode(this.address).subscribe(
      (location) => {
        this.map.fitBounds(location.viewBounds, {});
        this.address = location.address;
      },
      (error) => console.error(error),
    );
  }
}
