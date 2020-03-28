import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';
import {
  IResponseFreeGeoIp,
  IResponseGeocodeGMaps,
  IResponseIp,
} from '../core/responses.interface';
import { Location } from '../core/location.class';
import { MapService } from './map.service';
import { ConfService } from './conf.service';

@Injectable()
export class GeocodeService {
  httpClient: HttpClient;

  constructor(
    httpClient: HttpClient,
    private mapSrv: MapService,
  ) {
    this.httpClient = httpClient;
  }

  geocode(address: string): any {
    return this.httpClient.get<IResponseGeocodeGMaps>(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}`)
      .subscribe(
        (response: IResponseGeocodeGMaps) => {
          if (response.status !== 'OK') {
            throw new Error(`${response.status}; ${response.error_message}`);
          }
          const location = new Location();
          location.address = response.results[0].formatted_address;
          location.latitude = response.results[0].geometry.location.lat;
          location.longitude = response.results[0].geometry.location.lng;
          const viewPort = response.results[0].geometry.viewport;
          location.viewBounds = L.latLngBounds(
            {
              lat: viewPort.southwest.lat,
              lng: viewPort.southwest.lng,
            },
            {
              lat: viewPort.northeast.lat,
              lng: viewPort.northeast.lng,
            },
          );
          this.mapSrv.map.fitBounds(location.viewBounds, {});
        },
        (err) => {
          throw new Error(JSON.stringify(err));
        },
      );
  }

  getCurrentLocation(): any {
    return this.httpClient.get<IResponseIp>('https://ipv4.myexternalip.com/json')
      .subscribe(
        (resp1: IResponseIp) => {
          this.httpClient.get<IResponseFreeGeoIp>(`${ConfService.geocodingApiUrl}${resp1.ip}${ConfService.geocodingApiKey}`)
            .subscribe(
              (resp2: IResponseFreeGeoIp) => {
                const location = new Location();
                location.address =
                  `${resp2.city}, ${resp2.region_code} ${resp2.zip_code}, ${resp2.country_code}`;
                location.latitude = resp2.latitude;
                location.longitude = resp2.longitude;
                this.mapSrv.map.panTo([location.latitude, location.longitude]);
              },
              (err) => {
                throw new Error(JSON.stringify(err));
              },
            );
        },
        (err) => {
          throw new Error(JSON.stringify(err));
        },
      );
  }
}
