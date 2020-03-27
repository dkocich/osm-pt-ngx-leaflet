import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { NgRedux } from '@angular-redux/store';
import { AppActions } from '../../store/app/actions';
import { ProcessService } from '../../services/process.service';
import { StorageService } from '../../services/storage.service';
import { BeginnerComponent } from './beginner.component';
import { PtTags } from '../../core/ptTags.class';

describe('BeginnerComponent', () => {
  let comp: BeginnerComponent;
  let fixture: ComponentFixture<BeginnerComponent>;

  beforeEach(() => {
    const ngReduxStub = {
      getState: () => ({}),
    };
    const appActionsStub = {
      actSetBeginnerView: () => ({}),
    };
    const processServiceStub = {
      refreshSidebarView: () => ({}),
      exploreStop: () => ({}),
    };
    const storageServiceStub = {
      currentElement: {},
      selectedStopBeginnerMode: {},
    };
    TestBed.configureTestingModule({
      declarations: [BeginnerComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: NgRedux, useValue: ngReduxStub },
        { provide: AppActions, useValue: appActionsStub },
        { provide: ProcessService, useValue: processServiceStub },
        { provide: StorageService, useValue: storageServiceStub },
      ],
    });
    fixture = TestBed.createComponent(BeginnerComponent);
    comp = fixture.componentInstance;
  });

  it('can load instance', () => {
    expect(comp).toBeTruthy();
  });

  it('expectedKeys defaults to: PtTags.expectedKeys', () => {
    expect(comp.expectedKeys).toEqual(PtTags.expectedKeys);
  });

  describe('back', () => {
    it('makes expected calls', () => {
      const appActionsStub: AppActions = fixture.debugElement.injector.get(AppActions);
      const processServiceStub: ProcessService = fixture.debugElement.injector.get(ProcessService);
      spyOn(appActionsStub, 'actSetBeginnerView');
      spyOn(processServiceStub, 'refreshSidebarView');
      spyOn(processServiceStub, 'exploreStop');
      comp.back();
      expect(appActionsStub.actSetBeginnerView).toHaveBeenCalled();
      expect(processServiceStub.refreshSidebarView).toHaveBeenCalled();
      expect(processServiceStub.exploreStop).toHaveBeenCalled();
    });
  });

});
