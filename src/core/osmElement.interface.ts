import { IPtTags } from './ptTags.class';

export interface IOsmElement {
  type: string;
  id: number;
  timestamp: string;
  version: number;
  changeset: number;
  user: string;
  uid: number;
  tags: IPtTags;
}
