import { EventEmitter, Injectable } from '@angular/core';
import { NgRedux } from '@angular-redux/store';
import { IAppState } from '../store/model';

import * as data from './tutorials.json';
import * as introJs from 'intro.js';

@Injectable()
export class TutorialService {
  public tutorialStepCompleted: EventEmitter<number> = new EventEmitter();
  public intro = null;
  public steps = null;
  public completeData = null;
  public currentTutorial = null;
  public currentStep = 0;
  constructor(private ngRedux: NgRedux<IAppState>,
  ) {
    this.tutorialStepCompleted.subscribe((completedStepNo) => {
      if (completedStepNo) {
        this.moveToNextStep();
      //   this.intro.addStep(this.steps[1]);
      //   setTimeout(() => {
      //       if (document.getElementById('platform-btn')) {
      //         this.intro.goToStepNumber(2).start();
      //       }
      //     }
      //     , 500);
      }
    });

    // this.mapSrv.markerClick.subscribe((data) => {
    //   if (data) {
    //
    //   }
    // })
  }

  public startTutorial(tutorialTitle: string, expertMode: string): void {
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
    const nextStep = this.currentStep + 1 ;
    this.intro.addStep(this.steps[this.currentStep]);
    setTimeout(() => {
        if (document.querySelector(data['beginner'][this.currentTutorial][this.currentStep].element)) {
          this.intro.goToStepNumber(nextStep).start();
          this.currentStep++;

        }
      }, 500);
  }
}
