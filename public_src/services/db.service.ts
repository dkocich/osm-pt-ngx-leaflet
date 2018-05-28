import { Db } from '../database/dexiedb';
import { StorageService } from './storage.service';
import { Injectable } from '@angular/core';
@Injectable()
export class DbService {

  public db: Db;

  constructor(private storageSrv: StorageService) {
    this.db = new Db();
  }

  getCompletelyDownloadedElementsId(): any {
    this.db.MetaData.where('isCompletelyDownloaded').equals(1).each((element) => {
      switch (element.type) {
        case 'position' :
          this.storageSrv.completelyDownloadedPlatformsIDB.add(element.id);
          break;
        case 'stop_position':
          this.storageSrv.completelyDownloadedStopsIDB.add(element.id);
          break;
        case 'route_master' :
          this.storageSrv.completelyDownloadedRouteMastersIDB.add(element.id);
          break;
        case 'route' :
          this.storageSrv.completelyDownloadedRoutesIDB.add(element.id);
      }
    }).then(() => {
      console.log('(db s.) ids of completely downloaded  stops in IDB');
      console.log(this.storageSrv.completelyDownloadedStopsIDB);
      console.log('(db s.) ids of completely downloaded  platforms in IDB');
      console.log(this.storageSrv.completelyDownloadedPlatformsIDB);
      console.log('(db s.) ids of completely downloaded  routes in IDB');
      console.log(this.storageSrv.completelyDownloadedRoutesIDB);
      console.log('(db s.) ids of completely downloaded  route master in IDB');
      console.log(this.storageSrv.completelyDownloadedRouteMastersIDB);
    }).catch((err) => {
      console.log('LOG (db s.) Error in fetching ids of completely downloaded elements in IDB');
      console.log(err);
    });
  }

  /***
   * Fetches IDs of routes for which route masters were fetched from Overpass and added to IDB
   * @returns {any}
   */
  getIdsQueriedRoutesForMaster(): any {
   this.db.MetaData.where('type').equals('route').each((route) => {
     if (route.isQueriedForMasters === 1) {
       this.storageSrv.queriedMasters.add(route.id);
     }
   }).then(() => {
     console.log('LOG (db s.) ids of routes for which masters have been queried and added to IDB');
     console.log(this.storageSrv.queriedMasters);
   }).catch((err) => {
     console.log('LOG (db s.) Error in fetching ids of routes for which masters have been queried and added to IDB');
     console.log(err);
   });
  }
  /***
   * Adds route masters and related metadata to IDB
   * @param masterRoutes
   * @returns {any}
   */
  addRouteMasters(masterRoutes: any): any {
    return this.db.transaction('rw', this.db.PtRouteMasters, this.db.MetaData, () => {

       this.db.PtRouteMasters.bulkPut(masterRoutes).then(() => {
         console.log('LOG (db s.) Added route masters with id [ ' + masterRoutes.map((masterRoute) => {
           return masterRoute.id;
         }).join(',') + ' ] to IDB');
       }).catch((err) => {
           console.log('LOG (db s.) Error in adding route masters with id [ ' + masterRoutes.map((masterRoute) => {
             return masterRoute.id;
           }).join(',') + ' ] to IDB, all previous bulkPut addition of route masters will be rolled back');
           throw err;
         });

    }).then(() => {
       console.log('(db s.) Added route masters with id [ ' + masterRoutes.map((masterRoute) => {
        return masterRoute.id;
      }).join(',') + ' ] to IDB');
       let metadataArr = [];
       for (let masterRoute of masterRoutes) {
        metadataArr.push({
          id : masterRoute.id,
          timestamp: Math.floor(Date.now() / 1000),
          type : 'route_master',
        });
      }
       return  this.db.MetaData.bulkAdd(metadataArr).then(() => {
       console.log('LOG (db s.) Added metadata for route masters with id ' + masterRoutes.map((masterRoute) => {
           return masterRoute.id;
         }).join(',') + ' to IDB');
       }).catch((err) => {
         console.log('LOG (db s.) Error in adding metadata for route masters with id ' + masterRoutes.map((masterRoute) => {
           return masterRoute.id;
         }).join(',') + ' to IDB');
         throw err;
       });

    });
  }

  /***
   * Fetches routes for which the given stop is a member from IDB
   * @param {number} stopId
   * @returns {any}
   */
  getRoutesForStop(stopId: number): any {
    return this.db.transaction('rw', this.db.MetaData, this.db.PtRoutes, () => {
      let filteredRoutes = [];
      return this.db.MetaData.get(stopId).then((data) => {
        if (data) {
          let routeIds = data.parentRoutes;
          return this.db.PtRoutes.each((route) => {
            if (routeIds.includes(route.id)) {
              filteredRoutes.push(route);
            }
          }).then(() => {
            return Promise.resolve(filteredRoutes);
          });
        } else {
          return Promise.resolve(filteredRoutes);
        }
      });
    });
  }

  /***
   * Fetches routes for which the given platform is a member from IDB
   * @param {number} platformId
   * @returns {any}
   */

  getRoutesForPlatform(platformId: number): any {
    return this.db.transaction('rw', this.db.MetaData, this.db.PtRoutes, () => {
      let filteredRoutes = [];
      return this.db.MetaData.get(platformId).then((data) => {
        if (data) {
          let routeIds = data.parentRoutes;
          return this.db.PtRoutes.each((route) => {
            if (routeIds.includes(route.id)) {
              filteredRoutes.push(route);
            }
          }).then(() => {
            return Promise.resolve(filteredRoutes);
          });
        } else {
          return Promise.resolve(filteredRoutes);
        }
      });
    });
  }
  /***
   * Routes for which parent masters have been fetched from overpass and added to IDB
   * @param {Array<number>} routeIds
   * @returns {any}
   */
  addToQueriedRoutesForMasters(routeIds: Array<number>): any {
    return this.db.transaction('rw', this.db.MetaData, () => {
      return this.db.MetaData.where('id').anyOf(routeIds).modify({ isQueriedForMasters : 1 }).then(() => {
        console.log('LOG (db s.) Successfully marked QueriedMasters: true for routes  : [ ' + routeIds.map((routeId) => {
          return routeId;
        }).join(',') + ' ] in IDB');
      });
    });
  }
  /**
   * Adds Overpass API 's response to IndexedDb
   * @param response
   * @param id
   * @param {string} type
   * @returns {any}
   */
  public addResponseToIDB(response: any, id: any, type: string): Promise<any> {
    let routeIds = [];
    let routes = [];
    let platforms = [];
    let stops = [];
    let routeMasters = [];
    let ways = [];
    let platformsMetaData = [];
    let stopsMetaData = [];
    let routesMetaData = [];
    let routeMastersMetaData = [];
    let waysMetaData = [];
    for (let element of response.elements) {
      switch (element.type) {
        case 'node':
          if (element.tags.public_transport === 'platform') {
            platforms.push(element);
            platformsMetaData.push({ id: element.id, timestamp: Math.floor(Date.now() / 1000),
                                     type: 'platform', parentRoutes : [], isCompletelyDownloaded : 0});
          }
          if (element.tags.public_transport === 'stop_position') {
            stops.push(element);
            stopsMetaData.push({ id: element.id, timestamp: Math.floor(Date.now() / 1000),
                                 type: 'stop_position', parentRoutes : [], isCompletelyDownloaded : 0});
          }
          break;
        case 'relation':
          if (element.tags.type === 'route') {
            routes.push(element);
            routesMetaData.push({ id: element.id, timestamp: Math.floor(Date.now() / 1000),
                                  type: 'route', memberStops : [], memberPlatforms : [] , isCompletelyDownloaded : 0});
            if (type === 'stop_position') {
              routeIds.push(element.id);
            }
            if (type === 'platform') {
              routeIds.push(element.id);
            }
          }
          if (element.tags.type === 'route_master') {
            routeMasters.push(element);
            routeMastersMetaData.push({ id: element.id, timestamp: Math.floor(Date.now() / 1000),
                                        type: 'route_master', isCompletelyDownloaded : 0});
          }
          break;
        case 'way':
          ways.push(element);
          waysMetaData.push({ id: element.id, timestamp: Math.floor(Date.now() / 1000),
                              type: 'way', isCompletelyDownloaded : 0});

          break;
      }
    }
    return this.db.transaction('rw', [this.db.PtRoutes, this.db.PtStops,
      this.db.PtPlatforms, this.db.PtWays, this.db.PtRouteMasters, this.db.MetaData], () => {
      if (platforms.length !== 0) {
        this.db.PtPlatforms.bulkPut(platforms).then(() => {
          console.log('LOG (db s.) Added platforms : [ ' + platforms.map((platform) => {
            return platform.id;
          }).join(',') + ' ] to IDB for Overpass API \'s response of :' + id);
        }).catch((err) => {
          console.log('LOG (db s.) Error in adding platforms to IDB, all previous ' +
            'operations for this particular transaction (not metadata) will be rolled back');
          console.log(err);
          throw err;
        });

      }
      if (stops.length !== 0) {
        this.db.PtStops.bulkPut(stops).then(() => {
          console.log('LOG (db s.) Added stops : [ ' + stops.map((stop) => {
            return stop.id;
          }).join(',') + ' ] to IDB for overpass API \'s response of : ' + id);
        }).catch((err) => {
          console.log('LOG (db s.) Error in adding stops to IDB, all previous ' +
            'operations for this particular transaction (not metadata) will be rolled back');
          console.log(err);
          throw err;
        });
      }
      if (ways.length !== 0) {
        this.db.PtWays.bulkPut(ways).then(() => {
          console.log('LOG (db s.) Added ways : [ ' + ways.map((way) => {
            return way.id;
          }).join(',') + ' ] to IDB for overpass API \'s Overpass API \'s response of : ' + id);
        }).catch((err) => {
          console.log('LOG (db s.) Error in adding ways to IDB, all previous ' +
            ' operations for this particular transaction (not metadata) will be rolled back');
          console.log(err);
          throw err;
        });
      }
      if (routeMasters.length !== 0) {
        this.db.PtRouteMasters.bulkPut(routeMasters).then(() => {
          console.log('LOG (db s.) Added route masters : [ ' + routeMasters.map((routeMaster) => {
            return routeMaster.id;
          }).join(',') + ' ] to IDB for overpass API \'s Overpass API \'s response of :' + id);
        }).catch((err) => {
          console.log('LOG (db s.) Error in adding route masters to IDB, all previous ' +
            ' operations for this particular transaction (not metadata) will be rolled back');
          console.log(err);
          throw err;
        });
      }
      if (routes.length !== 0) {
        this.db.PtRoutes.bulkPut(routes).then(() => {
          console.log('LOG (db s.) Added routes : [ ' + routes.map((route) => {
            return route.id;
          }).join(',') + ' ] to IDB for Overpass API \'s response of : ' + id);
        }).catch((err) => {
          console.log('LOG (db s.) Error in adding routes to IDB, all previous ' +
            ' operations for this particular transaction (not metadata) will be rolled back');
          console.log(err);
          throw err;
        });
      }

    }).then(() => {
      console.log('LOG (db s.) Successfully added Overpass API \'s response for id: ' + id + ' to IDB (not metadata)');
      return this.addMetaData(routeIds, id, type, stopsMetaData, platformsMetaData, routesMetaData,
        routeMastersMetaData, waysMetaData).then(() => {
        console.log('LOG (db s.) Successfully added metadata for Overpass API \'s response for id: ' + id + ' to IDB');
        switch (type) {
          case 'stop_position':
            this.storageSrv.completelyDownloadedStopsIDB.add(id);
            break;
          case 'platform':
            this.storageSrv.completelyDownloadedPlatformsIDB.add(id);
            break;
          case 'route':
            this.storageSrv.completelyDownloadedRoutesIDB.add(id);
            break;
          case 'route_master':
            this.storageSrv.completelyDownloadedRouteMastersIDB.add(id);
        }
      }).catch((err) => {
        console.log('LOG (db s.) Error in adding metadata, all previous metadata addition for' +
          ' this transaction will be rolled back for Overpass API \'s response for id: ' + id + ' to IDB');
        this.storageSrv.completelyDownloadedStopsIDB.delete(id);
        this.storageSrv.completelyDownloadedRoutesIDB.delete(id);
        this.storageSrv.completelyDownloadedPlatformsIDB.delete(id);
        console.log(err);
        throw err;
      });
    });
  }

  /***
   * Fetches nodes for a given route from IDB
   * @param {number} relId
   * @returns {any}
   */
  public getMembersForRoute(relId: number): any {
    return this.db.transaction('rw', this.db.PtStops, this.db.PtRoutes, this.db.PtPlatforms, () => {
      let memberIds = [];
      let stops = [];
      let platforms = [];
      return this.db.PtRoutes.get(relId).then((route) => {
        for (let member of route.members) {
          memberIds.push(member['ref']);
        }
        return this.db.transaction('rw', this.db.PtStops, this.db.PtRoutes, this.db.PtPlatforms, () => {
          this.db.PtStops.where('id').anyOf(memberIds).each((stop) => {
            stops.push(stop);
          }).then(() => {
            console.log('Matching stops from IDB : ' + stops.map((stop) => {
              return stop.id;
            }).join(' , '));
          });
          this.db.PtPlatforms.where('id').anyOf(memberIds).each((platform) => {
            platforms.push(platform);
          }).then(() => {
            console.log('Matching platforms from IDB : ' + platforms.map((platform) => {
              return platform.id;
            }).join(' , '));
          });
        }).then(() => {
          let object = {
            elements: stops.concat(platforms),
          };
          return Promise.resolve(object);
        });
      });
    });
  }

  /***
   * Gets all parent route_masters for given routeIDs
   * @param {Array<number>} routeIds
   * @returns {any}
   */

  getRoutesForMasterRoute(routeIds: Array<number>): any {
    let filteredMasters = [];
    return this.db.PtRouteMasters.each((routeMaster) => {
      routeMaster['members'].forEach((element) => {
        if (routeIds.includes(element['ref'])) {
          filteredMasters.push(routeMaster);
        }
      });
    }).then(() => {
      let routesObject = {
        elements: filteredMasters,
      };
      console.log(routesObject);
      return Promise.resolve(routesObject);
    });
  }

  /***
   * Deletes old data from IDB
    * @returns {any}
   */
  deleteExpiredDataIDB(): any {
    return this.db.transaction('rw', [this.db.PtStops, this.db.PtRoutes,
      this.db.PtPlatforms, this.db.MetaData, this.db.PtWays, this.db.PtRouteMasters], () => {

      return this.db.MetaData.toCollection().modify((value, ref) => {
        if (Math.floor(Date.now() / 1000) - value['timestamp'] >= 50000) {
          delete ref.value;
          if (value['type'] === 'platform') {
            return this.db.PtPlatforms.where('id').equals(value.id).delete().then(() => {
              console.log('LOG (db s.) Successfully deleted platform with id ' + value.id + ' from IDB');
            }).catch((err) => {
              console.log('LOG (db s.) Error in deleting platform with id ' + value.id + ' from IDB');
              console.log(err);
              throw err;
            });

          }
          if (value['type'] === 'stop') {
            return this.db.PtStops.where('id').equals(value.id).delete().then(() => {
              console.log('LOG (db s.) Successfully deleted stop with id ' + value.id + ' from IDB');
            }).catch((err) => {
              console.log('LOG (db s.) Error in deleting stop with id ' + value.id + ' from IDB');
              console.log(err);
              throw err;
            });

          }
          if (value['type'] === 'route_master') {
            return this.db.PtRouteMasters.where('id').equals(value.id).delete().then(() => {
              console.log('LOG (db s.) Successfully deleted route master with id ' + value.id + ' from IDB');
            }).catch((err) => {
              console.log('LOG (db s.) Error in deleting route master with id ' + value.id + ' from IDB');
              console.log(err);
              throw err;
            });

          }
          if (value['type'] === 'way') {
            return this.db.PtWays.where('id').equals(value.id).delete().then(() => {
              console.log('LOG (db s.) Successfully deleted way with id ' + value.id + ' from IDB');
            }).catch((err) => {
              console.log('LOG (db s.) Error in deleting way with id ' + value.id + ' from IDB');
              console.log(err);
              throw err;
            });
          }
          if (value['type'] === 'route') {
            return this.db.PtRoutes.where('id').equals(value.id).delete().then(() => {
              console.log('LOG (db s.) Successfully deleted route with id ' + value.id + ' from IDB');
              this.db.MetaData.where('type').anyOf(['stop_position', 'platform']).modify((item, ref2) => {
                if (item.parentRoutes.includes(value.id)) {
                  ref2.value.parentRoutes = item.parentRoutes.filter((e) => {
                    return e !== value.id;
                  });
                }
              }).then(() => {
                console.log('LOG (db s.) Successfully deleted route from parentRoutes with id' + value.id + ' from IDB');
              }).catch((err) => {
                console.log('LOG (db s.) Error in deleting route from parentRoutes with id ' + value.id + ' in metadata from IDB');
                console.log(err);
                throw err;
              });
            }).catch((err) => {
              console.log('LOG (db s.) Error in deleting route with id ' + value.id + ' from IDB');
              console.log(err);
              throw err;
            });
          }
        }
      });
    });
  }

  /***
   * Adds metadata to IDB
   * @param {Array<number>} routeIds
   * @param {number} id
   * @param {string} type
   * @param stopsMetaData
   * @param platformsMetaData
   * @param routesMetaData
   * @param routeMastersMetaData
   * @param waysMetaData
   * @returns {any}
   */
  addMetaData(routeIds: Array<number>, id: number, type: string, stopsMetaData: any, platformsMetaData: any, routesMetaData: any,
              routeMastersMetaData: any, waysMetaData: any): any {

    return this.db.transaction('rw', [this.db.PtRoutes, this.db.PtStops,
      this.db.PtPlatforms, this.db.PtWays, this.db.PtRouteMasters, this.db.MetaData], () => {
      if (type === 'stop_position') {
        for (let stop of stopsMetaData) {
          if (stop.id === id) {
            stop.parentRoutes = routeIds;
            stop.isCompletelyDownloaded = 1;
            break;
          }
        }
      }
      if (type === 'platform') {
        for (let platform of platformsMetaData) {
          if (platform.id === id) {
            platform.parentRoutes = routeIds;
            platform.isCompletelyDownloaded = 1;
            break;
          }
        }
      }
      if (type === 'route') {
        for (let route of routesMetaData) {
          if (route.id === id) {
            route.isCompletelyDownloaded = 1;
            break;
          }
        }
      }
      return this.db.MetaData.bulkPut(platformsMetaData.concat(stopsMetaData, waysMetaData, routeMastersMetaData, routesMetaData));
    });
  }
}
