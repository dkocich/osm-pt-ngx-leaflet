import { NgRedux, select } from '@angular-redux/store';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { Observable } from 'rxjs';
import {
  IRouteBrowserOptions,
  ISuggestionsBrowserOptions,
  ITagBrowserOptions,
} from '../../core/editingOptions.interface';
import { PtTags } from '../../core/ptTags.class';
import { ProcessService } from '../../services/process.service';
import { StorageService } from '../../services/storage.service';
import { AppActions } from '../../store/app/actions';
import { IAppState } from '../../store/model';

@Component({
  providers: [],
  selector: 'beginner',
  styleUrls: ['./beginner.component.less', '../../styles/main.less'],
  templateUrl: './beginner.component.html',
})
export class BeginnerComponent {
  @ViewChild('accordion1') a1: ElementRef;

  @select(['app', 'beginnerView']) readonly beginnerView$: Observable<string>;
  @select(['app', 'errorCorrectionMode'])
  readonly errorCorrectionMode$: Observable<ISuggestionsBrowserOptions>;
  @select(['app', 'editing']) readonly editing$: Observable<boolean>;
  expectedKeys = PtTags.expectedKeys;
  routeBrowserOptions: IRouteBrowserOptions = {
    createRoute: false,
    changeMembers: false,
    membersEditing: false,
    toggleFilteredView: false,
  };
  stopTagBrowserOptions: ITagBrowserOptions = {
    limitedKeys: true,
    allowedKeys: this.expectedKeys.filter(this.filterStopKeysForBeginner),
    makeKeysReadOnly: true,
  };
  routeTagBrowserOptions: ITagBrowserOptions = {
    limitedKeys: true,
    allowedKeys: this.expectedKeys.filter(this.filterRouteKeysForBeginner),
    makeKeysReadOnly: true,
  };

  suggestionsBrowserOptions: ISuggestionsBrowserOptions = {
    nameSuggestions: {
      found: false,
      startCorrection: false,
    },
    refSuggestions: null,
    waySuggestions: null,
    PTvSuggestions: {
      found: false,
      startCorrection: false,
    },
    ptPairSuggestions: {
      found: false,
      startCorrection: false,
    },
  };
  a2;

  constructor(
    private appActions: AppActions,
    private processSrv: ProcessService,
    private storageSrv: StorageService,
    private ngRedux: NgRedux<IAppState>
  ) {}

  /**
   * Returns allowed keys (for tags) for beginner mode stops
   */
  private filterStopKeysForBeginner(key: string): boolean {
    return key === 'name' || key === 'ref';
  }

  /**
   * Returns allowed keys (for tags) for beginner mode routes
   */
  private filterRouteKeysForBeginner(key: string): boolean {
    return key === 'name' || key === 'ref';
  }

  /**
   * Refreshes view for back button functionality
   */
  back(): void {
    this.appActions.actSetBeginnerView('stop');
    this.storageSrv.currentElement = this.storageSrv.selectedStopBeginnerMode;
    this.processSrv.refreshSidebarView('tag');
    this.processSrv.exploreStop(
      this.storageSrv.currentElement,
      false,
      true,
      true
    );
    this.storageSrv.tutorialStepCompleted.emit('click back button');
  }

  /**
   * Determines whether given component should be viewed
   */
  shouldView(windowName: string): boolean {
    const beginnerView = this.ngRedux.getState()['app']['beginnerView'];
    const editing = this.ngRedux.getState()['app']['editing'];

    switch (windowName) {
      case 'route-browser':
        return beginnerView === 'stop';

      case 'tag-browser':
        return true;

      case 'validation-browser':
        return beginnerView === 'stop' && editing;

      default:
        return false;
    }
  }
}
