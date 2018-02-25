import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
} from '@angular/core';

import { EditService } from '../../services/edit.service';
import { ProcessService } from '../../services/process.service';
import { StorageService } from '../../services/storage.service';

import { IOsmEntity } from '../../core/osmEntity.interface';

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
export class TagBrowserComponent {
  @Input() public tagKey: string = '';
  @Input() public tagValue: string = '';
  public currentElement: IOsmEntity;
  private editingMode: boolean;

  private expectedKeys = [
    'ascent',
    'bench',
    'building',
    'bus',
    'colour',
    'covered',
    'descent',
    'description',
    'distance',
    'highway',
    'layer',
    'level',
    'name',
    'network',
    'operator',
    'public_transport',
    'public_transport:version',
    'railway',
    'ref',
    'roundtrip',
    'route',
    'route_ref',
    'shelter',
    'surface',
    'symbol',
    'tactile_paving',
    'type',
    'uic_name',
    'uic_ref',
  ];
  private expectedValues = [
    'aerialway',
    'backward',
    'bus',
    'bus_stop',
    'coach',
    'ferry',
    'forward',
    'gate',
    'limited',
    'monorail',
    'no',
    'platform',
    'public_transport',
    'route',
    'route_master',
    'share_taxi',
    'station',
    'stop',
    'stop_area',
    'stop_position',
    'subway',
    'taxi',
    'train',
    'tram',
    'trolleybus',
    'yes',
  ];

  constructor(
    private cd: ChangeDetectorRef,
    private editSrv: EditService,
    private processSrv: ProcessService,
    private storageSrv: StorageService,
  ) {
    //
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
      } else if (data === 'cancel selection') {
        this.currentElement = undefined;
        delete this.currentElement;
      }
    });

    this.editSrv.editingMode.subscribe((data) => {
        console.log(
          'LOG (tag-browser) Editing mode change in tagBrowser - ',
          data,
        );
        this.editingMode = data;
      },
    );
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
        'Problem occured - unknown problem in toggle ' +
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
}
