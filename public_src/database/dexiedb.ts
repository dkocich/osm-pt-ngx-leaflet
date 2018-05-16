import Dexie from 'dexie';
import { IPtWay } from '../core/ptWay.interface';
import { IDownloadedRoutes } from '../core/IDBinterfaces/downloadedRoutesIDB';
import { IDownloadedStops } from '../core/IDBinterfaces/downloadedStopsIDB';
import { IPtStop } from '../core/ptStop.interface';
import { IPtRelationNew } from '../core/ptRelationNew.interface';
import { IPtRouteMasterNew } from '../core/ptRouteMasterNew.interface';
import { IRoutesForStopIDB } from '../core/IDBinterfaces/RoutesForStop';
export class Db extends Dexie {
  PtStops:  Dexie.Table<IPtStop, string>;
  PtPlatforms: Dexie.Table<IPtStop, string>;
  PtRoutes: Dexie.Table<IPtRelationNew, string>;
  PtRouteMasters: Dexie.Table<IPtRouteMasterNew, string>;
  PtWays: Dexie.Table<IPtWay, number>;
  CompletelyDownloadedStops: Dexie.Table<IDownloadedStops, string>;
  CompletelyDownloadedPlatforms: Dexie.Table<IDownloadedStops, string>;
  CompletelyDownloadedRoutes: Dexie.Table<IDownloadedRoutes, string>;
  RoutesForStops: Dexie.Table<IRoutesForStopIDB, string>;
  RoutesForPlatforms: Dexie.Table<IRoutesForStopIDB, string>;
  constructor() {
    super('Database');
    this.version(1).stores({
      PtStops: 'id',
      PtPlatforms: 'id',
      PtRoutes: 'id',
      PtRouteMasters: 'id',
      PtWays: 'id',
      CompletelyDownloadedStops: 'id',
      CompletelyDownloadedPlatforms: 'id',
      CompletelyDownloadedRoutes: 'id',
      RoutesForPlatforms : 'id',
      RoutesForStops : 'id',
    });
  }
}
