import { Injectable } from '@angular/core';
import { NgRedux } from '@angular-redux/store';
import { Action } from 'redux';
import { IAppState } from '../model';
import { ISuggestionsBrowserOptions } from '../../core/editingOptions.interface';

@Injectable()
export class AppActions {
  constructor(
    private ngRedux: NgRedux<IAppState>,
  ) {
    //
  }

  static readonly TOGGLE_EDITING = 'TOGGLE_EDITING';
  static readonly SELECT_ELEMENT = 'SELECT_ELEMENT';
  static readonly SET_ADVANCED_EXP_MODE = 'SET_ADVANCED_EXP_MODE';
  static readonly SET_GOOD_CONNECT_MODE = 'SET_GOOD_CONNECT_MODE';
  static readonly SET_ERROR_CORRECTION_MODE = 'SET_ERROR_CORRECTION_MODE';
  static readonly SET_BEGINNER_VIEW = 'SET_BEGINNER_VIEW';
  static readonly TOGGLE_SWITCH_MODE = 'TOGGLE_SWITCH_MODE';
  static readonly SET_WIZARD_MODE = 'SET_WIZARD_MODE';
  static readonly TOGGLE_TUTORIAL_MODE = 'TOGGLE_TUTORIAL_MODE';

  // basic sync action
  public actToggleEditing = (): Action => {
    return this.ngRedux.dispatch({
      type: AppActions.TOGGLE_EDITING,
    });
  };

  // basic sync action
  public actSelectElement = (args): Action => {
    const { element } = args;
    return this.ngRedux.dispatch({
      type: AppActions.SELECT_ELEMENT,
      payload: element,
    });
  };

  // basic sync action
  public actSetAdvancedExpMode = (payload: boolean): Action => {
    return this.ngRedux.dispatch({ type: AppActions.SET_ADVANCED_EXP_MODE, payload });
  };

  // basic sync action
  public actSetGoodConnectMode = (payload: boolean): Action => {
    return this.ngRedux.dispatch({ type: AppActions.SET_GOOD_CONNECT_MODE, payload });
  };

  public actSetErrorCorrectionMode = (payload: ISuggestionsBrowserOptions): Action => {
    return this.ngRedux.dispatch({ type: AppActions.SET_ERROR_CORRECTION_MODE, payload });
  };

  public actSetBeginnerView = (payload: string): Action => {
    return this.ngRedux.dispatch({ type: AppActions.SET_BEGINNER_VIEW, payload });
  };

  public actToggleSwitchMode = (payload: boolean): Action => {
    return this.ngRedux.dispatch({ type: AppActions.TOGGLE_SWITCH_MODE, payload });
  };

  public actSetWizardMode = (payload: string): Action => {
    return this.ngRedux.dispatch({ type: AppActions.SET_WIZARD_MODE, payload });
  };

  public actToggleTutorialMode = (payload: boolean): Action => {
    return this.ngRedux.dispatch({ type: AppActions.TOGGLE_TUTORIAL_MODE, payload });
  };
}
