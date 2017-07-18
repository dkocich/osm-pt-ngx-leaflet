import {Injectable} from "@angular/core";
import {ConfigService} from "./config.service";

@Injectable()
export class AuthService {
    constructor() {
        //
    }

    private osmAuth: any = require("osm-auth");
    public oauth: any = this.osmAuth({
        url: ConfigService.baseOsmUrl,
        oauth_secret: ConfigService.apiConsumerSecret,
        oauth_consumer_key: ConfigService.apiConsumerKey,
        singlepage: false
    });

}
