import { NgRedux, select } from '@angular-redux/store';
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { Hotkey, HotkeysService } from 'angular2-hotkeys';
import { BsModalRef, BsModalService, ModalDirective } from 'ngx-bootstrap';
import { Observable } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { EditService } from '../../services/edit.service';
import { MapService } from '../../services/map.service';
import { StorageService } from '../../services/storage.service';
import { AppActions } from '../../store/app/actions';
import { IAppState } from '../../store/model';
import { RouteMasterWizardComponent } from '../route-master-wizard/route-master-wizard.component';
import { RouteWizardComponent } from '../route-wizard/route-wizard.component';

@Component({
  providers: [],
  selector: 'editor',
  styleUrls: ['./editor.component.less', '../../styles/main.less'],
  templateUrl: './editor.component.html',
})
export class EditorComponent implements OnInit, AfterViewInit {
  @ViewChild('editModal') editModal: ModalDirective;
  totalEditSteps = 0;
  currentEditStep = 0;
  creatingElementOfType = '';
  @select(['app', 'editing']) readonly editing$: Observable<boolean>;
  @select(['app', 'advancedExpMode'])
  readonly advancedExpMode$: Observable<boolean>;

  modalRefRouteWiz: BsModalRef;
  modalRefRouteMasterWiz: BsModalRef;

  constructor(
    public appActions: AppActions,
    private authSrv: AuthService,
    private editSrv: EditService,
    private mapSrv: MapService,
    private storageSrv: StorageService,
    private ngRedux: NgRedux<IAppState>,
    private modalService: BsModalService,
    private hotkeysService: HotkeysService
  ) {
    this.hotkeysService.add([
      new Hotkey(
        'shift+e',
        (): boolean => {
          if (this.isAuthenticated()) {
            this.toggleEditMode();
          }
          return false;
        },
        undefined,
        'Toggle edit mode'
      ),
      new Hotkey(
        '1',
        (): boolean => {
          if (this.ngRedux.getState()['app']['editing']) {
            this.createElement('platform');
          }
          return false;
        },
        undefined,
        'Create new platform'
      ),
      new Hotkey(
        'ctrl+r',
        (): boolean => {
          if (
            this.ngRedux.getState()['app']['editing'] &&
            this.ngRedux.getState()['app']['advancedExpMode']
          ) {
            this.routeCreationWizard();
          }
          return false;
        },
        undefined,
        'Open route creation wizard'
      ),
      new Hotkey(
        'ctrl+m',
        (): boolean => {
          if (
            this.ngRedux.getState()['app']['editing'] &&
            this.ngRedux.getState()['app']['advancedExpMode']
          ) {
            this.routeMasterCreationWizard();
          }
          return false;
        },
        undefined,
        'Open route master creation wizard'
      ),
      new Hotkey(
        'left',
        (): boolean => {
          if (this.ngRedux.getState()['app']['editing']) {
            this.stepBackward();
          }
          return false;
        },
        undefined,
        'Undo edit'
      ),
      new Hotkey(
        'right',
        (): boolean => {
          if (this.ngRedux.getState()['app']['editing']) {
            this.stepForward();
          }
          return false;
        },
        undefined,
        'Redo edit'
      ),
    ]);
  }

  ngOnInit(): void {
    this.editSrv.currentTotalSteps.subscribe((data) => {
      // console.log("LOG (editor) subscribed to counter ", data);
      this.currentEditStep = data.current;
      this.totalEditSteps = data.total;
    });
    // @ts-ignore
    this.mapSrv.map.on('click', (event: MouseEvent) => {
      if (
        this.ngRedux.getState()['app']['editing'] &&
        this.creatingElementOfType !== ''
      ) {
        this.editSrv.createElement(this.creatingElementOfType, event);
        this.creatingElementOfType = '';
        this.storageSrv.tutorialStepCompleted.emit('click on map');
      }
    });
  }

  ngAfterViewInit(): void {
    if (this.storageSrv.getLocalStorageItem('edits')) {
      this.editModal.show();
    } else {
      this.storageSrv.setLocalStorageItem('edits', []);
    }
    console.log('LOG (editor) Current edits are: ', this.storageSrv.edits);
  }

  isAuthenticated(): boolean {
    return this.authSrv.oauth.authenticated();
  }

  /**
   * Provides access to editing service function.
   */
  continueEditing(): void {
    this.storageSrv.edits = this.storageSrv.getLocalStorageItem('edits');
    this.editModal.hide();
    this.editSrv.continueEditing();
  }

  /**
   * Deletes current edits create in the localStorage.
   */
  deleteEdits(): void {
    localStorage.removeItem('edits');
    alert(this.storageSrv.edits);
    alert('LOG: LocalStorage changed to ' + localStorage.getItem('edits'));
    this.editModal.hide();
  }

  private showEditModal(): void {
    this.editModal.show();
  }

  private hideEditModal(): void {
    this.editModal.hide();
  }

  /**
   * Provides access to editing service function.
   */
  stepBackward(): void {
    this.currentEditStep--;
    this.editSrv.currentTotalSteps.emit({
      current: this.currentEditStep,
      total: this.totalEditSteps,
    });
    this.editSrv.step('backward');
  }

  /**
   * Provides access to editing service function.
   */
  stepForward(): void {
    this.currentEditStep++;
    console.log('LOG (editor)', this.currentEditStep, this.totalEditSteps);
    this.editSrv.currentTotalSteps.emit({
      current: this.currentEditStep,
      total: this.totalEditSteps,
    });
    this.editSrv.step('forward');
  }

  /**
   * Provides access to editing service function.
   */
  createElement(type: string): void {
    this.creatingElementOfType =
      this.creatingElementOfType === type ? '' : type;
    this.storageSrv.tutorialStepCompleted.emit('click platform button');
  }

  /**
   * Checks if buttons used to move between edits should be active.
   * @param {string} type - "forward" or "backward" button
   * @returns {boolean} - when true then button is disabled
   */
  isInactive(type: string): boolean {
    this.mapSrv.disableMouseEvent('edits-backward-btn');
    this.mapSrv.disableMouseEvent('edits-forward-btn');
    // console.log("LOG (editor)", this.totalEditSteps, this.currentEditStep);
    switch (type) {
      case 'backward':
        return (
          this.totalEditSteps - this.currentEditStep === this.totalEditSteps
        );
      case 'forward':
        return this.currentEditStep === this.totalEditSteps;
    }
  }

  /**
   * Activates editing mode (locally/globally).
   */
  toggleEditMode(): void {
    this.appActions.actToggleEditing();
    const editing = this.ngRedux.getState()['app']['editing'];
    this.editSrv.editingMode.emit(editing);
    this.mapSrv.editingMode = editing;
    if (editing) {
      setTimeout(() => {
        this.mapSrv.disableMouseEvent('edits-backward-btn');
        this.mapSrv.disableMouseEvent('edits-forward-btn');
        this.mapSrv.disableMouseEvent('edits-count');
        this.mapSrv.disableMouseEvent('stop-btn');
        this.mapSrv.disableMouseEvent('platform-btn');
      }, 250);
    }
    this.storageSrv.tutorialStepCompleted.emit('toggle edit mode');
  }

  routeCreationWizard(): void {
    this.modalRefRouteWiz = this.modalService.show(RouteWizardComponent, {
      class: 'modal-lg',
      ignoreBackdropClick: true,
    });
    this.appActions.actSetWizardMode('route wizard');
  }

  routeMasterCreationWizard(): void {
    this.modalRefRouteMasterWiz = this.modalService.show(
      RouteMasterWizardComponent,
      { class: 'modal-lg', ignoreBackdropClick: true }
    );
    this.appActions.actSetWizardMode('route master wizard');
  }
}
