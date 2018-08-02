import { KeysPipe } from './keys.pipe';

describe('KeysPipe', () => {
  let pipe: KeysPipe;

  beforeEach(() => {
    pipe = new KeysPipe();
  });

  it('transforms X to Y', () => {
    const value: any = { key1 : 'value1' };
    const args: string[] = [];

    expect(pipe.transform(value, args)).toEqual([{ key: 'key1' , value : 'value1' }]);
  });

});
