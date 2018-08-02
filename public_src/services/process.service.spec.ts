import { TestBed, inject } from '@angular/core/testing';

import { ProcessService } from './process.service';

describe('ProcessService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProcessService]
    });
  });

  it('should be created', inject([ProcessService], (service: ProcessService) => {
    expect(service).toBeTruthy();
  }));
});
