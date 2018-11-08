import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ExpertComponent } from './expert.component';

describe('ExpertComponent', () => {
  let comp: ExpertComponent;
  let fixture: ComponentFixture<ExpertComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ExpertComponent],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(ExpertComponent);
    comp = fixture.componentInstance;
  });

  it('can load instance', () => {
    expect(comp).toBeTruthy();
  });

});
