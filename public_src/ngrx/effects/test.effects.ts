import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { Observable } from 'rxjs/Observable';
import { TestService } from '../services/test.service';
import * as test from '../actions/test.actions';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

@Injectable()
export class TestEffects {
  constructor(
    private testService: TestService,
    private actions$: Actions,
  ) { }

  @Effect() get$ = this.actions$
      .ofType(test.LOAD)
      .switchMap((payload) => this.testService.get()
        // If successful, dispatch success action with result
        .map((res) => ({ type: test.LOAD_SUCCESS, payload: res.json() }))
        // If request fails, dispatch failed action
        .catch(() => Observable.of({ type: test.LOAD_FAIL })),
      );
}
