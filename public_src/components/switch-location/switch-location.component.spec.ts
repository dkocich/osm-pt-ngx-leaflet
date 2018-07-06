import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SwitchLocationComponent } from './switch-location.component';

describe('SwitchLocationComponent', () => {
  let component: SwitchLocationComponent;
  let fixture: ComponentFixture<SwitchLocationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SwitchLocationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SwitchLocationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
