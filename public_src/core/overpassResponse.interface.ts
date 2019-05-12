import { IOsmElement } from './osmElement.interface';

export interface IOverpassResponse extends Response {
  elements: [IOsmElement];
  generator: string; // "Overpass API 0.7.55 579b1eec"
  osm3s: {
    copyright: string, // "The data included in this document is from www.openstreetmap.org.
                       // The data is made available under ODbL."
    timestamp_osm_base: string, // date string - "2018-05-02T19:51:03Z"
  };
  version: number; // 0.6
}
