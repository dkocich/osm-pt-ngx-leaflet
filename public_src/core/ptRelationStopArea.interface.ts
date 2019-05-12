/**
 * "name": "Frýdek-Místek, Frýdek, Revoluční",
 * "public_transport": "stop_area",
 * "type": "public_transport"
 */
import { TStrStopArea } from './other';

export interface IPtRelationStopArea {
  name?: string;
  public_transport: TStrStopArea;
  type?: string;
}
