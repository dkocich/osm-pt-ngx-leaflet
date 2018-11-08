import { Component } from '@angular/core';

import { IRouteBrowserOptions, ISuggestionsBrowserOptions, ITagBrowserOptions } from '../../core/editingOptions.interface';

import { Observable } from 'rxjs';

import { NgRedux, select } from '@angular-redux/store';
import { IAppState } from '../../store/model';

import { TutorialService } from '../../services/tutorial.service';
import { StorageService } from '../../services/storage.service';

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
  @select(['app', 'editing']) public readonly editing$: Observable<boolean>;
  constructor(private ngRedux: NgRedux<IAppState>,
              private tutorialSrv: TutorialService,
              private storageSrv: StorageService) {

  }
  public isRouteBrowserOpen = false;
  public routeBrowserOptions: IRouteBrowserOptions = {
    changeMembers     : true,
    createRoute       : true,
    membersEditing    : true,
    toggleFilteredView: true,
  };

  public tagBrowserOptions: ITagBrowserOptions = {
    limitedKeys     : false,
    makeKeysReadOnly: false,
  };

  public suggestionsBrowserOptions: ISuggestionsBrowserOptions = {
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

  public openBrowser(name: string): void{
    if (name === 'route-browser' && this.ngRedux.getState()['app']['tutorialMode'] === false && this.isRouteBrowserOpen) {
        this.storageSrv.tutorialStepCompleted.emit('open route browser expert');
    }
  }
}
