import { Component, OnInit } from '@angular/core';
import * as data from '../../services/tutorials.json';
import { Observable } from 'rxjs';
import {NgRedux, select} from '@angular-redux/store';
import * as introJs from 'intro.js';
import {IAppState} from '../../store/model';
import {TutorialService} from '../../services/tutorial.service';
import {AppActions} from '../../store/app/actions';
import {EditService} from '../../services/edit.service';

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
  public tutorialsData = null;
  public currentEditStep = 0;
  public totalEditSteps = 0;
  public tempEditSteps = 0;
  @select(['app', 'advancedExpMode']) public readonly advancedExpMode$: Observable<boolean>;
  constructor(private ngRedux: NgRedux<IAppState>,
              private tutorialSrv: TutorialService,
              public appActions: AppActions,
              private editSrv: EditService,
  ) {

    // this.editSrv.currentTotalSteps.subscribe((data) => {
    //   // console.log("LOG (editor) subscribed to counter ", data);
    //   this.currentEditStep = data.current;
    //   this.totalEditSteps = data.total;
    //   // this.tempEditSteps++;
    // });
  }

  public ngOnInit(): void {
    this.tutorialSrv.intro = introJs();
    this.tutorialsData = data;
    // this.tutorialSrv.startTutorial('Add new platforms', 'beginner');
  }

  public startTutorial(tutorialTitle: string, expertMode: string): void {
    this.appActions.actToggleTutorialMode(false);
    this.appActions.actSetAdvancedExpMode(false);
    if (this.ngRedux.getState()['app']['editing']) {
      this.appActions.actToggleEditing();
    }
    this.tutorialSrv.startTutorial(tutorialTitle, expertMode);
  }

  public quitTutorialMode(): void {
    this.appActions.actToggleTutorialMode(null);

    //
    // for (let i = 0; i < this.tempEditSteps ; i++){
    //   this.currentEditStep -- ;
    //   console.log('my step', this.currentEditStep);
    //   this.editSrv.currentTotalSteps.emit({
    //     current: this.currentEditStep, total: this.totalEditSteps,
    //   });
    //   this.editSrv.step('backward');
    // }


    //
  }
}
