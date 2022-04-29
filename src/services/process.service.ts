import { NgRedux } from '@angular-redux/store';
import { EventEmitter, Injectable } from '@angular/core';
import * as L from 'leaflet';
import { Subject } from 'rxjs';
import { IOsmElement } from '../core/osmElement.interface';
import { IOverpassResponse } from '../core/overpassResponse.interface';
import { IPtRelation } from '../core/ptRelation.interface';
import { IPtStop } from '../core/ptStop.interface';
import { AppActions } from '../store/app/actions';
import { IAppState } from '../store/model';
import { DbService } from './db.service';
import { MapService } from './map.service';
import { StorageService } from './storage.service';

@Injectable()
export class ProcessService {
  // Observable boolean sources
  private showRelationsForStopSource = new Subject<boolean>();
  private showStopsForRouteSource = new Subject<boolean>();
  private refreshSidebarViewsSource = new Subject<string>();
  // Observable boolean streams
  showRelationsForStop$ = this.showRelationsForStopSource.asObservable();
  showStopsForRoute$ = this.showStopsForRouteSource.asObservable();
  refreshSidebarViews$ = this.refreshSidebarViewsSource.asObservable();
  membersToDownload: EventEmitter<object> = new EventEmitter();
  refreshMasters: EventEmitter<object> = new EventEmitter();

  constructor(
    private ngRedux: NgRedux<IAppState>,
    private appActions: AppActions,

    private mapSrv: MapService,
    private storageSrv: StorageService,
    private dbSrv: DbService,
  ) {
    // this.mapSrv.popupBtnClick.subscribe(
    //     (data) => {
    //         let featureType = data[0];
    //         let featureId = Number(data[1]);
    //         let element = this.findElementById(featureId, featureType);
    //         if (!element) {
    //             alert("Element was not found?!");
    //         } else if (featureType === "node") {
    //             this.exploreStop(element);
    //         } else if (featureType === "relation") {
    //             this.exploreRelation(element);
    //         }
    //     }
    // );

    this.mapSrv.markerClick.subscribe(
      /**
       * @param data - string containing ID of clicked marker
       */
      (data) => {
        const featureId = Number(data);
        const element = this.getElementById(featureId, this.storageSrv.elementsMap);
        if (!element) {
          alert(
            'Problem occurred - clicked element was not found?! Select different element please.',
          );
        }
        this.appActions.actSelectElement({ element });
        console.log('LOG (processing s.) Selected element is ', element);
        this.refreshTagView(element);
        if (!(this.ngRedux.getState()['app']['advancedExpMode'])) {
          this.storageSrv.selectedStopBeginnerMode = element;
          this.filterRelationsByStop(element);
          this.appActions.actSetBeginnerView('stop');
        }
      },
    );
  }

  /**
   * Returns element with specific ID directly from mapped object.
   */
  getElementById(featureId: number, map: any): any {
    if (map.has(featureId)) {
      return map.get(featureId);
    }
  }

  /**
   * Filters data in the sidebar depending on current view's bounding box.
   */
  filterDataInBounds(): void {
    if (
      !this.storageSrv.localJsonStorage ||
      this.storageSrv.listOfStops.length > 1000
    ) {
      return console.log(
        'LOG (processing s.) filtering of stops in map bounds was stopped (too much data - limit 1000 nodes).',
      );
    }
    this.mapSrv.bounds = this.mapSrv.map.getBounds();
    for (const stop of this.storageSrv.listOfStops) {
      const el = document.getElementById(stop.id.toString());
      if (!el) {
        return;
      }
      el.style.display = el && this.mapSrv.bounds.contains([stop.lat, stop.lon]) ? 'table-row' : 'none';
      // el.style.display = el && this.mapSrv.bounds.contains([stop.lat, stop.lon]) ? "table-row" : "none";
    }
  }

  /**
   * Generates new unique ID used to store API responses.
   */
  private getResponseId(): number {
    let id = 1;
    while (this.storageSrv.localJsonStorage.has(id)) {
      id++;
    }
    return id;
  }

  processResponse(response: IOverpassResponse): void {
    const responseId = this.getResponseId();
    const transformedGeojson = this.mapSrv.osmtogeojson(response);
    this.storageSrv.localJsonStorage.set(responseId, response);
    this.storageSrv.localGeojsonStorage.set(responseId, transformedGeojson);
    this.createLists(responseId);
    console.log('response', response);
    this.mapSrv.renderTransformedGeojsonData(transformedGeojson, this.mapSrv.map);
  }

  processNodeResponse(response: any): void {
    for (const element of response.elements) {
      if (!this.storageSrv.elementsMap.has(element.id)) {
        this.storageSrv.elementsMap.set(element.id, element);
        if (!element.tags) {
          continue;
        }
        switch (element.type) {
          case 'node':
            // only nodes are fully downloaded
            this.storageSrv.elementsDownloaded.add(element.id);

            if (element.tags.bus === 'yes' || element.tags.public_transport) {
              this.storageSrv.listOfStops.push(element);
            }
            break;
          case 'relation':
            if (element.tags.public_transport === 'stop_area') {
              this.storageSrv.listOfAreas.push(element);
            } else {
              this.storageSrv.listOfRelations.push(element);
              break;
            }
        }
      }
    }
    this.storageSrv.logStats();
  }

  /**
   * Adds hash to URL hostname similarly like it is used on OSM (/#map=19/49.83933/18.29230)
   */
  addPositionToUrlHash(): void {
    const center = this.mapSrv.map.getCenter();
    window.location.hash = `map=${this.mapSrv.map.getZoom()}/${center.lat.toFixed(
      5,
    )}/${center.lng.toFixed(5)}`;
  }

  processMastersResponse(response: object): void {
    response['elements'].forEach((element) => {
      if (!this.storageSrv.elementsMap.has(element.id)) {
        console.log('LOG (processing s.) New element added:', element);
        this.storageSrv.elementsMap.set(element.id, element);
        this.storageSrv.elementsDownloaded.add(element.id);
        if (element.tags.route_master) {
          this.storageSrv.listOfMasters.push(element);
        } else {
          console.log('LOG (processing s.) WARNING: new elements? ', element);
        } // do not add other relations because they should be already added
      }
    });
    console.log(
      'LOG (processing s.) Total # of master rel. (route_master)',
      this.storageSrv.listOfMasters.length,
    );
    this.storageSrv.logStats();

    const idsHaveMaster: number[] = [];
    this.storageSrv.listOfMasters.forEach((master) => {
      for (const member of master['members']) {
        idsHaveMaster.push(member['ref']);
      }
    });
    this.refreshMasters.emit({ idsHaveMaster });
    console.log('LOG (processing s.) Master IDs are:', idsHaveMaster);
  }

  /**
   * Creates initial list of stops/relations.
   */
  createLists(id: number): void {
    const response = this.storageSrv.localJsonStorage.get(id);
    response.elements.forEach((element) => {
      if (!this.storageSrv.elementsMap.has(element.id)) {
        this.storageSrv.elementsMap.set(element.id, element);

        switch (element.type) {
          case 'node':
            // this.storageSrv.elementsDownloaded.add(element.id);
            if (
              element.tags &&
              ['platform', 'stop_position', 'station']
                .indexOf(element.tags.public_transport) > -1
            ) {
              this.storageSrv.listOfStops.push(element);
            }
            break;
          case 'relation':
            if (element.tags.public_transport === 'stop_area') {
              this.storageSrv.listOfAreas.push(element);
            } else if (element.tags.public_transport) {
              this.storageSrv.listOfRelations.push(element);
              break;
            }
        }
      }
    });
    this.storageSrv.logStats();
  }

  /**
   * Highlights downloaded stop areas by rectangles.
   */
  drawStopAreas(): void {
    const boundaries = [];
    for (const area of this.storageSrv.listOfAreas) {
      const coords = [];
      for (const member of area['members']) {
        if (member['type'] !== 'node') {
          continue;
        }
        const ref: IPtStop = this.getElementById(member.ref, this.storageSrv.elementsMap);
        coords.push([ref.lat, ref.lon]);
      }
      const polyline = L.polyline(coords);
      L.rectangle(polyline.getBounds(), {
        color: '#000000',
        fill: false,
        weight: 2,
      })
        .bindTooltip(area['tags'].name)
        .addTo(this.mapSrv.map);
    }
  }

  activateFilteredRouteView(data: boolean): void {
    this.showRelationsForStopSource.next(data);
  }

  activateFilteredStopView(data: boolean): void {
    this.showStopsForRouteSource.next(data);
  }

  refreshSidebarView(data: string): void {
    this.refreshSidebarViewsSource.next(data);
  }

  refreshTagView(element: any): void {
    if (element) {
      this.storageSrv.currentElementsChange.emit(
        JSON.parse(JSON.stringify(element)),
      );
      this.refreshSidebarView('tag');
    } else {
      this.refreshSidebarView('cancel selection');
    }
  }

  /**
   * Re-initiates a list of route's variants and refreshes relation browser window.
   */
  refreshRelationView(rel: IPtRelation): void {
    this.storageSrv.listOfVariants.length = 0;
    if (rel.tags.type === 'route_master') {
      for (const member of rel.members) {
        const routeVariant = this.getElementById(member.ref, this.storageSrv.elementsMap);
        this.storageSrv.listOfVariants.push(routeVariant);
      }
    }
    this.refreshSidebarView('relation');
  }

  /**
   * Explores relation by downloading its members and highlighting stops position with a line.
   */
  exploreRelation(
    rel: any,
    refreshTagView?: boolean,
    refreshMasterView?: boolean,
    zoomToElement?: boolean,
  ): void {
    this.mapSrv.clearCircleHighlight();
    const missingElements = [];
    const allowedRefs = [
      'stop',
      'stop_exit_only',
      'stop_entry_only',
      'platform',
      'platform_exit_only',
      'platform_entry_only',
    ];
    // skip for new (created) relations
    if (rel.id > 0) {
      rel['members'].forEach((member) => {
        if (
          !this.storageSrv.elementsMap.has(member.ref) &&
          ['node'].indexOf(member.type) > -1 &&
          allowedRefs.indexOf(member.role) > -1
        ) {
          missingElements.push(member.ref);
        }
      });
    }
    // check if relation and all its members are downloaded -> get missing
    if (
      !this.storageSrv.elementsDownloaded.has(rel.id) &&
      rel['members'].length > 0 &&
      missingElements.length > 0 && !this.storageSrv.completelyDownloadedRoutesIDB.has(rel.id)
    ) {
      console.log('LOG (processing s.) Route not in JS, not in IDB, has some members, and has missing members' + rel.id);
      console.log(
        'LOG (processing s.) Relation is not completely downloaded. Missing: ' +
        missingElements.join(', '),
      );
      this.membersToDownload.emit({
        rel,
        missingElements,
      });
    } else if (
      this.storageSrv.elementsDownloaded.has(rel.id) ||
      (missingElements.length === 0 && rel.id > 0) ||
      (rel.id < 0 && rel['members'].length > 0)
    ) {
      console.log('LOG (processing s.) (Route in JS) or (no missing elements &' +
        ' old) or (new & has some members)' + rel.id);
      console.log('condition is valid', rel.id, rel['members'].length);
      console.log('rel available : highlight type', this.mapSrv.highlightType);
      this.downloadedMissingMembers(rel, zoomToElement, true);
      this.refreshTagView(rel);
      this.storageSrv.elementsDownloaded.add(rel.id);
    } else if (rel.id < 0) {
      this.refreshTagView(rel);
    } else if (this.storageSrv.completelyDownloadedRoutesIDB.has(rel.id)) {
      console.log('Route in IDB' + rel.id);
      this.getRelationDataIDB(rel);
    } else {
      return alert(
        'FIXME: Some other problem with relation - downloaded ' +
        this.storageSrv.elementsDownloaded.has(rel.id) +
        ' , # of missing elements ' +
        missingElements.length +
        ' , # of members ' +
        rel['members'].length +
        JSON.stringify(rel),
      );
    }
    if (refreshMasterView) {
      // delete rel.members; // FIXME ??? - TOO MANY RELATIONS?
      this.refreshRelationView(rel);
    }
    if (refreshTagView) {
      this.refreshTagView(rel);
    }
  }

  /**
   * Runs rest of the route's highlighting process after the missing members are downloaded.
   */
  downloadedMissingMembers(
    rel: any,
    zoomToElement: boolean,
    refreshTagView: boolean,
  ): void {
    if (this.mapSrv.highlightIsActive()) {
      this.mapSrv.clearHighlight(this.mapSrv.map);
    }
    this.storageSrv.clearRouteData();
    if (this.mapSrv.showRoute(rel, this.mapSrv.map, this.storageSrv.elementsMap)) {
      this.mapSrv.drawTooltipFromTo(rel);
      this.filterStopsByRelation(rel);
      if (zoomToElement) {
        console.log(
          'LOG (processing s.) fitBounds',
          this.mapSrv.highlightStroke.length,
        );
        this.mapSrv.map.fitBounds(
          this.mapSrv.highlightStroke.getBounds(),
        );
      }
    }
    if (refreshTagView) {
      this.refreshTagView(rel);
    }
  }

  exploreMaster(rel: any): void {
    if (rel.members.length === 0) {
      return alert(
        'Problem occurred - this relation doesn\'t contain any route variants.',
      );
    }
    // if (this.mapSrv.highlightIsActive()) this.mapSrv.clearHighlight();
    // let routeVariants: object[] = [];
    // for (let member of rel.members) {
    //     routeVariants.push(this.findElementById(member.ref));
    // }
    console.log(
      'LOG (processing s.) First master\'s variant was found: ',
      this.storageSrv.elementsMap.has(rel.members[0].ref),
    );
    if (!this.storageSrv.elementsMap.has(rel.members[0].ref)) {
      return alert(
        'Problem occurred - first route_master\'s variant isn\'t fully downloaded.',
      );
    }
    // explore first variant and focus tag/rel. browsers on selected master rel.
    this.exploreRelation(
      this.getElementById(rel.members[0].ref, this.storageSrv.elementsMap),
      false,
      false,
      false,
    );
    // this.mapSrv.showRelatedRoutes(routeVariants);
    this.refreshTagView(rel);
    this.refreshRelationView(rel);
  }

  exploreStop(
    stop: any,
    filterRelations: boolean,
    refreshTags: boolean,
    zoomTo: boolean,
  ): void {
    if (this.mapSrv.highlightIsActive()) {
      this.mapSrv.clearHighlight(this.mapSrv.map);
    }
    this.mapSrv.showStop(stop);
    if (filterRelations) {
      const filteredRelationsForStop = this.filterRelationsByStop(stop);
      this.mapSrv.showRelatedRoutes(filteredRelationsForStop);
    }
    this.mapSrv.addExistingHighlight();
    if (refreshTags) {
      this.refreshTagView(stop);
    }
    if (zoomTo) {
      this.mapSrv.map.panTo([stop.lat, stop.lon]);
    }
  }

  /**
   * Filters relations (routes) for given stop.
   */
  filterRelationsByStop(stop: IPtStop): object[] {
    this.storageSrv.listOfRelationsForStop = [];

    for (const relation of this.storageSrv.listOfRelations) {
      for (const member of relation['members']) {
        if (member['ref'] === stop.id) {
          this.storageSrv.listOfRelationsForStop.push(relation);
        }
      }
    }
    this.activateFilteredRouteView(true);
    this.refreshSidebarView('route');
    return this.storageSrv.listOfRelationsForStop;
  }

  /**
   * Filters stops for given relation (route).
   */
  filterStopsByRelation(rel: IPtRelation): void {
    if (rel === undefined) {
      return alert('Problem occurred - relation is undefined.');
    }
    this.storageSrv.listOfStopsForRoute.length = 0;
    rel.members.forEach((mem) => {
      if (this.storageSrv.elementsMap.has(mem.ref) && mem.type === 'node') {
        const stop = this.getElementById(mem.ref, this.storageSrv.elementsMap);
        const stopWithMemberAttr = Object.assign(
          JSON.parse(JSON.stringify(mem)),
          JSON.parse(JSON.stringify(stop)),
        );
        this.storageSrv.listOfStopsForRoute.push(
          JSON.parse(JSON.stringify(stopWithMemberAttr)),
        );
      }
    });
    this.activateFilteredStopView(true);
    this.refreshSidebarView('stop');
  }

  /**
   * Zooms to the input element (point position or relation geometry).
   */
  zoomToElement(element: IOsmElement): void {
    if (element.type === 'node') {
      if (!element['lat'] || !element['lon']) {
        return alert(
          'Problem occurred - element has no coordinates.' +
          JSON.stringify(element),
        );
      } else {
        this.mapSrv.map.panTo([element['lat'], element['lon']]);
      }
    } else {
      const coords = [];
      for (const member of element['members']) {
        if (member.type === 'node') {
          const elem = this.getElementById(member.ref, this.storageSrv.elementsMap);
          if (elem['lat'] && elem['lon']) {
            coords.push([elem['lat'], elem['lon']]);
          }
        }
      }
      if (element.tags['type'] === 'route_master') {
        // TODO zoom to BBOX of all contained rel's if they have coords...
        return;
      }
      if (coords.length < 2) {
        // do not zoom to point
        // commenting out the following alert the alert as when undoing the 'add members in a route' edit,
        // the route will have a single member or no members, so we should not give this alert when that happens
        // return alert(
        //   'Problem occurred - not enough coordinates to fit into their boundaries.',
        // );
      } else {
        const polyLine = L.polyline(coords); // zoom to coords of a relation
        this.mapSrv.map.fitBounds(polyLine.getBounds());
        console.log('LOG (processing s.) FitBounds to relation geometry');
      }
    }
  }

  /**
   * Validates URL hash content (lat, lng, zoom)
   */
  hashIsValidPosition(): boolean {
    const h = window.location.hash
      .slice(5)
      .split('/')
      .map(Number);
    h.forEach((element) => {
      if (isNaN) {
        return false;
      }
    });
    return (
      h[0] < this.mapSrv.map.getMaxZoom() &&
      this.numIsBetween(h[1], -90, 90) &&
      this.numIsBetween(h[2], -180, 180)
    );
  }

  cancelSelection(): void {
    this.refreshTagView(undefined);
    this.mapSrv.clearHighlight(this.mapSrv.map);
  }

  haveSameIds(relId: number, currElementId?: number): boolean {
    if (currElementId) {
      return currElementId === relId;
    } else {
      return false;
    }
  }

  numIsBetween(num: number, min: number, max: number): boolean {
    return min < num && num < max;
  }
  getRelationDataIDB(rel: any): any {
    this.dbSrv.getMembersForRoute(rel.id).then((res) => {
      this.processNodeResponse(res);
      const transformedGeojson = this.mapSrv.osmtogeojson(res);
      this.storageSrv.localGeojsonStorage = transformedGeojson;
      this.mapSrv.renderTransformedGeojsonData(transformedGeojson, this.mapSrv.map);
      this.storageSrv.elementsDownloaded.add(rel.id);
      this.downloadedMissingMembers(rel, true, true);
    }).catch((err) => {
      console.log('LOG (overpass s.) Error in fetching / displaying the data for route with id : '
        + rel.id + 'from IDB');
      console.log(err);
    });
  }

}
