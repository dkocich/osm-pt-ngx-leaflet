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
  public beginnerView = 'main';
  public currentElement;
  constructor(private sidebarSrv:  SidebarService,
              private processSrv: ProcessService,
              private storageSrv: StorageService,
              private mapSrv: MapService) {
    this.sidebarSrv.beginnerView$.subscribe((data) => {
      this.beginnerView = data;
    });
    this.processSrv.refreshSidebarViews$.subscribe((data) => {
      console.log('tag change');
      if (data === 'tag') {
        console.log('tag tag');
        console.log(
          'LOG (tag-browser) Current selected element changed - ',
          data,
          this.currentElement,
          this.storageSrv.currentElement,
        );
        delete this.currentElement;
        this.currentElement = this.storageSrv.currentElement;
        console.log(this.currentElement);
      } else if (data === 'cancel selection') {
        console.log(' tag canceled');
        this.currentElement = undefined;
        delete this.currentElement;
      }

    });
  }

  public ngOnInit(): void {
  }
  private showRouteBrowser(): any {
    this.sidebarSrv.changeBeginnerView('route');
  }
  private showTagBrowser(): any {
    this.sidebarSrv.changeBeginnerView('tag');
  }
  private missingNames(): any{
    this.mapSrv.addPopUps();
  }
}
