import { TestBed, inject } from '@angular/core/testing';

import { WarnService } from './warn.service';

describe('WarnService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [WarnService],
    });
  });

  it('should be created', inject([WarnService], (service: WarnService) => {
    expect(service).toBeTruthy();
  }));
});
