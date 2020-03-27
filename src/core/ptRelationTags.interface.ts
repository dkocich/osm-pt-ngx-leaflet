/**
 * "from": "Řepiště, U kříže",
 * "name": " Bus 11: Řepiště, U kříže -> Místek,Riviéra",
 * "operator": "ČSAD Frýdek-Místek",
 * "public_transport:version": "2",
 * "route": "bus",
 * "to": "Místek,Riviéra",
 * "type": "route"
 */

export interface IPtRelationTags {
  colour?: string;
  from?: string;
  to?: string;
  name?: string;
  'public_transport:version'?: string;
  type?: string;
  route?: string;
  route_ref?: string;
  operator?: string;
  ref?: string;
}
