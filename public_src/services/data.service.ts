import { Db } from '../database/dexiedb';
import { IPtRouteMasterNew } from '../core/ptRouteMasterNew.interface';
import { IPtWay } from '../core/ptWay.interface';
import { StorageService } from './storage.service';
import { IPtStop } from '../core/ptStop.interface';
import { IPtRelationNew } from '../core/ptRelationNew.interface';
import { Injectable } from '@angular/core';
@Injectable()
export class DataService {

  public db: Db;

  constructor(private storageSrv: StorageService) {
    this.db = new Db();
  }
  /* fetches the array of ids of platforms stored in IDB */
  getIdsPlatformsIDB(): any {
    return this.db.PtPlatforms.toCollection().primaryKeys();
  }
  /* fetches the array of ids of stops stored in IDB */
  getIdsStopsIDB(): any {
    return this.db.PtStops.toCollection().primaryKeys();
  }
  /* fetches the array of ids of routes stored in IDB */
  getIdsRoutesIDB(): any {
    return this.db.PtRoutes.toCollection().primaryKeys();
  }
  /* fetches the array of ids of master routes stored in IDB  */
  getIdsMasterRoutesIDB(): any {
    return this.db.PtRouteMasters.toCollection().primaryKeys();
  }
  /* fetches the array of ids of ways stored in IDB */
  getIdsWaysIDB(): any {
    return this.db.PtWays.toCollection().primaryKeys();
  }
  /* fetches the array of ids of completely downloaded stops stored in IDB*/
  getIdsCompletelyDownloadedStops(): any {
    return this.db.CompletelyDownloadedStops.toCollection().primaryKeys();
  }
  /* fetches the array of ids of completely downloaded platforms stored in IDB */
  getIdsCompletelyDownloadedPlatforms(): any {
    return this.db.CompletelyDownloadedPlatforms.toCollection().primaryKeys();
  }
  /* fetches the array of ids of completely downloaded completely downloaded routes
  stored in IDB and assigns them to storage service's 'completelyDownloadedRoutes' variable*/
  getIdsCompletelyDownloadedRoutes(): any {
    return this.db.CompletelyDownloadedRoutes.toCollection().primaryKeys();
  }
  addStop(data: IPtStop): any {
      return this.db.PtStops.put(data).then(() => {
        console.log('(data s.) Added stop with id ' + data.id + ' to idb');
      });
  }
  addPlatform(data: IPtStop): any {
    return this.db.PtPlatforms.put(data).then(() => {
      console.log('(data s.) Added platform with id ' + data.id + ' to idb');
    });
  }
  addRoute(data: IPtRelationNew): any {
      return this.db.PtRoutes.put(data).then(() => {
        console.log('(data s.) Added route with id ' + data.id + ' to idb');
      });
  }

  addWay(data: IPtWay): any {
     return this.db.PtWays.put(data).then(() => {
        console.log('(data s.) Added way with id ' + data.id + ' to idb');
      });
  }

  addRouteMaster(data: IPtRouteMasterNew): any {
      return this.db.PtRouteMasters.put(data).then(() => {
        console.log('(data s.) Added route master with id ' + data.id + ' to idb');
      });
  }
  addToCompletelyDownloadedStops(stopId: number): any {
    return this.db.CompletelyDownloadedStops.put({ id: stopId });
  }
  addToCompletelyDownloadedPlatforms(platformId: number): any {
    return this.db.CompletelyDownloadedPlatforms.put({ id: platformId });
  }
  addToCompletelyDownloadedRoutes(routeId: number): any {
    return this.db.CompletelyDownloadedRoutes.put({ id: routeId });
  }
  addToRoutesForStop(routeId: number, stopId: number): any {
    return this.db.RoutesForStops.where('id').equals(stopId).modify((data) => {
            data.routeIds.push(routeId);
          });
  }
  addToRoutesForPlatform(routeId: number, platformId: number): any {
    return this.db.RoutesForPlatforms.where('id').equals(platformId).modify((data) => {
      data.routeIds.push(routeId);
    });
  }

  getRoutesForStop(stopId: number): any {
    return this.db.transaction('rw', this.db.RoutesForStops, this.db.PtRoutes, () => {
      return this.db.RoutesForStops.get(stopId.toString()).then((data) => {
        let routeIds = data.routeIds;
        let filteredRoutes = [];
        return this.db.PtRoutes.each((route) => {
          if (routeIds.includes(route.id)) {
            filteredRoutes.push(route);
          }
        }).then(() => {
          return Promise.resolve(filteredRoutes);
        });
      });
    });
  }
  getRoutesForPlatform(platformId: number): any {
    return this.db.transaction('rw', this.db.RoutesForPlatforms, this.db.PtRoutes, () => {
      return this.db.RoutesForStops.get(platformId.toString()).then((data) => {
        let routeIds = data.routeIds;
        let filteredRoutes = [];
        return this.db.PtRoutes.each((route) => {
          if (routeIds.includes(route.id)) {
            filteredRoutes.push(route);
          }
        }).then(() => {
          return Promise.resolve(filteredRoutes);
        });
      });
    });
  }
  public addResponseToIDB(response: any, id: any, type: string): any {
    let success: boolean = true;
    return this.db.transaction('rw', [this.db.RoutesForPlatforms, this.db.PtRoutes, this.db.PtStops,
      this.db.PtPlatforms, this.db.PtWays, this.db.RoutesForStops, this.db.PtRouteMasters,
      this.db.CompletelyDownloadedStops, this.db.CompletelyDownloadedPlatforms,
      this.db.CompletelyDownloadedRoutes], () => {
        for (let i = 0 ; i < response.elements.length; i++) {
          let element = response.elements[i];
        if ((!this.storageSrv.stopsIDB.has(element.id)) &&
        (!this.storageSrv.waysIDB.has(element.id))
        && (!this.storageSrv.routeMastersIDB.has(element.id)) &&
        (!this.storageSrv.routesIDB.has(element.id))
      ) {
          switch (element.type) {
          case 'node':
            if (element.tags.public_transport === 'platform') {
               this.addPlatform(element).then(() => {
                this.storageSrv.platformsIDB.add(element.id);
                }).catch((err) => {
                console.log('could not add platform with id:' + element.id + 'to IDB');
                console.log(err);
                success = false;
              });
            }
            if (element.tags.bus === 'yes' || element.tags.public_transport === 'stop_position') {
              this.addStop(element).then(() => {
                this.storageSrv.stopsIDB.add(element.id);
                }).catch((err) => {
                console.log('could not add stop with id:' + element.id + 'to IDB');
                console.log(err);
                success = false;
              });
            }
            break;
          case 'relation':
            if (element.tags.type === 'route') {
              this.addRoute(element)
                .then(() => {
                  this.storageSrv.routesIDB.add(element.id);
                }).catch((err) => {
                console.log('could not add route with id:' + element.id + 'to IDB');
                console.log(err);
                success = false;
              });
              if (type === 'stop') {
                this.addToRoutesForStop(id, element.id).catch((err) => {
                  console.log('Could not add route with id :' + element.id +
                    ' to the IDB table RoutesForStop for stop with id:' + id);
                  console.log(err);
                  success = false;
                });
              }
              if (type === 'platform') {
                this.addToRoutesForPlatform(id, element.id).catch((err) => {
                  console.log('Could not add route with id :' + element.id +
                    ' to the IDB table RoutesForPlatform for stop with id:' + id);
                  console.log(err);
                  success = false;
                });
              }
            }
            if (element.tags.type === 'route_master') {
              this.addRouteMaster(element)
                .then(() => {
                  this.storageSrv.routeMastersIDB.add(element.id);
                }).catch((err) => {
                console.log('could not add route master with id:' + element.id + 'to IDB');
                console.log(err);
                success = false;
              });
            }
            break;
          case 'way':
            this.addWay(element)
              .then(() => {
                this.storageSrv.waysIDB.add(element.id);
              }).catch((err) => {
              console.log('could not add way with id:' + element.id + 'to IDB');
              console.log(err);
              success = false;
            });
            break;
        }
      }
    }
    }).then(() => {
      // console.log('XXXXXXXXXXXXXXXXXXXXXXXXXXXX');
      // console.log(success);
      if (success) {
        if (type === 'platform') {
          this.storageSrv.completelyDownloadedPlatformsIDB.add(id);
          this.addToCompletelyDownloadedPlatforms(id).then(() => {
            console.log('Added platform with id' + id + 'to completely downloaded platform in IDB');
          }).catch((err) => {
            console.log('Could not add platform with id' + id + 'to completely downloaded platform in IDB');
            console.log(err);
          });
        }
        if (type === 'stop_position') {
          this.storageSrv.completelyDownloadedStopsIDB.add(id);
          this.addToCompletelyDownloadedStops(id).then(() => {
            console.log('Added stop with id' + id + 'to completely downloaded stops in IDB');
          }).catch((err) => {
            console.log('Could not add stop with id' + id + 'to completely downloaded stops in IDB');
            console.log(err);
          });
        }
        if(type === 'route'){
          this.storageSrv.completelyDownloadedRoutesIDB.add(id);
          this.addToCompletelyDownloadedRoutes(id).then(() => {
            console.log('Added route with id' + id + 'to completely downloaded routes in IDB');
          }).catch((err) => {
            console.log('Could not add route with id' + id + 'to completely downloaded routes in IDB');
            console.log(err);
          });
        }
      }
    });
  }
  getMembersForRoute(relId: number): any {
    return this.db.transaction('rw', this.db.PtStops, this.db.PtRoutes, () => {
      let memberIds = [];
      let stops = [];
      let platforms = [];
      return this.db.PtRoutes.get(relId.toString()).then((route) => {
      for (let member in route.members) {

        if (route.members.hasOwnProperty(member)) {
          memberIds.push(member['ref']);
        }
      }
      return this.db.transaction('rw', this.db.PtStops, this.db.PtRoutes, () => {
       this.db.PtStops.each((stop) => {

         if (memberIds.includes(stop.id)) {
                     stops.push(stop);
                  }
                });
       this.db.PtPlatforms.each((platform) => {

         if (memberIds.includes(platform.id)) {
                       platforms.push(platform);
                     }
                   });
              }).then(() => {
                Promise.resolve(stops.concat(platforms));
      });
     });
    });
  }
  // // push route id to the routes array of a given stop
  // addtoRoutesofStop(stopId: number, routeId: number): any {
  //   return this.db.transaction('rw', this.db.Stops, () => {
  //     return this.db.Stops.where('id').equals(stopid).modify((x) => {
  //       x.routes.push(routeid);
  //     });
  //   });
  // }
  // getStopsForRoute(routeid: number): any {
  //   return this.db.transaction('rw', this.db.Stops, this.db.Routes, () => {
  //     let nodemembers = [];
  //     let stops = [];
  //     return this.db.Routes.get({ id: routeid }).then((route) => {
  //       nodemembers = route['nodemembers'];
  //     }).then(() => {
  //       return this.db.Stops.each((stop) => {
  //         if (nodemembers.includes(stop.id)) {
  //           stops.push(stop);
  //         }
  //       }).then(() => {
  //         return Promise.resolve(stops);
  //       });
  //     });
  //   });
  // }

  // // gets route relations for a given node id
  // getRoutesforNode(stopid: number): any {
  //   return this.db.transaction('rw', this.db.Stops, this.db.Routes, () => {
  //     return this.db.Stops.get({ id: stopid }).then((stop) => {
  //       let arrayofroutes = stop.routes; // contains only ids
  //       let filteredroutes = [];
  //       return this.db.Routes.each((route) => {
  //         if (arrayofroutes.includes(route.id)) {
  //           filteredroutes.push(route);
  //         }
  //       }).then(() => {
  //         return Promise.resolve(filteredroutes);
  //       });
  //     });
  //   });
  // }
  // // downloaded elements
  // addToDownloadedRoutes(relId: number): any {
  //   return this.db.DownloadedRoutes.put({ id: relId });
  // }
  //
  // addToDownloadedStops(stopId: number): any {
  //   return this.db.DownloadedStops.put({ id: stopId });
  // }
}
