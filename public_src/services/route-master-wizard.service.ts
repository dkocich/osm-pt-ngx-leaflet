import { EventEmitter, Injectable } from '@angular/core';

import { MapService } from './map.service';
import { StorageService } from './storage.service';
import { BsModalService } from 'ngx-bootstrap';
import { ProcessService } from './process.service';

import * as L from 'leaflet';
import { IPtRelation } from '../core/ptRelation.interface';

// import {RouteWizardService} from './route-wizard.service';

@Injectable()
export class RouteMasterWizardService {
  public map;
  public routes              = [];
  public ptLayerModal;
  public osmtogeojson: any   = require('osmtogeojson');
  public modalMapElementsMap = new Map();

  public autoRouteMapNodeClick: EventEmitter<number>                    = new EventEmitter();
  public newRoutesMapReceived: EventEmitter<Map<string, IPtRelation[]>> = new EventEmitter();

  public savedMultipleNodeDataResponses = [];
  public savedContinuousQueryResponses  = [];

  public elementsRenderedModalMap = new Set();
  public nodesFullyDownloaded     = new Set();

  public routesMap: Map<string, any[]>                   = new Map();
  public membersHighlightLayerGroup                      = L.layerGroup();
  public refreshAvailableConnectivity: EventEmitter<any> = new EventEmitter();

  // all routes which have at least one member in bounds
  // map - key id, value percent coverage
  public relsMap = new Map();

  // key = ref, value array of routes which have those refs
  public newRMsMap = new Map();

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

  /***
   * Fired when modal has rendered
   * @returns {void}
   */
  public onShownModal(): void {
    if (this.map) {
      this.map.invalidateSize();
    }
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
    obj.elements    = elements;
    let transformed = this.osmtogeojson(obj);
    this.renderTransformedGeojsonDataRouteMasterWizard(transformed, this.map);
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
  public renderTransformedGeojsonDataRouteMasterWizard(transformedGeoJSON: any, map: L.Map): void {
    this.ptLayerModal = L.geoJSON(transformedGeoJSON, {
      filter       : (feature) => {
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
        this.enableClickForRouteMasterWizardMap(feature, layer);
      },
      pointToLayer : (feature, latlng) => {
        return this.mapSrv.stylePoint(feature, latlng);
      },
    });
    console.log('LOG (route master wizard s.) Adding PT layer to modal map again', this.ptLayerModal);
    this.ptLayerModal.addTo(map);
  }

  /***
   * Renders data on modal map
   * @param transformedGeoJSON
   * @param {Map} map
   */
  // public renderTransformedGeojsonData(transformedGeoJSON: any, map: L.Map): void {
  //   this.ptLayerModal = L.geoJSON(transformedGeoJSON, {
  //     filter       : (feature) => {
  //       if (!this.elementsRenderedModalMap.has(feature.id) &&
  //         'public_transport' in feature.properties && feature.id[0] === 'n'
  //       ) {
  //         return true;
  //       } else {
  //         return false;
  //       }
  //     },
  //     onEachFeature: (feature, layer) => {
  //       this.elementsRenderedModalMap.add(feature.id);
  //       this.enableClickForRouteMasterWizardMap(feature, layer);
  //     },
  //     pointToLayer : (feature, latlng) => {
  //       return this.mapSrv.stylePoint(feature, latlng);
  //     },
  //   });
  //
  //   console.log('LOG (map s.) Adding PTlayer to modal map again', this.ptLayerModal);
  //   this.ptLayerModal.addTo(map);
  // }

  /***
   * Enables click of nodes for modal map
   * @param feature
   * @param layer
   * @returns {void}
   */
  public enableClickForRouteMasterWizardMap(feature: any, layer: any): void {
    layer.on('click', () => {
      this.handleRouteMasterWizardMarkerClick(feature);
    });
  }

  /***
   * Handles map click
   * @param feature
   * @returns {void}
   */
  private handleRouteMasterWizardMarkerClick(feature: any): void {
    const featureId: number = this.mapSrv.getFeatureIdFromMarker(feature);
    this.autoRouteMapNodeClick.emit(featureId);
  }

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

  public findToBeComparedRels(response: any): any {
    let newDownloadedRoutes = [];
    let oldDownloadedRoutes = [];
    if (response) {
      for (let element of response['elements']) {
        if ((element.type === 'relation')
          && !(element.tags.public_transport === 'stop_area'
            && element.tags.public_transport === 'ref')
          && (element.members)) {
          newDownloadedRoutes.push(element);
        }
      }
    }

    // console.log('modal map',this.modalMapElementsMap );
    this.modalMapElementsMap.forEach((element) => {
      if ((element.type === 'relation')
        && !(element.tags.public_transport === 'stop_area')
        && element.tags.ref
        && (element.members)
        && this.checkMembersInBounds(element)) {
        oldDownloadedRoutes.push(element);
      }
    });
    console.log('new relations', newDownloadedRoutes, 'old', oldDownloadedRoutes);

    let rels      = newDownloadedRoutes.concat(oldDownloadedRoutes);
    let relsMap   = new Map();
    let refOfRels = [];
    rels.forEach((rel) => {
      let noOfMembers = rel['members'].length;
      let fullyDownloaded    = 0;
      for (let member of rel['members']) {
        let memberEle = this.modalMapElementsMap.get(member.ref);
        if (this.modalMapElementsMap.has(member.ref) && memberEle.type === 'node') {
          let element = this.modalMapElementsMap.get(member.ref);
          refOfRels.push(rel.tags.ref);
          // let latlng = { lat: element.lat, lng: element.lon };
          // console.log('ltlng', latlng);
          // if (this.map.getBounds().contains(latlng)) {
          //   inBounds++;
          // }
          if (this.nodesFullyDownloaded.has(element.id)) {
            fullyDownloaded ++ ;
          }
        }
      }
      let percentCoverage = (fullyDownloaded / noOfMembers) * 100;
      relsMap.set(rel.id, percentCoverage);
    });
    console.log('ref s of routes red', refOfRels);
    this.relsMap = relsMap;
    return relsMap;

  }

  public checkMembersInBounds(relation: any): boolean {
    let flag = false;
    relation['members'].forEach((member) => {
      if (this.modalMapElementsMap.has(member.ref) && this.modalMapElementsMap.get(member.ref).type === 'node') {
        let element = this.modalMapElementsMap.get(member.ref);
        let latlng  = { lat: element.lat, lng: element.lon };
        if (this.map.getBounds().contains(latlng)) {
          flag = true;
        }
      }
    });
    return flag;
  }

  public findMissingRouteMasters(res: any): any {
    this.newRMsMap = new Map();
    let RMRefs: string[]    = [];

    for (let element of res['elements']) {
      if (!this.modalMapElementsMap.has(element.id)) {
        this.modalMapElementsMap.set(element.id, element);
      }
    }
    this.modalMapElementsMap.forEach((element) => {
      if (element.tags.type === 'route_master' && element.tags.ref) {
        RMRefs.push(element.tags.ref);
      }
    });

    console.log('Refs of route masters', RMRefs);

    this.relsMap.forEach((value, key) => {
      let rel = this.modalMapElementsMap.get(key);
      if (!RMRefs.includes(rel.tags.ref)) {
        if (this.newRMsMap.has(rel.tags.ref)) {
          let alreadyAddedRels = this.newRMsMap.get(rel.tags.ref);
          alreadyAddedRels.push({ id: rel.id, percentCoverage: value });
        } else {
          let rels = [];
          rels.push({ id: rel.id, percentCoverage: value });
          this.newRMsMap.set(rel.tags.ref, rels);
        }
      }
    });

    let filteredMap =  new Map();
    this.newRMsMap.forEach((value, key) => {
      if (value.length >= 2) {
       filteredMap.set(key, value);
      }
    });
    this.newRMsMap = filteredMap;
    console.log('map after filter', this.newRMsMap);
    this.newRoutesMapReceived.emit(this.newRMsMap);
    console.log('new RM\'s Map', this.newRMsMap);
  }

  /***
   * View suggested route
   * @param ref
   * @param connectObj
   * @returns {void}
   */
  public viewRoute(routeID: any, connectObj: any): void {
    let route = this.modalMapElementsMap.get(routeID);
    // console.log('route', route);
    // let members        = route['members'];
    // let memberElements = [];
    // for (let member of members) {
    //   if(this.modalMapElementsMap.has(member.ref)){
    //     memberElements.push(this.modalMapElementsMap.get(member.ref));
    //   }
    //
    // }
    //
    // console.log('memebers', memberElements);
    // let countObj = RouteMasterWizardService.countNodeType(memberElements);
    // this.useAndSetAvailableConnectivity(countObj);
    // this.highlightRoute(memberElements, true);
    this.mapSrv.showRoute(route, this.map, this.modalMapElementsMap);

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
   * Highlights route's members on map
   * @param members
   * @param adjustZoom
   */
  public highlightRoute(members: any, adjustZoom: boolean): void {
    this.mapSrv.clearHighlight(this.map);
    let routeMembers = members;
    RouteMasterWizardService.assignRolesToMembers(routeMembers);
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
   * Resets available connectivity
   * @param countObj
   * @returns {any}
   */
  private resetAvailableConnectivity(countObj: any): any {
    let canStopsConnect;
    let canPlatformsConnect;

    countObj.stopsCount > 1 ? canStopsConnect = true : canStopsConnect = false;
    countObj.platformsCount > 1 ? canPlatformsConnect = true : canPlatformsConnect = false;

    this.refreshAvailableConnectivity.emit({ canStopsConnect, canPlatformsConnect });
    return { canStopsConnect, canPlatformsConnect };
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
}
