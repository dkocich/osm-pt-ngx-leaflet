import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GeocodeService } from '../../services/geocode.service';
import { MapService } from '../../services/map.service';
import { NavigatorComponent } from './navigator.component';

describe('NavigatorComponent', () => {
  let comp: NavigatorComponent;
  let fixture: ComponentFixture<NavigatorComponent>;

  beforeEach(() => {
    const geocodeServiceStub = {
      geocode: () => ({}),
    };
    const mapServiceStub = {
      disableMouseEvent: () => ({}),
      map: {},
    };
    TestBed.configureTestingModule({
      declarations: [NavigatorComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: GeocodeService, useValue: geocodeServiceStub },
        { provide: MapService, useValue: mapServiceStub },
      ],
    });
    fixture = TestBed.createComponent(NavigatorComponent);
    comp = fixture.componentInstance;
  });

  it('can load instance', () => {
    expect(comp).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('makes expected calls', () => {
      const mapServiceStub: MapService = fixture.debugElement.injector.get(MapService);
      spyOn(mapServiceStub, 'disableMouseEvent');
      comp.ngOnInit();
      expect(mapServiceStub.disableMouseEvent).toHaveBeenCalled();
    });
  });

});
