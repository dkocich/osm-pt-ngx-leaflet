import { IOsmElement } from './osmElement.interface';
import { IPtMember } from './ptMember';

export interface IPtRelationNew extends IOsmElement {
  type: 'relation';
  members: IPtMember[];
  tags: {
    type:                      'route'                                      ,
    route:                      string                                      ,
    ref:                        string                                      ,
    network:                    string                                      ,
    operator:                   string                                      ,
    name:                       string                                      ,
    from:                       string                                      ,
    to:                         string                                      ,
    wheelchair:                 'yes' | 'no' | 'limited' | 'designated' | '',
    colour:                     string                                      ,
    'public_transport:version': '2'                                         ,
  };
}
