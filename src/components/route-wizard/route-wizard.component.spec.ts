import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouteWizardComponent } from './route-wizard.component';

describe('RouteModalComponent', () => {
  let component: RouteWizardComponent;
  let fixture: ComponentFixture<RouteWizardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RouteWizardComponent ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RouteWizardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
