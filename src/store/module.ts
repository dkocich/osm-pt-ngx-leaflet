import { provideReduxForms } from '@angular-redux/form';
import { NgReduxRouter, NgReduxRouterModule } from '@angular-redux/router';
// Angular-redux ecosystem stuff.
// @angular-redux/form and @angular-redux/router are optional
// extensions that sync form and route location state between
// our store and Angular.
import {
  DevToolsExtension,
  NgRedux,
  NgReduxModule,
} from '@angular-redux/store';
import { NgModule } from '@angular/core';
// Redux ecosystem stuff.
import { createLogger } from 'redux-logger';
import { RootEpics } from './epics';
// The top-level reducers and epics that make up our app's logic.
import { IRootAppState } from './model';
import { rootReducer } from './reducers';

@NgModule({
  imports: [NgReduxModule, NgReduxRouterModule.forRoot()],
  providers: [RootEpics],
})
export class StoreModule {
  constructor(
    store: NgRedux<IRootAppState>,
    devTools: DevToolsExtension,
    ngReduxRouter: NgReduxRouter,
    rootEpics: RootEpics
  ) {
    // Tell Redux about our reducers and epics. If the Redux DevTools
    // chrome extension is available in the browser, tell Redux about
    // it too.

    const storeEnhancers = devTools.isEnabled() ? [devTools.enhancer()] : [];

    store.configureStore(
      rootReducer,
      {},
      [createLogger()], // , ...rootEpics.createEpics()
      storeEnhancers
    );

    // Enable syncing of Angular router state with our Redux store.
    if (ngReduxRouter) {
      ngReduxRouter.initialize();
    }

    // Enable syncing of Angular form state with our Redux store.
    provideReduxForms(store);
  }
}
