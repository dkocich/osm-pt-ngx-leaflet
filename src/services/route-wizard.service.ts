import { EventEmitter, Injectable } from '@angular/core';
import * as L from 'leaflet';
import { BsModalRef, BsModalService } from 'ngx-bootstrap';
import { MapService } from './map.service';
import { ProcessService } from './process.service';
import { StorageService } from './storage.service';

@Injectable()
export class RouteWizardService {
  map;
  routes = [];
  ptLayerModal;
  osmtogeojson: any = require('osmtogeojson');
  modalMapElementsMap = new Map();

  autoRouteMapNodeClick: EventEmitter<number> = new EventEmitter();
  routesReceived: EventEmitter<any> =  new EventEmitter();
  refreshAvailableConnectivity: EventEmitter<any> =  new EventEmitter();

  savedMultipleNodeDataResponses = [];
  savedContinuousQueryResponses = [];

  elementsRenderedModalMap = new Set();
  nodesFullyDownloaded = new Set();

  routesMap: Map<string, any[]> = new Map();
  membersHighlightLayerGroup    = L.layerGroup();

  modalRefRouteWiz: BsModalRef;
  constructor(private storageSrv: StorageService,
              private mapSrv: MapService,
              private modalService: BsModalService,
              private processSrv: ProcessService,
              ) {
    this.modalService.onShown.subscribe((data) => {
      this.onShownModal();
    });
    this.modalService.onHidden.subscribe(() => {
      this.processAllDownloadedOnMainMap();
      this.storageSrv.currentElement = null;
      this.storageSrv.currentElementsChange.emit(
        JSON.parse(JSON.stringify(null)),
      );
      this.storageSrv.stopsForRoute     = [];
      this.storageSrv.platformsForRoute = [];
      this.mapSrv.highlightType         = 'Stops';
    });
  }

  /**
   * Fired when modal has rendered
   */
  onShownModal(): void {
    if (this.map) {
      this.map.invalidateSize();
    }
  }

  /**
   * Renders data on modal map which was already present on the main map
   */
  renderAlreadyDownloadedData(): void {
    const obj: any = {};
    const elements = [];
    this.storageSrv.elementsMap.forEach((element) => {
      elements.push(element);
    });
    obj.elements = elements;
    const transformed = this.osmtogeojson(obj);
    this.renderTransformedGeojsonDataForRouteWizard(transformed, this.map);
  }

  /**
   * Used when modal is closed,
   * all data downloaded for modal map is processed for main application
   */
  processAllDownloadedOnMainMap(): void {
    for (const res of this.savedContinuousQueryResponses) {
      this.processSrv.processResponse(res);
    }
    for (const res of this.savedMultipleNodeDataResponses) {
      this.processSrv.processNodeResponse(res);
    }
  }

  /**
   * Renders data on modal map
   */
  renderTransformedGeojsonDataForRouteWizard(transformedGeoJSON: any, map: L.Map): void {
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

  /**
   * Enables click of nodes for modal map
   */
  enableClickForRouteWizardMap(feature: any, layer: any): void {
    layer.on('click', () => {
      this.handleRouteWizardMarkerClick(feature);
    });
  }

  /**
   * Handles map click
   */
  private handleRouteWizardMarkerClick(feature: any): void {
    const featureId: number = this.mapSrv.getFeatureIdFromMarker(feature);
    this.autoRouteMapNodeClick.emit(featureId);
  }

  /**
   * Forms an array of route refs from nodes, also removes duplicates
   */
  getRouteRefsFromNodes(stopsInBoundsIDs: any): any[] {
    const withRouteRefTag = [];
    let ref_map;
    const refValues       = [];
    for (const id of stopsInBoundsIDs) {
      const stop = this.modalMapElementsMap.get(id);
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

  /**
   * Processes multiple node data
   */
  findMissingRoutes(downloadedResponse: any): void {
    const stopsInBounds       = this.mapSrv.findStopsInBounds(this.map, this.modalMapElementsMap);
    const nodeRefs            = this.getRouteRefsFromNodes(stopsInBounds);
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
    const refs = this.getFromAlreadyDownloadedRoutes();
    refsOfRoutes = refsOfRoutes.concat(refs);
    const uniqueRefsOfRoutes = RouteWizardService.removeDuplicatesFromArray(refsOfRoutes);
    let notAddedRefs       = RouteWizardService.compareArrays(nodeRefs, uniqueRefsOfRoutes);
    notAddedRefs           = this.filterPreviouslyAddedRefs(notAddedRefs);

    if (notAddedRefs.length !== 0) {
      this.routesReceived.emit(this.getStopsForNewRoutes(notAddedRefs));
    } else {
      this.routesReceived.emit(null);
    }
  }

  /**
   * Filters newly added ref from suggested refs
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

  /**
   * Returns stops for given refs
   */
  private getStopsForNewRoutes(notAddedRefs: any): any {
    const stopsForNewRoutes = new Map();
    this.modalMapElementsMap.forEach((stop) => {
      if (stop.type === 'node' && (stop.tags.bus === 'yes' || stop.tags.public_transport) && stop.tags.route_ref) {
        const stops: any[] = [];
        stops.push(stop);
        const refMap = RouteWizardService.getIndividualRouteRefs(stops);
        const individualRefs = [];
        Array.from(refMap).map(([key]) => { individualRefs.push(key); });
        individualRefs.forEach((val) =>  {
          if (notAddedRefs.includes(val)) {
            if (stopsForNewRoutes.get(val)) {
              stopsForNewRoutes.get(val).push(stop);
            } else {
              const arr = [];
              arr.push(stop);
              stopsForNewRoutes.set(val, arr);
            }
          }
        });
      }
    });
    return stopsForNewRoutes;
  }

  /**
   * Removes duplicates from array
   */
  private static removeDuplicatesFromArray(arr: any[]): any {
    return arr.filter((value, index, self) => {
      return self.indexOf(value) === index;
    });
  }

  /**
   * Compares arrays and returns refs not added in route refs
   */
  private static compareArrays(nodeRefs: any, routeRefs: any): any {
    const notAdded = [];
    for (const itemA of nodeRefs) {
      let flag = false;
      for (const itemB of routeRefs) {
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

  /**
   * Get individual refs from stops's route_ref
   */
  static getIndividualRouteRefs(stops: any[]): any {
    const refs = [];
    for (const stop of stops) {
      refs.push(stop.tags.route_ref);
    }
    const ref_map = new Map();
    for (const routeRefs of refs) {
      const singleRefs = routeRefs.split(';');
      for (const ref of singleRefs) {
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

  /**
   * Highlights route's members on map
   */
  highlightRoute(members: any, adjustZoom: boolean): void {
    this.mapSrv.clearHighlight(this.map);
    const routeMembers = members;
    RouteWizardService.assignRolesToMembers(routeMembers);
    const rel                           = {
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

  /**
   * Assign roles to members for new route
   */
  static assignRolesToMembers(members: any): any {
    let probableRole = '';
    for (const member of members) {
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

  /**
   * Adjust zoom to fit all members of route on map
   */
  private adjustZoomForRoute(members: any): void {
    const latlngs: L.LatLng[] = [];
    for (const member of members) {
      latlngs.push(L.latLng(member.lat, member.lon));
    }
    this.map.fitBounds(L.latLngBounds(latlngs));
  }

  /**
   * Checks member count, for avoiding single member routes
   */
  static checkMemberCount(members: any): any {
    return members.length !== 1;
  }

  /**
   * Handles highlighting of first route on starting of Step
   */
  highlightFirstRoute(connectObj: any): void {
    const members  = this.routesMap.get(this.routesMap.keys().next().value);
    const countObj = RouteWizardService.countNodeType(members);
    this.useAndSetAvailableConnectivity(countObj);
    this.highlightRoute(members, true);
  }

  /**
   * Returns member counts (stops, platforms)
   */
  static countNodeType(members: any): any {
    let stopsCount     = 0;
    let platformsCount = 0;
    for (const member of members) {
      if (member.tags.public_transport === 'stop_position') {
        stopsCount++;
      }
      if (member.tags.public_transport === 'platform') {
        platformsCount++;
      }
    }
    return { stopsCount, platformsCount };
  }

  /**
   * Sets available connectivity, uses stop connectivity by default,
   * uses platforms if not available
   */
  useAndSetAvailableConnectivity(countObj: any): any {
    const connectObj = this.resetAvailableConnectivity(countObj);
    if (connectObj.canStopsConnect) {
      this.setHighlightType('Stops', connectObj);
    } else if (connectObj.canPlatformsConnect) {
      this.setHighlightType('Platforms', connectObj);
    }
  }

  /**
   * Resets available connectivity
   */
  private resetAvailableConnectivity(countObj: any): any {
    let canStopsConnect;
    let canPlatformsConnect;

    countObj.stopsCount > 1 ? canStopsConnect = true : canStopsConnect = false;
    countObj.platformsCount > 1 ? canPlatformsConnect = true : canPlatformsConnect = false;

    this.refreshAvailableConnectivity.emit({ canStopsConnect , canPlatformsConnect });
    return { canStopsConnect , canPlatformsConnect };
  }

  /**
   * Filters out empty tags before saving route
   */
  static filterEmptyTags(route: any): any {
    const tags = route.tags;
    for (const property in tags) {
      if (tags.hasOwnProperty(property)) {
        if (tags[property] === '') {
          delete tags[property];
        }
      }
    }
    return tags;
  }

  /**
   * Highlights members of route with circle
   */
  highlightMembers(members: any[]): void {
    for (const member of members) {
      const latlng = { lat: member.lat, lng: member.lon };
      const circle   = L.circleMarker(latlng, {
        radius : 15,
        color  : '#00ffff',
        opacity: 0.75,
      });
      this.membersHighlightLayerGroup.addLayer(circle);
      this.membersHighlightLayerGroup.addTo(this.map);
    }
  }

  /**
   * Clears member's highlight
   */
  clearMembersHighlight(): void {
    this.membersHighlightLayerGroup.clearLayers();
  }

  /**
   * Forms object for new route's members
   */
  static formRelMembers(toAddNodes: any): any {
    const relMembers = [];
    for (const node of toAddNodes) {
      relMembers.push({
        type: 'node',
        ref : node.id,
        role: node.role,
      });
    }
    return relMembers;
  }

  /**
   * Fired when tags are modified
   */
  static modifiesTags(action: string, key: any, event: any, newRoute: any): any {
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

  /**
   * Styles show connectivity buttons
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

  /**
   * Filters routes with one member
   */
  filterRoutesMap(routesMap: any): void {
    routesMap.forEach((value, key) => {
      if (RouteWizardService.checkMemberCount(value)) {
        this.routesMap.set(key, value);
      }
    });
  }

  /**
   * View suggested route
   */
  viewSuggestedRoute(ref: any, connectObj: any): void {
    const members = this.routesMap.get(ref);
    const countObj = RouteWizardService.countNodeType(members);
    this.useAndSetAvailableConnectivity(countObj);
    this.highlightRoute(members, true);
  }

  /**
   * Removes member from route
   */
  removeMember(toRemoveMemberID: string, addedNewRouteMembers: any): any {
    const members = [];
    let index;
    for (const member of addedNewRouteMembers) {
      if (member.id === toRemoveMemberID) {
        members.push(member);
        index = addedNewRouteMembers.indexOf(member);
      }
    }

    if (index > -1) {
      addedNewRouteMembers.splice(index, 1);
    }
    const countObj = RouteWizardService.countNodeType(addedNewRouteMembers);
    this.resetAvailableConnectivity(countObj);
    addedNewRouteMembers = [...addedNewRouteMembers];
    this.mapSrv.clearHighlight(this.map);
    this.clearMembersHighlight();
    this.highlightRoute(addedNewRouteMembers, false);
    this.highlightMembers(addedNewRouteMembers);
    return addedNewRouteMembers;
  }

  /**
   * Adds new member to route
   */
  addNewMemberToRoute(newMember: any, addedNewRouteMembers: any): any {
    const members = [];
    members.push(newMember);
    addedNewRouteMembers = addedNewRouteMembers.concat(members);
    const countObj = RouteWizardService.countNodeType(addedNewRouteMembers);
    this.resetAvailableConnectivity(countObj);
    this.mapSrv.clearHighlight(this.map);
    this.clearMembersHighlight();
    this.highlightRoute(addedNewRouteMembers, false);
    this.highlightMembers(addedNewRouteMembers);
    addedNewRouteMembers = [...addedNewRouteMembers];
    return addedNewRouteMembers;
  }

  /**
   * Sets highlight type for highlighting route on map
   */
  setHighlightType(type: string, connectivityObj: any): boolean {
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

  /**
   * Changes connectivity of route on map
   */
  showConnectivity(type: string, connectivityObj: any, addedNewRouteMembers: any): void {
    this.mapSrv.clearHighlight(this.map);
    const countObj = RouteWizardService.countNodeType(addedNewRouteMembers);
    this.resetAvailableConnectivity(countObj);
    this.setHighlightType(type, connectivityObj);
    this.highlightRoute(addedNewRouteMembers, true);
    RouteWizardService.styleButtons(type);
  }

  /**
   * Fetches ref of relations already downloaded
   */
  getFromAlreadyDownloadedRoutes(): any {
    const refsOfRoutes = [];
    this.modalMapElementsMap.forEach((element) => {
      if (element.type === 'relation' && element.tags.public_transport !== 'stop_area' && element.tags.ref) {
        for (const member of element.members) {
          const stopsInBoundsIDs = this.mapSrv.findStopsInBounds(this.map, this.modalMapElementsMap);
          if (stopsInBoundsIDs.includes(member.id)) {
            refsOfRoutes.push(element.tags.ref);
          }
        }
      }
    });
    return refsOfRoutes;
  }
}
