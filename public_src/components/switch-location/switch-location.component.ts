import { IOsmElement } from '../../core/osmElement.interface';
import { Component, OnInit, ViewChild } from '@angular/core';
import { SwitchLocationService } from '../../services/switch-location.service';
import { MapService } from '../../services/map.service';
import * as L from 'leaflet';
import {NgRedux} from '@angular-redux/store';
import {IAppState} from '../../store/model';
import {ErrorHighlightService} from '../../services/error-highlight.service';

@Component({
  providers: [],
  selector: 'switch-location',
  styleUrls: [
    './switch-location.component.less',
    '../../styles/main.less',
  ],
  templateUrl: './switch-location.component.html',
})
export class SwitchLocationComponent  {
  constructor(private switchlocationSrv: SwitchLocationService, mapSrv: MapService, private ngRedux: NgRedux<IAppState>,  private switchLocationSrv: SwitchLocationService, private errorHighlightSrv: ErrorHighlightService) {
  }
  private nextLocation(): void {
    this.errorHighlightSrv.nextLocation();
  }
  private previousLocation(): void {
    this.errorHighlightSrv.previousLocation();
  }
  private toggleswitch(): void {
    // this.switchLocationSrv.switchlocationModeOn();
  }
  private quit(): void {
    this.errorHighlightSrv.quit();
  }
}
