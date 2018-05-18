export interface IResponseIp {
  ip: string;
}

/**
 * TODO
 * deprecation message in the response:
 *
 * "This API endpoint is deprecated and will stop working on July 1st, 2018.
 * For more information please visit: https://github.com/apilayer/freegeoip#readme"
 */
export interface IResponseFreeGeoIp {
  city:                    string;
  country_code:            string;
  country_name:            string;
  ip:                      string;
  latitude:                number;
  longitude:               number;
  metro_code:              number;
  region_code:             string;
  region_name:             string;
  time_zone:               string;
  zip_code:                string;
  __deprecation_message__: string;
}

export interface IResponseGeocodeGMaps {
  error_message?: string                 ;
  results:        [ IGeocodeResultGMaps ];
  status:         string                 ; // "OVER_QUERY_LIMIT" / "OK" / ...
}

export interface IGeocodeResultGMaps {
  address_components: IAddressComponentGMaps[];
  formatted_address:  string                  ;
  geometry:           IGeometryGMaps          ;
  place_id:           string                  ;
  types:              string[]                ; // "locality", "political",...
}
export interface IAddressComponentGMaps {
  long_name:  string  ;
  short_name: string  ;
  types:      string[]; // "locality", "political",...
}

export interface IGeometryGMaps {
  bounds:        IViewportGMaps;
  location:      ILatLngGMaps  ;
  location_type: string        ; // "APPROXIMATE",...
  viewport:      IViewportGMaps;
}

export interface IViewportGMaps {
  southwest: ILatLngGMaps;
  northeast: ILatLngGMaps;
}

export interface ILatLngGMaps {
  lat: number;
  lng: number;
}
