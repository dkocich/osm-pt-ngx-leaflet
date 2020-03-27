import { OverpassService } from './overpass.service';
import { AuthService } from './auth.service';
import { HttpClient } from '@angular/common/http';
import { DbService } from './db.service';
import { ProcessService } from './process.service';
import { StorageService } from './storage.service';
import { MapService } from './map.service';
import { WarnService } from './warn.service';

describe('OverpassService', () => {
  let service: OverpassService;
  let authSrv: AuthService;
  let dbSrv: DbService;
  let httpClient: HttpClient;
  let processSrv: ProcessService;
  let storageSrv: StorageService;
  let mapSrv: MapService;
  let warnSrv: WarnService;

  beforeEach(() => {
    service = new OverpassService(
      authSrv, dbSrv, httpClient, processSrv, storageSrv, mapSrv, warnSrv);
  });

  it('works', () => {
    expect(1).toEqual(2);
  });

});
