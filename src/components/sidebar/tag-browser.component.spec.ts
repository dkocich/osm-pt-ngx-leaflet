import { ChangeDetectorRef, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PtTags } from '../../core/ptTags.class';
import { EditService } from '../../services/edit.service';
import { ProcessService } from '../../services/process.service';
import { StorageService } from '../../services/storage.service';
import { TagBrowserComponent } from './tag-browser.component';

describe('TagBrowserComponent', () => {
  let comp: TagBrowserComponent;
  let fixture: ComponentFixture<TagBrowserComponent>;

  beforeEach(() => {
    const changeDetectorRefStub = {
      detectChanges: () => ({}),
      markForCheck: () => ({}),
    };
    const editServiceStub = {
      addChange: () => ({}),
    };
    const processServiceStub = {
      refreshSidebarViews$: {
        subscribe: () => ({}),
      },
    };
    const storageServiceStub = {
      currentElement: {
        tags: {},
      },
    };
    TestBed.configureTestingModule({
      declarations: [TagBrowserComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: ChangeDetectorRef, useValue: changeDetectorRefStub },
        { provide: EditService, useValue: editServiceStub },
        { provide: ProcessService, useValue: processServiceStub },
        { provide: StorageService, useValue: storageServiceStub },
      ],
    });
    fixture = TestBed.createComponent(TagBrowserComponent);
    comp = fixture.componentInstance;
  });

  it('can load instance', () => {
    expect(comp).toBeTruthy();
  });

  it('expectedKeys defaults to: PtTags.expectedKeys', () => {
    expect(comp.expectedKeys).toEqual(PtTags.expectedKeys);
  });

  it('expectedValues defaults to: PtTags.expectedValues', () => {
    expect(comp.expectedValues).toEqual(PtTags.expectedValues);
  });
});
