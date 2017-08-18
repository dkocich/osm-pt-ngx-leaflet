import { Injectable } from "@angular/core";

const p = require("../../package.json");

@Injectable()
export class ConfigService {
    static overpassUrl = "https://overpass-api.de/api/interpreter";
    static baseOsmUrl = "https://www.openstreetmap.org";
    static apiUrl = "https://api.openstreetmap.org/api/0.6";
    static apiConsumerSecret = "vFXps19FPNhWzzGmWbrhNpMv3RYiI1RFL4oK8NPz";
    static apiConsumerKey = "rPEtcWkEykSKlLccsDS0FaZ9DpGAVPoJfQXWubXl";
    static apiTestUrl = "https://master.apis.dev.openstreetmap.org";
    static apiTestConsumerKey = "myPQ4WewlhUBa5zRs00zwHjWV4nEIsrg6SAF9zat";
    static apiTestConsumerSecret = "7hAymlaBzyUqGU0ecbdUqXgYt4w59ru3t3JIM9xp";
    static appName = "OSMPTeditor" + " v" + p["version"];

    static hereAppId = "wCnyB1NFdlBOGYDZ8wvz";
    static hereAppCode = "n8AtIn2aXHff9D-Dp_S6rA";
    static mapboxToken = "pk.eyJ1IjoiZGtvY2ljaCIsImEiOiJjajR5ZGc5b3kxbnozMnFwZjI4eWo4N2piIn0.EizwwnWouhfRkJznDpEWCw";

    static bingKey = "As5ICxO1G_6q6G0eCS-rSO_GqX33zkjJFiqfaVFosmt8FCgaabs7bCt7xrhTxxEj";

    public cfgFilterLines: boolean = true;
    public minDownloadZoom = 15;
    public minDownloadDistance = 1500;
}
