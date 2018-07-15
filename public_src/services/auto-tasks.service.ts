import {EventEmitter, Injectable} from '@angular/core';
import {ConfService} from './conf.service';
import * as L from 'leaflet';

@Injectable()
export class AutoTasksService {
  public map;
  public routes = [];

  public routesRec: EventEmitter<any> =  new EventEmitter();
  public baseMaps;
  public osmtogeojson: any = require('osmtogeojson');

  constructor(
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


  public onShownModal(): any{
    // document.getElementById('map2').style.height = '95%';
      // ..style.height = '90vh';
    // console.log('on shown', document.getElementsByClassName('modal-content')[0]);

    this.map.invalidateSize();
  }

  public onShowModal(): any{
    // let x = document.getElementsByClassName('modal-content')[0];
    // console.log('on show', x);

    // document.getElementById('map2').style.height = '90%';

  }

  public newRoutes(newRoutes: any): any{
    let refsMap = new Map();
    for (let stop of newRoutes){
      if (!refsMap.get(stop.tags.route_ref)) {
        let arr = [];
        arr.push(stop);
        refsMap.set(stop.tags.ref, stop);
      } else {
        let arr = refsMap.get(stop.tags.route_ref);
        arr.push(stop);
      }
    }

    this.routesRec.emit(refsMap);
  }
}
