import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { LangComponent } from './lang.component';

describe('LangComponent', () => {
  let comp: LangComponent;
  let fixture: ComponentFixture<LangComponent>;

  beforeEach(() => {
    const translateServiceStub = {
      setDefaultLang: () => ({}),
      defaultLang: {},
      use: () => ({}),
    };
    TestBed.configureTestingModule({
      declarations: [LangComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: TranslateService, useValue: translateServiceStub },
      ],
    });
    spyOn(LangComponent.prototype, 'switchLanguage');
    fixture = TestBed.createComponent(LangComponent);
    comp = fixture.componentInstance;
  });

  it('can load instance', () => {
    expect(comp).toBeTruthy();
  });

  describe('constructor', () => {
    it('makes expected calls', () => {
      expect(LangComponent.prototype.switchLanguage).toHaveBeenCalled();
    });
  });
});
