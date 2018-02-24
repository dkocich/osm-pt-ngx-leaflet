import * as test from '../actions/test.actions';

export interface IState {
  loading: boolean;
  entities: { [id: string]: any };
  result: string[];
}

export const initialState: IState = {
  loading: false,
  entities: {},
  result: [],
};

export function reducer(state: IState = initialState, action: test.Actions): IState {
  switch (action.type) {
    case test.LOAD: {
      return {
        ...state,
        loading: true,
      };
    }

    case test.LOAD_SUCCESS: {

      return {
        ...state,
        loading: false,
      };
    }

     case test.LOAD_FAIL: {

      return {
        ...state,
        loading: false,
      };
    }

    default: {
      return state;
    }
  }
}
