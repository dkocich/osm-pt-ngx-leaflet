import { Injectable } from '@angular/core';
import { IOSMAuthOptions } from '../core/osmAuthOptions.interface';
import { ConfService } from './conf.service';

@Injectable()
export class AuthService {
  private osmAuth = require('osm-auth');
  private osmAuthOptions: IOSMAuthOptions = {
    oauth_consumer_key: ConfService.apiConsumerKey,
    oauth_secret: ConfService.apiConsumerSecret,
    singlepage: false,
    url: ConfService.baseOsmUrl,
  };
  oauth = this.osmAuth(this.osmAuthOptions);
  constructor() {
    //
  }
}
