import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { WarnService } from './warn.service';

describe('WarnService', () => {
  let service: WarnService;
  let toastrSrv: ToastrService;
  let translateSrv: TranslateService;

  beforeEach(() => {
    service = new WarnService(toastrSrv, translateSrv);
  });

  it('works', () => {
    expect(1).toEqual(2);
  });
});
