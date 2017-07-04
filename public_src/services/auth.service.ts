import {Injectable} from "@angular/core";
import {ConfigService} from "./config.service";

@Injectable()
export class AuthService {
    constructor() { }

    private osmAuth: any = require("osm-auth");
    public oauth: any = this.osmAuth({
        url: ConfigService.apiTestUrl,
        oauth_secret: ConfigService.apiTestConsumerSecret,
        oauth_consumer_key: ConfigService.apiTestConsumerKey,
        singlepage: false
    });

}
