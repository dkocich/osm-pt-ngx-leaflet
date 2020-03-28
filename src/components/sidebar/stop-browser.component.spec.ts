import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DragulaService } from 'ng2-dragula';
import { EditService } from '../../services/edit.service';
import { MapService } from '../../services/map.service';
import { ProcessService } from '../../services/process.service';
import { StorageService } from '../../services/storage.service';
import { StopBrowserComponent } from './stop-browser.component';

describe('StopBrowserComponent', () => {
  let comp: StopBrowserComponent;
  let fixture: ComponentFixture<StopBrowserComponent>;

  beforeEach(() => {
    const editServiceStub = {
      reorderMembers: () => ({}),
      addChange: () => ({}),
    };
    const mapServiceStub = {};
    const processServiceStub = {
      showStopsForRoute$: {
        subscribe: () => ({}),
      },
      refreshSidebarViews$: {
        subscribe: () => ({}),
      },
      activateFilteredStopView: () => ({}),
      exploreStop: () => ({}),
      haveSameIds: () => ({}),
    };
    const storageServiceStub = {
      listOfStopsForRoute: {},
      currentElement: {},
      elementsDownloaded: {
        has: () => ({}),
      },
    };
    const dragulaServiceStub = {
      drop: {
        subscribe: () => ({}),
      },
    };
    const iPtRelationStub = {};
    const iPtStopStub = {};
    TestBed.configureTestingModule({
      declarations: [StopBrowserComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: EditService, useValue: editServiceStub },
        { provide: MapService, useValue: mapServiceStub },
        { provide: ProcessService, useValue: processServiceStub },
        { provide: StorageService, useValue: storageServiceStub },
        { provide: DragulaService, useValue: dragulaServiceStub },
        // { provide: IPtRelation, useValue: iPtRelationStub },
        // { provide: IPtStop, useValue: iPtStopStub },
      ],
    });
    fixture = TestBed.createComponent(StopBrowserComponent);
    comp = fixture.componentInstance;
  });

  it('can load instance', () => {
    expect(comp).toBeTruthy();
  });

  // it('listOfStopsForRoute defaults to: storageSrv.listOfStopsForRoute', () => {
  //   expect(comp.listOfStopsForRoute).toEqual(storageSrv.listOfStopsForRoute);
  // });
  //
  // it('listOfStops defaults to: storageSrv.listOfStops', () => {
  //   expect(comp.listOfStops).toEqual(storageSrv.listOfStops);
  // });

});
