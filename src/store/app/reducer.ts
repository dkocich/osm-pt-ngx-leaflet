import { AnyAction } from 'redux';
import { IAppState } from '../model';
import { AppActions } from './actions';

export const INITIAL_STATE: IAppState = {
  editing: false,
  selectObject: null,
  advancedExpMode: false,
  goodConnectMode: false,
  errorCorrectionMode: null,
  beginnerView: 'stop',
  switchMode: false,
  wizardMode: null,
  tutorialMode: null,
};

export function appReducer(state: IAppState = INITIAL_STATE, actionAction) {
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
    case AppActions.SET_ADVANCED_EXP_MODE:
      return {
        ...state,
        advancedExpMode: action.payload,
      };
    case AppActions.SET_GOOD_CONNECT_MODE:
      return {
        ...state,
        goodConnectMode: action.payload,
      };
    case AppActions.SET_ERROR_CORRECTION_MODE:
      return {
        ...state,
        errorCorrectionMode: action.payload,
      };
    case AppActions.SET_BEGINNER_VIEW:
      return {
        ...state,
        beginnerView: action.payload,
      };
    case AppActions.TOGGLE_SWITCH_MODE:
      return {
        ...state,
        switchMode: action.payload,
      };
    case AppActions.SET_WIZARD_MODE:
      return {
        ...state,
        wizardMode: action.payload,
      };
    case AppActions.TOGGLE_TUTORIAL_MODE:
      return {
        ...state,
        tutorialMode: action.payload,
      };
    default:
      // We don't care about any other actions right now.
      return state;
  }
}
