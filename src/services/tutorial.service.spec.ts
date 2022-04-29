import { inject, TestBed } from '@angular/core/testing';
import { TutorialService } from './tutorial.service';

describe('TutorialService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TutorialService],
    });
  });

  it('should be created', inject([TutorialService], (service: TutorialService) => {
    expect(service).toBeTruthy();
  }));
});
