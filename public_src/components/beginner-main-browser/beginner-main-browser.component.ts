import { Component, OnInit } from '@angular/core';

import { MapService } from '../../services/map.service';
import { ProcessService } from '../../services/process.service';
import { StorageService } from '../../services/storage.service';
import { ErrorHighlightService } from '../../services/error-highlight.service';
import { SidebarService } from '../../services/sidebar.service';

import { Observable } from 'rxjs';
import { NgRedux, select } from '@angular-redux/store';
import { AppActions } from '../../store/app/actions';
import { IAppState } from '../../store/model';

@Component({
  providers: [],
  selector: 'beginner-main-browser',
  styleUrls: [
    './beginner-main-browser.component.less',
    '../../styles/main.less',
  ],
  templateUrl: './beginner-main-browser.component.html',
})
export class BeginnerMainBrowserComponent implements OnInit {
  public currentElement;
  public popUps: boolean =  false;
  public mysubscription: any;
  @select(['app', 'beginnerView']) public readonly beginnerView$: Observable<string>;
  @select(['app', 'errorCorrectionMode']) public readonly errorCorrectionMode$: Observable<string>;
  @select(['app', 'editing']) public readonly editing$: Observable<boolean>;

  constructor(private sidebarSrv:  SidebarService,
              private processSrv: ProcessService,
              private storageSrv: StorageService,
              private mapSrv: MapService,
              private errorHighlightsSrv: ErrorHighlightService,
              private appActions: AppActions,
              private ngRedux: NgRedux<IAppState>) {

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
        console.log(this.currentElement);
      } else if (data === 'cancel selection') {
        this.currentElement = undefined;
        delete this.currentElement;
      }

    });
    this.mysubscription = ngRedux.select<boolean>(['app', 'errorCorrectionMode']) // <- New
      .subscribe(() => {
        if (this.ngRedux.getState()['app']['errorCorrectionMode'] === 'missing-tag-name'){
          this.errorHighlightsSrv.missingTagError('name');
        }
        if (!this.ngRedux.getState()['app']['errorCorrectionMode']){
          this.errorHighlightsSrv.removePopUps();
        }
      });
  }

  public ngOnInit(): void {
    console.log('init');
  }
  private showRouteBrowser(): any {
    this.appActions.actSetBeginnerView('route');
  }
  private showTagBrowser(): any {
    this.appActions.actSetBeginnerView('tag');
  }
  private missingNames(): any {
    if (this.popUps ===  false) {
      this.appActions.actSetErrorCorrectionMode('missing-tag-name');
      this.popUps = true;
    } else {
      this.appActions.actSetErrorCorrectionMode(null);
      this.popUps = false ;
    }
  }
  private back(): any {
    this.appActions.actSetBeginnerView('element-selected');
}

}
