import { LatLng } from 'leaflet';

export interface IAreaRef {
  areaPseudoId: string;
  overpassBox: string[];
  viewCenter: LatLng;
}
