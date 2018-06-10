import { DbService } from './db.service';
import { StorageService } from './storage.service';

describe('DbService', () => {
  let service: DbService;
  let storageSrv: StorageService;

  beforeEach(() => {
    service = new DbService(storageSrv);
  });

  it('works', () => {
    expect(1).toEqual(2);
  });

});
