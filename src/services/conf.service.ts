import { Injectable } from '@angular/core';

const p = require('../../package.json');

@Injectable()
export class ConfService {
  static readonly overpassUrl = 'https://overpass-api.de/api/interpreter';
  static readonly baseOsmUrl = 'https://www.openstreetmap.org';
  static readonly apiUrl = 'https://api.openstreetmap.org/api/0.6';
  static readonly apiConsumerSecret =
    'vFXps19FPNhWzzGmWbrhNpMv3RYiI1RFL4oK8NPz';
  static readonly apiConsumerKey = 'rPEtcWkEykSKlLccsDS0FaZ9DpGAVPoJfQXWubXl';
  static readonly apiTestUrl = 'https://master.apis.dev.openstreetmap.org';
  static readonly apiTestConsumerKey =
    'myPQ4WewlhUBa5zRs00zwHjWV4nEIsrg6SAF9zat';
  static readonly apiTestConsumerSecret =
    '7hAymlaBzyUqGU0ecbdUqXgYt4w59ru3t3JIM9xp';
  static readonly appName = `OSMPTeditor v${p['version']}`;
  static readonly hereAppId = 'wCnyB1NFdlBOGYDZ8wvz';
  static readonly hereAppCode = 'n8AtIn2aXHff9D-Dp_S6rA';
  static readonly mapboxToken =
    'pk.eyJ1IjoiZGtvY2ljaCIsImEiOiJjajR5ZGc5b3kxbnozMnFwZjI4eWo4N2piIn0.EizwwnWouhfRkJznDpEWCw';
  static readonly minDownloadZoom = 15;
  static readonly minDownloadZoomForErrors = 13;
  static readonly minDownloadZoomForRouteWizard = 8;
  static readonly minDownloadZoomForRouteMasterWizard = 8;
  static readonly minDownloadDistance = 1500;

  static readonly geocodingApiUrl = 'http://api.ipstack.com/';
  static readonly geocodingApiKey =
    '?access_key=2be8b578b9cef6bddf3a706d10c620dd';

  cfgFilterLines = true;
}
