import { Component, OnInit, ViewChildren } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap';
import { EditService } from '../../services/edit.service';
import { StorageService } from '../../services/storage.service';
import { MapService } from '../../services/map.service';
import { WarnService } from '../../services/warn.service';
import * as L from 'leaflet';
import { OverpassService } from '../../services/overpass.service';

@Component({
  selector: 'route-modal',
  styleUrls: [
    './route-modal.component.less',
    '../../styles/main.less',
  ],
  templateUrl: './route-modal.component.html',
})

export class RouteModalComponent implements OnInit {
  constructor(public bsModalRef: BsModalRef,
              // private editSrv: EditService,
              private storageSrv: StorageService,
              private mapSrv: MapService,
              private warnSrv: WarnService,
              private overpassSrv: OverpassService) {
  }


  public ngOnInit(): void {
    // this.mapSrv.map.remove();
    // document.getElementById('map').remove();
    let x = this.mapSrv.map.getContainer();
    document.getElementById('map2').appendChild(x);

    //
    // L.control.zoom({ position: 'topright' }).addTo(map2);
    // L.control.layers(this.mapSrv.baseMaps).addTo(map2);
    // L.control.scale().addTo(map2);
    //
    // // this.mapSrv.map = map;
    // // const map: L.Map('map',);
    //
    // map2.invalidateSize();

  }

  private close(): any {
  this.bsModalRef.hide();
  let x = this.mapSrv.map.getContainer();
  document.getElementById('map-c').appendChild(x);
  }

  private findMissingRoutes(): any {
    if (this.mapSrv.map.getZoom() > 8) {
      this.overpassSrv.requestNewOverpassData2();
    } else {
      alert('Not sufficient zoom level');
    }
  }
}
