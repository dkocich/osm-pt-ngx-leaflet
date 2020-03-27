import { ProcessService } from './process.service';
import { NgRedux } from '@angular-redux/store';
import { IAppState } from '../store/model';
import { AppActions } from '../store/app/actions';
import { MapService } from './map.service';
import { StorageService } from './storage.service';

describe('ProcessService', () => {
  let service: ProcessService;
  let ngRedux: NgRedux<IAppState>;
  let appActions: AppActions;
  let mapSrv: MapService;
  let storageSrv: StorageService;

  beforeEach(() => {
    service = new ProcessService(ngRedux, appActions, mapSrv, storageSrv);
  });

  it('works', () => {
    expect(1).toEqual(2);
  });

});
