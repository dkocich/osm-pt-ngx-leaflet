import { NgRedux, select } from '@angular-redux/store';
import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { IRouteBrowserOptions, ISuggestionsBrowserOptions, ITagBrowserOptions } from '../../core/editingOptions.interface';
import { StorageService } from '../../services/storage.service';
import { TutorialService } from '../../services/tutorial.service';
import { IAppState } from '../../store/model';

@Component({
  providers  : [],
  selector   : 'expert',
  styleUrls  : [
    './expert.component.less',
    '../../styles/main.less',
  ],
  templateUrl: './expert.component.html',
})
export class ExpertComponent {
  @select(['app', 'editing']) readonly editing$: Observable<boolean>;
  constructor(private ngRedux: NgRedux<IAppState>,
              private tutorialSrv: TutorialService,
              private storageSrv: StorageService) {

  }
  isRouteBrowserOpen = false;
  routeBrowserOptions: IRouteBrowserOptions = {
    changeMembers     : true,
    createRoute       : true,
    membersEditing    : true,
    toggleFilteredView: true,
  };

  tagBrowserOptions: ITagBrowserOptions = {
    limitedKeys     : false,
    makeKeysReadOnly: false,
  };

  suggestionsBrowserOptions: ISuggestionsBrowserOptions = {
    nameSuggestions  : {
      found          : false,
      startCorrection: false,
    },
    refSuggestions   : {
      found          : false,
      startCorrection: false,
    },
    waySuggestions   : {
      found          : false,
      startCorrection: false,
    },
    PTvSuggestions   : {
      found          : false,
      startCorrection: false,
    },
    ptPairSuggestions: {
      found          : false,
      startCorrection: false,
    },
  };

  openBrowser(name: string): void {
    if (name === 'route-browser' && this.ngRedux.getState()['app']['tutorialMode'] === false && this.isRouteBrowserOpen) {
        this.storageSrv.tutorialStepCompleted.emit('open route browser expert');
    }
  }
}
