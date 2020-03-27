import { IOsmElement } from './osmElement.interface';
import { IPtMember } from './ptMember';
import { EnumRouteMaster, EnumWheelchair, TStrRelation, TStrRouteMaster } from './other';

export interface IPtRouteMasterNew extends IOsmElement {
  type: TStrRelation;
  members: IPtMember[];
  tags: {
    type?: TStrRouteMaster,
    route_master?: EnumRouteMaster,
    ref?: string,
    network?: string,
    operator?: string,
    name?: string,
    wheelchair?: EnumWheelchair,
    colour?: string,
    'public_transport:version'?: '2',
  };
}
