// Define the global store shape by combining our application's
// reducers together into a given structure.
import { composeReducers, defaultFormReducer } from '@angular-redux/form';
import { routerReducer } from '@angular-redux/router';
import { combineReducers } from 'redux';
import { appReducer } from './app/reducer';

export const rootReducer = composeReducers(
  defaultFormReducer(),
  combineReducers({
    app: appReducer,
    router: routerReducer,
  })
);
