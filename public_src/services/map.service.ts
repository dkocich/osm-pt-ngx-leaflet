import {EventEmitter, Injectable} from "@angular/core";
import {Http} from "@angular/http";

import {ConfigService} from "./config.service";
import {LoadingService} from "./loading.service";
import {StorageService} from "./storage.service";

import {Map} from "leaflet";
import domUtil = L.DomUtil;
import latLng = L.latLng;
import LatLng = L.LatLng;
import LatLngExpression = L.LatLngExpression;
import LatLngLiteral = L.LatLngLiteral;

import {IPtStop} from "../core/ptStop.interface";

const DEFAULT_ICON = L.icon({
    iconUrl: "",
    shadowUrl: "",
    shadowSize: [24, 24],
    shadowAnchor: [22, 94]
});
const HIGHLIGHT_FILL = {
    color: "#ffff00",
    weight: 6,
    opacity: 0.6
};
const HIGHLIGHT_STROKE = {
    color: "#FF0000",
    weight: 12,
    opacity: 0.6
};
const FROM_TO_LABEL = {
    color: "#ffaa00",
    opacity: 0.6,
};
const REL_BUS_STYLE = {
    "color": "#0000FF",
    "weight": 6,
    "opacity": 0.3
};
const REL_TRAIN_STYLE = {
    "color": "#000000",
    "weight": 6,
    "opacity": 0.3
};
const REL_TRAM_STYLE = {
    "color": "#FF0000",
    "weight": 6,
    "opacity": 0.3
};
const OTHER_STYLE = {
    "color": "#00FF00",
    "weight": 6,
    "opacity": 0.3
};

@Injectable()
export class MapService {
    public map: Map;
    public baseMaps: any;
    public previousCenter: [number, number] = [0.0, 0.0];
    private ptLayer: any;
    public osmtogeojson: any = require("osmtogeojson");
    public bounds;

    private highlightFill: any = undefined;
    public highlightStroke: any = undefined;
    private highlight: any = undefined;
    private markerFrom: any = undefined;
    private markerTo: any = undefined;

    public editingMode: boolean;

    // public popupBtnClick: EventEmitter<any> = new EventEmitter();
    public markerClick: EventEmitter<any> = new EventEmitter();
    public markerEdit: EventEmitter<object> = new EventEmitter();

    constructor(private http: Http, private storageService: StorageService,
                private configService: ConfigService, private loadingService: LoadingService) {

        this.baseMaps = {
            Empty: L.tileLayer("", {
                attribution: ""
            }),
            OSM_standard: L.tileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                maxNativeZoom: 19, maxZoom: 22,
                attribution: "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a>, Tiles courtesy of <a href='https://openstreetmap.org/' target='_blank'>OpenStreetMap Team</a>"
            }),
            OSM_hot: L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
                maxNativeZoom: 19, maxZoom: 22,
                attribution: "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a>, Tiles courtesy of <a href='https://hot.openstreetmap.org/' target='_blank'>Humanitarian OpenStreetMap Team</a>"
            }),
            OSM_transport: L.tileLayer("http://{s}.tile2.opencyclemap.org/transport/{z}/{x}/{y}.png", {
                maxNativeZoom: 19, maxZoom: 22,
                attribution: "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a>, Tiles courtesy of <a href='https://opencyclemap.org/' target='_blank'>OpenStreetMap Team</a>"
            }),
            OSM_PT: L.tileLayer("http://www.openptmap.org/tiles/{z}/{x}/{y}.png", {
                maxNativeZoom: 19, maxZoom: 22,
                attribution: "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a>, Tiles courtesy of <a href='https://openptmap.org/' target='_blank'>OpenStreetMap Team</a>"
            }),
            Esri: L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}", {
                maxNativeZoom: 19, maxZoom: 22,
                attribution: "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community"
            }),
            CartoDB_light: L.tileLayer("http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png", {
                maxNativeZoom: 19, maxZoom: 22,
                attribution: "&copy; <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> &copy; <a href='https://cartodb.com/attributions'>CartoDB</a>"
            }),
            CartoDB_dark: L.tileLayer("http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png", {
                maxNativeZoom: 19, maxZoom: 22,
                attribution: "&copy; <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> &copy; <a href='https://cartodb.com/attributions'>CartoDB</a>"
            }),
            // TODO add authorization
            // MapBox_imagery: L.tileLayer("http://{s}.tiles.mapbox.com/v4/{z}/{x}/{y}.png", {
            //     maxNativeZoom: 19, maxZoom: 22,
            //     attribution: "<a href='https://www.mapbox.com/about/maps/'>&copy; Mapbox</a>, <a href='http://www.openstreetmap.org/about/'>&copy; OpenStreetMap</a> and <a href='https://www.mapbox.com/map-feedback/#/-74.5/40/10'>Improve this map</a>"
            // }),
            Esri_imagery: L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
                maxNativeZoom: 19, maxZoom: 22,
                attribution: "&copy; ESRI https://leaflet-extras.github.io/leaflet-providers/preview/"
            })
        };
    }

    /**
     * Disables events propagation on map buttons (dragging of map, etc.).
     * @param elementId
     */
    public disableMouseEvent(elementId: string): void {
        let element = <HTMLElement>document.getElementById(elementId);
        if (element) {
            L.DomEvent.disableClickPropagation(element);
            L.DomEvent.disableScrollPropagation(element);
        }
    }

    /**
     * Clears layer with downloaded data.
     */
    public clearLayer() {
        if (this.ptLayer) {
            this.map.removeLayer(this.ptLayer);
            delete this.ptLayer;
        }
    }

    /**
     * Styles leaflet markers.
     * @param feature
     * @param latlng
     * @returns {any}
     */
    private stylePoint(feature, latlng): any {
        let iconUrl = "images/marker-icon.png";
        let shadowUrl = "";
        let fp = feature.properties;
        if ("public_transport" in fp ) { // && fp["railway"] === undefined
            if (fp["public_transport"] === "platform") {
                iconUrl = "images/transport/platform.svg";
            } else if (fp["public_transport"] === "stop_position") {
                iconUrl = "images/transport/bus.png";
            } else if (fp["public_transport"] === "station") {
                iconUrl = "images/transport/station.svg";
            }
        } else if ("highway" in fp) {
            if (fp["highway"] === "bus_stop") {
                iconUrl = "images/transport/bus.png";
            } else if (fp["highway"] === "traffic_signals") {
                iconUrl = "images/traffic/traffic_signals.png";
            } else if (fp["highway"] === "crossing") {
                iconUrl = "images/traffic/crossing.png";
            }
        } else if ("railway" in fp) {
            if (["crossing", "level_crossing", "railway_crossing"].indexOf(fp["railway"]) > -1) {
                iconUrl = "images/transport/railway/crossing.png";
            } else if (fp["railway"] === ["tram_stop"]) {
                iconUrl = "images/transport/railway/tram.png";
            } else if (fp["railway"] === "stop_position") {
                iconUrl = "images/transport/train.png";
            } else if (fp["public_transport"] === "station") {
                iconUrl = "images/transport/railway_station.png";
            }
        }
        if ("public_transport:version" in fp) {
            if (fp["public_transport:version"] === "1" ) {
                shadowUrl = "images/nr1-24x24.png";
            }
            if (fp["public_transport:version"] === "2" ) {
                iconUrl = "images/nr2-24x24.png";
            }
        }
        let myIcon = L.icon({
            iconUrl: iconUrl,
            shadowUrl: shadowUrl,
            iconAnchor: [7, 7],
            shadowSize: [24, 24],
            shadowAnchor: [22, 94]
        });
        return L.marker(latlng, {icon: myIcon, draggable: false});
    }

    /**
     * Styles leaflet lines.
     * @param feature
     * @returns {{color: string, weight: number, opacity: number}}
     */
    private styleFeature(feature): object {
        switch (feature.properties.route) {
            case "bus":
                return REL_BUS_STYLE;
            case "train":
                return REL_TRAIN_STYLE;
            case "tram":
                return REL_TRAM_STYLE;
            default:
                return OTHER_STYLE;
        }
    }

    /**
     * Renders GeoJson data on the map.
     * @param transformedGeojson
     */
    public renderTransformedGeojsonData(transformedGeojson): void {
        this.ptLayer = L.geoJSON(transformedGeojson, {
            filter: (feature) => {
                // filter away already rendered elements
                if (this.storageService.elementsRendered.has(feature.id)) {
                    return false;
                }
                if (this.configService.cfgFilterLines) {
                    return "public_transport" in feature.properties && feature.id[0] === "n";
                } else {
                    return true;
                }
            },
            pointToLayer: (feature, latlng) => {
                return this.stylePoint(feature, latlng);
            },
            style: (feature) => {
                return this.styleFeature(feature);
            },
            onEachFeature: (feature, layer) => {
                // prevent rendering elements twice later
                this.storageService.elementsRendered.add(feature.id);
                this.enableClick(feature, layer);
                this.enableDrag(feature, layer);
            }
        });
        console.log("LOG (map s.): adding PTlayer to map again:", this.ptLayer);
        this.ptLayer.addTo(this.map);
    }

    /**
     * Creates click events for leaflet elements.
     * @param feature
     * @param layer
     */
    public enableClick(feature, layer): void {
        layer.on("click", event => {
            this.handleMarkerClick(feature);
        });
    }

    /**
     *
     * @param feature
     * @param layer
     */
    public enableDrag(feature, layer) {
        layer.on("click", e => {
            if (this.editingMode) {
                let marker = e.target;
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
                    //         // console.log("save position", newLoc);
                    //     });
                } else {
                    // marker.dragging.disable();
                    // domUtil.removeClass(marker._icon, "draggable");
                    // marker.off("dragstart drag dragend");
                    // marker._icon.removeChild(marker._icon.getElementsByClassName("handledrag")[0]);
                }
            }
        });

        layer.on("dragend", e => {
            // console.log("LOG: dragend event during editing mode", e);
            let marker = e.target;
            let featureTypeId = marker.feature.properties.id.split("/");
            let featureType = featureTypeId[0];
            let featureId = featureTypeId[1];
            let lat = marker.feature.geometry.coordinates[1];
            let lng = marker.feature.geometry.coordinates[0];
            let originalCoords: LatLng = new LatLng(lat, lng);
            let newCoords: LatLng = marker["_latlng"]; // .; getLatLng()
            let distance = originalCoords.distanceTo(newCoords);
            if (distance > 100) {
                marker.setLatLng(originalCoords).update();
                alert("Current node was dragged more than 100 meters away -> resetting position.");
                return;
            }
            // console.log("distance is ", distance, " meters", marker);
            let change = { from: {"lat": lat, "lng": lng },
                "to": { "lat": newCoords["lat"], "lng": newCoords["lng"]}
            };
            // console.log("marker change is ", change);
            // TODO markers geometry editing and history undo/redo
            // this.markerEdit.emit({
            //     "featureId": featureId,
            //     "type": "change marker position",
            //     "change": change });
        });
    }

    /**
     * Emits event when users clicks map marker.
     * @param feature
     */
    private handleMarkerClick(feature: any): void {
        let featureTypeId = feature.id.split("/");
        let featureType = featureTypeId[0];
        let featureId = featureTypeId[1];
        this.markerClick.emit(featureId);
        // explores leaflet element
        // this.popupBtnClick.emit([featureType, featureId]);
    }

    /**
     *
     * @param requestBody
     * @param options
     */
    public renderData(requestBody, options): void {
        this.http.post("https://overpass-api.de/api/interpreter", requestBody, options)
            .map(res => res.json())
            .subscribe(result => {
                let transformed = this.osmtogeojson(result);
                this.ptLayer = L.geoJSON(transformed, {
                    pointToLayer: (feature, latlng) => {
                        return this.stylePoint(feature, latlng);
                    },
                    style: (feature) => {
                        return this.styleFeature(feature);
                    },
                    onEachFeature: (feature, layer) => {
                        this.enableDrag(feature, layer);
                    }
                });
                this.ptLayer.addTo(this.map);
                this.loadingService.hide();
            });
    }

    /**
     * Clears active map highlight (stop markers, route lines).
     */
    public clearHighlight(): void {
        if (this.markerFrom !== undefined) {
            this.map.removeLayer(this.markerFrom);
            this.markerFrom = undefined;
        }
        if (this.markerTo !== undefined) {
            this.map.removeLayer(this.markerTo);
            this.markerTo = undefined;
        }
        if (this.highlight !== undefined) {
            this.map.removeLayer(this.highlight);
            this.highlight = undefined;
        }
    }

    /**
     * Returns coordinates for a stop specified by ID.
     * @param refId
     * @returns {{lat: number, lng: number}}
     */
    public findCoordinates(refId): LatLngExpression {
       for (let stop of this.storageService.listOfStops) {
           if (stop.id === refId) {
               return {lat: stop.lat, lng: stop.lon};
           }
       }
    }

    /**
     * Highlights stop marker with a circle.
     * @param stop
     */
    public showStop(stop: IPtStop) {
        this.markerFrom = L.circleMarker( {lat: stop.lat, lng: stop.lon}, FROM_TO_LABEL);
        this.highlight = L.layerGroup([this.markerFrom]);
    }

    /**
     * Creates multiple relations highlights.
     * @param filteredRelationsForStop
     */
    public showRelatedRoutes(filteredRelationsForStop: object[]): void {
        if (filteredRelationsForStop) {
            this.storageService.stopsForRoute = [];
            for (let rel of filteredRelationsForStop) {
                this.showRoutes(rel);
            }
            if (this.highlight) {
                this.highlight.addTo(this.map);
            }
        }
    }

    /**
     * Builds multiple relations highlights.
     * @param rel
     * @returns {boolean}
     */
    public showRoutes(rel: any): boolean {
        let latlngs = Array();
        this.storageService.stopsForRoute = [];
        for (let member of rel.members) {
            if (member.type === "node" && ["stop", "stop_entry_only"].indexOf(member.role) > -1) {
                this.storageService.stopsForRoute.push(member.ref);
                let latlng: LatLngExpression = this.findCoordinates(member.ref);
                if (latlng) latlngs.push(latlng);
            }
        }
        if (latlngs.length > 0) {
            HIGHLIGHT_FILL.color = rel.tags.colour || rel.tags.color || "#" + (Math.floor(Math.random() * 0xffffff) | 0x0f0f0f).toString(16);
            this.highlightFill = L.polyline(latlngs, HIGHLIGHT_FILL).bindTooltip(rel.tags.name);
            if (this.highlight) {
                this.highlight.addLayer(L.layerGroup([this.highlightFill]));
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
     * Builds and creates relation highlight.
     * @param rel
     * @returns {boolean}
     */
    public showRoute(rel: any): boolean {
        let latlngs = Array();
        for (let member of rel.members) {
            if (member.type === "node" && ["stop", "stop_entry_only", "stop_exit_only"]
                    .indexOf(member.role) > -1) {
                this.storageService.stopsForRoute.push(member.ref);
                let latlng: LatLngExpression = this.findCoordinates(member.ref);
                if (latlng) latlngs.push(latlng);
            }
            else if (member.type === "node" && ["platform", "platform_entry_only", "platform_exit_only"]
                    .indexOf(member.role) > -1) {
                this.storageService.platformsForRoute.push(member.ref);
            }
            else if (member.type === "way") {
                this.storageService.waysForRoute.push(member.ref);
            }
        }

        if (latlngs.length > 0) {
            this.highlightStroke = L.polyline(latlngs, HIGHLIGHT_STROKE).bindTooltip(rel.tags.name);
            this.highlightFill = L.polyline(latlngs, HIGHLIGHT_FILL).bindTooltip(rel.tags.name);
            this.highlight = L.layerGroup([this.highlightStroke, this.highlightFill])
                .addTo(this.map);
            return true;
        }
        else {
            alert("Problem occurred while drawing line (it has zero length - no added stops?)." +
                "\n\n" + JSON.stringify(rel));
            return false;
        }
    }

    /**
     * Verifies if highlight is still active.
     * @returns {any}
     */
    public highlightIsActive(): boolean {
        return this.highlightFill || this.highlightStroke || this.markerFrom;
    }

    public drawTooltipFromTo(rel): void {
        let latlngFrom: LatLngExpression = this.findCoordinates(
            this.storageService.stopsForRoute[0]);
        let latlngTo: LatLngExpression = this.findCoordinates(
            this.storageService.stopsForRoute[this.storageService.stopsForRoute.length - 1]);

        let from = rel.tags.from || "#FROM";
        let to = rel.tags.to || "#TO";
        let route = rel.tags.route || "#ROUTE";
        let ref = rel.tags.ref || "#REF";

        this.markerFrom = L.circleMarker( latlngFrom, FROM_TO_LABEL)
            .bindTooltip("From: " + from + " (" + route + " " + ref + ")", {
                permanent: true, className: "from-to-label", offset: [0, 0]});
        this.markerTo = L.circleMarker( latlngTo, FROM_TO_LABEL)
            .bindTooltip("To: " + to + " (" + route + " " + ref + ")", {
                permanent: true, className: "from-to-label", offset: [0, 0]});
        if (this.highlight) {
            this.highlight.addLayer(L.layerGroup([this.markerFrom, this.markerTo]));
        } else {
            this.highlight = L.layerGroup([this.markerFrom, this.markerTo]);
        }
    }
}
