import { NgRedux } from '@angular-redux/store';
import { BsModalService } from 'ngx-bootstrap';
import { AppActions } from '../store/app/actions';
import { IAppState } from '../store/model';
import { ErrorHighlightService } from './error-highlight.service';
import { MapService } from './map.service';
import { ProcessService } from './process.service';
import { StorageService } from './storage.service';

describe('ErrorHighlightService', () => {
  let service: ErrorHighlightService;
  let appActions: AppActions;
  let mapSrv: MapService;
  let modalService: BsModalService;
  let ngRedux: NgRedux<IAppState>;
  let processSrv: ProcessService;
  let storageSrv: StorageService;

  beforeEach(() => {
    service = new ErrorHighlightService(
      modalService,
      ngRedux,
      processSrv,
      appActions,
      mapSrv,
      storageSrv
    );
  });

  it('works', () => {
    expect(1).toEqual(2);
  });
});
