import { HttpClient } from '@angular/common/http';
import { ConfService } from './conf.service';
import { MapService } from './map.service';
import { StorageService } from './storage.service';

describe('MapService', () => {
  let service: MapService;
  let confSrv: ConfService;
  let httpClient: HttpClient;
  let storageSrv: StorageService;

  beforeEach(() => {
    service = new MapService(confSrv, httpClient, storageSrv);
  });

  it('works', () => {
    expect(1).toEqual(2);
  });
});
