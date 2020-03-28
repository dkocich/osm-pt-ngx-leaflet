import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { NgRedux, select } from '@angular-redux/store';

import { Observable } from 'rxjs';

import { EditService } from '../../services/edit.service';
import { ProcessService } from '../../services/process.service';
import { StorageService } from '../../services/storage.service';

import { IOsmElement } from '../../core/osmElement.interface';

import { PtTags } from '../../core/ptTags.class';
import { ITagBrowserOptions } from '../../core/editingOptions.interface';
import { IAppState } from '../../store/model';

@Component({
  changeDetection: ChangeDetectionStrategy.Default,
  providers: [],
  selector: 'tag-browser',
  styleUrls: [
    './tag-browser.component.less',
    '../../styles/main.less',
  ],
  templateUrl: './tag-browser.component.html',
})
export class TagBrowserComponent implements OnInit, OnDestroy {
  @Input() tagKey: string = '';
  @Input() tagValue: string = '';
  currentElement: IOsmElement =  this.storageSrv.currentElement;
  expectedKeys = PtTags.expectedKeys;
  expectedValues = PtTags.expectedValues;
  @select(['app', 'editing']) readonly editing$: Observable<boolean>;
  @select(['app', 'advancedExpMode']) readonly advancedExpMode$: Observable<boolean>;
  @Input() tagBrowserOptions: ITagBrowserOptions;
  unfilledKeys = [];
  private advancedExpModeSubscription: any;
  private advancedExpMode: boolean;

  constructor(
    private cd: ChangeDetectorRef,
    private editSrv: EditService,
    private processSrv: ProcessService,
    private storageSrv: StorageService,
    private ngRedux: NgRedux<IAppState>,
  ) {
    this.advancedExpModeSubscription = ngRedux.select<boolean>(['app', 'advancedExpMode'])
      .subscribe((data) => this.advancedExpMode = data);
  }

  ngOnInit(): void {
    this.processSrv.refreshSidebarViews$.subscribe((data) => {
      if (data === 'tag') {
        console.log(
          'LOG (tag-browser) Current selected element changed - ',
          data,
          this.currentElement,
          this.storageSrv.currentElement,
        );
        delete this.currentElement;
        this.currentElement = this.storageSrv.currentElement;
        if (this.tagBrowserOptions.limitedKeys) {
          this.unfilledKeys = this.getUnfilledKeys();
        }
      } else if (data === 'cancel selection') {
        this.currentElement = undefined;
        delete this.currentElement;
      }
    });
    if (this.tagBrowserOptions.limitedKeys) {
      this.unfilledKeys = this.getUnfilledKeys();
    }
  }

  private checkUnchanged(change: any): boolean {
    return (
      change.from.key === change.to.key && change.from.value === change.to.value
    );
  }

  createChange(type: string, key?: string, event?: any): void {
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

  updateKey(value: string): void {
    this.tagKey = value;
  }

  toggleType(key: string): void {
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

  updateValue(value: string): void {
    this.tagValue = value;
  }

  isUnchanged(): boolean {
    return !this.tagKey || !this.tagValue;
  }

  keyChange($event: any): void {
    console.log('LOG (tag-browser)', $event);
  }

  valueChange($event: any): void {
    console.log('LOG (tag-browser)', $event);
  }

  /***
   * Gets missing keys from allowed keys in beginnerMode
   * @returns {string[]}
   */
  private getUnfilledKeys(): string[] {
    if (this.currentElement) {
      let existingKeys = Object.keys(this.currentElement.tags);
      return this.tagBrowserOptions.allowedKeys.filter((key) => !existingKeys.includes(key));
    }
  }

  /**
   * Adds tag for beginnerMode
   * @param {string} key
   * @param {string} value
   * @returns {void}
   */
  addChangeBeginnerMode(key: string, value: string): void {
    this.tagKey = key;
    this.tagValue = value;
    this.createChange('add tag');
    this.storageSrv.tutorialStepCompleted.emit('add tag');

  }

  ngOnDestroy(): void {
    this.advancedExpModeSubscription.unsubscribe();
  }
}
