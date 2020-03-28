import { Injectable } from '@angular/core';

import { NgRedux } from '@angular-redux/store';
import { IAppState } from '../store/model';
import { AppActions } from '../store/app/actions';

import * as data from './tutorials.json';

import { EditService } from './edit.service';
import { StorageService } from './storage.service';
import { MapService } from './map.service';
import * as L from 'leaflet';

@Injectable()
export class TutorialService {
  intro = null;
  steps = null;
  tempEditSteps = 0;
  expertMode    = null;

  constructor(public appActions: AppActions,
              public editSrv: EditService,
              public storageSrv: StorageService,
              public mapSrv: MapService,
              private ngRedux: NgRedux<IAppState>,
  ) {
    this.storageSrv.tutorialStepCompleted.subscribe((action) => {
      if (action) {
        this.handleStepCompletion(action);
      }
    });
    this.storageSrv.tempStepAdded.subscribe((added) => {
      if (added) {
        this.tempEditSteps++;
      } else {
        this.tempEditSteps--;
      }
    });
  }

  startTutorial(tutorialTitle: string, expertMode: string): void {
    if (tutorialTitle === 'Add new route' || tutorialTitle === 'Quick overview (expert)') {
      this.appActions.actSetAdvancedExpMode(true);
    }
    if (tutorialTitle === 'Quick overview (expert)') {
      this.appActions.actToggleEditing();
      this.intro.setOptions({ disableInteraction: true });
    }
    this.expertMode                 = expertMode;
    this.tempEditSteps              = 0;
    this.storageSrv.currentTutorial = tutorialTitle;
    this.steps                      = [];
    for (let step of data[expertMode][tutorialTitle]) {
      this.steps.push({
        element : step.element,
        intro   : step.intro,
        position: step.position,
      });
    }
    this.intro.setOptions({
      steps             : [this.steps[0]],
      showButtons       : false,
      showBullets       : false,
      keyboardNavigation: false,
      exitOnOverlayClick: false,
    });
    this.storageSrv.currentTutorialStep = 1;
    this.intro.start();
    if (tutorialTitle === 'Quick overview (expert)') {
      this.storageSrv.tutorialStepCompleted.emit('start');
    }

  }

  private moveToNextStep(): void {

    if (data[this.expertMode][this.storageSrv.currentTutorial][this.storageSrv.currentTutorialStep].element !== 'last-step') {
      const nextStep = this.storageSrv.currentTutorialStep + 1;
      this.intro.addStep(this.steps[this.storageSrv.currentTutorialStep]);
      setTimeout(() => {
        if (document.querySelector(data[this.expertMode][this.storageSrv.currentTutorial][this.storageSrv.currentTutorialStep].element)) {
          this.intro.goToStepNumber(nextStep).start();
          this.storageSrv.currentTutorialStep++;
        }
      }, 500);
    } else {
      this.intro.addStep(this.steps[this.storageSrv.currentTutorialStep]);
      const nextStep = this.storageSrv.currentTutorialStep + 1;
      this.intro.setOptions({ showStepNumbers: false, keyboardNavigation: true });
      this.intro.goToStepNumber(nextStep).start();
      this.storageSrv.currentTutorialStep = 0;
      this.appActions.actToggleTutorialMode(true);
      for (let i = 0; i < this.tempEditSteps; i++) {
        this.editSrv.currentTotalSteps.emit({
          current: this.editSrv.currentEditStep - 1, total: this.editSrv.totalEditSteps,
        });
        this.editSrv.step('backward');

      }
      this.editSrv.currentTotalSteps.emit({
        current: this.editSrv.currentEditStep, total: this.editSrv.totalEditSteps - this.tempEditSteps,
      });
      this.storageSrv.edits.splice(this.storageSrv.edits.length - this.tempEditSteps, this.tempEditSteps);
      this.mapSrv.clearHighlight(this.mapSrv.map);
    }

  }

  private handleStepCompletion(action: string): void {
    if (this.ngRedux.getState()['app']['tutorialMode'] === false) {
      let title = this.storageSrv.currentTutorial;
      switch (title) {
        case 'Add new route':
          this.moveToNextStep();
          break;
        case 'Add new platform':
          this.moveToNextStep();
          break;
        case 'Quick overview (beginner)':

          this.handleQuickOverviewBeginnerCompletion(action);
          break;
        case 'Quick overview (expert)':
          this.handleQuickOverviewExpertCompletion();
          break;
      }
    }
  }

  private leftKeyClick(event: any, fn: any): void {
    if (event.key === 'ArrowRight') {
      let title = this.storageSrv.currentTutorial;
      switch (title) {
        case 'Quick overview (beginner)':
          switch (this.storageSrv.currentTutorialStep) {
            case 2 :
              this.mapSrv.map.setView(new L.LatLng(28.63299, 77.21937), 19);
              document.removeEventListener('keydown', fn);
              this.moveToNextStep();
              break;
            case 4 :
              document.removeEventListener('keydown', fn);
              this.moveToNextStep();
              break;
            case 6 :
              this.moveToNextStep();
              break;
            case 7 :
              document.removeEventListener('keydown', fn);
              this.moveToNextStep();
              break;
            case 9 :
              document.removeEventListener('keydown', fn);
              this.moveToNextStep();
              break;
          }
          break;
        case 'Quick overview (expert)':
          if (this.storageSrv.currentTutorialStep === 11) {
            document.removeEventListener('keydown', fn);
          }
          this.moveToNextStep();
          break;
      }
    }
  }

  private handleQuickOverviewBeginnerCompletion(action: string): void {
    let fn;
    switch (this.storageSrv.currentTutorialStep) {
      case 1 :
        if (action === 'new continuous overpass data') {
          this.moveToNextStep();
          document.addEventListener('keydown', fn = (e) => {
            this.leftKeyClick(e, fn);
          });
        }
        break;
      case 2:
        break;
      case 3:
        if (action === 'click map marker') {
          this.moveToNextStep();
          document.addEventListener('keydown', fn = (e) => {
            this.leftKeyClick(e, fn);
          });
        }
        break;
      case 4 :
        break;
      case 5:
        if (action === 'click route from list') {
          this.moveToNextStep();
          document.addEventListener('keydown', fn = (e) => {
            this.leftKeyClick(e, fn);
          });
        }
        break;
      case 6:
        break;
      case 7 :
        break;
      case 8:
        if (action === 'click back button') {
          this.moveToNextStep();
          document.addEventListener('keydown', fn = (e) => {
            this.leftKeyClick(e, fn);
          });
        }
        break;
      case 9:
        break;
      case 10:
        break;
    }
  }

  private handleQuickOverviewExpertCompletion(): void {
    let fn;
    document.addEventListener('keydown', fn = (e) => {

      this.leftKeyClick(e, fn);
    });
  }
}
