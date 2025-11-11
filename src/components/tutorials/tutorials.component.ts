import { Component, OnInit } from '@angular/core';
import * as introJs from 'intro.js';
import { Observable } from 'rxjs';
import { TutorialService } from '../../services/tutorial.service';
import * as data from '../../services/tutorials.json';

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
  constructor(
    private tutorialSrv: TutorialService,
  ) {}

  ngOnInit(): void {
    this.tutorialSrv.intro = introJs();
    this.tutorialsData = data;
  }

  startTutorial(tutorialTitle: string, expertMode: string): void {
    // this.appActions.actToggleTutorialMode(false);
    // this.appActions.actSetAdvancedExpMode(false);
    // if (this.ngRedux.getState()['app']['editing']) {
    //   this.appActions.actToggleEditing();
    // }
    this.tutorialSrv.startTutorial(tutorialTitle, expertMode);
  }

  quitTutorialMode(): void {
    // this.appActions.actToggleTutorialMode(null);
  }
}
