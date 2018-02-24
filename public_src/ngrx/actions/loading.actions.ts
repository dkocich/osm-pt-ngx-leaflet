import { Action } from '@ngrx/store';

export const LOAD =                 '[Test] Load';
export const LOAD_SUCCESS =         '[Test] Load Success';
export const LOAD_FAIL =            '[Test] Load Fail';

/**
 * Load Test Actions
 */
export class LoadAction implements Action {
  readonly type = LOAD;
}

export class LoadSuccessAction implements Action {
  readonly type = LOAD_SUCCESS;

  constructor(public payload: any) { }
}

export class LoadFailAction implements Action {
  readonly type = LOAD_FAIL;

  constructor(public payload: any) { }
}

export type Actions =
  | LoadAction
  | LoadSuccessAction
  | LoadFailAction;
