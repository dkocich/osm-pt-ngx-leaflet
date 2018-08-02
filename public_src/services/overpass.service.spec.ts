import { OverpassService } from './overpass.service';
import { AuthService } from './auth.service';
import { HttpClient } from '@angular/common/http';
import { DbService } from './db.service';
import { ProcessService } from './process.service';
import { StorageService } from './storage.service';
import { MapService } from './map.service';
import { WarnService } from './warn.service';
import { IAppState } from '../store/model';
import { RouteWizardService } from './route-wizard.service';
import { AppActions } from '../store/app/actions';
import { RouteMasterWizardService } from './route-master-wizard.service';
import { NgRedux } from '@angular-redux/store';
import { ErrorHighlightService } from './error-highlight.service';

describe('OverpassService', () => {
  'use strict';
  let service: OverpassService;
  let authSrv: AuthService;
  let dbSrv: DbService;
  let httpClient: HttpClient;
  let processSrv: ProcessService;
  let storageSrv: StorageService;
  let mapSrv: MapService;
  let warnSrv: WarnService;
  let ngRedux: NgRedux<IAppState>;
  let appActions: AppActions;
  let routeWizardSrv: RouteWizardService;
  let routeMasterWizardSrv: RouteMasterWizardService;
  let errorHighlightSrv: ErrorHighlightService;

  beforeEach(() => {
    service = new OverpassService(
      authSrv, dbSrv, errorHighlightSrv, httpClient, processSrv, storageSrv, mapSrv, warnSrv, ngRedux, appActions,
      routeWizardSrv,
      routeMasterWizardSrv);
  });

  it('works', () => {
    expect(1).toEqual(2);
  });

});
