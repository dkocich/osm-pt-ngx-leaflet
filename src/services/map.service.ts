import { NgRedux } from '@angular-redux/store';
import { HttpClient } from '@angular/common/http';
import { EventEmitter, Injectable } from '@angular/core';
import * as L from 'leaflet';
import { TileLayer } from 'leaflet';
import 'leaflet-textpath';
import { IPtStop } from '../core/ptStop.interface';
import { Utils } from '../core/utils.class';
import { IAppState } from '../store/model';
import { ConfService } from './conf.service';
import { StorageService } from './storage.service';

interface MyTileLayer extends TileLayer {
  app_code: string;
  app_id: string;
  mapID: string;
}

interface IBaseMaps {
  [key: string]: TileLayer;
}

@Injectable()
export class MapService {
  // autoRouteMapNodeClick: EventEmitter<number> = new EventEmitter();
  constructor(
    private confSrv: ConfService,
    private httpClient: HttpClient,
    private storageSrv: StorageService,
    private ngRedux: NgRedux<IAppState> // private tutorialSrv: TutorialService,
  ) {
    // @ts-ignore
    this.baseMaps = {
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
        }
      ),
      CartoDB_light: L.tileLayer(
        'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
        {
          attribution: `&copy; <a href='https://www.openstreetmap.org/copyright' target='_blank'
            rel='noopener'>OpenStreetMap</a>&nbsp;&copy;&nbsp;<a href='https://cartodb.com/attributions'
            target='_blank' rel='noopener'>CartoDB</a>`,
          maxNativeZoom: 19,
          maxZoom: 22,
        }
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
        }
      ),
      Esri_imagery: L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/' +
          'World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: `Tiles &copy; Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye,
            Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community `,
          maxNativeZoom: 19,
          maxZoom: 22,
        }
      ),
      HERE_satelliteDay: L.tileLayer(
        'http://{s}.{base}.maps.cit.api.here.com/maptile/2.1/{type}/{mapID}/' +
          'satellite.day/{z}/{x}/{y}/{size}/{format}?app_id={app_id}&app_code={app_code}&lg={language}',
        {
          attribution:
            "Map &copy; 1987-2014 <a href='https://developer.here.com' target='_blank' rel='noopener'>HERE</a>",
          subdomains: '1234',
          // @ts-ignore
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
        }
      ),
      HERE_hybridDay: L.tileLayer(
        'http://{s}.{base}.maps.cit.api.here.com/maptile/2.1/{type}/{mapID}/' +
          'hybrid.day/{z}/{x}/{y}/{size}/{format}?app_id={app_id}&app_code={app_code}&lg={language}',
        {
          attribution:
            "Map &copy; 1987-2014 <a href='https://developer.here.com' target='_blank' rel='noopener'>HERE</a>",
          subdomains: '1234',
          // mapID: 'newest',
          // app_id: ConfService.hereAppId,
          // app_code: ConfService.hereAppCode,
          // base: 'aerial',
          maxNativeZoom: 19,
          maxZoom: 20,
          // @ts-ignore
          type: 'maptile',
          language: 'eng',
          format: 'png8',
          size: '256',
        }
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
        }
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
        }
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
        }
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
        }
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
        }
      ),
    };
  }
  map: L.Map;
  baseMaps: IBaseMaps;
  osmtogeojson = require('osmtogeojson');
  bounds;
  highlightStroke = undefined;
  editingMode: boolean;
  // popupBtnClick: EventEmitter<any> = new EventEmitter();
  markerClick: EventEmitter<any> = new EventEmitter();
  markerEdit: EventEmitter<object> = new EventEmitter();
  highlightTypeEmitter: EventEmitter<object> = new EventEmitter();
  highlightType = 'Stops';
  membersEditing: boolean;
  markerMembershipToggleClick: EventEmitter<any> = new EventEmitter();
  membersHighlightLayer = undefined;
  private ptLayer;
  highlightFill = undefined;
  private highlight = undefined;
  private markerFrom = undefined;
  private markerTo = undefined;
  popUpArr = [];
  popUpLayerGroup: L.LayerGroup;
  currentPopUpFeatureId: number;
  enableInfoRouteLabelsOption: EventEmitter<any> = new EventEmitter();

  /**
   * Colors popup according to event
   */
  static colorPopUpByEvent(e): void {
    let colorString = '';
    if (e.type === 'click' || e.type === 'mouseover') {
      colorString = 'lightblue';
    }
    if (e.type === 'mouseout') {
      colorString = 'white';
    }
    if (e.target.className === 'leaflet-popup-content-wrapper') {
      e.target.style.backgroundColor = colorString;
      e.target.parentElement.lastElementChild.lastElementChild.style.backgroundColor =
        colorString;
    }
  }

  /**
   * Colors popup according to the given popup name
   */
  static colorPopUpByColorName(colorName: string, element): void {
    element.children[0].style.backgroundColor = colorName;
    element.lastElementChild.lastElementChild.style.backgroundColor = colorName;
  }

  /**
   * Adds mouseover and mouseout listeners from popup
   */
  static addHoverListenersToPopUp(popUpElement: HTMLElement): void {
    L.DomEvent.addListener(
      popUpElement,
      'mouseout',
      MapService.colorPopUpByEvent
    );
    L.DomEvent.addListener(
      popUpElement,
      'mouseover',
      MapService.colorPopUpByEvent
    );
  }

  /**
   * Removes mouseover and mouseout listeners from popup
   */
  static removeHoverListenersToPopUp(popUpElement: HTMLElement): void {
    L.DomEvent.removeListener(
      popUpElement,
      'mouseout',
      MapService.colorPopUpByEvent
    );
    L.DomEvent.removeListener(
      popUpElement,
      'mouseover',
      MapService.colorPopUpByEvent
    );
  }

  /**
   * Disables events propagation on map buttons (dragging of map, etc.).
   */
  disableMouseEvent(elementId: string): void {
    const element = document.getElementById(elementId) as HTMLElement;
    if (element) {
      L.DomEvent.disableClickPropagation(element);
      L.DomEvent.disableScrollPropagation(element);
    }
  }

  /**
   * Zooms to position encoded in URL hash
   */
  zoomToHashedPosition(): void {
    const h = window.location.hash.slice(5).split('/').map(Number);
    this.map.setView({ lat: h[1], lng: h[2] }, h[0]);
  }

  /**
   * Clears layer with downloaded data.
   */
  clearLayer(): void {
    if (this.ptLayer) {
      this.map.removeLayer(this.ptLayer);
      delete this.ptLayer;
    }
  }

  /**
   * Renders GeoJson data on the map.
   */
  renderTransformedGeojsonData(transformedGeojson, map: L.Map): void {
    this.ptLayer = L.geoJSON(transformedGeojson, {
      filter: (feature) => {
        // filter away already rendered elements
        if (this.storageSrv.elementsRendered.has(feature.id)) {
          return false;
        }
        if (this.confSrv.cfgFilterLines) {
          return (
            'public_transport' in feature.properties && feature.id[0] === 'n'
          );
        } else {
          return true;
        }
      },
      onEachFeature: (feature, layer) => {
        // prevent rendering elements twice later
        this.storageSrv.elementsRendered.add(feature.id);
        this.enableDrag(feature, layer);
      },
      pointToLayer: (feature, latlng) => {
        return this.stylePoint(feature, latlng);
      },
      style: (feature) => {
        return this.styleFeature(feature);
      },
    });
    console.log('LOG (map s.) Adding PTlayer to map again', this.ptLayer);

    this.ptLayer.addTo(map);
  }

  /**
   * Creates click events for leaflet elements.
   */
  enableDrag(feature, layer) {
    layer.on('click', (e) => {
      if (!this.membersEditing) {
        this.handleMarkerClick(feature);
      }
    });
    layer.on('click', (e) => {
      if (this.membersEditing) {
        this.handleMembershipToggle(feature);
      } else if (this.editingMode) {
        const marker = e.target;
        if (!marker.dragging._draggable) {
          marker.dragging.enable();
          // domUtil.addClass(marker._icon, "draggable");
          // marker.setZIndexOffset(1000);
          // domUtil.create("div", "handledrag", marker._icon);
          // marker
          //     .on("dragstart drag", function(e) {
          //         e.target.closePopup();
          //         domUtil.addClass(e.target._icon, "dragged");
          //     })
          //     .on("dragend", function(e) {
          //         domUtil.removeClass(e.target._icon, "dragged");
          //         // let newLoc = Climbo.funcs.latlngHuman( e.target.getLatLng(),"","",6);
          //         // //$.post("savepos.php", { move: newLoc, id: marker.options.id });
          //         // console.log("LOG (map s.) Save position", newLoc);
          //     });
        } else {
          // marker.dragging.disable();
          // domUtil.removeClass(marker._icon, "draggable");
          // marker.off("dragstart drag dragend");
          // marker._icon.removeChild(marker._icon.getElementsByClassName("handledrag")[0]);
        }
      }
    });

    layer.on('dragend', (e) => {
      // console.log("LOG (map s.) Dragend event during editing mode", e);
      const marker = e.target;
      const featureTypeId = marker.feature.properties.id.split('/');
      const featureType = featureTypeId[0];
      const featureId = featureTypeId[1];
      const lat = marker.feature.geometry.coordinates[1];
      const lng = marker.feature.geometry.coordinates[0];
      const originalCoords: L.LatLng = new L.LatLng(lat, lng);
      const newCoords: L.LatLng = marker['_latlng']; // .; getLatLng()
      const distance = originalCoords.distanceTo(newCoords);
      if (distance > 100) {
        marker.setLatLng(originalCoords).update();
        alert(
          'Current node was dragged more than 100 meters away which is not allowed - resetting position.'
        );
        return;
      }
      // console.log("LOG (map s.) Distance is", distance, "meters", marker);
      const change = {
        from: { lat, lng },
        to: { lat: newCoords['lat'], lng: newCoords['lng'] },
      };
      // console.log("LOG (map s.) Marker change is ", change);
      // TODO markers geometry editing and history undo/redo
      // this.markerEdit.emit({
      //     "featureId": featureId,
      //     "type": "change marker position",
      //     "change": change });
    });
  }

  /**
   */
  renderData(res): void {
    const transformed = this.osmtogeojson(res);
    this.ptLayer = L.geoJSON(transformed, {
      onEachFeature: (feature, layer) => {
        this.enableDrag(feature, layer);
      },
      pointToLayer: (feature, latlng) => {
        return this.stylePoint(feature, latlng);
      },
      style: (feature) => {
        return this.styleFeature(feature);
      },
    });
    this.ptLayer.addTo(this.map);
  }

  /**
   * Clears active map highlight (stop markers, route lines).
   */
  clearHighlight(map: L.Map): void {
    if (this.markerFrom !== undefined) {
      map.removeLayer(this.markerFrom);
      this.markerFrom = undefined;
    }
    if (this.markerTo !== undefined) {
      map.removeLayer(this.markerTo);
      this.markerTo = undefined;
    }
    if (this.highlight !== undefined) {
      map.removeLayer(this.highlight);
      this.highlight = undefined;
    }
    if (this.highlightFill !== undefined) {
      map.removeLayer(this.highlightFill);
      this.highlightFill = undefined;
    }
    if (this.highlightStroke !== undefined) {
      map.removeLayer(this.highlightStroke);
      this.highlightStroke = undefined;
    }
    this.enableInfoRouteLabelsOption.emit(null);
  }

  /**
   * Returns coordinates for a stop specified by ID.
   * @returns {{lat: number, lng: number}}
   */
  findCoordinates(refId: number, map): L.LatLngExpression {
    const element = map.get(refId);
    if (!element) {
      console.log('Warning - elem. not found ', refId, JSON.stringify(element));
    } else {
      return { lat: element.lat, lng: element.lon };
    }
  }

  /**
   * Highlights stop marker with a circle.
   */
  showStop(stop: IPtStop): void {
    this.markerFrom = L.circleMarker(
      { lat: stop.lat, lng: stop.lon },
      Utils.FROM_TO_LABEL
    );
    this.highlight = L.layerGroup([this.markerFrom]);
  }

  /**
   * Creates multiple relations highlights.
   */
  showRelatedRoutes(filteredRelationsForStop: object[]): void {
    if (filteredRelationsForStop) {
      this.storageSrv.stopsForRoute = [];
      for (const rel of filteredRelationsForStop) {
        this.showRoutes(rel);
      }
    }
  }

  /**
   * Adds highlight layer (contains point highl. and highl. for each related route).
   */
  addExistingHighlight(): void {
    if (this.highlight) {
      this.highlight.addTo(this.map);
    }
  }

  /**
   * Builds multiple relations highlights.
   */
  showRoutes(rel): boolean {
    const latlngs = [];
    this.storageSrv.stopsForRoute = [];
    for (const member of rel.members) {
      if (
        member.type === 'node' &&
        ['stop', 'stop_entry_only', 'stop_exit_only'].indexOf(member.role) > -1
      ) {
        this.storageSrv.stopsForRoute.push(member.ref);
        const latlng: L.LatLngExpression = this.findCoordinates(
          member.ref,
          this.storageSrv.elementsMap
        );
        if (latlng) {
          latlngs.push(latlng);
        }
      }
    }
    if (latlngs.length > 0) {
      Utils.HIGHLIGHT_FILL.color =
        rel.tags.colour ||
        rel.tags.color ||
        '#' + (Math.floor(Math.random() * 0xffffff) | 0x0f0f0f).toString(16);
      this.highlightFill = L.polyline(
        latlngs,
        Utils.HIGHLIGHT_FILL
      ).bindTooltip(rel.tags.name);
      this.enableInfoRouteLabelsOption.emit({
        type: 'multiple',
        id: rel.id,
        highlightFill: this.highlightFill,
      });
      if (this.highlight) {
        this.highlight.addLayer(this.highlightFill);
      } else {
        this.highlight = L.layerGroup([this.highlightFill]);
      }
      this.drawTooltipFromTo(rel);
      return true;
    } else {
      return false;
    }
  }

  /**
   * Clears circles highlighting relation's current members.
   */
  clearCircleHighlight(): void {
    if (
      this.membersHighlightLayer &&
      this.map.hasLayer(this.membersHighlightLayer)
    ) {
      console.log('LOG: delete existing highlight');
      this.map.removeLayer(this.membersHighlightLayer);
      this.membersHighlightLayer = undefined;
    }
  }

  /**
   * Builds and creates relation highlight.
   */
  showRoute(rel, map: L.Map, elementsMap): boolean {
    for (const member of rel.members) {
      if (
        member.type === 'node' &&
        ['stop', 'stop_entry_only', 'stop_exit_only'].indexOf(member.role) > -1
      ) {
        if (member.ref) {
          this.storageSrv.stopsForRoute.push(member.ref);
        }
        if (member.id) {
          this.storageSrv.stopsForRoute.push(member.id);
        }
      } else if (
        member.type === 'node' &&
        ['platform', 'platform_entry_only', 'platform_exit_only'].indexOf(
          member.role
        ) > -1
      ) {
        if (member.ref) {
          this.storageSrv.platformsForRoute.push(member.ref);
        }
        if (member.id) {
          this.storageSrv.platformsForRoute.push(member.id);
        }
      } else if (member.type === 'way') {
        this.storageSrv.waysForRoute.push(member.ref);
      } else if (member.type === 'relation') {
        this.storageSrv.relationsForRoute.push(member.ref);
      }
    }
    // setup highlight type
    if (
      this.storageSrv.stopsForRoute.length === 0 &&
      this.storageSrv.platformsForRoute.length !== 0
    ) {
      this.highlightType = 'Platforms';
    }
    this.highlightTypeEmitter.emit({ highlightType: this.highlightType });

    let memberRefs;
    switch (this.highlightType) {
      case 'Stops':
        memberRefs = this.storageSrv.stopsForRoute;
        break;
      case 'Platforms':
        memberRefs = this.storageSrv.platformsForRoute;
        break;
    }
    const latlngs = [];
    for (const ref of memberRefs) {
      const latlng: L.LatLngExpression = this.findCoordinates(ref, elementsMap);
      if (latlng) {
        latlngs.push(latlng);
      }
    }

    // at least two nodes to form a polyline and not point
    if (latlngs.length > 1) {
      const currentHighlightFill = JSON.parse(
        JSON.stringify(Utils.HIGHLIGHT_FILL)
      );
      currentHighlightFill.color =
        rel.tags.colour || rel.tags.color || Utils.HIGHLIGHT_FILL.color;
      this.highlightStroke = L.polyline(
        latlngs,
        Utils.HIGHLIGHT_STROKE
      ).bindTooltip(rel.tags.name);
      this.highlightFill = L.polyline(
        latlngs,
        currentHighlightFill
      ).bindTooltip(rel.tags.name);
      this.highlight = L.layerGroup([
        this.highlightStroke,
        this.highlightFill,
      ]).addTo(map);
      this.enableInfoRouteLabelsOption.emit({
        type: 'single',
        id: rel.id,
        highlightFill: this.highlightFill,
      });
      return true;
    } else {
      if (rel.members.length <= 1) {
        console.log(
          'LOG (map s.) This is new relation -> do not highlight route'
        );
      } else {
        alert(
          'Problem has occurred while drawing line connecting its members (no added stops?).' +
            ' Please add members and try again.' +
            '\n\n' +
            JSON.stringify(rel)
        );
      }
      return false;
    }
  }

  /**
   * Verifies if highlight is still active.
   */
  highlightIsActive(): boolean {
    return (
      this.highlightFill ||
      this.highlightStroke ||
      this.markerFrom ||
      this.markerTo
    );
  }

  private getFirstNode(): L.LatLngExpression {
    let latlngFrom;
    switch (this.highlightType) {
      case 'Stops':
        latlngFrom = this.findCoordinates(
          this.storageSrv.stopsForRoute[0],
          this.storageSrv.elementsMap
        ); // get first and last ID reference
        return latlngFrom;
      case 'Platforms':
        latlngFrom = this.findCoordinates(
          this.storageSrv.platformsForRoute[0],
          this.storageSrv.elementsMap
        ); // get first and last ID reference
        return latlngFrom;
    }
  }

  private getLastNode(): L.LatLngExpression {
    let latlngTo;
    switch (this.highlightType) {
      case 'Stops':
        latlngTo = this.findCoordinates(
          this.storageSrv.stopsForRoute[
            this.storageSrv.stopsForRoute.length - 1
          ],
          this.storageSrv.elementsMap
        );
        return latlngTo;
      case 'Platforms':
        latlngTo = this.findCoordinates(
          this.storageSrv.platformsForRoute[
            this.storageSrv.platformsForRoute.length - 1
          ],
          this.storageSrv.elementsMap
        );
        return latlngTo;
    }
  }

  /**
   * Draws tooltip with name of from/to stops.
   */
  drawTooltipFromTo(rel): void {
    const latlngFrom = this.getFirstNode();
    const latlngTo = this.getLastNode();

    const from: string = 'Tag from: ' + rel.tags.from || '#FROM';
    const to: string = 'Tag to: ' + rel.tags.to || '#TO';
    const route: string = rel.tags.route || '#ROUTE';
    const ref: string = rel.tags.ref || '#REF';

    this.markerTo = L.circleMarker(latlngTo, Utils.FROM_TO_LABEL).bindTooltip(
      to + ' (' + route + ' ' + ref + ')',
      {
        className: 'from-to-label',
        offset: [0, 0],
        permanent: true,
      }
    );
    this.markerFrom = L.circleMarker(
      latlngFrom,
      Utils.FROM_TO_LABEL
    ).bindTooltip(from + ' (' + route + ' ' + ref + ')', {
      className: 'from-to-label',
      offset: [0, 0],
      permanent: true,
    });
    if (this.highlight) {
      this.highlight.addLayer(this.markerFrom, this.markerTo);
    } else {
      this.highlight = L.layerGroup([this.markerFrom, this.markerTo]);
    }
  }

  /**
   * Styles leaflet markers.
   */
  stylePoint(feature, latlng) {
    let iconUrl = 'assets/marker-icon.png';
    let shadowUrl = '';
    const fp = feature.properties;
    if ('public_transport' in fp) {
      // && fp["railway"] === undefined
      if (fp['public_transport'] === 'platform') {
        iconUrl = 'assets/transport/platform.png';
      } else if (fp['public_transport'] === 'stop_position') {
        iconUrl = 'assets/transport/bus.png';
      } else if (fp['public_transport'] === 'station') {
        iconUrl = 'assets/transport/station.png';
      }
    } else if ('highway' in fp) {
      if (fp['highway'] === 'bus_stop') {
        iconUrl = 'assets/transport/bus.png';
      } else if (fp['highway'] === 'traffic_signals') {
        iconUrl = 'assets/traffic/traffic_signals.png';
      } else if (fp['highway'] === 'crossing') {
        iconUrl = 'assets/traffic/crossing.png';
      }
    } else if ('railway' in fp) {
      if (
        ['crossing', 'level_crossing', 'railway_crossing'].indexOf(
          fp['railway']
        ) > -1
      ) {
        iconUrl = 'assets/transport/railway/crossing.png';
      } else if (fp['railway'] === ['tram_stop']) {
        iconUrl = 'assets/transport/railway/tram.png';
      } else if (fp['railway'] === 'stop_position') {
        iconUrl = 'assets/transport/train.png';
      } else if (fp['public_transport'] === 'station') {
        iconUrl = 'assets/transport/railway_station.png';
      }
    }
    if ('public_transport:version' in fp) {
      if (fp['public_transport:version'] === '1') {
        shadowUrl = 'assets/nr1-24x24.png';
      }
      if (fp['public_transport:version'] === '2') {
        iconUrl = 'assets/nr2-24x24.png';
      }
    }
    const myIcon = L.icon({
      iconAnchor: [10, 10],
      iconUrl,
      shadowAnchor: [22, 94],
      shadowSize: [24, 24],
      shadowUrl,
    });
    return L.marker(latlng, {
      icon: myIcon,
      draggable: false,
      opacity: 0.8,
      riseOnHover: true,
      title: fp.name || fp.id || '',
    });
  }

  /**
   * Styles leaflet lines.
   * @returns {{color: string, weight: number, opacity: number}}
   */
  private styleFeature(feature): object {
    switch (feature.properties.route) {
      case 'bus':
        return Utils.REL_BUS_STYLE;
      case 'train':
        return Utils.REL_TRAIN_STYLE;
      case 'tram':
        return Utils.REL_TRAM_STYLE;
      default:
        return Utils.OTHER_STYLE;
    }
  }

  getFeatureIdFromMarker(feature): number {
    const featureTypeId = feature.id.split('/');
    const featureType = featureTypeId[0];
    return Number(featureTypeId[1]); // featureId
  }

  /**
   * Emits event when users clicks map marker.
   */
  private handleMarkerClick(feature): void {
    const featureId: number = this.getFeatureIdFromMarker(feature);
    this.markerClick.emit(featureId);
    this.storageSrv.tutorialStepCompleted.emit('click map marker');
  }

  private handleMembershipToggle(feature): void {
    const featureId: number = this.getFeatureIdFromMarker(feature);
    const marker: object = feature.target; // FIXME DELETE?
    this.markerMembershipToggleClick.emit({ featureId });
    const rel = this.storageSrv.elementsMap.get(
      this.storageSrv.currentElement.id
    );
    this.storageSrv.tutorialStepCompleted.emit('click change route members');
  }

  /**
   * Fetches popup element from currently added popups on map
   */
  getPopUpFromArray(popUpId: number): HTMLElement {
    for (const popUp of this.popUpArr) {
      if (popUp['_leaflet_id'] === popUpId) {
        return popUp.getElement();
      }
    }
  }

  /**
   * Removes the complete popup layer and enables marker click again
   */
  removePopUps(): void {
    this.map.closePopup();
    if (this.popUpLayerGroup) {
      this.popUpLayerGroup.remove();
    }
  }

  /**
   * Displays route info labels for the case of single route highlight
   */
  showRouteInfoLabels(relID: number): void {
    const rel = this.storageSrv.elementsMap.get(relID);
    if (rel.tags.ref) {
      const textString = '     ' + rel.tags.ref + '     ';
      this.highlightFill.setText(textString, {
        repeat: true,
        attributes: { fill: 'blue', stroke: 'black' },
      });
    }
  }

  /**
   * Handles displaying route info labels for the case of multiple route highlight
   */
  showMultipleRouteInfoLabels(
    relHighlightsAndIDs: Map<number, L.Polyline>
  ): void {
    relHighlightsAndIDs.forEach((highlight, id) => {
      const rel = this.storageSrv.elementsMap.get(id);
      const textString = '     ' + rel.tags.ref + '     ';
      const layer = highlight;
      layer.setText(textString, {
        repeat: true,
        attributes: { fill: 'blue', stroke: 'black' },
      });
    });
  }

  /**
   * Clears the info label for single route highlight case
   */
  clearSingleRouteInfoLabels(): void {
    this.highlightFill.setText(null);
  }

  /**
   * Clears the info labels for the case of multiple route highlights
   */
  clearMultipleRouteInfoLabels(): void {
    this.highlight.eachLayer((layer: L.Layer) => {
      if (layer instanceof L.Polyline) {
        const layerA = layer;
        layerA.setText(null);
      }
    });
  }

  /**
   * Returns all stops/platforms on the given map
   */
  findStopsInBounds(map: L.Map, elementsMap) {
    const stopsInBounds = [];
    elementsMap.forEach((stop) => {
      if (
        stop.type === 'node' &&
        (stop.tags.bus === 'yes' || stop.tags.public_transport)
      ) {
        if (map.getBounds().contains({ lat: stop.lat, lng: stop.lon })) {
          stopsInBounds.push(stop.id);
        }
      }
    });
    return stopsInBounds;
  }
}
