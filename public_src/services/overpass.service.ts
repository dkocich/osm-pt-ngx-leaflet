import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { AuthService } from './auth.service';
import { ConfService } from './conf.service';
import { MapService } from './map.service';
import { ProcessService } from './process.service';
import { StorageService } from './storage.service';
import { DbService } from './db.service';

import { create } from 'xmlbuilder';

import { IOverpassResponse } from '../core/overpassResponse.interface';
import { Utils } from '../core/utils.class';

import { NgRedux } from '@angular-redux/store';
import { IAppState } from '../store/model';
@Injectable()
export class OverpassService {
  public changeset;
  private changeset_id: string;

  constructor(
    private authSrv: AuthService,
    private httpClient: HttpClient,
    private processSrv: ProcessService,
    private storageSrv: StorageService,
    private mapSrv: MapService,
    private dbSrv: DbService,
    private ngRedux: NgRedux<IAppState>,
  ) {
    /**
     * @param data - string containing ID of clicked marker
     */
    this.mapSrv.markerClick.subscribe((data) => {
      let goodConnectionMode = ngRedux.getState()['app']['goodConnectMode'];
      const featureId = Number(data);
      if (this.storageSrv.elementsMap.has(featureId)) {
        this.processSrv.exploreStop(
          this.storageSrv.elementsMap.get(featureId),
          false,
          false,
          false,
        );
      }
      /*Checks if node was downloaded earlier and all it's data was added to IDB */
      if (this.storageSrv.completelyDownloadedPlatformsIDB.has(featureId)) {
        /*Gets the data from IDB and processes it (updates listOfStops etc.)*/
        console.log('LOG (overpass s.) Platform with id : ' + featureId + ' in IDB');
        this.getPlatformDataIDB(featureId);
      } else if (this.storageSrv.completelyDownloadedStopsIDB.has(featureId)) {
        /*Gets the data from IDB and processes it (updates listOfStops etc.)*/
        console.log('LOG (overpass s.) Stop with id : ' + featureId + ' in IDB');
        this.getStopDataIDB(featureId);
      }
      else {
        if (!this.storageSrv.elementsDownloaded.has(featureId) && featureId > 0) {
          console.log('LOG (overpass s.) Stop/Platform with id : ' + featureId + ' was not in IDB, hence overpass ' +
            'query is made.');
          this.getNodeDataOverpass(featureId, true);
          this.storageSrv.elementsDownloaded.add(featureId);
        }
      }

      // if (!goodConnectionMode) {
      //   for (let i = 0; i < 5; i++) {
      //     let randomKey = this.getRandomKey(this.storageSrv.elementsMap);
      //     if (!this.storageSrv.completelyDownloadedNodesIDB.has(randomKey)) {
      //       // gets the data from overpass query and adds to IDB
      //         console.log('Downloading' + randomKey + 'in background in slow connection mode');
      //         this.getNodeDataOverpass(randomKey, false);
      //     }
      //   }
      // }
      // else {
      //     for (let i = 0; i < 25; i++) {
      //       let randomKey = this.getRandomKey(this.storageSrv.elementsMap);
      //       if (!this.storageSrv.completelyDownloadedNodesIDB.has(randomKey)) {
      //         // gets the data from overpass query and adds to IDB
      //         console.log('Downloading' + randomKey + 'in background in fast connection mode');
      //         this.getNodeDataOverpass(randomKey, false);
      //       }
      //     }
      // }
    });

    /**
     * Handles downloading of missing relation members (nodes, ways).
     * @param data - object with rel and array containing IDs to download (member.ref)
     * {"rel": rel, "missingElements": missingElements}
     */
    this.processSrv.membersToDownload.subscribe((data) => {
      const rel = data['rel'];
      const missingElements = data['missingElements'];
      this.getRelationData(rel, missingElements);
    });
  }

  /**
   * Requests new batch of data from Overpass.
   */
  public requestNewOverpassData(): void {
    const requestBody = this.replaceBboxString(Utils.CONTINUOUS_QUERY);
    this.mapSrv.previousCenter = [
      this.mapSrv.map.getCenter().lat,
      this.mapSrv.map.getCenter().lng,
    ];
    this.httpClient
      .post<IOverpassResponse>(ConfService.overpassUrl, requestBody, {
        responseType: 'json',
        headers: Utils.HTTP_HEADERS,
      })
      .subscribe(
        (res: IOverpassResponse) => {
          console.log('LOG (overpass s.)', res);
          this.processSrv.processResponse(res);
          // FIXME
          // this.processSrv.drawStopAreas();
          // this.getRouteMasters();
        },
        (err) => {
          console.error('LOG (overpass s.) Stops response error', JSON.stringify(err));
          return setTimeout(() => {
            console.log('LOG (overpass) Request error - new request?');
            this.requestNewOverpassData();
          }, 5000);
        },
      );
  }

  /**
   * Downloads route_master relations for currently added route relations.
   * @minNumOfRelations: number
   */
  public getRouteMasters(minNumOfRelations?: number): void {
    if (!minNumOfRelations) {
      minNumOfRelations = 10;
    }
    const idsArr: Array<number> = this.findRouteIdsWithoutMaster();
    if (idsArr.length <= minNumOfRelations) {
      return console.log(
        'LOG (overpass s.) Not enough relations to download - stop',
      );
    } else if (!idsArr.length) {
      // do not query masters if all relations are already known
      return;
    }

    const routesNotInIDB:  Array<number> = [];
    const routesInIDB:  Array<number> = [];

    idsArr.forEach((id) => {
      if (this.storageSrv.queriedRoutesForMastersIDB.has(id)) {
        routesInIDB.push(id);
      }
      else {
        routesNotInIDB.push(id);
      }
    });
    if (routesInIDB.length !== 0) {
      this.dbSrv.getRoutesForMasterRoute(routesInIDB).then((res) => {
        this.markQueriedRelations(routesInIDB);
        this.processSrv.processMastersResponse(res);
      }).catch((err) => {
        console.log('LOG (overpass s.)Error in fetching routes from IDB');
        console.log(err);
      });
    }
    let requestBody: string = `
            [out:json][timeout:25][bbox:{{bbox}}];
            (
              rel(id:${routesNotInIDB.join(', ')});
              <<;
            );
            out meta;`;
    console.log(
      'LOG (overpass s.) Querying rel.\'s route masters with query:',
      requestBody,
    );
    requestBody = this.replaceBboxString(requestBody);
    this.httpClient
      .post(ConfService.overpassUrl, requestBody, { headers: Utils.HTTP_HEADERS })
      .subscribe(
        (res) => {
          if (!res) {
            return alert(
              'No response from API. Try to select other master relation again please.',
            );
          }
          this.markQueriedRelations(idsArr);
          this.dbSrv.addToQueriedRoutesForMasters(idsArr).then(() => {
            this.storageSrv.queriedRoutesForMastersIDB.add(idsArr);
            console.log('LOG (overpass s.) Added routes to queried routes in IDB');
            console.log(idsArr);
          });
          this.processSrv.processMastersResponse(res);
        },
        (err) => {
          throw new Error(err);
        },
      );
  }

  /**
   * @param requestBody
   */
  public requestOverpassData(requestBody: string): void {
    this.mapSrv.clearLayer();
    requestBody = this.replaceBboxString(requestBody);
    this.httpClient
      .post(ConfService.overpassUrl, requestBody, { headers: Utils.HTTP_HEADERS })
      .subscribe(
        (res) => {
          this.mapSrv.renderData(res);
        },
        (err) => {
          throw new Error(err);
        },
      );
  }

  public uploadData(metadata: object, testUpload: boolean = false): void {
    this.changeset = this.createChangeset(metadata);
    this.putChangeset(this.changeset, testUpload);
  }

  /**
   * Creates new changeset on the API and returns its ID in the callback.
   * Put /api/0.6/changeset/create
   */
  public putChangeset(changeset: any, testUpload?: boolean): void {
    if (!this.storageSrv.edits) {
      return alert('Create some edits before trying to upload changes please.');
    }
    if (testUpload) {
      this.createdChangeset(undefined, 1, true);
    } else {
      this.authSrv.oauth.xhr(
        {
          content: '<osm><changeset></changeset></osm>', // changeset,
          method: 'PUT',
          options: { header: { 'Content-Type': 'text/xml' } },
          path: '/api/0.6/changeset/create',
        },
        this.createdChangeset.bind(this),
      );
    }
  }

  /**
   * Downloads all data for currently selected node.
   * @param featureId
   */
  private getNodeDataOverpass(featureId: number, process: boolean): void {
    let requestBody = `
      [out:json][timeout:25];
      (
        node(${featureId})({{bbox}});
      );
      (._;<;);
      out meta;`;
    console.log('LOG (overpass s.) Querying nodes', requestBody);
    requestBody = this.replaceBboxString(requestBody.trim());
    this.httpClient
      .post(ConfService.overpassUrl, requestBody, { headers: Utils.HTTP_HEADERS })
      .subscribe(
        (res) => {
          if (!res) {
            return alert('No response from API. Try to select element again please.');
          }
          console.log('LOG (overpass s.)', res);
          if (process) {
            this.processSrv.processNodeResponse(res);
            this.getRouteMasters(10);
          } else {
            // Only add to elements map and not update listOfStops etc. when process is equal to false
            for (const element of res['elements']) {
              if (!this.storageSrv.elementsMap.has(element.id)) {
                this.storageSrv.elementsMap.set(element.id, element); }
            }
          }
          if (res['elements'][0]) {
            this.dbSrv.addResponseToIDB(res, featureId, res['elements'][0].tags.public_transport).catch((err) => {
              console.log('LOG (overpass s.) Error in adding Overpass API \'s response OR' +
                ' in adding related metadata to IDB for route with id : ' + featureId);
              console.log(err);
            });
          }
        },
        (err) => {
          throw new Error(err);
        });
  }

  /**
   * Downloads all missing data for currently explored relation.
   * @param rel
   * @param missingElements
   */
  private getRelationData(rel: any, missingElements: number[]): void {
    if (missingElements.length === 0) {
      return alert(
        'This relation has no stops or platforms. Please add them first and repeat your action. \n' +
        JSON.stringify(rel),
      );
    }
    const requestBody = `
            [out:json][timeout:25];
            (
              node(id:${missingElements});
            );
            (._;);
            out meta;`;
    console.log(
      'LOG (overpass s.) Should download missing members with query:',
      requestBody,
      missingElements,
    );
    this.httpClient
      .post(ConfService.overpassUrl, requestBody, { headers: Utils.HTTP_HEADERS })
      .subscribe(
        (res) => {
          if (!res) {
            return alert('No response from API. Try again please.');
          }
          this.processSrv.processNodeResponse(res);

          const transformedGeojson = this.mapSrv.osmtogeojson(res);
          // FIXME save all requests...
          // this.storageSrv.localGeojsonStorage = transformedGeojson;
          this.mapSrv.renderTransformedGeojsonData(transformedGeojson);
          this.dbSrv.addResponseToIDB(res, rel.id, 'route').catch((err) => {
            console.log('LOG (overpass s.) Error in adding Overpass API \'s response OR' +
              ' in adding related metadata to IDB for route with id : ' + rel.id);
          });
          // continue with the rest of "exploreRelation" function
          console.log(
            'LOG (overpass s.) Continue with downloaded missing members',
            rel,
          );
          this.storageSrv.elementsDownloaded.add(rel.id);
          this.processSrv.downloadedMissingMembers(rel, true, true);
        },
        (err) => {
          throw new Error(err);
        });
  }

  /**
   * Finds routes which were not queried to find their possible master relation.
   */
  private findRouteIdsWithoutMaster(): Array<number> {
    const idsArr = [];
    this.storageSrv.listOfRelations.forEach((rel) => {
      if (!this.storageSrv.queriedMasters.has(rel['id'])) {
        idsArr.push(rel['id']);
      }
    });
    return idsArr;
  }

  /**
   *
   * @param {number[]} idsArr
   */
  private markQueriedRelations(idsArr: number[]): void {
    idsArr.forEach((id) => this.storageSrv.queriedMasters.add(id));
  }

  /**
   * Replaces {{bbox}} query string to actual bbox of the map view.
   * @param requestBody
   * @returns {string}
   */
  private replaceBboxString(requestBody: string): string {
    const b = this.mapSrv.map.getCenter().toBounds(3000);
    const s = b.getSouth().toString();
    const w = b.getWest().toString();
    const n = b.getNorth().toString();
    const e = b.getEast().toString();
    return requestBody.replace(
      new RegExp('{{bbox}}', 'g'),
      [s, w, n, e].join(', '),
    );
  }

  /**
   * Create basic changeset body.
   * @param metadata - contains source and comment added by user
   * @returns {string}
   */
  private createChangeset(metadata: object): any {
    console.log('LOG (overpass s.)', metadata['source'], metadata['comment']);
    const changeset = create('osm')
      .ele('changeset')
      .ele('tag', { k: 'created_by', v: ConfService.appName })
      .up()
      .ele('tag', { k: 'source', v: metadata['source'] })
      .up()
      .ele('tag', { k: 'comment', v: metadata['comment'] })
      .end({ pretty: true });

    console.log('LOG (overpass s.)', changeset);
    return changeset;
  }

  /**
   * Adds changeset ID as an attribute to the request.
   * @param changeset_id
   */
  private addChangesetId(changeset_id: any): void {
    this.changeset_id = changeset_id;
    const parser = new DOMParser();
    const doc = parser.parseFromString(this.changeset, 'application/xml');
    doc.querySelector('changeset').setAttribute('id', changeset_id);
    this.changeset = doc;
    console.log('LOG (overpass s.)', this.changeset, doc);
  }

  /**
   *
   * @param err
   * @param changeset_id
   * @param testUpload
   */
  private createdChangeset(err: any, changeset_id: any, testUpload?: boolean): void {
    if (err) {
      return alert(
        'Error while creating new changeset. Try again please. ' +
        JSON.stringify(err),
      );
    }
    console.log(
      'LOG (overpass s.) Created new changeset with ID: ',
      changeset_id,
    );
    this.addChangesetId(changeset_id);
    const osmChangeContent = '<osmChange></osmChange>';
    const idsChanged = new Set();
    for (const edit of this.storageSrv.edits) {
      if (!idsChanged.has(edit['id'])) {
        idsChanged.add(edit['id']);
      }
    }
    const changedElements = [];
    const changedElementsArr = Array.from(idsChanged.keys());
    changedElementsArr.sort((a: any, b: any) => {
      return a - b; // Sort numerically and ascending
    });
    for (const changedElementId of changedElementsArr) {
      changedElements.push(
        this.storageSrv.elementsMap.get(changedElementId),
      );
    }

    console.log('LOG (overpass s.) Changed documents: ', changedElements);

    const xml = create('osmChange', {
      '@version': '0.6',
      '@generator': ConfService.appName,
    });

    let xmlNodeModify;
    for (const el of changedElements) {
      if (el.id > 0) {
        xmlNodeModify = xml.ele('modify'); // creation of elements
        break;
      }
    }
    for (const el of changedElements) {
      if (el.id > 0) {
        console.log('LOG (overpass s.) I should transform ', el);
        const tagsObj: object = {};
        for (const key of Object.keys(el)) {
          // do not add some attributes because they are added automatically on API
          if (
            ['members', 'tags', 'type', 'timestamp', 'uid', 'user']
              .indexOf(key) === -1
          ) {
            // adds - id="123", uid="123", etc.
            if (['version'].indexOf(key) > -1) {
              tagsObj['version'] = el[key]; // API should increment version later
            } else if (['changeset'].indexOf(key) > -1) {
              tagsObj['changeset'] = this.changeset_id;
            } else {
              tagsObj[key] = el[key];
            }
          }
        }
        const objectType = xmlNodeModify.ele(el['type'], tagsObj); // adds XML element node|way|relation
        if (el['type'] === 'relation' && el['members']) {
          const members = el['members']; // array of objects
          members.forEach((mem) => {
            if (mem === members[members.length - 1]) {
              objectType.ele('member', {
                type: mem['type'],
                ref: mem['ref'],
                role: mem['role'],
              });
            } else {
              objectType
                .ele('member', {
                  type: mem['type'],
                  ref: mem['ref'],
                  role: mem['role'],
                })
                .up();
            }
          });
        }
        if (el['tags']) {
          const tags = Object.keys(el['tags']); // objects
          for (const tag of tags) {
            if (!el[tag]) {
              continue;
            }
            if (tag === tags[tags.length - 1]) {
              objectType.ele('tag', { k: tag, v: el['tags'][tag] });
            } else {
              objectType.ele('tag', { k: tag, v: el['tags'][tag] }).up();
            }
          }
        }
      }
    }

    let xmlNodeCreate;
    for (const el of changedElements) {
      if (el.id < 0) {
        xmlNodeCreate = xml.ele('create'); // creation of elements
        break;
      }
    }

    for (const el of changedElements) {
      if (el.id < 0) {
        console.log('LOG (overpass s.) I should transform ', el);
        const tagsObj: object = {};
        for (const key of Object.keys(el)) {
          // do not add some attributes because they are added automatically on API
          if (
            ['members', 'tags', 'type', 'timestamp', 'uid', 'user']
              .indexOf(key) === -1
          ) {
            // adds - id="123", uid="123", etc.
            if (['version'].indexOf(key) > -1) {
              tagsObj['version'] = el[key]; // API should increment version later
            } else if (['changeset'].indexOf(key) > -1) {
              tagsObj['changeset'] = this.changeset_id;
            } else {
              tagsObj[key] = el[key];
            }
          }
        }
        const objectType = xmlNodeCreate.ele(el['type'], tagsObj); // adds XML element node|way|relation
        if (el['type'] === 'relation' && el['members']) {
          const members = el['members']; // array of objects
          members.forEach((mem) => {
            if (mem === members[members.length - 1]) {
              objectType.ele('member', {
                type: mem['type'],
                ref: mem['ref'],
                role: mem['role'],
              });
            } else {
              objectType
                .ele('member', {
                  type: mem['type'],
                  ref: mem['ref'],
                  role: mem['role'],
                })
                .up();
            }
          });
        }
        if (el['tags']) {
          const tags = Object.keys(el['tags']); // objects
          for (const tag of tags) {
            if (!el.tags[tag]) {
              continue;
            }
            if (tag === tags[tags.length - 1]) {
              objectType.ele('tag', { k: tag, v: el['tags'][tag] });
            } else {
              objectType.ele('tag', { k: tag, v: el['tags'][tag] }).up();
            }
          }
        }
      }
    }

    const xmlString = xml.end({ pretty: true });
    console.log('LOG (overpass s.) Uploading this XML ', xml, xmlString);
    if (testUpload) {
      return;
    } else {
      this.authSrv.oauth.xhr.bind(this)(
        {
          content: xmlString, // .osmChangeJXON(this.changes) // JXON.stringify(),
          method: 'POST',
          options: { header: { 'Content-Type': 'text/xml' } },
          path: '/api/0.6/changeset/' + this.changeset_id + '/upload',
        },
        this.uploadedChangeset.bind(this),
      );
    }
  }

  /**
   * Tries to close changeset after it is uploaded.
   * @param err
   */
  private uploadedChangeset(err: any): void {
    if (err) {
      return alert(
        'Error after data uploading. Changeset is not closed. It should close automatically soon. ' +
        JSON.stringify(err),
      );
    }
    // Upload was successful, safe to call the callback.
    // Add delay to allow for postgres replication #1646 #2678
    window.setTimeout(
      function(): void {
        console.log('LOG (overpass s.) Timeout 2500');
        // callback(null, this.changeset);
        // Still attempt to close changeset, but ignore response because iD/issues/2667
        this.authSrv.oauth.xhr(
          {
            method: 'PUT',
            options: { header: { 'Content-Type': 'text/xml' } },
            path: '/api/0.6/changeset/' + this.changeset_id + '/close',
          },
          () => {
            return true;
          },
        );
      }.bind(this),
      2500,
    );
  }

  public getRandomKey(collection: any): any {
    let keys = Array.from(collection.keys());
    return keys[Math.floor(Math.random() * keys.length)];
  }
  public getStopDataIDB(stopId: number): any {
    this.dbSrv.getRoutesForStop(stopId).then((relations: Array<object>[]) => {
      if (relations.length === 0) {
        console.log('LOG (overpass s.) No routes found for stop with id ' + stopId + 'in IDB');
      }
      for(let i = 0; i < relations.length; i++) {
        if (!this.storageSrv.elementsMap.has(relations[i]['id'])) {
          this.storageSrv.elementsMap.set(relations[i]['id'], relations[i]);
          if (!relations[i]['tags']) {
            continue;
          }
          if (relations[i]['tags']['public_transport'] === 'stop_area') {
            this.storageSrv.listOfAreas.push(relations[i]);
          } else {
            this.storageSrv.listOfRelations.push(relations[i]);
          }
        }
        this.storageSrv.logStats();
      }
    }).catch((err) => {
      console.log('LOG (overpass s.) Could not fetch ids of relations for a stop with id :' + stopId);
      console.log(err);
    });
  }
  public getPlatformDataIDB(platformId: number): any {
    this.dbSrv.getRoutesForPlatform(platformId).then((relations: Array<object>[]) => {
      if (relations.length === 0) {
        console.log('LOG (overpass s.) No routes found for platform with id ' + platformId + 'in IDB');
      }
      for(let i = 0; i < relations.length; i++) {
        if (!this.storageSrv.elementsMap.has(relations[i]['id'])) {
          this.storageSrv.elementsMap.set(relations[i]['id'], relations[i]);
          if (!relations[i]['tags']) {
            continue;
          }
          if (relations[i]['tags']['public_transport'] === 'stop_area') {
            this.storageSrv.listOfAreas.push(relations[i]);
          } else {
            this.storageSrv.listOfRelations.push(relations[i]);
          }
        }
        this.storageSrv.logStats();
      }
    }).catch((err) => {
      console.log('LOG (overpass s.) Could not fetch ids of relations for a platform with id :' + platformId);
      console.log(err);
    });
  }

}
