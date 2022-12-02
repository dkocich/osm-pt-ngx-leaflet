import { HttpClient } from '@angular/common/http';
import { GeocodeService } from './geocode.service';
import { MapService } from './map.service';

describe('GeocodeService', () => {
  let service: GeocodeService;
  let httpClient: HttpClient;
  let mapSrv: MapService;

  beforeEach(() => {
    service = new GeocodeService(httpClient, mapSrv);
  });

  it('works', () => {
    expect(1).toEqual(2);
  });
});
