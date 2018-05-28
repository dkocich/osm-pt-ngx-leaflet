import Dexie from 'dexie';

export class Db extends Dexie {
  AreasGrid: Dexie.Table<string, number>;

  constructor() {
    super('Db');
    this.version(1).stores({
      AreasGrid: '',
    });
  }
}
