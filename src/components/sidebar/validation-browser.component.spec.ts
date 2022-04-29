import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ValidationBrowserComponent } from './validation-browser.component';

describe('ValidationBrowserComponent', () => {
  let component: ValidationBrowserComponent;
  let fixture: ComponentFixture<ValidationBrowserComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ValidationBrowserComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ValidationBrowserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
