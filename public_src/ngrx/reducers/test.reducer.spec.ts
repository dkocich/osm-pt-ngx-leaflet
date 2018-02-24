import { reducer } from '../reducers/test.reducer';
import * as fromTest from '../reducers/test.reducer';

describe('TestReducer', () => {

  describe('undefined action', () => {
    it('should return the default state', () => {
      const action = {} as any;

      const result = reducer(undefined, action);
      expect(result).toEqual(fromTest.initialState);
    });
  });

});