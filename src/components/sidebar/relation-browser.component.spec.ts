import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditService } from '../../services/edit.service';
import { ProcessService } from '../../services/process.service';
import { StorageService } from '../../services/storage.service';
import { RelationBrowserComponent } from './relation-browser.component';

describe('RelationBrowserComponent', () => {
  let comp: RelationBrowserComponent;
  let fixture: ComponentFixture<RelationBrowserComponent>;

  beforeEach(() => {
    const processServiceStub = {
      refreshSidebarViews$: {
        subscribe: () => ({}),
      },
      exploreRelation: () => ({}),
      haveSameIds: () => ({}),
    };
    const storageServiceStub = {
      currentElement: {
        tags: {
          type: {},
        },
      },
      listOfVariants: {
        length: {},
      },
      elementsDownloaded: {
        has: () => ({}),
      },
      elementsMap: {
        get: () => ({
          members: {
            filter: () => ({}),
          },
        }),
      },
      idsHaveMaster: {
        has: () => ({}),
      },
    };
    const editServiceStub = {
      createMaster: () => ({}),
      changeRouteMasterMembers: () => ({}),
    };
    TestBed.configureTestingModule({
      declarations: [RelationBrowserComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: ProcessService, useValue: processServiceStub },
        { provide: StorageService, useValue: storageServiceStub },
        { provide: EditService, useValue: editServiceStub },
      ],
    });
    fixture = TestBed.createComponent(RelationBrowserComponent);
    comp = fixture.componentInstance;
  });

  it('can load instance', () => {
    expect(comp).toBeTruthy();
  });

  // it('listOfVariants defaults to: storageSrv.listOfVariants', () => {
  //   expect(comp.listOfVariants).toEqual(StorageService.listOfVariants);
  // });
  //
  // it('listOfMasters defaults to: storageSrv.listOfMasters', () => {
  //   expect(comp.listOfMasters).toEqual(StorageService.listOfMasters);
  // });
});
