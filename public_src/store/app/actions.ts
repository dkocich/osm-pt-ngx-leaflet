import { Injectable } from '@angular/core';
import { dispatch, NgRedux } from '@angular-redux/store';
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
  static readonly ADD_TO_LISTOFSTOPS = 'ADD_TO_LISTOFSTOPS';

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
  public actAddToListOfStops = (args): Action => {
    console.log('ac add to list of stops');
    const { newStops } = args;
    return this.ngRedux.dispatch({
      type: AppActions.ADD_TO_LISTOFSTOPS,
      payload : {
        newStops,
      },
    });
  }

}
