/**
 * "from": "Řepiště, U kříže",
 * "name": " Bus 11: Řepiště, U kříže -> Místek,Riviéra",
 * "operator": "ČSAD Frýdek-Místek",
 * "public_transport:version": "2",
 * "route": "bus",
 * "to": "Místek,Riviéra",
 * "type": "route"
 */

export interface IPtRelationBusTags {
    from: string;
    to: string;
    name: string;
    "public_transport:version": string;
    type: string;
    route: string;
    operator: string;
    ref: string;
}
