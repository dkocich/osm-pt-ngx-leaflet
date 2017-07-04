import {Injectable} from "@angular/core";

const p = require("../../package.json");

@Injectable()
export class ConfigService {
    public cfgFilterLines: boolean = true;

    static overpassUrl = "https://overpass-api.de/api/interpreter";
    static baseOsmUrl = "https://www.openstreetmap.org";

    static apiUrl = "https://api.openstreetmap.org/api/0.6/node/2194519037";
    static apiConsumerSecret = "vFXps19FPNhWzzGmWbrhNpMv3RYiI1RFL4oK8NPz";
    static apiConsumerKey = "rPEtcWkEykSKlLccsDS0FaZ9DpGAVPoJfQXWubXl";

    static apiTestUrl = "https://master.apis.dev.openstreetmap.org";
    static apiTestConsumerKey = "myPQ4WewlhUBa5zRs00zwHjWV4nEIsrg6SAF9zat";
    static apiTestConsumerSecret = "7hAymlaBzyUqGU0ecbdUqXgYt4w59ru3t3JIM9xp";

    static appName = p["name"] + " v" + p["version"];
    public minDownloadZoom = 15;
    public minDownloadDistance = 5000;
}
