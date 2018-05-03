import { Action, AnyAction } from 'redux';
import { IAppState, IRootAppState } from '../model';
import { AppActions } from './actions';

export const INITIAL_STATE: IAppState = {
  editing: false,
  selectObject: null,
};

export function appReducer(state: IAppState = INITIAL_STATE, action: AnyAction): any {
  switch (action.type) {
    case AppActions.TOGGLE_EDITING:
      return {
        ...state,
        editing: !state.editing,
      };
    case AppActions.SELECT_ELEMENT:
      return {
        ...state,
        selectObject: action.payload,
      };
    default:
      // We don't care about any other actions right now.
      return state;
  }
}
