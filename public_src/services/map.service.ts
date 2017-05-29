import {Injectable} from "@angular/core";
import {Http} from "@angular/http";
import {Map} from "leaflet";


@Injectable()
export class MapService {
    public map: Map;
    public baseMaps: any;
    private ptLayer: any;
    private osmtogeojson: any = require("osmtogeojson");

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
