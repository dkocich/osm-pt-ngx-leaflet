import * as loading from '../actions/loading.actions';

export interface IState {
  loading: boolean;
  entities: {
    [id: string]: any,
  };
  result: string[];
}

export const initialState: IState = {
  loading: false,
  entities: {},
  result: [],
};

export const loadingReducer = (state: IState = initialState, action: loading.Actions): IState => {
  switch (action.type) {
    case loading.LOAD: {
      return {
        ...state,
        loading: true,
      };
    }

    case loading.LOAD_SUCCESS: {

      return {
        ...state,
        loading: false,
      };
    }

     case loading.LOAD_FAIL: {

      return {
        ...state,
        loading: false,
      };
    }

    default: {
      return state;
    }
  }
};
