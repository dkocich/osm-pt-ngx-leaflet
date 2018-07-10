import { Injectable } from '@angular/core';

const p = require('../../package.json');

@Injectable()
export class ConfService {
  public static readonly overpassUrl           = 'https://overpass-api.de/api/interpreter'     ;
  public static readonly baseOsmUrl            = 'https://www.openstreetmap.org'               ;
  public static readonly apiUrl                = 'https://api.openstreetmap.org/api/0.6'       ;
  public static readonly apiConsumerSecret     = 'vFXps19FPNhWzzGmWbrhNpMv3RYiI1RFL4oK8NPz'    ;
  public static readonly apiConsumerKey        = 'rPEtcWkEykSKlLccsDS0FaZ9DpGAVPoJfQXWubXl'    ;
  public static readonly apiTestUrl            = 'https://master.apis.dev.openstreetmap.org'   ;
  public static readonly apiTestConsumerKey    = 'myPQ4WewlhUBa5zRs00zwHjWV4nEIsrg6SAF9zat'    ;
  public static readonly apiTestConsumerSecret = '7hAymlaBzyUqGU0ecbdUqXgYt4w59ru3t3JIM9xp'    ;
  public static readonly appName               = `OSMPTeditor v${p['version']}`                ;
  public static readonly hereAppId             = 'wCnyB1NFdlBOGYDZ8wvz'                        ;
  public static readonly hereAppCode           = 'n8AtIn2aXHff9D-Dp_S6rA'                      ;
  public static readonly mapboxToken           =
    'pk.eyJ1IjoiZGtvY2ljaCIsImEiOiJjajR5ZGc5b3kxbnozMnFwZjI4eWo4N2piIn0.EizwwnWouhfRkJznDpEWCw';
  public static readonly minDownloadZoom       = 15;
  public static readonly minDownloadDistance   = 1500;

  public static readonly geocodingApiUrl = 'http://api.ipstack.com/';
  public static readonly geocodingApiKey = '?access_key=2be8b578b9cef6bddf3a706d10c620dd';

  public cfgFilterLines: boolean = true;
}
