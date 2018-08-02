import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { EditService } from '../../services/edit.service';
import { MapService } from '../../services/map.service';
import { StorageService } from '../../services/storage.service';
import { AppActions } from '../../store/app/actions';
import { EditorComponent } from './editor.component';

describe('EditorComponent', () => {
  let comp: EditorComponent;
  let fixture: ComponentFixture<EditorComponent>;

  beforeEach(() => {
    const authServiceStub = {
      oauth: {
        authenticated: () => ({}),
      },
    };
    const editServiceStub = {
      currentTotalSteps: {
        subscribe: () => ({}),
        emit: () => ({}),
      },
      createElement: () => ({}),
      continueEditing: () => ({}),
      step: () => ({}),
      editingMode: {
        emit: () => ({}),
      },
    };
    const mapServiceStub = {
      map: {
        on: () => ({}),
      },
      disableMouseEvent: () => ({}),
      editingMode: {},
    };
    const storageServiceStub = {
      getLocalStorageItem: () => ({}),
      setLocalStorageItem: () => ({}),
      edits: {},
    };
    const appActionsStub = {};
    TestBed.configureTestingModule({
      declarations: [EditorComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: AuthService, useValue: authServiceStub },
        { provide: EditService, useValue: editServiceStub },
        { provide: MapService, useValue: mapServiceStub },
        { provide: StorageService, useValue: storageServiceStub },
        { provide: AppActions, useValue: appActionsStub },
      ],
    });
    fixture = TestBed.createComponent(EditorComponent);
    comp = fixture.componentInstance;
  });

  it('can load instance', () => {
    expect(comp).toBeTruthy();
  });

  it('totalEditSteps defaults to: 0', () => {
    expect(comp.totalEditSteps).toEqual(0);
  });

  it('currentEditStep defaults to: 0', () => {
    expect(comp.currentEditStep).toEqual(0);
  });

  describe('ngOnInit', () => {
    it('makes expected calls', () => {
      const editServiceStub: EditService = fixture.debugElement.injector.get(EditService);
      spyOn(editServiceStub, 'createElement');
      comp.ngOnInit();
      expect(editServiceStub.createElement).toHaveBeenCalled();
    });
  });

  describe('ngAfterViewInit', () => {
    it('makes expected calls', () => {
      const storageServiceStub: StorageService = fixture.debugElement.injector.get(StorageService);
      spyOn(storageServiceStub, 'getLocalStorageItem');
      spyOn(storageServiceStub, 'setLocalStorageItem');
      comp.ngAfterViewInit();
      expect(storageServiceStub.getLocalStorageItem).toHaveBeenCalled();
      expect(storageServiceStub.setLocalStorageItem).toHaveBeenCalled();
    });
  });

  describe('continueEditing', () => {
    it('makes expected calls', () => {
      const editServiceStub: EditService = fixture.debugElement.injector.get(EditService);
      const storageServiceStub: StorageService = fixture.debugElement.injector.get(StorageService);
      spyOn(editServiceStub, 'continueEditing');
      spyOn(storageServiceStub, 'getLocalStorageItem');
      comp.continueEditing();
      expect(editServiceStub.continueEditing).toHaveBeenCalled();
      expect(storageServiceStub.getLocalStorageItem).toHaveBeenCalled();
    });
  });

});
