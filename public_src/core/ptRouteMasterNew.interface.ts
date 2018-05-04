import { IOsmElement } from './osmElement.interface';
import { IPtMember } from './ptMember';

export interface IPtRouteMasterNew extends IOsmElement {
  type: 'relation';
  members: IPtMember[];
  tags: {
    type: 'route_master',
    route_master: 'train' | 'subway' | 'monorail' | 'tram' | 'bus' | 'trolleybus' | 'aerialway' | 'ferry' | '',
    ref: string,
    network: string,
    operator: string,
    name: string,
    wheelchair: 'yes' | 'no' | 'limited' | 'designated' | '',
    colour: string,
    'public_transport:version': '2',
  };
}
