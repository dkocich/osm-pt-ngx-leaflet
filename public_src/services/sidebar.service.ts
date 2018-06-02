import { Injectable } from '@angular/core';
import { MapService } from './map.service';
import { AppActions } from '../store/app/actions';
import { NgRedux } from '@angular-redux/store';
import { IAppState } from '../store/model';

@Injectable()
export class SidebarService {
  constructor(private mapSrv: MapService, public appActions: AppActions,  private ngRedux: NgRedux<IAppState>) {
    this.mapSrv.markerClick.subscribe((data) => {
      if (!(this.ngRedux.getState()['app']['errorCorrectionMode'] === 'element-selected')) {
      this.appActions.actSetBeginnerView('element-selected');
      }
      });
  }
}
