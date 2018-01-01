import { Injectable } from "@angular/core";
import { ConfigService } from "./config.service";

@Injectable()
export class AuthService {
  private osmAuth: any = require("osm-auth");
  public oauth: any = this.osmAuth({
    oauth_consumer_key: ConfigService.apiConsumerKey,
    oauth_secret: ConfigService.apiConsumerSecret,
    singlepage: false,
    url: ConfigService.baseOsmUrl
  });

  constructor() {
    //
  }
}
