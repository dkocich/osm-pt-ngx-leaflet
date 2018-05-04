import { IOsmElement } from './osmElement.interface';

/**
 * {
 *    "type": "node",
 *    "id": 447767772,
 *    "lat": 49.6769377,
 *    "lon": 18.3665044,
 *    "timestamp": "2017-04-20T01:22:48Z",
 *    "version": 3,
 *    "changeset": 47956115,
 *    "user": "dkocich",
 *    "uid": 1784758,
 *    "tags": {
 *      "bench": "yes",
 *      "bus": "yes",
 *      "name": "Frýdek-Místek, Frýdek, U Gustlíčka",
 *      "public_transport": "platform",
 *      "shelter": "yes"
 *    }
 *  }
 */
export interface IPtStop extends IOsmElement {
  lat: number;
  lon: number;
}
