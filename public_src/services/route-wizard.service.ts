import {EventEmitter, Injectable, OnDestroy} from '@angular/core';

import { MapService } from './map.service';
import { StorageService } from './storage.service';
import {BsModalRef, BsModalService} from 'ngx-bootstrap';
import { ProcessService } from './process.service';

import * as L from 'leaflet';

@Injectable()
export class RouteWizardService implements OnDestroy{
  public map;
  public routes = [];
  public ptLayerModal;
  public osmtogeojson: any = require('osmtogeojson');
  public modalMapElementsMap = new Map();

  public autoRouteMapNodeClick: EventEmitter<number> = new EventEmitter();
  public routesReceived: EventEmitter<any> =  new EventEmitter();
  public refreshAvailableConnectivity: EventEmitter<any> =  new EventEmitter();

  public savedMultipleNodeDataResponses = [];
  public savedContinuousQueryResponses = [];

  public elementsRenderedModalMap = new Set();
  public nodesFullyDownloaded = new Set();

  public routesMap: Map<string, any[]> = new Map();
  public membersHighlightLayerGroup    = L.layerGroup();

  public modalRefRouteWiz: BsModalRef;
  constructor(private storageSrv: StorageService,
              private mapSrv: MapService,
              // private modalService: BsModalService,
              private processSrv: ProcessService,
              ) {
    // this.modalService.onShown.subscribe((data) => {
    //   console.log('data', data);
    //   // if(this.modalRefRouteWiz.content)
    //   this.onShownModal();
    //   console.log('ok', this.modalRefRouteWiz.content);
    // });
    // this.modalService.onHidden.subscribe(() => {
    //   this.processAllDownloadedOnMainMap();
    //   this.storageSrv.currentElement = null;
    //   this.storageSrv.currentElementsChange.emit(
    //     JSON.parse(JSON.stringify(null)),
    //   );
    //   this.storageSrv.stopsForRoute     = [];
    //   this.storageSrv.platformsForRoute = [];
    //   this.mapSrv.highlightType         = 'Stops';
    // });
  }

  /***
   * Fired when modal has rendered
   * @returns {void}
   */
  public onShownModal(): void {
    this.map.invalidateSize();
  }

  /***
   * Renders data on modal map which was already present on the main map
   * @returns {void}
   */
  public renderAlreadyDownloadedData(): void {
    let obj: any = {};
    let elements = [];
    this.storageSrv.elementsMap.forEach((element) => {
      elements.push(element);
    });
    obj.elements = elements;
    let transformed = this.osmtogeojson(obj);
    this.renderTransformedGeojsonDataForRouteWizard(transformed, this.map);
  }

  /***
   *Used when modal is closed,
   *  all data downloaded for modal map is processed for main application
   * @returns {void}
   */
  public processAllDownloadedOnMainMap(): void {
    for (let res of this.savedContinuousQueryResponses) {
      this.processSrv.processResponse(res);
    }
  }

  /***
   * Renders data on modal map
   * @param transformedGeoJSON
   * @param {Map} map
   */
  public renderTransformedGeojsonDataForRouteWizard(transformedGeoJSON: any, map: L.Map): void {
    this.ptLayerModal = L.geoJSON(transformedGeoJSON, {
      filter: (feature) => {
        if (!this.elementsRenderedModalMap.has(feature.id) &&
          'public_transport' in feature.properties && feature.id[0] === 'n'
        ) {
          return true;
        } else {
          return false;
        }
      },
      onEachFeature: (feature, layer) => {
        this.elementsRenderedModalMap.add(feature.id);
        this.enableClickForRouteWizardMap(feature, layer);
      },
      pointToLayer: (feature, latlng) => {
        return this.mapSrv.stylePoint(feature, latlng);
      },
    });

    console.log('LOG (map s.) Adding PTlayer to modal map again', this.ptLayerModal);
    this.ptLayerModal.addTo(map);
  }

  /***
   * Enables click of nodes for modal map
   * @param feature
   * @param layer
   * @returns {void}
   */
  public enableClickForRouteWizardMap(feature: any, layer: any): void {
    layer.on('click', () => {
      this.handleRouteWizardMarkerClick(feature);
    });
  }

  /***
   * Handles map click
   * @param feature
   * @returns {void}
   */
  private handleRouteWizardMarkerClick(feature: any): void {
    const featureId: number = this.mapSrv.getFeatureIdFromMarker(feature);
    this.autoRouteMapNodeClick.emit(featureId);
  }

  /***
   * Returns all stops/platforms on the given map
   * @param {Map} map
   * @returns {any[]}
   */
  public findStopsInBounds(map: L.Map): any[] {
    let stopsInBounds = [];
    this.modalMapElementsMap.forEach((stop) => {
      if (stop.type === 'node' && (stop.tags.bus === 'yes' || stop.tags.public_transport)) {
        if (map.getBounds().contains({ lat: stop.lat, lng: stop.lon })) {
          stopsInBounds.push(stop.id);
        }
      }
    });
    return stopsInBounds;
  }

  /***
   * Forms an array of route refs from nodes, also removes duplicates
   * @param stopsInBoundsIDs
   * @returns {any[]}
   */
  public getRouteRefsFromNodes(stopsInBoundsIDs: any): any[] {
    let withRouteRefTag = [];
    let ref_map;
    let refValues       = [];
    for (let id of stopsInBoundsIDs) {
      let stop = this.modalMapElementsMap.get(id);
      if (stop.tags.route_ref) {
        withRouteRefTag.push(stop);
      }
    }
    if (withRouteRefTag.length !== 0) {
      ref_map = RouteWizardService.getIndividualRouteRefs(withRouteRefTag);
      Array.from(ref_map).map(([key]) => {
        refValues.push(key);
      });
    }
    return refValues;
  }

  /***
   * Processes multiple node data
   * @param downloadedResponse
   * @returns {void}
   */
  public findMissingRoutes(downloadedResponse: any): void {
    let stopsInBounds       = this.findStopsInBounds(this.map);
    let nodeRefs            = this.getRouteRefsFromNodes(stopsInBounds);
    let refsOfRoutes: any[] = [];
    if (downloadedResponse) {
      for (const element of downloadedResponse.elements) {
        if (!this.modalMapElementsMap.has(element.id)) {
          this.modalMapElementsMap.set(element.id, element);
        }
        if (element.type === 'relation' && element.tags.public_transport !== 'stop_area' && element.tags.ref) {
          refsOfRoutes.push(element.tags.ref);
        }
      }
    }
    let refs = this.getFromAlreadyDownloadedRoutes();
    refsOfRoutes = refsOfRoutes.concat(refs);
    let uniqueRefsOfRoutes = RouteWizardService.removeDuplicatesFromArray(refsOfRoutes);
    let notAddedRefs       = RouteWizardService.compareArrays(nodeRefs, uniqueRefsOfRoutes);
    notAddedRefs           = this.filterPreviouslyAddedRefs(notAddedRefs);

    if (notAddedRefs.length !== 0) {
      this.routesReceived.emit(this.getStopsForNewRoutes(notAddedRefs));
    } else {
      this.routesReceived.emit(null);
    }
  }

  /***
   * Filters newly added ref from suggested refs
   * @param {any[]} refs
   * @returns {any}
   */
  private filterPreviouslyAddedRefs(refs: any[]): any {
    let index;
    this.modalMapElementsMap.forEach((element) => {
      if (element.type === 'relation'
        && element.tags.public_transport !== 'stop_area' &&
        element.tags.ref
        && refs.includes(element.tags.ref)) {
        index = refs.indexOf(element.tags.ref);
      }
    });
    if (index !== undefined) {
      refs.splice(index, 1);
    }
    return refs;
  }

  /***
   * Returns stops for given refs
   * @param notAddedRefs
   * @returns {any}
   */
  private getStopsForNewRoutes(notAddedRefs: any): any {
    let stopsForNewRoutes = new Map();
    this.modalMapElementsMap.forEach((stop) => {
      if (stop.type === 'node' && (stop.tags.bus === 'yes' || stop.tags.public_transport) && stop.tags.route_ref) {
        let stops: any[] = [];
        stops.push(stop);
        let refMap = RouteWizardService.getIndividualRouteRefs(stops);
        let individualRefs = [];
        Array.from(refMap).map(([key]) => { individualRefs.push(key); });
        individualRefs.forEach((val) =>  {
          if (notAddedRefs.includes(val)) {
            if (stopsForNewRoutes.get(val)) {
              stopsForNewRoutes.get(val).push(stop);
            } else {
              let arr = [];
              arr.push(stop);
              stopsForNewRoutes.set(val, arr);
            }
          }
        });
      }
    });
    return stopsForNewRoutes;
  }

  /***
   * Removes duplicates from array
   * @param {any[]} arr
   * @returns {any}
   */
  private static removeDuplicatesFromArray(arr: any[]): any {
    return arr.filter((value, index, self) => {
      return self.indexOf(value) === index;
    });
  }

  /***
   * Compares arrays and returns refs not added in route refs
   * @param nodeRefs
   * @param routeRefs
   * @returns {any}
   */
  private static compareArrays(nodeRefs: any, routeRefs: any): any {
    let notAdded = [];
    for (let itemA of nodeRefs) {
      let flag = false;
      for (let itemB of routeRefs) {
        if (itemA === itemB) {
          flag = true;
        }
      }

      if (flag === false) {
        notAdded.push(itemA);
      }
    }
    return notAdded;
  }

  /***
   * Get individual refs from stops's route_ref
   * @param {any[]} stops
   * @returns {any}
   */
  public static getIndividualRouteRefs(stops: any[]): any {
    let refs = [];
    for (let stop of stops) {
      refs.push(stop.tags.route_ref);
    }
    let ref_map = new Map();
    for (let routeRefs of refs) {
      let singleRefs = routeRefs.split(';');
      for (let ref of singleRefs) {
        if (ref_map.has(ref)) {
          let val = ref_map.get(ref);
          val++;
          ref_map.set(ref, val);
        } else {
          ref_map.set(ref, 1);
        }
      }
    }
    return ref_map;
  }

  /***
   * Highlights route's members on map
   * @param members
   * @param adjustZoom
   */
  public highlightRoute(members: any, adjustZoom: boolean): void {
    this.mapSrv.clearHighlight(this.map);
    let routeMembers = members;
    RouteWizardService.assignRolesToMembers(routeMembers);
    let rel                           = {
      members: routeMembers,
      tags   : { name: 'nil' },
    };
    this.storageSrv.stopsForRoute     = [];
    this.storageSrv.platformsForRoute = [];
    this.mapSrv.showRoute(rel, this.map, this.modalMapElementsMap);
    if (adjustZoom) {
      this.adjustZoomForRoute(routeMembers);
    }
  }

  /***
   * Assign roles to members for new route
   * @param members
   * @returns {any}
   */
  public static assignRolesToMembers(members: any): any {
    let probableRole: string = '';
    for (let member of members) {
      switch (member.tags.public_transport) {
        case 'platform':
        case 'station':
          probableRole = 'platform';
          break;
        case 'stop_position':
          probableRole = 'stop';
          break;
        default:
          alert('FIXME: suspicious role - ');
          probableRole = 'stop';
      }
      member.role = probableRole;
    }
  }

  /***
   * Adjust zoom to fit all members of route on map
   * @param members
   */
  private adjustZoomForRoute(members: any): void {
    let latlngs: L.LatLng[] = [];
    for (let member of members) {
      latlngs.push(L.latLng(member.lat, member.lon));
    }
    this.map.fitBounds(L.latLngBounds(latlngs));
  }

  /***
   * Checks member count, for avoiding single member routes
   * @param members
   * @returns {any}
   */
  public static checkMemberCount(members: any): any {
    return members.length !== 1;
  }

  /***
   * Handles highlighting of first route on starting of Step
   * @param connectObj
   */
  public highlightFirstRoute(connectObj: any): void {
    let members  = this.routesMap.get(this.routesMap.keys().next().value);
    let countObj = RouteWizardService.countNodeType(members);
    this.useAndSetAvailableConnectivity(countObj);
    this.highlightRoute(members, true);
  }

  /***
   * Returns member counts (stops, platforms)
   * @param members
   * @returns {any}
   */
  public static countNodeType(members: any): any {
    let stopsCount     = 0;
    let platformsCount = 0;
    for (let member of members) {
      if (member.tags.public_transport === 'stop_position') {
        stopsCount++;
      }
      if (member.tags.public_transport === 'platform') {
        platformsCount++;
      }
    }
    return { stopsCount, platformsCount };
  }

  /***
   * Sets available connectivity, uses stop connectivity by default,
   * uses platforms if not available
   * @param countObj
   * @param connectivityObj
   * @returns {any}
   */
  public useAndSetAvailableConnectivity(countObj: any): any {
    let connectObj = this.resetAvailableConnectivity(countObj);
    if (connectObj.canStopsConnect) {
      this.setHighlightType('Stops', connectObj);
    } else if (connectObj.canPlatformsConnect) {
      this.setHighlightType('Platforms', connectObj);
    }
  }

  /***
   * Resets available connectivity
   * @param countObj
   * @returns {any}
   */
  private resetAvailableConnectivity(countObj: any): any {
    let canStopsConnect;
    let canPlatformsConnect;

    countObj.stopsCount > 1 ? canStopsConnect = true : canStopsConnect = false;
    countObj.platformsCount > 1 ? canPlatformsConnect = true : canPlatformsConnect = false;

    this.refreshAvailableConnectivity.emit({ canStopsConnect , canPlatformsConnect });
    return { canStopsConnect , canPlatformsConnect };
  }

  /***
   * Filters out empty tags before saving route
   * @param route
   * @returns {any}
   */
  public static filterEmptyTags(route: any): any {
    let tags = route.tags;
    for (let property in tags) {
      if (tags.hasOwnProperty(property)) {
        if (tags[property] === '') {
          delete tags[property];
        }
      }
    }
    return tags;
  }

  /***
   * Highlights members of route with circle
   * @param {any[]} members
   * @returns {void}
   */
  public highlightMembers(members: any[]): void {
    for (let member of members) {
      const latlng = { lat: member.lat, lng: member.lon };
      let circle   = L.circleMarker(latlng, {
        radius : 15,
        color  : '#00ffff',
        opacity: 0.75,
      });
      this.membersHighlightLayerGroup.addLayer(circle);
      this.membersHighlightLayerGroup.addTo(this.map);
    }
  }

  /***
   * Clears member's highlight
   * @returns {any}
   */
  public clearMembersHighlight(): void {
    this.membersHighlightLayerGroup.clearLayers();
  }

  /***
   * Forms object for new route's members
   * @param toAddNodes
   * @returns {any}
   */
  public static formRelMembers(toAddNodes: any): any {
    let relMembers = [];
    for (let node of toAddNodes) {
      relMembers.push({
        type: 'node',
        ref : node.id,
        role: node.role,
      });
    }
    return relMembers;
  }

  /***
   * Fired when tags are modified
   * @param {string} action
   * @param key
   * @param event
   * @param newRoute
   * @returns {any}
   */
  public static modifiesTags(action: string, key: any, event: any, newRoute: any): any {
    switch (action) {
      case 'change tag':
        newRoute.tags[key] = event.target.value;
        break;
      case 'remove tag':
        delete newRoute.tags[key];
        break;
      case 'add tag':
        newRoute.tags[key] = event;
        break;
    }
    newRoute.tags = { ...newRoute.tags };
    return newRoute;
  }

  /***
   * Styles show connectivity buttons
   * @param {string} type
   * @returns {any}
   */
  private static styleButtons(type: string): any {
    switch (type) {
      case 'Stops':
        document.getElementById(type).style.backgroundColor        = 'cornflowerblue';
        document.getElementById('Platforms').style.backgroundColor = 'white';
        break;
      case 'Platforms':
        document.getElementById(type).style.backgroundColor    = 'cornflowerblue';
        document.getElementById('Stops').style.backgroundColor = 'white';
        break;
    }
  }

  /***
   * Filters routes with one member
   * @param routesMap
   */
  public filterRoutesMap(routesMap: any): void {
    routesMap.forEach((value, key) => {
      if (RouteWizardService.checkMemberCount(value)) {
        this.routesMap.set(key, value);
      }
    });
  }

  /***
   * View suggested route
   * @param ref
   * @param connectObj
   * @returns {void}
   */
  public viewSuggestedRoute(ref: any, connectObj: any): void {
    let members = this.routesMap.get(ref);
    let countObj = RouteWizardService.countNodeType(members);
    this.useAndSetAvailableConnectivity(countObj);
    this.highlightRoute(members, true);
  }

  /***
   * Removes member from route
   * @param {string} toRemoveMemberID
   * @param addedNewRouteMembers
   * @returns {any}
   */
  public removeMember(toRemoveMemberID: string, addedNewRouteMembers: any): any {
    let members = [];
    let index;
    for (let member of addedNewRouteMembers) {
      if (member.id === toRemoveMemberID) {
        members.push(member);
        index = addedNewRouteMembers.indexOf(member);
      }
    }

    if (index > -1) {
      addedNewRouteMembers.splice(index, 1);
    }
    let countObj = RouteWizardService.countNodeType(addedNewRouteMembers);
    this.resetAvailableConnectivity(countObj);
    addedNewRouteMembers = [...addedNewRouteMembers];
    this.mapSrv.clearHighlight(this.map);
    this.clearMembersHighlight();
    this.highlightRoute(addedNewRouteMembers, false);
    this.highlightMembers(addedNewRouteMembers);
    return addedNewRouteMembers;
  }

  /***
   * Adds new member to route
   * @param newMember
   * @param addedNewRouteMembers
   * @returns {any}
   */
  public addNewMemberToRoute(newMember: any, addedNewRouteMembers: any): any {
    let members = [];
    members.push(newMember);
    addedNewRouteMembers = addedNewRouteMembers.concat(members);
    let countObj = RouteWizardService.countNodeType(addedNewRouteMembers);
    this.resetAvailableConnectivity(countObj);
    this.mapSrv.clearHighlight(this.map);
    this.clearMembersHighlight();
    this.highlightRoute(addedNewRouteMembers, false);
    this.highlightMembers(addedNewRouteMembers);
    addedNewRouteMembers = [...addedNewRouteMembers];
    return addedNewRouteMembers;
  }

  /***
   * Sets highlight type for highlighting route on map
   * @param {string} type
   * @param connectivityObj
   * @returns {boolean}
   */
  public setHighlightType(type: string, connectivityObj: any): boolean {
    switch (type) {
      case 'Stops':
        if (connectivityObj.canStopsConnect) {
          this.mapSrv.highlightType = 'Stops';
          return true;
        }
        break;
      case 'Platforms':
        if (connectivityObj.canPlatformsConnect) {
          this.mapSrv.highlightType = 'Platforms';
          return true;
        }
        break;
      default:
        return false;
    }
  }

  /***
   * Changes connectivity of route on map
   * @param {string} type
   * @param connectivityObj
   * @param addedNewRouteMembers
   * @returns {void}
   */
  public showConnectivity(type: string, connectivityObj: any, addedNewRouteMembers: any): void {
    this.mapSrv.clearHighlight(this.map);
    let countObj = RouteWizardService.countNodeType(addedNewRouteMembers);
    this.resetAvailableConnectivity(countObj);
    this.setHighlightType(type, connectivityObj);
    this.highlightRoute(addedNewRouteMembers, true);
    RouteWizardService.styleButtons(type);
  }

  /***
   * Fetches ref of relations already downloaded
   * @returns {any}
   */
  public getFromAlreadyDownloadedRoutes(): any {
    let refsOfRoutes = [];
    this.modalMapElementsMap.forEach((element) => {
      if (element.type === 'relation' && element.tags.public_transport !== 'stop_area' && element.tags.ref) {
        for (let member of element.members) {
          let stopsInBoundsIDs = this.findStopsInBounds(this.map);
          if (stopsInBoundsIDs.includes(member.id)) {
            refsOfRoutes.push(element.tags.ref);
          }
        }
      }
    });
    return refsOfRoutes;
  }

  ngOnDestroy(): any {

  }
}
