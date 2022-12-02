import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppActions } from '../../store/app/actions';
import { SettingsComponent } from './settings.component';

describe('SettingsComponent', () => {
  let comp: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;

  beforeEach(() => {
    const appActionsStub = {
      actSetGoodConnectMode: () => ({}),
      actSetAdvancedExpMode: () => ({}),
    };
    TestBed.configureTestingModule({
      declarations: [SettingsComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [{ provide: AppActions, useValue: appActionsStub }],
    });
    fixture = TestBed.createComponent(SettingsComponent);
    comp = fixture.componentInstance;
  });

  it('can load instance', () => {
    expect(comp).toBeTruthy();
  });
});
