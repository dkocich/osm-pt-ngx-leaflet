import { ConfService } from './conf.service';

describe('ConfService', () => {
  let service: ConfService;

  beforeEach(() => {
    service = new ConfService();
  });

  it('works', () => {
    expect(1).toEqual(2);
  });
});
