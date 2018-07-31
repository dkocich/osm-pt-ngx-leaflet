import { Component, OnInit } from '@angular/core';
import * as data from '../../services/tutorials.json';
import { Observable } from 'rxjs';
import {NgRedux, select} from '@angular-redux/store';
import * as introJs from 'intro.js';
import {IAppState} from '../../store/model';
import {TutorialService} from '../../services/tutorial.service';

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
  // public intro = null;
  public steps = null;
  @select(['app', 'advancedExpMode']) public readonly advancedExpMode$: Observable<boolean>;

  constructor(private ngRedux: NgRedux<IAppState>,
              private tutorialSrv: TutorialService,
  ) {
    // ngRedux.select<boolean>(['app', 'editing'])
    //   .subscribe((data) => {
    //     if (data) {
    //       // console.log('step 1', this.steps[1]);
    //       // this.steps[0].intro = 'Good Job!';
    //       // // this.intro.refresh();
    //       // this.intro.setOptions({ steps: [this.steps[0]], showButtons: true });
    //
    //       this.intro.addStep(this.steps[1]);
    //       setTimeout(() => {if(document.getElementById('platform-btn')){
    //         this.intro.goToStepNumber(2).start();
    //       } }
    //     , 500);
    //       // this.intro.start();
    //     }
    //   });
  }

  public ngOnInit(): void {
    this.tutorialSrv.intro = introJs();
    this.tutorialsData = data;
    // this.tutorialsData = data;
    // console.log('ds', data);
    this.tutorialSrv.startTutorial('Add new platforms', 'beginner');
  }

  public startTutorial(tutorialTitle: string, expertMode: string): void {

    //   this.steps = [];
    //   for (let step of data[expertMode][tutorialTitle]) {
    //     this.steps.push({
    //       element: step.element,
    //       intro: step.intro,
    //       position: step.position,
    //     });
    //   }
    //   this.intro.setOptions({
    //     steps: [this.steps[0]],
    //     showButtons: false,
    //     showBullets: false,
    //   });
    //   this.intro.start();
    // }
    this.tutorialSrv.startTutorial(tutorialTitle, expertMode);
  }
}

