import { BsModalService } from 'ngx-bootstrap';
import { MapService } from './map.service';
import { ProcessService } from './process.service';
import { RouteWizardService } from './route-wizard.service';
import { StorageService } from './storage.service';

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
