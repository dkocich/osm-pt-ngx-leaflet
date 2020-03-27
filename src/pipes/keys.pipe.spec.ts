import { KeysPipe } from './keys.pipe';

describe('KeysPipe', () => {
  let pipe: KeysPipe;

  beforeEach(() => {
    pipe = new KeysPipe();
  });

  it('transforms X to Y', () => {
    const value: any = 'X';
    const args: string[] = [];

    expect(pipe.transform(value, args)).toEqual('Y');
  });

});
