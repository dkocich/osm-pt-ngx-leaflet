import { AfterViewInit, ChangeDetectionStrategy, Component, OnInit, ViewChild } from '@angular/core';

import { AuthService } from '../../services/auth.service';
import { EditService } from '../../services/edit.service';
import { MapService } from '../../services/map.service';
import { StorageService } from '../../services/storage.service';

import { ModalDirective } from 'ngx-bootstrap';
import { select } from '@angular-redux/store';
import { Observable } from 'rxjs';
import { AppActions } from '../../store/app/actions';
import {AutoTasksService} from '../../services/auto-route-creation/auto-tasks.service';

@Component({
  providers: [],
  selector: 'editor',
  styleUrls: [
    './editor.component.less',
    '../../styles/main.less',
  ],
  templateUrl: './editor.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class EditorComponent implements OnInit, AfterViewInit {
  @ViewChild('editModal') public editModal: ModalDirective;
  public totalEditSteps: number = 0;
  public currentEditStep: number = 0;
  public editing: boolean = false;
  public creatingElementOfType: string = '';
  @select(['app', 'editing']) public readonly editing$: Observable<boolean>;

  constructor(
    public appActions: AppActions,
    private authSrv: AuthService,
    private editSrv: EditService,
    private mapSrv: MapService,
    private storageSrv: StorageService,
    private autoTaskSrv: AutoTasksService,
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
      if (this.editing && this.creatingElementOfType !== '') {
        this.editSrv.createElement(this.creatingElementOfType, event);
        this.creatingElementOfType = '';
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
    this.editing = !this.editing;
    this.editSrv.editingMode.emit(this.editing);
    this.mapSrv.editingMode = this.editing;
    if (this.editing) {
      setTimeout(() => {
        this.mapSrv.disableMouseEvent('edits-backward-btn');
        this.mapSrv.disableMouseEvent('edits-forward-btn');
        this.mapSrv.disableMouseEvent('edits-count');
        this.mapSrv.disableMouseEvent('stop-btn');
        this.mapSrv.disableMouseEvent('platform-btn');
      }, 250);
    }
  }
}
