import Dexie from 'dexie';
import { IPtWay } from '../core/ptWay.interface';
import { IPtStop } from '../core/ptStop.interface';
import { IPtRelationNew } from '../core/ptRelationNew.interface';
import { IPtRouteMasterNew } from '../core/ptRouteMasterNew.interface';
import { IMetadata } from '../core/metadata.interface';
export class Db extends Dexie {
  AreasGrid:      Dexie.Table<string,             number>;
  PtStops:        Dexie.Table<IPtStop,            number>;
  PtPlatforms:    Dexie.Table<IPtStop,            number>;
  PtRoutes:       Dexie.Table<IPtRelationNew,     number>;
  PtRouteMasters: Dexie.Table<IPtRouteMasterNew,  number>;
  OSMWays:        Dexie.Table<IPtWay,             number>;
  MetaData:       Dexie.Table<IMetadata,          number>;

  constructor() {
    super('Db');
    this.version(1).stores({
      AreasGrid:      '',
      PtStops:        'id',
      PtPlatforms:    'id',
      PtRoutes:       'id',
      PtRouteMasters: 'id',
      OSMWays:        'id',
      MetaData:       'id, isCompletelyDownloaded, type',
    });
  }
}
