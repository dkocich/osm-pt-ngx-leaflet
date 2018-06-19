import { Component } from '@angular/core';

import { IRouteBrowserOptions, ITagBrowserOptions } from '../../core/editingOptions.interface';

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
}
