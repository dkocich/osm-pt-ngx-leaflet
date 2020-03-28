import { LatLngBounds } from 'leaflet';
import { ILatLng } from './latLng.interface';

export class Location implements ILatLng {
  latitude: number;
  longitude: number;
  address: string;
  viewBounds: LatLngBounds;
}
