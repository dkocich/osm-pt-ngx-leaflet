import { EventEmitter, Injectable } from '@angular/core';
import { NgRedux } from '@angular-redux/store';
import { IAppState } from '../store/model';
import * as data from './tutorials.json';
import * as introJs from 'intro.js';

import { BsModalRef, BsModalService } from 'ngx-bootstrap';
import {AppActions} from '../store/app/actions';
import {EditService} from './edit.service';
import {StorageService} from './storage.service';
import {MapService} from './map.service';

@Injectable()
export class TutorialService {
  // public tutorialStepCompleted: EventEmitter<number> = new EventEmitter();
  // public tempStepAdded: EventEmitter<boolean>      = new EventEmitter();

  public intro = null;
  public steps = null;
  public completeData = null;
  public currentTutorial = null;
  public currentStep = 0;
  public tempEditSteps = 0;
  modalRef: BsModalRef;
  constructor(private ngRedux: NgRedux<IAppState>,
              private modalService: BsModalService,
              public appActions: AppActions,
              public editSrv: EditService,
              public storageSrv: StorageService,
              public mapSrv: MapService,
  ) {
    this.storageSrv.tutorialStepCompleted.subscribe((completedStepNo) => {
      if (completedStepNo) {
        this.moveToNextStep();
      }
    });
    // this.editSrv.currentTotalSteps.subscribe(() => {
    //   this.tempEditSteps++;
    // });
    this.storageSrv.tempStepAdded.subscribe((data) => {
      if (data) {
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
    this.intro.setOptions({keyboardNavigation: false, exitOnOverlayClick: false});
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
      this.intro.setOptions({showStepNumbers : false, keyboardNavigation: true});
      this.intro.goToStepNumber(nextStep).start();
      this.currentStep = 0 ;
      this.appActions.actToggleTutorialMode(true);
      console.log('edit srv ,', this.editSrv.currentEditStep, this.editSrv.totalEditSteps);
      for (let i = 0; i < this.tempEditSteps ; i++){
        // let currentEditStep = this.editSrv.currentEditStep - 1;
        // let totalEditSteps = this.editSrv.totalEditSteps - 1;
        // console.log('edits' ,this.storageSrv.edits);
        console.log('RAN', this.tempEditSteps);
        this.editSrv.currentTotalSteps.emit({
          current: this.editSrv.currentEditStep - 1, total: this.editSrv.totalEditSteps,
        });
        this.editSrv.step('backward');

      }
      this.editSrv.currentTotalSteps.emit({
        current: this.editSrv.currentEditStep , total: this.editSrv.totalEditSteps - this.tempEditSteps,
      });
      this.storageSrv.edits.splice(this.storageSrv.edits.length - this.tempEditSteps , this.tempEditSteps);
      console.log('edits' , this.storageSrv.edits);
      this.mapSrv.clearHighlight(this.mapSrv.map);
    }

  }
}
