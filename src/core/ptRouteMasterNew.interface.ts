import { IOsmElement } from './osmElement.interface';
import {
  EnumRouteMaster,
  EnumWheelchair,
  TStrRelation,
  TStrRouteMaster,
} from './other';
import { IPtMember } from './ptMember';

export interface IPtRouteMasterNew extends IOsmElement {
  type: TStrRelation;
  members: IPtMember[];
  tags: {
    type?: TStrRouteMaster;
    route_master?: EnumRouteMaster;
    ref?: string;
    network?: string;
    operator?: string;
    name?: string;
    wheelchair?: EnumWheelchair;
    colour?: string;
    'public_transport:version'?: '2';
  };
}
