import { IOsmElement } from './osmElement.interface';

export interface IPtWay extends IOsmElement {
  nodes: Array<number>[];
}
