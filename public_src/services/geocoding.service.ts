import {Injectable} from "@angular/core";
import {Http, Response} from "@angular/http";
import {Location} from "../core/location.class";

import "rxjs/add/operator/map";
import "rxjs/add/operator/mergeMap";

@Injectable()
export class GeocodingService {
    public http: Http;

    constructor(http: Http) {
        this.http = http;
    }

    public geocode(address: string): any {
        return this.http
            .get("https://maps.googleapis.com/maps/api/geocode/json?address=" + encodeURIComponent(address))
            .map((res) => res.json())
            .map((result) => {
                if (result.status !== "OK") { throw new Error("unable to geocode address"); }

                const location = new Location();
                location.address = result.results[0].formatted_address;
                location.latitude = result.results[0].geometry.location.lat;
                location.longitude = result.results[0].geometry.location.lng;

                const viewPort = result.results[0].geometry.viewport;
                location.viewBounds = L.latLngBounds(
                  {
                    lat: viewPort.southwest.lat,
                    lng: viewPort.southwest.lng},
                  {
                    lat: viewPort.northeast.lat,
                    lng: viewPort.northeast.lng
                  });

                return location;
            });
    }

    public getCurrentLocation(): any {
        return this.http
            .get("https://ipv4.myexternalip.com/json")
            .map((res) => res.json().ip)
            .flatMap((ip) => this.http.get("https://freegeoip.net/json/" + ip))
            .map((res: Response) => res.json())
            .map((result) => {
                const location = new Location();

                location.address = result.city + ", " + result.region_code + " " + result.zip_code + ", " + result.country_code;
                location.latitude = result.latitude;
                location.longitude = result.longitude;

                return location;
            });
    }
}
