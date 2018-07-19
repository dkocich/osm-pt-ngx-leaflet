import { EventEmitter, Injectable } from '@angular/core';
import {MapService} from '../map.service';
import {StorageService} from '../storage.service';
import {BsModalRef, BsModalService} from 'ngx-bootstrap';
import * as L from 'leaflet';
// import {AutoTasksService} from './auto-tasks.service';
import {ConfService} from '../conf.service';


@Injectable()
export class ModalMapService {
  public map;
  public routes = [];
  // public routesRecieved: EventEmitter<any> =  new EventEmitter();
  public baseMaps;
  public osmtogeojson: any = require('osmtogeojson');
  modalRef: BsModalRef;
  public currentHighlightType = 'Stops';
  private highlightFill: any = undefined;
  private highlight: any = undefined;

  constructor(private storageSrv: StorageService,
              private mapSrv: MapService,
              private modalService: BsModalService,

  ) {


    this.baseMaps ={
      Empty: L.tileLayer('', {
        attribution: '',
      }),
      CartoDB_dark: L.tileLayer(
        'https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png',
        {
          attribution: `&copy; <a href='https://www.openstreetmap.org/copyright' target='_blank'
            rel='noopener'>OpenStreetMap</a>&nbsp;&copy;&nbsp;<a href='https://cartodb.com/attributions'
            target='_blank' rel='noopener'>CartoDB</a>`,
          maxNativeZoom: 19,
          maxZoom: 22,
        },
      ),
      CartoDB_light: L.tileLayer(
        'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
        {
          attribution: `&copy; <a href='https://www.openstreetmap.org/copyright' target='_blank'
            rel='noopener'>OpenStreetMap</a>&nbsp;&copy;&nbsp;<a href='https://cartodb.com/attributions'
            target='_blank' rel='noopener'>CartoDB</a>`,
          maxNativeZoom: 19,
          maxZoom: 22,
        },
      ),
      Esri: L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/' +
        'World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: `Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap,
            iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan,
            METI, Esri China (Hong Kong), and the GIS User Community`,
          maxNativeZoom: 19,
          maxZoom: 22,
        },
      ),
      Esri_imagery: L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/' +
        'World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: `Tiles &copy; Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye,
            Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community `,
          maxNativeZoom: 19,
          maxZoom: 22,
        },
      ),
      HERE_satelliteDay: L.tileLayer(
        'http://{s}.{base}.maps.cit.api.here.com/maptile/2.1/{type}/{mapID}/' +
        'satellite.day/{z}/{x}/{y}/{size}/{format}?app_id={app_id}&app_code={app_code}&lg={language}',
        {
          attribution:
            'Map &copy; 1987-2014 <a href=\'https://developer.here.com\' target=\'_blank\' rel=\'noopener\'>HERE</a>',
          subdomains: '1234',
          mapID: 'newest',
          app_id: ConfService.hereAppId,
          app_code: ConfService.hereAppCode,
          base: 'aerial',
          maxNativeZoom: 19,
          maxZoom: 20,
          type: 'maptile',
          language: 'eng',
          format: 'png8',
          size: '256',
        },
      ),
      HERE_hybridDay: L.tileLayer(
        'http://{s}.{base}.maps.cit.api.here.com/maptile/2.1/{type}/{mapID}/' +
        'hybrid.day/{z}/{x}/{y}/{size}/{format}?app_id={app_id}&app_code={app_code}&lg={language}',
        {
          attribution:
            'Map &copy; 1987-2014 <a href=\'https://developer.here.com\' target=\'_blank\' rel=\'noopener\'>HERE</a>',
          subdomains: '1234',
          mapID: 'newest',
          app_id: ConfService.hereAppId,
          app_code: ConfService.hereAppCode,
          base: 'aerial',
          maxNativeZoom: 19,
          maxZoom: 20,
          type: 'maptile',
          language: 'eng',
          format: 'png8',
          size: '256',
        },
      ),
      MapBox_imagery: L.tileLayer(
        'https://{s}.tiles.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}.png?access_token=' +
        ConfService.mapboxToken,
        {
          attribution: `<a href='https://www.mapbox.com/about/maps/' target='_blank'
            rel='noopener'>&copy;&nbsp;Mapbox</a>,&nbsp;<a href='https://www.openstreetmap.org/about/'
            target='_blank' rel='noopener'>&copy;&nbsp;OpenStreetMap</a>&nbsp;and&nbsp;<a
            href='https://www.mapbox.com/map-feedback/#/-74.5/40/10' target='_blank'
            rel='noopener'>Improve this map</a>`,
          maxNativeZoom: 20,
          maxZoom: 22,
        },
      ),
      MapBox_streets: L.tileLayer(
        'https://{s}.tiles.mapbox.com/v4/mapbox.mapbox-streets-v7/{z}/{x}/{y}.png?access_token=' +
        ConfService.mapboxToken,
        {
          attribution: `<a href='https://www.mapbox.com/about/maps/' target='_blank'
            rel='noopener'>&copy;&nbsp;Mapbox</a>,&nbsp;<a href='https://www.openstreetmap.org/about/'
            target='_blank' rel='noopener'>&copy;&nbsp;OpenStreetMap</a>&nbsp;and&nbsp;<a
            href='https://www.mapbox.com/map-feedback/#/-74.5/40/10' target='_blank'
            rel='noopener'>Improve this map</a>`,
          maxNativeZoom: 20,
          maxZoom: 22,
        },
      ),
      OSM_hot: L.tileLayer(
        'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
        {
          attribution: `&copy; <a href='https://www.openstreetmap.org/copyright'
            target='_blank' rel='noopener'> OpenStreetMap</a>
            , Tiles courtesy of <a href='https://hot.openstreetmap.org/'
            target='_blank' rel='noopener'>Humanitarian OpenStreetMap Team</a>`,
          maxNativeZoom: 19,
          maxZoom: 22,
        },
      ),
      OSM_standard: L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution: `&copy; <a href='https://www.openstreetmap.org/copyright'
            target='_blank' rel='noopener'>
            OpenStreetMap</a>, Tiles courtesy of <a href='https://openstreetmap.org/'
            target='_blank' rel='noopener'>OpenStreetMap Team</a>`,
          maxNativeZoom: 19,
          maxZoom: 22,
        },
      ),
      OSM_PT: L.tileLayer('http://www.openptmap.org/tiles/{z}/{x}/{y}.png', {
        attribution: `&copy; <a href='https://www.openstreetmap.org/copyright' target='_blank' rel='noopener'>
          OpenStreetMap</a>, Tiles courtesy of <a href='https://openptmap.org/'
          target='_blank' rel='noopener'>OpenStreetMap Team</a>`,
        maxNativeZoom: 19,
        maxZoom: 17,
      }),
      OSM_transport: L.tileLayer(
        'http://{s}.tile2.opencyclemap.org/' + 'transport/{z}/{x}/{y}.png',
        {
          attribution: `&copy; <a href='https://www.openstreetmap.org/copyright' target='_blank' rel='noopener'>
            OpenStreetMap</a>, Tiles courtesy of <a href='https://opencyclemap.org/'
            target='_blank' rel='noopener'>OpenStreetMap Team</a>`,
          maxNativeZoom: 19,
          maxZoom: 22,
        },
      ),
    };
  }

  public onShownModal(): any {
    this.map.invalidateSize();
  }

  // public onShowModal(): any {
  // }

  // public newRoutes(newRoutes: any): any {
  //   this.routesRec.emit(newRoutes);
  // }
  public renderAlreadyDownloadedData(): any {
    let obj: any = {};
    let elements = [];
    this.storageSrv.elementsMap.forEach((element) => {
      elements.push(element);
    });
    obj.elements = elements;
    console.log('obj', obj);
    let transformed = this.osmtogeojson(obj);
    this.mapSrv.renderTransformedGeojsonData2(transformed, this.map);
  }

  // public findRefsFromNodes(): any {
  //   let inBounds      = [];
  //
  //   let stopsInBounds = [];
  //   let ref_map;
  //   let refValues = [];
  //
  //   // only for logging/debugging
  //   let stopsT        = [];
  //   let refs          = [];
  //
  //   this.storageSrv.elementsMap.forEach((stop) => {
  //     if (stop.type === 'node' && (stop.tags.bus === 'yes' || stop.tags.public_transport)) {
  //       stopsT.push(stop);
  //       if (stop.tags.route_ref) {
  //         refs.push(stop);
  //         if (this.map.getBounds().contains({ lat: stop.lat, lng: stop.lon })) {
  //           inBounds.push(stop);
  //         }
  //       }
  //
  //       if (this.map.getBounds().contains({ lat: stop.lat, lng: stop.lon })) {
  //         stopsInBounds.push(stop.id);
  //       }
  //     }
  //   });
  //   console.log('total stops', stopsT.length, 'stops in bounds', stopsInBounds.length, 'stops with route ref tag',
  //     refs.length, 'stops in bounds with rr tag', inBounds.length);
  //
  //   if (inBounds.length !== 0) {
  //     ref_map = AutoTasksService.getIndividualRouteRefs(inBounds);
  //     console.log('in bounds and rr tag', inBounds);
  //     console.log('ref map (of stops/platforms)', ref_map);
  //
  //     Array.from(ref_map).map(([key]) => {
  //       refValues.push(key);
  //     });
  //     console.log('route refs of nodes', refValues);
  //   }
  //   return refValues;
  // }
  // public static getIndividualRouteRefs(stops: any[]): any {
  //   console.log(stops);
  //   let refs = [];
  //   for (let stop of stops) {
  //     refs.push(stop.tags.route_ref);
  //   }
  //   console.log(refs);
  //   let ref_map = new Map();
  //   for (let routeRefs of refs) {
  //     let singleRefs = routeRefs.split(';');
  //     for (let ref of singleRefs) {
  //       if (ref_map.has(ref)) {
  //         let val = ref_map.get(ref);
  //         val++;
  //         ref_map.set(ref, val);
  //       } else {
  //         ref_map.set(ref, 1);
  //       }
  //     }
  //   }
  //   return ref_map;
  // }

  // public findStopsInBounds(): any {
  //   let stopsInBounds = [];
  //   this.storageSrv.elementsMap.forEach((stop) => {
  //     if (stop.type === 'node' && (stop.tags.bus === 'yes' || stop.tags.public_transport)) {
  //       if (this.map.getBounds().contains({ lat: stop.lat, lng: stop.lon })) {
  //         stopsInBounds.push(stop.id);
  //       }
  //     }
  //   });
  //   return stopsInBounds;
  // }

  // public processMultipleNodeDataResponse(response: any, nodeRefs: any): any {
  //   let refs: any[] = [];
  //   let relations: any[] = [];
  //   for (const element of response.elements) {
  //     if (!this.storageSrv.elementsMap.has(element.id)) {
  //       this.storageSrv.elementsMap.set(element.id, element);
  //       if (!element.tags) {
  //         continue;
  //       }
  //       switch (element.type) {
  //         case 'node':
  //           this.storageSrv.elementsDownloaded.add(element.id);
  //           if (element.tags.bus === 'yes' || element.tags.public_transport) {
  //             this.storageSrv.listOfStops.push(element);
  //           }
  //           break;
  //         case 'relation':
  //           if (element.tags.public_transport === 'stop_area') {
  //             this.storageSrv.listOfAreas.push(element);
  //           } else {
  //             relations.push(element);
  //             this.storageSrv.listOfRelations.push(element);
  //             break;
  //           }
  //       }
  //     }
  //
  //     if (element.type === 'relation' &&  element.tags.public_transport !== 'stop_area' && element.tags.ref) {
  //       refs.push(element.tags.ref);
  //     }
  //   }
  //   console.log('references of downloaded relations', refs, 'total relations checked out of downloaded', relations.length);
  //   let unique = AutoTasksService.removeDuplicatefromArray(refs);
  //   let refnodes = AutoTasksService.compareArrays(nodeRefs, unique);
  //   if (refnodes.length !== 0) {
  //     let StopsForNewRoutes = new Map();
  //     this.storageSrv.elementsMap.forEach((stop) => {
  //       if (stop.type === 'node' && (stop.tags.bus === 'yes' || stop.tags.public_transport) && stop.tags.route_ref) {
  //         let stops: any[] = [];
  //         stops.push(stop);
  //         let refMap = AutoTasksService.getIndividualRouteRefs(stops);
  //         let individualRefs = [];
  //         Array.from(refMap).map(([key]) => { individualRefs.push(key); });
  //         individualRefs.forEach((val) =>  {
  //           if (refnodes.includes(val)) {
  //             if (StopsForNewRoutes.get(val)) {
  //               StopsForNewRoutes.get(val).push(stop);
  //             } else {
  //               let arr = [];
  //               arr.push(stop);
  //               StopsForNewRoutes.set(val, arr);
  //             }
  //           }
  //         });
  //       }
  //     });
  //     console.log('stops for new routes', StopsForNewRoutes);
  //     this.routesRec.emit(StopsForNewRoutes);
  //   } else {
  //     alert('no route can be formed with tag which does not already exist');
  //   }
  // }
  //
  // private static removeDuplicatefromArray(arr: any[]): any {
  //   return arr.filter((value, index, self) => {
  //     return self.indexOf(value) === index;
  //   });
  // }
  //
  // private static compareArrays(nodeRefs: any, routeRefs: any): any {
  //   console.log('to compare:  node refs', nodeRefs, 'route refs', routeRefs);
  //   let notAdded = [];
  //   for (let itemA of nodeRefs) {
  //     let flag = false;
  //     for (let itemB of routeRefs) {
  //       if (itemA === itemB) {
  //         flag = true;
  //       }
  //     }
  //
  //     if (flag === false) {
  //       notAdded.push(itemA);
  //     }
  //   }
  //   console.log('not added in routes node refs', notAdded);
  //   return notAdded;
  // }

  // public createAutomaticRoute(): any {
  //   this.modalRef = this.modalService.show(RouteModalComponent, {class: 'modal-lg'});
  //   console.log('stops in bounds and having route ref tag');
  // }

}
