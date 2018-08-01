import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';

import { AuthService } from '../../services/auth.service';
import { EditService } from '../../services/edit.service';
import { MapService } from '../../services/map.service';
import { StorageService } from '../../services/storage.service';

import { BsModalRef, BsModalService, ModalDirective } from 'ngx-bootstrap';

import { NgRedux, select } from '@angular-redux/store';
import { Observable } from 'rxjs';

import { AppActions } from '../../store/app/actions';
import { IAppState } from '../../store/model';

import { RouteWizardComponent } from '../route-wizard/route-wizard.component';
import { RouteMasterWizardComponent } from '../route-master-wizard/route-master-wizard.component';

@Component({
  providers: [],
  selector: 'editor',
  styleUrls: [
    './editor.component.less',
    '../../styles/main.less',
  ],
  templateUrl: './editor.component.html',
})

export class EditorComponent implements OnInit, AfterViewInit {
  @ViewChild('editModal') public editModal: ModalDirective;
  public totalEditSteps: number = 0;
  public currentEditStep: number = 0;
  public creatingElementOfType: string = '';
  @select(['app', 'editing']) public readonly editing$: Observable<boolean>;
  @select(['app', 'advancedExpMode']) public readonly advancedExpMode$: Observable<boolean>;
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
  ) {
    //
  }

  public ngOnInit(): void {
    this.editSrv.currentTotalSteps.subscribe((data) => {
      // console.log("LOG (editor) subscribed to counter ", data);
      this.currentEditStep = data.current;
      this.totalEditSteps = data.total;
    });
    this.mapSrv.map.on('click', (event: MouseEvent) => {
      if (this.ngRedux.getState()['app']['editing'] && this.creatingElementOfType !== '') {
        this.editSrv.createElement(this.creatingElementOfType, event);
        this.creatingElementOfType = '';
        if (this.ngRedux.getState()['app']['tutorialMode'] === false) {
          this.storageSrv.tutorialStepCompleted.emit(true);
        }
      }
    });
  }

  public ngAfterViewInit(): void {
    if (this.storageSrv.getLocalStorageItem('edits')) {
      this.editModal.show();
    } else {
      this.storageSrv.setLocalStorageItem('edits', []);
    }
    console.log('LOG (editor) Current edits are: ', this.storageSrv.edits);
  }

  public isAuthenticated(): void {
    return this.authSrv.oauth.authenticated();
  }

  /**
   * Provides access to editing service function.
   */
  public continueEditing(): void {
    this.storageSrv.edits = this.storageSrv.getLocalStorageItem('edits');
    this.editModal.hide();
    this.editSrv.continueEditing();
  }

  /**
   * Deletes current edits create in the localStorage.
   */
  public deleteEdits(): void {
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
  private stepBackward(): void {
    this.currentEditStep--;
    this.editSrv.currentTotalSteps.emit({
      current: this.currentEditStep, total: this.totalEditSteps,
    });
    this.editSrv.step('backward');
  }

  /**
   * Provides access to editing service function.
   */
  private stepForward(): void {
    this.currentEditStep++;
    console.log('LOG (editor)', this.currentEditStep, this.totalEditSteps);
    this.editSrv.currentTotalSteps.emit({
      current: this.currentEditStep, total: this.totalEditSteps,
    });
    this.editSrv.step('forward');
  }

  /**
   * Provides access to editing service function.
   * @param type
   */
  private createElement(type: string): void {
    this.creatingElementOfType = this.creatingElementOfType === type ? '' : type;
    if (this.ngRedux.getState()['app']['tutorialMode'] === false) {
      this.storageSrv.tutorialStepCompleted.emit(true);
    }
  }

  /**
   * Checks if buttons used to move between edits should be active.
   * @param type - "forward" or "backward" button
   * @returns {boolean} - when true then button is disabled
   */
  private isInactive(type: string): boolean {
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
  private toggleEditMode(): void {
    this.appActions.actToggleEditing();
    let editing = this.ngRedux.getState()['app']['editing'];
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
    if (this.ngRedux.getState()['app']['tutorialMode'] === false) {
      this.storageSrv.tutorialStepCompleted.emit(true);
    }
  }

  public routeCreationWizard(): void {
    this.modalRefRouteWiz = this.modalService.show(RouteWizardComponent, { class: 'modal-lg', ignoreBackdropClick: true });
    this.appActions.actSetWizardMode('route wizard');
  }

  public routeMasterCreationWizard(): void {
    this.modalRefRouteMasterWiz = this.modalService.show(RouteMasterWizardComponent, { class: 'modal-lg', ignoreBackdropClick: true });
    this.appActions.actSetWizardMode('route master wizard');
  }
}
