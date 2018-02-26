// Initial state is the place you define all initial values for the Redux store of the feature.

// In the 'standard' way, initialState is defined in reducers: http://redux.js.org/docs/basics/Reducers.html
// But when application grows, there will be multiple reducers files,
// it's not intuitive what data is managed by the whole store.
// So Rekit extracts the initial state definition into a separate module so that you can have
// a quick view about what data is used for the feature, at any time.

export interface IRootAppState {
  // app: IAppState;
  routes?: any;
}

export interface IAppState {
  editing: boolean;
  selectObject: number;
}
