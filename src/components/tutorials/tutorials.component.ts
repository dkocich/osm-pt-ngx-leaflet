import { Component, OnInit } from '@angular/core';
import * as data from '../../services/tutorials.json';
import { Observable } from 'rxjs';
import { NgRedux, select } from '@angular-redux/store';
import * as introJs from 'intro.js';

import { IAppState } from '../../store/model';
import { AppActions } from '../../store/app/actions';

import { TutorialService } from '../../services/tutorial.service';

@Component({
  providers: [],
  selector: 'tutorials',
  styleUrls: [
    './tutorials.component.less',
    './tutorials.component.less',
    '../../styles/main.less',
  ],
  templateUrl: './tutorials.component.html',
})
export class TutorialsComponent implements OnInit {
  tutorialsData = null;
  @select(['app', 'advancedExpMode']) readonly advancedExpMode$: Observable<boolean>;
  constructor(private ngRedux: NgRedux<IAppState>,
              private tutorialSrv: TutorialService,
              public appActions: AppActions,
  ) {
  }

  ngOnInit(): void {
    this.tutorialSrv.intro = introJs();
    this.tutorialsData = data;
  }

  startTutorial(tutorialTitle: string, expertMode: string): void {
    this.appActions.actToggleTutorialMode(false);
    this.appActions.actSetAdvancedExpMode(false);
    if (this.ngRedux.getState()['app']['editing']) {
      this.appActions.actToggleEditing();
    }
    this.tutorialSrv.startTutorial(tutorialTitle, expertMode);
  }

  quitTutorialMode(): void {
    this.appActions.actToggleTutorialMode(null);
  }
}
