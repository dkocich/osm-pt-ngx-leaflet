import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { MapService } from '../../services/map.service';
import { OverpassService } from '../../services/overpass.service';
import { StorageService } from '../../services/storage.service';
import { TransporterComponent } from './transporter.component';

describe('TransporterComponent', () => {
  let comp: TransporterComponent;
  let fixture: ComponentFixture<TransporterComponent>;

  beforeEach(() => {
    const authServiceStub = {
      oauth: {
        authenticated: () => ({}),
      },
    };
    const mapServiceStub = {
      disableMouseEvent: () => ({}),
    };
    const overpassServiceStub = {
      requestOverpassData: () => ({}),
      uploadData: () => ({}),
    };
    const storageServiceStub = {
      editsChanged: {
        subscribe: () => ({}),
      },
      edits: {
        length: {},
      },
    };
    TestBed.configureTestingModule({
      declarations: [TransporterComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: AuthService, useValue: authServiceStub },
        { provide: MapService, useValue: mapServiceStub },
        { provide: OverpassService, useValue: overpassServiceStub },
        { provide: StorageService, useValue: storageServiceStub },
      ],
    });
    fixture = TestBed.createComponent(TransporterComponent);
    comp = fixture.componentInstance;
  });

  it('can load instance', () => {
    expect(comp).toBeTruthy();
  });

  it('favoriteQueries defaults to: []', () => {
    expect(comp.favoriteQueries).toEqual([]);
  });

  // it('queryShort defaults to: favoriteQueries.short', () => {
  //   expect(comp.queryShort).toEqual(favoriteQueries.short);
  // });

  describe('ngOnInit', () => {
    it('makes expected calls', () => {
      const mapServiceStub: MapService = fixture.debugElement.injector.get(MapService);
      spyOn(mapServiceStub, 'disableMouseEvent');
      comp.ngOnInit();
      expect(mapServiceStub.disableMouseEvent).toHaveBeenCalled();
    });
  });

  describe('verifyUpload', () => {
    it('makes expected calls', () => {
      const overpassServiceStub: OverpassService = fixture.debugElement.injector.get(OverpassService);
      spyOn(overpassServiceStub, 'uploadData');
      comp.verifyUpload();
      expect(overpassServiceStub.uploadData).toHaveBeenCalled();
    });
  });

  describe('uploadData', () => {
    it('makes expected calls', () => {
      const overpassServiceStub: OverpassService = fixture.debugElement.injector.get(OverpassService);
      spyOn(overpassServiceStub, 'uploadData');
      comp.uploadData();
      expect(overpassServiceStub.uploadData).toHaveBeenCalled();
    });
  });

});
