import { Component } from '@angular/core';
import { SwitchLocationService } from '../../services/switch-location.service';
import { MapService } from '../../services/map.service';
import { NgRedux } from '@angular-redux/store';
import { IAppState } from '../../store/model';
import { ErrorHighlightService } from '../../services/error-highlight.service';
import { AppActions } from '../../store/app/actions';

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
  constructor(private mapSrv: MapService,
              private ngRedux: NgRedux<IAppState>,
              private switchLocationSrv: SwitchLocationService,
              private errorHighlightSrv: ErrorHighlightService,
              public appActions: AppActions) {
  }

  /***
   * Moves to next location
   */
  private nextLocation(): void {
    this.errorHighlightSrv.nextLocation();
  }

  /***
   * Moves to prev location
   */
  private previousLocation(): void {
    this.errorHighlightSrv.previousLocation();
  }

  /***
   * Quits mode
   */
  private quit(): void {
    this.errorHighlightSrv.quit();
  }
}
