import { HttpHeaders } from '@angular/common/http';
import * as L from 'leaflet';

export class Utils {
  constructor() {
    //
  }

  static readonly DEFAULT_ICON = L.icon({
    iconUrl: '',
    shadowAnchor: [22, 94],
    shadowSize: [24, 24],
    shadowUrl: '',
  });
  static readonly HIGHLIGHT_FILL = {
    color: '#ffff00',
    opacity: 0.6,
    weight: 6,
  };
  static readonly HIGHLIGHT_STROKE = {
    color: '#FF0000',
    opacity: 0.6,
    weight: 12,
  };
  static readonly FROM_TO_LABEL = {
    color: '#00FFFF',
    opacity: 0.6,
  };
  static readonly REL_BUS_STYLE = {
    color: '#0000FF',
    opacity: 0.3,
    weight: 6,
  };
  static readonly REL_TRAIN_STYLE = {
    color: '#000000',
    opacity: 0.3,
    weight: 6,
  };
  static readonly REL_TRAM_STYLE = {
    color: '#FF0000',
    opacity: 0.3,
    weight: 6,
  };
  static readonly OTHER_STYLE = {
    color: '#00FF00',
    opacity: 0.3,
    weight: 6,
  };
  static readonly CONTINUOUS_QUERY: string = `
    [out:json][timeout:25][bbox:{{bbox}}];
    (
      node["route"="train"];
      node["route"="subway"];
      node["route"="monorail"];
      node["route"="tram"];
      node["route"="bus"];
      node["route"="trolleybus"];
      node["route"="aerialway"];
      node["route"="ferry"];
      node["public_transport"];
    );
    (._;>;);
    out meta;`;
  static HTTP_HEADERS: HttpHeaders = new HttpHeaders({
    'Content-Type': 'application/X-www-form-urlencoded',
  });

  static isProductionDeployment(): boolean {
    return (
      ['osm-pt.herokuapp.com', 'osm-pt-dev.herokuapp.com'].indexOf(
        window.location.hostname
      ) > -1
    );
  }
}
