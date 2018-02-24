import { loadingReducer } from './loading.reducer';
import * as fromTest from '../reducers/loading.reducer';

describe('TestReducer', () => {

  describe('undefined action', () => {
    it('should return the default state', () => {
      const action = {} as any;

      const result = loadingReducer(undefined, action);
      expect(result).toEqual(fromTest.initialState);
    });
  });

});
