import { Injectable } from '@angular/core';
import { NgRedux } from '@angular-redux/store';
import { Action } from 'redux';
import { IAppState } from '../model';

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
  static readonly SET_BEGINNER_VIEW = 'SET_BEGINNER_VIEW';

  // basic sync action
  public actToggleEditing = (): Action => {
    return this.ngRedux.dispatch({
      type: AppActions.TOGGLE_EDITING,
    });
  }

  // basic sync action
  public actSelectElement = (args): Action => {
    const { element } = args;
    return this.ngRedux.dispatch({
      type: AppActions.SELECT_ELEMENT,
      payload: element,
    });
  }

  // basic sync action
  public actSetAdvancedExpMode = (payload: boolean): Action => {
    return this.ngRedux.dispatch({ type: AppActions.SET_ADVANCED_EXP_MODE, payload });
  }

  // basic sync action
  public actSetGoodConnectMode = (payload: boolean): Action => {
    return this.ngRedux.dispatch({ type: AppActions.SET_GOOD_CONNECT_MODE, payload });
  }

  public actSetBeginnerView = (payload: string): Action => {
    return this.ngRedux.dispatch({ type: AppActions.SET_BEGINNER_VIEW, payload });
  }
}
