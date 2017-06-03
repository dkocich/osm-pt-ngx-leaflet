import {Injectable} from "@angular/core";
import {Http} from "@angular/http";
import {Map} from "leaflet";

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

    constructor(private http: Http) {
        this.baseMaps = {
            Empty: L.tileLayer("", {
                attribution: ""
            }),
            OpenStreetMap: L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
                attribution: "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a>, Tiles courtesy of <a href='https://hot.openstreetmap.org/' target='_blank'>Humanitarian OpenStreetMap Team</a>"
            }),
            Esri: L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}", {
                attribution: "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community"
            }),
            CartoDB: L.tileLayer("http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png", {
                attribution: "&copy; <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> &copy; <a href='https://cartodb.com/attributions'>CartoDB</a>"
            }),
            EsriImagery: L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
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
            layer.bindPopup(p).openPopup();
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
            });
    }
}
