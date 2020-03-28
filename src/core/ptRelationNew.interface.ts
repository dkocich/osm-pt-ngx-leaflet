import { IOsmElement } from './osmElement.interface';
import { EnumWheelchair, TStrPtv2, TStrRelation, TStrRoute } from './other';
import { IPtMember } from './ptMember';

export interface IPtRelationNew extends IOsmElement {
  type: TStrRelation;
  members: IPtMember[];
  tags: {
    type: TStrRoute,
    route: string,
    ref: string,
    network: string,
    operator: string,
    name: string,
    from: string,
    to: string,
    wheelchair: EnumWheelchair,
    colour: string,
    'public_transport:version': TStrPtv2,
  };
}
