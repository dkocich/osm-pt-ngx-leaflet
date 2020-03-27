import { WarnService } from './warn.service';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';

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
