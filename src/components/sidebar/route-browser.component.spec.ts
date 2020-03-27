import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { EditService } from '../../services/edit.service';
import { MapService } from '../../services/map.service';
import { OverpassService } from '../../services/overpass.service';
import { ProcessService } from '../../services/process.service';
import { StorageService } from '../../services/storage.service';
import { RouteBrowserComponent } from './route-browser.component';

describe('RouteBrowserComponent', () => {
  let comp: RouteBrowserComponent;
  let fixture: ComponentFixture<RouteBrowserComponent>;

  beforeEach(() => {
    const editServiceStub = {
      redrawMembersHighlight: () => ({}),
      createRoute: () => ({}),
    };
    const mapServiceStub = {
      membersEditing: {},
      clearCircleHighlight: () => ({}),
      map: {
        getBounds: () => ({
          contains: () => ({}),
        }),
      },
    };
    const overpassServiceStub = {
      getRouteMasters: () => ({}),
    };
    const processServiceStub = {
      showRelationsForStop$: {
        subscribe: () => ({}),
      },
      refreshSidebarViews$: {
        subscribe: () => ({}),
      },
      refreshMasters: {
        subscribe: () => ({}),
      },
      activateFilteredRouteView: () => ({}),
      exploreRelation: () => ({}),
      exploreMaster: () => ({}),
      haveSameIds: () => ({}),
    };
    const storageServiceStub = {
      listOfRelationsForStop: {},
      currentElement: {},
      idsHaveMaster: {
        has: () => ({}),
      },
      elementsDownloaded: {
        has: () => ({}),
      },
      queriedMasters: {
        has: () => ({}),
      },
      elementsMap: {
        get: () => ({
          members: {},
          lat: {},
          lon: {},
        }),
        has: () => ({}),
      },
    };
    TestBed.configureTestingModule({
      declarations: [RouteBrowserComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: EditService, useValue: editServiceStub },
        { provide: MapService, useValue: mapServiceStub },
        { provide: OverpassService, useValue: overpassServiceStub },
        { provide: ProcessService, useValue: processServiceStub },
        { provide: StorageService, useValue: storageServiceStub },
      ],
    });
    fixture = TestBed.createComponent(RouteBrowserComponent);
    comp = fixture.componentInstance;
  });

  it('can load instance', () => {
    expect(comp).toBeTruthy();
  });

  // it('listOfMasters defaults to: storageSrv.listOfMasters', () => {
  //   expect(comp.listOfMasters).toEqual(storageSrv.listOfMasters);
  // });
  //
  // it('listOfRelations defaults to: storageSrv.listOfRelations', () => {
  //   expect(comp.listOfRelations).toEqual(storageSrv.listOfRelations);
  // });
  //
  // it('listOfRelationsForStop defaults to: storageSrv.listOfRelationsForStop', () => {
  //   expect(comp.listOfRelationsForStop).toEqual(storageSrv.listOfRelationsForStop);
  // });

  it('membersEditing defaults to: false', () => {
    expect(comp.membersEditing).toEqual(false);
  });

});
