import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { AuthService } from './auth.service';
import { ConfService } from './conf.service';
import { DbService } from './db.service';
import { MapService } from './map.service';
import { ProcessService } from './process.service';
import { StorageService } from './storage.service';
import { WarnService } from './warn.service';

import { create } from 'xmlbuilder';
import { LatLng } from 'leaflet';

import { IOverpassResponse } from '../core/overpassResponse.interface';
import { IAreaRef } from '../core/areaRef.interface';
import { IPtRelation } from '../core/ptRelation.interface';
import { Utils } from '../core/utils.class';

import { NgRedux } from '@angular-redux/store';
import { IAppState } from '../store/model';
import { BsModalService } from 'ngx-bootstrap';
import { ModalComponent } from '../components/modal/modal.component';
import { ErrorHighlightService } from './error-highlight.service';
import {CorrectService} from './correct.service';

@Injectable()
export class OverpassService {
  public changeset;
  private changeset_id: string;
  private areaReference: IAreaRef;

  constructor(
    private authSrv: AuthService,
    private dbSrv: DbService,
    private httpClient: HttpClient,
    private processSrv: ProcessService,
    private storageSrv: StorageService,
    private mapSrv: MapService,
    private warnSrv: WarnService,
    private ngRedux: NgRedux<IAppState>,
    private modalService: BsModalService,
    private correctSrv: CorrectService,
    private errorHighlightSrv: ErrorHighlightService,
  ) {
    /**
     * @param data - string containing ID of clicked marker
     */
    this.mapSrv.markerClick.subscribe((data) => {
      // let goodConnectionMode = ngRedux.getState()['app']['goodConnectMode'];
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
      //     if (!this.storageSrv.completelyDownloadedPlatformsIDB.has(randomKey) &&
      //       !this.storageSrv.completelyDownloadedStopsIDB.has(randomKey)) {
      //       // gets the data from overpass query and adds to IDB
      //       console.log('LOG (overpass s.) Downloading ' + randomKey + ' in background in slow connection mode');
      //       this.getNodeDataOverpass(randomKey, false);
      //     }
      //   }
      // }
      // else {
      //   for (let i = 0; i < 25; i++) {
      //     let randomKey = this.getRandomKey(this.storageSrv.elementsMap);
      //     if (!this.storageSrv.completelyDownloadedPlatformsIDB.has(randomKey) &&
      //       !this.storageSrv.completelyDownloadedStopsIDB.has(randomKey)) {
      //       // gets the data from overpass query and adds to IDB
      //       console.log('LOG (overpass s.) Downloading ' + randomKey + ' in background in fast connection mode');
      //       this.getNodeDataOverpass(randomKey, false);
      //     }
      //   }
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
    this.httpClient
      .post<IOverpassResponse>(ConfService.overpassUrl, requestBody, {
        responseType: 'json',
        headers: Utils.HTTP_HEADERS,
      })
      .subscribe(
        (res: IOverpassResponse) => {
          console.log('LOG (overpass s.)', res);
          this.processSrv.processResponse(res);
          this.dbSrv.addArea(this.areaReference.areaPseudoId);
          this.warnSrv.showSuccess();
          // if ((this.ngRedux.getState()['app']['errorCorrectionMode'] === 'missing name tag')) {
          //              this.errorHighlightSrv.missingTagError('name'); }
          // if ((this.ngRedux.getState()['app']['errorCorrectionMode'] === 'missing ref tag')) {
          //   this.errorHighlightSrv.missingTagError('ref'); }
          // FIXME
          // this.processSrv.drawStopAreas();
          // this.getRouteMasters();
        },
        (err) => {
          this.warnSrv.showError();
          console.error('LOG (overpass s.) Stops response error', JSON.stringify(err));
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
    const idsArr: number[] = this.findRouteIdsWithoutMaster();
    if (idsArr.length <= minNumOfRelations) {
      return console.log(
        'LOG (overpass s.) Not enough relations to download - stop',
      );
    } else if (!idsArr.length) {
      // do not query masters if all relations are already known
      return;
    }
    const routesQueriedInIDB:       number[] = [];
    const routesNotQueriedNotInIDB: number[] = [];

    idsArr.forEach((id) => {
      if (this.storageSrv.queriedRoutesForMastersIDB.has(id)) {
        routesQueriedInIDB.push(id);
      }
      else {
        routesNotQueriedNotInIDB.push(id);
      }
    });

    console.log('LOG (db s.) Total Routes which were not queried: ' + idsArr + ' out of which routes ' +
      'present in IDB (already queried an all parent route masters present in IDB) :' + routesQueriedInIDB + ' , not in IDB ' +
      'and not queried : ' + routesNotQueriedNotInIDB);
    if (routesQueriedInIDB.length !== 0) {
      this.dbSrv.getRoutesForMasterRoute(routesQueriedInIDB).then((res) => {
        this.markQueriedRelations(routesQueriedInIDB);
        this.processSrv.processMastersResponse(res);
      }).catch((err) => {
        console.log('LOG (overpass s.) Error in fetching routes from IDB');
        console.error(err);
        throw new Error(err.toString());
      });
    }
    let requestBody: string = `
            [out:json][timeout:25][bbox:{{bbox}}];
            (
              rel(id:${routesNotQueriedNotInIDB.join(', ')});
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
          console.log('LOG (overpass s.) Response for route_master from Overpass API');
          console.log(res);
          this.warnSrv.showSuccess();
          this.markQueriedRelations(routesNotQueriedNotInIDB);
          this.processSrv.processMastersResponse(res);
          // // FIXME should only mark as queried in IDB after adding response to IDB
          // this.dbSrv.addToQueriedRoutesForMasters(idsArr).then(() => {
          //   this.storageSrv.queriedRoutesForMastersIDB.add(idsArr);
          //   console.log('LOG (overpass s.) Marked routes as queried routes in IDB');
          //   console.log(idsArr);
          // });
          this.dbSrv.addResponseToIDB(res, 'route_master').catch((err) => {
            console.log('LOG (overpass s.) Error in adding route_master related response to IDB');
            console.error(err);
            throw new Error(err.toString());
          });
        },
        (err) => {
          this.warnSrv.showError();
          throw new Error(err.toString());
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
          throw new Error(err.toString());
        },
      );
  }

  public uploadData(metadata: object, testUpload: boolean = false): void {
    this.changeset = this.createChangeset(metadata);
    this.putChangeset(this.changeset, testUpload);
  }

  public async initDownloader(): Promise<void> {
    this.setupAreaReference();
    if (this.minZoomLevelIsValid() && await this.shouldDownloadMissingArea()) {
      this.requestNewOverpassData();
    }
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

  private setupAreaReference(): void {
    const viewCenter: LatLng = this.mapSrv.map.getCenter();
    const south: string = (Math.floor(viewCenter.lat / 0.05) * 0.05).toFixed(2);
    const west: string = (Math.floor(viewCenter.lng / 0.05) * 0.05).toFixed(2);
    const north: string = (Number(south) + 0.05).toFixed(2);
    const east: string = (Number(west) + 0.05).toFixed(2);
    const areaPseudoId = south + 'x' + west;
    this.areaReference = { areaPseudoId, overpassBox: [south, west, north, east], viewCenter };
  }

  private minZoomLevelIsValid(): boolean {
    return this.mapSrv.map.getZoom() > ConfService.minDownloadZoom;
  }

  private async shouldDownloadMissingArea(): Promise<boolean> {
    return !await this.dbSrv.hasArea(this.areaReference.areaPseudoId);
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
            if (!(this.ngRedux.getState()['app']['advancedExpMode'])) {
              this.processSrv.filterRelationsByStop(this.storageSrv.elementsMap.get(featureId));
            } else {
              this.getRouteMasters(10);
            }
          } else {
            // Only add to elements map and not update listOfStops etc. when process is equal to false
            for (const element of res['elements']) {
              if (!this.storageSrv.elementsMap.has(element.id)) {
                this.storageSrv.elementsMap.set(element.id, element); }
            }
          }
          if (res['elements'][0]) {
            this.dbSrv.addResponseToIDB(res, res['elements'][0].tags.public_transport, featureId).catch((err) => {
              console.log('LOG (overpass s.) Error in adding Overpass API \'s response OR' +
                ' in adding related metadata to IDB for route with id : ' + featureId);
              console.error(err);
              throw new Error(err.toString());
            });
          }
          this.warnSrv.showSuccess();
        },
        (err) => {
          this.warnSrv.showError();
          throw new Error(err.toString());
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
          this.dbSrv.addResponseToIDB(res, 'route', rel.id).catch((err) => {
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
          this.warnSrv.showSuccess();
        },
        (err) => {
          this.warnSrv.showError();
          throw new Error(err.toString());
        });
  }

  /**
   * Finds routes which were not queried to find their possible master relation.
   */
  private findRouteIdsWithoutMaster(): number[] {
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
    const bboxStr: string = this.areaReference.overpassBox.join(', ');
    return requestBody.replace(new RegExp('{{bbox}}', 'g'), bboxStr);
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
    this.dbSrv.getRoutesForStop(stopId).then((relations: IPtRelation[]) => {
      if (relations.length === 0) {
        console.log('LOG (overpass s.) No routes found for stop with id ' + stopId + 'in IDB');
      } else {
        console.log('LOG (overpass s.) Fetched routes : [ ' + relations.map((relation) => {
          return relation['id'];
        }) + ' ] for stop with ID: ' + stopId + ' from IDB');
      }
      for (const relation of relations) {
        if (!this.storageSrv.elementsMap.has(relation.id)) {
          this.storageSrv.elementsMap.set(relation.id, relation);
          if (!relation.tags) {
            continue;
          }
          if (relation.tags.public_transport === 'stop_area') {
            this.storageSrv.listOfAreas.push(relation);
          } else {
            this.storageSrv.listOfRelations.push(relation);
          }
        }
        this.storageSrv.logStats();
      }
      this.storageSrv.elementsDownloaded.add(stopId);
      this.getRouteMasters(10);
    }).catch((err) => {
      console.log('LOG (overpass s.) Could not fetch ids of relations for a stop with id :' + stopId);
      console.error(err);
      throw new Error(err.toString());
    });
  }
  public getPlatformDataIDB(platformId: number): any {
    this.dbSrv.getRoutesForPlatform(platformId).then((relations: IPtRelation[]) => {
      if (relations.length === 0) {
        console.log('LOG (overpass s.) No routes found for platform with id ' + platformId + 'in IDB');
      } else {
        console.log('LOG (overpass s.) Fetched routes : [ ' + relations.map((relation) => {
          return relation['id'];
        }) + ' ] for platform with ID: ' + platformId + ' from IDB');
      }
      for (const relation of relations) {
        if (!this.storageSrv.elementsMap.has(relation.id)) {
          this.storageSrv.elementsMap.set(relation.id, relation);
          if (!relation.tags) {
            continue;
          }
          if (relation.tags.public_transport === 'stop_area') {
            this.storageSrv.listOfAreas.push(relation);
          } else {
            this.storageSrv.listOfRelations.push(relation);
          }
        }
        this.storageSrv.logStats();
      }
      this.storageSrv.elementsDownloaded.add(platformId);
      this.getRouteMasters(10);
    }).catch((err) => {
      console.log('LOG (overpass s.) Could not fetch ids of relations for a platform with id :' + platformId);
      console.error(err);
      throw new Error(err.toString());
    });
  }

  downloadNodeDataForError(data: any): any {
    const featureId = Number(data);
    if (!this.storageSrv.elementsDownloaded.has(featureId) && featureId > 0) {
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
          let arr = new Map();
          if (!res) {
            return alert('No response from API. Try to select element again please.');
          }
          console.log('res', res);
          for (const element of res['elements']) {
            if (element.type === 'relation' && element.tags.type === 'route') {
              if (element.tags.ref) {
                arr.set(element.tags.ref, element.tags.name);
              }
            }

            if (!this.storageSrv.elementsMap.has(element.id)) {
              this.storageSrv.elementsMap.set(element.id, element);
              console.log('element downloaded', element);
            }
          }
          const initialState = {
            error: 'missing ref tag',
            refArr: arr,
            // errorObject:
          };
          console.log('refarra',  arr);
          this.modalService.show(ModalComponent, { initialState });
          this.storageSrv.elementsDownloaded.add(featureId);
         },
      (err) => {
        this.warnSrv.showError();
        throw new Error(err.toString());
      });
      }
  }

  // move query to the
  download(nearbyStops: any): any {
    let requestBody = `
      [out:json][timeout:25];
      (
         node(id:${nearbyStops.join(', ')});
      );
      (._;<;);
      out meta;`;
    console.log('query', requestBody);
    requestBody = this.replaceBboxString(requestBody.trim());
    this.httpClient
        .post(ConfService.overpassUrl, requestBody, { headers: Utils.HTTP_HEADERS })
        .subscribe(
          (res) => {
            if (!res) {
              return alert('No response from API. Try to select element again please.');
            }

            console.log('res', res);

            for (const element of res['elements']) {
              if (!this.storageSrv.elementsMap.has(element.id)) {
                this.storageSrv.elementsMap.set(element.id, element); }
            }


            let relations = [];
            for (const element of res['elements']) {
              if (element.type === 'relation' && element.tags.type === 'route') {
                relations.push(element);
              }
              // if (!this.storageSrv.elementsMap.has(element.id)) {
              //   this.storageSrv.elementsMap.set(element.id, element);
              // }
            }
            this.errorHighlightSrv.isDataDownloaded.emit(true);
          },
          (err) => {
            this.warnSrv.showError();
            throw new Error(err.toString());
          });
    }
}
