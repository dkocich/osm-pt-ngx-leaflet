import { Injectable } from '@angular/core';
import { ConfService } from './conf.service';

@Injectable()
export class AuthService {
  private osmAuth: any = require('osm-auth');
  public oauth: any = this.osmAuth({
    oauth_consumer_key: ConfService.apiConsumerKey,
    oauth_secret: ConfService.apiConsumerSecret,
    singlepage: true,
    url: ConfService.baseOsmUrl,
  });

  constructor() {
    //
  }
}
