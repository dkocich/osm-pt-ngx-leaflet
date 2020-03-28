import { NgRedux } from '@angular-redux/store';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as L from 'leaflet';
import { create } from 'xmlbuilder';
import { IAreaRef } from '../core/areaRef.interface';
import { IOverpassResponse } from '../core/overpassResponse.interface';
import { IPtRelation } from '../core/ptRelation.interface';
import { Utils } from '../core/utils.class';
import { AppActions } from '../store/app/actions';
import { IAppState } from '../store/model';
import { AuthService } from './auth.service';
import { ConfService } from './conf.service';
import { DbService } from './db.service';
import { ErrorHighlightService } from './error-highlight.service';
import { MapService } from './map.service';
import { ProcessService } from './process.service';
import { RouteMasterWizardService } from './route-master-wizard.service';
import { RouteWizardService } from './route-wizard.service';
import { StorageService } from './storage.service';
import { WarnService } from './warn.service';

@Injectable()
export class OverpassService {
  changeset;
  private changeset_id: string;
  private areaReference: IAreaRef;
  osmtogeojson: any = require('osmtogeojson');

  constructor(
    private authSrv: AuthService,
    private dbSrv: DbService,
    private errorHighlightSrv: ErrorHighlightService,
    private httpClient: HttpClient,
    private processSrv: ProcessService,
    private storageSrv: StorageService,
    private mapSrv: MapService,
    private warnSrv: WarnService,
    private ngRedux: NgRedux<IAppState>,
    public appActions: AppActions,
    private routeWizardSrv: RouteWizardService,
    private routeMasterWizardSrv: RouteMasterWizardService,
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

      if (!goodConnectionMode) {
        let toDownload = [];
        for (let i = 0; toDownload.length <= 5; i++) {
          let randomKey = this.getRandomKey(this.storageSrv.elementsMap);
          if (!this.storageSrv.completelyDownloadedPlatformsIDB.has(randomKey) &&
            !this.storageSrv.completelyDownloadedStopsIDB.has(randomKey)) {
            // gets the data from overpass query and adds to IDB
            toDownload.push(randomKey);
          }
        }
        console.log('LOG (overpass s.) Downloading ' + toDownload + ' in background in slow connection mode');
        this.downloadMultipleNodeData(toDownload);
      }
      else {
        let toDownload = [];
        for (let i = 0; toDownload.length <= 25; i++) {
          let randomKey = this.getRandomKey(this.storageSrv.elementsMap);
          if (!this.storageSrv.completelyDownloadedPlatformsIDB.has(randomKey) &&
            !this.storageSrv.completelyDownloadedStopsIDB.has(randomKey)) {
            // gets the data from overpass query and adds to IDB
            toDownload.push(randomKey);
          }
        }
        console.log('LOG (overpass s.) Downloading ' + toDownload + ' in background in slow connection mode');
        this.downloadMultipleNodeData(toDownload);
      }
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
  requestNewOverpassData(): void {
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

          let errorCorrectionMode = this.ngRedux.getState()['app']['errorCorrectionMode'];
          if (errorCorrectionMode) {
            if (errorCorrectionMode.refSuggestions === null && errorCorrectionMode.waySuggestions === null) {
              this.errorHighlightSrv.countNameErrors();
              this.errorHighlightSrv.countPTvErrors();
              this.errorHighlightSrv.countPTPairErrors();
              this.appActions.actSetErrorCorrectionMode({
                nameSuggestions: {
                  found          : true,
                  startCorrection: false,
                },
                refSuggestions : null,
                waySuggestions : null,
                PTvSuggestions : {
                  found          : true,
                  startCorrection: false,
                },
                ptPairSuggestions: {
                  found          : true,
                  startCorrection: false,
                },
              });
            } else {
              if (this.errorHighlightSrv.isMobileDevice()) {
                this.errorHighlightSrv.countNameErrors();
                this.errorHighlightSrv.countRefErrors();
                this.errorHighlightSrv.countPTvErrors();
                this.errorHighlightSrv.countPTPairErrors();
                this.appActions.actSetErrorCorrectionMode({
                  nameSuggestions: {
                    found          : true,
                    startCorrection: false,
                  },
                  refSuggestions : {
                    found          : true,
                    startCorrection: false,
                  },
                  waySuggestions : null,
                  PTvSuggestions : {
                    found          : true,
                    startCorrection: false,
                  },
                  ptPairSuggestions: {
                    found          : true,
                    startCorrection: false,
                  },
                });
              } else {
                let toDownload = this.errorHighlightSrv.getNotDownloadedStopsInBounds();
                if (toDownload.length === 0) {
                  this.errorHighlightSrv.countNameErrors();
                  this.errorHighlightSrv.countRefErrors();
                  this.errorHighlightSrv.countWayErrors();
                  this.errorHighlightSrv.countPTvErrors();
                  this.errorHighlightSrv.countPTPairErrors();
                  this.appActions.actSetErrorCorrectionMode({
                    nameSuggestions: {
                      found          : true,
                      startCorrection: false,
                    },
                    refSuggestions : {
                      found          : true,
                      startCorrection: false,
                    },
                    waySuggestions : {
                      found          : true,
                      startCorrection: false,
                    },
                    PTvSuggestions : {
                      found          : true,
                      startCorrection: false,
                    },
                    ptPairSuggestions: {
                      found          : true,
                      startCorrection: false,
                    },
                  });
                } else {
                  this.downloadMultipleNodeData(toDownload);
                }
              }
            }
          }
          // FIXME
          // this.processSrv.drawStopAreas();
          // this.getRouteMasters();
          this.storageSrv.tutorialStepCompleted.emit('new continuous overpass data');
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
  getRouteMasters(minNumOfRelations?: number): void {
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
        throw new Error(JSON.stringify(err));
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
            throw new Error(JSON.stringify(err));
          });
        },
        (err) => {
          this.warnSrv.showError();
          throw new Error(JSON.stringify(err));
        },
      );
  }

  requestOverpassData(requestBody: string): void {
    this.mapSrv.clearLayer();
    requestBody = this.replaceBboxString(requestBody);
    this.httpClient
      .post(ConfService.overpassUrl, requestBody, { headers: Utils.HTTP_HEADERS })
      .subscribe(
        (res) => {
          this.mapSrv.renderData(res);
        },
        (err) => {
          throw new Error(JSON.stringify(err));
        },
      );
  }

  uploadData(metadata: object, testUpload: boolean = false): void {
    this.changeset = this.createChangeset(metadata);
    this.putChangeset(this.changeset, testUpload);
  }

  async initDownloader(map: L.Map): Promise<void> {
    this.setupAreaReference(map);
    if (this.minZoomLevelIsValid(map) && await this.shouldDownloadMissingArea()) {
      this.requestNewOverpassData();
    }
  }

  async initDownloaderForModalMap(map: L.Map): Promise<void> {
    this.setupAreaReference(map);
    if (this.minZoomLevelIsValid(map) && await this.shouldDownloadMissingArea()) {
      this.requestNewOverpassDataForWizard((false));
    }
  }

  async initDownloaderForModalMapRMW(map: L.Map): Promise<void> {
    this.setupAreaReference(map);
    if (this.minZoomLevelIsValid(map) && await this.shouldDownloadMissingArea()) {
      this.requestNewOverpassDataForWizard(false);
    }
  }
  /**
   * Creates new changeset on the API and returns its ID in the callback.
   * Put /api/0.6/changeset/create
   */
  putChangeset(changeset: any, testUpload?: boolean): void {
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

  private setupAreaReference(map: L.Map): void {
    const viewCenter: L.LatLng = map.getCenter();
    const south: string = (Math.floor(viewCenter.lat / 0.05) * 0.05).toFixed(2);
    const west: string = (Math.floor(viewCenter.lng / 0.05) * 0.05).toFixed(2);
    const north: string = (Number(south) + 0.05).toFixed(2);
    const east: string = (Number(west) + 0.05).toFixed(2);
    const areaPseudoId = south + 'x' + west;
    this.areaReference = { areaPseudoId, overpassBox: [south, west, north, east], viewCenter };
  }

  private minZoomLevelIsValid(map: L.Map): boolean {
    return map.getZoom() > ConfService.minDownloadZoom;
  }

  private async shouldDownloadMissingArea(): Promise<boolean> {
    return !await this.dbSrv.hasArea(this.areaReference.areaPseudoId);
  }

  /**
   * Downloads all data for currently selected node.
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
              throw new Error(JSON.stringify(err));
            });
          }
          this.warnSrv.showSuccess();
        },
        (err) => {
          this.warnSrv.showError();
          throw new Error(JSON.stringify(err));
        });
  }

  /**
   * Downloads all missing data for currently explored relation.
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
          this.mapSrv.renderTransformedGeojsonData(transformedGeojson, this.mapSrv.map);
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
          throw new Error(JSON.stringify(err));
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

  private markQueriedRelations(idsArr: number[]): void {
    idsArr.forEach((id) => this.storageSrv.queriedMasters.add(id));
  }

  /**
   * Replaces {{bbox}} query string to actual bbox of the map view.
   */
  private replaceBboxString(requestBody: string): string {
    const bboxStr: string = this.areaReference.overpassBox.join(', ');
    return requestBody.replace(new RegExp('{{bbox}}', 'g'), bboxStr);
  }

  /**
   * Create basic changeset body.
   * @param metadata - contains source and comment added by user
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
   */
  private addChangesetId(changeset_id: any): void {
    this.changeset_id = changeset_id;
    const parser = new DOMParser();
    const doc = parser.parseFromString(this.changeset, 'application/xml');
    doc.querySelector('changeset').setAttribute('id', changeset_id);
    this.changeset = doc;
    console.log('LOG (overpass s.)', this.changeset, doc);
  }

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
      // @ts-ignore
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
  getRandomKey(collection: any): any {
    let keys = Array.from(collection.keys());
    return keys[Math.floor(Math.random() * keys.length)];
  }
  getStopDataIDB(stopId: number): any {
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
      }
      this.storageSrv.logStats();
      this.storageSrv.elementsDownloaded.add(stopId);
      if (!(this.ngRedux.getState()['app']['advancedExpMode'])) {
        let element = this.storageSrv.elementsMap.get(stopId);
        this.storageSrv.selectedStopBeginnerMode = element;
        this.processSrv.filterRelationsByStop(element);
        this.appActions.actSetBeginnerView('stop');
      }
      this.getRouteMasters(10);
    }).catch((err) => {
      console.log('LOG (overpass s.) Could not fetch ids of relations for a stop with id :' + stopId);
      console.error(err);
      throw new Error(JSON.stringify(err));
    });
  }
  getPlatformDataIDB(platformId: number): any {
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
      if (!(this.ngRedux.getState()['app']['advancedExpMode'])) {
        let element = this.storageSrv.elementsMap.get(platformId);
        this.storageSrv.selectedStopBeginnerMode = element;
        this.processSrv.filterRelationsByStop(element);
        this.appActions.actSetBeginnerView('stop');
      }
      this.getRouteMasters(10);
    }).catch((err) => {
      console.log('LOG (overpass s.) Could not fetch ids of relations for a platform with id :' + platformId);
      console.error(err);
      throw new Error(JSON.stringify(err));
    });
  }

  /**
   * Downloads multiple node data for error highlight
   */
  private downloadMultipleNodeData(toDownload: any): void {
    let requestBody = `
      [out:json][timeout:25];
      (
         node(id:${toDownload.join(', ')});
      );
      (._;<;);
      out meta;`;
    console.log('LOG.(overpass s.) Multiple node data download query', requestBody);
    requestBody     = this.replaceBboxString(requestBody.trim());
    this.httpClient
      .post(ConfService.overpassUrl, requestBody, { headers: Utils.HTTP_HEADERS })
      .subscribe(
        (res) => {
          if (!res) {
            return alert('No response from API. Try to select element again please.');
          }

          console.log('res', res);
          for (const element of toDownload) {
            this.storageSrv.elementsDownloaded.add(element);
          }

          for (const element of res['elements']) {
            if (!this.storageSrv.elementsMap.has(element.id)) {
              this.storageSrv.elementsMap.set(element.id, element);
            }
          }
          this.dbSrv.addMultipleResponseToIDB(res, toDownload).catch((err) => {
            console.log('LOG (overpass s.) Error in adding Overpass API \'s response OR' +
              ' in adding related metadata to IDB for route with ids : ' , toDownload);
            console.error(err);
            throw new Error(JSON.stringify(err));
          });
          this.appActions.actSetErrorCorrectionMode({
            nameSuggestions: {
              found          : true,
              startCorrection: false,
            },
            refSuggestions : {
              found          : true,
              startCorrection: false,
            },
            waySuggestions : {
              found          : true,
              startCorrection: false,
            },
            PTvSuggestions : {
              found          : true,
              startCorrection: false,
            },
            ptPairSuggestions: {
              found          : true,
              startCorrection: false,
            },
          });
          this.errorHighlightSrv.countNameErrors();
          this.errorHighlightSrv.countRefErrors();
          this.errorHighlightSrv.countWayErrors();
          this.errorHighlightSrv.countPTvErrors();
          this.errorHighlightSrv.countPTPairErrors();
        },
        (err) => {
          this.warnSrv.showError();
          throw new Error(JSON.stringify(err));
        });
  }

  /**
   * Continuous query for auto route wizard
   */
  requestNewOverpassDataForWizard(find: boolean): void {
    console.log('LOG. (overpass s.) Requesting new overpass data for wizard modal map');
    let wizardMode = this.ngRedux.getState()['app']['wizardMode'];
    if (wizardMode === 'route wizard') {
      this.setupAreaReference(this.routeWizardSrv.map);
    } else if (wizardMode === 'route master wizard') {
      this.setupAreaReference(this.routeMasterWizardSrv.map);
    }

    const requestBody = this.replaceBboxString(Utils.CONTINUOUS_QUERY);
    this.httpClient
      .post<IOverpassResponse>(ConfService.overpassUrl, requestBody, {
        responseType: 'json',
        headers     : Utils.HTTP_HEADERS,
      })
      .subscribe(
        (res: IOverpassResponse) => {
          if (wizardMode === 'route wizard') {
            this.routeWizardSrv.savedContinuousQueryResponses.push(res);
            for (let element of res.elements) {
              if (!this.routeWizardSrv.modalMapElementsMap.has(element.id)) {
                this.routeWizardSrv.modalMapElementsMap.set(element.id, element); }
            }
            this.dbSrv.addArea(this.areaReference.areaPseudoId);
            let transformed = this.osmtogeojson(res);
            this.routeWizardSrv.renderTransformedGeojsonDataForRouteWizard(transformed, this.routeWizardSrv.map);
            this.warnSrv.showSuccess();
            if (find) {
              let stopsInBounds = this.mapSrv.findStopsInBounds(this.routeWizardSrv.map, this.routeWizardSrv.modalMapElementsMap);
              let toDownload = stopsInBounds.filter((stop) => {
                return !(this.routeWizardSrv.nodesFullyDownloaded.has(stop));
              });
              let routeRefs = this.routeWizardSrv.getRouteRefsFromNodes(stopsInBounds);
              if (routeRefs.length !== 0) {
                if (toDownload.length !== 0) {
                  this.getMultipleNodeDataForWizard(toDownload);
                } else {
                  this.routeWizardSrv.findMissingRoutes(null);
                }

              } else {
                this.routeWizardSrv.routesReceived.emit(null);
              }
            }
          }

          if (wizardMode === 'route master wizard') {
            console.log('LOG. (overpass  s.) Response of new overpass data for wizard modal map : ', res);

            this.routeMasterWizardSrv.savedContinuousQueryResponses.push(res);
            for (let element of res.elements) {
              if (!this.routeMasterWizardSrv.modalMapElementsMap.has(element.id)) {
                this.routeMasterWizardSrv.modalMapElementsMap.set(element.id, element);
              }
            }
            this.dbSrv.addArea(this.areaReference.areaPseudoId);
            let transformed = this.osmtogeojson(res);
            this.routeMasterWizardSrv.renderTransformedGeojsonDataRMWizard(transformed, this.routeMasterWizardSrv.map);
            this.warnSrv.showSuccess();

            if (find) {
              console.log('LOG. (overpass  s.) Process of finding missing route masters started');
              let stopsInBounds = this.mapSrv.findStopsInBounds(this.routeMasterWizardSrv.map,
                this.routeMasterWizardSrv.modalMapElementsMap);
              console.log('LOG. (overpass  s.) Stops in current modal map\'s bounds', stopsInBounds);
              let toDownload    = stopsInBounds.filter((stop) => {
                return !(this.routeMasterWizardSrv.nodesFullyDownloaded.has(stop));
              });
              console.log('LOG. (overpass  s.) Already fully downloaded nodes :',
                this.routeMasterWizardSrv.nodesFullyDownloaded, ', To be downloaded nodes : ', toDownload);
              if (toDownload.length !== 0) {
                console.log('LOG. (overpass  s.) To be downloaded nodes not zero');
                this.getMultipleNodeDataForWizard(toDownload);
              } else {
                console.log('LOG. (overpass  s.) To be downloaded nodes zero');
                let relsMap = this.routeMasterWizardSrv.findToBeComparedRels(null);
                console.log('LOG. (overpass  s.) Relations to be compared: ', relsMap);
                if (relsMap.size !== 0) {
                  console.log('LOG. (overpass  s.) Relations to be compared not zero getting route masters: ');
                  let keys: number[] = Array.from(relsMap.keys());
                  this.getRouteMastersForWizard(keys);
                } else {
                  alert('Sorry, no suggestions found for the selected area.');
                }
              }
            }
          }
        },
        (err) => {
          this.warnSrv.showError();
          console.error('LOG (overpass s.) Stops response error', JSON.stringify(err));
        },
      );
  }

  /**
   * Multiple node data download for route wizard
   */
  private getMultipleNodeDataForWizard(idsArr: number[]): void {
    let requestBody = `
      [out:json][timeout:25];
      (
       node(id:${idsArr});
      );
      (._;<;);
      out meta;`;
    console.log('LOG (overpass s.) Querying multiple nodes :', requestBody);
    requestBody = this.replaceBboxString(requestBody.trim());
    this.httpClient
      .post(ConfService.overpassUrl, requestBody, { headers: Utils.HTTP_HEADERS })
      .subscribe(
        (res: IOverpassResponse) => {
          console.log('LOG (overpass s.) Multiple node data query response:', res);
          if (!res) {
            return alert('No response from API. Try to select element again please.');
          }
          this.dbSrv.addMultipleResponseToIDB(res, idsArr).catch((err) => {
            console.log('LOG (overpass s.) Error in adding Overpass API \'s response OR' +
              ' in adding related metadata to IDB for route with ids : ' , idsArr);
            console.error(err);
            throw new Error(JSON.stringify(err));
          });
          let wizardMode = this.ngRedux.getState()['app']['wizardMode'];
          if (wizardMode === 'route wizard') {
            for (let id of idsArr) {
              this.routeWizardSrv.nodesFullyDownloaded.add(id);
            }
            this.routeWizardSrv.savedMultipleNodeDataResponses.push(res);
            this.routeWizardSrv.findMissingRoutes(res);
          }
          if (wizardMode === 'route master wizard') {
            for (let id of idsArr) {
              this.routeMasterWizardSrv.nodesFullyDownloaded.add(id);
            }
            this.routeMasterWizardSrv.savedMultipleNodeDataResponses.push(res);
            for (let element of res['elements']) {
              if (!this.routeMasterWizardSrv.modalMapElementsMap.has(element.id)) {
                this.routeMasterWizardSrv.modalMapElementsMap.set(element.id, element);
              }
            }
            let relsMap = this.routeMasterWizardSrv.findToBeComparedRels(res);
            console.log('LOG (overpass s.) Relations to be compared ( at least one member in map bounds): ', relsMap);
            if (relsMap.size !== 0) {
              let keys: number[] = Array.from(relsMap.keys());
              this.getRouteMastersForWizard(keys);
            } else {
              alert('Sorry, no suggestions found for the selected area.');
            }
          }

          this.warnSrv.showSuccess();
        },
        (err) => {
          this.warnSrv.showError();
          throw new Error(err.toString());
        });
  }

  /**
   * Downloads route_master relations for currently added route relations.
   * @minNumOfRelations: number[]
   */
  getRouteMastersForWizard(resIDs: number[]): void {
    let requestBody: string = `
            [out:json][timeout:25][bbox:{{bbox}}];
            (
              rel(id:${resIDs.join(', ')});
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
        (res: IOverpassResponse) => {
          if (!res) {
            return alert(
              'No response from API. Try to select other master relation again please.',
            );
          }
          console.log('LOG (overpass s.) Response for route_master from Overpass API');
          console.log(res);

          res.elements.forEach((element) => {
            if (!this.storageSrv.elementsMap.has(element.id)) {
              this.storageSrv.elementsMap.set(element.id, element);
              this.storageSrv.elementsDownloaded.add(element.id);
            }
          });
          let wizardMode = this.ngRedux.getState()['app']['wizardMode'];
          if (wizardMode === 'route master wizard') {
            this.routeMasterWizardSrv.findMissingRouteMasters(res);
            this.routeMasterWizardSrv.savedMasterQueryResponses.push(res);
          }
        },
        (err) => {
          this.warnSrv.showError();
          throw new Error(JSON.stringify(err));
        },
      );
  }

}
