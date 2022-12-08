import {Store} from '@ngrx/store';import { Injectable } from '@angular/core';
import { Action } from 'redux';
import { ISuggestionsBrowserOptions } from '../../core/editingOptions.interface';
import { IAppState } from '../model';

@Injectable()
export class AppActions {
  constructor(
    private store: Store<IAppState>,
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
  actToggleEditing = (): Action => {
    return this.store.dispatch({
      type: AppActions.TOGGLE_EDITING,
    });
  }

  // basic sync action
  actSelectElement = (args): Action => {
    const { element } = args;
    return this.store.dispatch({
      type: AppActions.SELECT_ELEMENT,
      payload: element,
    });
  }

  // basic sync action
  actSetAdvancedExpMode = (payload: boolean): Action => {
    return this.store.dispatch({ type: AppActions.SET_ADVANCED_EXP_MODE, payload });
  }

  // basic sync action
  actSetGoodConnectMode = (payload: boolean): Action => {
    return this.store.dispatch({ type: AppActions.SET_GOOD_CONNECT_MODE, payload });
  }

  actSetErrorCorrectionMode = (payload: ISuggestionsBrowserOptions): Action => {
    return this.store.dispatch({ type: AppActions.SET_ERROR_CORRECTION_MODE, payload });
  }

  actSetBeginnerView = (payload: string): Action => {
    return this.store.dispatch({ type: AppActions.SET_BEGINNER_VIEW, payload });
  }

  actToggleSwitchMode = (payload: boolean): Action => {
    return this.store.dispatch({ type: AppActions.TOGGLE_SWITCH_MODE, payload });
  }

  actSetWizardMode = (payload: string): Action => {
    return this.store.dispatch({ type: AppActions.SET_WIZARD_MODE, payload });
  }

  actToggleTutorialMode = (payload: boolean): Action => {
    return this.store.dispatch({type: AppActions.TOGGLE_TUTORIAL_MODE, payload});
  };
}
