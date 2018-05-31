import { Component, OnInit } from '@angular/core';

import { EditService } from '../../../services/edit.service';
import { MapService } from '../../../services/map.service';
import { ProcessService } from '../../../services/process.service';
import { StorageService } from '../../../services/storage.service';
import { DragulaService } from 'ng2-dragula';

import { IPtRelation } from '../../../core/ptRelation.interface';
import { IPtStop } from '../../../core/ptStop.interface';

import { Observable } from 'rxjs';
import { select } from '@angular-redux/store';
import { SidebarService } from '../../../services/sidebar.service';

@Component({
  providers: [],
  selector: 'beginner-main-browser',
  styleUrls: [
    './beginner-main-browser.component.less',
    '../../../styles/main.less',
  ],
  templateUrl: './beginner-main-browser.component.html',
})
export class BeginnerMainBrowserComponent implements OnInit {
  public beginnerView = 'tag';
  constructor(private sidebarSrv:  SidebarService) {
    this.sidebarSrv.beginnerView$.subscribe((data) => {
      this.beginnerView = data;
    });
  }

  public ngOnInit(): void {
  }
  public back(): any {
    this.sidebarSrv.changeBeginnerView('tag');

  }
  private showRouteBrowser(): any{
    this.sidebarSrv.changeBeginnerView('route');
  }
  private showTagBrowser(): any{
    this.sidebarSrv.changeBeginnerView('route');
  }
}
