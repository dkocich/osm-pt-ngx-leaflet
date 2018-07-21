import { EventEmitter, Injectable } from '@angular/core';
import { MapService } from './map.service';

import { StorageService } from './storage.service';
import { BsModalService } from 'ngx-bootstrap';
import { ProcessService } from './process.service';
import * as L from 'leaflet';

@Injectable()
export class ModalMapService {
  public map;
  public routes = [];
  public ptLayerModal;
  public osmtogeojson: any = require('osmtogeojson');
  public modalMapElementsMap = new Map();
  public savedContinousQueryResponses = [];
  public autoRouteMapNodeClick: EventEmitter<number> = new EventEmitter();
  public routesRecieved: EventEmitter<any> =  new EventEmitter();
  public savedMultipleNodeDataResponses = [];
  public elementsRenderedModalMap = new Set();
  public routesMap: Map<string, any[]> = new Map();
  public membersHighlightLayerGroup    = L.layerGroup();
  public refreshAvailableConnectivity: EventEmitter<any> =  new EventEmitter();

  constructor(private storageSrv: StorageService,
              private mapSrv: MapService,
              private modalService: BsModalService,
              private processSrv: ProcessService) {
    this.modalService.onShown.subscribe(() => {
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

  public onShownModal(): any {
    this.map.invalidateSize();
  }

  public renderAlreadyDownloadedData(): any {
    let obj: any = {};
    let elements = [];
    this.storageSrv.elementsMap.forEach((element) => {
      elements.push(element);
    });
    obj.elements = elements;
    let transformed = this.osmtogeojson(obj);
    this.renderTransformedGeojsonDataForRouteWizard(transformed, this.map);
  }

  public processAllDownloadedOnMainMap(): any {
    for (let res of this.savedContinousQueryResponses) {
      this.processSrv.processResponse(res);
    }
  }

  public renderTransformedGeojsonDataForRouteWizard(transformedGeojson: any, map: L.Map): void {
    this.ptLayerModal = L.geoJSON(transformedGeojson, {
      filter: (feature) => {
        if (this.elementsRenderedModalMap.has(feature.id)) {
          return false;
        } else {
          return true;
        }
      },
      onEachFeature: (feature, layer) => {
        this.elementsRenderedModalMap.add(feature.id);
        this.enableDragForRouteWizard(feature, layer);
      },
      pointToLayer: (feature, latlng) => {
        return this.mapSrv.stylePoint(feature, latlng);
      },
    });
    console.log('LOG (map s.) Adding PTlayer to modal map again', this.ptLayerModal);
    this.ptLayerModal.addTo(map);
  }

  public enableDragForRouteWizard(feature: any, layer: any): any {
    layer.on('click', (e) => {
      this.handleAutoRouteModalMarkerClick(feature);
    });
  }

  private handleAutoRouteModalMarkerClick(feature: any): any {
    const featureId: number = this.mapSrv.getFeatureIdFromMarker(feature);
    this.autoRouteMapNodeClick.emit(featureId);
  }
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
   * forms an array of route refs from nodes, also removes duplicates
   * @param stopsInBounds
   * @returns {any}
   */
  public getRouteRefsFromNodes(stopsInBoundsIDs: any): any {
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
      ref_map = ModalMapService.getIndividualRouteRefs(withRouteRefTag);
      Array.from(ref_map).map(([key]) => {
        refValues.push(key);
      });
    }
    return refValues;
  }

  public processMultipleNodeDataResponse(response: any): any {
    let stopsInBounds       = this.findStopsInBounds(this.map);
    let nodeRefs            = this.getRouteRefsFromNodes(stopsInBounds);
    let refsOfRoutes: any[] = [];
    for (const element of response.elements) {
      if (!this.modalMapElementsMap.has(element.id)) {
        this.modalMapElementsMap.set(element.id, element);
      }
      if (element.type === 'relation' && element.tags.public_transport !== 'stop_area' && element.tags.ref) {
        refsOfRoutes.push(element.tags.ref);
      }
    }
    let uniqueRefsOfRoutes = ModalMapService.removeDuplicatesFromArray(refsOfRoutes);
    let notAddedRefs       = ModalMapService.compareArrays(nodeRefs, uniqueRefsOfRoutes);
    notAddedRefs           = this.filterPreviouslyAddedRefs(notAddedRefs);

    if (notAddedRefs.length !== 0) {
      this.routesRecieved.emit(this.getStopsForNewRoutes(notAddedRefs));
    } else {
      this.routesRecieved.emit(null);
    }
  }

  private filterPreviouslyAddedRefs(refs: any[]): any {
    let index;
    this.modalMapElementsMap.forEach((element) =>{
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

  private getStopsForNewRoutes(notAddedRefs: any): any {
    let stopsForNewRoutes = new Map();
    this.modalMapElementsMap.forEach((stop) => {
      if (stop.type === 'node' && (stop.tags.bus === 'yes' || stop.tags.public_transport) && stop.tags.route_ref) {
        let stops: any[] = [];
        stops.push(stop);
        let refMap = ModalMapService.getIndividualRouteRefs(stops);
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

  private static removeDuplicatesFromArray(arr: any[]): any {
    return arr.filter((value, index, self) => {
      return self.indexOf(value) === index;
    });
  }

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
// to go back , just check which function was a part of component and revert var too
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

  // public findMissingRoutes(): any {
  //   if (this.mapSrv.map.getZoom() > 8) {
  //     this.overpassSrv.requestNewOverpassDataForModalMap(true);
  //   } else {
  //     alert('Not sufficient zoom level');
  //   }
  // }

  public highlightRoute(members: any): void {
    this.mapSrv.clearHighlight(this.map);
    let routeMembers = members;
    this.assignRolesToMembers(routeMembers);
    let rel                           = {
      members: routeMembers,
      tags   : { name: 'nil' },
    };
    this.storageSrv.stopsForRoute     = [];
    this.storageSrv.platformsForRoute = [];
    this.mapSrv.showRoute(rel, this.map, this.modalMapElementsMap);
    this.adjustZoomForRoute(routeMembers);
  }

  public assignRolesToMembers(members: any): any{
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

  private adjustZoomForRoute(members: any): any {
    let latlngs: L.LatLng[] = [];
    for (let member of members) {
      latlngs.push(L.latLng(member.lat, member.lon));
    }
    this.map.fitBounds(L.latLngBounds(latlngs));
  }

  public checkMemberCount(members: any): any {
    return members.length !== 1;
  }

  public highlightFirstRoute(canStopsConnect: any, canPlatformsConnect: any): any {
    let members  = this.routesMap.get(this.routesMap.keys().next().value);
    let countObj = this.countNodeType(members);
    this.useAndSetAvailableConnectivity(countObj.stopsCount, countObj.platformsCount, canStopsConnect, canPlatformsConnect);
    this.highlightRoute(members);
  }

  public countNodeType(members: any): any {
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

  public useAndSetAvailableConnectivity(stopsCount: number, platformsCount: number, canStopsConnect: any, canPlatformsConnect: any): any {
    let connectObj = this.resetAvailableConnectivity(stopsCount, platformsCount);
    if (connectObj.canStopsConnect) {
      this.setHighlightType('Stops', canStopsConnect, canPlatformsConnect);
    } else if (connectObj.canPlatformsConnect) {
      this.setHighlightType('Platforms', canStopsConnect, canPlatformsConnect);
    }
  }
  private resetAvailableConnectivity(stopsCount: number, platformsCount: number): any {
    let canStopsConnect;
    let canPlatformsConnect;
    if (stopsCount > 1) {
     canStopsConnect = true;
    } else {
      canStopsConnect = false;
    }
    if (platformsCount > 1) {
      canPlatformsConnect = true;
    } else {
      canPlatformsConnect = false;
    }
    this.refreshAvailableConnectivity.emit({ canStopsConnect , canPlatformsConnect });
    return { canStopsConnect , canPlatformsConnect };
  }

  public filterEmptyTags(route: any): any {
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

  public highlightMembers(members: any[]): any {
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

  public clearMembersHighlight(): any {
    this.membersHighlightLayerGroup.clearLayers();
  }

  public formRelMembers(toAddNodes: any): any {
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

  public createChangeTag(action: string, key: any, event: any, newRoute: any): any {
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

  private styleButtons(type: string): any {
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

  public filterRoutesMap(routesMap: any): any {
    routesMap.forEach((value, key) => {
      if (this.checkMemberCount(value)) {
        this.routesMap.set(key, value);
      }
    });
  }

  public viewSuggestedRoute(ref: any, canStopsConnect: any, canPlatformsConnect: any): any {
    let members = this.routesMap.get(ref);
    let countObj = this.countNodeType(members);
    this.useAndSetAvailableConnectivity(countObj.stopsCount, countObj.platformsCount, canStopsConnect, canPlatformsConnect);
    this.highlightRoute(members);
  }

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
    let countObj = this.countNodeType(addedNewRouteMembers);
    this.resetAvailableConnectivity(countObj.stopsCount, countObj.platformsCount);
    addedNewRouteMembers = [...addedNewRouteMembers];
    this.mapSrv.clearHighlight(this.map);
    this.clearMembersHighlight();
    this.highlightRoute(addedNewRouteMembers);
    this.highlightMembers(addedNewRouteMembers);
    return addedNewRouteMembers;
  }

  public addNewMemberToRoute(newMember: any, addedNewRouteMembers: any): any {
    let members = [];
    members.push(newMember);
    addedNewRouteMembers = addedNewRouteMembers.concat(members);
    let countObj = this.countNodeType(addedNewRouteMembers);
    this.resetAvailableConnectivity(countObj.stopsCount, countObj.platformsCount);
    this.mapSrv.clearHighlight(this.map);
    this.clearMembersHighlight();
    this.highlightRoute(addedNewRouteMembers);
    this.highlightMembers(addedNewRouteMembers);
    addedNewRouteMembers = [...addedNewRouteMembers];
    return addedNewRouteMembers;
  }

  public setHighlightType(type: string, canStopsConnect: any, canPlatformsConnect: any): boolean {
  switch (type) {
  case 'Stops':
    if (canStopsConnect) {
      this.mapSrv.highlightType = 'Stops';
      return true;
    }
    break;
  case 'Platforms':
    if (canPlatformsConnect) {
      this.mapSrv.highlightType = 'Platforms';
      return true;
    }
    break;
  default:
    return false;
  }
}

  public showConnectivity(type: string, canStopsConnect: any, canPlatFormsConnect: any, addedNewRouteMembers: any): any {
    this.mapSrv.clearHighlight(this.map);
    let countObj = this.countNodeType(addedNewRouteMembers);
    this.resetAvailableConnectivity(countObj.stopsCount, countObj.platformsCount);
    this.setHighlightType(type, canStopsConnect, canPlatFormsConnect);
    this.highlightRoute(addedNewRouteMembers);
    this.styleButtons(type);
  }
}
