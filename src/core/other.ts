export type EnumRouteMaster =
  | 'train'
  | 'subway'
  | 'monorail'
  | 'tram'
  | 'bus'
  | 'trolleybus'
  | 'aerialway'
  | 'ferry'
  | '';
export type EnumWheelchair = 'yes' | 'no' | 'limited' | 'designated' | '';

export type expectedKeys =
  | 'ascent'
  | 'bench'
  | 'building'
  | 'bus'
  | 'colour'
  | 'covered'
  | 'descent'
  | 'description'
  | 'distance'
  | 'highway'
  | 'layer'
  | 'level'
  | 'name'
  | 'network'
  | 'operator'
  | 'public_transport'
  | 'public_transport:version'
  | 'railway'
  | 'ref'
  | 'roundtrip'
  | 'route'
  | 'route_ref'
  | 'shelter'
  | 'surface'
  | 'symbol'
  | 'tactile_paving'
  | 'type'
  | 'uic_name'
  | 'uic_ref';

export type expectedValues =
  | 'aerialway'
  | 'backward'
  | 'bus'
  | 'bus_stop'
  | 'coach'
  | 'ferry'
  | 'forward'
  | 'gate'
  | 'limited'
  | 'monorail'
  | 'no'
  | 'platform'
  | 'public_transport'
  | 'route'
  | 'route_master'
  | 'share_taxi'
  | 'station'
  | 'stop'
  | 'stop_area'
  | 'stop_position'
  | 'subway'
  | 'taxi'
  | 'train'
  | 'tram'
  | 'trolleybus'
  | 'yes';

export type EnumElementTypes = TStrNode | TStrWay | TStrRelation;

export type TStrNode = 'node';
export type TStrWay = 'way';
export type TStrRelation = 'relation';
export type TStrRouteMaster = 'route_master';
export type TStrRoute = 'route';
export type TStrPtv2 = '2';
export type TStrStopArea = 'stop_area';
