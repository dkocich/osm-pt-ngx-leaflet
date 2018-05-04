import { IOsmElement } from './osmElement.interface';
import { IPtMember } from './ptMember';
import { IOsmTags } from './osmTags.interface';

/**
 *  {
 *    "type": "relation",
 *    "id": 7157492,
 *    "timestamp": "2017-05-15T22:23:20Z",
 *    "version": 5,
 *    "changeset": 48714598,
 *    "user": "dkocich",
 *    "uid": 1784758,
 *    "members": [
 *      {
 *        "type": "node",
 *        "ref": 2184049214,
 *        "role": "stop"
 *      },
 *      {
 *        "type": "node",
 *        "ref": 2162278060,
 *        "role": "platform"
 *      },
 *      {
 *        "type": "way",
 *        "ref": 387730713,
 *        "role": ""
 *      }
 *    ],
 *    "tags": {
 *      "complete": "no",
 *      "from": "Řepiště, U kříže",
 *      "name": "Bus 11: Řepiště, U kříže -> Místek,Riviéra",
 *      "operator": "ČSAD Frýdek-Místek",
 *      "public_transport:version": "2",
 *      "route": "bus",
 *      "to": "Místek,Riviéra",
 *      "type": "route"
 *    }
 *  }
 */
export interface IPtRelation extends IOsmElement {
  type: 'relation';
  members: IPtMember[];
  tags: IOsmTags;
}
