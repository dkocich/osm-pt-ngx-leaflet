import { LatLngBounds } from "leaflet";
import { ILatLng } from "./latLng.interface";

export class Location implements ILatLng {
  public latitude: number;
  public longitude: number;
  public address: string;
  public viewBounds: LatLngBounds;
}
