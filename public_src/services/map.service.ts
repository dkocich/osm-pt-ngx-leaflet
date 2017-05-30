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

    disableMouseEvent(elementId: string) {
        let element = <HTMLElement>document.getElementById(elementId);

        L.DomEvent.disableClickPropagation(element);
        L.DomEvent.disableScrollPropagation(element);
    }

    clearLayer() {
        if (this.ptLayer) {
            this.map.removeLayer(this.ptLayer);
            delete this.ptLayer;
        }
    }

    styleFeature(feature) {
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

    renderTransformedGeojsonData(transformedGeojson) {
        this.ptLayer = L.geoJSON(transformedGeojson, {
            style: (feature) => {
                return this.styleFeature(feature);
            },
            onEachFeature: (feature, layer) => {
                this.enablePopups(feature, layer);
            }
        });
        this.ptLayer.addTo(this.map);
    }

    enablePopups(feature, layer) {
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

    renderData(requestBody, options) {
        this.http.post("https://overpass-api.de/api/interpreter", requestBody, options)
            .map(res => res.json())
            .subscribe(result => {
                let transformed = this.osmtogeojson(result);
                let myStyle = {
                    "color": "#0000FF",
                    "weight": 5,
                    "opacity": 0.2
                };
                this.ptLayer = L.geoJSON(transformed, {
                    style: function (feature) {
                        return myStyle;
                    }
                });
                this.ptLayer.addTo(this.map);
            });
    }
}
