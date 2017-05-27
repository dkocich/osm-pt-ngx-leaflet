import {Injectable} from "@angular/core";
import {Headers, RequestOptions} from "@angular/http";
import {MapService} from "./map.service";

@Injectable()
export class OverpassService {

    constructor(private mapService: MapService) { }

    public requestOverpassData(requestBody: string): void {
        this.mapService.clearLayer();
        requestBody = this.replaceBboxString(requestBody);
        let options = this.setRequestOptions();
        this.mapService.renderData(requestBody, options);
    }

    private replaceBboxString(requestBody) {
        let b = this.mapService.map.getBounds();
        let s = b.getSouth().toString();
        let w = b.getWest().toString();
        let n = b.getNorth().toString();
        let e = b.getEast().toString();
        return requestBody.replace(new RegExp("{{bbox}}", "g"), [s, w, n, e].join(", "));
    }

    private setRequestOptions() {
        let headers = new Headers();
        headers.append("Content-Type", "application/X-www-form-urlencoded");
        let options = new RequestOptions({headers: headers});
        return options;
    }
}
