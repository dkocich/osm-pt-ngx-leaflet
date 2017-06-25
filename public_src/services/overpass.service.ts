import {Injectable} from "@angular/core";
import {Headers, Http, RequestOptions} from "@angular/http";
import {MapService} from "./map.service";
import {ProcessingService} from "./processing.service";
import {StorageService} from "./storage.service";
import {LoadingService} from "./loading.service";
import {ConfigService} from "./config.service";

const CONTINUOUS_QUERY: string = `
[out:json][timeout:25][bbox:{{bbox}}];
(
  node["route"="bus"];
  way["route"="bus"];
  relation["route"="bus"];
  node["route"="train"];
  way["route"="train"];
  relation["route"="train"];
  node["route"="tram"];
  way["route"="tram"];
  relation["route"="tram"];
  node["public_transport"];
  way["public_transport"];
  relation["public_transport"];
);
(._;>;);
out meta;`;

@Injectable()
export class OverpassService {
    constructor(private http: Http, private mapService: MapService,
                private storageService: StorageService,
                private processingService: ProcessingService,
                private loadingService: LoadingService) { }

    public requestNewOverpassData(): void {
        this.loadingService.show();
        let requestBody = this.replaceBboxString(CONTINUOUS_QUERY);
        let options = this.setRequestOptions();
        this.mapService.previousCenter = [this.mapService.map.getCenter().lat, this.mapService.map.getCenter().lng];
        this.http.post("https://overpass-api.de/api/interpreter", requestBody, options)
            .map(res => res.json())
            .subscribe(response => {
                this.processingService.processResponse(response);
            });
    }

    public requestOverpassData(requestBody: string): void {
        this.loadingService.show();
        this.mapService.clearLayer();
        requestBody = this.replaceBboxString(requestBody);
        let options = this.setRequestOptions();
        this.mapService.renderData(requestBody, options);
    }

    private replaceBboxString(requestBody: string): string {
        let b = this.mapService.map.getBounds();
        let s = b.getSouth().toString();
        let w = b.getWest().toString();
        let n = b.getNorth().toString();
        let e = b.getEast().toString();
        return requestBody.replace(new RegExp("{{bbox}}", "g"), [s, w, n, e].join(", "));
    }

    private setRequestOptions(): RequestOptions {
        let headers = new Headers();
        headers.append("Content-Type", "application/X-www-form-urlencoded");
        let options: RequestOptions = new RequestOptions({headers: headers});
        return options;
    }

    /**
     * TODO
     * Put /api/0.6/changeset/create
     */
    private requestChangeSetId(): void {
        let requestBody = "";
        let options = this.setRequestOptions();
        this.http.put(ConfigService.apiTestUrl + "/api/0.6/changeset/create", requestBody, options)
            .subscribe(response => {
                console.log(response);
            });
    }

    /**
     * TODO
     * Update: PUT /api/0.6/changeset/#id
     */
    private updateChangeSet(): void {
        let requestBody = "";
        let options = this.setRequestOptions();
        this.http.put(ConfigService.apiTestUrl + "/api/0.6/changeset/create", requestBody, options)
            .subscribe(response => {
                console.log(response);
            });
    }

    /**
     * TODO
     * Close: PUT /api/0.6/changeset/#id/close
     */
    private closeChangeSet(id: number): void {
        let requestBody = "";
        let options = this.setRequestOptions();
        this.http.put(ConfigService.apiTestUrl + "/api/0.6/changeset/" + id + "close", requestBody, options)
            .subscribe(response => {
                console.log(response);
            });
    }
}
