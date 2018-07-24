import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap';
import { EditService } from '../../services/edit.service';
import { StorageService } from '../../services/storage.service';
import { MapService } from '../../services/map.service';
import { WarnService } from '../../services/warn.service';
import { IPtRelation } from '../../core/ptRelation.interface';
import { ModalComponent } from './modal.component';

describe('ModalComponent', () => {
  let comp: ModalComponent;
  let fixture: ComponentFixture<ModalComponent>;

  beforeEach(() => {
    const bsModalRefStub = {
      hide: () => ({}),
    };
    const editServiceStub = {
      addChange: () => ({}),
    };
    const storageServiceStub = {
      nameErrorsObj: {
        corrected: {},
      },
      currentIndex: {},
      refreshErrorObjects: {
        emit: () => ({}),
      },
      wayErrorsObj: {
        corrected: {},
      },
      elementsRendered: {
        delete: () => ({}),
      },
      elementsMap: {
        get: () => ({}),
      },
      currentElement: {
        tags: {},
      },
      refErrorsObj: {
        corrected: {},
      },
    };
    const mapServiceStub = {
      getPopUpFromArray: () => ({}),
      currentPopUpFeatureId: {},
      popUpArr: {
        filter: () => ({}),
      },
      popUpLayerGroup: {
        getLayers: () => ({
          setContent: () => ({}),
        }),
      },
      map: {
        removeLayer: () => ({}),
        eachLayer: () => ({}),
      },
      renderTransformedGeojsonData: () => ({}),
      getFeatureIdFromMarker: () => ({}),
    };
    const warnServiceStub = {
      showGenericSuccess: () => ({}),
    };
    TestBed.configureTestingModule({
      declarations: [ModalComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: BsModalRef, useValue: bsModalRefStub },
        { provide: EditService, useValue: editServiceStub },
        { provide: StorageService, useValue: storageServiceStub },
        { provide: MapService, useValue: mapServiceStub },
        { provide: WarnService, useValue: warnServiceStub },
      ],
    });
    fixture = TestBed.createComponent(ModalComponent);
    comp = fixture.componentInstance;
  });

  it('can load instance', () => {
    expect(comp).toBeTruthy();
  });

  it('removedNearbySuggestions defaults to: []', () => {
    expect(comp.removedNearbySuggestions).toEqual([]);
  });

  it('removedMissingSuggestions defaults to: []', () => {
    expect(comp.removedMissingSuggestions).toEqual([]);
  });

  it('addedMissingSuggestionsRefs defaults to: []', () => {
    expect(comp.addedMissingSuggestionsRefs).toEqual([]);
  });

  it('addedFromNearbySuggestionsRefs defaults to: []', () => {
    expect(comp.addedFromNearbySuggestionsRefs).toEqual([]);
  });

  it('newAddedRefs defaults to: []', () => {
    expect(comp.newAddedRefs).toEqual([]);
  });

  describe('saveWayError', () => {
    it('makes expected calls', () => {
      const bsModalRefStub: BsModalRef = fixture.debugElement.injector.get(BsModalRef);
      const mapServiceStub: MapService = fixture.debugElement.injector.get(MapService);
      const warnServiceStub: WarnService = fixture.debugElement.injector.get(WarnService);
      spyOn(bsModalRefStub, 'hide');
      spyOn(mapServiceStub, 'getPopUpFromArray');
      spyOn(warnServiceStub, 'showGenericSuccess');
      comp.saveWayError();
      expect(bsModalRefStub.hide).toHaveBeenCalled();
      expect(mapServiceStub.getPopUpFromArray).toHaveBeenCalled();
      expect(warnServiceStub.showGenericSuccess).toHaveBeenCalled();
    });
  });

  describe('close', () => {
    it('makes expected calls', () => {
      const bsModalRefStub: BsModalRef = fixture.debugElement.injector.get(BsModalRef);
      spyOn(bsModalRefStub, 'hide');
      comp.close();
      expect(bsModalRefStub.hide).toHaveBeenCalled();
    });
  });

});
