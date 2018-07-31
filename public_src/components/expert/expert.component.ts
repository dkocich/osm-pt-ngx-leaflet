import { Component } from '@angular/core';

import { IRouteBrowserOptions, ISuggestionsBrowserOptions, ITagBrowserOptions } from '../../core/editingOptions.interface';

import { Observable } from 'rxjs';

import {  select } from '@angular-redux/store';

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
    nameSuggestions: {
      found          : false,
      startCorrection: false,
    },
    refSuggestions : {
      found          : false,
      startCorrection: false,
    },
    waySuggestions : {
      found          : false,
      startCorrection: false,
    },
    PTvSuggestions : {
      found          : false,
      startCorrection: false,
    },
  };

}
