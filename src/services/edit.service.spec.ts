import { EditService } from './edit.service';
import { MapService } from './map.service';
import { ProcessService } from './process.service';
import { StorageService } from './storage.service';

describe('EditService', () => {
  let service: EditService;
  let mapSrv: MapService;
  let processSrv: ProcessService;
  let storageSrv: StorageService;

  beforeEach(() => {
    service = new EditService(mapSrv, processSrv, storageSrv);
  });

  it('works', () => {
    expect(1).toEqual(2);
  });
});
