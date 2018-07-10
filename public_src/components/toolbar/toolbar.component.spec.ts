import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ConfService } from '../../services/conf.service';
import { MapService } from '../../services/map.service';
import { OverpassService } from '../../services/overpass.service';
import { ProcessService } from '../../services/process.service';
import { StorageService } from '../../services/storage.service';
import { ToolbarComponent } from './toolbar.component';

describe('ToolbarComponent', () => {
  let comp: ToolbarComponent;
  let fixture: ComponentFixture<ToolbarComponent>;

  beforeEach(() => {
    const confServiceStub = {
      cfgFilterLines: {},
    };
    const mapServiceStub = {
      highlightTypeEmitter: {
        subscribe: () => ({}),
      },
      disableMouseEvent: () => ({}),
      highlightIsActive: () => ({}),
      map: {
        on: () => ({}),
        off: () => ({}),
        getBounds: () => ({
          getWest: () => ({}),
          getEast: () => ({}),
          getNorth: () => ({}),
          getSouth: () => ({}),
        }),
        getZoom: () => ({}),
      },
      highlightType: {},
      clearHighlight: () => ({}),
    };
    const overpassServiceStub = {
      initDownloader: () => ({}),
    };
    const processServiceStub = {
      refreshSidebarViews$: {
        subscribe: () => ({}),
      },
      exploreRelation: () => ({}),
      cancelSelection: () => ({}),
      zoomToElement: () => ({}),
    };
    const storageServiceStub = {
      currentElement: {},
      stats: {
        subscribe: () => ({}),
      },
      elementsMap: {
        get: () => ({}),
      },
    };
    const iOsmElementStub = {};
    TestBed.configureTestingModule({
      declarations: [ToolbarComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: ConfService, useValue: confServiceStub },
        { provide: MapService, useValue: mapServiceStub },
        { provide: OverpassService, useValue: overpassServiceStub },
        { provide: ProcessService, useValue: processServiceStub },
        { provide: StorageService, useValue: storageServiceStub },
        // { provide: IOsmElement, useValue: iOsmElementStub },
      ],
    });
    fixture = TestBed.createComponent(ToolbarComponent);
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

  describe('highlightIsActive', () => {
    it('makes expected calls', () => {
      const mapServiceStub: MapService = fixture.debugElement.injector.get(MapService);
      spyOn(mapServiceStub, 'highlightIsActive');
      comp.highlightIsActive();
      expect(mapServiceStub.highlightIsActive).toHaveBeenCalled();
    });
  });

});
