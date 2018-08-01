import { Injectable } from '@angular/core';

import { NgRedux } from '@angular-redux/store';
import { IAppState } from '../store/model';
import { AppActions } from '../store/app/actions';

import * as data from './tutorials.json';

import { BsModalRef, BsModalService } from 'ngx-bootstrap';

import { EditService } from './edit.service';
import { StorageService } from './storage.service';
import { MapService } from './map.service';

@Injectable()
export class TutorialService {
  public intro           = null;
  public steps           = null;
  public currentTutorial = null;
  public currentStep     = 0;
  public tempEditSteps   = 0;
  constructor(public appActions: AppActions,
              public editSrv: EditService,
              public storageSrv: StorageService,
              public mapSrv: MapService,
  ) {
    this.storageSrv.tutorialStepCompleted.subscribe((completedStepNo) => {
      if (completedStepNo) {
        this.moveToNextStep();
      }
    });
    this.storageSrv.tempStepAdded.subscribe((added) => {
      if (added) {
        this.tempEditSteps ++;
      } else {
        this.tempEditSteps --;
      }
    });
  }
  public startTutorial(tutorialTitle: string, expertMode: string): void {
    if (tutorialTitle === 'Add new route') {
      this.appActions.actSetAdvancedExpMode(true);
    }
    this.tempEditSteps = 0 ;
    this.currentStep = this.editSrv.currentEditStep;
    this.intro.setOptions({ keyboardNavigation: false, exitOnOverlayClick: false });
    this.currentTutorial = tutorialTitle;
    this.steps = [];
    for (let step of data[expertMode][tutorialTitle]) {
      this.steps.push({
        element: step.element,
        intro: step.intro,
        position: step.position,
      });
    }
    this.intro.setOptions({
      steps: [this.steps[0]],
      showButtons: false,
      showBullets: false,
    });
    this.currentStep = 1;
    this.intro.start();
  }

  private moveToNextStep(): void {

    if (data['beginner'][this.currentTutorial][this.currentStep].element !== 'last-step') {
      const nextStep = this.currentStep + 1;
      this.intro.addStep(this.steps[this.currentStep]);
      setTimeout(() => {
        if (document.querySelector(data['beginner'][this.currentTutorial][this.currentStep].element)) {
          this.intro.goToStepNumber(nextStep).start();
          this.currentStep++;
        }
      }, 1000);
    } else {
      this.intro.addStep(this.steps[this.currentStep]);
      const nextStep = this.currentStep + 1;
      this.intro.setOptions({ showStepNumbers : false, keyboardNavigation: true });
      this.intro.goToStepNumber(nextStep).start();
      this.currentStep = 0 ;
      this.appActions.actToggleTutorialMode(true);
      for (let i = 0; i < this.tempEditSteps ; i++){
        this.editSrv.currentTotalSteps.emit({
          current: this.editSrv.currentEditStep - 1, total: this.editSrv.totalEditSteps,
        });
        this.editSrv.step('backward');

      }
      this.editSrv.currentTotalSteps.emit({
        current: this.editSrv.currentEditStep , total: this.editSrv.totalEditSteps - this.tempEditSteps,
      });
      this.storageSrv.edits.splice(this.storageSrv.edits.length - this.tempEditSteps , this.tempEditSteps);
      this.mapSrv.clearHighlight(this.mapSrv.map);
    }

  }
}
