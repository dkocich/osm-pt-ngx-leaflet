import {Injectable} from "@angular/core";

const p = require("../../package.json");

@Injectable()
export class ConfigService {
    public cfgFilterLines: boolean = true;
    static overpassUrl = "https://overpass-api.de/api/interpreter";
    static apiTestUrl = "http://api06.dev.openstreetmap.org";
    static appName = p["name"] + "v" + p["version"];
}
