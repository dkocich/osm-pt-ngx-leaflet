import { Db } from '../database/dexiedb';
import { StorageService } from './storage.service';
import { Injectable } from '@angular/core';

@Injectable()
export class DbService {

  public db: Db;

  constructor(
    private storageSrv: StorageService,
  ) {
    this.db = new Db();
  }

  public async addArea(areaPseudoId: string): Promise<void> {
    this.db.table('AreasGrid').put(true, areaPseudoId)
      .then(() => {
        return;
      })
      .catch((err) => {
        throw new Error(err.toString());
      });
  }

  public async hasArea(areaPseudoId: string): Promise<boolean> {
    return this.db.table('AreasGrid').where(':id').equals(areaPseudoId).first()
      .then((item) => {
        return !!item;
      })
      .catch((err) => {
        throw new Error(err.toString());
      });
  }

  public deleteExpiredDataIDB(): void {
    this.db.AreasGrid.clear()
      .then(() => {
        return;
      })
      .catch((err) => {
        throw new Error(err.toString());
      });
  }
}
