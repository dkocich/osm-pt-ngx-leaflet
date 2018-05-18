export interface IPtTags {
  aerialway?: string,
  ascent?: string;
  bench?: string;
  building?: string;
  bus?: string;
  colour?: string;
  covered?: string;
  descent?: string;
  description?: string;
  distance?: string;
  highway?: string;
  layer?: string;
  level?: string;
  name?: string;
  network?: string;
  operator?: string;
  public_transport?: string;
  'public_transport:version'?: string;
  railway?: string;
  ref?: string;
  roundtrip?: string;
  ferry?: string;
  trolleybus?: string;
  tram?: string;
  monorail?: string;
  subway?: string;
  train?: string;
  route?: string;
  route_ref?: string;
  shelter?: string;
  surface?: string;
  symbol?: string;
  tactile_paving?: string;
  type?: string;
  uic_name?: string;
  uic_ref?: number;
}

export class PtTags {
  public static readonly expectedKeys = [
    'ascent',
    'bench',
    'building',
    'bus',
    'colour',
    'covered',
    'descent',
    'description',
    'distance',
    'highway',
    'layer',
    'level',
    'name',
    'network',
    'operator',
    'public_transport',
    'public_transport:version',
    'railway',
    'ref',
    'roundtrip',
    'route',
    'route_ref',
    'shelter',
    'surface',
    'symbol',
    'tactile_paving',
    'type',
    'uic_name',
    'uic_ref',
  ];
  public static readonly expectedValues = [
    'aerialway',
    'backward',
    'bus',
    'bus_stop',
    'coach',
    'ferry',
    'forward',
    'gate',
    'limited',
    'monorail',
    'no',
    'platform',
    'public_transport',
    'route',
    'route_master',
    'share_taxi',
    'station',
    'stop',
    'stop_area',
    'stop_position',
    'subway',
    'taxi',
    'train',
    'tram',
    'trolleybus',
    'yes',
  ];
}
