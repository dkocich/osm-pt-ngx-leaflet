import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component, EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { select } from '@angular-redux/store';

import { Observable } from 'rxjs';

import { EditService } from '../../../../services/edit.service';
import { ProcessService } from '../../../../services/process.service';
import { StorageService } from '../../../../services/storage.service';
import { SidebarService } from '../../../../services/sidebar.service';

import { IOsmElement } from '../../../../core/osmElement.interface';
import { PtTags } from '../../../../core/ptTags.class';

@Component({
  // changeDetection: ChangeDetectionStrategy.Default,
  providers: [],
  selector: 'beginner-tag-browser',
  styleUrls: [
    './beginner-tag-browser.component.less',
    '../../../../styles/main.less',
  ],
  templateUrl: './beginner-tag-browser.component.html',
})
export class BeginnerTagBrowserComponent implements OnInit {
  @Input() public tagKey: string = '';
  @Input() public tagValue: string = '';
  public currentElement: IOsmElement;
  public expectedKeys = PtTags.expectedKeys;
  public expectedValues = PtTags.expectedValues;
  @select(['app', 'editing']) public readonly editing$: Observable<boolean>;
  @select(['app', 'selectObject']) public readonly selectObject$: Observable<boolean>;

  constructor(
    private cd: ChangeDetectorRef,
    private editSrv: EditService,
    private processSrv: ProcessService,
    private storageSrv: StorageService,
    private sidebarSrv: SidebarService,
  ) {
    //
  }

  public ngOnInit(): void {
    this.currentElement = this.storageSrv.currentElement;
    console.log('initialized');
    this.processSrv.refreshSidebarView('tag');
    this.processSrv.refreshSidebarViews$.subscribe((data) => {
      console.log('tag change');
      if (data === 'tag') {
        console.log('tag tag');
        console.log(
          'LOG (tag-browser) Current selected element changed - ',
          data,
          this.currentElement,
          this.storageSrv.currentElement,
        );
        delete this.currentElement;
        this.currentElement = this.storageSrv.currentElement;
        console.log(this.currentElement);
      } else if (data === 'cancel selection') {
        console.log(' tag canceled');
        this.currentElement = undefined;
        delete this.currentElement;
      }

    });
  }

  private checkUnchanged(change: any): boolean {
    return (
      change.from.key === change.to.key && change.from.value === change.to.value
    );
  }

  private createChange(type: string, key?: string, event?: any): void {
    let change: object;

    if (type === 'change tag') {
      // handles changes from one of two input text areas
      switch (event.target['dataset'].type) {
        case 'key':
          change = {
            from: {
              key,
              value: this.currentElement.tags[key],
            },
            to: {
              key: event.target.value,
              value: this.currentElement.tags[key],
            },
          };
          if (this.checkUnchanged(change)) {
            return;
          }
          this.currentElement.tags[
            event.target.value
          ] = this.currentElement.tags[key];
          delete this.currentElement.tags[key];
          break;
        case 'value':
          change = {
            from: {
              key,
              value: this.currentElement.tags[key],
            },
            to: {
              key,
              value: event.target.value,
            },
          };
          if (this.checkUnchanged(change)) {
            return;
          }
          this.currentElement.tags[key] = event.target.value;
          // delete this.currentElement.tags[key];
          break;
        default:
          alert('form type not found');
      }
      // console.log("LOG (tag-browser) Changed tags are: ", this.tagKey, this.tagValue, event);
    } else if (type === 'add tag') {
      console.log(
        'LOG (tag-browser) Added tags are',
        key,
        this.currentElement.tags[key],
        ' for object: ',
        this.currentElement,
      );
      this.currentElement.tags[this.tagKey] = this.tagValue;
      this.storageSrv.currentElement.tags[this.tagKey] = this.tagValue;
      change = {
        key: this.tagKey,
        value: this.tagValue,
      };
      this.tagKey = this.tagValue = '';
    } else if (type === 'remove tag') {
      console.log(
        'LOG (tag-browser) Removed tags are', key, this.currentElement.tags[key],
        ' for object: ', this.currentElement);
      change = {
        key,
        value: this.currentElement.tags[key],
      };

      delete this.currentElement.tags[key];
      delete this.storageSrv.currentElement['tags'][key];
    }
    this.editSrv.addChange(this.currentElement, type, change);
    this.cd.detectChanges();
    this.cd.markForCheck();
  }

  private updateKey(value: string): void {
    this.tagKey = value;
  }

  private toggleType(key: string): void {
    let change;
    if (Object.keys(this.currentElement.tags).indexOf(key) === -1) {
      this.currentElement.tags[key] = 'yes';
      change = { key, value: 'yes' };
      this.editSrv.addChange(this.currentElement, 'add tag', change);
    } else if (this.currentElement.tags[key] === 'yes') {
      change = { key, value: this.currentElement.tags[key] };
      delete this.currentElement.tags[key];
      delete this.storageSrv.currentElement['tags'][key];
      this.editSrv.addChange(this.currentElement, 'remove tag', change);
    } else {
      return alert(
        'Problem occurred - unknown problem in toggle ' +
          JSON.stringify(this.currentElement),
      );
    }
  }

  private updateValue(value: string): void {
    this.tagValue = value;
  }

  private isUnchanged(): boolean {
    return !this.tagKey || !this.tagValue;
  }

  private keyChange($event: any): void {
    console.log('LOG (tag-browser)', $event);
  }

  private valueChange($event: any): void {
    console.log('LOG (tag-browser)', $event);
  }

  private showRouteBrowser(): any{
  this.sidebarSrv.changeBeginnerView('route');
  }
}
