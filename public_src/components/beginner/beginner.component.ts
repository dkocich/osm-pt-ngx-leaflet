import { Component } from '@angular/core';

import { PtTags } from '../../core/ptTags.class';
import { IRouteBrowserOptions, ITagBrowserOptions } from '../../core/editingOptions.interfaces';

import { Observable } from 'rxjs';

import { select } from '@angular-redux/store';
import { AppActions } from '../../store/app/actions';

import { ProcessService } from '../../services/process.service';
import { StorageService } from '../../services/storage.service';

@Component({
  providers: [],
  selector: 'beginner',
  styleUrls: [
    './beginner.component.less',
    '../../styles/main.less',
  ],
  templateUrl: './beginner.component.html',
})
export class BeginnerComponent {
  @select(['app', 'beginnerView']) public readonly beginnerView$: Observable<string>;
  public expectedKeys = PtTags.expectedKeys;
  public routeBrowserOptions: IRouteBrowserOptions = {
    createRoute :  false,
    changeMembers : false,
    membersEditing : false,
    toggleFilteredView :  false,
  };
  public stopTagBrowserOptions: ITagBrowserOptions = {
    limitedKeys: true,
    allowedKeys :  this.expectedKeys.filter(this.filterKeysForBeginner),
    makeKeysReadOnly : true,
  };
  public routeTagBrowserOptions: ITagBrowserOptions = {
    limitedKeys: false,
    makeKeysReadOnly : true,
  };

  constructor(private appActions: AppActions, private processSrv: ProcessService, private storageSrv: StorageService) {}

  /***
   * Returns allowed keys (for tags) for beginner mode
   * @param {string} key
   * @returns {boolean}
   */
  private filterKeysForBeginner(key: string): boolean {
    return key === 'name' || key === 'ref' ||
      key === 'train' || key === 'subway' ||
      key === 'monorail' || key === 'tram' ||
      key === 'trolleybus' || key === 'bus' ||
      key ===  'aerialway' || key ===  'ferry';
  }

  /***
   * Refreshes view for back button functionality
   */
  private back(): void {
    console.log('back');
    this.appActions.actSetBeginnerView('stop');
    this.storageSrv.currentElement = this.storageSrv.selectedStopBeginnerMode;
    this.processSrv.refreshSidebarView('tag');
    this.processSrv.exploreStop(this.storageSrv.currentElement, false, true, true);
  }
}
