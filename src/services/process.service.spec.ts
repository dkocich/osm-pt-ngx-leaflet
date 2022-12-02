import { NgRedux } from '@angular-redux/store';
import { AppActions } from '../store/app/actions';
import { IAppState } from '../store/model';
import { MapService } from './map.service';
import { ProcessService } from './process.service';
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
