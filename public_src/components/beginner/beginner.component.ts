import { Component } from '@angular/core';

import { PtTags } from '../../core/ptTags.class';
import { IRouteBrowserOptions, ITagBrowserOptions } from '../../core/editingOptions.interface';

import { Observable } from 'rxjs';

import { select } from '@angular-redux/store';
import { AppActions } from '../../store/app/actions';

import { ProcessService } from '../../services/process.service';
import { StorageService } from '../../services/storage.service';

@Component({
  providers  : [],
  selector   : 'beginner',
  styleUrls  : [
    './beginner.component.less',
    '../../styles/main.less',
  ],
  templateUrl: './beginner.component.html',
})
export class BeginnerComponent {
  @select(['app', 'beginnerView']) public readonly beginnerView$: Observable<string>;
  @select(['app', 'errorCorrectionMode']) public readonly errorCorrectionMode$: Observable<string>;
  @select(['app', 'editing']) public readonly editing$: Observable<boolean>;
  public expectedKeys                               = PtTags.expectedKeys;
  public routeBrowserOptions: IRouteBrowserOptions  = {
    createRoute       : false,
    changeMembers     : false,
    membersEditing    : false,
    toggleFilteredView: false,
  };
  public stopTagBrowserOptions: ITagBrowserOptions  = {
    limitedKeys     : true,
    allowedKeys     : this.expectedKeys.filter(this.filterStopKeysForBeginner),
    makeKeysReadOnly: true,
  };
  public routeTagBrowserOptions: ITagBrowserOptions = {
    limitedKeys     : true,
    allowedKeys     : this.expectedKeys.filter(this.filterRouteKeysForBeginner),
    makeKeysReadOnly: true,
  };
  public validationOptions : any = {
    missingNameTag : true,
    missingRefTag : true,
  };

  constructor(private appActions: AppActions,
              private processSrv: ProcessService,
              private storageSrv: StorageService) {
  }

  /***
   * Returns allowed keys (for tags) for beginner mode stops
   * @param {string} key
   * @returns {boolean}
   */
  private filterStopKeysForBeginner(key: string): boolean {
    return key === 'name' || key === 'ref';
  }

  /***
   * Returns allowed keys (for tags) for beginner mode routes
   * @param {string} key
   * @returns {boolean}
   */
  private filterRouteKeysForBeginner(key: string): boolean {
    return key === 'name' || key === 'ref';
  }

  /***
   * Refreshes view for back button functionality
   */
  public back(): void {
    this.appActions.actSetBeginnerView('stop');
    this.storageSrv.currentElement = this.storageSrv.selectedStopBeginnerMode;
    this.processSrv.refreshSidebarView('tag');
    this.processSrv.exploreStop(this.storageSrv.currentElement, false, true, true);
  }
}
