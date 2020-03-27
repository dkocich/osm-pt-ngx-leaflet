import { RouteWizardService } from './route-wizard.service';
import { StorageService } from './storage.service';
import { MapService } from './map.service';
import { BsModalService } from 'ngx-bootstrap';
import { ProcessService } from './process.service';

describe('RouteWizardService', () => {
  let service: RouteWizardService;
  let mapSrv: MapService;
  let modalService: BsModalService;
  let processSrv: ProcessService;
  let storageSrv: StorageService;
  beforeEach(() => {
    service = new RouteWizardService(storageSrv, mapSrv, modalService, processSrv);
  });

  it('works', () => {
    expect(1).toEqual(2);
  });

});
