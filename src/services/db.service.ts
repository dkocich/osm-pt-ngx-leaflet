import { Db } from '../database/dexiedb';
import { StorageService } from './storage.service';
import { Injectable } from '@angular/core';

@Injectable()
export class DbService {
  db: Db;

  constructor(private storageSrv: StorageService) {
    this.db = new Db();
  }

  async addArea(areaPseudoId: string): Promise<void> {
    this.db
      .table('AreasGrid')
      .put(true, areaPseudoId)
      .then(() => {
        return;
      })
      .catch((err) => {
        throw new Error(JSON.stringify(err));
      });
  }

  async hasArea(areaPseudoId: string): Promise<boolean> {
    return this.db
      .table('AreasGrid')
      .where(':id')
      .equals(areaPseudoId)
      .first()
      .then((item) => {
        return !!item;
      })
      .catch((err) => {
        throw new Error(JSON.stringify(err));
      });
  }

  deleteExpiredDataIDB(): void {
    this.db.AreasGrid.clear()
      .then(() => {
        return;
      })
      .catch((err) => {
        throw new Error(JSON.stringify(err));
      });
  }

  getCompletelyDownloadedElementsId() {
    this.db.MetaData.where('isCompletelyDownloaded')
      .equals(1)
      .each((element) => {
        switch (element.type) {
          case 'platform':
            this.storageSrv.completelyDownloadedPlatformsIDB.add(element.id);
            break;
          case 'stop_position':
            this.storageSrv.completelyDownloadedStopsIDB.add(element.id);
            break;
          case 'route':
            this.storageSrv.completelyDownloadedRoutesIDB.add(element.id);
        }
      })
      .then(() => {
        console.log('(db s.) ids of completely downloaded  stops in IDB');
        console.log(this.storageSrv.completelyDownloadedStopsIDB);
        console.log('(db s.) ids of completely downloaded  platforms in IDB');
        console.log(this.storageSrv.completelyDownloadedPlatformsIDB);
        console.log('(db s.) ids of completely downloaded  routes in IDB');
        console.log(this.storageSrv.completelyDownloadedRoutesIDB);
      })
      .catch((err) => {
        console.log(
          'LOG (db s.) Error in fetching ids of completely downloaded elements in IDB'
        );
        console.error(err);
        throw new Error(JSON.stringify(err));
      });
  }

  /**
   * Fetches IDs of routes for which route masters were fetched from Overpass and added to IDB
   */
  getIdsQueriedRoutesForMaster() {
    this.db.MetaData.where('type')
      .equals('route')
      .each((route) => {
        if (route.isQueriedForMasters === 1) {
          this.storageSrv.queriedRoutesForMastersIDB.add(route.id);
        }
      })
      .then(() => {
        console.log(
          'LOG (db s.) IDs of routes for which masters have been queried and added to IDB'
        );
        console.log(this.storageSrv.queriedRoutesForMastersIDB);
      })
      .catch((err) => {
        console.log(
          'LOG (db s.) Error in fetching IDs of routes for which masters have been queried and added to IDB'
        );
        console.error(err);
        throw new Error(JSON.stringify(err));
      });
  }

  /**
   * Fetches routes for which the given stop is a member from IDB
   */
  getRoutesForStop(stopId: number) {
    return this.db.transaction('r', this.db.MetaData, this.db.PtRoutes, () => {
      const filteredRoutes = [];
      return this.db.MetaData.get(stopId).then((data) => {
        if (data) {
          const routeIds = data.parentRoutes;
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

  /**
   * Fetches routes for which the given platform is a member from IDB
   */

  getRoutesForPlatform(platformId: number) {
    return this.db.transaction('r', this.db.MetaData, this.db.PtRoutes, () => {
      const filteredRoutes = [];
      return this.db.MetaData.get(platformId).then((data) => {
        if (data) {
          const routeIds = data.parentRoutes;
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

  /**
   * Marks Routes for which parent masters have been fetched from overpass and added to IDB
   */
  addToQueriedRoutesForMasters(routeIds: number[]) {
    return this.db.transaction('rw', this.db.MetaData, () => {
      return this.db.MetaData.where('id')
        .anyOf(routeIds)
        .modify({ isQueriedForMasters: 1 })
        .then(() => {
          console.log(
            'LOG (db s.) Successfully marked QueriedMasters: true for routes  : [ ' +
              routeIds
                .map((routeId) => {
                  return routeId;
                })
                .join(',') +
              ' ] in IDB'
          );
        });
    });
  }

  /**
   * Adds Overpass API 's response to IndexedDb
   */
  addResponseToIDB(response, type: string, id?): Promise<any> {
    const routeIds = [];
    const routes = [];
    const platforms = [];
    const stops = [];
    const routeMasters = [];
    const ways = [];
    const platformsMetaData = [];
    const stopsMetaData = [];
    const routesMetaData = [];
    const routeMastersMetaData = [];
    const waysMetaData = [];
    for (const element of response.elements) {
      switch (element.type) {
        case 'node':
          if (element.tags.public_transport === 'platform') {
            platforms.push(element);
            platformsMetaData.push({
              id: element.id,
              timestamp: Math.floor(Date.now() / 1000),
              type: 'platform',
              parentRoutes: [],
              isCompletelyDownloaded: 0,
            });
          }
          if (element.tags.public_transport === 'stop_position') {
            stops.push(element);
            stopsMetaData.push({
              id: element.id,
              timestamp: Math.floor(Date.now() / 1000),
              type: 'stop_position',
              parentRoutes: [],
              isCompletelyDownloaded: 0,
            });
          }
          break;
        case 'relation':
          if (element.tags.type === 'route') {
            routes.push(element);
            routesMetaData.push({
              id: element.id,
              timestamp: Math.floor(Date.now() / 1000),
              type: 'route',
              memberStops: [],
              memberPlatforms: [],
              isCompletelyDownloaded: 0,
            });
            if (type === 'stop_position') {
              routeIds.push(element.id);
            }
            if (type === 'platform') {
              routeIds.push(element.id);
            }
          }
          if (element.tags.type === 'route_master') {
            routeMasters.push(element);
            routeMastersMetaData.push({
              id: element.id,
              timestamp: Math.floor(Date.now() / 1000),
              type: 'route_master',
              isCompletelyDownloaded: 0,
            });
          }
          break;
        case 'way':
          ways.push(element);
          waysMetaData.push({
            id: element.id,
            timestamp: Math.floor(Date.now() / 1000),
            type: 'way',
            isCompletelyDownloaded: 0,
          });

          break;
      }
    }
    return this.db
      .transaction(
        'rw',
        [
          this.db.PtRoutes,
          this.db.PtStops,
          this.db.PtPlatforms,
          this.db.OSMWays,
          this.db.PtRouteMasters,
          this.db.MetaData,
        ],
        () => {
          if (platforms.length !== 0) {
            this.db.PtPlatforms.bulkPut(platforms)
              .then(() => {
                console.log(
                  'LOG (db s.) Added platforms : [ ' +
                    platforms
                      .map((platform) => {
                        return platform.id;
                      })
                      .join(',') +
                    " ] to IDB for Overpass API 's response"
                );
              })
              .catch((err) => {
                console.log(
                  'LOG (db s.) Error in adding platforms to IDB, all previous ' +
                    'operations for this particular transaction (not metadata) will be rolled back'
                );
                console.error(err);
                throw new Error(JSON.stringify(err));
              });
          }
          if (stops.length !== 0) {
            this.db.PtStops.bulkPut(stops)
              .then(() => {
                console.log(
                  'LOG (db s.) Added stops : [ ' +
                    stops
                      .map((stop) => {
                        return stop.id;
                      })
                      .join(',') +
                    " ] to IDB for Overpass API 's response"
                );
              })
              .catch((err) => {
                console.log(
                  'LOG (db s.) Error in adding stops to IDB, all previous ' +
                    'operations for this particular transaction (not metadata) will be rolled back'
                );
                console.error(err);
                throw new Error(JSON.stringify(err));
              });
          }
          if (ways.length !== 0) {
            this.db.OSMWays.bulkPut(ways)
              .then(() => {
                console.log(
                  'LOG (db s.) Added ways : [ ' +
                    ways
                      .map((way) => {
                        return way.id;
                      })
                      .join(',') +
                    " ] to IDB for Overpass API 's response"
                );
              })
              .catch((err) => {
                console.log(
                  'LOG (db s.) Error in adding ways to IDB, all previous ' +
                    ' operations for this particular transaction (not metadata) will be rolled back'
                );
                console.error(err);
                throw new Error(JSON.stringify(err));
              });
          }
          if (routeMasters.length !== 0) {
            this.db.PtRouteMasters.bulkPut(routeMasters)
              .then(() => {
                console.log(
                  'LOG (db s.) Added route masters : [ ' +
                    routeMasters
                      .map((routeMaster) => {
                        return routeMaster.id;
                      })
                      .join(',') +
                    ' ] to IDB for Overpass API response'
                );
              })
              .catch((err) => {
                console.log(
                  'LOG (db s.) Error in adding route masters to IDB, all previous ' +
                    ' operations for this particular transaction (not metadata) will be rolled back'
                );
                console.error(err);
                throw new Error(JSON.stringify(err));
              });
          }
          if (routes.length !== 0) {
            this.db.PtRoutes.bulkPut(routes)
              .then(() => {
                console.log(
                  'LOG (db s.) Added routes : [ ' +
                    routes
                      .map((route) => {
                        return route.id;
                      })
                      .join(',') +
                    " ] to IDB for Overpass API 's response"
                );
              })
              .catch((err) => {
                console.log(
                  'LOG (db s.) Error in adding routes to IDB, all previous ' +
                    ' operations for this particular transaction (not metadata) will be rolled back'
                );
                console.error(err);
                throw new Error(JSON.stringify(err));
              });
          }
        }
      )
      .then(() => {
        if (id) {
          console.log(
            "LOG (db s.) Successfully added Overpass API 's response for " +
              type +
              ' with ID ' +
              id +
              ' to IDB (not metadata)'
          );
        } else {
          console.log(
            "LOG (db s.) Successfully added Overpass API 's response for " +
              type +
              ' to IDB (not metadata)'
          );
        }
        return this.addMetaData(
          routeIds,
          id,
          type,
          stopsMetaData,
          platformsMetaData,
          routesMetaData,
          routeMastersMetaData,
          waysMetaData
        )
          .then(() => {
            if (id) {
              console.log(
                "LOG (db s.) Successfully added metadata Overpass API 's response for " +
                  type +
                  ' with ID ' +
                  id +
                  ' to IDB '
              );
            } else {
              console.log(
                "LOG (db s.) Successfully added metadata Overpass API 's response for " +
                  type +
                  ' to IDB '
              );
            }
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
            }
          })
          .catch((err) => {
            console.log(
              'LOG (db s.) Error in adding metadata, all previous metadata addition for' +
                " this transaction will be rolled back for Overpass API 's response for id: " +
                id +
                ' to IDB'
            );
            this.storageSrv.completelyDownloadedStopsIDB.delete(id);
            this.storageSrv.completelyDownloadedRoutesIDB.delete(id);
            this.storageSrv.completelyDownloadedPlatformsIDB.delete(id);
            console.error(err);
            throw new Error(JSON.stringify(err));
          });
      });
  }

  /**
   * Adds multiple node download overpass API's response to IDB
   */
  addMultipleResponseToIDB(response, IDs) {
    const parentRoutes = new Map();
    const routes = [];
    const platforms = [];
    const stops = [];
    const routeMasters = [];
    const ways = [];
    const platformsMetaData = [];
    const stopsMetaData = [];
    const routesMetaData = [];
    const routeMastersMetaData = [];
    const waysMetaData = [];

    for (const element of response.elements) {
      switch (element.type) {
        case 'node':
          if (element.tags.public_transport === 'platform') {
            platforms.push(element);
            platformsMetaData.push({
              id: element.id,
              timestamp: Math.floor(Date.now() / 1000),
              type: 'platform',
              parentRoutes: [],
              isCompletelyDownloaded: 0,
            });
          }
          if (element.tags.public_transport === 'stop_position') {
            stops.push(element);
            stopsMetaData.push({
              id: element.id,
              timestamp: Math.floor(Date.now() / 1000),
              type: 'stop_position',
              parentRoutes: [],
              isCompletelyDownloaded: 0,
            });
          }
          break;
        case 'relation':
          if (element.tags.type === 'route') {
            routes.push(element);
            routesMetaData.push({
              id: element.id,
              timestamp: Math.floor(Date.now() / 1000),
              type: 'route',
              memberStops: [],
              memberPlatforms: [],
              isCompletelyDownloaded: 0,
            });
            for (const member of element.members) {
              if (IDs.includes(member.ref)) {
                let parents = [];
                if (!parentRoutes.has(member.ref)) {
                  parents.push(element.id);
                  parentRoutes.set(member.ref, parents);
                } else {
                  parents = parentRoutes.get(member.ref);
                  parents.push(element.id);
                }
              }
            }
          }
          if (element.tags.type === 'route_master') {
            routeMasters.push(element);
            routeMastersMetaData.push({
              id: element.id,
              timestamp: Math.floor(Date.now() / 1000),
              type: 'route_master',
              isCompletelyDownloaded: 0,
            });
          }
          break;
        case 'way':
          ways.push(element);
          waysMetaData.push({
            id: element.id,
            timestamp: Math.floor(Date.now() / 1000),
            type: 'way',
            isCompletelyDownloaded: 0,
          });
          break;
      }
    }
    return this.db
      .transaction(
        'rw',
        [
          this.db.PtRoutes,
          this.db.PtStops,
          this.db.PtPlatforms,
          this.db.OSMWays,
          this.db.PtRouteMasters,
          this.db.MetaData,
        ],
        () => {
          if (platforms.length !== 0) {
            this.db.PtPlatforms.bulkPut(platforms)
              .then(() => {
                console.log(
                  'LOG (db s.) Added platforms : [ ' +
                    platforms
                      .map((platform) => {
                        return platform.id;
                      })
                      .join(',') +
                    " ] to IDB for Overpass API 's response"
                );
              })
              .catch((err) => {
                console.log(
                  'LOG (db s.) Error in adding platforms to IDB, all previous ' +
                    'operations for this particular transaction (not metadata) will be rolled back'
                );
                console.error(err);
                throw new Error(JSON.stringify(err));
              });
          }
          if (stops.length !== 0) {
            this.db.PtStops.bulkPut(stops)
              .then(() => {
                console.log(
                  'LOG (db s.) Added stops : [ ' +
                    stops
                      .map((stop) => {
                        return stop.id;
                      })
                      .join(',') +
                    " ] to IDB for Overpass API 's response"
                );
              })
              .catch((err) => {
                console.log(
                  'LOG (db s.) Error in adding stops to IDB, all previous ' +
                    'operations for this particular transaction (not metadata) will be rolled back'
                );
                console.error(err);
                throw new Error(JSON.stringify(err));
              });
          }
          if (ways.length !== 0) {
            this.db.OSMWays.bulkPut(ways)
              .then(() => {
                console.log(
                  'LOG (db s.) Added ways : [ ' +
                    ways
                      .map((way) => {
                        return way.id;
                      })
                      .join(',') +
                    " ] to IDB for Overpass API 's response"
                );
              })
              .catch((err) => {
                console.log(
                  'LOG (db s.) Error in adding ways to IDB, all previous ' +
                    ' operations for this particular transaction (not metadata) will be rolled back'
                );
                console.error(err);
                throw new Error(JSON.stringify(err));
              });
          }
          if (routeMasters.length !== 0) {
            this.db.PtRouteMasters.bulkPut(routeMasters)
              .then(() => {
                console.log(
                  'LOG (db s.) Added route masters : [ ' +
                    routeMasters
                      .map((routeMaster) => {
                        return routeMaster.id;
                      })
                      .join(',') +
                    ' ] to IDB for Overpass API response'
                );
              })
              .catch((err) => {
                console.log(
                  'LOG (db s.) Error in adding route masters to IDB, all previous ' +
                    ' operations for this particular transaction (not metadata) will be rolled back'
                );
                console.error(err);
                throw new Error(JSON.stringify(err));
              });
          }
          if (routes.length !== 0) {
            this.db.PtRoutes.bulkPut(routes)
              .then(() => {
                console.log(
                  'LOG (db s.) Added routes : [ ' +
                    routes
                      .map((route) => {
                        return route.id;
                      })
                      .join(',') +
                    " ] to IDB for Overpass API 's response"
                );
              })
              .catch((err) => {
                console.log(
                  'LOG (db s.) Error in adding routes to IDB, all previous ' +
                    ' operations for this particular transaction (not metadata) will be rolled back'
                );
                console.error(err);
                throw new Error(JSON.stringify(err));
              });
          }
        }
      )
      .then(() => {
        console.log(
          "LOG (db s.) Successfully added Overpass API 's response for :",
          IDs
        );
        return this.addMetaDataForMultipleResponse(
          stopsMetaData,
          platformsMetaData,
          routesMetaData,
          routeMastersMetaData,
          waysMetaData,
          IDs,
          parentRoutes
        )
          .then(() => {
            console.log(
              "LOG (db s.) Successfully added metadata Overpass API 's response for ",
              IDs
            );
          })
          .catch((err) => {
            console.log(
              'LOG (db s.) Error in adding metadata, all previous metadata addition for' +
                " this transaction will be rolled back for Overpass API 's response for ids: " +
                IDs +
                ' to IDB'
            );
            for (const id of IDs) {
              if (this.storageSrv.completelyDownloadedStopsIDB.has(id)) {
                this.storageSrv.completelyDownloadedStopsIDB.delete(id);
              } else if (
                this.storageSrv.completelyDownloadedRoutesIDB.has(id)
              ) {
                this.storageSrv.completelyDownloadedRoutesIDB.delete(id);
              } else if (
                this.storageSrv.completelyDownloadedPlatformsIDB.has(id)
              ) {
                this.storageSrv.completelyDownloadedPlatformsIDB.delete(id);
              }
            }
            console.error(err);
            throw new Error(JSON.stringify(err));
          });
      });
  }
  /**
   * Fetches stops/platform members for a given route from IDB
   */
  getMembersForRoute(relId: number) {
    return this.db.transaction(
      'r',
      this.db.PtStops,
      this.db.PtRoutes,
      this.db.PtPlatforms,
      () => {
        const memberIds = [];
        const stops = [];
        const platforms = [];
        return this.db.PtRoutes.get(relId).then((route) => {
          for (const member of route.members) {
            memberIds.push(member['ref']);
          }
          return this.db
            .transaction(
              'r',
              this.db.PtStops,
              this.db.PtRoutes,
              this.db.PtPlatforms,
              () => {
                this.db.PtStops.where('id')
                  .anyOf(memberIds)
                  .each((stop) => {
                    stops.push(stop);
                  })
                  .then(() => {
                    console.log(
                      'LOG (db s.) Fetched stops from IDB : [ ' +
                        stops
                          .map((stop) => {
                            return stop.id;
                          })
                          .join(' , ') +
                        ' ] for route with ID : ' +
                        relId
                    );
                  });
                this.db.PtPlatforms.where('id')
                  .anyOf(memberIds)
                  .each((platform) => {
                    platforms.push(platform);
                  })
                  .then(() => {
                    console.log(
                      'LOG (db s.) Fetched platforms from IDB : [ ' +
                        platforms
                          .map((platform) => {
                            return platform.id;
                          })
                          .join(' , ') +
                        ' ] for route with ID : ' +
                        relId
                    );
                  });
              }
            )
            .then(() => {
              // In order to have the same format as Overpass API response and reuse the functions
              const object = {
                elements: stops.concat(platforms),
              };
              return Promise.resolve(object);
            });
        });
      }
    );
  }

  /**
   * Gets all parent route_masters for given routeIDs
   */

  getRoutesForMasterRoute(routeIds: number[]) {
    const filteredMasters = [];
    return this.db.PtRouteMasters.each((routeMaster) => {
      routeMaster['members'].forEach((element) => {
        if (routeIds.includes(element['ref'])) {
          filteredMasters.push(routeMaster);
        }
      });
    }).then(() => {
      const routesObject = {
        elements: filteredMasters,
      };
      console.log(routesObject);
      return Promise.resolve(routesObject);
    });
  }

  /**
   * Deletes old data from IDB (everything except areas grid)
   */
  deleteExpiredPTDataIDB() {
    return this.db.transaction(
      'rw',
      [
        this.db.PtStops,
        this.db.PtRoutes,
        this.db.PtPlatforms,
        this.db.MetaData,
        this.db.OSMWays,
        this.db.PtRouteMasters,
      ],
      () => {
        return this.db.MetaData.toCollection().modify((value, ref) => {
          if (Math.floor(Date.now() / 1000) - value['timestamp'] >= 50000) {
            delete ref.value;
            if (value['type'] === 'platform') {
              return this.db.PtPlatforms.where('id')
                .equals(value.id)
                .delete()
                .then(() => {
                  console.log(
                    'LOG (db s.) Successfully deleted platform with id ' +
                      value.id +
                      ' from IDB'
                  );
                })
                .catch((err) => {
                  console.log(
                    'LOG (db s.) Error in deleting platform with id ' +
                      value.id +
                      ' from IDB'
                  );
                  console.error(err);
                  throw new Error(JSON.stringify(err));
                });
            }
            if (value['type'] === 'stop') {
              return this.db.PtStops.where('id')
                .equals(value.id)
                .delete()
                .then(() => {
                  console.log(
                    'LOG (db s.) Successfully deleted stop with id ' +
                      value.id +
                      ' from IDB'
                  );
                })
                .catch((err) => {
                  console.log(
                    'LOG (db s.) Error in deleting stop with id ' +
                      value.id +
                      ' from IDB'
                  );
                  console.error(err);
                  throw new Error(JSON.stringify(err));
                });
            }
            if (value['type'] === 'route_master') {
              return this.db.PtRouteMasters.where('id')
                .equals(value.id)
                .delete()
                .then(() => {
                  console.log(
                    'LOG (db s.) Successfully deleted route master with id ' +
                      value.id +
                      ' from IDB'
                  );
                })
                .catch((err) => {
                  console.log(
                    'LOG (db s.) Error in deleting route master with id ' +
                      value.id +
                      ' from IDB'
                  );
                  console.error(err);
                  throw new Error(JSON.stringify(err));
                });
            }
            if (value['type'] === 'way') {
              return this.db.OSMWays.where('id')
                .equals(value.id)
                .delete()
                .then(() => {
                  console.log(
                    'LOG (db s.) Successfully deleted way with id ' +
                      value.id +
                      ' from IDB'
                  );
                })
                .catch((err) => {
                  console.log(
                    'LOG (db s.) Error in deleting way with id ' +
                      value.id +
                      ' from IDB'
                  );
                  console.error(err);
                  throw new Error(JSON.stringify(err));
                });
            }
            if (value['type'] === 'route') {
              return this.db.PtRoutes.where('id')
                .equals(value.id)
                .delete()
                .then(() => {
                  console.log(
                    'LOG (db s.) Successfully deleted route with id ' +
                      value.id +
                      ' from IDB'
                  );
                  this.db.MetaData.where('type')
                    .anyOf(['stop_position', 'platform'])
                    .modify((item, ref2) => {
                      if (item.parentRoutes.includes(value.id)) {
                        ref2.value.parentRoutes = item.parentRoutes.filter(
                          (e) => {
                            return e !== value.id;
                          }
                        );
                      }
                    })
                    .then(() => {
                      console.log(
                        'LOG (db s.) Successfully deleted route from parentRoutes with id' +
                          value.id +
                          ' from IDB'
                      );
                    })
                    .catch((err) => {
                      console.log(
                        'LOG (db s.) Error in deleting route from parentRoutes with id ' +
                          value.id +
                          ' in metadata from IDB'
                      );
                      console.error(err);
                      throw new Error(JSON.stringify(err));
                    });
                })
                .catch((err) => {
                  console.log(
                    'LOG (db s.) Error in deleting route with id ' +
                      value.id +
                      ' from IDB'
                  );
                  console.error(err);
                  throw new Error(JSON.stringify(err));
                });
            }
          }
        });
      }
    );
  }

  /**
   * Adds metadata to IDB
   */
  addMetaData(
    routeIds: number[],
    id: number,
    type: string,
    stopsMetaData,
    platformsMetaData,
    routesMetaData,
    routeMastersMetaData,
    waysMetaData
  ) {
    return this.db.transaction(
      'rw',
      [
        this.db.PtRoutes,
        this.db.PtStops,
        this.db.PtPlatforms,
        this.db.OSMWays,
        this.db.PtRouteMasters,
        this.db.MetaData,
      ],
      () => {
        if (type === 'stop_position') {
          for (const stop of stopsMetaData) {
            if (stop.id === id) {
              stop.parentRoutes = routeIds;
              stop.isCompletelyDownloaded = 1;
              break;
            }
          }
        }
        if (type === 'platform') {
          for (const platform of platformsMetaData) {
            if (platform.id === id) {
              platform.parentRoutes = routeIds;
              platform.isCompletelyDownloaded = 1;
              break;
            }
          }
        }
        if (type === 'route') {
          for (const route of routesMetaData) {
            if (route.id === id) {
              route.isCompletelyDownloaded = 1;
              break;
            }
          }
        }
        if (type === 'route_master') {
          for (const route of routesMetaData) {
            route.isQueriedForMasters = 1;
          }
        }
        return this.db.MetaData.bulkPut(
          platformsMetaData.concat(
            stopsMetaData,
            waysMetaData,
            routeMastersMetaData,
            routesMetaData,
            platformsMetaData
          )
        );
      }
    );
  }

  /**
   * Adds metadata to IDB for multiple node response
   */
  private addMetaDataForMultipleResponse(
    stopsMetaData,
    platformsMetaData,
    routesMetaData,
    routeMastersMetaData,
    waysMetaData,
    IDs,
    parentRoutes: Map<string, string[]>
  ) {
    return this.db.transaction(
      'rw',
      [
        this.db.PtRoutes,
        this.db.PtStops,
        this.db.PtPlatforms,
        this.db.OSMWays,
        this.db.PtRouteMasters,
        this.db.MetaData,
      ],
      () => {
        for (const stop of stopsMetaData) {
          if (IDs.includes(stop.id)) {
            this.storageSrv.completelyDownloadedStopsIDB.add(stop.id);
            stop.isCompletelyDownloaded = 1;
            if (parentRoutes.get(stop.id)) {
              stop.parentRoutes = parentRoutes.get(stop.id);
            }
            break;
          }
        }
        for (const platform of platformsMetaData) {
          if (IDs.includes(platform.id)) {
            this.storageSrv.completelyDownloadedPlatformsIDB.add(platform.id);
            platform.isCompletelyDownloaded = 1;
            if (parentRoutes.get(platform.id)) {
              platform.parentRoutes = parentRoutes.get(platform.id);
            }
            break;
          }
        }
        for (const route of routesMetaData) {
          if (IDs.includes(route.id)) {
            this.storageSrv.completelyDownloadedRoutesIDB.add(route.id);
            route.isCompletelyDownloaded = 1;
            break;
          }
        }
        return this.db.MetaData.bulkPut(
          platformsMetaData.concat(
            stopsMetaData,
            waysMetaData,
            routeMastersMetaData,
            routesMetaData,
            platformsMetaData
          )
        );
      }
    );
  }
}
