import {Injectable} from "@angular/core";
import {Http} from "@angular/http";
import {Map} from "leaflet";
import {StorageService} from "./storage.service";
import latLng = L.latLng;
import LatLngExpression = L.LatLngExpression;
import LatLngLiteral = L.LatLngLiteral;
import {ConfigService} from "./config.service";
import {IPtStop} from "../core/ptStop.interface";
import {LoadingService} from "./loading.service";

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

    constructor(private http: Http, private storageService: StorageService,
                private configService: ConfigService, private loadingService: LoadingService) {
        this.baseMaps = {
            Empty: L.tileLayer("", {
                attribution: ""
            }),
            OpenStreetMap: L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
                maxNativeZoom: 19, maxZoom: 22,
                attribution: "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a>, Tiles courtesy of <a href='https://hot.openstreetmap.org/' target='_blank'>Humanitarian OpenStreetMap Team</a>"
            }),
            Esri: L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}", {
                maxNativeZoom: 19, maxZoom: 22,
                attribution: "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community"
            }),
            CartoDB: L.tileLayer("http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png", {
                maxNativeZoom: 19, maxZoom: 22,
                attribution: "&copy; <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> &copy; <a href='https://cartodb.com/attributions'>CartoDB</a>"
            }),
            EsriImagery: L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
                maxNativeZoom: 19, maxZoom: 22,
                attribution: "&copy; ESRI https://leaflet-extras.github.io/leaflet-providers/preview/"
                })
        };
    }

    public disableMouseEvent(elementId: string) {
        let element = <HTMLElement>document.getElementById(elementId);

        L.DomEvent.disableClickPropagation(element);
        L.DomEvent.disableScrollPropagation(element);
    }

    public clearLayer(): void {
        if (this.ptLayer) {
            this.map.removeLayer(this.ptLayer);
            delete this.ptLayer;
        }
    }

    private stylePoint(feature, latlng) {
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
        return L.marker(latlng, {icon: myIcon});
    }

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

    public renderTransformedGeojsonData(transformedGeojson): void {
        this.ptLayer = L.geoJSON(transformedGeojson, {
            filter: (feature) => {
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
                this.enablePopups(feature, layer);
            }
        });
        this.ptLayer.addTo(this.map);
    }

    public enablePopups(feature, layer): void {
        layer.on("click", function (e) {
            let latlng;
            let popup = "";
            let featureTypeId = feature.id.split("/");
            let featureType = featureTypeId[0];
            let featureId = featureTypeId[1];
            if (featureType === "node") {
                popup +=
                    "<h4>Node <a href='//www.openstreetmap.org/node/" +
                    featureId + "' target='_blank'>" + featureId + "</a></h4>";
            } else if (featureType === "way") {
                popup +=
                    "<h4>Way <a href='//www.openstreetmap.org/way/" +
                    featureId + "' target='_blank'>" + featureId + "</a></h4>";
            } else if (featureType === "relation") {
                popup +=
                    "<h4>Relation <a href='//www.openstreetmap.org/relation/" +
                    featureId + "' target='_blank'>" + featureId + "</a></h4>";
            } else {
                popup +=
                    "<h4>" + featureType + " #" + featureId + "</h4>";
            }
            if (feature.properties && Object.keys(feature.properties).length > 0) {
                popup += "<h5>Tags:</h5><ul>";
                for (let k in feature.properties) {
                    let v = feature.properties[k];
                    popup += "<li>" + k + "=" + v + "</li>";
                }
                popup += "</ul>";
            }
            if (featureType === "node") {
                popup += "<h5>Coordinates:</h5>" + feature.geometry["coordinates"][1].toString() +
                    ", " + feature.geometry["coordinates"][0].toString() + " (lat, lon)";
            }
            if (typeof e.target.getLatLng === "function") {
                latlng = e.target.getLatLng(); // node-ish features (circles, markers, icons, placeholders)
            } else {
                latlng = e.latlng; // all other (lines, polygons, multipolygons)
            }
            let p = L.popup({maxHeight: 600, offset: L.point(0, -20)})
                .setLatLng(latlng)
                .setContent(popup);
            layer.unbindPopup().bindPopup(p).openPopup();
        });
    }

    public renderData(requestBody, options) {
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
                        this.enablePopups(feature, layer);
                    }
                });
                this.ptLayer.addTo(this.map);
                this.loadingService.hide();
            });
    }

    public clearHighlight() {
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

    public findCoordinates(refId) {
       for (let stop of this.storageService.listOfStops) {
           if (stop.id === refId) {
               return {lat: stop.lat, lng: stop.lon};
           }
       }
    }

    public showStop(stop: IPtStop) {
        this.markerFrom = L.circleMarker( {lat: stop.lat, lng: stop.lon}, FROM_TO_LABEL);
        this.highlight = L.layerGroup([this.markerFrom]);
    }

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
            HIGHLIGHT_FILL.color = "#" + (Math.floor(Math.random() * 0xffffff) | 0x0f0f0f).toString(16);
            this.highlightFill = L.polyline(latlngs, HIGHLIGHT_FILL);
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

    public showRoute(rel: any) {
        let latlngs = Array();
        for (let member of rel.members) {
            if (member.type === "node" && ["stop", "stop_entry_only"]
                    .indexOf(member.role) > -1) {
                this.storageService.stopsForRoute.push(member.ref);
                let latlng: LatLngExpression = this.findCoordinates(member.ref);
                if (latlng) latlngs.push(latlng);
            }
            else if (member.type === "node" && ["platform", "platform_entry_only"]
                    .indexOf(member.role) > -1) {
                this.storageService.platformsForRoute.push(member.ref);
            }
            else if (member.type === "way") {
                this.storageService.waysForRoute.push(member.ref);
            }
        }

        if (latlngs.length > 0) {
            this.highlightStroke = L.polyline(latlngs, HIGHLIGHT_STROKE);
            this.highlightFill = L.polyline(latlngs, HIGHLIGHT_FILL);
            this.highlight = L.layerGroup([this.highlightStroke, this.highlightFill])
                .addTo(this.map);
            return true;
        }
        else {
            alert("Problem occurred while drawing line (zero length)." +
                "\n\n" + JSON.stringify(rel));
            return false;
        }
    }

    public highlightIsActive() {
        return this.highlightFill || this.highlightStroke || this.markerFrom;
    }

    public drawTooltipFromTo(rel) {
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
